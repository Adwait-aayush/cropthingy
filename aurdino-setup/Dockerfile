FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for serial communication
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy serial bridge script and related files
COPY serial_bridge.py .

# Run serial bridge
# Note: For Docker on Windows with physical COM ports, you may need to:
# 1. Run container with --device=/dev/ttyUSB0 (Linux)
# 2. Or use host network mode on Windows: network_mode: host in docker-compose
# 3. Or keep running this script locally outside Docker

CMD ["python", "serial_bridge.py"]
