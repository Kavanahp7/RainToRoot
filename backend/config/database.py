
import os
import mysql.connector
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(ROOT_DIR / ".env")

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("MYSQL_HOST"),
        user=os.getenv("MYSQL_USER"),
        password=os.getenv("MYSQL_PASSWORD"),
        database=os.getenv("MYSQL_DATABASE"),
        port=int(os.getenv("MYSQL_PORT", 3306))
    )

def test_connection():
    try:
        connection = get_db_connection()
        print("MySQL connected successfully!")
        print("Database: raintoroot")
        connection.close()
        return True
    except mysql.connector.Error as error:
        print("MySQL connection failed:", error)
        return False
