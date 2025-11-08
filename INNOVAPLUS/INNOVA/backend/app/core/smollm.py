"""
SmolLM integration for INNOVA+ backend.
Permet de charger un modele local (ex. smollm-360m-instruct) sans contact reseau.
"""
from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Optional, List, Dict, Any, Callable

import torch
from peft import PeftModel
from transformers import AutoTokenizer, AutoModelForCausalLM

from app.core.config import settings

logger = logging.getLogger(__name__)
_BACKEND_ROOT = Path(__file__).resolve().parents[2]
_DEFAULT_MODEL_DIR = "models/Qwen2.5-1.5B-Instruct-Q4_K_M.gguf"

SPECIAL_TOKENS: List[str] = [
    "<|system|>",
    "<|user|>",
    "<|assistant|>",
    "<|end|>",
    "<s>",
    "</s>",
    "<|im_start|>",
    "<|im_end|>",
    "<|endoftext|>",
]

def _sanitize_path(raw_path: str | None) -> Path:
    """
    Nettoie et résout le chemin fourni via l'env / config.
    On essaye successivement :
    - chemin tel quel (absolu ou relatif)
    - chemin relatif à la racine backend
    - dossier par défaut du repo
    """
    candidates: List[Path] = []

    if raw_path:
        stripped = raw_path.strip().strip("\"'")
        if stripped:
            expanded = Path(os.path.expandvars(stripped)).expanduser()
            candidates.append(expanded)
            if not expanded.is_absolute():
                candidates.append((_BACKEND_ROOT / expanded).resolve())

    candidates.append((_BACKEND_ROOT / _DEFAULT_MODEL_DIR).resolve())

    for candidate in candidates:
        if candidate.exists():
            return candidate

    raise FileNotFoundError(
        f"Impossible de trouver le dossier SmolLM parmi: {', '.join(str(p) for p in candidates)}"
    )


class SmolLMModel:
    """SmolLM-360M-Instruct model wrapper for INNOVA+"""
    
    def __init__(self, model_path: Optional[str] = None, adapter_path: Optional[str] = None):
        resolved = _sanitize_path(model_path or settings.SMOLLM_MODEL_PATH)
        self.model_path = resolved
        self.adapter_requested = adapter_path or settings.SMOLLM_ADAPTER_PATH
        self.adapter_path: Optional[Path] = None
        self.model: Any = None
        self.tokenizer = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.backend_type = "transformers"
        self._is_gguf = self.model_path.is_file() and self.model_path.suffix == ".gguf"
        self._load_model()

    def _load_model(self):
        """Load the SmolLM model and tokenizer"""
        try:
            if self._is_gguf:
                from llama_cpp import Llama

                n_ctx = int(os.getenv("LLAMA_CTX", "8192"))
                n_threads = int(os.getenv("LLAMA_THREADS", str(min(8, os.cpu_count() or 4))))
                rope_freq_base_env = os.getenv("LLAMA_ROPE_FREQ_BASE")
                rope_freq_base = (
                    float(rope_freq_base_env) if rope_freq_base_env not in (None, "", "0", "0.0") else None
                )

                logger.info("Chargement du modele GGUF via llama_cpp depuis %s", self.model_path)
                logger.info("Configuration llama.cpp: n_ctx=%s, n_threads=%s", n_ctx, n_threads)
                llama_kwargs: Dict[str, Any] = {
                    "model_path": str(self.model_path),
                    "n_ctx": n_ctx,
                    "n_threads": n_threads,
                    "chat_format": "qwen2",
                    "logits_all": False,
                }
                if rope_freq_base is not None:
                    llama_kwargs["rope_freq_base"] = rope_freq_base

                self.model = Llama(**llama_kwargs)
                self.backend_type = "llama_cpp"
                logger.info("Modele GGUF charge avec succes (llama_cpp)")
                return

            logger.info("Chargement du modele SmolLM depuis %s", self.model_path)
            logger.info("Peripherique utilise: %s", self.device)

            self.tokenizer = AutoTokenizer.from_pretrained(
                str(self.model_path),
                trust_remote_code=True,
                local_files_only=True,
            )

            self.model = AutoModelForCausalLM.from_pretrained(
                str(self.model_path),
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                device_map="auto" if self.device == "cuda" else None,
                trust_remote_code=True,
                local_files_only=True,
            )

            if self.device == "cpu":
                self.model = self.model.to(self.device)

            self._maybe_load_adapter()

            logger.info("SmolLM model loaded successfully")

        except Exception as e:
            logger.error(f"Failed to load SmolLM model: {e}")
            raise

    def _maybe_load_adapter(self) -> None:
        """Optionally load a LoRA adapter on top of the base model."""
        if not self.adapter_requested:
            logger.info("Aucun adapter LoRA specifie; utilisation du modele base.")
            return

        try:
            adapter_dir = _sanitize_path(self.adapter_requested)
        except FileNotFoundError:
            logger.warning("Chemin d'adapter introuvable: %s", self.adapter_requested)
            return

        if not any((adapter_dir / fname).exists() for fname in ("adapter_model.bin", "adapter_model.safetensors")):
            logger.warning(
                "Adapter present mais aucun fichier adapter_model.* trouve dans %s; ignore.",
                adapter_dir,
            )
            return

        try:
            self.model = PeftModel.from_pretrained(
                self.model,
                str(adapter_dir),
                is_trainable=False,
            )
            if self.device == "cpu":
                self.model = self.model.to(self.device)
            self.adapter_path = adapter_dir
            logger.info("Adapter LoRA charge depuis %s", adapter_dir)
        except Exception as exc:
            logger.error("Echec du chargement de l'adapter LoRA (%s): %s", adapter_dir, exc)
    
    def generate(
        self,
        prompt: str,
        max_new_tokens: int = 512,
        temperature: float = 0.7,
        top_p: float = 0.9,
        do_sample: bool = True,
        num_return_sequences: int = 1,
        stop_tokens: Optional[List[str]] = None,
        repetition_penalty: float = 1.05,
        ignore_eos: bool = False,
    ) -> List[str]:
        """
        Generate text using SmolLM model
        
        Args:
            prompt: Input prompt
            max_new_tokens: Maximum number of new tokens to generate
            temperature: Sampling temperature
            top_p: Top-p sampling parameter
            do_sample: Whether to use sampling
            num_return_sequences: Number of sequences to generate
            stop_tokens: List of tokens to stop generation
            
        Returns:
            List of generated text sequences
        """
        if self.backend_type == "llama_cpp":
            try:
                completion = self.model.create_completion(
                    prompt=prompt,
                    max_tokens=max_new_tokens,
                    temperature=temperature,
                    top_p=top_p,
                    repeat_penalty=repetition_penalty,
                    stop=stop_tokens or ["</s>", "<|end|>", "###"],
                )
                text = completion["choices"][0]["text"]
                return [self._clean_response(text)]
            except Exception as e:
                logger.error(f"Error generating text (llama_cpp): {e}")
                return [f"Error: {str(e)}"]

        try:
            inputs = self.tokenizer(
                prompt,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=2048
            ).to(self.device)

            with torch.no_grad():
                eos_id = None if ignore_eos else self.tokenizer.eos_token_id
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=max_new_tokens,
                    temperature=temperature,
                    top_p=top_p,
                    do_sample=do_sample,
                    num_return_sequences=num_return_sequences,
                    pad_token_id=self.tokenizer.eos_token_id,
                    eos_token_id=eos_id,
                    repetition_penalty=repetition_penalty,
                )

            generated_texts = []
            for output in outputs:
                input_length = inputs['input_ids'].shape[1]
                generated_tokens = output[input_length:]

                text = self.tokenizer.decode(
                    generated_tokens,
                    skip_special_tokens=True
                )

                if stop_tokens:
                    for stop_token in stop_tokens:
                        if stop_token in text:
                            text = text.split(stop_token)[0]

                generated_texts.append(self._clean_response(text))

            return generated_texts

        except Exception as e:
            logger.error(f"Error generating text: {e}")
            return [f"Error: {str(e)}"]
    
    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = 512,
        temperature: float = 0.7,
        top_p: float = 0.9,
        repeat_penalty: float = 1.05,
        stop_tokens: Optional[List[str]] = None,
        ignore_eos: bool = False,
    ) -> str:
        """
        Chat completion using SmolLM
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            
        Returns:
            Generated response
        """
        if self.backend_type == "llama_cpp":
            try:
                prompt = self._build_llama_prompt(messages)

                completion = self.model.create_completion(
                    prompt=prompt,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    top_p=top_p,
                    repeat_penalty=repeat_penalty,
                    stop=stop_tokens or ["</s>", "<|end|>", "###"],
                )
                return self._clean_response(completion["choices"][0]["text"])
            except Exception as e:
                logger.error(f"Error in chat completion (llama_cpp): {e}")
                return f"Error: {str(e)}"

        try:
            prompt = self._format_chat_messages(messages)

            responses = self.generate(
                prompt=prompt,
                max_new_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
                num_return_sequences=1,
                stop_tokens=stop_tokens or ["<|im_end|>"],
                repetition_penalty=repeat_penalty,
                ignore_eos=ignore_eos,
            )

            return responses[0] if responses else "Je suis desole, je n'ai pas de reponse pour l'instant."

        except Exception as e:
            logger.error(f"Error in chat completion: {e}")
            return f"Error: {str(e)}"
    
    def chat_completion_stream(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int,
        temperature: float,
        top_p: float,
        repeat_penalty: float,
        stop_tokens: Optional[List[str]],
        ignore_eos: bool,
        on_token: Callable[[str], None],
    ) -> str:
        if self.backend_type == "llama_cpp":
            prompt = self._build_llama_prompt(messages)
            pieces: List[str] = []
            try:
                for chunk in self.model.create_completion(
                    prompt=prompt,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    top_p=top_p,
                    repeat_penalty=repeat_penalty,
                    stop=stop_tokens or ["</s>", "<|end|>", "###"],
                    stream=True,
                ):
                    token = chunk["choices"][0]["text"]
                    if not token:
                        continue
                    clean_piece = self._clean_stream_token(token)
                    if not clean_piece:
                        continue
                    pieces.append(clean_piece)
                    on_token(clean_piece)
            except Exception as e:
                logger.error(f"Error in chat completion stream (llama_cpp): {e}")
                raise
            cleaned = self._clean_response("".join(pieces))
            return cleaned

        response = self.chat_completion(
            messages,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=top_p,
            repeat_penalty=repeat_penalty,
            stop_tokens=stop_tokens,
            ignore_eos=ignore_eos,
        )
        on_token(response)
        return response
    
    def _build_llama_prompt(self, messages: List[Dict[str, str]]) -> str:
        prompt_parts = ["<s>"]
        system_buffer: List[str] = []
        for message in messages:
            role = message.get("role", "user")
            content = message.get("content", "").strip()
            if not content:
                continue
            if role == "system":
                system_buffer.append(content)
                continue
            if system_buffer:
                prompt_parts.append("\n".join(system_buffer) + "\n")
                system_buffer.clear()
            if role == "user":
                prompt_parts.append(f"<|user|>\n{content}\n<|end|>\n<|assistant|>\n")
            elif role == "assistant":
                prompt_parts.append(f"{content}\n<|end|>\n")
            else:
                prompt_parts.append(f"<|user|>\n{content}\n<|end|>\n<|assistant|>\n")
        if system_buffer:
            prompt_parts.append("\n".join(system_buffer) + "\n")
        return "".join(prompt_parts)
    
    def _format_chat_messages(self, messages: List[Dict[str, str]]) -> str:
        """Format chat messages for SmolLM"""
        if self.backend_type == "llama_cpp":
            return messages

        chat_messages: List[Dict[str, str]] = []
        for message in messages:
            role = message.get("role", "user").lower()
            if role not in {"system", "user", "assistant"}:
                role = "user"
            chat_messages.append({
                "role": role,
                "content": message.get("content", ""),
            })

        return self.tokenizer.apply_chat_template(
            chat_messages,
            add_generation_prompt=True,
            tokenize=False,
        )

    def _clean_stream_token(self, token: str) -> str:
        """Lightweight cleaning for streaming tokens to avoid prompt artifacts."""
        cleaned = token.replace("\r", "")
        for marker in SPECIAL_TOKENS:
            cleaned = cleaned.replace(marker, "")
        cleaned = cleaned.replace("<user>", "").replace("<assistant>", "")
        return cleaned

    @staticmethod
    def _clean_response(text: str) -> str:
        """Remove training prompt markers and extra whitespace from model output."""
        cleaned = text
        for token in SPECIAL_TOKENS:
            cleaned = cleaned.replace(token, "")
        # remove stray role markers that may appear without pipe characters
        cleaned = cleaned.replace("<user>", "").replace("<assistant>", "")
        # collapse repeated blank lines and trim
        cleaned = "\n".join(line.strip() for line in cleaned.splitlines() if line.strip())
        return cleaned.strip()
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get model information"""
        if self.backend_type == "llama_cpp":
            return {
                "model_name": "Qwen2.5-1.5B-Instruct-Q4_K_M",
                "model_path": str(self.model_path),
                "device": "cpu",
                "parameters": None,
                "dtype": "int4",
                "adapter_path": None,
            }

        return {
            "model_name": "SmolLM-360M-Instruct",
            "model_path": str(self.model_path),
            "device": self.device,
            "parameters": self.model.num_parameters() if self.model else 0,
            "dtype": str(self.model.dtype) if self.model else "unknown",
            "adapter_path": str(self.adapter_path) if self.adapter_path else None,
        }

# Global model instance
_smollm_model: Optional[SmolLMModel] = None

def get_smollm_model() -> SmolLMModel:
    """Get or create SmolLM model instance"""
    global _smollm_model
    
    if _smollm_model is None:
        _smollm_model = SmolLMModel(settings.SMOLLM_MODEL_PATH, settings.SMOLLM_ADAPTER_PATH)
    
    return _smollm_model

def initialize_smollm():
    """Initialize SmolLM model"""
    try:
        get_smollm_model()
        logger.info("SmolLM model initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize SmolLM model: {e}")
        raise
