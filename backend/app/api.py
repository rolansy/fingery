from fastapi import APIRouter, Request, HTTPException, Depends
from .firebase_admin import verify_firebase_token, save_user_stats, get_user_stats
import random
from datetime import datetime
from typing import List, Dict, Any

router = APIRouter(prefix="/api")

WORDS = [
    "apple", "banana", "cat", "dog", "elephant", "fish", "grape", "hat", "ice", "jungle",
    "kite", "lemon", "monkey", "notebook", "orange", "piano", "queen", "rabbit", "sun", "tree",
    "umbrella", "violin", "wolf", "xylophone", "yarn", "zebra", "computer", "keyboard", "mouse", "screen",
    "internet", "website", "programming", "algorithm", "database", "network", "security", "encryption", "protocol", "server",
    "client", "framework", "library", "function", "variable", "constant", "parameter", "argument", "statement", "expression"
]

@router.get("/words")
def get_words(count: int = 25):
    return {"words": random.sample(WORDS, min(count, len(WORDS)))}

@router.post("/stats")
async def post_stats(request: Request, user=Depends(verify_firebase_token)):
    data = await request.json()
    # Add timestamp to the stats
    data["timestamp"] = datetime.now().isoformat()
    save_user_stats(user["uid"], data)
    return {"status": "ok"}

@router.post("/detailed-stats")
async def post_detailed_stats(request: Request, user=Depends(verify_firebase_token)):
    data = await request.json()
    # Add timestamp and user info
    data["timestamp"] = datetime.now().isoformat()
    data["userId"] = user["uid"]
    save_user_stats(user["uid"], data)
    return {"status": "ok"}

@router.get("/stats")
def get_stats(user=Depends(verify_firebase_token)):
    stats = get_user_stats(user["uid"])
    return {"stats": stats}

@router.get("/user-history")
def get_user_history(user=Depends(verify_firebase_token)):
    """Get user's typing history for analytics"""
    history = get_user_stats(user["uid"])
    return {"history": history} 