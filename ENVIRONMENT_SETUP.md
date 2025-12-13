# 78968 Casino Platform - Environment Requirements & Setup Guide

## Project Overview

78968 Casino Platform là một hệ thống casino trực tuyến bao gồm 4 ứng dụng chính:

| App | Type | Port | Technology | Function |
|-----|------|------|-----------|----------|
| **Backend API** | Node.js Server | 8009 | Express.js + Socket.IO | API, Realtime Gaming, Database |
| **Frontend** | Web App | 3000 | Next.js 15.5 | User Interface, Responsive UI |
| **Client CMS** | Management | 3001 | Express.js + EJS | Content Management (Admin) |
| **CMS Agent** | Agent Server | 3002 | Express.js | Agent Portal Management |

---

## System Requirements

### Hardware (VPS)
```
CPU: 4 vCPU (minimum 2)
RAM: 8GB (minimum 4GB)
Storage: 50GB SSD (minimum 20GB)
Network: 1 Gbps
OS: Ubuntu 20.04 LTS or later
```

### IP & Domain
```
Server IP: 103.82.195.215
Domain: 78968.site
Main Directory: /var/app
```

---

## Software Dependencies

### 1. Backend API
**Port:** 8009  
**Process Manager:** PM2 (4 instances cluster mode)  
**Database:** MySQL 5.7+  
**Cache:** Redis 5.0+

**Dependencies:**
```
Node.js: 16.20.0 (required: --openssl-legacy-provider flag)
npm: 8.x
Required Node packages:
  - express 4.18.2
  - sequelize (ORM)
  - axios (HTTP client)
  - socket.io (Real-time communication)
  - redis (Cache)
  - bcryptjs (Password hashing)
  - dotenv (Environment config)
  - @sentry/node (Error tracking)
```

**Key Configuration:**
```env
PORT=8009
SOCKET_PORT=8008
DB: MySQL (cgame database)
Cache: Redis (port 6379)
JWT_SECRET_KEY=**** (must be configured)
SESSION_SECRET=**** (must be configured)
```

### 2. Frontend (Next.js)
**Port:** 3000  
**Process Manager:** PM2 (2 instances)  
**Build Tool:** Next.js 15.5.2

**Dependencies:**
```
Node.js: 16.20.0+
npm: 8.x

Key packages:
  - next 15.5.2 (React framework)
  - react 18.x
  - react-dom 18.x
  - axios (API communication)
  - antd (UI components)
  - tailwindcss (Styling)
  - typescript 5.x
  - sass (SCSS support)
```

**Build Process:**
```bash
npm ci --production  # Install dependencies
next build           # Build optimized Next.js app
next start          # Start production server
```

### 3. Client CMS
**Port:** 3001  
**Process Manager:** PM2 (2 instances)  
**Template Engine:** EJS

**Dependencies:**
```
Node.js: 16.20.0+
npm: 8.x

Key packages:
  - express 4.18.2 (Web server)
  - ejs 3.1.8 (Template engine)
  - axios 1.1.2 (HTTP client)
  - bcryptjs (Password hashing)
  - express-session (Session management)
  - dotenv (Environment config)
```

### 4. CMS Agent
**Port:** 3002  
**Process Manager:** PM2 (2 instances)  
**Similar to Client CMS**

---

## System Services & Ports

| Service | Port | Status | Description |
|---------|------|--------|-------------|
| Nginx (HTTP) | 80 | ← → 443 | Reverse proxy, SSL termination |
| Nginx (HTTPS) | 443 | Active | Secure web server |
| Backend API | 8009 | Active | Express.js API server |
| Socket.IO | 8008 | Active | Real-time gaming |
| Frontend | 3000 | Active | Next.js application |
| Client CMS | 3001 | Active | Admin interface |
| CMS Agent | 3002 | Active | Agent management |
| MySQL | 3306 | Active | Database server |
| Redis | 6379 | Active | Cache/Session store |

---

## Database Configuration

### MySQL Setup
```
Database Name: cgame
Character Set: utf8mb4
Collation: utf8mb4_unicode_ci
User: casino_user
Password: Casino@2024#Secure (change in production)
Host: 127.0.0.1
Port: 3306
```

**Main Tables:**
```
- users (User accounts)
- user_devices (Device tracking)
- user_incentives (Bonuses/Rewards)
- balance_fluct (Balance history)
- bank_list (Bank providers)
- bank_user (User bank accounts)
- bank_histories (Deposit/Withdraw history)
- bet_histories (Game betting logs)
- api_product_configs (Game providers: DG, SA, JDB, etc.)
- api_game_configs (Individual games)
- promotions (Special offers)
- vips (VIP levels)
- mini_taixiu_* (Mini game: Tài Xỉu)
- xocxoc_* (Mini game: Xóc Xắc)
- configs (Site settings)
- messages (User notifications)
- agencies (Referral partners)
- admin_accounts (Admin users)
```

---

## Redis Configuration

```
Port: 6379
Password: Redis@2024#Secure (change in production)
Host: 127.0.0.1

Usage:
- Session store
- Cache layer
- Real-time data
- Pub/Sub for Socket.IO
```

---

## SSL/TLS Certificates

**Let's Encrypt Setup:**
```
Domains:
- 78968.site
- www.78968.site
- api.78968.site
- cms.78968.site
- agent.78968.site

Auto-renewal: Via Certbot
Certificate Path: /etc/letsencrypt/live/78968.site/
Renewal Check: Automatic daily
```

---

## Nginx Reverse Proxy Configuration

### Domain Mappings:
```
78968.site              → Frontend (3000)
api.78968.site          → Backend API (8009)
api.78968.site/socket.io → Socket.IO (8008)
cms.78968.site          → Client CMS (3001)
agent.78968.site        → CMS Agent (3002)
```

### Features:
- SSL/TLS termination
- Load balancing
- Gzip compression
- WebSocket support (Socket.IO)
- Rate limiting ready
- Client upload limit: 100MB

---

## Environment Variables

### Backend (.env)
```
ENV_ENVIROMENT=production
PORT=8009
SOCKET_PORT=8008
JWT_SCRET_KEY=your_secret_key_here
JWT_EXPIRES_IN=86400
SESSION_SECRET=your_session_secret_here
SITE_DOMAIN=78968.site

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=casino_user
DB_PASS=Casino@2024#Secure
DB_NAME=cgame

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=Redis@2024#Secure

SOCKET_HOST=0.0.0.0
MAINTENANCE_MODE=false
LOG_LEVEL=info
LOG_DIR=/var/app/logs/backend
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://api.78968.site
NEXT_PUBLIC_DOMAIN=78968.site
NEXT_PUBLIC_APP_NAME=78968
NEXT_PUBLIC_LOG_LEVEL=info
```

### Client CMS (.env)
```
NODE_ENV=production
PORT=3001
API_URL=https://api.78968.site
SESSION_SECRET=your_cms_secret_here
JWT_SECRET=your_jwt_secret_here

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=casino_user
DB_PASS=Casino@2024#Secure
DB_NAME=cgame

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=Redis@2024#Secure

LOG_DIR=/var/app/logs/client-cms
```

### CMS Agent (.env)
```
NODE_ENV=production
PORT=3002
API_URL=https://api.78968.site
SESSION_SECRET=your_agent_secret_here

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=casino_user
DB_PASS=Casino@2024#Secure
DB_NAME=cgame

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=Redis@2024#Secure

LOG_DIR=/var/app/logs/cms-agent
```

---

## Firewall Rules (UFW)

```bash
SSH: 22/tcp          # Server access
HTTP: 80/tcp         # Web traffic (redirects to HTTPS)
HTTPS: 443/tcp       # Secure web traffic
SocketIO: 8008/tcp   # Real-time gaming
Express: 8009/tcp    # Backend API
Next.js: 3000/tcp    # Frontend
CMS: 3001/tcp        # Admin panel
Agent: 3002/tcp      # Agent portal
MySQL: 3306/tcp      # Database (internal only)
Redis: 6379/tcp      # Cache (internal only)
```

---

## Process Management (PM2)

### Processes:
```
1. backend-api (4 instances, cluster mode)
   - Main API server with Socket.IO
   - Auto-restarts on crash
   - Max memory: 1GB per instance
   
2. frontend (2 instances)
   - Next.js production server
   - Max memory: 512MB per instance
   
3. client-cms (2 instances)
   - Admin content management
   - Max memory: 512MB per instance
   
4. cms-agent (2 instances)
   - Agent management portal
   - Max memory: 512MB per instance
```

### Useful Commands:
```bash
pm2 list                      # Show all processes
pm2 start ecosystem.config.js # Start all apps
pm2 stop [app-name]          # Stop specific app
pm2 restart [app-name]       # Restart specific app
pm2 logs [app-name]          # View app logs
pm2 save                     # Save PM2 state
pm2 startup                  # Enable auto-start on boot
```

---

## Backup & Maintenance

### Database Backups:
```bash
# Daily backup location: /var/app/database/backups/
# Automated via cron job or manual backup script
mysqldump -u casino_user -p cgame > backup_$(date +%Y%m%d).sql
```

### Log Rotation:
```
Logs stored in: /var/app/logs/
- backend/
- frontend/
- client-cms/
- cms-agent/
- nginx/

Auto-rotation via logrotate
```

---

## Deployment Workflow

### 1. Initial Setup (Execute once)
```bash
# Download and run setup script
curl -sL https://your-domain/install_environment.sh | bash

# Or run locally
chmod +x install_environment.sh
./install_environment.sh
```

### 2. Upload Application Code
```bash
# Copy apps to /var/app/apps/
scp -r backend ubuntu@103.82.195.215:/var/app/apps/
scp -r frontend ubuntu@103.82.195.215:/var/app/apps/
scp -r client-cms ubuntu@103.82.195.215:/var/app/apps/
scp -r cms-agent ubuntu@103.82.195.215:/var/app/apps/
```

### 3. Start Applications
```bash
ssh ubuntu@103.82.195.215

cd /var/app
pm2 start ecosystem.config.js
pm2 save
pm2 status
```

### 4. Verify Health
```bash
curl https://api.78968.site/health
curl https://78968.site
curl https://cms.78968.site
curl https://agent.78968.site
```

---

## Monitoring & Troubleshooting

### Health Checks:
```bash
# API health
curl -s https://api.78968.site/api/health | jq

# Frontend
curl -s https://78968.site -o /dev/null -w "%{http_code}\n"

# Database connection
mysql -u casino_user -p -h 127.0.0.1 -e "SHOW DATABASES;"

# Redis connection
redis-cli ping

# System resources
htop
ps aux | grep node
```

### View Logs:
```bash
# PM2 logs
pm2 logs backend-api
pm2 logs frontend
pm2 logs client-cms

# System logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Application logs
tail -f /var/app/logs/backend/out.log
tail -f /var/app/logs/frontend/out.log
```

### Common Issues:

#### Memory Leak
```bash
# Increase max memory restart in ecosystem.config.js
# Monitor: pm2 monit
```

#### Database Connection Failed
```bash
# Check MySQL service
sudo systemctl status mysql
sudo systemctl restart mysql

# Verify credentials in .env files
```

#### SSL Certificate Issues
```bash
# Renew certificates manually
sudo certbot renew --force-renewal

# Check certificate status
sudo certbot certificates
```

---

## Performance Tuning

### Node.js Optimization:
```bash
# In ecosystem.config.js: Use cluster mode
# Increase instances based on CPU cores
# Enable max_memory_restart to prevent leaks
```

### Database Optimization:
```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_user_id ON users(id);
CREATE INDEX idx_bet_uid ON bet_histories(uid);
CREATE INDEX idx_balance_uid ON balance_fluct(uid);

-- Run periodic maintenance
OPTIMIZE TABLE users;
ANALYZE TABLE bet_histories;
```

### Redis Optimization:
```bash
# Enable persistence (RDB or AOF)
# Set maxmemory eviction policy
# Monitor memory usage: redis-cli INFO memory
```

### Nginx Optimization:
```nginx
# Already configured in setup script:
- Gzip compression
- HTTP/2 support
- Connection pooling
- WebSocket support
```

---

## Security Checklist

- [ ] Change all default credentials
- [ ] Update JWT and SESSION secrets
- [ ] Enable UFW firewall
- [ ] Configure SSL certificates
- [ ] Set up regular database backups
- [ ] Enable audit logging
- [ ] Restrict admin panel access by IP
- [ ] Set up monitoring/alerts
- [ ] Regular security patches
- [ ] Use HTTPS everywhere
- [ ] Enable database user permissions
- [ ] Configure rate limiting
- [ ] Set up DDoS protection
- [ ] Enable CSRF protection
- [ ] Regular security audits

---

## Support & Maintenance

For issues or updates:
1. Check PM2 logs: `pm2 logs`
2. Review application logs in `/var/app/logs/`
3. Check Nginx configuration: `sudo nginx -t`
4. Monitor system resources: `htop`
5. Backup database before major updates

---

**Last Updated:** December 2025  
**Platform:** 78968 Casino  
**Version:** 1.0.0
