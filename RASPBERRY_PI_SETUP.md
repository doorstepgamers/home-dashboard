# Raspberry Pi Home Dashboard - Complete Setup Guide

This guide will walk you through setting up your Raspberry Pi home dashboard from a fresh installation. The dashboard displays system stats, weather, and device status with automatic updates from GitHub.

## Prerequisites

- Raspberry Pi (3, 4, or 5 recommended)
- MicroSD card (16GB minimum)
- Power supply
- Internet connection (WiFi or Ethernet)
- Supabase account (free tier works great)

## Part 1: Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in project details and wait for setup to complete

### 2. Get Your API Credentials

1. In your Supabase project, go to Settings > API
2. Copy these values (you'll need them later):
   - **Project URL** (under Project URL)
   - **anon public key** (under Project API keys)

### 3. Run Database Migrations

1. In Supabase, go to SQL Editor
2. Click "New Query"
3. Paste the first migration:

```sql
/*
  # Device Status Tracking

  1. New Tables
    - `device_status`
      - `id` (uuid, primary key) - Unique device identifier
      - `device_name` (text) - Friendly name for the device
      - `last_seen` (timestamptz) - Last heartbeat timestamp
      - `system_info` (jsonb) - System stats (CPU, memory, temp, etc)
      - `ip_address` (text) - Device IP address
      - `created_at` (timestamptz) - First seen timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `device_status` table
    - Add policy for public read access (dashboard monitoring)
    - Add policy for devices to update their own status

  3. Indexes
    - Index on `last_seen` for quick online status queries

  4. Notes
    - Devices are considered online if last_seen is within last 30 seconds
    - System info stored as JSONB for flexibility
*/

CREATE TABLE IF NOT EXISTS device_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_name text NOT NULL DEFAULT 'Raspberry Pi',
  last_seen timestamptz DEFAULT now(),
  system_info jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_status_last_seen ON device_status(last_seen DESC);

ALTER TABLE device_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view device status"
  ON device_status FOR SELECT
  USING (true);

CREATE POLICY "Devices can insert status"
  ON device_status FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Devices can update status"
  ON device_status FOR UPDATE
  USING (true)
  WITH CHECK (true);
```

4. Click "Run"
5. Create another new query and paste the second migration:

```sql
/*
  # Add Update Tracking Fields

  1. Changes
    - Add `last_check_time` (timestamptz) - Last time auto-update checked for updates
    - Add `last_update_time` (timestamptz) - Last time an actual update was applied

  2. Notes
    - `last_check_time` updates every 15 minutes when the script checks
    - `last_update_time` only updates when git pull actually happens
    - Both default to null (no checks/updates yet)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'device_status' AND column_name = 'last_check_time'
  ) THEN
    ALTER TABLE device_status ADD COLUMN last_check_time timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'device_status' AND column_name = 'last_update_time'
  ) THEN
    ALTER TABLE device_status ADD COLUMN last_update_time timestamptz;
  END IF;
END $$;
```

6. Click "Run"

## Part 2: Raspberry Pi Setup

### Step 1: Flash SD Card

1. Download [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Insert your microSD card
3. In Imager:
   - Click "Choose Device" → Select your Pi model
   - Click "Choose OS" → **Raspberry Pi OS Lite (64-bit)** (no desktop needed)
   - Click "Choose Storage" → Select your SD card
4. Click the gear icon (⚙️) or "Edit Settings" to configure:
   - **General Tab:**
     - Set hostname: `raspberrypi` (or your preferred name)
     - Enable SSH: ✓ Use password authentication
     - Set username: `pi` (or your preferred username)
     - Set password: (choose a secure password)
     - Configure WiFi: ✓ Enter your SSID and password (if not using Ethernet)
     - Set locale settings: Your timezone and keyboard layout
   - **Services Tab:**
     - Enable SSH: ✓
5. Click "Save"
6. Click "Write" and confirm
7. Wait for writing and verification to complete

### Step 2: Boot the Pi

1. Insert the SD card into your Raspberry Pi
2. Connect power supply
3. Wait 2-3 minutes for first boot to complete
4. The Pi should connect to your network automatically

### Step 3: Connect via SSH

From your computer, open a terminal and connect:

```bash
ssh pi@raspberrypi.local
```

Or if .local doesn't work, find the IP address from your router and use:

```bash
ssh pi@YOUR_PI_IP_ADDRESS
```

Enter the password you set during imaging.

### Step 4: Install the Dashboard

Run these commands one by one:

```bash
# Clone the repository
git clone https://github.com/doorstepgamers/home-dashboard.git ~/home-dashboard

# Navigate to the directory
cd ~/home-dashboard

# Make install script executable
chmod +x raspberry-pi/install.sh

# Run the installer
./raspberry-pi/install.sh
```

The installer will:
- Install Node.js 20
- Install all dependencies
- Build the dashboard
- Install PM2 process manager
- Set up the heartbeat service
- Create a .env file template

### Step 5: Configure Supabase Credentials

Edit the .env file with your Supabase credentials:

```bash
nano ~/home-dashboard/.env
```

Update these lines with your Supabase credentials from Part 1:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Save and exit: `Ctrl+X`, then `Y`, then `Enter`

### Step 6: Enable PM2 Startup

The installer will show you a command like this:

```bash
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u pi --hp /home/pi
```

Copy and run the exact command shown in your terminal.

### Step 7: Restart the Dashboard

```bash
pm2 restart home-dashboard
pm2 restart home-dashboard-heartbeat
```

### Step 8: Set Up Auto-Updater

Start the auto-update service:

```bash
cd ~/home-dashboard
pm2 start raspberry-pi/auto-update.sh --name home-dashboard-auto-update --interpreter bash
pm2 save
```

This will check for GitHub updates every 15 minutes and automatically deploy them.

## Part 3: Access Your Dashboard

Your dashboard is now running! Access it at:

- `http://raspberrypi.local:3000` (from any device on your network)
- Or `http://YOUR_PI_IP:3000` if .local doesn't work

You should see:
- **Device Status Card** - Shows your Pi is online with system stats
- **Weather Card** - Shows current weather (configure in admin)
- **System Stats Card** - Additional system information
- **Footer** - Shows last update check time and last update applied time

### Step 9: Configure Weather (Optional)

1. Click the "Admin" button in the top-right corner of the dashboard
2. You'll see the Admin Dashboard with settings
3. Get a free API key from [OpenWeatherMap](https://openweathermap.org/api)
4. Enter your API key in the "Weather Api Key" field
5. Enter your city name in the "Weather Location" field
6. Click "Save Settings"
7. Go back to the main dashboard to see weather data

All API keys are now stored securely in Supabase instead of .env files!

## Part 4: How It Works

### Automatic Updates

The dashboard automatically updates itself from GitHub:

1. **Auto-update script** runs every 15 minutes
2. Checks GitHub for new commits
3. If changes found:
   - Pulls latest code
   - Installs dependencies
   - Rebuilds dashboard
   - Restarts services
4. **Footer displays**:
   - Last Check: When it last checked for updates
   - Last Update: When it last actually updated

### Heartbeat System

Every 10 seconds, your Pi:
- Sends system stats to Supabase
- Updates CPU, memory, temperature
- Reports online status
- Dashboard reflects changes in real-time

## Useful PM2 Commands

```bash
pm2 status                                    # View all running processes
pm2 logs home-dashboard                       # View dashboard logs
pm2 logs home-dashboard-heartbeat             # View heartbeat logs
pm2 logs home-dashboard-auto-update           # View update logs
pm2 restart home-dashboard                    # Restart dashboard
pm2 stop home-dashboard                       # Stop dashboard
pm2 start home-dashboard                      # Start dashboard
pm2 monit                                     # Real-time monitoring
pm2 save                                      # Save process list
```

## Troubleshooting

### Dashboard Not Loading

Check if services are running:
```bash
pm2 status
```

View logs for errors:
```bash
pm2 logs home-dashboard --lines 50
```

Restart all services:
```bash
pm2 restart all
```

### Can't Access from Other Devices

Find your Pi's IP address:
```bash
hostname -I
```

Make sure you're on the same network and try:
```bash
http://IP_ADDRESS:3000
```

### Supabase Connection Issues

Verify .env file has correct credentials:
```bash
cat ~/home-dashboard/.env
```

Check Supabase URL format is correct:
```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
```

After fixing .env, restart:
```bash
pm2 restart home-dashboard
pm2 restart home-dashboard-heartbeat
```

### Auto-Update Not Working

Check auto-update logs:
```bash
pm2 logs home-dashboard-auto-update
```

Manually test git pull:
```bash
cd ~/home-dashboard
git pull
```

Verify GitHub repository URL:
```bash
git remote -v
```

## Making Changes

### Update from Bolt or Your Editor

1. Make changes to your code
2. Push to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```
3. Wait up to 15 minutes for auto-update
4. Watch the footer "Last Update" time change

### Manual Update

Force an immediate update:
```bash
cd ~/home-dashboard
git pull
npm install
npm run build
pm2 restart all
```

## Adding New Features

### Add a New Card Component

1. Create `src/components/YourCard.tsx`
2. Import and add to `src/App.tsx`
3. Push to GitHub
4. Auto-deploys in 15 minutes

**Ideas for cards:**
- Calendar / Todo list
- Smart home device controls
- Media player status
- RSS feed reader
- Photo slideshow
- Network device monitor
- Cryptocurrency prices
- Stock ticker
- News headlines

### Managing Settings

Use the Admin Dashboard to manage all API keys and settings:

1. Navigate to `http://raspberrypi.local:3000/admin`
2. Edit any settings
3. Click "Save Settings"
4. Settings are immediately available (no restart needed)

Settings are stored in Supabase, making them easy to update without SSH access.

## Advanced Configuration

### Change Update Interval

Edit auto-update script:
```bash
nano ~/home-dashboard/raspberry-pi/auto-update.sh
```

Change `CHECK_INTERVAL=900` (seconds) to your preferred interval.

Then:
```bash
pm2 restart home-dashboard-auto-update
```

### Change Dashboard Port

Edit .env:
```bash
nano ~/home-dashboard/.env
```

Change `PORT=3001` to your preferred port, then:
```bash
pm2 restart home-dashboard
```

### Multiple Raspberry Pis

Run the same setup on multiple Pis. They'll all:
- Report to the same Supabase database
- Show up in the Device Status Card
- Have unique device IDs automatically
- Auto-update independently

## Security Notes

- Dashboard uses public (anon) Supabase key - safe for read operations
- Row Level Security (RLS) protects your database
- Only system stats are exposed (no sensitive data)
- Keep your Raspberry Pi OS updated:
  ```bash
  sudo apt update && sudo apt upgrade -y
  ```

## Next Steps

Now that your dashboard is running:

1. **Add weather**: Get free API key from [OpenWeatherMap](https://openweathermap.org/api)
2. **Customize design**: Edit components in `src/components/`
3. **Add more data**: Create new cards for any data you want to display
4. **Set up multiple Pis**: Run on multiple devices for multi-room monitoring

Enjoy your home dashboard!
