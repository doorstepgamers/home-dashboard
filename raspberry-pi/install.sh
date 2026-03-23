#!/bin/bash

set -e

echo "=========================================="
echo "  Raspberry Pi Dashboard Installer"
echo "=========================================="
echo ""

INSTALL_DIR="$HOME/home-dashboard"
REPO_URL=""
SERVICE_NAME="home-dashboard"

echo "This script will:"
echo "  1. Install Node.js and required dependencies"
echo "  2. Clone/update the dashboard repository"
echo "  3. Install dashboard dependencies"
echo "  4. Build the dashboard"
echo "  5. Set up PM2 for process management"
echo "  6. Configure auto-start on boot"
echo "  7. Set up heartbeat service"
echo "  8. Start the dashboard"
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
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_WEATHER_API_KEY=
VITE_WEATHER_LOCATION=London
NODE_ENV=production
EOF
    echo "Created .env file. You'll need to add your Supabase credentials."
    echo "Edit the .env file and add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
fi

echo ""
echo "Step 6: Installing PM2 globally..."
sudo npm install -g pm2

echo ""
echo "Step 7: Starting application with PM2..."
pm2 delete ${SERVICE_NAME} 2>/dev/null || true
pm2 delete ${SERVICE_NAME}-heartbeat 2>/dev/null || true

pm2 start raspberry-pi/start-production.js --name ${SERVICE_NAME}
pm2 start raspberry-pi/heartbeat.js --name ${SERVICE_NAME}-heartbeat

echo ""
echo "Step 8: Saving PM2 process list..."
pm2 save

echo ""
echo "Step 9: Setting up PM2 to start on boot..."
pm2 startup systemd -u $USER --hp $HOME
echo "Note: You may need to run the command shown above with sudo"

echo ""
echo "=========================================="
echo "  Installation Complete!"
echo "=========================================="
echo ""
echo "Dashboard is now running with PM2 and will:"
echo "  - Start automatically on boot"
echo "  - Send status updates to Supabase every 10 seconds"
echo "  - Auto-restart on crashes"
echo ""
echo "Access your dashboard at:"
echo "  http://$(hostname -I | awk '{print $1}'):3000"
echo "  http://raspberrypi.local:3000"
echo ""
echo "Useful PM2 commands:"
echo "  pm2 status                           - View all processes"
echo "  pm2 logs ${SERVICE_NAME}             - View dashboard logs"
echo "  pm2 logs ${SERVICE_NAME}-heartbeat   - View heartbeat logs"
echo "  pm2 restart ${SERVICE_NAME}          - Restart dashboard"
echo "  pm2 stop ${SERVICE_NAME}             - Stop dashboard"
echo "  pm2 start ${SERVICE_NAME}            - Start dashboard"
echo "  pm2 monit                            - Monitor all processes"
echo ""
echo "IMPORTANT: Don't forget to:"
echo "  1. Edit .env file with your Supabase credentials"
echo "  2. Run the sudo command shown above to enable PM2 startup"
echo "  3. Restart the dashboard after updating .env: pm2 restart ${SERVICE_NAME}"
echo ""
