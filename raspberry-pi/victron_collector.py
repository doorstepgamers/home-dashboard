#!/usr/bin/env python3
"""
Victron Solar Data Collector for Raspberry Pi

This service reads data from Victron devices via VE.Direct USB connection
and sends it to Supabase for monitoring in the dashboard.

Requirements:
- Python 3.7+
- pyserial
- requests

Install dependencies:
pip3 install pyserial requests

Usage:
python3 victron_collector.py
"""

import serial
import time
import json
import requests
from datetime import datetime
from typing import Dict, Optional
import sys

# Configuration
SUPABASE_URL = "https://0ec90b57d6e95fcbda19832f.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw"

# Serial port configuration - adjust to your setup
# Common ports: /dev/ttyUSB0, /dev/ttyUSB1, /dev/serial0
SERIAL_PORT = "/dev/ttyUSB0"
BAUD_RATE = 19200

# Update intervals
DATA_UPDATE_INTERVAL = 5  # seconds between data collection
HISTORY_LOG_INTERVAL = 60  # seconds between historical data logging


class VEDirectParser:
    """Parser for Victron VE.Direct protocol"""

    def __init__(self):
        self.data = {}
        self.buffer = ""

    def parse_line(self, line: str) -> Optional[Dict]:
        """Parse a single line from VE.Direct protocol"""
        if line.startswith('\n'):
            if self.data:
                complete_data = self.data.copy()
                self.data = {}
                return complete_data
            return None

        if '\t' in line:
            key, value = line.strip().split('\t', 1)
            self.data[key] = value

        return None


class VictronCollector:
    """Main collector class for reading and sending Victron data"""

    def __init__(self):
        self.parser = VEDirectParser()
        self.serial_conn = None
        self.last_history_log = 0
        self.last_metrics = {}

    def connect_serial(self) -> bool:
        """Connect to VE.Direct serial port"""
        try:
            self.serial_conn = serial.Serial(
                port=SERIAL_PORT,
                baudrate=BAUD_RATE,
                timeout=1
            )
            print(f"Connected to {SERIAL_PORT}")
            self.update_device_status("SmartShunt 300A", True)
            return True
        except Exception as e:
            print(f"Error connecting to serial port: {e}")
            self.update_device_status("SmartShunt 300A", False)
            return False

    def read_ve_direct_data(self) -> Optional[Dict]:
        """Read and parse data from VE.Direct protocol"""
        if not self.serial_conn or not self.serial_conn.is_open:
            return None

        try:
            line = self.serial_conn.readline().decode('ascii', errors='ignore')
            return self.parser.parse_line(line)
        except Exception as e:
            print(f"Error reading serial data: {e}")
            return None

    def convert_to_metrics(self, raw_data: Dict) -> Dict:
        """Convert VE.Direct raw data to our metrics format"""
        metrics = {
            "timestamp": datetime.utcnow().isoformat(),
            "battery_voltage": None,
            "battery_current": None,
            "battery_soc": None,
            "battery_power": None,
            "battery_consumed_ah": None,
            "battery_remaining_ah": None,
            "solar_voltage": None,
            "solar_current": None,
            "solar_power": None,
            "charge_state": None,
            "inverter_power": None,
            "inverter_status": None
        }

        # Map VE.Direct fields to our metrics
        # Battery data (from SmartShunt)
        if 'V' in raw_data:  # Battery voltage (mV)
            metrics['battery_voltage'] = float(raw_data['V']) / 1000

        if 'I' in raw_data:  # Battery current (mA)
            metrics['battery_current'] = float(raw_data['I']) / 1000

        if 'SOC' in raw_data:  # State of charge (0.1%)
            metrics['battery_soc'] = float(raw_data['SOC']) / 10

        if 'P' in raw_data:  # Instantaneous power (W)
            metrics['battery_power'] = float(raw_data['P'])

        if 'CE' in raw_data:  # Consumed Ah (mAh)
            metrics['battery_consumed_ah'] = abs(float(raw_data['CE']) / 1000)

        if 'TTG' in raw_data:  # Time to go (minutes)
            # Can calculate remaining Ah if we have current
            if metrics['battery_current']:
                remaining_time_hours = float(raw_data['TTG']) / 60
                metrics['battery_remaining_ah'] = abs(metrics['battery_current'] * remaining_time_hours)

        # Solar data (from MPPT)
        if 'VPV' in raw_data:  # Panel voltage (mV)
            metrics['solar_voltage'] = float(raw_data['VPV']) / 1000

        if 'PPV' in raw_data:  # Panel power (W)
            metrics['solar_power'] = float(raw_data['PPV'])
            if metrics['solar_voltage'] and metrics['solar_voltage'] > 0:
                metrics['solar_current'] = metrics['solar_power'] / metrics['solar_voltage']

        if 'CS' in raw_data:  # Charge state
            charge_states = {
                '0': 'Off',
                '2': 'Fault',
                '3': 'Bulk',
                '4': 'Absorption',
                '5': 'Float'
            }
            metrics['charge_state'] = charge_states.get(raw_data['CS'], 'Unknown')

        # Calculate inverter power (load power)
        if metrics['battery_current'] and metrics['solar_current']:
            # If battery is discharging and not receiving solar, that's inverter load
            if metrics['battery_current'] < 0 and metrics['solar_power'] and metrics['solar_power'] > 0:
                metrics['inverter_power'] = abs(metrics['battery_power']) - metrics['solar_power']
            elif metrics['battery_current'] < 0:
                metrics['inverter_power'] = abs(metrics['battery_power'])

        return metrics

    def send_to_supabase(self, table: str, data: Dict) -> bool:
        """Send data to Supabase table"""
        url = f"{SUPABASE_URL}/rest/v1/{table}"
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }

        try:
            response = requests.post(url, headers=headers, json=data)
            if response.status_code in [200, 201]:
                return True
            else:
                print(f"Error sending to Supabase: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"Exception sending to Supabase: {e}")
            return False

    def update_device_status(self, device_name: str, is_connected: bool):
        """Update device connection status"""
        url = f"{SUPABASE_URL}/rest/v1/device_config"
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }

        data = {
            "device_name": device_name,
            "is_connected": is_connected,
            "last_update": datetime.utcnow().isoformat()
        }

        try:
            # Try to update existing record
            params = {"device_name": f"eq.{device_name}"}
            response = requests.patch(url, headers=headers, params=params, json=data)

            if response.status_code not in [200, 201, 204]:
                print(f"Device status update warning: {response.status_code}")
        except Exception as e:
            print(f"Error updating device status: {e}")

    def check_and_create_alerts(self, metrics: Dict):
        """Check thresholds and create alerts if needed"""
        alerts = []

        # Low battery alert
        if metrics.get('battery_soc') and metrics['battery_soc'] < 20:
            alerts.append({
                "alert_type": "low_battery",
                "threshold_value": 20,
                "current_value": metrics['battery_soc'],
                "is_active": True,
                "message": f"Battery low: {metrics['battery_soc']:.1f}% remaining"
            })

        # High battery current discharge
        if metrics.get('battery_current') and metrics['battery_current'] < -50:
            alerts.append({
                "alert_type": "high_discharge",
                "threshold_value": 50,
                "current_value": abs(metrics['battery_current']),
                "is_active": True,
                "message": f"High discharge current: {abs(metrics['battery_current']):.1f}A"
            })

        # Send alerts to Supabase
        for alert in alerts:
            self.send_to_supabase("system_alerts", alert)

    def run(self):
        """Main run loop"""
        print("Starting Victron Solar Data Collector...")
        print(f"Supabase URL: {SUPABASE_URL}")
        print(f"Serial Port: {SERIAL_PORT}")
        print(f"Data update interval: {DATA_UPDATE_INTERVAL}s")
        print(f"History log interval: {HISTORY_LOG_INTERVAL}s")

        while True:
            try:
                # Connect to serial if not connected
                if not self.serial_conn or not self.serial_conn.is_open:
                    if not self.connect_serial():
                        print("Waiting 10 seconds before retry...")
                        time.sleep(10)
                        continue

                # Read data
                raw_data = self.read_ve_direct_data()

                if raw_data:
                    # Convert to metrics
                    metrics = self.convert_to_metrics(raw_data)
                    self.last_metrics = metrics

                    # Send to real-time metrics table
                    if self.send_to_supabase("solar_metrics", metrics):
                        print(f"✓ Sent metrics - Battery: {metrics.get('battery_voltage', 0):.2f}V, " +
                              f"SOC: {metrics.get('battery_soc', 0):.1f}%, " +
                              f"Solar: {metrics.get('solar_power', 0):.0f}W")

                    # Log to history at longer intervals
                    current_time = time.time()
                    if current_time - self.last_history_log >= HISTORY_LOG_INTERVAL:
                        self.send_to_supabase("solar_history", metrics)
                        self.last_history_log = current_time
                        print("✓ Logged to history")

                    # Check for alerts
                    self.check_and_create_alerts(metrics)

                    # Update device status
                    self.update_device_status("SmartShunt 300A", True)

                time.sleep(DATA_UPDATE_INTERVAL)

            except KeyboardInterrupt:
                print("\nShutting down...")
                if self.serial_conn:
                    self.serial_conn.close()
                break
            except Exception as e:
                print(f"Error in main loop: {e}")
                time.sleep(5)


if __name__ == "__main__":
    collector = VictronCollector()
    collector.run()
