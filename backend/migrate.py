"""Apply additive farming tables after the existing farmers table is created.

The migration is intentionally limited to CREATE TABLE IF NOT EXISTS statements.
It preserves existing farmers and farm data and never drops or overwrites rows.
"""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.config.database import get_db_connection


def apply_migrations():
    migrations_dir = Path(__file__).parent / "migrations"
    migration_files = sorted(migrations_dir.glob("*.sql"))
    connection = get_db_connection()
    cursor = connection.cursor()
    try:
        for migration_path in migration_files:
            sql = "\n".join(
                line for line in migration_path.read_text(encoding="utf-8").splitlines()
                if not line.strip().startswith("--")
            )
            statements = [statement.strip() for statement in sql.split(";") if statement.strip()]
            for statement in statements:
                cursor.execute(statement)
        connection.commit()
        print("RainToRoot additive migrations applied successfully.")
    finally:
        cursor.close()
        connection.close()


if __name__ == "__main__":
    apply_migrations()
