# Home Dashboard

A beautiful, card-based home dashboard inspired by Home Assistant. Built with React, TypeScript, and Tailwind CSS, designed to run on a Raspberry Pi 3B.

## Features

- **Weather Card**: Real-time weather information with temperature, humidity, and wind speed
- **System Stats Card**: Live monitoring of CPU, memory, disk usage, and temperature
- **Auto-refresh**: All data updates automatically without page reload
- **Responsive Design**: Works perfectly on mobile, tablet, and desktop
- **Auto-deployment**: Automatically updates when you push changes to Git

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and add your configuration:
   ```bash
   cp .env.example .env
   ```

3. Get a free API key from [OpenWeatherMap](https://openweathermap.org/api)

4. Start development server:
   ```bash
   npm run dev
   ```

## Deployment to Raspberry Pi

**One-command setup!** See [RASPBERRY_PI_SETUP.md](./RASPBERRY_PI_SETUP.md) for details.

```bash
git clone YOUR_REPO ~/dashboard
cd ~/dashboard
chmod +x raspberry-pi/install.sh
./raspberry-pi/install.sh
```

The installer automatically:
- Installs all dependencies
- Builds the dashboard
- Sets up auto-start on boot
- Configures instant Git auto-updates via GitHub webhooks

Access at: `http://raspberrypi.local:3000`

## Auto-Update via GitHub Webhooks

No more manual pulling! When you push to GitHub, your Pi updates automatically within seconds.

### Setup (One-time)

1. Generate a webhook secret:
   ```bash
   openssl rand -hex 32
   ```

2. Add to your `.env` on the Pi:
   ```
   GITHUB_WEBHOOK_SECRET=your_secret_from_step_1
   ```

3. Restart the dashboard:
   ```bash
   pm2 restart home-dashboard
   ```

4. Go to your GitHub repo → Settings → Webhooks → Add webhook
   - **Payload URL**: `http://your-pi-ip:3000/api/webhook/github`
   - **Content type**: `application/json`
   - **Secret**: Enter the secret from step 1
   - **Events**: Select "Push events"
   - Click **Add webhook**

5. Test by making a commit and pushing:
   ```bash
   git push
   ```

Your Pi will automatically pull, install dependencies, build, and restart within seconds!

## Building

```bash
npm run build
```

This builds both the frontend (to `dist/`) and backend API server (to `dist-server/`).

## Project Structure

```
src/
├── components/
│   ├── Card.tsx              # Reusable card component
│   ├── WeatherCard.tsx       # Weather display card
│   └── SystemStatsCard.tsx   # System monitoring card
├── server/
│   ├── index.ts              # Express API server
│   └── system-stats.ts       # System stats collection
├── App.tsx                   # Main application
└── main.tsx                  # Entry point
```

## Adding New Cards

1. Create a new component in `src/components/`
2. Use the `Card` component for consistent styling
3. Import and add to the grid in `App.tsx`
4. Commit and push - your Pi will auto-update

## Technologies

- React 18
- TypeScript
- Tailwind CSS
- Vite
- Express
- Lucide React (icons)

## License

MIT
