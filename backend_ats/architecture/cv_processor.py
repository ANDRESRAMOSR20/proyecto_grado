import os
import tempfile
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from .model import process_cv, create_embeddings
from .vectordb import store_cv, initialize_vector_db, search_similar_chunks

# Create blueprint for CV processing
cv_blueprint = Blueprint('cv', __name__)

# Initialize vector database
initialize_vector_db()

# Configure upload settings
UPLOAD_FOLDER = tempfile.gettempdir()  # Use system temp directory
ALLOWED_EXTENSIONS = {'pdf'}

def allowed_file(filename):
    """Check if the file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@cv_blueprint.route('/upload', methods=['POST'])
def upload_cv():
    """Endpoint to upload and process CV"""
    # Check if file part exists in request
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    
    file = request.files['file']
    
    # Check if file is selected
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    # Check if file type is allowed
    if file and allowed_file(file.filename):
        # Secure the filename
        filename = secure_filename(file.filename)
        
        # Save file to temp directory
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        try:
            # Process the CV
            cv_data = process_cv(filepath)
            
            # Store CV data in Qdrant
            cv_id = store_cv(cv_data)
            
            # Remove temporary file
            os.remove(filepath)
            
            return jsonify({
                "success": True,
                "cv_id": cv_id,
                "message": "CV processed and stored successfully in Qdrant",
                "filename": filename,
                "chunks": cv_data["chunk_count"]
            }), 201
        except Exception as e:
            # Remove temporary file in case of error
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({"error": f"Error processing CV: {str(e)}"}), 500
    else:
        return jsonify({"error": "File type not allowed. Please upload a PDF file."}), 400

@cv_blueprint.route('/search', methods=['POST'])
def search_cv():
    """Endpoint to search for similar CVs based on a text query"""
    # Get request data
    data = request.json
    if not data or 'query' not in data:
        return jsonify({"error": "No query provided"}), 400
    
    query = data['query']
    
    try:
        # Create embedding for the query
        query_embeddings = create_embeddings([query])
        if not query_embeddings or len(query_embeddings[0]) == 0:
            return jsonify({"error": "Failed to create embedding for query"}), 500
        
        # Search for chunks using vector similarity in Qdrant
        results = search_similar_chunks(query_embeddings[0])
        
        return jsonify({
            "success": True,
            "results": results
        })
    except Exception as e:
        return jsonify({"error": f"Error searching CVs: {str(e)}"}), 500

def register_routes(app):
    """Register blueprint with Flask app"""
    app.register_blueprint(cv_blueprint, url_prefix='/api/cv') 