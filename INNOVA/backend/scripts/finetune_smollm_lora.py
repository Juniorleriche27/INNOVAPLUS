#!/usr/bin/env python3
"""
Lightweight LoRA fine-tuning script for the local chat model
(now defaulting to Qwen2.5-0.5B-Instruct).
"""
from __future__ import annotations

import argparse
import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Any

import torch
from datasets import load_dataset
from peft import LoraConfig, PeftModel, get_peft_model
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    DataCollatorForLanguageModeling,
    Trainer,
    TrainingArguments,
    set_seed,
)


SYSTEM_PROMPT = (
    "Tu es Chatlaya, l'assistant économique d'INNOVA+. "
    "Tu expliques clairement les concepts de commerce international, "
    "de nouvelles théories du commerce et de politiques économiques, "
    "en français, avec un ton professionnel et pédagogique."
)


@dataclass
class FineTuneConfig:
    dataset_path: Path
    base_model_path: str
    output_dir: Path
    seed: int = 42
    train_frac: float = 0.9
    num_train_epochs: float = 5.0
    learning_rate: float = 2e-4
    weight_decay: float = 0.0
    per_device_batch_size: int = 4
    gradient_accumulation_steps: int = 4
    max_seq_length: int = 768
    lora_r: int = 16
    lora_alpha: int = 32
    lora_dropout: float = 0.05
    fp16: bool = True
    max_train_samples: int | None = None
    max_eval_samples: int | None = None
    max_steps: int | None = None
    num_threads: int = 1
    chunk_index: int | None = None
    chunk_size: int | None = None


def parse_args() -> FineTuneConfig:
    parser = argparse.ArgumentParser(description="Fine-tune SmolLM with LoRA on a Q/R corpus.")
    parser.add_argument("--dataset", type=Path, required=True, help="Chemin du JSONL Q/R.")
    parser.add_argument("--base-model", type=str, required=True, help="Chemin ou repo du modèle base.")
    parser.add_argument(
        "--output-dir",
        type=Path,
        required=True,
        help="Dossier de sortie pour les poids LoRA (sera créé).",
    )
    parser.add_argument("--epochs", type=float, default=5.0, help="Nombre d'époques (default: 5).")
    parser.add_argument("--learning-rate", type=float, default=2e-4, help="Taux d'apprentissage.")
    parser.add_argument("--batch-size", type=int, default=4, help="Taille de batch par device.")
    parser.add_argument("--gradient-accumulation", type=int, default=4, help="Accumulateur de gradients.")
    parser.add_argument("--max-seq-length", type=int, default=768, help="Longueur max des séquences tokenisées.")
    parser.add_argument("--seed", type=int, default=42, help="Grain pour la reproductibilité.")
    parser.add_argument("--lora-r", type=int, default=16, help="R de la projection LoRA.")
    parser.add_argument("--lora-alpha", type=int, default=32, help="Alpha (échelle) pour LoRA.")
    parser.add_argument("--lora-dropout", type=float, default=0.05, help="Dropout LoRA.")
    parser.add_argument("--max-train-samples", type=int, default=None, help="Limite d'échantillons pour l'entraînement.")
    parser.add_argument("--max-eval-samples", type=int, default=None, help="Limite d'échantillons pour la validation.")
    parser.add_argument("--max-steps", type=int, default=None, help="Arrête l'entraînement après N steps (Trainer max_steps).")
    parser.add_argument("--num-threads", type=int, default=1, help="Fixe torch.set_num_threads pour limiter la charge CPU.")
    parser.add_argument("--chunk-index", type=int, default=None, help="Traitement déterministe d'un bloc (index à partir de 0).")
    parser.add_argument("--chunk-size", type=int, default=None, help="Taille du bloc à traiter quand chunk-index est défini.")

    args = parser.parse_args()
    return FineTuneConfig(
        dataset_path=args.dataset,
        base_model_path=args.base_model,
        output_dir=args.output_dir,
        num_train_epochs=args.epochs,
        learning_rate=args.learning_rate,
        per_device_batch_size=args.batch_size,
        gradient_accumulation_steps=args.gradient_accumulation,
        max_seq_length=args.max_seq_length,
        seed=args.seed,
        lora_r=args.lora_r,
        lora_alpha=args.lora_alpha,
        lora_dropout=args.lora_dropout,
        max_train_samples=args.max_train_samples,
        max_eval_samples=args.max_eval_samples,
        max_steps=args.max_steps,
        num_threads=max(1, args.num_threads),
        chunk_index=args.chunk_index,
        chunk_size=args.chunk_size,
    )


def load_and_prepare_dataset(cfg: FineTuneConfig, tokenizer: AutoTokenizer):
    dataset = load_dataset("json", data_files=str(cfg.dataset_path), split="train")

    def _format(example: Dict[str, Any]) -> Dict[str, str]:
        question = example.get("question") or example.get("prompt") or ""
        answer = example.get("answer") or example.get("response") or ""
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT.strip()},
            {"role": "user", "content": question.strip()},
            {"role": "assistant", "content": answer.strip()},
        ]
        text = tokenizer.apply_chat_template(messages, tokenize=False)
        return {"text": text}

    dataset = dataset.map(_format, remove_columns=dataset.column_names)

    def _tokenize(ex):
        return tokenizer(
            ex["text"],
            max_length=cfg.max_seq_length,
            truncation=True,
        )

    tokenized = dataset.map(_tokenize, batched=False, remove_columns=["text"])

    if cfg.chunk_index is not None and cfg.chunk_size is not None:
        start = cfg.chunk_index * cfg.chunk_size
        end = start + cfg.chunk_size
        start = min(start, len(tokenized))
        end = min(end, len(tokenized))
        train_dataset = tokenized.select(range(start, end))
        eval_dataset = None
    else:
        tokenized = tokenized.shuffle(seed=cfg.seed)

        if len(tokenized) > 1 and cfg.train_frac < 1.0:
            split = tokenized.train_test_split(test_size=1 - cfg.train_frac, seed=cfg.seed)
            train_dataset = split["train"]
            eval_dataset = split["test"]
        else:
            train_dataset = tokenized
            eval_dataset = None

        if cfg.max_train_samples is not None:
            train_dataset = train_dataset.select(range(min(cfg.max_train_samples, len(train_dataset))))
        if eval_dataset is not None and cfg.max_eval_samples is not None and len(eval_dataset) > 0:
            eval_dataset = eval_dataset.select(range(min(cfg.max_eval_samples, len(eval_dataset))))

    return train_dataset, eval_dataset


def main():
    cfg = parse_args()
    print("Lancement fine-tuning...", flush=True)
    cfg.output_dir.mkdir(parents=True, exist_ok=True)
    set_seed(cfg.seed)

    os.environ.setdefault("OMP_NUM_THREADS", str(cfg.num_threads))
    os.environ.setdefault("MKL_NUM_THREADS", str(cfg.num_threads))
    torch.set_num_threads(cfg.num_threads)
    if hasattr(torch, "set_num_interop_threads"):
        torch.set_num_interop_threads(cfg.num_threads)

    os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

    tokenizer = AutoTokenizer.from_pretrained(cfg.base_model_path, use_fast=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    print("Tokenizer chargé.", flush=True)

    model = AutoModelForCausalLM.from_pretrained(
        cfg.base_model_path,
        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
        device_map=None,
        low_cpu_mem_usage=True,
    )
    if not torch.cuda.is_available():
        model = model.to("cpu")
    print("Modèle chargé.", flush=True)

    adapter_exists = any(
        (cfg.output_dir / name).exists() for name in ("adapter_model.bin", "adapter_model.safetensors")
    )
    if adapter_exists:
        model = PeftModel.from_pretrained(model, str(cfg.output_dir), is_trainable=True)
        print("Adapter LoRA existant chargé.", flush=True)
    else:
        lora_config = LoraConfig(
            r=cfg.lora_r,
            lora_alpha=cfg.lora_alpha,
            lora_dropout=cfg.lora_dropout,
            target_modules=["q_proj", "v_proj", "k_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
            task_type="CAUSAL_LM",
        )
        model = get_peft_model(model, lora_config)
        print("Configuration LoRA appliquée.", flush=True)

    train_dataset, eval_dataset = load_and_prepare_dataset(cfg, tokenizer)
    eval_count = len(eval_dataset) if eval_dataset is not None else 0
    print(f"Dataset préparé : train={len(train_dataset)} exemples, eval={eval_count}.", flush=True)
    data_collator = DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False)

    has_eval = eval_dataset is not None and len(eval_dataset) > 0
    eval_strategy = "steps" if has_eval else "no"
    training_args = TrainingArguments(
        output_dir=str(cfg.output_dir),
        num_train_epochs=cfg.num_train_epochs,
        per_device_train_batch_size=cfg.per_device_batch_size,
        per_device_eval_batch_size=cfg.per_device_batch_size,
        gradient_accumulation_steps=cfg.gradient_accumulation_steps,
        learning_rate=cfg.learning_rate,
        weight_decay=cfg.weight_decay,
        warmup_ratio=0.05,
        logging_steps=10,
        eval_strategy=eval_strategy,
        eval_steps=50,
        save_strategy="epoch",
        save_total_limit=2,
        bf16=torch.cuda.is_available() and torch.cuda.get_device_capability(0)[0] >= 8,
        fp16=torch.cuda.is_available(),
        no_cuda=not torch.cuda.is_available(),
        report_to="none",
        max_steps=cfg.max_steps if cfg.max_steps is not None else -1,
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset if has_eval else None,
        data_collator=data_collator,
        tokenizer=tokenizer,
    )

    trainer.train()
    trainer.save_model()

    metadata = {
        "base_model": cfg.base_model_path,
        "dataset": str(cfg.dataset_path),
        "num_examples": len(train_dataset) + (len(eval_dataset) if has_eval else 0),
        "train_examples": len(train_dataset),
        "eval_examples": len(eval_dataset) if has_eval else 0,
        "epochs": cfg.num_train_epochs,
        "learning_rate": cfg.learning_rate,
        "batch_size": cfg.per_device_batch_size,
        "gradient_accumulation": cfg.gradient_accumulation_steps,
        "lora_r": cfg.lora_r,
        "lora_alpha": cfg.lora_alpha,
        "lora_dropout": cfg.lora_dropout,
        "max_train_samples": cfg.max_train_samples,
        "max_eval_samples": cfg.max_eval_samples,
        "max_steps": cfg.max_steps,
        "chunk_index": cfg.chunk_index,
        "chunk_size": cfg.chunk_size,
    }
    (cfg.output_dir / "finetune_config.json").write_text(json.dumps(metadata, indent=2, ensure_ascii=False))
    print("Fine-tuning complet. Adapter sauvegardé dans", cfg.output_dir)


if __name__ == "__main__":
    main()
