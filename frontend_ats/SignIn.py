import os
import sys
import json
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import jwt
from datetime import datetime, timedelta
from typing import Optional

# Add parent directory to path to import from auth module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import User model from create_db
from auth.create_db import User, Login, engine

# Load environment variables
load_dotenv()

# Get JWT secret key from environment or use default
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "default_secret_key")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Create session
Session = sessionmaker(bind=engine)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def authenticate_user(email: str, password: str):
    """Authenticate a user by email and password"""
    session = Session()
    
    try:
        # Find user by email
        user = session.query(User).filter(User.email == email).first()
        
        if not user:
            return {"success": False, "message": "Invalid email or password"}
        
        # Get the login entry for the user
        login = session.query(Login).filter(Login.user_id == user.id).first()
        
        if not login:
            return {"success": False, "message": "Login information not found"}
        
        # Check password
        if not login.check_password(password):
            return {"success": False, "message": "Invalid email or password"}
        
        # Update last login timestamp
        setattr(login, "last_login", datetime.utcnow())
        session.commit()
        
        # Generate access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email, "name": user.name, "is_admin": user.is_admin},
            expires_delta=access_token_expires
        )
        
        return {
            "success": True,
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "is_admin": user.is_admin
            }
        }
    
    finally:
        session.close()

def handle_signin_request(request_data):
    """Handle sign-in request from frontend"""
    try:
        data = json.loads(request_data)
        email = data.get("email")
        password = data.get("password")
        
        if not email or not password:
            return json.dumps({
                "success": False,
                "message": "Email and password are required"
            })
        
        result = authenticate_user(email, password)
        return json.dumps(result)
    
    except Exception as e:
        return json.dumps({
            "success": False,
            "message": f"Authentication error: {str(e)}"
        })

# For testing purposes
if __name__ == "__main__":
    # Example usage
    test_request = json.dumps({
        "email": "admin@example.com",
        "password": "admin123"
    })
    
    response = handle_signin_request(test_request)
    print(response) 