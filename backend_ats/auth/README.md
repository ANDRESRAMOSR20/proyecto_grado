# Authentication System

This folder contains the authentication system for the Talent Workspace AI application. It provides user registration, login, and token validation functionality.

## Structure

- `create_db.py` - Creates the database and user table
- `SignIn.py` - Handles user login functionality
- `SignUp.py` - Handles user registration
- `auth_server.py` - Simple HTTP server for authentication endpoints
- `utils/` - Utility functions for authentication

## Setup

1. Install required dependencies:
   ```
   pip install -r ../requirements.txt
   ```

2. Create a `.env` file in the root directory with the following content:
   ```
   # Database Configuration
   DATABASE_URL=sqlite:///./talent_ai.db

   # Authentication Server Configuration
   AUTH_SERVER_HOST=localhost
   AUTH_SERVER_PORT=8000

   # JWT Configuration
   JWT_SECRET_KEY=your_super_secret_key_change_this_in_production
   JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

3. Initialize the database:
   ```
   python create_db.py
   ```

4. Start the authentication server:
   ```
   python auth_server.py
   ```

## API Endpoints

### Sign Up
- **URL**: `/api/auth/signup`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "name": "User Name",
    "email": "user@example.com",
    "password": "secure_password",
    "identity_document": "ID12345678"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "user": {
      "id": 1,
      "name": "User Name",
      "email": "user@example.com"
    }
  }
  ```

### Sign In
- **URL**: `/api/auth/signin`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "secure_password"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "access_token": "jwt_token_here",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "name": "User Name",
      "email": "user@example.com",
      "is_admin": false
    }
  }
  ```

## Database Schema

The users table has the following structure:

- `id` - Integer, primary key
- `name` - String, user's full name
- `email` - String, unique, user's email address
- `password_hash` - String, bcrypt hashed password
- `identity_document` - String, unique identification document
- `is_admin` - Boolean, admin status flag

## Default Admin User

A default admin user is created when initializing the database:
- Email: `admin@example.com`
- Password: `admin123`

**Important**: Change the default admin credentials in production! 