FROM python:3.10-slim

WORKDIR /app

# Install PostgreSQL client
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Make wait-for-postgres.sh executable
RUN chmod +x wait-for-postgres.sh

# Expose ports
EXPOSE 5000 8000

# Default command (will be overridden by docker-compose)
CMD ["python", "app.py"]