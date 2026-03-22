# Quick Start Checklist
## Get Your Solar Monitor Running in 30 Minutes

## Before You Start
- [ ] Raspberry Pi 3 or newer
- [ ] MicroSD card (8GB+)
- [ ] VE.Direct to USB cable
- [ ] Internet connection (WiFi or Ethernet)
- [ ] Computer with SD card reader

---

## Step 1: Flash SD Card (5 minutes)

1. Download Raspberry Pi Imager: https://www.raspberrypi.com/software/
2. Insert SD card into computer
3. Open Imager → Choose OS → "Raspberry Pi OS (64-bit)"
4. Click ⚙️ gear icon:
   - ✅ Enable SSH
   - ✅ Set username: `pi` and password
   - ✅ Configure WiFi (SSID and password)
   - ✅ Set timezone
5. Click "Write" and wait

---

## Step 2: Boot Pi (2 minutes)

1. Insert SD card into Pi
2. Connect power
3. Wait 2 minutes for boot

---

## Step 3: Connect via SSH (3 minutes)

**Windows:**
```
Open PowerShell or cmd:
ssh pi@raspberrypi.local
```

**Mac/Linux:**
```bash
ssh pi@raspberrypi.local
```

If that doesn't work, find IP from your router and use:
```bash
ssh pi@192.168.1.XXX
```

---

## Step 4: Transfer Files (5 minutes)

**On your computer** (not on the Pi):

```bash
# Navigate to your project
cd /path/to/project

# Copy raspberry-pi folder to Pi
scp -r raspberry-pi pi@raspberrypi.local:~/
```

---

## Step 5: Run Automated Setup (10 minutes)

**On the Raspberry Pi** (via SSH):

```bash
cd ~/raspberry-pi
chmod +x setup.sh
./setup.sh
```

Wait for it to complete. When done:

```bash
sudo reboot
```

---

## Step 6: Start Service (2 minutes)

After reboot, reconnect via SSH:

```bash
ssh pi@raspberrypi.local

# Enable and start the service
sudo systemctl enable victron-collector.service
sudo systemctl start victron-collector.service

# Check it's running
sudo systemctl status victron-collector.service
```

You should see: `Active: active (running)` in green

---

## Step 7: View Logs (1 minute)

```bash
sudo journalctl -u victron-collector.service -f
```

You should see:
```
✓ Sent metrics - Battery: 12.45V, SOC: 85.2%, Solar: 125W
```

Press `Ctrl+C` to stop viewing logs.

---

## Step 8: Check Dashboard (2 minutes)

Open your web browser and go to your dashboard URL. You should see:
- Real-time battery status
- Solar power generation
- Live updates every few seconds

---

## Done! 🎉

Your system is now running. The data collector will:
- Start automatically on boot
- Reconnect automatically if connection drops
- Send data every 5 seconds
- Log history every minute

---

## Troubleshooting

### No data showing?

```bash
# Check service status
sudo systemctl status victron-collector.service

# View logs for errors
sudo journalctl -u victron-collector.service -n 50
```

### Permission denied error?

```bash
# Add user to dialout group
sudo usermod -a -G dialout pi

# Reboot for changes to take effect
sudo reboot
```

### Can't find USB device?

```bash
# Check USB ports
ls -l /dev/ttyUSB*

# If you see a different port (like ttyUSB1), edit the script:
nano ~/victron-solar/victron_collector.py

# Find: SERIAL_PORT = "/dev/ttyUSB0"
# Change to your port
```

### Want to test without hardware?

```bash
# Use the test data generator
cd ~/victron-solar
python3 test_data_generator.py
```

---

## Useful Commands

```bash
# Start service
sudo systemctl start victron-collector.service

# Stop service
sudo systemctl stop victron-collector.service

# Restart service
sudo systemctl restart victron-collector.service

# View live logs
sudo journalctl -u victron-collector.service -f

# Test manually
cd ~/victron-solar
python3 victron_collector.py
```

---

## Support

See `SETUP_GUIDE.md` for detailed troubleshooting and configuration options.
