# Raspberry Pi Dashboard Setup Guide

Ultra-simple setup for your home dashboard with automatic Git updates.

## Quick Setup (3 Steps)

### Step 1: Flash SD Card

1. Download [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Select **Raspberry Pi OS Lite (64-bit)**
3. Click the gear icon and configure:
   - ✓ Enable SSH
   - ✓ Set username/password
   - ✓ Configure WiFi (if not using Ethernet)
   - ✓ Set hostname: `raspberrypi`
4. Write to SD card

### Step 2: Boot and Push Your Code to Git

Insert SD card in Pi and power on. While it boots, push your code:

```bash
git init
git add .
git commit -m "Initial dashboard"
git remote add origin YOUR_GIT_REPO_URL
git push -u origin main
```

### Step 3: Run One Command

SSH into your Pi (wait 2-3 minutes after first boot):

```bash
ssh pi@raspberrypi.local
```

Then run the installer:

```bash
git clone YOUR_GIT_REPO_URL ~/dashboard
cd ~/dashboard
chmod +x raspberry-pi/install.sh
./raspberry-pi/install.sh
```

Done! Access your dashboard at `http://raspberrypi.local:3000`

## What Gets Configured Automatically

The installer handles everything:
- Installs Node.js 20
- Builds your dashboard
- Creates systemd services for auto-start
- Sets up Git auto-updates every 5 minutes
- Starts the dashboard immediately

## Auto-Update Workflow

1. Edit dashboard in Bolt
2. Commit and push to Git
3. Wait up to 5 minutes
4. Dashboard auto-updates on Pi

No manual deployment needed!

## Optional: Add Weather

Get free API key from [OpenWeatherMap](https://openweathermap.org/api), then:

```bash
nano ~/dashboard/.env
```

Add:
```
VITE_WEATHER_API_KEY=your_key_here
VITE_WEATHER_LOCATION=Your_City
```

Restart:
```bash
sudo systemctl restart dashboard
```

## Useful Commands

```bash
sudo systemctl status dashboard          # Check status
sudo systemctl restart dashboard         # Restart
sudo journalctl -u dashboard -f          # View logs
sudo journalctl -u dashboard-updater -f  # View update logs
```

## Troubleshooting

Dashboard not starting?
```bash
sudo journalctl -u dashboard -n 50
```

Auto-update not working?
```bash
sudo journalctl -u dashboard-updater -f
```

Can't access from other devices?
```bash
hostname -I  # Get Pi's IP address
```

## Adding More Cards

1. Create new card in `src/components/YourCard.tsx`
2. Add to `src/App.tsx`
3. Commit and push
4. Auto-deploys in 5 minutes

Ideas:
- Calendar / Todo list
- Smart home controls
- Media player status
- RSS feeds
- Photo slideshow
- Network monitor

Build it in Bolt, push it, see it live!
