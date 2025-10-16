"""
SmolLM API routes for INNOVA+ backend
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging

from app.core.smollm import get_smollm_model, SmolLMModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/smollm", tags=["smollm"])

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    max_tokens: Optional[int] = 512
    temperature: Optional[float] = 0.7
    top_p: Optional[float] = 0.9

class ChatResponse(BaseModel):
    response: str
    model_info: Dict[str, Any]

class GenerateRequest(BaseModel):
    prompt: str
    max_length: Optional[int] = 512
    temperature: Optional[float] = 0.7
    top_p: Optional[float] = 0.9
    num_return_sequences: Optional[int] = 1

class GenerateResponse(BaseModel):
    generated_texts: List[str]
    model_info: Dict[str, Any]

class ModelInfoResponse(BaseModel):
    model_info: Dict[str, Any]

@router.post("/chat", response_model=ChatResponse)
async def chat_completion(request: ChatRequest):
    """Chat completion endpoint using SmolLM"""
    try:
        model = get_smollm_model()
        
        # Convert messages to the format expected by the model
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        # Generate response
        response = model.chat_completion(
            messages=messages,
            max_tokens=request.max_tokens,
            temperature=request.temperature
        )
        
        return ChatResponse(
            response=response,
            model_info=model.get_model_info()
        )
        
    except Exception as e:
        logger.error(f"Error in chat completion: {e}")
        raise HTTPException(status_code=500, detail=f"Chat completion failed: {str(e)}")

@router.post("/generate", response_model=GenerateResponse)
async def generate_text(request: GenerateRequest):
    """Text generation endpoint using SmolLM"""
    try:
        model = get_smollm_model()
        
        # Generate text
        generated_texts = model.generate(
            prompt=request.prompt,
            max_length=request.max_length,
            temperature=request.temperature,
            top_p=request.top_p,
            num_return_sequences=request.num_return_sequences
        )
        
        return GenerateResponse(
            generated_texts=generated_texts,
            model_info=model.get_model_info()
        )
        
    except Exception as e:
        logger.error(f"Error in text generation: {e}")
        raise HTTPException(status_code=500, detail=f"Text generation failed: {str(e)}")

@router.get("/info", response_model=ModelInfoResponse)
async def get_model_info():
    """Get SmolLM model information"""
    try:
        model = get_smollm_model()
        return ModelInfoResponse(model_info=model.get_model_info())
        
    except Exception as e:
        logger.error(f"Error getting model info: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get model info: {str(e)}")

@router.post("/health")
async def health_check():
    """Health check for SmolLM service"""
    try:
        model = get_smollm_model()
        info = model.get_model_info()
        return {
            "status": "healthy",
            "model_loaded": model.model is not None,
            "device": info.get("device", "unknown"),
            "parameters": info.get("parameters", 0)
        }
        
    except Exception as e:
        logger.error(f"SmolLM health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }
