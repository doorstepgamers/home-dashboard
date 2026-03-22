# Installation Options
## Choose the best setup method for you

You have several ways to set up your Raspberry Pi. Choose based on your experience level and available time.

---

## Option 1: Full Automated Setup ⭐ RECOMMENDED

**Best for:** Everyone, especially beginners
**Time:** 30 minutes
**Difficulty:** Easy

### What you do:
1. Flash SD card with Raspberry Pi Imager (configure WiFi and SSH)
2. Boot Pi and connect via SSH
3. Copy files to Pi
4. Run automated setup script
5. Done!

### Follow: [QUICK_START.md](QUICK_START.md)

**Pros:**
- Fastest method
- Least chance of errors
- Automatically detects USB port
- Sets up service auto-start
- One command does everything

**Cons:**
- Less understanding of what's happening
- Requires basic SSH knowledge

---

## Option 2: Step-by-Step Manual Setup

**Best for:** Those who want to understand every step
**Time:** 1-2 hours
**Difficulty:** Intermediate

### What you do:
1. Flash SD card
2. Boot Pi
3. Manually install each dependency
4. Configure each service
5. Test each component

### Follow: [SETUP_GUIDE.md](SETUP_GUIDE.md)

**Pros:**
- Full understanding of system
- Can customize each step
- Better troubleshooting knowledge
- Learn Linux/Raspberry Pi skills

**Cons:**
- Takes longer
- More places to make mistakes
- More manual configuration

---

## Option 3: Test First Without Hardware

**Best for:** Want to test dashboard before buying hardware
**Time:** 15 minutes
**Difficulty:** Very Easy

### What you do:
1. Skip Raspberry Pi setup completely
2. Run test data generator from your computer
3. Watch dashboard with simulated data
4. Set up Pi later when ready

### Steps:

```bash
# On your computer (Mac/Linux/Windows with Python)
cd raspberry-pi
pip3 install requests
python3 test_data_generator.py
```

Then open your dashboard and watch it update with realistic solar data!

**Pros:**
- No hardware needed initially
- See how dashboard works
- Decide if system meets your needs
- Great for development

**Cons:**
- Not real data from your system
- Still need to set up Pi eventually

---

## Comparison Table

| Feature | Automated Setup | Manual Setup | Test Mode |
|---------|----------------|--------------|-----------|
| Time Required | 30 min | 1-2 hours | 15 min |
| Hardware Needed | Pi + Victron | Pi + Victron | Computer only |
| Difficulty | Easy | Medium | Very Easy |
| Learning | Some | Lots | Minimal |
| Customization | Limited | Full | N/A |
| Troubleshooting | Automatic | Manual | None needed |
| Production Ready | Yes | Yes | No |

---

## Recommended Path

### For Most Users:
1. **Start with Test Mode** (15 min)
   - Verify dashboard works
   - See what data looks like
   - Decide if you want to proceed

2. **Do Automated Setup** (30 min)
   - Quick and reliable
   - Gets you up and running
   - Minimal chance of errors

3. **Read Manual Guide** (optional)
   - Understand what was configured
   - Learn for future troubleshooting
   - Customize if needed

### For Advanced Users:
1. **Go straight to Manual Setup**
   - Full control
   - Custom configuration
   - Deep understanding

---

## Before You Start (Any Method)

### Check You Have:
- [ ] Raspberry Pi 3B or newer
- [ ] MicroSD card (8GB minimum)
- [ ] SD card reader for your computer
- [ ] VE.Direct to USB cable
- [ ] Power supply for Pi
- [ ] Internet connection (WiFi or Ethernet)
- [ ] Computer to configure SD card

### Skills Required:
- [ ] Basic computer skills
- [ ] Can follow step-by-step instructions
- [ ] (Optional) SSH/terminal experience helpful but not required

---

## Getting Help

### Before Starting:
- Read [SETUP_GUIDE.md](SETUP_GUIDE.md) FAQ section
- Check you have all hardware
- Ensure Victron device is working

### During Setup:
- Follow instructions exactly
- Don't skip steps
- Check logs if something fails
- Try automated setup if manual fails

### After Setup:
- Use troubleshooting section
- Check service logs
- Run test data generator to verify dashboard
- Restart service if needed

---

## What Gets Installed

Regardless of method, your system will have:

### Software:
- Python 3.x
- pyserial library (for VE.Direct communication)
- requests library (for Supabase API)
- victron_collector.py (main data collector)
- Systemd service (for auto-start)

### Configuration:
- Serial port settings (19200 baud, /dev/ttyUSB0)
- Supabase connection details
- Update intervals (5s for data, 60s for history)
- Service auto-start on boot

### File Structure:
```
/home/pi/victron-solar/
├── victron_collector.py      (Main script)
├── test_data_generator.py    (Testing tool)
└── requirements.txt           (Dependencies)

/etc/systemd/system/
└── victron-collector.service  (Auto-start service)
```

---

## Post-Installation

### What Happens After Setup:
1. Service starts automatically
2. Connects to VE.Direct device
3. Reads data every 5 seconds
4. Sends to Supabase
5. Dashboard updates in real-time
6. History logged every minute
7. Alerts created for low battery, etc.

### How to Verify It's Working:
```bash
# Check service is running
sudo systemctl status victron-collector.service

# Should show: Active: active (running) in green

# View live data
sudo journalctl -u victron-collector.service -f

# Should show: ✓ Sent metrics - Battery: 12.45V, SOC: 85.2%
```

### Access Dashboard:
- Open web browser
- Go to your dashboard URL
- You should see live data updating
- Charts should populate with history

---

## Estimated Total Costs

### Hardware:
- Raspberry Pi 3B+: $35-45
- MicroSD Card: $8-12
- VE.Direct Cable: $25-35
- Power Adapter: $10-15
- Case (optional): $8-15
- **Total Hardware:** $86-122

### Time Investment:
- Automated Setup: 30 minutes
- Manual Setup: 1-2 hours
- Learning/Reading: 1-2 hours
- Testing/Validation: 30 minutes

### Technical Skills:
- None to minimal required
- Guides cover everything step-by-step
- Copy-paste commands provided
- Automated scripts handle complexity

---

## Next Steps

Choose your installation method and get started:

1. **Quick & Easy:** [QUICK_START.md](QUICK_START.md)
2. **Detailed Guide:** [SETUP_GUIDE.md](SETUP_GUIDE.md)
3. **Hardware Connections:** [WIRING_GUIDE.md](WIRING_GUIDE.md)
4. **Print Reference:** [PRINTABLE_REFERENCE.txt](PRINTABLE_REFERENCE.txt)

**Questions before starting?** Read the FAQ in SETUP_GUIDE.md

**Ready to begin?** Start with QUICK_START.md

**Want to test first?** Run test_data_generator.py from your computer

---

Good luck with your solar monitoring setup! 🌞🔋⚡
