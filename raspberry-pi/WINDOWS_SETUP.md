# Windows Installer Guide

**The easiest way to set up your Raspberry Pi from Windows!**

## What is This?

A graphical Windows application that prepares your SD card with everything needed. No command line, no SSH, no manual configuration - just click through a wizard and your SD card is ready!

## Features

✓ **100% Graphical** - No command line needed
✓ **Automatic Setup** - Installs everything for you
✓ **SD Card Writer** - Writes directly to your SD card
✓ **WiFi Configuration** - Sets up your network automatically
✓ **Database Setup** - Configures dashboard connection
✓ **Ready to Go** - Just insert SD card and power on!

## Requirements

- **Windows 10 or 11**
- **Administrator access**
- **Internet connection**
- **SD card reader**
- **8GB+ SD card**
- **30-45 minutes**

## Quick Start

### Step 1: Download the Installer

Get the installer files:
1. Download this entire `raspberry-pi` folder
2. Save it somewhere easy to find (like Desktop or Downloads)

### Step 2: Run the Installer

**Right-click** `windows_installer.py` and select **"Run as Administrator"**

Or from command prompt:
```cmd
cd raspberry-pi
python windows_installer.py
```

### Step 3: Follow the Wizard

The installer has 7 easy steps - just click through them!

## Installer Steps

### 1. Welcome Screen
- Overview of what will happen
- Time estimate
- What you need

### 2. System Requirements Check
- Verifies Windows version
- Checks administrator access
- Confirms internet connection
- Validates disk space

### 3. Download Raspberry Pi Imager
- Opens download page
- Guides you through installation
- Verifies it's installed correctly

### 4. SD Card Selection
- Scans for SD card automatically
- Shows all removable drives
- Warns about data loss
- Lets you select correct drive

### 5. WiFi & System Configuration
- Enter your WiFi network name and password
- Set Raspberry Pi password
- Configure dashboard connection (Supabase URL and key)
- All settings saved automatically

### 6. Write SD Card
- Shows configuration summary
- Launches Raspberry Pi Imager
- Guides you through writing process
- Copies monitoring software to card

### 7. Complete
- Shows final instructions
- Explains what happens on first boot
- Provides useful commands
- Done!

## After SD Card is Ready

1. **Safely eject SD card** from Windows
2. **Insert into Raspberry Pi**
3. **Connect VE.Direct USB cable**
4. **Connect power**
5. **Wait 2-3 minutes**
6. **Check your dashboard** - it's working!

## What Gets Installed Automatically

On first boot, your Raspberry Pi will:
- Connect to your WiFi
- Install Python libraries
- Set up data collector
- Configure auto-start service
- Begin sending data to dashboard

All of this happens automatically - you don't need to do anything!

## Screenshots

The installer looks like this:

```
╔════════════════════════════════════════════════════════════════╗
║  Victron Solar Monitor - Windows Installer                    ║
╠════════════════════════════════════════════════════════════════╣
║  [████████████████████░░░░░░░░░░░░] 60%                       ║
║                                                                ║
║  ┌──────────────────────────────────────────────────────────┐ ║
║  │         WiFi & System Configuration                      │ ║
║  │                                                          │ ║
║  │  WiFi Settings                                          │ ║
║  │  ┌────────────────────────────────────────────────────┐ │ ║
║  │  │ WiFi Network Name:  [MyHomeWiFi____________]       │ │ ║
║  │  │ WiFi Password:      [••••••••••____________]       │ │ ║
║  │  └────────────────────────────────────────────────────┘ │ ║
║  │                                                          │ ║
║  │  Raspberry Pi Settings                                  │ ║
║  │  ┌────────────────────────────────────────────────────┐ │ ║
║  │  │ Pi Password:        [••••••••••____________]       │ │ ║
║  │  │ Username will be: pi                               │ │ ║
║  │  └────────────────────────────────────────────────────┘ │ ║
║  │                                                          │ ║
║  │  Dashboard Configuration                                │ ║
║  │  ┌────────────────────────────────────────────────────┐ │ ║
║  │  │ Supabase URL:       [https://...supabase.co]      │ │ ║
║  │  │ Supabase Key:       [eyJhb...____________]         │ │ ║
║  │  └────────────────────────────────────────────────────┘ │ ║
║  └──────────────────────────────────────────────────────────┘ ║
║                                                                ║
║  [← Back]                                        [Next →]      ║
╚════════════════════════════════════════════════════════════════╝
```

## Troubleshooting

### Installer won't start

**Error: "No module named 'tkinter'"**

Reinstall Python and make sure to check "tcl/tk" option during installation.

**Error: "Not Administrator"**

Right-click the installer and select "Run as Administrator"

### Can't find SD card

1. Insert SD card
2. Make sure it shows in File Explorer
3. Click "Refresh Drives" in installer
4. If still not found, try a different SD card reader

### Raspberry Pi Imager won't install

Download manually from: https://www.raspberrypi.com/software/

Install it, then continue with the wizard.

### SD card write fails

1. Make sure SD card isn't write-protected (check physical switch)
2. Format SD card first (FAT32)
3. Try a different SD card
4. Ensure SD card is at least 8GB

### Pi won't connect to WiFi

1. Check WiFi name and password are correct
2. Make sure you're using 2.4GHz WiFi (not 5GHz)
3. Pi must be within range of WiFi
4. Try connecting Pi to ethernet instead

### No data appearing on dashboard

1. Wait 5 minutes after first boot
2. Check VE.Direct cable is connected
3. Verify Victron device is powered on
4. Check Supabase URL and key are correct

## Advanced Options

### Manual Configuration

If you prefer to manually configure:
1. Use Raspberry Pi Imager directly
2. Flash Raspberry Pi OS
3. Enable SSH and WiFi in settings
4. After boot, copy files and run setup script

See [QUICK_START.md](QUICK_START.md) for instructions.

### Custom Serial Port

If your device isn't on `/dev/ttyUSB0`:
1. After Pi boots, SSH in
2. Edit `/home/pi/victron-solar/victron_collector.py`
3. Change `SERIAL_PORT` variable
4. Restart: `sudo systemctl restart victron-collector.service`

### Testing Without Hardware

Want to test the dashboard first?
1. Use [test_data_generator.py](test_data_generator.py)
2. Run on Windows to send fake data
3. Verify dashboard works
4. Then set up real Pi

## Comparison: Installer vs Manual

| Feature | Windows Installer | Manual Setup |
|---------|------------------|--------------|
| Difficulty | Very Easy | Hard |
| Time | 45 min | 2-3 hours |
| Technical skill | None | Medium-High |
| Windows only | Yes | No |
| Configures WiFi | Yes | Manual |
| Installs software | Automatic | Manual |
| Error handling | Guided | DIY |
| Best for | Beginners | Advanced users |

## What Makes This Special?

Unlike other installers, this one:
- **Configures everything** - WiFi, database, serial port
- **No SSH needed** - Everything done from Windows
- **No manual steps** - Insert SD card and it works
- **Validates settings** - Checks everything before writing
- **Creates bootable system** - First boot does everything
- **Production ready** - Auto-starts on boot

## System Architecture

What gets created:

```
SD Card
├── Raspberry Pi OS (written by Imager)
├── /boot/
│   └── (WiFi config from Imager)
└── /home/pi/victron-solar/
    ├── victron_collector.py
    ├── .env (your settings)
    ├── requirements.txt
    └── auto_setup.sh (runs on first boot)
```

On first boot:
1. Pi connects to WiFi
2. `auto_setup.sh` runs automatically
3. Installs Python packages
4. Creates systemd service
5. Starts data collection
6. Sends data to dashboard

## Security Notes

- WiFi password is stored in plain text on SD card
- Supabase key is stored in `.env` file
- Pi password should be changed after setup
- Use read-only Supabase keys if possible
- Keep SD card secure

## Support

### Installer Issues
- Check you're running as Administrator
- Verify Python and tkinter are installed
- Try manual setup as fallback

### Hardware Issues
- See [WIRING_GUIDE.md](WIRING_GUIDE.md)
- Check USB cable is VE.Direct compatible
- Verify Victron device is powered

### Software Issues
- SSH into Pi: `ssh pi@raspberrypi.local`
- Check logs: `sudo journalctl -u victron-collector.service`
- Restart: `sudo systemctl restart victron-collector.service`

## Alternative Methods

If Windows Installer doesn't work for you:

**On Raspberry Pi directly:**
- [GUI_SETUP.md](GUI_SETUP.md) - Graphical wizard on Pi

**Command line (any platform):**
- [QUICK_START.md](QUICK_START.md) - Fast automated setup
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Complete manual

**Testing first:**
- [test_data_generator.py](test_data_generator.py) - Test dashboard

## FAQ

**Q: Do I need to know Linux?**
A: No! The installer handles everything. Just insert the SD card and power on.

**Q: Can I use this on Mac?**
A: No, this is Windows-only. Use the GUI wizard or automated script on Mac/Linux.

**Q: Will this work with Raspberry Pi Zero?**
A: Yes, but use Raspberry Pi OS Lite for better performance.

**Q: Can I change settings later?**
A: Yes, SSH into the Pi and edit `/home/pi/victron-solar/.env`

**Q: How long does first boot take?**
A: 2-5 minutes depending on internet speed. Be patient!

**Q: What if I don't have Supabase credentials yet?**
A: Set up your dashboard first, get the credentials, then run the installer.

**Q: Can I set up multiple Pis?**
A: Yes! Run the installer for each SD card. Each Pi sends data to the same dashboard.

**Q: Is this the official Victron software?**
A: No, this is a custom open-source solution for monitoring via VE.Direct.

## Summary

The Windows Installer is the easiest way to get started:

1. **Download installer** (this folder)
2. **Run `windows_installer.py`** as Administrator
3. **Click through wizard** (45 minutes)
4. **Insert SD card into Pi**
5. **Power on**
6. **Done!**

No technical knowledge required. No command line. No SSH. Just point, click, and go!

---

**Need help?** Check the other guides in this folder or the main README.md
