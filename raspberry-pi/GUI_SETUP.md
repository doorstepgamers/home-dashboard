# Graphical Setup Wizard

**Easy setup with no terminal commands required!**

## What is This?

The Setup Wizard is a graphical interface that guides you through the entire Raspberry Pi setup process with buttons and forms instead of terminal commands.

## Features

✓ **No terminal commands** - Everything is point-and-click
✓ **Automatic hardware detection** - Finds your USB device automatically
✓ **Visual progress** - See what's happening at each step
✓ **Built-in testing** - Tests your connection before finishing
✓ **Error-proof** - Validates everything before proceeding

## Quick Start

### Step 1: Prepare Your Raspberry Pi

1. **Flash SD card** with Raspberry Pi OS using Raspberry Pi Imager
   - Download from: https://www.raspberrypi.com/software/
   - Enable SSH and configure WiFi in the settings (⚙️ gear icon)

2. **Boot your Pi** and connect via SSH:
   ```bash
   ssh pi@raspberrypi.local
   ```

### Step 2: Transfer and Run the Wizard

**From your computer**, copy the files to your Pi:
```bash
scp -r raspberry-pi pi@raspberrypi.local:~/
```

**On the Raspberry Pi**, start the wizard:
```bash
cd ~/raspberry-pi
python3 setup_wizard.py
```

That's it! The wizard will open and guide you through everything.

## Wizard Steps

The wizard has 6 easy steps:

### 1. Welcome Screen
- Overview of what will be installed
- Checklist of prerequisites

### 2. Hardware Detection
- Automatically scans for USB serial devices
- Shows all available ports
- You just click to select your device

### 3. Software Installation
- Installs Python libraries automatically
- Shows progress in real-time
- No commands needed

### 4. Configuration
- Review your settings
- Choose if you want auto-start on boot
- Everything pre-filled for you

### 5. Connection Test
- Tests connection to your Victron device
- Shows live data from your equipment
- Verifies everything works before finishing

### 6. Complete
- Summary of what was set up
- Useful commands for later (optional)
- Click "Finish" and you're done!

## Screenshots

The wizard looks like this:

```
╔══════════════════════════════════════════════════════════╗
║  Victron Solar Monitor - Setup Wizard                    ║
╠══════════════════════════════════════════════════════════╣
║  [████████████████████████░░░░░░░░░░░] 60%              ║
║                                                          ║
║  ┌────────────────────────────────────────────────────┐ ║
║  │         Hardware Detection                         │ ║
║  │                                                    │ ║
║  │  Looking for USB serial devices...                │ ║
║  │                                                    │ ║
║  │  Available Serial Ports:                          │ ║
║  │  ┌──────────────────────────────────────────────┐ │ ║
║  │  │ ▸ /dev/ttyUSB0                               │ │ ║
║  │  │   /dev/ttyUSB1                               │ │ ║
║  │  └──────────────────────────────────────────────┘ │ ║
║  │                                                    │ ║
║  │         [🔍 Detect Devices]                        │ ║
║  │                                                    │ ║
║  │  ✓ Found 2 device(s). Select one and click Next.  │ ║
║  └────────────────────────────────────────────────────┘ ║
║                                                          ║
║  [← Back]                                  [Next →]      ║
╚══════════════════════════════════════════════════════════╝
```

## What Gets Installed

The wizard automatically:
- Installs Python libraries (pyserial, requests)
- Sets up serial port permissions
- Copies the data collector script
- Configures the service
- Tests the connection
- Starts data collection

## After Setup

Once complete, your system will:
- Start automatically on boot
- Collect data every 5 seconds
- Send to your dashboard
- Reconnect automatically if connection drops

View your dashboard in any web browser!

## Troubleshooting

### Wizard won't start

**Error: "No module named 'tkinter'"**

Install tkinter:
```bash
sudo apt-get install python3-tk
```

Then try again:
```bash
python3 setup_wizard.py
```

### Can't connect via SSH

1. Make sure you enabled SSH in Raspberry Pi Imager
2. Try using IP address instead: `ssh pi@192.168.1.XXX`
3. Find IP from your router's admin page

### No USB devices found

1. Check VE.Direct cable is plugged in
2. Try a different USB port
3. Click "Detect Devices" button again
4. Make sure Victron device is powered on

### Wizard crashes or freezes

1. Close the wizard
2. Try running setup script instead:
   ```bash
   ./setup.sh
   ```
3. Or follow manual guide in SETUP_GUIDE.md

### Permission errors

Some steps require sudo. The wizard will prompt you when needed.

## Advantages Over Manual Setup

| Feature | Wizard | Manual |
|---------|--------|--------|
| Difficulty | Easy | Medium |
| Time | 15 min | 30-60 min |
| Terminal use | None | Lots |
| Visual feedback | Yes | Limited |
| Error messages | Clear | Technical |
| Auto-detection | Yes | Manual |
| Progress tracking | Yes | No |

## For Advanced Users

The wizard is great for quick setup, but if you want:
- Full control over configuration
- Understanding of each command
- Custom installation paths
- Learning Linux/Raspberry Pi

Use the manual guides instead:
- [QUICK_START.md](QUICK_START.md) - Command-line quick setup
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Complete manual

## System Requirements

- **Raspberry Pi**: Model 3B or newer
- **OS**: Raspberry Pi OS (Desktop or Lite)
- **Display**: The wizard needs a graphical display
- **Remote access**: Can use via X11 forwarding over SSH

## Running Remotely (Advanced)

If you want to run the wizard from your computer:

**On your computer** (Mac/Linux):
```bash
ssh -X pi@raspberrypi.local
cd ~/raspberry-pi
python3 setup_wizard.py
```

The window will appear on your computer!

**On Windows**:
1. Install VcXsrv or Xming
2. Use PuTTY or MobaXterm with X11 forwarding enabled
3. Connect and run the wizard

## Headless Alternative

If your Pi has no display and you can't use X11 forwarding, use:

**Option 1**: Web-based test data generator
```bash
python3 test_data_generator.py
```
Test your dashboard first, then do manual setup later

**Option 2**: Automated script
```bash
./setup.sh
```
One command, no GUI needed

**Option 3**: Manual setup
Follow [QUICK_START.md](QUICK_START.md) or [SETUP_GUIDE.md](SETUP_GUIDE.md)

## Support

- **Wizard issues**: Try automated script or manual setup
- **Hardware problems**: See [WIRING_GUIDE.md](WIRING_GUIDE.md)
- **After setup**: See [PRINTABLE_REFERENCE.txt](PRINTABLE_REFERENCE.txt)

## Summary

The Setup Wizard makes installation easy:
1. Copy files to your Pi
2. Run `python3 setup_wizard.py`
3. Follow the screens
4. Done!

No terminal commands, no confusion, just a simple step-by-step process!

---

**Prefer no GUI?** See [QUICK_START.md](QUICK_START.md) for automated command-line setup.
