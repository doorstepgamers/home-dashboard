#!/bin/bash

DASHBOARD_DIR="$HOME/dashboard"
LOG_FILE="$DASHBOARD_DIR/auto-update.log"
CHECK_INTERVAL=300

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
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

    log "Restarting dashboard service..."
    sudo systemctl restart dashboard

    log "Update completed successfully!"
    return 0
}

log "Auto-updater started. Checking for updates every $CHECK_INTERVAL seconds..."

cd "$DASHBOARD_DIR" || exit 1

while true; do
    git fetch origin > /dev/null 2>&1

    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/$(git rev-parse --abbrev-ref HEAD))

    if [ "$LOCAL" != "$REMOTE" ]; then
        log "Update available (Local: ${LOCAL:0:7}, Remote: ${REMOTE:0:7})"
        update_dashboard
    fi

    sleep $CHECK_INTERVAL
done
