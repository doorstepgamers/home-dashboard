# Hardware Connection Guide
## Physical Setup for Your Solar Monitoring System

## Overview

This guide shows you exactly how to connect your Raspberry Pi to your Victron solar equipment.

---

## What You're Connecting

```
Solar Panel → MPPT Charge Controller → Battery
                                       ↓
                                    SmartShunt (300A)
                                       ↓
                                    Inverter
```

**Data Collection:**
```
SmartShunt (VE.Direct Port) → VE.Direct USB Cable → Raspberry Pi → Internet → Dashboard
```

---

## Components Layout

### 1. Victron SmartShunt 300A

**Location in your van:** Between battery negative terminal and your electrical system

**Connections:**
- **Power Side:** Battery negative and system negative terminals
- **Data Side:** VE.Direct port (small RJ12-like connector on the side)

**VE.Direct Port:**
- Small 4-pin connector labeled "VE.Direct"
- Located on the side of the SmartShunt unit
- This is where you'll plug in the USB cable

### 2. VE.Direct to USB Cable

**What it looks like:**
- One end: Small RJ12-like connector (4-pin) for VE.Direct port
- Other end: Standard USB-A connector
- Usually about 1.5 meters (5 feet) long
- Often blue or black cable

**Where to buy:**
- Victron Part Number: ASS030530000
- Available from Victron dealers or Amazon
- Cost: ~$25-35

### 3. Raspberry Pi Placement

**Mounting considerations:**
- Keep it cool (avoid direct sunlight)
- Protect from moisture
- Accessible for maintenance
- Within USB cable reach of SmartShunt
- Near power source (or use a long USB cable)

---

## Step-by-Step Physical Connection

### Step 1: Locate VE.Direct Port

1. Find your Victron SmartShunt 300A
2. Look for the small port labeled "VE.Direct"
3. It's usually on the side of the unit
4. Remove any protective plug if present

### Step 2: Connect VE.Direct Cable

1. Take the VE.Direct to USB cable
2. Identify the small RJ12-like end (NOT the USB end)
3. Align it with the VE.Direct port on the SmartShunt
4. Gently push it in until it clicks
5. There's usually a small tab that locks it in place

**Important:** Don't force it! The connector should slide in easily with the correct orientation.

### Step 3: Route the Cable

1. Route the cable from SmartShunt to Raspberry Pi location
2. Avoid:
   - Sharp bends or kinks
   - Areas with high heat
   - Pinch points (doors, drawers)
   - Areas where it could be damaged
3. Use cable ties or clips to secure it
4. Leave some slack near both ends for strain relief

### Step 4: Connect to Raspberry Pi

1. Take the USB-A end of the cable
2. Plug it into any USB port on the Raspberry Pi
3. The Pi has 4 USB ports (on Pi 3B) - use any of them
4. Push it in firmly until seated

### Step 5: Power the Raspberry Pi

**Option A: USB Power from 12V System (Recommended for Van)**

1. Get a 12V to 5V USB adapter (cigarette lighter style)
2. Use quality adapter rated for at least 2.5A output
3. Connect USB power cable to the adapter
4. Plug adapter into your 12V outlet
5. Connect to Pi's power port (micro-USB on Pi 3)

**Recommended adapters:**
- Anker PowerDrive 2 Elite
- RAVPower 24W Car Charger
- Any quality 12V to 5V USB adapter with 2.5A+

**Option B: Official Raspberry Pi Power Supply**

1. Use official Raspberry Pi power adapter
2. Requires 120V AC outlet (inverter needed in van)
3. Plug into standard power outlet
4. Connect micro-USB to Pi's power port

---

## Connection Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    VAN ELECTRICAL SYSTEM                      │
└─────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │ Solar Panel  │
    └──────┬───────┘
           │
           ▼
    ┌─────────────────┐
    │  MPPT Charge    │ ← Can also connect VE.Direct cable here
    │  Controller     │   (instead of SmartShunt)
    │  (75/10)        │
    └─────────────────┘
           │
           ▼
    ┌─────────────────┐
    │    Battery      │
    │    (12V)        │
    └────────┬────────┘
             │
             ▼
    ┌──────────────────┐
    │  SmartShunt      │◄─── VE.Direct to USB Cable ────┐
    │  (300A)          │                                  │
    │  [VE.Direct] ●   │                                  │
    └──────────────────┘                                  │
             │                                            │
             ▼                                            │
    ┌──────────────────┐                                  │
    │    Inverter      │                                  │
    └──────────────────┘                                  │
             │                                            │
             ▼                                            │
    ┌──────────────────┐                          ┌──────▼────────┐
    │  12V Outlets     │──── 12V to USB ─────────►│ Raspberry Pi  │
    │  & Devices       │      Adapter              │               │
    └──────────────────┘                          │  [USB]  ●●●●  │
                                                   │  [PWR]  ●     │
                                                   │  [HDMI] ▄     │
                                                   │  [ETH]  █     │
                                                   └───────────────┘
                                                          │
                                                          │ WiFi/Ethernet
                                                          ▼
                                                   ╔═══════════════╗
                                                   ║   INTERNET    ║
                                                   ╚═══════════════╝
                                                          │
                                                          ▼
                                                   ┌───────────────┐
                                                   │   Supabase    │
                                                   │   Database    │
                                                   └───────────────┘
                                                          │
                                                          ▼
                                                   ┌───────────────┐
                                                   │  Dashboard    │
                                                   │  (Your Phone) │
                                                   └───────────────┘
```

---

## Raspberry Pi Port Reference

**Top View of Raspberry Pi 3 Model B:**

```
        ┌──────────────────────────────────────┐
        │                                      │
        │  ┌────────┐                          │
        │  │  CSI   │  Camera Port             │
        │  └────────┘                          │
        │                                      │
    ╔═══╧════╗                                 │
    ║ HDMI   ║                                 │
    ╚═══╤════╝                            ┌────┤
        │                             PWR │●   │  ← Power (Micro-USB)
    ╔═══╧════╗                            └────┤
    ║ Audio  ║                                 │
    ╚═══╤════╝                            ┌────┤
        │                             USB │●●  │  ← USB Ports
    ╔═══╧════════╗                        │●●  │  ← Plug VE.Direct cable here
    ║ Ethernet   ║                        └────┤
    ╚═══╤════════╝                             │
        │                                      │
        │  ┌────────┐                          │
        │  │  DSI   │  Display Port            │
        │  └────────┘                          │
        │                                      │
        │  [40-pin GPIO Header]                │
        │   ● ● ● ● ● ● ● ● ● ● ● ● ● ● ●    │
        │   ● ● ● ● ● ● ● ● ● ● ● ● ● ● ●    │
        │                                      │
        │                                      │
        │              Raspberry Pi 3B         │
        │                                      │
        └──────────────────────────────────────┘
```

---

## Alternative: Connect to MPPT Instead

If you want to read data from your MPPT charge controller instead of (or in addition to) the SmartShunt:

1. Locate VE.Direct port on BlueSolar MPPT 75/10
2. Connect VE.Direct to USB cable
3. Follow same steps as SmartShunt connection
4. Update the Python script if reading different data

**Note:** You can only connect ONE device at a time per USB port. To monitor multiple devices, you would need:
- Multiple VE.Direct to USB cables
- One cable per device
- Modify the Python script to read from multiple ports

---

## Physical Mounting Tips

### Mounting the Raspberry Pi

**Option 1: Case with Mounting Holes**
- Use official Raspberry Pi case or aftermarket
- Mount to wall with screws
- Ensure ventilation holes aren't blocked

**Option 2: DIN Rail Mount**
- If you have DIN rail in electrical cabinet
- Get DIN rail adapter for Raspberry Pi
- Snap onto rail

**Option 3: Velcro**
- Industrial strength velcro
- Clean surface first
- Allows easy removal for maintenance

### Cable Management

1. **Strain Relief:** Don't let cables hang with their full weight
2. **Cable Ties:** Use at regular intervals (every 6-12 inches)
3. **Protective Sheathing:** Use split loom or cable wrap in high-wear areas
4. **Labeling:** Label both ends of cable for future reference

---

## Safety Considerations

### Electrical Safety

- ⚠️ Disconnect battery before working on wiring (if possible)
- ⚠️ The data cable is low voltage, but nearby connections may not be
- ⚠️ Ensure all connections are secure to prevent shorts
- ⚠️ Keep Raspberry Pi away from high-voltage AC wiring

### Environmental Protection

- **Moisture:** Keep Pi away from water sources, use sealed case if needed
- **Heat:** Ensure adequate ventilation, add heatsinks if in hot environment
- **Vibration:** Secure Pi firmly, use rubber dampening if on rough roads
- **Dust:** Use filtered case or enclosure in dusty environments

### Power Quality

- Use quality 12V to 5V converter (cheap ones can damage Pi)
- Consider adding a DC-DC converter with voltage regulation
- In rough electrical environments, use a UPS or battery buffer

---

## Testing Physical Connection

After connecting everything:

1. **Power On:** Plug in power, Pi should boot (green LED flashes)
2. **USB Connection:** Check if USB device is detected
3. **Data Flow:** Run test script to verify data reception

### Quick Test Commands:

```bash
# Check if USB device is detected
lsusb

# Check for serial device
ls -l /dev/ttyUSB*

# Should show: /dev/ttyUSB0
```

---

## Troubleshooting Physical Connections

### Pi Won't Boot
- Check power supply (needs 2.5A minimum)
- Try different power adapter
- Check micro-USB cable isn't damaged
- Ensure SD card is properly inserted

### USB Device Not Detected
- Check cable is firmly seated at both ends
- Try different USB port on Pi
- Verify VE.Direct cable isn't damaged
- Check SmartShunt is powered on
- Try unplugging and replugging USB cable

### Intermittent Connection
- Check for loose cable connections
- Verify cables aren't being pinched or stressed
- Add strain relief to both ends
- Check for electrical interference from nearby equipment

### No Data from Device
- Verify Victron device is powered and functional
- Check device screen shows data
- Ensure correct device is connected
- Try different VE.Direct cable

---

## Maintenance

### Weekly Checks
- Verify all cables are secure
- Check Pi is powered and booting
- Look for any physical damage

### Monthly Checks
- Clean dust from Pi case/heatsinks
- Check cable routing hasn't shifted
- Verify mounting is still secure
- Check for any worn or frayed cables

### Seasonal Checks
- Deep clean of Pi and enclosure
- Inspect all connections for corrosion
- Verify power supply output voltage
- Update software if needed

---

## Parts List & Shopping

### Required Components

| Item | Description | Est. Cost | Where to Buy |
|------|-------------|-----------|--------------|
| Raspberry Pi 3B+ | Main computer | $35-45 | Amazon, Adafruit, CanaKit |
| MicroSD Card | 16GB Class 10 | $8-12 | Amazon, Best Buy |
| VE.Direct to USB Cable | 1.5m cable | $25-35 | Victron dealers, Amazon |
| 12V to USB Adapter | 2.5A+ output | $10-15 | Amazon, auto parts store |
| USB Power Cable | Micro-USB | $5-8 | Amazon, included with Pi |

### Optional but Recommended

| Item | Description | Est. Cost |
|------|-------------|-----------|
| Raspberry Pi Case | Protective case | $8-15 |
| Heatsinks | For cooling | $5-8 |
| Cable Ties | For cable management | $5 |
| Split Loom | Cable protection | $8-12 |
| Mounting Brackets | Wall/DIN rail mount | $10-15 |

**Total Cost:** $100-165 (required items)

---

## Ready to Set Up Software?

Once your hardware is connected and tested, proceed to:
- **[QUICK_START.md](QUICK_START.md)** for automated setup
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** for detailed manual setup

---

**Your hardware is now connected! Next step: Install the software.**
