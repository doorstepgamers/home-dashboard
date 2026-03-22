#!/usr/bin/env python3
"""
Victron Solar Monitor - Setup Wizard
A graphical interface for easy Raspberry Pi setup
"""

import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import subprocess
import threading
import os
import sys
import glob

class SetupWizard:
    def __init__(self, root):
        self.root = root
        self.root.title("Victron Solar Monitor - Setup Wizard")
        self.root.geometry("700x550")
        self.root.resizable(False, False)

        self.current_step = 0
        self.steps = [
            self.welcome_page,
            self.hardware_check_page,
            self.install_dependencies_page,
            self.configure_page,
            self.test_page,
            self.complete_page
        ]

        # Variables
        self.serial_port = tk.StringVar()
        self.auto_start = tk.BooleanVar(value=True)

        # Create main container
        self.container = ttk.Frame(root, padding="20")
        self.container.pack(fill=tk.BOTH, expand=True)

        # Progress bar at top
        self.progress = ttk.Progressbar(self.container, length=660, mode='determinate')
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
            text="Welcome to Victron Solar Monitor Setup",
            font=('Arial', 16, 'bold')
        ).pack(pady=20)

        welcome_text = """
This wizard will help you set up your Raspberry Pi to monitor your Victron solar system.

What this wizard will do:
✓ Check your hardware connections
✓ Install required software
✓ Configure the data collector
✓ Set up automatic startup
✓ Test the connection

Before you begin, make sure:
• Your Raspberry Pi is connected to the internet
• Your VE.Direct USB cable is plugged in
• Your Victron device is powered on

Click "Next" to begin the setup process.
        """

        text_widget = tk.Text(
            self.content_frame,
            wrap=tk.WORD,
            height=15,
            font=('Arial', 11),
            relief=tk.FLAT,
            bg=self.root.cget('bg')
        )
        text_widget.pack(fill=tk.BOTH, expand=True, padx=20)
        text_widget.insert('1.0', welcome_text)
        text_widget.config(state=tk.DISABLED)

    def hardware_check_page(self):
        ttk.Label(
            self.content_frame,
            text="Hardware Detection",
            font=('Arial', 16, 'bold')
        ).pack(pady=20)

        ttk.Label(
            self.content_frame,
            text="Looking for USB serial devices...",
            font=('Arial', 11)
        ).pack(pady=10)

        # Create listbox for serial ports
        frame = ttk.LabelFrame(self.content_frame, text="Available Serial Ports", padding=10)
        frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)

        self.port_listbox = tk.Listbox(frame, height=6, font=('Courier', 10))
        self.port_listbox.pack(fill=tk.BOTH, expand=True)

        # Detect button
        detect_btn = ttk.Button(
            self.content_frame,
            text="🔍 Detect Devices",
            command=self.detect_serial_ports
        )
        detect_btn.pack(pady=10)

        # Status label
        self.port_status = ttk.Label(self.content_frame, text="")
        self.port_status.pack(pady=5)

        # Auto-detect on page load
        self.root.after(500, self.detect_serial_ports)

    def detect_serial_ports(self):
        self.port_listbox.delete(0, tk.END)
        self.port_status.config(text="Scanning...", foreground="blue")

        # Look for serial ports
        ports = []
        for pattern in ['/dev/ttyUSB*', '/dev/ttyACM*', '/dev/serial*']:
            ports.extend(glob.glob(pattern))

        if ports:
            for port in ports:
                self.port_listbox.insert(tk.END, port)
            self.port_listbox.selection_set(0)
            self.serial_port.set(ports[0])
            self.port_status.config(
                text=f"✓ Found {len(ports)} device(s). Select one and click Next.",
                foreground="green"
            )
            self.next_btn['state'] = 'normal'
        else:
            self.port_listbox.insert(tk.END, "No serial devices found")
            self.port_status.config(
                text="⚠ No devices found. Make sure USB cable is connected.",
                foreground="orange"
            )
            self.next_btn['state'] = 'disabled'

        # Update selection
        self.port_listbox.bind('<<ListboxSelect>>', self.on_port_select)

    def on_port_select(self, event):
        selection = self.port_listbox.curselection()
        if selection:
            self.serial_port.set(self.port_listbox.get(selection[0]))

    def install_dependencies_page(self):
        ttk.Label(
            self.content_frame,
            text="Installing Software",
            font=('Arial', 16, 'bold')
        ).pack(pady=20)

        ttk.Label(
            self.content_frame,
            text="Installing required Python libraries...",
            font=('Arial', 11)
        ).pack(pady=10)

        # Log output
        self.install_log = scrolledtext.ScrolledText(
            self.content_frame,
            height=15,
            font=('Courier', 9),
            bg='black',
            fg='#00ff00'
        )
        self.install_log.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)

        # Disable next button during install
        self.next_btn['state'] = 'disabled'

        # Start installation in background
        self.root.after(500, self.install_dependencies)

    def install_dependencies(self):
        self.log("Starting installation...\n")

        # Install pyserial
        self.log("Installing pyserial...\n")
        result = self.run_command(['pip3', 'install', '--user', 'pyserial'])
        if result:
            self.log("✓ pyserial installed\n", "green")
        else:
            self.log("✗ Failed to install pyserial\n", "red")

        # Install requests
        self.log("\nInstalling requests...\n")
        result = self.run_command(['pip3', 'install', '--user', 'requests'])
        if result:
            self.log("✓ requests installed\n", "green")
        else:
            self.log("✗ Failed to install requests\n", "red")

        # Add user to dialout group
        self.log("\nConfiguring permissions...\n")
        user = os.environ.get('USER', 'pi')
        result = self.run_command(['sudo', 'usermod', '-a', '-G', 'dialout', user])
        if result:
            self.log("✓ User added to dialout group\n", "green")
        else:
            self.log("⚠ Could not add user to dialout group\n", "orange")

        self.log("\n" + "="*50 + "\n")
        self.log("✓ Installation complete!\n", "green")
        self.log("You may need to log out and back in for permissions to take effect.\n")

        self.next_btn['state'] = 'normal'

    def log(self, message, color=None):
        self.install_log.insert(tk.END, message)
        if color:
            # Highlight last line
            pass
        self.install_log.see(tk.END)
        self.root.update()

    def run_command(self, cmd):
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=60
            )
            self.log(result.stdout)
            if result.stderr:
                self.log(result.stderr)
            return result.returncode == 0
        except Exception as e:
            self.log(f"Error: {str(e)}\n")
            return False

    def configure_page(self):
        ttk.Label(
            self.content_frame,
            text="Configuration",
            font=('Arial', 16, 'bold')
        ).pack(pady=20)

        # Serial port
        port_frame = ttk.LabelFrame(self.content_frame, text="Serial Port", padding=10)
        port_frame.pack(fill=tk.X, padx=20, pady=10)

        ttk.Label(port_frame, text="Selected port:", font=('Arial', 10)).pack(anchor='w')
        ttk.Label(
            port_frame,
            text=self.serial_port.get(),
            font=('Arial', 11, 'bold')
        ).pack(anchor='w', pady=5)

        # Auto-start option
        auto_frame = ttk.LabelFrame(self.content_frame, text="Startup Options", padding=10)
        auto_frame.pack(fill=tk.X, padx=20, pady=10)

        ttk.Checkbutton(
            auto_frame,
            text="Start collector automatically on boot",
            variable=self.auto_start
        ).pack(anchor='w')

        ttk.Label(
            auto_frame,
            text="(Recommended for production use)",
            font=('Arial', 9),
            foreground='gray'
        ).pack(anchor='w', padx=20)

        # Update intervals
        intervals_frame = ttk.LabelFrame(self.content_frame, text="Update Intervals", padding=10)
        intervals_frame.pack(fill=tk.X, padx=20, pady=10)

        ttk.Label(
            intervals_frame,
            text="• Data updates: Every 5 seconds",
            font=('Arial', 10)
        ).pack(anchor='w')

        ttk.Label(
            intervals_frame,
            text="• History logging: Every 60 seconds",
            font=('Arial', 10)
        ).pack(anchor='w')

        ttk.Label(
            intervals_frame,
            text="(Can be changed later in victron_collector.py)",
            font=('Arial', 9),
            foreground='gray'
        ).pack(anchor='w', pady=(5, 0))

    def test_page(self):
        ttk.Label(
            self.content_frame,
            text="Testing Connection",
            font=('Arial', 16, 'bold')
        ).pack(pady=20)

        ttk.Label(
            self.content_frame,
            text="Testing connection to Victron device...",
            font=('Arial', 11)
        ).pack(pady=10)

        # Test log
        self.test_log = scrolledtext.ScrolledText(
            self.content_frame,
            height=12,
            font=('Courier', 9),
            bg='black',
            fg='#00ff00'
        )
        self.test_log.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)

        # Status
        self.test_status = ttk.Label(self.content_frame, text="")
        self.test_status.pack(pady=10)

        # Test button
        test_btn = ttk.Button(
            self.content_frame,
            text="🔬 Run Test",
            command=self.run_test
        )
        test_btn.pack(pady=5)

        # Auto-run test
        self.root.after(500, self.run_test)

    def run_test(self):
        self.test_log.delete('1.0', tk.END)
        self.test_status.config(text="Testing...", foreground="blue")
        self.next_btn['state'] = 'disabled'

        # Test in background thread
        thread = threading.Thread(target=self.do_test)
        thread.daemon = True
        thread.start()

    def do_test(self):
        self.test_log.insert(tk.END, "Opening serial port...\n")
        self.root.update()

        try:
            import serial
            import time

            port = self.serial_port.get()
            self.test_log.insert(tk.END, f"Port: {port}\n")
            self.test_log.insert(tk.END, "Baud rate: 19200\n\n")
            self.root.update()

            ser = serial.Serial(port, 19200, timeout=5)
            self.test_log.insert(tk.END, "✓ Serial port opened\n\n")
            self.test_log.insert(tk.END, "Reading data from device...\n")
            self.test_log.insert(tk.END, "(This may take 10-15 seconds)\n\n")
            self.root.update()

            # Read for up to 15 seconds
            start_time = time.time()
            data_received = False

            while time.time() - start_time < 15:
                if ser.in_waiting:
                    line = ser.readline().decode('ascii', errors='ignore').strip()
                    if line and '\t' in line:
                        self.test_log.insert(tk.END, f"{line}\n")
                        self.root.update()
                        data_received = True
                        if time.time() - start_time > 5 and data_received:
                            break

            ser.close()

            if data_received:
                self.test_log.insert(tk.END, "\n" + "="*50 + "\n")
                self.test_log.insert(tk.END, "✓ Test successful!\n")
                self.test_log.insert(tk.END, "Receiving data from Victron device.\n")
                self.test_status.config(text="✓ Connection test passed!", foreground="green")
                self.next_btn['state'] = 'normal'
            else:
                self.test_log.insert(tk.END, "\n" + "="*50 + "\n")
                self.test_log.insert(tk.END, "⚠ No data received\n")
                self.test_log.insert(tk.END, "Check that:\n")
                self.test_log.insert(tk.END, "• VE.Direct cable is connected\n")
                self.test_log.insert(tk.END, "• Victron device is powered on\n")
                self.test_log.insert(tk.END, "• Correct port is selected\n")
                self.test_status.config(text="⚠ No data received", foreground="orange")
                self.next_btn['state'] = 'normal'

        except Exception as e:
            self.test_log.insert(tk.END, f"\n✗ Test failed: {str(e)}\n")
            self.test_status.config(text="✗ Test failed", foreground="red")
            self.next_btn['state'] = 'normal'

        self.test_log.see(tk.END)

    def complete_page(self):
        ttk.Label(
            self.content_frame,
            text="✓ Setup Complete!",
            font=('Arial', 18, 'bold'),
            foreground='green'
        ).pack(pady=30)

        complete_text = """
Your Victron Solar Monitor is now configured!

What happens next:
• The data collector will start automatically
• Data will be sent to your dashboard every 5 seconds
• History will be logged every minute
• The service will restart if connection drops

To view your dashboard:
Open your web browser and go to your dashboard URL

Useful commands:
• View live data: sudo journalctl -u victron-collector.service -f
• Check status: sudo systemctl status victron-collector.service
• Restart service: sudo systemctl restart victron-collector.service

Click "Finish" to complete setup.
        """

        text_widget = tk.Text(
            self.content_frame,
            wrap=tk.WORD,
            height=16,
            font=('Arial', 10),
            relief=tk.FLAT,
            bg=self.root.cget('bg')
        )
        text_widget.pack(fill=tk.BOTH, expand=True, padx=20)
        text_widget.insert('1.0', complete_text)
        text_widget.config(state=tk.DISABLED)

        # Change next button to finish
        self.next_btn.config(text="Finish", command=self.finish)

    def finish(self):
        # Create collector script with correct port
        self.create_collector_script()

        # Set up service if requested
        if self.auto_start.get():
            self.setup_service()

        messagebox.showinfo(
            "Setup Complete",
            "Your Victron Solar Monitor is ready to use!\n\n" +
            "The data collector is now running and sending data to your dashboard."
        )
        self.root.quit()

    def create_collector_script(self):
        # Read template and update serial port
        try:
            with open('victron_collector.py', 'r') as f:
                content = f.read()

            # Update serial port
            content = content.replace(
                'SERIAL_PORT = "/dev/ttyUSB0"',
                f'SERIAL_PORT = "{self.serial_port.get()}"'
            )

            # Write to install location
            install_dir = os.path.expanduser('~/victron-solar')
            os.makedirs(install_dir, exist_ok=True)

            with open(os.path.join(install_dir, 'victron_collector.py'), 'w') as f:
                f.write(content)

            os.chmod(os.path.join(install_dir, 'victron_collector.py'), 0o755)
        except Exception as e:
            messagebox.showerror("Error", f"Failed to create collector script: {e}")

    def setup_service(self):
        try:
            user = os.environ.get('USER', 'pi')
            install_dir = os.path.expanduser('~/victron-solar')

            service_content = f"""[Unit]
Description=Victron Solar Data Collector
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User={user}
WorkingDirectory={install_dir}
ExecStart=/usr/bin/python3 {install_dir}/victron_collector.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
"""

            # Write service file
            with open('/tmp/victron-collector.service', 'w') as f:
                f.write(service_content)

            # Install service
            subprocess.run(['sudo', 'cp', '/tmp/victron-collector.service',
                          '/etc/systemd/system/'], check=True)
            subprocess.run(['sudo', 'systemctl', 'daemon-reload'], check=True)
            subprocess.run(['sudo', 'systemctl', 'enable', 'victron-collector.service'], check=True)
            subprocess.run(['sudo', 'systemctl', 'start', 'victron-collector.service'], check=True)

        except Exception as e:
            messagebox.showerror("Error", f"Failed to set up service: {e}")


def main():
    # Check if running on Raspberry Pi / Linux
    if sys.platform not in ['linux', 'linux2']:
        messagebox.showerror(
            "Platform Error",
            "This wizard is designed to run on Raspberry Pi / Linux.\n\n" +
            "For Windows/Mac, please use the test data generator instead."
        )
        return

    root = tk.Tk()
    app = SetupWizard(root)
    root.mainloop()


if __name__ == '__main__':
    main()
