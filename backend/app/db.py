import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_DB_URL = os.getenv("SUPABASE_DB_URL")
engine = create_engine(SUPABASE_DB_URL)

def run_sql_query(sql: str) -> pd.DataFrame:
    if not sql.strip().lower().startswith("select"):
        raise ValueError("Only SELECT statements are allowed.")
    return pd.read_sql(sql, engine)

def get_schema_ddl() -> str:
    # Fetch tables
    tables = pd.read_sql("""
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public'
    """, engine)

    # Fetch foreign keys
    fk_query = """
        SELECT
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM
            information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
    """
    foreign_keys = pd.read_sql(fk_query, engine)

    ddl = ""

    for table in tables['table_name']:
        columns = pd.read_sql(f"""
            SELECT column_name, data_type FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = '{table}'
        """, engine)

        ddl += f"CREATE TABLE {table} (\n"
        ddl += ",\n".join(f"  {row['column_name']} {row['data_type']}" for _, row in columns.iterrows())

        # Add foreign key constraints if they exist for this table
        fks = foreign_keys[foreign_keys["table_name"] == table]
        for _, fk in fks.iterrows():
            ddl += f",\n  FOREIGN KEY ({fk['column_name']}) REFERENCES {fk['foreign_table_name']}({fk['foreign_column_name']})"

        ddl += "\n);\n\n"

    return ddl.strip()
