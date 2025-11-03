"""
SmolLM initialization module for INNOVA+ backend
"""
import logging
import os
from pathlib import Path

from app.core.config import settings

logger = logging.getLogger(__name__)

_DEFAULT_RELATIVE_MODEL = "models/smollm-360m-instruct"
_PERSISTENT_DEFAULT = "/opt/innovaplus/models/smollm-360m-instruct"


def _resolve_model_path() -> Path | None:
    """
    Work out the best model path to use. We try, in order:
      1. `SMOLLM_MODEL_PATH` env value (absolute or relative to backend root)
      2. `/opt/innovaplus/models/smollm-360m-instruct` (persistent volume)
    When we fall back, we also update the environment + settings and attempt
    to recreate a symlink at the legacy location so future deployments keep working.
    """
    backend_root = Path(__file__).resolve().parents[2]
    env_value = os.getenv("SMOLLM_MODEL_PATH", _DEFAULT_RELATIVE_MODEL)
    candidates: list[Path] = []

    initial_path = Path(env_value)
    candidates.append(initial_path if initial_path.is_absolute() else (backend_root / initial_path))

    fallback_env = os.getenv("SMOLLM_MODEL_FALLBACK_PATH")
    if fallback_env:
        candidates.append(Path(fallback_env))

    candidates.append(Path(_PERSISTENT_DEFAULT))

    for candidate in candidates:
        candidate = candidate.expanduser().resolve()
        if candidate.exists():
            if str(candidate) != env_value:
                os.environ["SMOLLM_MODEL_PATH"] = str(candidate)
                settings.SMOLLM_MODEL_PATH = str(candidate)
                _ensure_legacy_symlink(candidate, backend_root / _DEFAULT_RELATIVE_MODEL)
                if str(candidate) != env_value:
                    logger.info(
                        "SmolLM model path resolved to %s (previous value: %s)",
                        candidate,
                        env_value,
                    )
            return candidate

    logger.warning(
        "SmolLM model path not found. Tried: %s",
        ", ".join(str(c) for c in candidates),
    )
    return None


def _ensure_legacy_symlink(target: Path, legacy_path: Path) -> None:
    """
    Ensure that `legacy_path` (within the repo tree) points to the persistent
    target. Deploy scripts sometimes wipe the repository; recreating the symlink
    on startup keeps backwards-compatibility without duplicating 600MB of data.
    """
    try:
        if legacy_path.exists() or legacy_path.is_symlink():
            if legacy_path.resolve() == target.resolve():
                return
            if legacy_path.is_dir() and not legacy_path.is_symlink():
                # If the path is an actual directory (perhaps re-created), remove it
                for root, dirs, files in os.walk(legacy_path, topdown=False):
                    for file in files:
                        Path(root, file).unlink(missing_ok=True)
                    for directory in dirs:
                        Path(root, directory).rmdir()
                legacy_path.rmdir()
            else:
                legacy_path.unlink(missing_ok=True)

        legacy_path.parent.mkdir(parents=True, exist_ok=True)
        legacy_path.symlink_to(target, target_is_directory=True)
    except Exception as exc:
        logger.warning("Failed to maintain SmolLM legacy symlink %s -> %s: %s", legacy_path, target, exc)


def initialize_smollm_on_startup():
    """Initialize SmolLM model on application startup"""
    try:
        enable_smollm = os.getenv("ENABLE_SMOLLM", "false").lower() == "true"
        if not enable_smollm:
            logger.info("SmolLM is disabled via ENABLE_SMOLLM environment variable")
            return

        model_path = _resolve_model_path()
        if model_path is None:
            return

        from app.core.smollm import initialize_smollm

        initialize_smollm()
        logger.info("SmolLM initialized successfully from %s", model_path)

    except Exception as exc:
        logger.error("Failed to initialize SmolLM on startup: %s", exc)


def get_smollm_status() -> dict:
    """Get SmolLM status information"""
    try:
        from app.core.smollm import get_smollm_model

        model = get_smollm_model()
        return {
            "enabled": True,
            "model_loaded": model.model is not None,
            "model_info": model.get_model_info(),
        }
    except Exception as exc:
        return {
            "enabled": False,
            "error": str(exc),
        }
