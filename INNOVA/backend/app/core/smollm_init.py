"""
SmolLM initialization module for KORYXA backend
"""
import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

def initialize_smollm_on_startup():
    """Initialize SmolLM model on application startup"""
    try:
        # Check if SmolLM should be enabled
        enable_smollm = os.getenv("ENABLE_SMOLLM", "false").lower() == "true"
        if not enable_smollm:
            logger.info("SmolLM is disabled via ENABLE_SMOLLM environment variable")
            return
        
        # Import and initialize SmolLM
        from app.core.smollm import initialize_smollm
        initialize_smollm()
        
        logger.info("SmolLM initialized successfully on startup")
        
    except Exception as e:
        logger.error(f"Failed to initialize SmolLM on startup: {e}")
        # Don't raise the exception to avoid breaking the application startup
        pass

def get_smollm_status() -> dict:
    """Get SmolLM status information"""
    try:
        from app.core.smollm import get_smollm_model
        model = get_smollm_model()
        return {
            "enabled": True,
            "model_loaded": model.model is not None,
            "model_info": model.get_model_info()
        }
    except Exception as e:
        return {
            "enabled": False,
            "error": str(e)
        }
