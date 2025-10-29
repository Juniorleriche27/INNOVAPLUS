"""
SmolLM integration for INNOVA+ backend.
Permet de charger un modèle local (ex. smollm-360m-instruct) sans contact réseau.
"""
from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Optional, List, Dict, Any

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

from app.core.config import settings

logger = logging.getLogger(__name__)
_BACKEND_ROOT = Path(__file__).resolve().parents[2]
_DEFAULT_MODEL_DIR = "smollm-1.7b-instruct"

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
        if candidate.is_dir():
            return candidate

    raise FileNotFoundError(
        f"Impossible de trouver le dossier SmolLM parmi: {', '.join(str(p) for p in candidates)}"
    )


class SmolLMModel:
    """SmolLM-1.7B-Instruct model wrapper for INNOVA+"""
    
    def __init__(self, model_path: Optional[str] = None):
        resolved = _sanitize_path(model_path or settings.SMOLLM_MODEL_PATH)
        self.model_path = resolved
        self.model = None
        self.tokenizer = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self._load_model()

    def _load_model(self):
        """Load the SmolLM model and tokenizer"""
        try:
            logger.info("Chargement du modèle SmolLM depuis %s", self.model_path)
            logger.info("Périphérique utilisé: %s", self.device)
            
            # Load tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(
                str(self.model_path),
                trust_remote_code=True,
                local_files_only=True,
            )
            
            # Load model
            self.model = AutoModelForCausalLM.from_pretrained(
                str(self.model_path),
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                device_map="auto" if self.device == "cuda" else None,
                trust_remote_code=True,
                local_files_only=True,
            )
            
            if self.device == "cpu":
                self.model = self.model.to(self.device)
            
            logger.info("SmolLM model loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load SmolLM model: {e}")
            raise
    
    def generate(
        self,
        prompt: str,
        max_length: int = 512,
        temperature: float = 0.7,
        top_p: float = 0.9,
        do_sample: bool = True,
        num_return_sequences: int = 1,
        stop_tokens: Optional[List[str]] = None
    ) -> List[str]:
        """
        Generate text using SmolLM model
        
        Args:
            prompt: Input prompt
            max_length: Maximum length of generated text
            temperature: Sampling temperature
            top_p: Top-p sampling parameter
            do_sample: Whether to use sampling
            num_return_sequences: Number of sequences to generate
            stop_tokens: List of tokens to stop generation
            
        Returns:
            List of generated text sequences
        """
        try:
            # Tokenize input
            inputs = self.tokenizer(
                prompt,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=2048
            ).to(self.device)
            
            # Generate
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_length=max_length,
                    temperature=temperature,
                    top_p=top_p,
                    do_sample=do_sample,
                    num_return_sequences=num_return_sequences,
                    pad_token_id=self.tokenizer.eos_token_id,
                    eos_token_id=self.tokenizer.eos_token_id,
                    repetition_penalty=1.1
                )
            
            # Decode outputs
            generated_texts = []
            for output in outputs:
                # Remove input tokens from output
                input_length = inputs['input_ids'].shape[1]
                generated_tokens = output[input_length:]
                
                # Decode
                text = self.tokenizer.decode(
                    generated_tokens,
                    skip_special_tokens=True
                )
                
                # Apply stop tokens if provided
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
        temperature: float = 0.7
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
        try:
            # Format messages for SmolLM
            prompt = self._format_chat_messages(messages)
            
            # Generate response
            responses = self.generate(
                prompt=prompt,
                max_length=max_tokens,
                temperature=temperature,
                num_return_sequences=1,
                stop_tokens=["<|im_end|>"]
            )

            return responses[0] if responses else "Je suis désolé, je n'ai pas de réponse pour l'instant."
            
        except Exception as e:
            logger.error(f"Error in chat completion: {e}")
            return f"Error: {str(e)}"
    
    def _format_chat_messages(self, messages: List[Dict[str, str]]) -> str:
        """Format chat messages for SmolLM"""
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
        return {
            "model_name": "SmolLM-1.7B-Instruct",
            "model_path": str(self.model_path),
            "device": self.device,
            "parameters": self.model.num_parameters() if self.model else 0,
            "dtype": str(self.model.dtype) if self.model else "unknown"
        }

# Global model instance
_smollm_model: Optional[SmolLMModel] = None

def get_smollm_model() -> SmolLMModel:
    """Get or create SmolLM model instance"""
    global _smollm_model
    
    if _smollm_model is None:
        _smollm_model = SmolLMModel(settings.SMOLLM_MODEL_PATH)
    
    return _smollm_model

def initialize_smollm():
    """Initialize SmolLM model"""
    try:
        get_smollm_model()
        logger.info("SmolLM model initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize SmolLM model: {e}")
        raise
