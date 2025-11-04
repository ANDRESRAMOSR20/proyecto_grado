# Authentication System Setup

This document provides instructions for setting up and using the authentication system for the ATS application.

## Database Configuration

The authentication system uses PostgreSQL as the database. The connection string is stored in the `.env` file as `DATABASE_URL`.

### Environment Variables

For security reasons, all sensitive configuration is stored in environment variables. The application will not start if the required environment variables are missing.

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET_KEY`: Secret key for JWT token generation
- `AUTH_SERVER_HOST`: Host for the authentication server
- `AUTH_SERVER_PORT`: Port for the authentication server
- `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time in minutes

### Database Schema

The database consists of two main tables:

1. **users** - Stores user information
   - `id` - Integer, primary key
   - `name` - String, user's full name
   - `email` - String, unique, user's email address
   - `identity_document` - String, unique identification document
   - `is_admin` - Boolean, admin status flag
   - `created_at` - DateTime, when the user was created
   - `updated_at` - DateTime, when the user was last updated

2. **logins** - Stores login credentials and history
   - `id` - Integer, primary key
   - `user_id` - Integer, foreign key to users table
   - `password_hash` - String, bcrypt hashed password
   - `last_login` - DateTime, when the user last logged in
   - `created_at` - DateTime, when the login was created
   - `updated_at` - DateTime, when the login was last updated

## Setup Instructions

1. Ensure PostgreSQL is installed and running on your system.

2. Create a database named `atsbd`:
   ```sql
   CREATE DATABASE atsbd;
   ```

3. Create a `.env` file in the root directory with the following:
   ```
   # Database Configuration
   DATABASE_URL=postgresql://postgres:admin@localhost:5432/atsbd

   # Authentication Server Configuration
   AUTH_SERVER_HOST=localhost
   AUTH_SERVER_PORT=8000

   # JWT Configuration
   JWT_SECRET_KEY=your_super_secret_key_change_this_in_production
   JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```
   
   **IMPORTANT**: 
   - Never commit the `.env` file to version control
   - Use strong, unique values for JWT_SECRET_KEY in production
   - Consider using a secrets management service for production environments

4. Install required dependencies:
   ```
   pip install -r requirements.txt
   ```

5. Test the database connection:
   ```
   python auth/test_db_connection.py
   ```

6. Initialize the database:
   ```
   python auth/create_db.py
   ```

7. Start the authentication server:
   ```
   python auth/auth_server.py
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

## Default Admin User

A default admin user is created when initializing the database:
- Email: `admin@example.com`
- Password: `admin123`

**Important**: Change the default admin credentials in production!

## Token Validation

To validate a token, use the `token_validator.py` utility:

```python
from auth.utils.token_validator import validate_auth_header

# Example usage in a protected endpoint
auth_header = request.headers.get("Authorization")
result = validate_auth_header(auth_header)

if result["valid"]:
    # Access granted
    user_info = result["payload"]
    # Process the request
else:
    # Access denied
    error_message = result["message"]
    # Return error response
```

## Security Best Practices

1. **Environment Variables**: Always use environment variables for sensitive information
2. **Password Hashing**: The system uses bcrypt for secure password hashing
3. **Token Expiration**: JWT tokens have a configurable expiration time
4. **Database Separation**: User data and login credentials are stored in separate tables
5. **Error Handling**: Secure error messages that don't leak sensitive information 