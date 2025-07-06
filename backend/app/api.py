from fastapi import APIRouter, Request, HTTPException, Depends
from .firebase_admin import verify_firebase_token, save_user_stats, get_user_stats
import random
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import math

router = APIRouter(prefix="/api")

WORDS = [
    "apple", "banana", "cat", "dog", "elephant", "fish", "grape", "hat", "ice", "jungle",
    "kite", "lemon", "monkey", "notebook", "orange", "piano", "queen", "rabbit", "sun", "tree",
    "umbrella", "violin", "wolf", "xylophone", "yarn", "zebra", "computer", "keyboard", "mouse", "screen",
    "internet", "website", "programming", "algorithm", "database", "network", "security", "encryption", "protocol", "server",
    "client", "framework", "library", "function", "variable", "constant", "parameter", "argument", "statement", "expression",
    "technology", "innovation", "development", "software", "hardware", "interface", "application", "system", "platform", "service"
]

class TypingTestData(BaseModel):
    words: List[str]
    input_text: str
    start_time: int
    end_time: int
    time_data: List[Dict[str, Any]] = []
    char_data: List[Dict[str, Any]] = []

class AnalyticsResult(BaseModel):
    wpm: float
    raw_wpm: float
    accuracy: float
    correct_chars: int
    incorrect_chars: int
    total_chars: int
    time_taken: float
    word_count: int
    char_count: int
    errors: int
    consistency: float
    burst: float
    time_data: List[Dict[str, Any]]
    wpm_data: List[Dict[str, Any]]
    accuracy_data: List[Dict[str, Any]]
    char_analysis: Dict[str, Any]

class TypingSession(BaseModel):
    session_id: str
    user_id: str
    test_data: TypingTestData
    analytics: AnalyticsResult
    timestamp: str

def calculate_typing_analytics(words: List[str], input_text: str, start_time: int, end_time: int, time_data: Optional[List[Dict]] = None) -> AnalyticsResult:
    """
    Calculate comprehensive typing analytics including WPM, accuracy, consistency, and detailed character analysis.
    """
    if time_data is None:
        time_data = []
    target_text = " ".join(words)
    time_taken = (end_time - start_time) / 1000.0  # in seconds
    time_taken_minutes = time_taken / 60.0
    
    # Character-level analysis
    correct_chars = 0
    incorrect_chars = 0
    char_errors = []
    char_timings = []
    
    min_length = min(len(input_text), len(target_text))
    
    for i in range(min_length):
        is_correct = target_text[i] == input_text[i]
        if is_correct:
            correct_chars += 1
        else:
            incorrect_chars += 1
            char_errors.append({
                "position": i,
                "expected": target_text[i],
                "typed": input_text[i]
            })
    
    # Add extra characters as errors
    if len(input_text) > len(target_text):
        incorrect_chars += len(input_text) - len(target_text)
    
    total_chars = correct_chars + incorrect_chars
    accuracy = (correct_chars / total_chars * 100) if total_chars > 0 else 0
    
    # WPM calculations
    word_count = len(words)
    wpm = (word_count / time_taken_minutes) if time_taken_minutes > 0 else 0
    raw_wpm = ((len(input_text) / 5) / time_taken_minutes) if time_taken_minutes > 0 else 0
    
    # Consistency calculation (standard deviation of WPM over time)
    consistency = calculate_consistency(time_data) if time_data else 100.0
    
    # Burst calculation (highest WPM in any 10-second window)
    burst = calculate_burst_wpm(time_data) if time_data else wpm
    
    # Generate time series data
    wpm_data = generate_wpm_timeline(time_data, word_count) if time_data else []
    accuracy_data = generate_accuracy_timeline(time_data) if time_data else []
    
    # Character analysis
    char_analysis = {
        "total_typed": len(input_text),
        "total_target": len(target_text),
        "errors": char_errors,
        "error_rate": (incorrect_chars / total_chars * 100) if total_chars > 0 else 0,
        "completion_percentage": (len(input_text) / len(target_text) * 100) if len(target_text) > 0 else 0
    }
    
    return AnalyticsResult(
        wpm=round(wpm, 2),
        raw_wpm=round(raw_wpm, 2),
        accuracy=round(accuracy, 2),
        correct_chars=correct_chars,
        incorrect_chars=incorrect_chars,
        total_chars=total_chars,
        time_taken=round(time_taken, 2),
        word_count=word_count,
        char_count=len(input_text),
        errors=len(char_errors),
        consistency=round(consistency, 2),
        burst=round(burst, 2),
        time_data=time_data or [],
        wpm_data=wpm_data,
        accuracy_data=accuracy_data,
        char_analysis=char_analysis
    )

def calculate_consistency(time_data: List[Dict]) -> float:
    """Calculate typing consistency based on WPM variation over time."""
    if not time_data or len(time_data) < 2:
        return 100.0
    
    wpm_values = [point.get("wpm", 0) for point in time_data if point.get("wpm", 0) > 0]
    if len(wpm_values) < 2:
        return 100.0
    
    mean_wpm = sum(wpm_values) / len(wpm_values)
    variance = sum((wpm - mean_wpm) ** 2 for wpm in wpm_values) / len(wpm_values)
    std_dev = math.sqrt(variance)
    
    # Consistency score (higher is better)
    consistency = max(0, 100 - (std_dev / mean_wpm * 100)) if mean_wpm > 0 else 100.0
    return consistency

def calculate_burst_wpm(time_data: List[Dict]) -> float:
    """Calculate burst WPM (highest WPM in any 10-second window)."""
    if not time_data:
        return 0.0
    
    max_burst = 0.0
    window_size = 10  # 10 seconds
    
    for i, point in enumerate(time_data):
        window_start = point.get("time", 0)
        window_end = window_start + window_size
        
        # Find all points within this window
        window_wpm = [p.get("wpm", 0) for p in time_data 
                     if window_start <= p.get("time", 0) <= window_end]
        
        if window_wpm:
            avg_wpm = sum(window_wpm) / len(window_wpm)
            max_burst = max(max_burst, avg_wpm)
    
    return max_burst

def generate_wpm_timeline(time_data: List[Dict], word_count: int) -> List[Dict]:
    """Generate WPM timeline data for charting."""
    timeline = []
    for point in time_data:
        time_elapsed = point.get("time", 0)
        if time_elapsed > 0:
            wpm = (word_count / (time_elapsed / 60)) if time_elapsed > 0 else 0
            timeline.append({
                "time": round(time_elapsed, 2),
                "wpm": round(wpm, 2)
            })
    return timeline

def generate_accuracy_timeline(time_data: List[Dict]) -> List[Dict]:
    """Generate accuracy timeline data for charting."""
    timeline = []
    for point in time_data:
        accuracy = point.get("accuracy", 0)
        timeline.append({
            "time": round(point.get("time", 0), 2),
            "accuracy": round(accuracy, 2)
        })
    return timeline

@router.get("/words")
def get_words(count: int = 25):
    """Get random words for typing test."""
    return {"words": random.sample(WORDS, min(count, len(WORDS)))}

@router.post("/analyze-typing")
async def analyze_typing_test(request: Request, user=Depends(verify_firebase_token)):
    """
    Analyze a completed typing test and return comprehensive analytics.
    This is the main endpoint for processing typing test results.
    """
    try:
        data = await request.json()
        print("[DEBUG] Received /analyze-typing data:", data)
        # Extract data from request
        words = data.get("words", [])
        input_text = data.get("input_text", "")
        start_time = data.get("start_time", 0)
        end_time = data.get("end_time", 0)
        time_data = data.get("time_data", [])
        # Validate required data
        if not words or not input_text or not start_time or not end_time:
            print(f"[ERROR] Missing required data: words={words}, input_text={input_text}, start_time={start_time}, end_time={end_time}")
            raise HTTPException(status_code=400, detail="Missing required data")
        # Calculate comprehensive analytics
        analytics = calculate_typing_analytics(words, input_text, start_time, end_time, time_data)
        
        # Try to save to Firestore, but don't fail if it's not available
        try:
            session_data = {
                "session_id": f"session_{datetime.now().timestamp()}",
                "user_id": user["uid"],
                "test_data": {
                    "words": words,
                    "input_text": input_text,
                    "start_time": start_time,
                    "end_time": end_time,
                    "time_data": time_data
                },
                "analytics": analytics.dict(),
                "timestamp": datetime.now().isoformat()
            }
            save_user_stats(user["uid"], session_data)
            print("[DEBUG] Successfully saved to Firestore")
        except Exception as firestore_error:
            print(f"[WARNING] Failed to save to Firestore: {firestore_error}")
            print("[INFO] Analytics will still be returned to user")
        
        return {
            "status": "success",
            "analytics": analytics.dict(),
            "session_id": f"session_{datetime.now().timestamp()}"
        }
    except Exception as e:
        import traceback
        print("[ERROR] Exception in /analyze-typing:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/real-time-update")
async def real_time_update(request: Request, user=Depends(verify_firebase_token)):
    """
    Handle real-time typing updates for live analytics.
    """
    try:
        data = await request.json()
        
        words = data.get("words", [])
        input_text = data.get("input_text", "")
        start_time = data.get("start_time", 0)
        current_time = data.get("current_time", 0)
        
        if not words or not input_text or not start_time:
            raise HTTPException(status_code=400, detail="Missing required data")
        
        # Calculate current progress analytics
        target_text = " ".join(words)
        time_elapsed = (current_time - start_time) / 1000.0
        
        # Calculate current WPM
        word_count = len(words)
        current_wpm = (word_count / (time_elapsed / 60)) if time_elapsed > 0 else 0
        
        # Calculate current accuracy
        correct_chars = sum(1 for i, char in enumerate(input_text) 
                          if i < len(target_text) and char == target_text[i])
        total_chars = len(input_text)
        current_accuracy = (correct_chars / total_chars * 100) if total_chars > 0 else 0
        
        return {
            "current_wpm": round(current_wpm, 2),
            "current_accuracy": round(current_accuracy, 2),
            "time_elapsed": round(time_elapsed, 2),
            "progress_percentage": round((len(input_text) / len(target_text) * 100), 2) if len(target_text) > 0 else 0
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Real-time update failed: {str(e)}")

@router.get("/user-stats")
def get_user_stats_endpoint(user=Depends(verify_firebase_token)):
    """Get comprehensive user statistics and history."""
    try:
        user_data = get_user_stats(user["uid"])
        
        if not user_data:
            return {
                "total_tests": 0,
                "average_wpm": 0,
                "best_wpm": 0,
                "average_accuracy": 0,
                "total_time": 0,
                "sessions": []
            }
        
        # Process user data to extract statistics
        sessions = user_data.get("sessions", [])
        if isinstance(user_data, dict) and "analytics" in user_data:
            # Single session format
            sessions = [user_data]
        
        if not sessions:
            return {
                "total_tests": 0,
                "average_wpm": 0,
                "best_wpm": 0,
                "average_accuracy": 0,
                "total_time": 0,
                "sessions": []
            }
        
        # Calculate aggregate statistics
        total_tests = len(sessions)
        wpm_values = [s.get("analytics", {}).get("wpm", 0) for s in sessions]
        accuracy_values = [s.get("analytics", {}).get("accuracy", 0) for s in sessions]
        time_values = [s.get("analytics", {}).get("time_taken", 0) for s in sessions]
        
        average_wpm = sum(wpm_values) / len(wpm_values) if wpm_values else 0
        best_wpm = max(wpm_values) if wpm_values else 0
        average_accuracy = sum(accuracy_values) / len(accuracy_values) if accuracy_values else 0
        total_time = sum(time_values) if time_values else 0
        
        return {
            "total_tests": total_tests,
            "average_wpm": round(average_wpm, 2),
            "best_wpm": round(best_wpm, 2),
            "average_accuracy": round(average_accuracy, 2),
            "total_time": round(total_time, 2),
            "sessions": sessions[-10:]  # Last 10 sessions
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user stats: {str(e)}")

@router.get("/leaderboard")
def get_leaderboard():
    """Get global leaderboard (placeholder for future implementation)."""
    return {
        "leaderboard": [
            {"rank": 1, "username": "User1", "wpm": 120, "accuracy": 98.5},
            {"rank": 2, "username": "User2", "wpm": 115, "accuracy": 97.2},
            {"rank": 3, "username": "User3", "wpm": 110, "accuracy": 96.8}
        ]
    }

# Legacy endpoints for backward compatibility
@router.post("/stats")
async def post_stats(request: Request, user=Depends(verify_firebase_token)):
    """Legacy endpoint - redirects to analyze-typing."""
    return await analyze_typing_test(request, user)

@router.get("/stats")
def get_stats(user=Depends(verify_firebase_token)):
    """Legacy endpoint - redirects to user-stats."""
    return get_user_stats_endpoint(user) 