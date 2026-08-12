import os
import sys

def fix_migration_history():
    db_url = os.environ.get("DATABASE_URL") or os.environ.get("POSTGRES_URL") or os.environ.get("DATABASE_PRIVATE_URL")
    if not db_url:
        pghost = os.environ.get("PGHOST")
        pguser = os.environ.get("PGUSER", "postgres")
        pgpass = os.environ.get("PGPASSWORD", "")
        pgdb = os.environ.get("PGDATABASE")
        pgport = os.environ.get("PGPORT", "5432")
        if pghost and pgdb:
            db_url = f"postgresql://{pguser}:{pgpass}@{pghost}:{pgport}/{pgdb}"

    if not db_url:
        print("No PostgreSQL connection string found. Skipping raw SQL migration fix.")
        return

    try:
        import psycopg2
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        cursor = conn.cursor()

        # Check if django_migrations exists
        cursor.execute("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'django_migrations');")
        migs_exist = cursor.fetchone()[0]

        if migs_exist:
            # Check for inconsistent history state: accounts.0001_initial present without auth.0012
            cursor.execute("SELECT EXISTS (SELECT 1 FROM django_migrations WHERE app = 'accounts' AND name = '0001_initial');")
            acc_exists = cursor.fetchone()[0]

            cursor.execute("SELECT EXISTS (SELECT 1 FROM django_migrations WHERE app = 'auth' AND name = '0012_alter_user_first_name_max_length');")
            auth_exists = cursor.fetchone()[0]

            if acc_exists and not auth_exists:
                print("==> Inconsistent migration history detected! Resetting django_migrations table for clean execution...")
                cursor.execute("DROP TABLE IF EXISTS django_migrations CASCADE;")

        cursor.close()
        conn.close()
    except Exception as e:
        print(f"==> Database reset note: {e}")

if __name__ == "__main__":
    fix_migration_history()
