#!/bin/bash

set -e

echo "=========================================="
echo "  Raspberry Pi Dashboard Installer"
echo "=========================================="
echo ""

INSTALL_DIR="$HOME/dashboard"
REPO_URL=""
SERVICE_NAME="dashboard"

echo "This script will:"
echo "  1. Install Node.js and required dependencies"
echo "  2. Clone/update the dashboard repository"
echo "  3. Install dashboard dependencies"
echo "  4. Build the dashboard"
echo "  5. Set up auto-start on boot"
echo "  6. Set up auto-update from Git"
echo "  7. Start the dashboard"
echo ""

read -p "Enter your Git repository URL (or press Enter to skip): " user_repo
if [ ! -z "$user_repo" ]; then
    REPO_URL="$user_repo"
fi

echo ""
echo "Step 1: Installing system dependencies..."
sudo apt-get update
sudo apt-get install -y curl git

if ! command -v node &> /dev/null; then
    echo "Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "Node.js already installed: $(node --version)"
fi

echo ""
echo "Step 2: Setting up dashboard directory..."
if [ -d "$INSTALL_DIR" ]; then
    echo "Dashboard directory exists. Updating..."
    cd "$INSTALL_DIR"
    if [ -d ".git" ]; then
        git pull
    fi
else
    if [ ! -z "$REPO_URL" ]; then
        echo "Cloning repository..."
        git clone "$REPO_URL" "$INSTALL_DIR"
        cd "$INSTALL_DIR"
    else
        echo "Creating dashboard directory..."
        mkdir -p "$INSTALL_DIR"
        cd "$INSTALL_DIR"
        echo "Note: You'll need to manually copy your dashboard files here"
    fi
fi

echo ""
echo "Step 3: Installing dashboard dependencies..."
npm install

echo ""
echo "Step 4: Building dashboard..."
npm run build

echo ""
echo "Step 5: Setting up environment variables..."
if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
PORT=3001
VITE_WEATHER_API_KEY=
VITE_WEATHER_LOCATION=London
NODE_ENV=production
EOF
    echo "Created .env file. You can add your weather API key later if needed."
fi

echo ""
echo "Step 6: Creating systemd service for dashboard..."
sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null << EOF
[Unit]
Description=Home Dashboard
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/npm run start:production
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

echo ""
echo "Step 7: Creating systemd service for heartbeat..."
sudo tee /etc/systemd/system/${SERVICE_NAME}-heartbeat.service > /dev/null << EOF
[Unit]
Description=Dashboard Heartbeat Service
After=network.target ${SERVICE_NAME}.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/node $INSTALL_DIR/raspberry-pi/heartbeat.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

echo ""
echo "Step 8: Creating systemd service for auto-updater..."
sudo tee /etc/systemd/system/${SERVICE_NAME}-updater.service > /dev/null << EOF
[Unit]
Description=Dashboard Auto-Updater
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR
ExecStart=$INSTALL_DIR/raspberry-pi/auto-update.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo ""
echo "Step 8: Creating production start script..."
cat > package.json.tmp << 'EOF'
EOF

npm pkg set scripts.start:production="node raspberry-pi/start-production.js"

echo ""
echo "Step 9: Enabling and starting services..."
sudo systemctl daemon-reload
sudo systemctl enable ${SERVICE_NAME}
sudo systemctl enable ${SERVICE_NAME}-heartbeat
sudo systemctl enable ${SERVICE_NAME}-updater
sudo systemctl start ${SERVICE_NAME}
sudo systemctl start ${SERVICE_NAME}-heartbeat
sudo systemctl start ${SERVICE_NAME}-updater

echo ""
echo "=========================================="
echo "  Installation Complete!"
echo "=========================================="
echo ""
echo "Dashboard is now running and will:"
echo "  - Start automatically on boot"
echo "  - Send status updates to Supabase every 10 seconds"
echo "  - Check for Git updates every 5 minutes"
echo "  - Auto-deploy when changes are detected"
echo ""
echo "Access your dashboard at:"
echo "  http://$(hostname -I | awk '{print $1}'):3000"
echo "  http://raspberrypi.local:3000"
echo ""
echo "Useful commands:"
echo "  sudo systemctl status dashboard             - Check dashboard status"
echo "  sudo systemctl restart dashboard            - Restart dashboard"
echo "  sudo systemctl status dashboard-heartbeat   - Check heartbeat status"
echo "  sudo systemctl status dashboard-updater     - Check updater status"
echo "  sudo journalctl -u dashboard -f             - View dashboard logs"
echo "  sudo journalctl -u dashboard-heartbeat -f   - View heartbeat logs"
echo "  sudo journalctl -u dashboard-updater -f     - View updater logs"
echo ""
