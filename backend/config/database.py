import os
from pathlib import Path
from dotenv import load_dotenv
import mysql.connector

# Load backend/.env first, with fallback to root .env
CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent
ROOT_DIR = BACKEND_DIR.parent

backend_env = BACKEND_DIR / ".env"
root_env = ROOT_DIR / ".env"

if backend_env.exists():
    load_dotenv(backend_env)
elif root_env.exists():
    load_dotenv(root_env)
else:
    load_dotenv()


def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("MYSQL_HOST", "localhost"),
        user=os.getenv("MYSQL_USER", "root"),
        password=os.getenv("MYSQL_PASSWORD", ""),
        database=os.getenv("MYSQL_DATABASE", "raintoroot"),
        port=int(os.getenv("MYSQL_PORT", 3306))
    )


def test_connection():
    try:
        connection = get_db_connection()
        print("MySQL connected successfully!")
        print(f"Database: {os.getenv('MYSQL_DATABASE', 'raintoroot')}")
        connection.close()
        return True
    except mysql.connector.Error as error:
        print("MySQL connection failed:", error)
        return False
