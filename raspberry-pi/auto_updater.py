#!/usr/bin/env python3
"""
Auto-Updater for Raspberry Pi Solar Collector

Monitors for code updates on the dashboard and Pi collector, automatically
downloading and applying new versions. Checks for updates every hour.

Installation:
pip3 install requests

Usage:
python3 auto_updater.py

The script runs continuously and checks for updates at regular intervals.
"""

import os
import sys
import json
import requests
import time
import subprocess
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict

COLLECTOR_VERSION = "1.0.0"
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://0ec90b57d6e95fcbda19832f.supabase.co")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw")

DEVICE_ID = "raspberry_pi_collector"
UPDATE_CHECK_INTERVAL = 3600
UPDATES_DIR = Path("/tmp/solar_updates")
LOG_FILE = Path("/tmp/solar_updater.log")


def log_message(message: str, level: str = "INFO"):
    """Log messages with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"[{timestamp}] [{level}] {message}"
    print(log_entry)

    try:
        with open(LOG_FILE, "a") as f:
            f.write(log_entry + "\n")
    except Exception as e:
        print(f"Error writing to log: {e}")


def check_for_updates(component: str, current_version: str) -> Optional[Dict]:
    """Check if updates are available for a component"""
    try:
        api_url = f"{SUPABASE_URL}/functions/v1/check-updates"

        response = requests.post(
            api_url,
            headers={
                "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "component": component,
                "current_version": current_version,
                "device_id": DEVICE_ID,
            },
            timeout=10
        )

        if response.status_code == 200:
            data = response.json()
            return data
        else:
            log_message(f"Failed to check updates: {response.status_code}", "WARNING")
            return None

    except Exception as e:
        log_message(f"Error checking for updates: {e}", "ERROR")
        return None


def download_file(url: str, destination: Path) -> bool:
    """Download a file with progress"""
    try:
        destination.parent.mkdir(parents=True, exist_ok=True)

        response = requests.get(url, timeout=30, stream=True)

        if response.status_code == 200:
            with open(destination, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)

            log_message(f"Downloaded: {destination.name}")
            return True
        else:
            log_message(f"Download failed: {response.status_code}", "ERROR")
            return False

    except Exception as e:
        log_message(f"Error downloading file: {e}", "ERROR")
        return False


def verify_file_integrity(file_path: Path, expected_hash: Optional[str] = None) -> bool:
    """Verify file integrity using SHA256"""
    try:
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)

        file_hash = sha256_hash.hexdigest()
        log_message(f"File hash: {file_hash}")

        if expected_hash and file_hash != expected_hash:
            log_message("File integrity check failed", "ERROR")
            return False

        return True

    except Exception as e:
        log_message(f"Error verifying file: {e}", "ERROR")
        return False


def update_collector(new_version: str, deployment_url: str) -> bool:
    """Update the Victron collector script"""
    try:
        log_message(f"Starting collector update to version {new_version}")

        download_path = UPDATES_DIR / f"victron_collector_v{new_version}.py"

        if not download_file(deployment_url, download_path):
            return False

        if not verify_file_integrity(download_path):
            return False

        backup_path = Path("victron_collector.py.backup")
        if Path("victron_collector.py").exists():
            Path("victron_collector.py").rename(backup_path)
            log_message(f"Backed up current version to {backup_path}")

        download_path.rename("victron_collector.py")
        log_message(f"Successfully updated to version {new_version}")

        log_update_status("pi_collector", COLLECTOR_VERSION, new_version, "success")

        return True

    except Exception as e:
        log_message(f"Error updating collector: {e}", "ERROR")
        log_update_status("pi_collector", COLLECTOR_VERSION, new_version, "failed", str(e))
        return False


def log_update_status(component: str, from_version: str, to_version: str,
                     status: str, error_message: Optional[str] = None):
    """Log update attempt locally"""
    try:
        status_entry = {
            "component": component,
            "from_version": from_version,
            "to_version": to_version,
            "status": status,
            "device_id": DEVICE_ID,
            "timestamp": datetime.utcnow().isoformat(),
        }

        if error_message:
            status_entry["error_message"] = error_message

        log_message(f"Update status: {component} -> {status}")
        log_message(json.dumps(status_entry, indent=2))

    except Exception as e:
        log_message(f"Error logging update status: {e}", "WARNING")


def restart_collector():
    """Restart the collector service (if using systemd)"""
    try:
        result = subprocess.run(
            ["sudo", "systemctl", "restart", "solar_collector"],
            capture_output=True,
            timeout=10
        )

        if result.returncode == 0:
            log_message("Collector service restarted successfully")
            return True
        else:
            log_message(f"Failed to restart service: {result.stderr.decode()}", "WARNING")
            return False

    except Exception as e:
        log_message(f"Could not restart service: {e}", "WARNING")
        return False


def cleanup_old_updates():
    """Remove old downloaded update files"""
    try:
        if UPDATES_DIR.exists():
            for file in UPDATES_DIR.glob("*"):
                if file.is_file() and file.stat().st_mtime < time.time() - 86400:
                    file.unlink()
                    log_message(f"Cleaned up: {file.name}")

    except Exception as e:
        log_message(f"Error cleaning up: {e}", "WARNING")


def run_update_loop():
    """Main update checking loop"""
    log_message("Auto-updater started")
    log_message(f"Collector version: {COLLECTOR_VERSION}")
    log_message(f"Device ID: {DEVICE_ID}")
    log_message(f"Check interval: {UPDATE_CHECK_INTERVAL}s")

    while True:
        try:
            log_message("Checking for updates...")

            update_info = check_for_updates("pi_collector", COLLECTOR_VERSION)

            if update_info and update_info.get("update_available"):
                new_version = update_info.get("latest_version")
                deployment_url = update_info.get("deployment_url")

                log_message(f"Update available: {new_version}")

                if deployment_url:
                    if update_collector(new_version, deployment_url):
                        log_message("Update completed successfully")
                        restart_collector()
                    else:
                        log_message("Update failed", "ERROR")
            else:
                log_message("No updates available")

            cleanup_old_updates()

            time.sleep(UPDATE_CHECK_INTERVAL)

        except KeyboardInterrupt:
            log_message("Auto-updater stopped")
            break
        except Exception as e:
            log_message(f"Error in update loop: {e}", "ERROR")
            time.sleep(60)


if __name__ == "__main__":
    run_update_loop()
