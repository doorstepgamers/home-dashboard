# Raspberry Pi Documentation Index

Complete guide index for setting up your Victron Solar Monitoring System.

## 📖 Start Here

**New to this project?** Start with [README_FIRST.md](README_FIRST.md) for an overview.

---

## 📚 Setup Guides (Choose One)

### [WINDOWS_SETUP.md](WINDOWS_SETUP.md) ⭐ EASIEST (Windows Only)
**45-minute SD card preparation from Windows**
- Double-click installer - no commands!
- Writes everything to SD card
- Configures WiFi automatically
- Just insert SD and boot Pi
- Best for: Windows users who want zero terminal work

### [GUI_SETUP.md](GUI_SETUP.md) ⭐ EASIEST (On Raspberry Pi)
**15-minute graphical wizard**
- Point-and-click interface
- Automatic hardware detection
- Visual progress tracking
- No terminal commands
- Best for: Users who prefer graphical interfaces

### [QUICK_START.md](QUICK_START.md) ⭐ RECOMMENDED
**30-minute automated setup**
- Fast command-line setup
- Automated installation script
- Step-by-step checklist
- Minimal troubleshooting needed
- Best for: Users comfortable with terminal

### [SETUP_GUIDE.md](SETUP_GUIDE.md)
**1-2 hour comprehensive manual setup**
- Complete control over every step
- Detailed explanations
- Deep troubleshooting section
- Learn how everything works
- Best for: Advanced users, learners

---

## 🔧 Technical Guides

### [WIRING_GUIDE.md](WIRING_GUIDE.md)
**Physical hardware connection guide**
- How to connect VE.Direct cable
- Raspberry Pi port reference
- Cable routing and management
- Safety considerations
- Mounting tips
- Estimated: 15-30 minutes

### [INSTALLATION_OPTIONS.md](INSTALLATION_OPTIONS.md)
**Compare all setup methods**
- Which method is right for you?
- Time and difficulty ratings
- Pros and cons
- Cost breakdown
- Recommended paths

---

## 📋 Reference Materials

### [PRINTABLE_REFERENCE.txt](PRINTABLE_REFERENCE.txt)
**Quick reference card - print and keep in van**
- Common commands
- Troubleshooting steps
- System information
- Maintenance checklist
- Emergency procedures

---

## 🛠️ Scripts and Tools

### [setup.sh](setup.sh)
**Automated installation script**
- Run this for automatic setup
- Installs all dependencies
- Configures services
- Detects hardware
- Usage: `./setup.sh`

### [victron_collector.py](victron_collector.py)
**Main data collection service**
- Reads VE.Direct protocol
- Sends data to Supabase
- Handles reconnection
- Logs history
- Auto-started by systemd

### [test_data_generator.py](test_data_generator.py)
**Simulated data generator for testing**
- Test dashboard without hardware
- Generates realistic solar data
- Simulates day/night cycles
- Usage: `python3 test_data_generator.py`

### [requirements.txt](requirements.txt)
**Python dependencies**
- pyserial - for serial communication
- requests - for API calls
- Install: `pip3 install -r requirements.txt`

---

## 📖 Documentation by Task

### Getting Started
1. [README_FIRST.md](README_FIRST.md) - Overview
2. [INSTALLATION_OPTIONS.md](INSTALLATION_OPTIONS.md) - Choose method
3. [WIRING_GUIDE.md](WIRING_GUIDE.md) - Connect hardware
4. [QUICK_START.md](QUICK_START.md) or [SETUP_GUIDE.md](SETUP_GUIDE.md) - Install

### Running the System
- [QUICK_START.md](QUICK_START.md) - Start/stop commands
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Service management
- [PRINTABLE_REFERENCE.txt](PRINTABLE_REFERENCE.txt) - Command reference

### Troubleshooting
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Comprehensive troubleshooting
- [QUICK_START.md](QUICK_START.md) - Common issues
- [PRINTABLE_REFERENCE.txt](PRINTABLE_REFERENCE.txt) - Quick fixes

### Testing
- [test_data_generator.py](test_data_generator.py) - Simulate data
- [QUICK_START.md](QUICK_START.md) - Verification steps
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Testing procedures

### Maintenance
- [PRINTABLE_REFERENCE.txt](PRINTABLE_REFERENCE.txt) - Maintenance schedule
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Performance tips
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Backup procedures

---

## 🎯 Quick Navigation

### By Experience Level

**Beginner:**
1. [README_FIRST.md](README_FIRST.md)
2. [WIRING_GUIDE.md](WIRING_GUIDE.md)
3. [QUICK_START.md](QUICK_START.md)

**Intermediate:**
1. [INSTALLATION_OPTIONS.md](INSTALLATION_OPTIONS.md)
2. [SETUP_GUIDE.md](SETUP_GUIDE.md)
3. [WIRING_GUIDE.md](WIRING_GUIDE.md)

**Advanced:**
1. [SETUP_GUIDE.md](SETUP_GUIDE.md)
2. [victron_collector.py](victron_collector.py) - Read the code
3. [INSTALLATION_OPTIONS.md](INSTALLATION_OPTIONS.md) - Customize

### By Time Available

**15 minutes:**
- Test with [test_data_generator.py](test_data_generator.py)

**30 minutes:**
- [QUICK_START.md](QUICK_START.md) - Automated setup

**1-2 hours:**
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Manual setup

**Just browsing:**
- [README_FIRST.md](README_FIRST.md) - Overview
- [INSTALLATION_OPTIONS.md](INSTALLATION_OPTIONS.md) - Options

---

## 📊 File Statistics

| File | Purpose | Length | Audience |
|------|---------|--------|----------|
| README_FIRST.md | Overview | Short | Everyone |
| QUICK_START.md | Fast setup | Medium | Beginners |
| SETUP_GUIDE.md | Complete manual | Long | All levels |
| WIRING_GUIDE.md | Hardware | Medium | All levels |
| INSTALLATION_OPTIONS.md | Comparison | Short | Decision makers |
| PRINTABLE_REFERENCE.txt | Quick ref | Short | Daily users |
| setup.sh | Automation | Script | N/A |
| victron_collector.py | Main service | Script | Developers |
| test_data_generator.py | Testing | Script | Testers |

---

## 🔍 Find Information By Topic

### Serial Communication
- [victron_collector.py](victron_collector.py) - Implementation
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - VE.Direct protocol
- [WIRING_GUIDE.md](WIRING_GUIDE.md) - Cable connection

### Raspberry Pi Setup
- [QUICK_START.md](QUICK_START.md) - Fast method
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Detailed method
- [setup.sh](setup.sh) - Automated script

### Victron Devices
- [WIRING_GUIDE.md](WIRING_GUIDE.md) - Connections
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Protocol details
- [victron_collector.py](victron_collector.py) - Data parsing

### Dashboard
- [test_data_generator.py](test_data_generator.py) - Generate data
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Access info
- Main project README.md - Dashboard features

### Troubleshooting
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Comprehensive
- [QUICK_START.md](QUICK_START.md) - Common issues
- [PRINTABLE_REFERENCE.txt](PRINTABLE_REFERENCE.txt) - Quick fixes

### Commands
- [PRINTABLE_REFERENCE.txt](PRINTABLE_REFERENCE.txt) - Most common
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Complete list
- [QUICK_START.md](QUICK_START.md) - Essential only

---

## 💾 File Sizes

```
README_FIRST.md          ~6 KB   Overview and navigation
QUICK_START.md           ~4 KB   Fast setup checklist
SETUP_GUIDE.md          ~25 KB   Complete comprehensive guide
WIRING_GUIDE.md         ~18 KB   Hardware connection details
INSTALLATION_OPTIONS.md  ~8 KB   Method comparison
PRINTABLE_REFERENCE.txt  ~5 KB   Quick reference card
setup.sh                 ~4 KB   Automated setup script
victron_collector.py    ~12 KB   Main data collector
test_data_generator.py   ~7 KB   Test data simulator
requirements.txt         ~0.1 KB  Python dependencies
```

---

## 🗺️ Recommended Reading Order

### First-Time Setup (Start to Finish):

1. **[README_FIRST.md](README_FIRST.md)** (5 min)
   - Get oriented

2. **[INSTALLATION_OPTIONS.md](INSTALLATION_OPTIONS.md)** (10 min)
   - Decide on approach

3. **[WIRING_GUIDE.md](WIRING_GUIDE.md)** (15 min)
   - Connect hardware

4. **[QUICK_START.md](QUICK_START.md)** (30 min)
   - Do the installation

5. **[PRINTABLE_REFERENCE.txt](PRINTABLE_REFERENCE.txt)** (2 min)
   - Print for future use

**Total time: ~1 hour**

### Troubleshooting Session:

1. **[PRINTABLE_REFERENCE.txt](PRINTABLE_REFERENCE.txt)** - Try quick fixes
2. **[QUICK_START.md](QUICK_START.md)** - Common problems
3. **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Deep troubleshooting

### Learning Deep Dive:

1. **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Read completely
2. **[victron_collector.py](victron_collector.py)** - Study code
3. **[WIRING_GUIDE.md](WIRING_GUIDE.md)** - Understand hardware
4. **VE.Direct Protocol Docs** - External Victron documentation

---

## 🆘 Quick Help

**Where do I start?**
→ [README_FIRST.md](README_FIRST.md)

**How do I install it?**
→ [QUICK_START.md](QUICK_START.md)

**It's not working!**
→ [SETUP_GUIDE.md](SETUP_GUIDE.md) - Troubleshooting section

**How do I connect the cables?**
→ [WIRING_GUIDE.md](WIRING_GUIDE.md)

**Which method should I use?**
→ [INSTALLATION_OPTIONS.md](INSTALLATION_OPTIONS.md)

**What commands do I need?**
→ [PRINTABLE_REFERENCE.txt](PRINTABLE_REFERENCE.txt)

**Can I test without hardware?**
→ [test_data_generator.py](test_data_generator.py)

---

## 📞 Support Resources

**Documentation Issues:**
- Check the FAQ in [SETUP_GUIDE.md](SETUP_GUIDE.md)
- All common questions are answered there

**Hardware Problems:**
- [WIRING_GUIDE.md](WIRING_GUIDE.md) - Connection troubleshooting
- Victron support for device issues

**Software Problems:**
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Software troubleshooting
- Check service logs as documented

**General Questions:**
- Read [README_FIRST.md](README_FIRST.md) for overview
- [INSTALLATION_OPTIONS.md](INSTALLATION_OPTIONS.md) for comparisons

---

## ✅ Documentation Checklist

Before you start, make sure you have:

- [ ] Read [README_FIRST.md](README_FIRST.md)
- [ ] Chosen setup method from [INSTALLATION_OPTIONS.md](INSTALLATION_OPTIONS.md)
- [ ] Gathered all hardware (see [WIRING_GUIDE.md](WIRING_GUIDE.md))
- [ ] Selected guide: [QUICK_START.md](QUICK_START.md) or [SETUP_GUIDE.md](SETUP_GUIDE.md)
- [ ] Printed [PRINTABLE_REFERENCE.txt](PRINTABLE_REFERENCE.txt) for reference

---

**This documentation suite provides everything you need to successfully set up and maintain your solar monitoring system. Choose your starting point above and begin!**
