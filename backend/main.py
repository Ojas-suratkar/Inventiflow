from fastapi import FastAPI
from app.routes import router

app = FastAPI()

# Include your routes
app.include_router(router)
