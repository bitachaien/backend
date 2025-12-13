# 78968 Casino Platform - Quick Reference

## 🚀 Quick Setup (Copy & Paste)

```bash
# 1. SSH vào server
ssh -i key.pem ubuntu@103.82.195.215

# 2. Download & run setup script
curl -o install_env.sh https://your-repo/install_environment.sh
chmod +x install_env.sh
./install_env.sh

# 3. Upload apps (from local machine)
scp -r backend ubuntu@103.82.195.215:/var/app/apps/
scp -r frontend ubuntu@103.82.195.215:/var/app/apps/
scp -r client-cms ubuntu@103.82.195.215:/var/app/apps/
scp -r cms-agent ubuntu@103.82.195.215:/var/app/apps/

# 4. Build & start
ssh ubuntu@103.82.195.215
cd /var/app/apps/backend && npm ci && npm run build 2>/dev/null
cd /var/app/apps/frontend && npm ci && npm run build
cd /var/app/apps/client-cms && npm ci
cd /var/app/apps/cms-agent && npm ci

# 5. Start applications
cd /var/app
pm2 start ecosystem.config.js
pm2 save

# 6. Verify
curl https://78968.site
curl https://api.78968.site
pm2 list
```

---

## 📋 Application Overview

| Component | Port | URL | Technology |
|-----------|------|-----|------------|
| **Frontend** | 3000 | https://78968.site | Next.js 15.5 |
| **Backend API** | 8009 | https://api.78968.site | Express.js |
| **Socket.IO** | 8008 | https://api.78968.site/socket.io | Real-time |
| **Client CMS** | 3001 | https://cms.78968.site | Express + EJS |
| **CMS Agent** | 3002 | https://agent.78968.site | Express + EJS |
| **Database** | 3306 | 127.0.0.1 | MySQL (cgame) |
| **Cache** | 6379 | 127.0.0.1 | Redis |
| **Web Server** | 80/443 | 103.82.195.215 | Nginx |

---

## 🗂️ Directory Structure

```
/var/app/
├── apps/
│   ├── backend/              # Express API + Socket.IO
│   ├── frontend/             # Next.js application
│   ├── client-cms/           # Admin panel
│   └── cms-agent/            # Agent management
├── logs/
│   ├── backend/
│   ├── frontend/
│   ├── client-cms/
│   ├── cms-agent/
│   └── nginx/
├── database/
│   └── backups/
├── ssl/                      # SSL certificates (auto)
├── ecosystem.config.js       # PM2 configuration
└── configs/                  # App configurations
```

---

## 🔧 Environment Setup

### Key Variables Required

```env
# Backend
JWT_SCRET_KEY=unique_secret_minimum_32_chars
SESSION_SECRET=session_secret_minimum_32_chars
DB_USER=casino_user
DB_PASS=Casino@2024#Secure
REDIS_PASSWORD=Redis@2024#Secure

# Database
DB_HOST=127.0.0.1
DB_NAME=cgame
DB_PORT=3306

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Domains
SITE_DOMAIN=78968.site
NEXT_PUBLIC_API_URL=https://api.78968.site
```

---

## 🗄️ Database Info

```
Database: cgame
User: casino_user
Password: Casino@2024#Secure (change in production!)
Host: 127.0.0.1
Port: 3306
Charset: utf8mb4

Main Tables:
- users (player accounts)
- user_devices (login tracking)
- balance_fluct (transaction history)
- bet_histories (game logs)
- bank_user (player payment methods)
- api_product_configs (game providers)
- promotions (special offers)
- vips (VIP levels)
- admin_accounts (staff users)
```

---

## 🔐 Security Credentials

| Service | Username | Password | Notes |
|---------|----------|----------|-------|
| MySQL | casino_user | Casino@2024#Secure | Change! |
| Redis | (none) | Redis@2024#Secure | Change! |
| JWT Secret | - | **** | Must configure |
| SSL | Let's Encrypt | Auto-renew | Valid 90 days |

---

## 📊 System Requirements Met

✅ **OS:** Ubuntu 20.04+  
✅ **Node.js:** 16.20.0 (LTS)  
✅ **npm:** 8.x  
✅ **MySQL:** 5.7+  
✅ **Redis:** 5.0+  
✅ **Memory:** 8GB  
✅ **CPU:** 4 cores  
✅ **Disk:** 50GB SSD  

---

## 🚀 Start/Stop Commands

```bash
# Start all apps
pm2 start all

# Stop all apps
pm2 stop all

# Restart all apps
pm2 restart all

# View status
pm2 list

# View logs (real-time)
pm2 logs

# View specific app
pm2 logs backend-api

# Monitor resources
pm2 monit

# Save state for auto-start
pm2 save
pm2 startup
```

---

## 🔍 Monitoring Commands

```bash
# Process status
pm2 list

# Real-time monitoring
pm2 monit

# View logs
pm2 logs [app-name]

# System resources
htop

# Check ports
sudo ss -tlnp | grep LISTEN

# Check disk space
df -h

# Check memory
free -h

# Check database
mysql -u casino_user -p cgame -e "SELECT COUNT(*) FROM users;"

# Check Redis
redis-cli ping

# Check Nginx
sudo nginx -t
```

---

## 🌐 Useful URLs

```
Frontend:       https://78968.site
API:            https://api.78968.site
Admin CMS:      https://cms.78968.site
Agent Portal:   https://agent.78968.site
SSL Test:       https://www.ssllabs.com/ssltest/?d=78968.site
Domain Test:    https://mxtoolbox.com/
```

---

## 📝 Common Tasks

### Deploy New Code
```bash
cd /var/app/apps/backend
git pull origin main
npm ci
pm2 restart backend-api
pm2 logs backend-api
```

### Backup Database
```bash
mysqldump -u casino_user -p cgame > backup_$(date +%Y%m%d).sql
gzip backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
gunzip backup_20241213.sql.gz
mysql -u casino_user -p cgame < backup_20241213.sql
```

### View Error Logs
```bash
pm2 logs backend-api --err
tail -f /var/log/nginx/error.log
```

### Increase Max Upload Size
```bash
# Edit /etc/nginx/sites-available/backend.conf
# Change: client_max_body_size 200M;
# Restart: sudo systemctl reload nginx
```

### Change Database Password
```bash
mysqladmin -u casino_user -p password "NewPassword123"
# Update .env files with new password
```

---

## ⚠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| **Apps not starting** | `pm2 logs` to check errors |
| **502 Bad Gateway** | Check if upstream is running: `pm2 list` |
| **Database connection error** | Verify MySQL is running: `sudo systemctl status mysql` |
| **SSL certificate expired** | Renew: `sudo certbot renew --force-renewal` |
| **Out of memory** | Reduce instances in ecosystem.config.js |
| **High CPU usage** | Check `pm2 monit` or restart with `pm2 restart all` |
| **Disk space full** | Check logs: `du -sh /var/app/logs/*` |
| **Redis connection failed** | Check service: `sudo systemctl status redis-server` |

---

## 📞 Support

**Issues to check:**
1. Application logs: `pm2 logs`
2. System resources: `pm2 monit`
3. Database: `mysql -u casino_user -p cgame -e "SHOW TABLES;"`
4. Nginx: `sudo nginx -t`
5. Firewall: `sudo ufw status`

---

## 🔄 Update Process

```bash
# Pull latest code
cd /var/app/apps/backend
git pull origin main

# Update dependencies
npm ci

# Restart gracefully
pm2 reload backend-api

# Verify
pm2 logs backend-api
curl https://api.78968.site
```

---

## 📅 Maintenance Schedule

- **Daily:** Check PM2 status
- **Weekly:** Backup database
- **Monthly:** Update system packages
- **Quarterly:** Security audit
- **Yearly:** Update Node.js

---

## 🎯 Performance Targets

- **Frontend Load:** < 2 seconds
- **API Response:** < 100ms
- **Database Query:** < 50ms
- **Uptime:** > 99.5%
- **Error Rate:** < 0.1%

---

## 📚 Documentation Files

- **ENVIRONMENT_SETUP.md** - Detailed environment configuration
- **DEPLOYMENT_GUIDE.md** - Step-by-step deployment instructions
- **install_environment.sh** - Automated setup script
- **ecosystem.config.js** - PM2 process configuration
- **seed_data.sql** - Initial database data

---

**Quick Links:**
- [Setup Script](./install_environment.sh)
- [Full Documentation](./ENVIRONMENT_SETUP.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Server IP](103.82.195.215)
- [Domain](78968.site)

---

**Last Updated:** December 2025  
**Platform:** 78968 Casino Platform v1.0.0
