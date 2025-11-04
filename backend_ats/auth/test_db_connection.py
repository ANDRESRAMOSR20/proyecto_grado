import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Add parent directory to path to import from bd module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
load_dotenv()

def test_db_connection():
    """Test the database connection using the DATABASE_URL from .env"""
    # Get database URL from environment
    DATABASE_URL = os.getenv("DATABASE_URL")
    
    if not DATABASE_URL:
        print("❌ DATABASE_URL environment variable is not set!")
        print("Please ensure you have a .env file with DATABASE_URL defined.")
        return False
    
    print(f"Attempting to connect to database using environment variable")
    
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Database connection successful!")
            return True
    
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False

if __name__ == "__main__":
    test_db_connection() 