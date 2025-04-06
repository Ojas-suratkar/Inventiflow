import os, re
from dotenv import load_dotenv
from typing import Dict, Any
from supabase import create_client, Client
import google.generativeai as genai

# === Load keys ===
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
gemini_model = genai.GenerativeModel("models/gemini-1.5-pro-latest")

# === DB schema awareness ===
SCHEMA_CONTEXT = """
Use ONLY these tables/fields:

orders(distributor_id, product_id, packaging_id, quantity, price, deadline, status)
war_orders(warehouse_id, product_id, packaging_id, base_price, deadline, total_price, status_updated)
warehouse_inventory(warehouse_id, product_id, packaging_id, quantity)
warehouse(id, name, city, state, service_area, service_pincodes)
warehouse_managers(manager_id, warehouse_id, assigned_at)
products(id, name, category)
packaging(id, product_id, type, price)
profiles(id, name, company_name, company_location)
production_manager_factory(factory_id, prod_manager_id)
factories(id, name, location)
factory_inventory(factory_id, raw_material_id, quantity)
raw_materials(id, name, base_price)
product_recipes(product_id, raw_material_id, packaging_id, quantity_per_unit)
notifications(factory_id, raw_material_id, message, type, read)
"""

# === Entity Extractor ===
def extract_entities(q: str) -> Dict[str, str]:
    entities = {}
    if m := re.search(r"by\s+([A-Z][a-z]+\s+[A-Z][a-z]+)", q): entities['user'] = m.group(1)
    if m := re.search(r"(product|for|of)\s+['\"]?([A-Za-z\s]+?)['\"]?(?:\s|$|\?|\.|,)", q): entities['product'] = m.group(2).strip()
    if m := re.search(r"(pending|approved|rejected|completed|shipped|delivered|cancelled)", q, re.I): entities['status'] = m.group(1).lower()
    if m := re.search(r"(Delhi|Mumbai|Hyderabad|Chennai|Bangalore|Kolkata)", q, re.I): entities['city'] = m.group(1)
    return entities

# === Gemini SQL Generator ===
def generate_sql(question: str) -> str:
    entities = extract_entities(question)
    prompt = f"""
You are a strict SQL generator.

User asked:
"{question}"

Extracted entities: {entities}

Return a clean SQL SELECT query.
Never explain or hallucinate.
If not answerable, return exactly:
SELECT 'Query cannot be answered from current schema.' AS error;

Schema:
{SCHEMA_CONTEXT}
"""
    sql = gemini_model.generate_content(prompt).text.strip()
    return sql

# === Run Supabase Fallback ===
def fallback_supabase_explorer(question: str) -> Dict[str, Any]:
    question = question.lower()
    keywords = set(re.findall(r"\w+", question))

    all_tables = [
        "orders", "war_orders", "warehouse_inventory", "warehouse", "warehouse_managers",
        "products", "packaging", "profiles", "production_manager_factory",
        "factories", "factory_inventory", "raw_materials", "product_recipes", "notifications"
    ]

    matching_tables = []
    for table in all_tables:
        if any(word in table for word in keywords):
            matching_tables.append(table)

    data = {}
    for table in matching_tables[:3]:  # Limit for speed
        try:
            response = supabase.table(table).select("*").limit(10).execute()
            data[table] = response.data
        except Exception as e:
            data[table] = {"error": str(e)}
    return data

# === Final Wrapper ===
def process_question(question: str) -> Dict[str, Any]:
    sql = generate_sql(question)
    if "query cannot be answered" in sql.lower():
        fallback_data = fallback_supabase_explorer(question)
        return {
            "mode": "fallback_supabase_explorer",
            "question": question,
            "entities": extract_entities(question),
            "sql": sql,
            "raw_data": fallback_data
        }
    else:
        return {
            "mode": "llm_sql",
            "question": question,
            "entities": extract_entities(question),
            "sql": sql
        }
