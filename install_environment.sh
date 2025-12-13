#!/bin/bash

################################################################################
# Project Deployment Script for 78968 Casino Platform
# VPS Ubuntu Environment Setup: /var/app
# Domain: 78968.site | IP: 103.82.195.215
# 
# Apps: Backend, Frontend (Next.js), Client-CMS, CMS-Agent
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="/var/app"
DOMAIN="78968.site"
SERVER_IP="103.82.195.215"
APPS_DIR="$PROJECT_ROOT/apps"
LOGS_DIR="$PROJECT_ROOT/logs"
NODE_VERSION="16.20.0"
NGINX_CONF="/etc/nginx/sites-available"
SYSTEMD_UNITS="/etc/systemd/system"

echo -e "${BLUE}========================================"
echo "78968 Casino Platform Setup"
echo "=======================================${NC}"

# ============================================================================
# 1. SYSTEM UPDATES & DEPENDENCIES
# ============================================================================
echo -e "${YELLOW}[1/10] Updating system packages...${NC}"
sudo apt-get update -qq
sudo apt-get upgrade -y -qq
sudo apt-get install -y -qq \
    curl \
    wget \
    git \
    build-essential \
    python3 \
    python3-dev \
    nginx \
    certbot \
    python3-certbot-nginx \
    supervisor \
    redis-server \
    mysql-server \
    mysql-client \
    unzip \
    zip \
    htop \
    tmux \
    ufw

echo -e "${GREEN}✓ System packages installed${NC}"

# ============================================================================
# 2. NODEJS & NVM SETUP
# ============================================================================
echo -e "${YELLOW}[2/10] Installing Node.js ${NODE_VERSION}...${NC}"

# Install NVM if not exists
if ! command -v nvm &> /dev/null; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

# Install Node
nvm install $NODE_VERSION
nvm use $NODE_VERSION
nvm alias default $NODE_VERSION

# Verify installation
node --version
npm --version

# Install global npm packages
npm install -g pm2 yarn pnpm

echo -e "${GREEN}✓ Node.js ${NODE_VERSION} installed${NC}"

# ============================================================================
# 3. DIRECTORY STRUCTURE
# ============================================================================
echo -e "${YELLOW}[3/10] Setting up directory structure...${NC}"

# Create directories
sudo mkdir -p $PROJECT_ROOT/{apps,logs,configs,ssl,backups}
sudo mkdir -p $LOGS_DIR/{backend,frontend,client-cms,cms-agent,nginx}
sudo mkdir -p $PROJECT_ROOT/apps/{backend,frontend,client-cms,cms-agent}
sudo mkdir -p $PROJECT_ROOT/database/{backups,migrations}

# Set permissions
sudo chown -R $USER:$USER $PROJECT_ROOT

echo -e "${GREEN}✓ Directory structure created${NC}"

# ============================================================================
# 4. DATABASE SETUP (MySQL)
# ============================================================================
echo -e "${YELLOW}[4/10] Setting up MySQL database...${NC}"

# Start MySQL service
sudo systemctl start mysql
sudo systemctl enable mysql

# Create database
mysql -u root -e "CREATE DATABASE IF NOT EXISTS cgame CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -e "CREATE USER IF NOT EXISTS 'casino_user'@'localhost' IDENTIFIED BY 'Casino@2024#Secure';"
mysql -u root -e "GRANT ALL PRIVILEGES ON cgame.* TO 'casino_user'@'localhost';"
mysql -u root -e "FLUSH PRIVILEGES;"

echo -e "${GREEN}✓ MySQL database configured${NC}"

# ============================================================================
# 5. REDIS SETUP
# ============================================================================
echo -e "${YELLOW}[5/10] Setting up Redis...${NC}"

sudo systemctl start redis-server
sudo systemctl enable redis-server

# Configure Redis for production
sudo sed -i 's/^# requirepass .*/requirepass Redis@2024#Secure/' /etc/redis/redis.conf
sudo redis-cli CONFIG REWRITE

echo -e "${GREEN}✓ Redis configured${NC}"

# ============================================================================
# 6. FIREWALL SETUP (UFW)
# ============================================================================
echo -e "${YELLOW}[6/10] Configuring firewall...${NC}"

sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 8008/tcp    # SocketIO
sudo ufw allow 8009/tcp    # Express
sudo ufw allow 3000/tcp    # Next.js
sudo ufw allow 3001/tcp    # Client-CMS
sudo ufw allow 3002/tcp    # CMS-Agent
sudo ufw allow 3306/tcp    # MySQL (internal)
sudo ufw allow 6379/tcp    # Redis (internal)
sudo ufw --force enable

echo -e "${GREEN}✓ Firewall configured${NC}"

# ============================================================================
# 7. SSL CERTIFICATES (Let's Encrypt)
# ============================================================================
echo -e "${YELLOW}[7/10] Setting up SSL certificates...${NC}"

sudo certbot certonly --standalone -d $DOMAIN -d "*.$DOMAIN" --non-interactive --agree-tos --email admin@$DOMAIN

echo -e "${GREEN}✓ SSL certificates configured${NC}"

# ============================================================================
# 8. NGINX CONFIGURATION
# ============================================================================
echo -e "${YELLOW}[8/10] Configuring Nginx reverse proxy...${NC}"

# Remove default Nginx config
sudo rm -f /etc/nginx/sites-enabled/default

# Backend API Configuration
sudo tee /etc/nginx/sites-available/backend.conf > /dev/null <<'EOF'
upstream backend_api {
    server 127.0.0.1:8009;
    keepalive 64;
}

upstream socketio_server {
    server 127.0.0.1:8008;
    keepalive 64;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.78968.site;

    ssl_certificate /etc/letsencrypt/live/78968.site/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/78968.site/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    client_max_body_size 100M;

    location / {
        proxy_pass http://backend_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io {
        proxy_pass http://socketio_server;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name api.78968.site;
    return 301 https://$server_name$request_uri;
}
EOF

# Frontend Configuration
sudo tee /etc/nginx/sites-available/frontend.conf > /dev/null <<'EOF'
upstream frontend_app {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name 78968.site www.78968.site;

    ssl_certificate /etc/letsencrypt/live/78968.site/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/78968.site/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    client_max_body_size 100M;

    location / {
        proxy_pass http://frontend_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name 78968.site www.78968.site;
    return 301 https://$server_name$request_uri;
}
EOF

# CMS Configuration
sudo tee /etc/nginx/sites-available/cms.conf > /dev/null <<'EOF'
upstream cms_app {
    server 127.0.0.1:3001;
    keepalive 64;
}

upstream cms_agent {
    server 127.0.0.1:3002;
    keepalive 64;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name cms.78968.site;

    ssl_certificate /etc/letsencrypt/live/78968.site/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/78968.site/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    client_max_body_size 100M;

    location / {
        proxy_pass http://cms_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name agent.78968.site;

    ssl_certificate /etc/letsencrypt/live/78968.site/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/78968.site/privkey.pem;

    location / {
        proxy_pass http://cms_agent;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name cms.78968.site agent.78968.site;
    return 301 https://$server_name$request_uri;
}
EOF

# Enable sites
sudo ln -sf /etc/nginx/sites-available/backend.conf /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/frontend.conf /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/cms.conf /etc/nginx/sites-enabled/

# Test and reload Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

echo -e "${GREEN}✓ Nginx configured${NC}"

# ============================================================================
# 9. ENVIRONMENT FILES & APP SETUP
# ============================================================================
echo -e "${YELLOW}[9/10] Setting up application environments...${NC}"

# Backend .env
cat > $PROJECT_ROOT/apps/backend/.env <<'BACKEND_ENV'
ENV_ENVIROMENT=production
PORT=8009
JWT_SCRET_KEY=your_jwt_secret_key_change_this_in_production
JWT_EXPIRES_IN=86400
SESSION_SECRET=your_session_secret_change_this_in_production
SITE_DOMAIN=78968.site

# Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=casino_user
DB_PASS=Casino@2024#Secure
DB_NAME=cgame

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=Redis@2024#Secure

# Socket IO
SOCKET_PORT=8008
SOCKET_HOST=0.0.0.0

# API Settings
API_TIMEOUT=30000
MAX_REQUEST_SIZE=100mb

# Logging
LOG_LEVEL=info
LOG_DIR=/var/app/logs/backend

# Features
MAINTENANCE_MODE=false
BACKEND_ENV

# Frontend .env
cat > $PROJECT_ROOT/apps/frontend/.env.local <<'FRONTEND_ENV'
NEXT_PUBLIC_API_URL=https://api.78968.site
NEXT_PUBLIC_DOMAIN=78968.site
NEXT_PUBLIC_APP_NAME=78968
NEXT_PUBLIC_LOG_LEVEL=info
FRONTEND_ENV

# Client CMS .env
cat > $PROJECT_ROOT/apps/client-cms/.env <<'CMS_ENV'
NODE_ENV=production
PORT=3001
SESSION_SECRET=cms_session_secret_change_this
API_URL=https://api.78968.site
JWT_SECRET=cms_jwt_secret_change_this

# Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=casino_user
DB_PASS=Casino@2024#Secure
DB_NAME=cgame

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=Redis@2024#Secure

LOG_DIR=/var/app/logs/client-cms
CMS_ENV

# CMS Agent .env
cat > $PROJECT_ROOT/apps/cms-agent/.env <<'AGENT_ENV'
NODE_ENV=production
PORT=3002
SESSION_SECRET=agent_session_secret_change_this
API_URL=https://api.78968.site

# Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=casino_user
DB_PASS=Casino@2024#Secure
DB_NAME=cgame

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=Redis@2024#Secure

LOG_DIR=/var/app/logs/cms-agent
AGENT_ENV

echo -e "${GREEN}✓ Environment files created${NC}"

# ============================================================================
# 10. PM2 ECOSYSTEM CONFIGURATION
# ============================================================================
echo -e "${YELLOW}[10/10] Setting up PM2 process manager...${NC}"

cat > $PROJECT_ROOT/ecosystem.config.js <<'PM2_CONFIG'
module.exports = {
  apps: [
    {
      name: 'backend-api',
      script: 'server.js',
      cwd: '/var/app/apps/backend',
      instances: 4,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 8009
      },
      error_file: '/var/app/logs/backend/error.log',
      out_file: '/var/app/logs/backend/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'frontend',
      script: 'npm',
      args: 'start',
      cwd: '/var/app/apps/frontend',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/app/logs/frontend/error.log',
      out_file: '/var/app/logs/frontend/out.log',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '512M'
    },
    {
      name: 'client-cms',
      script: 'server.js',
      cwd: '/var/app/apps/client-cms',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/app/logs/client-cms/error.log',
      out_file: '/var/app/logs/client-cms/out.log',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '512M'
    },
    {
      name: 'cms-agent',
      script: 'server.js',
      cwd: '/var/app/apps/cms-agent',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_file: '/var/app/logs/cms-agent/error.log',
      out_file: '/var/app/logs/cms-agent/out.log',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '512M'
    }
  ]
};
PM2_CONFIG

# Install dependencies for all apps (if source files exist)
echo "Installing application dependencies..."

for app in backend frontend client-cms cms-agent; do
    if [ -d "$PROJECT_ROOT/apps/$app" ] && [ -f "$PROJECT_ROOT/apps/$app/package.json" ]; then
        echo "  Installing $app dependencies..."
        cd "$PROJECT_ROOT/apps/$app"
        npm ci --production
    fi
done

# Start PM2 apps
pm2 start $PROJECT_ROOT/ecosystem.config.js
pm2 save
pm2 startup systemd -u $USER --hp $HOME
sudo systemctl start pm2-$USER

echo -e "${GREEN}✓ PM2 process manager configured${NC}"

# ============================================================================
# STARTUP COMPLETE
# ============================================================================
echo ""
echo -e "${BLUE}========================================"
echo "Setup Complete! 🎉"
echo "=======================================${NC}"
echo ""
echo -e "${YELLOW}Application URLs:${NC}"
echo "  Frontend: https://78968.site"
echo "  Backend API: https://api.78968.site"
echo "  Client CMS: https://cms.78968.site"
echo "  CMS Agent: https://agent.78968.site"
echo ""
echo -e "${YELLOW}Important Files:${NC}"
echo "  App Directory: $PROJECT_ROOT/apps"
echo "  Logs Directory: $LOGS_DIR"
echo "  PM2 Config: $PROJECT_ROOT/ecosystem.config.js"
echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo "  View PM2 logs: pm2 logs"
echo "  Restart app: pm2 restart [app-name]"
echo "  Stop app: pm2 stop [app-name]"
echo "  SSH: ssh -i key.pem ubuntu@$SERVER_IP"
echo ""
echo -e "${YELLOW}Database Credentials:${NC}"
echo "  User: casino_user"
echo "  Password: Casino@2024#Secure"
echo "  Database: cgame"
echo ""
echo -e "${YELLOW}Redis Credentials:${NC}"
echo "  Password: Redis@2024#Secure"
echo ""
echo -e "${RED}⚠️  IMPORTANT: Change all default credentials in production!${NC}"
echo ""
