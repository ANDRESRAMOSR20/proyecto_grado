import os
from typing import List, Dict, Any, Optional, Union
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.models import Distance, VectorParams, PointStruct
import uuid

# Load environment variables
load_dotenv()

# Qdrant connection settings
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))
QDRANT_COLLECTION_NAME = "cv_collection"
VECTOR_SIZE = 1536  # Size for text-embedding-3-small

# Initialize Qdrant client
client = None

def setup_vector_extension():
    """Set up Qdrant client"""
    global client
    try:
        client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
        print(f"✅ Connected to Qdrant at {QDRANT_HOST}:{QDRANT_PORT}")
        return True
    except Exception as e:
        print(f"❌ Error connecting to Qdrant: {e}")
        return False

def create_tables():
    """Create collection in Qdrant"""
    global client
    try:
        if client is None:
            setup_vector_extension()
            
        # Check if collection exists
        collections = client.get_collections().collections
        collection_names = [collection.name for collection in collections]
        
        if QDRANT_COLLECTION_NAME not in collection_names:
            # Create collection if it doesn't exist
            client.create_collection(
                collection_name=QDRANT_COLLECTION_NAME,
                vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE)
            )
            print(f"✅ Created collection '{QDRANT_COLLECTION_NAME}' in Qdrant")
        else:
            print(f"✅ Collection '{QDRANT_COLLECTION_NAME}' already exists in Qdrant")
        return True
    except Exception as e:
        print(f"❌ Error creating collection in Qdrant: {e}")
        return False

def store_cv(cv_data: Dict[str, Any]) -> Optional[Union[str, int]]:
    """Store CV data in Qdrant"""
    global client
    try:
        if client is None:
            setup_vector_extension()
            
        # Generate a unique ID for the CV (string uuid for grouping)
        cv_id = str(uuid.uuid4())
        
        # Store chunks with their embeddings
        points = []
        
        for i, (chunk, embedding) in enumerate(zip(cv_data.get("chunks", []), cv_data.get("embeddings", []))):
            if not embedding:  # Skip if embedding is empty
                continue
            # Validate embedding dimension
            if len(embedding) != VECTOR_SIZE:
                raise ValueError(
                    f"Embedding dimension mismatch: expected {VECTOR_SIZE}, got {len(embedding)} at chunk {i}"
                )
                
            # Create a unique numeric ID for each chunk (Qdrant requires int or UUID)
            # Use 63-bit positive integer derived from uuid4
            chunk_id = uuid.uuid4().int & ((1 << 63) - 1)
            
            # Create point for Qdrant
            points.append(
                PointStruct(
                    id=chunk_id,
                    vector=[float(x) for x in embedding],
                    payload={
                        "text": chunk,
                        "cv_id": cv_id,
                        "chunk_index": i,
                        "filename": cv_data.get("filename", "unknown.pdf")
                    }
                )
            )
        
        # Upload points to Qdrant
        if points:
            # Ensure collection exists before upsert
            try:
                client.get_collection(collection_name=QDRANT_COLLECTION_NAME)
            except Exception:
                create_tables()
            
            client.upsert(
                collection_name=QDRANT_COLLECTION_NAME,
                points=points,
                wait=True
            )
            
        print(f"✅ CV stored successfully with ID: {cv_id} in Qdrant")
        return cv_id
    except Exception as e:
        # Log and propagate the detailed error so the API can report it
        print(f"❌ Error storing CV in Qdrant: {e}")
        raise

def search_similar_chunks(query_embedding: List[float], limit: int = 5) -> List[Dict[str, Any]]:
    """Search for similar chunks using vector similarity in Qdrant"""
    global client
    try:
        if client is None:
            setup_vector_extension()
            
        # Search for similar vectors in Qdrant
        search_results = client.search(
            collection_name=QDRANT_COLLECTION_NAME,
            query_vector=query_embedding,
            limit=limit
        )
        
        # Format results
        similar_chunks = []
        for result in search_results:
            similar_chunks.append({
                "id": result.id,
                "text": result.payload.get("text", ""),
                "chunk_index": result.payload.get("chunk_index", 0),
                "filename": result.payload.get("filename", "unknown.pdf"),
                "similarity": result.score
            })
                
        return similar_chunks
    except Exception as e:
        print(f"❌ Error searching chunks in Qdrant: {e}")
        return []

def search_similar_chunks_for_filename(query_embedding: List[float], filename: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Search for similar chunks restricted to a specific resume filename."""
    global client
    try:
        if client is None:
            setup_vector_extension()

        # Build a filter to restrict to points with matching filename
        qfilter = models.Filter(
            must=[
                models.FieldCondition(
                    key="filename",
                    match=models.MatchValue(value=filename)
                )
            ]
        )

        search_results = client.search(
            collection_name=QDRANT_COLLECTION_NAME,
            query_vector=query_embedding,
            query_filter=qfilter,
            limit=limit
        )

        similar_chunks = []
        for result in search_results:
            similar_chunks.append({
                "id": result.id,
                "text": result.payload.get("text", ""),
                "chunk_index": result.payload.get("chunk_index", 0),
                "filename": result.payload.get("filename", "unknown.pdf"),
                "similarity": result.score
            })
        return similar_chunks
    except Exception as e:
        print(f"❌ Error searching filtered chunks in Qdrant: {e}")
        return []

def initialize_vector_db():
    """Initialize Qdrant database"""
    if setup_vector_extension():
        create_tables()
        print("✅ Initialized Qdrant vector database")
        return True
    return False

# Initialize if this file is run directly
if __name__ == "__main__":
    initialize_vector_db()
