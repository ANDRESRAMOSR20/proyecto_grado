from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os
import sys

load_dotenv()

# Get database URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("Error: DATABASE_URL environment variable is not set!")
    sys.exit(1)

print(f"Using database URL from environment variable")

# Create database engine
engine = create_engine(
    DATABASE_URL,
    echo=False,  # Set to True to see SQL queries
)

SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

def test_connection():
    """Test database connection"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Database connection successful!")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

# Test connection immediately
if __name__ == "__main__":
    test_connection() 