.PHONY: help start stop restart com3 com4 com5 kill

# Serial Bridge Configuration
PYTHON := ../\.venv\Scripts\python.exe
SCRIPT := serial_bridge.py
BACKEND := http://localhost:5000
DEVICE_ID := SERIAL_SCHEMA_001
API_KEY := replace_me_device_api_key
BAUD := 9600

help:
	@echo "Serial Bridge Makefile"
	@echo "====================="
	@echo ""
	@echo "Available commands:"
	@echo "  make start              - Start serial bridge on COM4 (default)"
	@echo "  make com3               - Start serial bridge on COM3"
	@echo "  make com4               - Start serial bridge on COM4"
	@echo "  make com5               - Start serial bridge on COM5"
	@echo "  make stop               - Stop all serial bridge processes"
	@echo ""
	@echo "Examples:"
	@echo "  make com4               - Stream data from COM4 to backend"
	@echo "  make com3 DEVICE_ID=MY_DEVICE - Custom device ID on COM3"
	@echo ""

start: com4

com3:
	@echo "Starting serial bridge on COM3..."
	@echo "Backend: $(BACKEND)"
	@echo "Device: $(DEVICE_ID)"
	@echo "Port: COM3"
	$(PYTHON) $(SCRIPT) --port COM3 --backend $(BACKEND) --device-id $(DEVICE_ID) --api-key $(API_KEY) --baudrate $(BAUD)

com4:
	@echo "Starting serial bridge on COM4..."
	@echo "Backend: $(BACKEND)"
	@echo "Device: $(DEVICE_ID)"
	@echo "Port: COM4"
	$(PYTHON) $(SCRIPT) --port COM4 --backend $(BACKEND) --device-id $(DEVICE_ID) --api-key $(API_KEY) --baudrate $(BAUD)

com5:
	@echo "Starting serial bridge on COM5..."
	@echo "Backend: $(BACKEND)"
	@echo "Device: $(DEVICE_ID)"
	@echo "Port: COM5"
	$(PYTHON) $(SCRIPT) --port COM5 --backend $(BACKEND) --device-id $(DEVICE_ID) --api-key $(API_KEY) --baudrate $(BAUD)

stop:
	@echo "Stopping all serial bridge processes..."
	@tasklist /FI "IMAGENAME eq python.exe" /FI "SESSIONNAME eq Console" | findstr python && (taskkill /IM python.exe /F || echo "No processes found") || echo "No python processes running"
	@echo "✓ Done"
