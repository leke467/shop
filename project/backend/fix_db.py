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
            # Check if actual application tables exist
            cursor.execute("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts_user');")
            user_table_exists = cursor.fetchone()[0]

            if not user_table_exists:
                # Fresh setup: drop orphan django_migrations so migrate runs fresh
                print("==> Initial setup: dropping orphan django_migrations table for clean migration...")
                cursor.execute("DROP TABLE IF EXISTS django_migrations CASCADE;")
            else:
                # Existing database: ensure unique index and insert auth/contenttypes dependencies
                cursor.execute("""
                    CREATE UNIQUE INDEX IF NOT EXISTS django_migrations_app_name_uniq 
                    ON django_migrations (app, name);
                """)
                cursor.execute("SELECT EXISTS (SELECT 1 FROM django_migrations WHERE app = 'auth' AND name = '0012_alter_user_first_name_max_length');")
                auth_exists = cursor.fetchone()[0]
                if not auth_exists:
                    print("==> Reconciling missing auth dependencies in django_migrations...")
                    cursor.execute("INSERT INTO django_migrations (app, name, applied) VALUES ('contenttypes', '0001_initial', CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING;")
                    cursor.execute("INSERT INTO django_migrations (app, name, applied) VALUES ('contenttypes', '0002_touch_inconsistent_content_types', CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING;")
                    auth_migs = [
                        '0001_initial', '0002_alter_permission_name_max_length', '0003_alter_user_email_max_length',
                        '0004_alter_user_username_opts', '0005_alter_user_last_login_null', '0006_require_contenttypes_0002',
                        '0007_alter_validators_add_error_messages', '0008_alter_user_username_max_length',
                        '0009_alter_user_last_name_max_length', '0010_alter_group_name_max_length',
                        '0011_update_proxy_permissions', '0012_alter_user_first_name_max_length'
                    ]
                    for am in auth_migs:
                        cursor.execute(f"INSERT INTO django_migrations (app, name, applied) VALUES ('auth', '{am}', CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING;")

        print("==> PostgreSQL migration check completed successfully.")
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"==> Database repair note: {e}")

if __name__ == "__main__":
    fix_migration_history()
