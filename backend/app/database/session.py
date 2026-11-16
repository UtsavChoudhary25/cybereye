from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def ensure_schema_migrations():
    """
    Automatic lightweight migration to ensure newly introduced columns
    (such as owner_id on investigations and reports) exist in existing persistent databases.
    """
    try:
        inspector = inspect(engine)
        table_names = inspector.get_table_names()

        with engine.begin() as conn:
            if "investigations" in table_names:
                columns = [col["name"] for col in inspector.get_columns("investigations")]
                if "owner_id" not in columns:
                    conn.execute(text("ALTER TABLE investigations ADD COLUMN owner_id INTEGER REFERENCES users(id)"))

            if "reports" in table_names:
                columns = [col["name"] for col in inspector.get_columns("reports")]
                if "owner_id" not in columns:
                    conn.execute(text("ALTER TABLE reports ADD COLUMN owner_id INTEGER REFERENCES users(id)"))
    except Exception as e:
        # Schema migration warning logged safely
        pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
