# Auto-Update System Setup Guide

This guide explains how to set up automatic updates for your solar monitoring system on the Raspberry Pi and dashboard.

## Overview

The auto-update system allows:
- **Dashboard**: Automatic checking for new versions via update notification banner
- **Raspberry Pi Collector**: Automatic downloading and installation of updates
- **Version Tracking**: Complete audit trail of all updates via Supabase

## How It Works

1. **Version Manifest** - JSON file on GitHub with latest versions for all components
2. **Update Checker Edge Function** - Cloud-based service that checks the manifest for new versions
3. **Dashboard Notification** - Shows update banner when new version is available
4. **Pi Auto-Updater** - Background service that automatically downloads and installs updates
5. **Local Logging** - All updates logged to `/tmp/solar_updater.log`

## Installation on Raspberry Pi

### Step 1: Install Dependencies

```bash
pip3 install requests
```

### Step 2: Set Up the Auto-Updater Service

Copy the auto-updater files:

```bash
cp auto_updater.py /home/pi/solar_monitor/
cp solar_updater.service /etc/systemd/system/
```

### Step 3: Enable the Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable solar_updater
sudo systemctl start solar_updater
```

### Step 4: Verify It's Running

```bash
sudo systemctl status solar_updater
```

Check the logs:

```bash
journalctl -u solar_updater -f
```

## Adding New Versions

When you want to release a new version:

1. **Prepare Your Code**
   - Update version numbers:
     - Dashboard: `src/hooks/useUpdateChecker.ts` - change `APP_VERSION`
     - Pi Collector: `raspberry-pi/auto_updater.py` - change `COLLECTOR_VERSION`
   - Test thoroughly
   - Commit to Git

2. **Upload to GitHub Releases**
   - Create a GitHub release with the new version tag
   - Upload the Python script or dashboard as release assets
   - Copy the raw download URL

3. **Update Version Manifest**
   Create/update `versions.json` in your GitHub repo root:
   ```json
   {
     "dashboard": {
       "version": "1.0.1",
       "download_url": "https://github.com/yourrepo/releases/tag/v1.0.1",
       "release_date": "2024-03-13"
     },
     "pi_collector": {
       "version": "1.0.1",
       "download_url": "https://raw.githubusercontent.com/yourrepo/main/raspberry-pi/victron_collector.py",
       "release_date": "2024-03-13"
     }
   }
   ```

4. **Update Edge Function**
   - Edit `supabase/functions/check-updates/index.ts`
   - Update `VERSION_MANIFEST_URL` to point to your manifest
   - Redeploy: `supabase functions deploy check-updates`

## Dashboard Auto-Update

The dashboard automatically:
1. Checks for updates every 5 minutes
2. Shows a notification banner when a new version is available
3. Provides a download link to the new version

Users can:
- Click "Download Now" to get the latest version
- Dismiss the notification if preferred

## Monitoring Updates

All updates are logged locally:

```bash
tail -f /tmp/solar_updater.log
```

Check recent updates:

```bash
grep "Update status" /tmp/solar_updater.log | tail -20
```

## Troubleshooting

### Auto-Updater Not Running

Check if service is active:
```bash
sudo systemctl is-active solar_updater
```

Check for errors:
```bash
journalctl -u solar_updater -n 50
```

### Manual Update

If automatic update fails, manually update:

1. Download the new version:
   ```bash
   wget <deployment_url> -O victron_collector.py.new
   ```

2. Back up current version:
   ```bash
   cp victron_collector.py victron_collector.py.backup
   ```

3. Replace with new version:
   ```bash
   mv victron_collector.py.new victron_collector.py
   ```

4. Restart the collector:
   ```bash
   sudo systemctl restart solar_collector
   ```

### Checking Update Logs

All update attempts are logged:
- Local: `/tmp/solar_updater.log`
- Cloud: `update_logs` table in Supabase

## Best Practices

1. **Test Before Release** - Always test new versions locally first
2. **Keep Backups** - The system automatically backs up before updating
3. **Monitor Logs** - Check update logs regularly to catch issues
4. **Version Numbers** - Use semantic versioning (X.Y.Z)
5. **Documentation** - Document what changed in each version

## Configuration

Edit `/home/pi/solar_monitor/auto_updater.py` to change:
- `COLLECTOR_VERSION` - Current version number
- `UPDATE_CHECK_INTERVAL` - How often to check (in seconds, default 3600 = 1 hour)
- `UPDATES_DIR` - Where to store downloaded files

## FAQ

**Q: What happens if an update fails?**
A: The old version is automatically backed up as `victron_collector.py.backup`. Check logs for error details.

**Q: Can I disable auto-updates?**
A: Yes, stop the service: `sudo systemctl stop solar_updater`

**Q: How long does an update take?**
A: Typically 10-30 seconds depending on network speed.

**Q: Can I update manually?**
A: Yes, follow the manual update procedure in troubleshooting.

**Q: Are my settings preserved?**
A: Yes, only the Python script is replaced, all configurations remain intact.

**Q: Where do I put my GitHub manifest URL?**
A: Update `VERSION_MANIFEST_URL` in `supabase/functions/check-updates/index.ts` before deploying.
