module.exports = {
  apps: [
    {
      name: 'hobbiz-backend',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
      // Graceful shutdown: wait up to 5s for active connections to finish
      kill_timeout: 5000,
      // Restart delay between crashes to avoid tight loops
      restart_delay: 1000,
    },
  ],
};
