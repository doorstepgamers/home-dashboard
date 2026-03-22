#!/usr/bin/env python3
"""
Test Data Generator for Solar Monitoring Dashboard

This script generates realistic test data for the solar monitoring system.
Use this to test your dashboard before connecting to real hardware.

Usage:
python3 test_data_generator.py
"""

import requests
import time
import random
import math
from datetime import datetime

SUPABASE_URL = "https://0ec90b57d6e95fcbda19832f.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw"

UPDATE_INTERVAL = 3


class SolarSimulator:
    """Simulates realistic solar system behavior"""

    def __init__(self):
        self.time_of_day = 8.0
        self.battery_soc = 75.0
        self.base_load = 100
        self.battery_capacity_ah = 200

    def get_solar_power(self):
        """Simulate solar power based on time of day"""
        hour = self.time_of_day % 24

        if hour < 6 or hour > 20:
            return 0

        peak_hour = 13
        hours_from_peak = abs(hour - peak_hour)
        max_power = 150
        power = max_power * math.exp(-0.15 * hours_from_peak**2)

        power = power * random.uniform(0.85, 1.0)

        return max(0, power)

    def get_load_power(self):
        """Simulate variable load power"""
        base = self.base_load
        variation = random.uniform(0.8, 1.5)
        return base * variation

    def update_battery(self, solar_power, load_power, dt_seconds):
        """Update battery state based on power flow"""
        net_power = solar_power - load_power
        battery_voltage_base = 12.0

        voltage_factor = 0.5 + (self.battery_soc / 100) * 0.5
        battery_voltage = battery_voltage_base * (0.95 + voltage_factor * 0.15)

        battery_current = net_power / battery_voltage if battery_voltage > 0 else 0

        ah_change = (battery_current * dt_seconds) / 3600
        self.battery_soc += (ah_change / self.battery_capacity_ah) * 100

        self.battery_soc = max(10, min(100, self.battery_soc))

        return battery_voltage, battery_current, net_power

    def generate_metrics(self):
        """Generate a complete set of metrics"""
        solar_power = self.get_solar_power()
        load_power = self.get_load_power()

        battery_voltage, battery_current, battery_power = self.update_battery(
            solar_power, load_power, UPDATE_INTERVAL
        )

        solar_voltage = 18.5 + random.uniform(-0.5, 0.5) if solar_power > 0 else 0
        solar_current = solar_power / solar_voltage if solar_voltage > 0 else 0

        consumed_ah = (100 - self.battery_soc) / 100 * self.battery_capacity_ah
        remaining_ah = self.battery_soc / 100 * self.battery_capacity_ah

        if battery_current > 0.5:
            charge_state = "Bulk" if self.battery_soc < 80 else "Absorption" if self.battery_soc < 95 else "Float"
        elif abs(battery_current) < 0.5:
            charge_state = "Float"
        else:
            charge_state = "Off"

        self.time_of_day += (UPDATE_INTERVAL / 3600)
        if self.time_of_day >= 24:
            self.time_of_day = 0

        return {
            "timestamp": datetime.utcnow().isoformat(),
            "battery_voltage": round(battery_voltage, 3),
            "battery_current": round(battery_current, 3),
            "battery_soc": round(self.battery_soc, 2),
            "battery_power": round(battery_power, 2),
            "battery_consumed_ah": round(consumed_ah, 2),
            "battery_remaining_ah": round(remaining_ah, 2),
            "solar_voltage": round(solar_voltage, 3) if solar_power > 0 else None,
            "solar_current": round(solar_current, 3) if solar_power > 0 else None,
            "solar_power": round(solar_power, 2),
            "charge_state": charge_state,
            "inverter_power": round(load_power, 2),
            "inverter_status": "Active"
        }


def send_to_supabase(table, data):
    """Send data to Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }

    try:
        response = requests.post(url, headers=headers, json=data)
        return response.status_code in [200, 201]
    except Exception as e:
        print(f"Error: {e}")
        return False


def main():
    print("Solar Monitoring Test Data Generator")
    print("=" * 50)
    print(f"Update interval: {UPDATE_INTERVAL} seconds")
    print("Press Ctrl+C to stop\n")

    simulator = SolarSimulator()
    iteration = 0
    last_history_log = 0

    while True:
        try:
            metrics = simulator.generate_metrics()

            if send_to_supabase("solar_metrics", metrics):
                print(f"[{iteration:04d}] Time: {simulator.time_of_day:05.2f}h | "
                      f"Solar: {metrics['solar_power']:6.1f}W | "
                      f"Battery: {metrics['battery_voltage']:5.2f}V ({metrics['battery_soc']:5.1f}%) | "
                      f"Load: {metrics['inverter_power']:6.1f}W | "
                      f"State: {metrics['charge_state']}")

            current_time = time.time()
            if current_time - last_history_log >= 30:
                send_to_supabase("solar_history", metrics)
                last_history_log = current_time
                print("    → Logged to history")

            iteration += 1
            time.sleep(UPDATE_INTERVAL)

        except KeyboardInterrupt:
            print("\n\nStopping generator...")
            break
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(5)


if __name__ == "__main__":
    main()
