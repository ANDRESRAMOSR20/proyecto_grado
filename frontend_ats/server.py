from flask import Flask, request, jsonify
from flask_cors import CORS
import SignIn
import SignUp

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/signin', methods=['POST'])
def signin():
    """Handle sign-in requests"""
    try:
        # Get request data
        request_data = request.get_data().decode('utf-8')
        
        # Process sign-in request using the SignIn module
        result = SignIn.handle_signin_request(request_data)
        
        # Return the result as JSON
        return result, 200, {'Content-Type': 'application/json'}
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

@app.route('/signup', methods=['POST'])
def signup():
    """Handle sign-up requests"""
    try:
        # Get request data
        request_data = request.get_data().decode('utf-8')
        
        # Process sign-up request using the SignUp module
        result = SignUp.handle_signup_request(request_data)
        
        # Return the result as JSON
        return result, 200, {'Content-Type': 'application/json'}
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000) 