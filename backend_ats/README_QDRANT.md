# Qdrant Vector Database Implementation

This document provides instructions for setting up and using the Qdrant vector database implementation for the ATS system.

## Overview

The system has been updated to use Qdrant as the vector database for storing and searching CV embeddings. Qdrant is a vector similarity search engine that provides efficient storage and retrieval of vector embeddings.

## Setup

### Prerequisites

- Docker and Docker Compose
- Python 3.10+
- OpenAI API key

### Environment Variables

Create a `.env` file in the `backend_ats` directory with the following variables:

```
OPENAI_API_KEY=your_openai_api_key
QDRANT_HOST=localhost
QDRANT_PORT=6333
```

When running with Docker, the environment variables for Qdrant will be automatically set to connect to the Qdrant container.

## Running the Application

### Using Docker Compose

1. Navigate to the `backend_ats` directory
2. Run the following command:

```bash
docker-compose up -d
```

This will start both the Qdrant service and the backend service.

### Running Locally

1. Install Qdrant locally or use Docker to run just the Qdrant service:

```bash
docker run -p 6333:6333 -p 6334:6334 -v qdrant_data:/qdrant/storage qdrant/qdrant
```

2. Install the required Python packages:

```bash
pip install -r requirements.txt
```

3. Run the backend application:

```bash
python app.py
```

## API Endpoints

### Upload CV

```
POST /api/cv/upload
```

Upload a PDF file to be processed and stored in the Qdrant database.

### Search CVs

```
POST /api/cv/search
```

Search for similar CVs based on a text query. The system will create an embedding for the query and search for similar embeddings in the Qdrant database.

## Architecture

The system uses the following components:

1. **CV Processing**: Extracts text from PDFs, chunks it, and creates embeddings using OpenAI's embedding model.
2. **Vector Database**: Stores the embeddings and metadata in Qdrant for efficient similarity search.
3. **API**: Provides endpoints for uploading CVs and searching for similar CVs.

## Data Flow

1. User uploads a CV (PDF file)
2. System extracts text from the PDF
3. Text is cleaned and chunked
4. Embeddings are created for each chunk
5. Chunks and embeddings are stored in Qdrant
6. When searching, the query is converted to an embedding
7. Qdrant performs a similarity search to find the most relevant chunks

## Troubleshooting

- If you encounter connection issues with Qdrant, make sure the Qdrant service is running and accessible at the specified host and port.
- Check the logs of both the backend and Qdrant services for any errors.
- Ensure your OpenAI API key is valid and has sufficient credits for creating embeddings. 