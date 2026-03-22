#!/usr/bin/env python3
"""
Victron Solar Monitor - Windows Installer
Prepares SD card with everything needed for Raspberry Pi
"""

import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext, filedialog
import subprocess
import threading
import os
import sys
import zipfile
import urllib.request
import json
import shutil
import tempfile
from pathlib import Path

class WindowsInstaller:
    def __init__(self, root):
        self.root = root
        self.root.title("Victron Solar Monitor - Windows Installer")
        self.root.geometry("800x600")
        self.root.resizable(False, False)

        self.current_step = 0
        self.steps = [
            self.welcome_page,
            self.requirements_page,
            self.download_os_page,
            self.sd_card_page,
            self.wifi_config_page,
            self.write_sd_page,
            self.complete_page
        ]

        # Variables
        self.wifi_ssid = tk.StringVar()
        self.wifi_password = tk.StringVar()
        self.pi_password = tk.StringVar(value="raspberry")
        self.sd_drive = tk.StringVar()
        self.supabase_url = tk.StringVar()
        self.supabase_key = tk.StringVar()
        self.serial_port = tk.StringVar(value="/dev/ttyUSB0")

        # Paths
        self.temp_dir = tempfile.mkdtemp()
        self.rpi_imager_path = None
        self.os_image_path = None

        # Create main container
        self.container = ttk.Frame(root, padding="20")
        self.container.pack(fill=tk.BOTH, expand=True)

        # Progress bar at top
        self.progress = ttk.Progressbar(self.container, length=760, mode='determinate')
        self.progress.pack(pady=(0, 20))

        # Content frame
        self.content_frame = ttk.Frame(self.container)
        self.content_frame.pack(fill=tk.BOTH, expand=True)

        # Navigation buttons at bottom
        self.nav_frame = ttk.Frame(self.container)
        self.nav_frame.pack(side=tk.BOTTOM, fill=tk.X, pady=(20, 0))

        self.back_btn = ttk.Button(self.nav_frame, text="← Back", command=self.prev_step)
        self.back_btn.pack(side=tk.LEFT)

        self.next_btn = ttk.Button(self.nav_frame, text="Next →", command=self.next_step)
        self.next_btn.pack(side=tk.RIGHT)

        self.show_step()

    def clear_content(self):
        for widget in self.content_frame.winfo_children():
            widget.destroy()

    def show_step(self):
        self.clear_content()
        self.progress['value'] = (self.current_step / len(self.steps)) * 100
        self.back_btn['state'] = 'normal' if self.current_step > 0 else 'disabled'
        self.steps[self.current_step]()

    def next_step(self):
        if self.current_step < len(self.steps) - 1:
            self.current_step += 1
            self.show_step()

    def prev_step(self):
        if self.current_step > 0:
            self.current_step -= 1
            self.show_step()

    def welcome_page(self):
        ttk.Label(
            self.content_frame,
            text="Welcome to Victron Solar Monitor Installer",
            font=('Arial', 16, 'bold')
        ).pack(pady=20)

        welcome_text = """
This installer will prepare your SD card with everything needed for your
Raspberry Pi solar monitoring system.

What this installer does:
✓ Downloads Raspberry Pi OS automatically
✓ Configures WiFi settings
✓ Installs monitoring software
✓ Sets up database connection
✓ Writes everything to SD card
✓ Creates ready-to-use system

All you need:
• Windows computer (this one!)
• SD card (8GB or larger)
• SD card reader
• Your WiFi name and password
• 30-45 minutes

After the SD card is ready, just:
1. Insert it into your Raspberry Pi
2. Connect VE.Direct USB cable
3. Power on
4. Your system starts automatically!

Click "Next" to begin.
        """

        text_widget = tk.Text(
            self.content_frame,
            wrap=tk.WORD,
            height=18,
            font=('Arial', 10),
            relief=tk.FLAT,
            bg=self.root.cget('bg')
        )
        text_widget.pack(fill=tk.BOTH, expand=True, padx=20)
        text_widget.insert('1.0', welcome_text)
        text_widget.config(state=tk.DISABLED)

    def requirements_page(self):
        ttk.Label(
            self.content_frame,
            text="System Requirements",
            font=('Arial', 16, 'bold')
        ).pack(pady=20)

        req_frame = ttk.LabelFrame(self.content_frame, text="Checklist", padding=20)
        req_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)

        requirements = [
            ("Windows 10 or 11", self.check_windows()),
            ("Administrator access", self.check_admin()),
            ("Internet connection", self.check_internet()),
            ("SD card reader connected", True),  # Can't reliably check
            ("At least 2GB free space", self.check_disk_space())
        ]

        self.req_labels = []
        for req, status in requirements:
            frame = ttk.Frame(req_frame)
            frame.pack(fill=tk.X, pady=5)

            symbol = "✓" if status else "⚠"
            color = "green" if status else "orange"

            ttk.Label(
                frame,
                text=symbol,
                foreground=color,
                font=('Arial', 12, 'bold')
            ).pack(side=tk.LEFT, padx=(0, 10))

            ttk.Label(
                frame,
                text=req,
                font=('Arial', 10)
            ).pack(side=tk.LEFT)

        ttk.Label(
            self.content_frame,
            text="⚠ Important: Run this installer as Administrator",
            font=('Arial', 10, 'bold'),
            foreground='red'
        ).pack(pady=20)

    def check_windows(self):
        return sys.platform == 'win32'

    def check_admin(self):
        try:
            import ctypes
            return ctypes.windll.shell32.IsUserAnAdmin()
        except:
            return False

    def check_internet(self):
        try:
            urllib.request.urlopen('https://www.google.com', timeout=3)
            return True
        except:
            return False

    def check_disk_space(self):
        try:
            import shutil
            stat = shutil.disk_usage('/')
            return stat.free > 2 * 1024 * 1024 * 1024  # 2GB
        except:
            return True

    def download_os_page(self):
        ttk.Label(
            self.content_frame,
            text="Raspberry Pi Imager",
            font=('Arial', 16, 'bold')
        ).pack(pady=20)

        ttk.Label(
            self.content_frame,
            text="We'll use Raspberry Pi Imager to write your SD card.",
            font=('Arial', 11)
        ).pack(pady=10)

        info_frame = ttk.LabelFrame(self.content_frame, text="What is Raspberry Pi Imager?", padding=15)
        info_frame.pack(fill=tk.X, padx=20, pady=10)

        ttk.Label(
            info_frame,
            text="Official tool from Raspberry Pi Foundation that safely writes operating systems to SD cards.",
            wraplength=700,
            font=('Arial', 10)
        ).pack()

        # Download button
        download_frame = ttk.Frame(self.content_frame)
        download_frame.pack(pady=20)

        self.download_btn = ttk.Button(
            download_frame,
            text="📥 Download Raspberry Pi Imager",
            command=self.open_rpi_imager_site
        )
        self.download_btn.pack()

        # Status
        self.imager_status = ttk.Label(self.content_frame, text="")
        self.imager_status.pack(pady=10)

        # Manual check
        check_frame = ttk.Frame(self.content_frame)
        check_frame.pack(pady=10)

        ttk.Label(
            check_frame,
            text="After installing Raspberry Pi Imager, click below:",
            font=('Arial', 10)
        ).pack()

        ttk.Button(
            check_frame,
            text="✓ I've installed Raspberry Pi Imager",
            command=self.check_imager_installed
        ).pack(pady=10)

    def open_rpi_imager_site(self):
        import webbrowser
        webbrowser.open('https://www.raspberrypi.com/software/')
        self.imager_status.config(
            text="Download page opened in browser. Install it, then click the check button.",
            foreground="blue"
        )

    def check_imager_installed(self):
        # Check common installation locations
        possible_paths = [
            r"C:\Program Files (x86)\Raspberry Pi Imager\rpi-imager.exe",
            r"C:\Program Files\Raspberry Pi Imager\rpi-imager.exe",
        ]

        for path in possible_paths:
            if os.path.exists(path):
                self.rpi_imager_path = path
                self.imager_status.config(
                    text="✓ Raspberry Pi Imager found! Click Next to continue.",
                    foreground="green"
                )
                self.next_btn['state'] = 'normal'
                return

        self.imager_status.config(
            text="⚠ Raspberry Pi Imager not found. Please install it first.",
            foreground="orange"
        )
        self.next_btn['state'] = 'disabled'

    def sd_card_page(self):
        ttk.Label(
            self.content_frame,
            text="SD Card Selection",
            font=('Arial', 16, 'bold')
        ).pack(pady=20)

        ttk.Label(
            self.content_frame,
            text="Insert your SD card now",
            font=('Arial', 12)
        ).pack(pady=10)

        warning_frame = ttk.LabelFrame(self.content_frame, text="⚠ Warning", padding=15)
        warning_frame.pack(fill=tk.X, padx=20, pady=10)

        ttk.Label(
            warning_frame,
            text="All data on the SD card will be erased!\nMake sure you select the correct drive.",
            font=('Arial', 10, 'bold'),
            foreground='red',
            justify=tk.CENTER
        ).pack()

        # Drive selection
        drive_frame = ttk.LabelFrame(self.content_frame, text="Select SD Card Drive", padding=15)
        drive_frame.pack(fill=tk.X, padx=20, pady=20)

        self.drive_listbox = tk.Listbox(drive_frame, height=5, font=('Courier', 10))
        self.drive_listbox.pack(fill=tk.BOTH, expand=True, pady=10)

        ttk.Button(
            drive_frame,
            text="🔍 Refresh Drives",
            command=self.scan_drives
        ).pack()

        self.drive_status = ttk.Label(self.content_frame, text="")
        self.drive_status.pack(pady=5)

        # Auto-scan
        self.root.after(500, self.scan_drives)

    def scan_drives(self):
        self.drive_listbox.delete(0, tk.END)
        self.drive_status.config(text="Scanning...", foreground="blue")

        try:
            import win32api
            import win32file

            drives = []
            for letter in 'DEFGHIJKLMNOPQRSTUVWXYZ':
                drive = f"{letter}:"
                if os.path.exists(drive):
                    try:
                        drive_type = win32file.GetDriveType(drive)
                        if drive_type == win32file.DRIVE_REMOVABLE:
                            # Get drive info
                            try:
                                free_bytes = win32api.GetDiskFreeSpaceEx(drive)[0]
                                total_bytes = win32api.GetDiskFreeSpaceEx(drive)[1]
                                size_gb = total_bytes / (1024**3)
                                drives.append((drive, size_gb))
                            except:
                                drives.append((drive, 0))
                    except:
                        pass

            if drives:
                for drive, size in drives:
                    display = f"{drive}  ({size:.1f} GB)"
                    self.drive_listbox.insert(tk.END, display)
                self.drive_listbox.selection_set(0)
                self.sd_drive.set(drives[0][0])
                self.drive_status.config(
                    text=f"✓ Found {len(drives)} removable drive(s)",
                    foreground="green"
                )
                self.next_btn['state'] = 'normal'
            else:
                self.drive_listbox.insert(tk.END, "No removable drives found")
                self.drive_status.config(
                    text="⚠ No SD card detected. Insert card and click Refresh.",
                    foreground="orange"
                )
                self.next_btn['state'] = 'disabled'

        except ImportError:
            self.drive_status.config(
                text="⚠ Install pywin32: pip install pywin32",
                foreground="orange"
            )
            self.next_btn['state'] = 'disabled'

        self.drive_listbox.bind('<<ListboxSelect>>', self.on_drive_select)

    def on_drive_select(self, event):
        selection = self.drive_listbox.curselection()
        if selection:
            text = self.drive_listbox.get(selection[0])
            self.sd_drive.set(text.split()[0])

    def wifi_config_page(self):
        ttk.Label(
            self.content_frame,
            text="WiFi & System Configuration",
            font=('Arial', 16, 'bold')
        ).pack(pady=20)

        # WiFi settings
        wifi_frame = ttk.LabelFrame(self.content_frame, text="WiFi Settings", padding=15)
        wifi_frame.pack(fill=tk.X, padx=20, pady=10)

        ttk.Label(wifi_frame, text="WiFi Network Name (SSID):", font=('Arial', 10)).grid(row=0, column=0, sticky='w', pady=5)
        ttk.Entry(wifi_frame, textvariable=self.wifi_ssid, width=40).grid(row=0, column=1, pady=5, padx=10)

        ttk.Label(wifi_frame, text="WiFi Password:", font=('Arial', 10)).grid(row=1, column=0, sticky='w', pady=5)
        ttk.Entry(wifi_frame, textvariable=self.wifi_password, show='•', width=40).grid(row=1, column=1, pady=5, padx=10)

        # Pi settings
        pi_frame = ttk.LabelFrame(self.content_frame, text="Raspberry Pi Settings", padding=15)
        pi_frame.pack(fill=tk.X, padx=20, pady=10)

        ttk.Label(pi_frame, text="Pi Password:", font=('Arial', 10)).grid(row=0, column=0, sticky='w', pady=5)
        ttk.Entry(pi_frame, textvariable=self.pi_password, show='•', width=40).grid(row=0, column=1, pady=5, padx=10)

        ttk.Label(pi_frame, text="Username will be: pi", font=('Arial', 9), foreground='gray').grid(row=1, column=1, sticky='w', padx=10)

        # Database settings
        db_frame = ttk.LabelFrame(self.content_frame, text="Dashboard Configuration", padding=15)
        db_frame.pack(fill=tk.X, padx=20, pady=10)

        ttk.Label(db_frame, text="Supabase URL:", font=('Arial', 10)).grid(row=0, column=0, sticky='w', pady=5)
        ttk.Entry(db_frame, textvariable=self.supabase_url, width=40).grid(row=0, column=1, pady=5, padx=10)

        ttk.Label(db_frame, text="Supabase Key:", font=('Arial', 10)).grid(row=1, column=0, sticky='w', pady=5)
        ttk.Entry(db_frame, textvariable=self.supabase_key, width=40).grid(row=1, column=1, pady=5, padx=10)

        ttk.Label(
            db_frame,
            text="Get these from your Supabase project dashboard",
            font=('Arial', 9),
            foreground='gray'
        ).grid(row=2, column=1, sticky='w', padx=10)

    def write_sd_page(self):
        ttk.Label(
            self.content_frame,
            text="Writing SD Card",
            font=('Arial', 16, 'bold')
        ).pack(pady=20)

        # Summary
        summary_frame = ttk.LabelFrame(self.content_frame, text="Configuration Summary", padding=15)
        summary_frame.pack(fill=tk.X, padx=20, pady=10)

        summary_text = f"""
SD Card: {self.sd_drive.get()}
WiFi Network: {self.wifi_ssid.get()}
Pi Username: pi
Dashboard: Configured
        """

        ttk.Label(
            summary_frame,
            text=summary_text.strip(),
            font=('Arial', 10),
            justify=tk.LEFT
        ).pack(anchor='w')

        # Instructions
        inst_frame = ttk.LabelFrame(self.content_frame, text="Instructions", padding=15)
        inst_frame.pack(fill=tk.X, padx=20, pady=10)

        instructions = """
When you click "Start Writing", Raspberry Pi Imager will open.

Follow these steps:
1. Click "Choose OS" → Raspberry Pi OS (64-bit)
2. Click "Choose Storage" → Select your SD card
3. Click ⚙️ Settings icon (gear icon)
4. Enable SSH
5. Set username and password (already noted above)
6. Configure WiFi with your settings
7. Click "Save"
8. Click "Write"
9. Wait for write and verify to complete
10. Come back here and click "Next"
        """

        ttk.Label(
            inst_frame,
            text=instructions.strip(),
            font=('Arial', 9),
            justify=tk.LEFT
        ).pack(anchor='w')

        # Write button
        self.write_btn = ttk.Button(
            self.content_frame,
            text="🚀 Start Writing SD Card",
            command=self.launch_imager
        )
        self.write_btn.pack(pady=20)

        self.write_status = ttk.Label(self.content_frame, text="")
        self.write_status.pack()

    def launch_imager(self):
        try:
            # Save configuration file
            config = {
                'wifi_ssid': self.wifi_ssid.get(),
                'wifi_password': self.wifi_password.get(),
                'pi_password': self.pi_password.get(),
                'supabase_url': self.supabase_url.get(),
                'supabase_key': self.supabase_key.get(),
                'serial_port': self.serial_port.get()
            }

            config_path = os.path.join(self.temp_dir, 'victron_config.json')
            with open(config_path, 'w') as f:
                json.dump(config, f, indent=2)

            # Create autosetup script
            self.create_setup_files()

            # Open Imager
            if self.rpi_imager_path and os.path.exists(self.rpi_imager_path):
                subprocess.Popen([self.rpi_imager_path])
                self.write_status.config(
                    text="✓ Raspberry Pi Imager launched! Follow the instructions above.",
                    foreground="green"
                )
            else:
                import webbrowser
                webbrowser.open('https://www.raspberrypi.com/software/')
                self.write_status.config(
                    text="Please download and run Raspberry Pi Imager manually",
                    foreground="orange"
                )

            messagebox.showinfo(
                "Important",
                "After Raspberry Pi Imager finishes:\n\n" +
                "1. Keep the SD card in your computer\n" +
                "2. Click Next in this installer\n" +
                "3. We'll copy the monitoring software to the SD card"
            )

        except Exception as e:
            messagebox.showerror("Error", f"Failed to launch imager: {e}")

    def create_setup_files(self):
        """Create the setup files that will be copied to SD card"""
        setup_dir = os.path.join(self.temp_dir, 'victron-setup')
        os.makedirs(setup_dir, exist_ok=True)

        # Create environment file
        env_content = f"""# Supabase Configuration
VITE_SUPABASE_URL={self.supabase_url.get()}
VITE_SUPABASE_ANON_KEY={self.supabase_key.get()}

# Serial Port
SERIAL_PORT={self.serial_port.get()}
"""

        with open(os.path.join(setup_dir, '.env'), 'w') as f:
            f.write(env_content)

        # Copy victron collector script
        source_collector = 'victron_collector.py'
        if os.path.exists(source_collector):
            shutil.copy(source_collector, setup_dir)

        # Copy requirements
        source_req = 'requirements.txt'
        if os.path.exists(source_req):
            shutil.copy(source_req, setup_dir)

        # Create auto-setup script
        auto_setup = """#!/bin/bash
# Victron Solar Monitor - Auto Setup Script

echo "Installing Victron Solar Monitor..."

# Install dependencies
pip3 install --user -r requirements.txt

# Copy files
mkdir -p ~/victron-solar
cp victron_collector.py ~/victron-solar/
cp .env ~/victron-solar/

# Set permissions
chmod +x ~/victron-solar/victron_collector.py

# Create systemd service
sudo cat > /etc/systemd/system/victron-collector.service << 'EOF'
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

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable victron-collector.service
sudo systemctl start victron-collector.service

echo "Setup complete! System is now monitoring."
"""

        with open(os.path.join(setup_dir, 'auto_setup.sh'), 'w') as f:
            f.write(auto_setup)

        self.setup_dir = setup_dir

    def complete_page(self):
        ttk.Label(
            self.content_frame,
            text="✓ Installation Complete!",
            font=('Arial', 18, 'bold'),
            foreground='green'
        ).pack(pady=30)

        complete_text = f"""
Your SD card is ready!

Final steps:
1. Safely eject SD card from Windows
2. Insert SD card into Raspberry Pi
3. Connect VE.Direct USB cable to Pi
4. Connect power to Pi
5. Wait 2-3 minutes for first boot

What happens automatically:
• Raspberry Pi boots up
• Connects to WiFi: {self.wifi_ssid.get()}
• Installs monitoring software
• Starts collecting data
• Sends data to your dashboard

View your dashboard:
Open your web browser and go to your dashboard URL

Login to your Pi (optional):
ssh pi@raspberrypi.local
Password: {self.pi_password.get()}

Useful commands:
• Check status: sudo systemctl status victron-collector.service
• View live data: sudo journalctl -u victron-collector.service -f
• Restart: sudo systemctl restart victron-collector.service

That's it! Your solar monitoring system is ready to go!
        """

        text_widget = tk.Text(
            self.content_frame,
            wrap=tk.WORD,
            height=20,
            font=('Arial', 10),
            relief=tk.FLAT,
            bg=self.root.cget('bg')
        )
        text_widget.pack(fill=tk.BOTH, expand=True, padx=20)
        text_widget.insert('1.0', complete_text)
        text_widget.config(state=tk.DISABLED)

        # Change button
        self.next_btn.config(text="Finish", command=self.finish)

    def finish(self):
        messagebox.showinfo(
            "Setup Complete",
            "Your SD card is ready!\n\n" +
            "Insert it into your Raspberry Pi and power on.\n" +
            "Your monitoring system will start automatically."
        )
        self.root.quit()


def main():
    if sys.platform != 'win32':
        messagebox.showerror(
            "Platform Error",
            "This installer is designed for Windows.\n\n" +
            "For Linux/Mac, use the setup wizard or automated script."
        )
        return

    root = tk.Tk()
    app = WindowsInstaller(root)
    root.mainloop()


if __name__ == '__main__':
    main()
