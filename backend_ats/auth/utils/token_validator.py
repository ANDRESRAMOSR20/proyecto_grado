import os
import sys
import jwt
from datetime import datetime
from dotenv import load_dotenv

# Add parent directory to path to import from auth module
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Load environment variables
load_dotenv()

# Get JWT secret key from environment or use default
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "default_secret_key")

def decode_token(token):
    """Decode and validate a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        
        # Check if token has expired
        if "exp" in payload and datetime.utcnow().timestamp() > payload["exp"]:
            return {"valid": False, "message": "Token has expired"}
        
        return {"valid": True, "payload": payload}
    
    except jwt.ExpiredSignatureError:
        return {"valid": False, "message": "Token has expired"}
    
    except jwt.InvalidTokenError:
        return {"valid": False, "message": "Invalid token"}
    
    except Exception as e:
        return {"valid": False, "message": f"Token validation error: {str(e)}"}

def get_user_from_token(token):
    """Extract user information from token"""
    result = decode_token(token)
    
    if not result["valid"]:
        return None
    
    payload = result["payload"]
    
    # Extract user information from payload
    user_info = {
        "email": payload.get("sub"),
        "name": payload.get("name"),
        "is_admin": payload.get("is_admin", False)
    }
    
    return user_info

def validate_auth_header(auth_header):
    """Validate Authorization header and extract token"""
    if not auth_header:
        return {"valid": False, "message": "Authorization header missing"}
    
    parts = auth_header.split()
    
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return {"valid": False, "message": "Invalid authorization format. Use 'Bearer <token>'"}
    
    token = parts[1]
    return decode_token(token)

# For testing purposes
if __name__ == "__main__":
    # Example token (this is just for testing, not a real token)
    test_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwibmFtZSI6IlRlc3QgVXNlciIsImlzX2FkbWluIjpmYWxzZX0.signature"
    
    result = decode_token(test_token)
    print(result) 