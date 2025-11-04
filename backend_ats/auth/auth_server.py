import os
import sys
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from dotenv import load_dotenv

# Add parent directory to path to import from auth module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import auth handlers
from auth.SignIn import handle_signin_request
from auth.SignUp import handle_signup_request

# Load environment variables
load_dotenv()

# Get server configuration from environment or use defaults
HOST = os.getenv("AUTH_SERVER_HOST", "localhost")
PORT = int(os.getenv("AUTH_SERVER_PORT", "8000"))

class AuthHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status_code=200, content_type="application/json"):
        self.send_response(status_code)
        self.send_header("Content-type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
    
    def do_OPTIONS(self):
        """Handle preflight requests for CORS"""
        self._set_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == "/api/health":
            self._set_headers()
            self.wfile.write(json.dumps({"status": "ok"}).encode())
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Not found"}).encode())
    
    def do_POST(self):
        """Handle POST requests"""
        content_length = int(self.headers["Content-Length"])
        post_data = self.rfile.read(content_length).decode("utf-8")
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == "/api/auth/signin":
            response = handle_signin_request(post_data)
            self._set_headers()
            self.wfile.write(response.encode())
        
        elif path == "/api/auth/signup":
            response = handle_signup_request(post_data)
            self._set_headers()
            self.wfile.write(response.encode())
        
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Not found"}).encode())

def run_server():
    """Run the authentication server"""
    server_address = (HOST, PORT)
    httpd = HTTPServer(server_address, AuthHandler)
    print(f"✅ Authentication server running at http://{HOST}:{PORT}")
    print("Press Ctrl+C to stop the server")
    httpd.serve_forever()

if __name__ == "__main__":
    run_server() 