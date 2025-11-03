#!/usr/bin/env python3
"""
Lightweight LoRA fine-tuning script for SmolLM-360M-Instruct.

Usage (from backend venv):
    python -m scripts.finetune_smollm_lora \
        --dataset /opt/innovaplus/datasets/ntci_faq.jsonl \
        --base-model /opt/innovaplus/models/smollm-360m-instruct \
        --output-dir /opt/innovaplus/models/smollm-360m-instruct-ntci-lora

The script expects a JSON lines file with at least the fields:
  - "question": str
  - "answer": str

Optional fields (ignored in formatting): tags, id, etc.
"""
from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Any

import torch
from datasets import load_dataset
from peft import LoraConfig, get_peft_model
from torch.utils.data import random_split
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

INSTRUCTION_TEMPLATE = (
    "<<SYS>>{system}<</SYS>>\n"
    "[INST] Question : {question}\n"
    "Donne une réponse synthétique et contextualisée. [/INST]\n"
    "{answer}"
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
    )


def load_and_prepare_dataset(cfg: FineTuneConfig, tokenizer: AutoTokenizer):
    dataset = load_dataset("json", data_files=str(cfg.dataset_path), split="train")

    def _format(example: Dict[str, Any]) -> Dict[str, str]:
        question = example.get("question") or example.get("prompt") or ""
        answer = example.get("answer") or example.get("response") or ""
        text = INSTRUCTION_TEMPLATE.format(system=SYSTEM_PROMPT, question=question.strip(), answer=answer.strip())
        return {"text": text}

    dataset = dataset.map(_format, remove_columns=dataset.column_names)

    def _tokenize(ex):
        return tokenizer(
            ex["text"],
            max_length=cfg.max_seq_length,
            truncation=True,
        )

    tokenized = dataset.map(_tokenize, batched=False, remove_columns=["text"])

    train_size = int(len(tokenized) * cfg.train_frac)
    val_size = len(tokenized) - train_size
    if val_size == 0 and len(tokenized) > 1:
        val_size = 1
        train_size -= 1
    train_dataset, eval_dataset = random_split(tokenized, [train_size, val_size])
    return train_dataset, eval_dataset


def main():
    cfg = parse_args()
    cfg.output_dir.mkdir(parents=True, exist_ok=True)
    set_seed(cfg.seed)

    tokenizer = AutoTokenizer.from_pretrained(cfg.base_model_path, use_fast=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        cfg.base_model_path,
        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
        device_map=None,
    )
    if not torch.cuda.is_available():
        model = model.to("cpu")

    lora_config = LoraConfig(
        r=cfg.lora_r,
        lora_alpha=cfg.lora_alpha,
        lora_dropout=cfg.lora_dropout,
        target_modules=["q_proj", "v_proj", "k_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        task_type="CAUSAL_LM",
    )
    model = get_peft_model(model, lora_config)

    train_dataset, eval_dataset = load_and_prepare_dataset(cfg, tokenizer)
    data_collator = DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False)

    eval_strategy = "steps" if len(eval_dataset) > 0 else "no"
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
        report_to="none",
        no_cuda=not torch.cuda.is_available(),
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset if len(eval_dataset) > 0 else None,
        data_collator=data_collator,
        tokenizer=tokenizer,
    )

    trainer.train()
    trainer.save_model()

    metadata = {
        "base_model": cfg.base_model_path,
        "dataset": str(cfg.dataset_path),
        "num_examples": len(train_dataset) + len(eval_dataset),
        "train_examples": len(train_dataset),
        "eval_examples": len(eval_dataset),
        "epochs": cfg.num_train_epochs,
        "learning_rate": cfg.learning_rate,
        "batch_size": cfg.per_device_batch_size,
        "gradient_accumulation": cfg.gradient_accumulation_steps,
        "lora_r": cfg.lora_r,
        "lora_alpha": cfg.lora_alpha,
        "lora_dropout": cfg.lora_dropout,
    }
    (cfg.output_dir / "finetune_config.json").write_text(json.dumps(metadata, indent=2, ensure_ascii=False))
    print("Fine-tuning complet. Adapter sauvegardé dans", cfg.output_dir)


if __name__ == "__main__":
    main()
