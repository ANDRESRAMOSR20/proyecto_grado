import os
import sys
import json
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError
from dotenv import load_dotenv
from datetime import datetime

# Add parent directory to path to import from auth module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import User model from create_db
from auth.create_db import User, Login, engine

# Load environment variables
load_dotenv()

# Create session
Session = sessionmaker(bind=engine)

def register_user(name: str, email: str, password: str, identity_document: str):
    """Register a new user in the database"""
    session = Session()
    
    try:
        # Check if user with email already exists
        existing_user = session.query(User).filter(User.email == email).first()
        if existing_user:
            return {"success": False, "message": "Email already registered"}
        
        # Check if identity document already exists
        existing_id = session.query(User).filter(User.identity_document == identity_document).first()
        if existing_id:
            return {"success": False, "message": "Identity document already registered"}
        
        # Create new user
        new_user = User(
            name=name,
            email=email,
            identity_document=identity_document,
            is_admin=False
        )
        
        # Create login entry for the user
        new_login = Login(user=new_user)
        new_login.set_password(password)
        
        session.add(new_user)
        session.add(new_login)
        session.commit()
        
        return {
            "success": True,
            "message": "User registered successfully",
            "user": {
                "id": new_user.id,
                "name": new_user.name,
                "email": new_user.email
            }
        }
    
    except IntegrityError:
        session.rollback()
        return {"success": False, "message": "Registration failed due to data integrity issues"}
    
    except Exception as e:
        session.rollback()
        return {"success": False, "message": f"Registration error: {str(e)}"}
    
    finally:
        session.close()

def handle_signup_request(request_data):
    """Handle sign-up request from frontend"""
    try:
        data = json.loads(request_data)
        name = data.get("name")
        email = data.get("email")
        password = data.get("password")
        identity_document = data.get("identity_document")
        
        # Validate required fields
        if not all([name, email, password, identity_document]):
            return json.dumps({
                "success": False,
                "message": "All fields are required: name, email, password, identity_document"
            })
        
        result = register_user(name, email, password, identity_document)
        return json.dumps(result)
    
    except Exception as e:
        return json.dumps({
            "success": False,
            "message": f"Registration error: {str(e)}"
        })

# For testing purposes
if __name__ == "__main__":
    # Example usage
    test_request = json.dumps({
        "name": "Test User",
        "email": "test@example.com",
        "password": "password123",
        "identity_document": "ID12345678"
    })
    
    response = handle_signup_request(test_request)
    print(response) 