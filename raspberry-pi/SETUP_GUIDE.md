# Complete Raspberry Pi Setup Guide
## Victron Solar Monitoring System

This guide will walk you through setting up your Raspberry Pi from scratch to monitor your Victron solar system.

## Table of Contents
1. [Hardware Requirements](#hardware-requirements)
2. [Initial Raspberry Pi Setup](#initial-raspberry-pi-setup)
3. [Automated Installation](#automated-installation)
4. [Manual Installation](#manual-installation)
5. [Testing](#testing)
6. [Auto-Start Configuration](#auto-start-configuration)
7. [Troubleshooting](#troubleshooting)

---

## Hardware Requirements

### What You Need:
- **Raspberry Pi 3 Model B** (or newer: Pi 3B+, Pi 4, Pi Zero 2 W)
- **MicroSD Card**: 8GB minimum (16GB+ recommended)
- **Power Supply**: Official Raspberry Pi power adapter (5V 2.5A for Pi 3)
- **Victron VE.Direct to USB Cable**: Connects your Victron device to the Pi
- **Internet Connection**: Ethernet cable or WiFi
- **Computer**: For initial SD card setup

### Your Victron Equipment:
- Victron SmartShunt 300A (with VE.Direct port)
- OR Victron BlueSolar MPPT 75/10 (with VE.Direct port)

---

## Initial Raspberry Pi Setup

### Step 1: Install Raspberry Pi OS

#### Option A: Using Raspberry Pi Imager (Recommended)

1. **Download Raspberry Pi Imager**
   - Windows/Mac/Linux: https://www.raspberrypi.com/software/

2. **Flash the SD Card**
   - Insert your microSD card into your computer
   - Open Raspberry Pi Imager
   - Click "Choose OS" → "Raspberry Pi OS (64-bit)" or "Raspberry Pi OS (32-bit)"
   - Click "Choose Storage" → Select your SD card
   - Click the ⚙️ (gear icon) for advanced options

3. **Configure Advanced Settings** (IMPORTANT!)
   - ✅ Set hostname: `victron-monitor` (or your preference)
   - ✅ Enable SSH: Check "Enable SSH" and select "Use password authentication"
   - ✅ Set username and password:
     - Username: `pi` (or your preference)
     - Password: Choose a secure password
   - ✅ Configure WiFi (if not using Ethernet):
     - SSID: Your WiFi network name
     - Password: Your WiFi password
     - WiFi country: Your country code (e.g., US, GB, AU)
   - ✅ Set locale settings:
     - Timezone: Your timezone
     - Keyboard layout: Your keyboard layout

4. **Write to SD Card**
   - Click "Save" to save settings
   - Click "Write" and wait for it to complete (5-10 minutes)
   - When done, eject the SD card safely

#### Option B: Manual Configuration

If you skipped advanced settings, create these files on the SD card's boot partition:

**Create `ssh` file** (empty file, enables SSH):
```bash
# On Windows: Create empty file named "ssh" (no extension)
# On Mac/Linux:
touch /Volumes/boot/ssh
```

**Create `wpa_supplicant.conf`** (WiFi config):
```
country=US
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1

network={
    ssid="Your_WiFi_Name"
    psk="Your_WiFi_Password"
    key_mgmt=WPA-PSK
}
```

### Step 2: Boot the Raspberry Pi

1. Insert the SD card into your Raspberry Pi
2. Connect the Ethernet cable (if not using WiFi)
3. Connect the power supply
4. Wait 1-2 minutes for first boot

### Step 3: Find Your Pi's IP Address

#### Method 1: Check Your Router
- Log into your router's admin page
- Look for a device named "victron-monitor" or "raspberrypi"

#### Method 2: Use Network Scanner
- **Windows**: Use "Advanced IP Scanner" or "Angry IP Scanner"
- **Mac**: Use "LanScan" from App Store
- **Linux**: Use `nmap`:
  ```bash
  sudo nmap -sn 192.168.1.0/24
  ```

#### Method 3: Use Hostname (if on same network)
```bash
ping victron-monitor.local
```

### Step 4: Connect via SSH

**From Windows:**
- Use PuTTY or Windows Terminal
- Host: Your Pi's IP address (e.g., 192.168.1.100)
- Port: 22
- Username: `pi`
- Password: The one you set

**From Mac/Linux:**
```bash
ssh pi@192.168.1.100
# or
ssh pi@victron-monitor.local
```

---

## Automated Installation

Once connected to your Pi via SSH:

### Step 1: Transfer Files to Raspberry Pi

**Option A: Using SCP (from your computer)**
```bash
# Navigate to your project folder
cd /path/to/project

# Copy the raspberry-pi folder to your Pi
scp -r raspberry-pi pi@192.168.1.100:~/
```

**Option B: Download from Git (if you pushed to GitHub)**
```bash
# On the Raspberry Pi
git clone https://github.com/yourusername/your-repo.git
cd your-repo/raspberry-pi
```

**Option C: Manual Copy**
- Use FileZilla, WinSCP, or Cyberduck to copy the `raspberry-pi` folder

### Step 2: Run the Automated Setup Script

```bash
cd ~/raspberry-pi
chmod +x setup.sh
./setup.sh
```

The script will:
- Update system packages
- Install Python and dependencies
- Configure serial port permissions
- Detect your USB device
- Install the collector service
- Set up auto-start

### Step 3: Reboot

```bash
sudo reboot
```

**Wait 1-2 minutes, then reconnect via SSH.**

### Step 4: Enable the Service

```bash
sudo systemctl enable victron-collector.service
sudo systemctl start victron-collector.service
```

### Step 5: Verify It's Working

```bash
sudo systemctl status victron-collector.service
```

You should see: `Active: active (running)`

---

## Manual Installation

If you prefer to install step-by-step:

### Step 1: Update System

```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### Step 2: Install Python Dependencies

```bash
sudo apt-get install -y python3 python3-pip
pip3 install --user pyserial requests
```

### Step 3: Create Installation Directory

```bash
mkdir -p ~/victron-solar
cd ~/victron-solar
```

### Step 4: Create the Collector Script

```bash
nano victron_collector.py
```

Copy the contents from your `victron_collector.py` file, paste it, then:
- Press `Ctrl+X`
- Press `Y`
- Press `Enter`

Make it executable:
```bash
chmod +x victron_collector.py
```

### Step 5: Find Your USB Serial Port

```bash
ls -l /dev/ttyUSB*
```

You should see something like `/dev/ttyUSB0`

**Edit the script to use your port:**
```bash
nano victron_collector.py
```

Find this line:
```python
SERIAL_PORT = "/dev/ttyUSB0"
```

Update it to match your port if different.

### Step 6: Add User to Dialout Group

```bash
sudo usermod -a -G dialout $USER
```

**Important: Log out and back in (or reboot) for this to take effect:**
```bash
sudo reboot
```

---

## Testing

### Test 1: Manual Run

```bash
cd ~/victron-solar
python3 victron_collector.py
```

**Expected output:**
```
Starting Victron Solar Data Collector...
Connected to /dev/ttyUSB0
✓ Sent metrics - Battery: 12.45V, SOC: 85.2%, Solar: 125W
✓ Sent metrics - Battery: 12.46V, SOC: 85.3%, Solar: 128W
```

Press `Ctrl+C` to stop.

### Test 2: Test Data Generator (Without Hardware)

If you want to test without connecting to real hardware:

```bash
python3 test_data_generator.py
```

This simulates a full day's worth of solar data.

---

## Auto-Start Configuration

### Step 1: Create Systemd Service

```bash
sudo nano /etc/systemd/system/victron-collector.service
```

Paste this content (replace `pi` with your username if different):

```ini
[Unit]
Description=Victron Solar Data Collector
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/victron-solar
ExecStart=/usr/bin/python3 /home/pi/victron-solar/victron_collector.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Save: `Ctrl+X`, `Y`, `Enter`

### Step 2: Enable and Start Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable auto-start on boot
sudo systemctl enable victron-collector.service

# Start the service now
sudo systemctl start victron-collector.service
```

### Step 3: Check Status

```bash
sudo systemctl status victron-collector.service
```

### Step 4: View Live Logs

```bash
sudo journalctl -u victron-collector.service -f
```

Press `Ctrl+C` to stop viewing logs.

---

## Troubleshooting

### Problem: Permission Denied on Serial Port

**Solution:**
```bash
# Add user to dialout group
sudo usermod -a -G dialout $USER

# Verify you're in the group
groups

# If dialout is not listed, log out and back in
exit
# Then reconnect via SSH
```

### Problem: No USB Device Found

**Solution:**
```bash
# Check if USB device is detected
lsusb

# Check for serial ports
ls -l /dev/ttyUSB*
ls -l /dev/ttyACM*

# You might see ttyACM0 instead of ttyUSB0
# Update your script accordingly
```

### Problem: Can't Connect to Supabase

**Solution:**
```bash
# Test internet connection
ping -c 4 google.com

# Test Supabase connection
curl https://0ec90b57d6e95fcbda19832f.supabase.co/rest/v1/

# Check if requests library is installed
python3 -c "import requests; print(requests.__version__)"
```

### Problem: Service Won't Start

**Solution:**
```bash
# Check service status
sudo systemctl status victron-collector.service

# View detailed logs
sudo journalctl -u victron-collector.service -n 50

# Try running manually to see errors
cd ~/victron-solar
python3 victron_collector.py
```

### Problem: No Data in Dashboard

**Solution:**
1. Check if service is running: `sudo systemctl status victron-collector.service`
2. Check logs: `sudo journalctl -u victron-collector.service -f`
3. Verify VE.Direct cable is connected properly
4. Check that Victron device is powered on
5. Try test data generator to verify dashboard works

### Problem: Incorrect Data Readings

**Solution:**
1. Verify correct device is connected
2. Check VE.Direct cable quality (try a different cable)
3. Ensure Victron device firmware is up to date
4. Check for proper grounding of equipment

---

## Useful Commands

### Service Management
```bash
# Start service
sudo systemctl start victron-collector.service

# Stop service
sudo systemctl stop victron-collector.service

# Restart service
sudo systemctl restart victron-collector.service

# Check status
sudo systemctl status victron-collector.service

# Enable auto-start
sudo systemctl enable victron-collector.service

# Disable auto-start
sudo systemctl disable victron-collector.service
```

### Log Viewing
```bash
# View last 50 lines
sudo journalctl -u victron-collector.service -n 50

# View live logs
sudo journalctl -u victron-collector.service -f

# View logs from today
sudo journalctl -u victron-collector.service --since today

# View logs with errors only
sudo journalctl -u victron-collector.service -p err
```

### System Info
```bash
# Check Raspberry Pi model
cat /proc/cpuinfo | grep Model

# Check OS version
cat /etc/os-release

# Check Python version
python3 --version

# Check disk space
df -h

# Check memory
free -h

# Check temperature
vcgencmd measure_temp

# Check USB devices
lsusb

# Check serial devices
ls -l /dev/tty*
```

### Network
```bash
# Check IP address
hostname -I

# Check network status
ip addr show

# Test internet
ping -c 4 google.com

# Check WiFi status
iwconfig
```

---

## Additional Configuration

### Change Update Intervals

Edit the collector script:
```bash
nano ~/victron-solar/victron_collector.py
```

Find these lines and modify as needed:
```python
DATA_UPDATE_INTERVAL = 5   # seconds between data collection
HISTORY_LOG_INTERVAL = 60  # seconds between historical data logging
```

### Access Dashboard from Phone/Tablet

Your dashboard is available at the URL shown in your browser. You can access it from any device on your network or over the internet (since it's hosted on Supabase).

### Secure Your Raspberry Pi

```bash
# Change default password
passwd

# Update regularly
sudo apt-get update && sudo apt-get upgrade -y

# Install firewall (optional)
sudo apt-get install ufw
sudo ufw allow ssh
sudo ufw enable
```

---

## Performance Tips

### Reduce SD Card Wear

```bash
# Disable swap
sudo dphys-swapfile swapoff
sudo dphys-swapfile uninstall
sudo systemctl disable dphys-swapfile

# Use RAM for logs (optional)
sudo nano /etc/fstab
# Add this line:
# tmpfs /var/log tmpfs defaults,noatime,mode=0755 0 0
```

### Optimize for Low Power

For van/mobile use, reduce power consumption:
```bash
# Disable HDMI
sudo /usr/bin/tvservice -o

# Disable Bluetooth (if not needed)
echo "dtoverlay=disable-bt" | sudo tee -a /boot/config.txt

# Disable WiFi (if using Ethernet)
echo "dtoverlay=disable-wifi" | sudo tee -a /boot/config.txt
```

---

## Backup Your Configuration

### Backup Method 1: Copy Files
```bash
# On your computer, backup the configuration
scp -r pi@192.168.1.100:~/victron-solar ./victron-solar-backup
```

### Backup Method 2: Full SD Card Image
- Use Win32DiskImager (Windows) or dd (Mac/Linux)
- Create an image of your working SD card
- Store it safely for quick recovery

---

## Next Steps

Once your Raspberry Pi is collecting data:

1. **Monitor the dashboard** - Open the web interface and watch real-time updates
2. **Set up alerts** - Check that low battery alerts are working
3. **Test reliability** - Let it run for 24 hours to ensure stability
4. **Physical installation** - Mount the Pi securely in your van
5. **Cable management** - Secure all cables and protect from moisture

---

## Support Resources

- **VE.Direct Protocol**: https://www.victronenergy.com/support-and-downloads/technical-information
- **Raspberry Pi Forums**: https://forums.raspberrypi.com/
- **Victron Community**: https://community.victronenergy.com/

---

## Quick Reference Card

Print this and keep it in your van:

```
===========================================
VICTRON SOLAR MONITOR - QUICK REFERENCE
===========================================

SSH Login:
  ssh pi@victron-monitor.local
  (password: your-password)

Check Status:
  sudo systemctl status victron-collector.service

View Logs:
  sudo journalctl -u victron-collector.service -f

Restart Service:
  sudo systemctl restart victron-collector.service

Manual Test:
  cd ~/victron-solar
  python3 victron_collector.py

Dashboard URL:
  [Your web dashboard URL]

Supabase Dashboard:
  https://supabase.com/dashboard

===========================================
```

---

**You're all set! Your Raspberry Pi is now monitoring your solar system and sending data to your dashboard in real-time.**
