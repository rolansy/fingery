from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from .api import router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"[REQUEST] {request.method} {request.url}")
    if request.method in ("POST", "PUT", "PATCH"):
        try:
            body = await request.body()
            print(f"[REQUEST BODY] {body.decode(errors='replace')}")
        except Exception as e:
            print(f"[REQUEST BODY ERROR] {e}")
    response = await call_next(request)
    print(f"[RESPONSE] {response.status_code}")
    return response 