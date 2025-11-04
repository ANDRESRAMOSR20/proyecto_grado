import os
import sys
import json
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError
from dotenv import load_dotenv
from datetime import datetime
from typing import Optional

# Add parent directory to path to import from auth module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import User and MetaUser models from create_db
from auth.create_db import User, MetaUser, engine

# Load environment variables
load_dotenv()

# Create session
Session = sessionmaker(bind=engine)

def save_user_profile(user_id: int, fullname: str, celular: str, resume_pdf: Optional[str] = None):
    """Save or update user profile information in meta_users table"""
    session = Session()
    
    try:
        # Check if user exists
        user = session.query(User).filter(User.id == user_id).first()
        if not user:
            return {"success": False, "message": "User not found"}
        
        # Check if user already has a profile
        existing_profile = session.query(MetaUser).filter(MetaUser.user_id == user_id).first()
        
        if existing_profile:
            # Update existing profile
            existing_profile.fullname = fullname
            existing_profile.celular = celular
            if resume_pdf is not None:
                existing_profile.resume_pdf = resume_pdf
            existing_profile.updated_at = datetime.utcnow()
            message = "Profile updated successfully"
        else:
            # Create new profile
            new_profile = MetaUser(
                user_id=user_id,
                fullname=fullname,
                celular=celular,
                resume_pdf=resume_pdf
            )
            session.add(new_profile)
            message = "Profile created successfully"
        
        session.commit()
        
        return {
            "success": True,
            "message": message,
            "profile": {
                "user_id": user_id,
                "fullname": fullname,
                "celular": celular,
                "resume_pdf": resume_pdf
            }
        }
    
    except IntegrityError:
        session.rollback()
        return {"success": False, "message": "Profile update failed due to data integrity issues"}
    
    except Exception as e:
        session.rollback()
        return {"success": False, "message": f"Profile update error: {str(e)}"}
    
    finally:
        session.close()

def get_user_profile(user_id: int):
    """Get user profile information from meta_users table"""
    session = Session()
    
    try:
        # Check if user exists
        user = session.query(User).filter(User.id == user_id).first()
        if not user:
            return {"success": False, "message": "User not found"}
        
        # Get user profile
        profile = session.query(MetaUser).filter(MetaUser.user_id == user_id).first()
        
        if not profile:
            return {"success": False, "message": "Profile not found", "has_profile": False}
        
        return {
            "success": True,
            "has_profile": True,
            "profile": {
                "user_id": profile.user_id,
                "fullname": profile.fullname,
                "celular": profile.celular,
                "resume_pdf": getattr(profile, "resume_pdf", None)
            }
        }
    
    except Exception as e:
        return {"success": False, "message": f"Error retrieving profile: {str(e)}"}
    
    finally:
        session.close()

def handle_profile_request(request_data):
    """Handle profile update request from frontend"""
    try:
        data = json.loads(request_data)
        user_id = data.get("user_id")
        fullname = data.get("fullname")
        celular = data.get("celular")
        resume_pdf = data.get("resume_pdf")
        
        # Validate required fields
        if not all([user_id, fullname, celular]):
            return json.dumps({
                "success": False,
                "message": "All fields are required: user_id, fullname, celular"
            })
        
        result = save_user_profile(user_id, fullname, celular, resume_pdf)
        return json.dumps(result)
    
    except Exception as e:
        return json.dumps({
            "success": False,
            "message": f"Profile update error: {str(e)}"
        })

def handle_profile_get_request(request_data):
    """Handle profile get request from frontend"""
    try:
        data = json.loads(request_data)
        user_id = data.get("user_id")
        
        # Validate required fields
        if not user_id:
            return json.dumps({
                "success": False,
                "message": "User ID is required"
            })
        
        result = get_user_profile(user_id)
        return json.dumps(result)
    
    except Exception as e:
        return json.dumps({
            "success": False,
            "message": f"Error retrieving profile: {str(e)}"
        })

# For testing purposes
if __name__ == "__main__":
    # Example usage for saving profile
    test_request = json.dumps({
        "user_id": 1,
        "fullname": "Test User Full Name",
        "celular": "+1234567890"
    })
    
    response = handle_profile_request(test_request)
    print(response)
    
    # Example usage for getting profile
    test_get_request = json.dumps({
        "user_id": 1
    })
    
    get_response = handle_profile_get_request(test_get_request)
    print(get_response)