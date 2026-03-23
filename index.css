#!/bin/bash

DASHBOARD_DIR="$HOME/home-dashboard"
LOG_FILE="$DASHBOARD_DIR/auto-update.log"
CHECK_INTERVAL=900
UPDATE_TRACKER_URL="http://localhost:3000/api/update-tracker"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

get_device_id() {
    DEVICE_ID_FILE="$DASHBOARD_DIR/raspberry-pi/.device-id"
    if [ -f "$DEVICE_ID_FILE" ]; then
        cat "$DEVICE_ID_FILE"
    else
        echo "unknown"
    fi
}

update_check_time() {
    DEVICE_ID=$(get_device_id)
    curl -s -X POST "$UPDATE_TRACKER_URL" \
        -H "Content-Type: application/json" \
        -d "{\"device_id\":\"$DEVICE_ID\",\"type\":\"check\"}" > /dev/null 2>&1
}

update_last_update_time() {
    DEVICE_ID=$(get_device_id)
    curl -s -X POST "$UPDATE_TRACKER_URL" \
        -H "Content-Type: application/json" \
        -d "{\"device_id\":\"$DEVICE_ID\",\"type\":\"update\"}" > /dev/null 2>&1
}

update_dashboard() {
    log "Changes detected! Starting update..."

    cd "$DASHBOARD_DIR" || exit 1

    log "Pulling latest changes..."
    if ! git pull; then
        log "ERROR: Git pull failed"
        return 1
    fi

    log "Installing dependencies..."
    if ! npm install; then
        log "ERROR: npm install failed"
        return 1
    fi

    log "Building dashboard..."
    if ! npm run build; then
        log "ERROR: Build failed"
        return 1
    fi

    log "Restarting dashboard with PM2..."
    pm2 restart home-dashboard
    pm2 restart home-dashboard-heartbeat

    log "Update completed successfully!"
    update_last_update_time
    return 0
}

log "Auto-updater started. Checking for updates every $CHECK_INTERVAL seconds..."

cd "$DASHBOARD_DIR" || exit 1

while true; do
    log "Checking for updates..."
    update_check_time
    git fetch origin > /dev/null 2>&1

    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/$(git rev-parse --abbrev-ref HEAD))

    if [ "$LOCAL" != "$REMOTE" ]; then
        log "Update available (Local: ${LOCAL:0:7}, Remote: ${REMOTE:0:7})"
        update_dashboard
    else
        log "No updates available. Dashboard is up to date."
    fi

    sleep $CHECK_INTERVAL
done
