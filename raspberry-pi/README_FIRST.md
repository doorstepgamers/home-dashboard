# 👋 Start Here!

Welcome to the Raspberry Pi setup for your Victron Solar Monitoring System!

## 📖 Documentation Overview

This folder contains everything you need to set up your Raspberry Pi. Here's what each file does:

### 🪟 Windows Installer (EASIEST FOR WINDOWS!)
**[WINDOWS_SETUP.md](WINDOWS_SETUP.md)** - Prepares SD card from Windows!
- Double-click `install.bat` to run
- Writes everything to SD card
- Configures WiFi automatically
- Just insert SD and boot Pi
- 45-minute one-time setup

### 🖱️ Graphical Wizard (EASIEST FOR RASPBERRY PI!)
**[GUI_SETUP.md](GUI_SETUP.md)** - Point-and-click setup on Raspberry Pi
- Graphical interface with buttons
- Automatic hardware detection
- Visual progress tracking
- Perfect for beginners
- 15-minute setup

### 🚀 Quick Start
**[QUICK_START.md](QUICK_START.md)** - Fast automated command-line setup
- 30-minute automated installation
- Step-by-step checklist format
- One script does everything
- For those comfortable with terminal

### 📚 Complete Guide
**[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Comprehensive manual for everything
- Complete setup from scratch
- SD card preparation to production
- Detailed troubleshooting
- Command reference
- Best for learning how everything works

### 🔌 Hardware Setup
**[WIRING_GUIDE.md](WIRING_GUIDE.md)** - Physical connection instructions
- How to connect cables
- VE.Direct port location
- Raspberry Pi port reference
- Cable routing tips
- Safety considerations

### ⚙️ Installation Comparison
**[INSTALLATION_OPTIONS.md](INSTALLATION_OPTIONS.md)** - Compare setup methods
- Which method is right for you?
- Time and difficulty comparison
- Cost breakdown
- Pros and cons of each approach

### 📋 Quick Reference
**[PRINTABLE_REFERENCE.txt](PRINTABLE_REFERENCE.txt)** - Print and keep in your van
- Common commands
- Troubleshooting steps
- System information
- Maintenance schedule

---

## 🎯 Recommended Path

### First Time Users (Easiest Path):

1. **Connect Hardware** using [WIRING_GUIDE.md](WIRING_GUIDE.md) (15 min)
   - Connect VE.Direct cable
   - Mount Raspberry Pi
   - Connect power

2. **Run Setup Wizard** using [GUI_SETUP.md](GUI_SETUP.md) (15 min)
   - Graphical interface - no commands!
   - Just click through the steps
   - Gets you running fast

3. **Print** [PRINTABLE_REFERENCE.txt](PRINTABLE_REFERENCE.txt)
   - Keep for future reference
   - Troubleshooting at a glance

### Alternative Path (Command Line):

1. **Read** [INSTALLATION_OPTIONS.md](INSTALLATION_OPTIONS.md) (5 min)
2. **Connect Hardware** - [WIRING_GUIDE.md](WIRING_GUIDE.md) (15 min)
3. **Install Software** - [QUICK_START.md](QUICK_START.md) (30 min)
4. **Print Reference** - [PRINTABLE_REFERENCE.txt](PRINTABLE_REFERENCE.txt)

### Advanced Users:

1. **Connect Hardware** - [WIRING_GUIDE.md](WIRING_GUIDE.md)
2. **Manual Setup** - [SETUP_GUIDE.md](SETUP_GUIDE.md)
3. **Deep Dive** - Read all documentation

---

## 📦 What's Included

### Scripts:
- **`setup.sh`** - Automated installation script
- **`victron_collector.py`** - Main data collector
- **`test_data_generator.py`** - For testing without hardware
- **`requirements.txt`** - Python dependencies

### Documentation:
- **`QUICK_START.md`** - Fast setup checklist
- **`SETUP_GUIDE.md`** - Complete manual
- **`WIRING_GUIDE.md`** - Hardware connections
- **`INSTALLATION_OPTIONS.md`** - Method comparison
- **`PRINTABLE_REFERENCE.txt`** - Quick reference card
- **`README.md`** - Original simple guide

---

## ⚡ Super Quick Start

### Option 1: Windows Installer (Easiest!)

**On Windows computer:**
1. Download this folder
2. Double-click `install.bat`
3. Follow the wizard (45 min)
4. Insert SD card into Pi
5. Power on - done!

Full instructions in [WINDOWS_SETUP.md](WINDOWS_SETUP.md)

### Option 2: Graphical Wizard (On Raspberry Pi)

```bash
# 1. Flash SD card with Raspberry Pi Imager (enable SSH + WiFi)
# 2. Boot Pi and connect via SSH
ssh pi@raspberrypi.local

# 3. Copy files to Pi (run this on your computer)
scp -r raspberry-pi pi@raspberrypi.local:~/

# 4. Run the wizard (on the Pi)
cd ~/raspberry-pi
python3 setup_wizard.py

# 5. Follow the graphical steps - done!
```

Full instructions in [GUI_SETUP.md](GUI_SETUP.md)

### Option 3: Command Line

```bash
# 1-3. Same as above (Flash SD, boot, copy files)

# 4. Run setup script (on the Pi)
cd ~/raspberry-pi
chmod +x setup.sh
./setup.sh

# 5. Reboot
sudo reboot

# 6. After reboot, enable service
sudo systemctl enable victron-collector.service
sudo systemctl start victron-collector.service

# Done! Check dashboard.
```

Full instructions in [QUICK_START.md](QUICK_START.md)

---

## 🧪 Test Without Hardware

Want to test the dashboard before setting up the Raspberry Pi?

```bash
# Run from any computer with Python
cd raspberry-pi
pip3 install requests
python3 test_data_generator.py
```

This generates realistic solar data so you can see the dashboard in action!

---

## ❓ Common Questions

**Q: Which Raspberry Pi do I need?**
A: Raspberry Pi 3B or newer. Pi 3B+, Pi 4, or Pi Zero 2 W all work great.

**Q: Can I use Bluetooth instead of USB?**
A: USB is recommended for reliability. Bluetooth is possible but requires additional setup.

**Q: How much does this cost?**
A: Total hardware cost: $86-122 (Pi, SD card, cables, power adapter)

**Q: How long does setup take?**
A: 30 minutes with automated setup, 1-2 hours for manual

**Q: Do I need to know Linux?**
A: No! The guides provide all commands. Just copy and paste.

**Q: What if something goes wrong?**
A: Check the Troubleshooting section in SETUP_GUIDE.md

**Q: Can I access the dashboard from my phone?**
A: Yes! The dashboard works on any device with a web browser.

---

## 🆘 Getting Help

1. **Check troubleshooting** in [SETUP_GUIDE.md](SETUP_GUIDE.md)
2. **Review logs**: `sudo journalctl -u victron-collector.service -f`
3. **Test manually**: `python3 ~/victron-solar/victron_collector.py`
4. **Use test data**: `python3 test_data_generator.py`

---

## ✅ Success Checklist

After setup, verify everything works:

- [ ] Pi boots and connects to network
- [ ] Can SSH into Pi
- [ ] Service is running (green "active")
- [ ] Logs show data being sent
- [ ] Dashboard displays live data
- [ ] Charts are populating
- [ ] No error messages

If all checked, you're good to go! 🎉

---

## 📱 Mobile Access

Your dashboard URL works from anywhere:
- Desktop computer
- Laptop
- Phone
- Tablet
- Any device with internet and a browser

Just bookmark the URL for quick access!

---

## 🔧 System Files

After installation, you'll have:

```
/home/pi/victron-solar/
├── victron_collector.py
├── test_data_generator.py
└── requirements.txt

/etc/systemd/system/
└── victron-collector.service
```

---

## 🎓 What You'll Learn

Even with automated setup, you'll learn:
- How to use Raspberry Pi
- Basic Linux commands
- SSH remote access
- Service management with systemd
- Serial communication basics
- Data logging and monitoring

---

## 🚀 Ready to Begin?

Choose your path:

**Fast Track** → [QUICK_START.md](QUICK_START.md)
**Learn Everything** → [SETUP_GUIDE.md](SETUP_GUIDE.md)
**Connect Hardware** → [WIRING_GUIDE.md](WIRING_GUIDE.md)

---

**Good luck with your solar monitoring setup!** ☀️🔋⚡

Have questions? Everything is documented in the guides above.
