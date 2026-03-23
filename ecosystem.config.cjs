module.exports = {
  apps: [
    {
      name: 'home-dashboard',
      script: 'raspberry-pi/start-production.js',
      cwd: '/home/pi/home-dashboard',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/home/pi/.pm2/logs/home-dashboard-error.log',
      out_file: '/home/pi/.pm2/logs/home-dashboard-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'home-dashboard-heartbeat',
      script: 'raspberry-pi/heartbeat.js',
      cwd: '/home/pi/home-dashboard',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '100M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/home/pi/.pm2/logs/home-dashboard-heartbeat-error.log',
      out_file: '/home/pi/.pm2/logs/home-dashboard-heartbeat-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
