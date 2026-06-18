module.exports = {
  apps: [
    {
      name: 'codebase-admin',
      script: 'dist/main.js',
      node_args: '--max-old-space-size=4096',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '4G',
      env: {
        NODE_ENV: 'production',
      },
      // Log configuration
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/error.log',
      out_file: './logs/output.log',
      merge_logs: true,
    },
  ],
};
