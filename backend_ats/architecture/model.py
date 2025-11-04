from openai import OpenAI
from dotenv import load_dotenv
import os
import PyPDF2
import re
import tiktoken
from typing import List, Dict, Any

# Load environment variables
load_dotenv()

# Get API Key
api_key = os.getenv("OPENAI_API_KEY")

# Initialize OpenAI client with error handling
try:
    # First try the standard initialization
    client = OpenAI(api_key=api_key)
except TypeError as e:
    if "proxies" in str(e):
        # If there's a proxies error, try without default_headers which might contain proxies
        import httpx
        client = OpenAI(
            api_key=api_key,
            http_client=httpx.Client()
        )
    else:
        raise e

# Get tokenizer for token counting
tokenizer = tiktoken.get_encoding("cl100k_base")  # OpenAI's tokenizer for embedding models

def count_tokens(text: str) -> int:
    """Count the number of tokens in a text string"""
    tokens = tokenizer.encode(text)
    return len(tokens)

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from a PDF file"""
    text = ""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
    return text

def clean_text(text: str) -> str:
    """Clean and normalize text"""
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    # Remove special characters that might not be useful
    text = re.sub(r'[^\w\s.,;:!?()-]', '', text)
    return text.strip()

def chunk_text(text: str, max_tokens: int = 1000, overlap: int = 100) -> List[str]:
    """Split text into chunks that fit within token limits with overlap"""
    chunks = []
    
    # If text is already small enough, return it as a single chunk
    if count_tokens(text) <= max_tokens:
        return [text]
    
    # Split text into paragraphs first
    paragraphs = text.split('\n')
    current_chunk = ""
    
    for paragraph in paragraphs:
        # If adding this paragraph would exceed the limit
        if count_tokens(current_chunk + paragraph) > max_tokens and current_chunk:
            chunks.append(current_chunk.strip())
            # Keep some overlap from the previous chunk
            overlap_text = " ".join(current_chunk.split()[-overlap:]) if overlap > 0 else ""
            current_chunk = overlap_text + " " + paragraph
        else:
            current_chunk += " " + paragraph
    
    # Add the last chunk if it's not empty
    if current_chunk.strip():
        chunks.append(current_chunk.strip())
    
    return chunks

def create_embeddings(texts: List[str]) -> List[List[float]]:
    """Create embeddings for a list of text chunks"""
    embeddings = []
    
    for text in texts:
        try:
            response = client.embeddings.create(
                model="text-embedding-3-small",
                input=text,
                encoding_format="float"
            )
            embeddings.append(response.data[0].embedding)
        except Exception as e:
            print(f"Error creating embedding: {e}")
            embeddings.append([])
    
    return embeddings

def process_cv(pdf_path: str, max_tokens: int = 8000) -> Dict[str, Any]:
    """Process a CV from PDF to embeddings with metadata"""
    # Extract text from PDF
    raw_text = extract_text_from_pdf(pdf_path)
    
    # Clean the text
    cleaned_text = clean_text(raw_text)
    
    # Calculate chunk size based on total tokens
    total_tokens = count_tokens(cleaned_text)
    chunk_size = min(2000, max(500, max_tokens // 4))  # Aim for 4 chunks, between 500-2000 tokens
    
    # Chunk the text
    chunks = chunk_text(cleaned_text, chunk_size)
    
    # Create embeddings
    embeddings = create_embeddings(chunks)
    
    # Create metadata
    metadata = {
        "filename": os.path.basename(pdf_path),
        "total_tokens": total_tokens,
        "chunk_count": len(chunks),
        "chunks": chunks,
        "embeddings": embeddings
    }
    
    return metadata
