#!/bin/bash
# Automated setup script for Victron Solar Monitoring on Raspberry Pi
# This script will install all dependencies and configure the system

set -e  # Exit on error

echo "=========================================="
echo "Victron Solar Monitor - Raspberry Pi Setup"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
   echo "Please do not run as root. Run as normal user (pi)."
   exit 1
fi

# Update system
echo "[1/7] Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Python and pip if not present
echo "[2/7] Installing Python and pip..."
sudo apt-get install -y python3 python3-pip

# Install Python dependencies
echo "[3/7] Installing Python dependencies..."
pip3 install --user pyserial requests

# Add user to dialout group for serial port access
echo "[4/7] Adding user to dialout group..."
sudo usermod -a -G dialout $USER

# Create installation directory
echo "[5/7] Setting up installation directory..."
INSTALL_DIR="$HOME/victron-solar"
mkdir -p $INSTALL_DIR

# Copy files to installation directory
echo "[6/7] Copying files..."
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cp "$SCRIPT_DIR/victron_collector.py" "$INSTALL_DIR/"
cp "$SCRIPT_DIR/test_data_generator.py" "$INSTALL_DIR/"
cp "$SCRIPT_DIR/requirements.txt" "$INSTALL_DIR/"
chmod +x "$INSTALL_DIR/victron_collector.py"
chmod +x "$INSTALL_DIR/test_data_generator.py"

# Detect USB serial port
echo ""
echo "[7/7] Detecting USB serial ports..."
if ls /dev/ttyUSB* 1> /dev/null 2>&1; then
    echo "Found USB serial ports:"
    ls -l /dev/ttyUSB*
    FIRST_PORT=$(ls /dev/ttyUSB* | head -n 1)
    echo ""
    echo "Using: $FIRST_PORT"

    # Update serial port in script
    sed -i "s|SERIAL_PORT = \"/dev/ttyUSB0\"|SERIAL_PORT = \"$FIRST_PORT\"|g" "$INSTALL_DIR/victron_collector.py"
else
    echo "⚠️  No USB serial ports detected. Please connect your VE.Direct cable."
    echo "   You can manually edit the port in: $INSTALL_DIR/victron_collector.py"
fi

# Create systemd service file
echo ""
echo "Creating systemd service..."
sudo tee /etc/systemd/system/victron-collector.service > /dev/null <<EOF
[Unit]
Description=Victron Solar Data Collector
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/python3 $INSTALL_DIR/victron_collector.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
sudo systemctl daemon-reload

echo ""
echo "=========================================="
echo "✓ Installation Complete!"
echo "=========================================="
echo ""
echo "Installation directory: $INSTALL_DIR"
echo ""
echo "Next steps:"
echo ""
echo "1. IMPORTANT: Log out and log back in (or reboot) for group changes to take effect:"
echo "   sudo reboot"
echo ""
echo "2. After reboot, test the collector manually:"
echo "   python3 $INSTALL_DIR/victron_collector.py"
echo ""
echo "3. If it works, enable auto-start on boot:"
echo "   sudo systemctl enable victron-collector.service"
echo "   sudo systemctl start victron-collector.service"
echo ""
echo "4. Check service status:"
echo "   sudo systemctl status victron-collector.service"
echo ""
echo "5. View live logs:"
echo "   sudo journalctl -u victron-collector.service -f"
echo ""
echo "Troubleshooting:"
echo "  - Edit config: nano $INSTALL_DIR/victron_collector.py"
echo "  - Test data generator: python3 $INSTALL_DIR/test_data_generator.py"
echo "  - Check USB ports: ls -l /dev/ttyUSB*"
echo ""
