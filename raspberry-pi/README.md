# Raspberry Pi Setup for Victron Solar Monitoring

**Choose your setup path:**

## 🖱️ Graphical Wizard (EASIEST!)
**Prefer clicking buttons over typing commands?** Use the Setup Wizard!

See **[GUI_SETUP.md](GUI_SETUP.md)** - Point-and-click setup in 15 minutes with no terminal commands.

## 🚀 Quick Start
**Comfortable with terminal?** Use the automated setup script!

See **[QUICK_START.md](QUICK_START.md)** - Get running in 30 minutes with step-by-step checklist.

## 📚 Detailed Guide
**Want complete control and understanding?** Follow the comprehensive guide!

See **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Complete guide from SD card to production, including troubleshooting.

---

## Simple Overview

This folder contains everything you need to set up your Raspberry Pi to collect data from your Victron devices and send it to the dashboard.

## Hardware Connection

1. Connect your Victron SmartShunt 300A to the Raspberry Pi using the VE.Direct to USB cable
2. The USB cable should be plugged into any available USB port on the Raspberry Pi
3. Power on the Raspberry Pi

## Software Installation

### 1. Update your Raspberry Pi

```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### 2. Install Python dependencies

```bash
pip3 install pyserial requests
```

### 3. Find your USB serial port

After connecting the VE.Direct USB cable, identify the port:

```bash
ls /dev/ttyUSB*
```

You should see something like `/dev/ttyUSB0` or `/dev/ttyUSB1`. Note this port name.

### 4. Configure the collector script

Edit the `victron_collector.py` file and update the `SERIAL_PORT` variable if needed:

```python
SERIAL_PORT = "/dev/ttyUSB0"  # Change if your port is different
```

### 5. Test the collector

Run the script manually to test:

```bash
python3 victron_collector.py
```

You should see output like:
```
Starting Victron Solar Data Collector...
Connected to /dev/ttyUSB0
✓ Sent metrics - Battery: 12.45V, SOC: 85.2%, Solar: 125W
```

Press Ctrl+C to stop.

## Setting up Auto-Start on Boot

To make the collector start automatically when the Raspberry Pi boots:

### 1. Create a systemd service

```bash
sudo nano /etc/systemd/system/victron-collector.service
```

### 2. Add this content:

```ini
[Unit]
Description=Victron Solar Data Collector
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/victron-solar
ExecStart=/usr/bin/python3 /home/pi/victron-solar/victron_collector.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 3. Enable and start the service

```bash
sudo systemctl daemon-reload
sudo systemctl enable victron-collector.service
sudo systemctl start victron-collector.service
```

### 4. Check service status

```bash
sudo systemctl status victron-collector.service
```

### 5. View logs

```bash
sudo journalctl -u victron-collector.service -f
```

## Troubleshooting

### Permission Denied Error

If you get a permission error accessing the serial port:

```bash
sudo usermod -a -G dialout $USER
```

Then log out and log back in.

### No Data Appearing

1. Check that the VE.Direct cable is properly connected
2. Verify the serial port is correct: `ls /dev/ttyUSB*`
3. Check the service logs: `sudo journalctl -u victron-collector.service -f`
4. Make sure your Victron device is powered on and functioning

### Connection Issues

If the script can't connect to Supabase:
1. Check your internet connection
2. Verify the Supabase URL and API key in the script

## VE.Direct Protocol Notes

The collector reads data using the Victron VE.Direct text protocol at 19200 baud. Key fields include:

- **V**: Battery voltage (mV)
- **I**: Battery current (mA)
- **SOC**: State of charge (0.1%)
- **P**: Instantaneous power (W)
- **CE**: Consumed Ah (mAh)
- **VPV**: Panel voltage (mV)
- **PPV**: Panel power (W)
- **CS**: Charge state

## Bluetooth Alternative

If you prefer to use Bluetooth instead of USB:

1. Install additional dependencies:
   ```bash
   pip3 install bleak
   ```

2. The Bluetooth implementation would require a different script (not included in this basic setup)

3. USB is recommended for reliability and continuous monitoring

## Support

For issues specific to:
- Victron devices: Refer to Victron documentation
- Raspberry Pi: Check Raspberry Pi forums
- Dashboard issues: Check the web dashboard logs
