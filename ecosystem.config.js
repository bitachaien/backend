module.exports = {
  apps: [
    {
      name: "78968_SYSTEM_CORE",
      script: "./server.js",
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      // Development environment - used when running `pm2 start ecosystem.config.js`
      env: {
        NODE_ENV: "development",
        ENV_ENVIROMENT: "develop",
        NODE_OPTIONS: "--openssl-legacy-provider",

        APPLICATION_NAME: "78968_SYSTEM_CORE",
        APPLICATION_SCRET_KEY: "application_scret_key",

        JWT_SCRET_KEY: "bUfxkJXG5xOtaOqRyTmXqWGl4ZxNSyAPbJGVfc7DKix2lyBMJn6TtmKQER52q2eC",
        JWT_EXPIRES_IN: "1d",
        SESSION_SECRET: "bUfxkJXG5xOtaOqRyTmXqWGl4ZxNS",

        PORT: 8009,
        PORT_SOCKET_IO: 8008,

        MYSQL_HOST: "localhost",
        MYSQL_PORT: 3306,
        MYSQL_USERNAME: "admin",
        MYSQL_PASSWORD: "Noname@2022",
        MYSQL_DATABASE: "cgame",

        REDIS_HOST: "localhost",
        REDIS_PORT: 6379,
        REDIS_PASSWORD: "12345678a",

        SITE_DOMAIN: "78968.site",
        TELEGRAM_TOKEN_DEPLOY: "",
        TELEGRAM_GROUP_DEPLOY: "",

        // CORS allowed origins (development fallback)
        CORS_ALLOWED_ORIGINS:
          "https://vn.78968.site,https://www.78968.site,https://78968.site,https://m.78968.site,https://api.78968.site,http://localhost:3000,http://localhost:8009,http://localhost:8001,http://localhost:3443",
      },

      // Production environment - used when running `pm2 start ecosystem.config.js --env production`
      env_production: {
        NODE_ENV: "production",
        ENV_ENVIROMENT: "production",

        APPLICATION_NAME: "78968",
        APPLICATION_SCRET_KEY: "replace_with_secure_key",

        JWT_SCRET_KEY: "replace_with_long_jwt_secret",
        JWT_EXPIRES_IN: "7d",
        SESSION_SECRET: "replace_with_strong_random_string",

        // Ports used by the app and socket
        PORT: 4000,
        PORT_SOCKET_IO: 4001,

        // MySQL (production values - replace before deploy)
        MYSQL_HOST: "127.0.0.1",
        MYSQL_PORT: 3306,
        MYSQL_USERNAME: "dbuser",
        MYSQL_PASSWORD: "dbpassword",
        MYSQL_DATABASE: "dbname",

        // Redis
        REDIS_HOST: "127.0.0.1",
        REDIS_PORT: 6379,
        REDIS_PASSWORD: "redispassword",

        // Base path (if code uses PWD)
        PWD: "/var/www/Server",

        // CORS - comma-separated allowed origins
        CORS_ALLOWED_ORIGINS:
          "https://vn.78968.site,https://www.78968.site,https://78968.site,https://m.78968.site,https://api.78968.site,http://localhost:3000,http://localhost:8009,http://localhost:8001,http://localhost:3443",
      },

      error_file: "./logs/error.log",
      out_file: "./logs/out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
module.exports = {
  apps: [
    {
      name: "78968_SYSTEM_CORE",
      script: "./server.js",              // File chạy chính của bạn
      interpreter: "node",               // Dùng Node.js 18 trở lên
      instances: 1,
      exec_mode: "fork",                 // Hoặc "cluster" nếu muốn tận dụng đa nhân CPU
      watch: false,
      env: {
        // =============== Cấu hình môi trường ===============
        NODE_ENV: "development",
        ENV_ENVIROMENT: "develop",
        NODE_OPTIONS: "--openssl-legacy-provider",

        APPLICATION_NAME: "78968_SYSTEM_CORE",
        APPLICATION_SCRET_KEY: "application_scret_key",

        // =============== JWT Config ===============
        JWT_SCRET_KEY: "bUfxkJXG5xOtaOqRyTmXqWGl4ZxNSyAPbJGVfc7DKix2lyBMJn6TtmKQER52q2eC",
        JWT_EXPIRES_IN: "1d",
        SESSION_SECRET: "bUfxkJXG5xOtaOqRyTmXqWGl4ZxNS",

        // =============== Port ===============
        PORT: 8009,
        PORT_SOCKET_IO: 8008,

        // =============== MySQL ===============
        MYSQL_HOST: "localhost",
        MYSQL_PORT: 3306,
        MYSQL_USERNAME: "admin",
        MYSQL_PASSWORD: "Noname@2022",
        MYSQL_DATABASE: "cgame",

        // =============== Redis ===============
        REDIS_HOST: "localhost",
        REDIS_PORT: 6379,
        REDIS_PASSWORD: "12345678",

        // =============== Other ===============
        SITE_DOMAIN: "78968.site",
        TELEGRAM_TOKEN_DEPLOY: "7740871198:AAHCkgprsCo4gTQRF1XqKtnTBdQK4FNf20w",
        TELEGRAM_GROUP_DEPLOY: "-1003453325048",

      },

      // =============== Logging ===============
      error_file: "./logs/error.log",
      out_file: "./logs/out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss"
    }
  ]
};
