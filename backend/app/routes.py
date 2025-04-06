# routes.py

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any
import re

from app.llm_sql_agent import process_question, generate_sql, extract_entities, fallback_supabase_explorer
from supabase import create_client
import os
from dotenv import load_dotenv

# Load Supabase config
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# === FastAPI Router ===
router = APIRouter()

# === Request Model ===
class QueryRequest(BaseModel):
    question: str

# === /query Endpoint ===
@router.post("/query")
async def handle_query(req: QueryRequest):
    question = req.question
    response = process_question(question)
    sql = response["sql"]

    if response["mode"] == "fallback_supabase_explorer":
        return response

    # Try executing the generated SQL query
    try:
        table_match = re.search(r'from\s+(\w+)', sql.lower())
        table_name = table_match.group(1) if table_match else None

        if table_name:
            result = supabase.table(table_name).select("*").limit(10).execute()
            response["data"] = result.data
        else:
            response["data"] = {"error": "Could not determine table from SQL query."}

    except Exception as e:
        response["error"] = str(e)
        response["fallback"] = fallback_supabase_explorer(question)

    return response
