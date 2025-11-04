# Talent Workspace - ATS Frontend

This is the frontend for the Applicant Tracking System (ATS) application.

## Prerequisites

- Node.js (v16+)
- Python (v3.8+)
- PostgreSQL database

## Setup

### Backend Setup

1. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   JWT_SECRET_KEY=your_secret_key
   JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
   DATABASE_URL=postgresql://username:password@localhost/database_name
   ```

3. Start the Flask server:
   ```
   python server.py
   ```

### Frontend Setup

1. Install Node.js dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. Access the application:
   Open your browser and navigate to `http://localhost:5173`

## Authentication

The application includes two authentication screens:

- **Sign In**: For existing users to log in
- **Sign Up**: For new users to create an account

## Features

- User authentication (sign in/sign up)
- Job vacancy filtering
- Application tracking
- Metrics dashboard
- User profile management

## Project Structure

- `/src`: Frontend React code
  - `/components`: React components
  - `/services`: API services
- `/auth`: Backend authentication code
- `SignIn.py`: Backend sign-in handler
- `SignUp.py`: Backend sign-up handler
- `server.py`: Flask server for API endpoints
