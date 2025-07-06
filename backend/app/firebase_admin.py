import firebase_admin
from firebase_admin import credentials, auth, firestore
from fastapi import HTTPException, Request
import os

# Always use the file path in the container
FIREBASE_CRED_PATH = os.getenv("FIREBASE_ADMIN_CREDENTIAL", "firebase_admin.json")

# Initialize Firebase Admin
if not firebase_admin._apps:
    cred = credentials.Certificate(FIREBASE_CRED_PATH)
    firebase_admin.initialize_app(cred)

db = firestore.client()

def verify_firebase_token(request: Request):
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid auth header")
    id_token = auth_header.split(" ")[1]
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Firebase token")

def save_user_stats(uid, data):
    # Save stats to Firestore under collection 'stats'
    db.collection("stats").document(uid).set(data)

def get_user_stats(uid):
    doc = db.collection("stats").document(uid).get()
    if doc.exists:
        return doc.to_dict()
    return {} 