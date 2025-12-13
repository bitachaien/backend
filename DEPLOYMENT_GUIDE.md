# 78968 Casino Platform - Step-by-Step Installation Guide

## Prerequisites

Before starting, ensure you have:
- VPS Ubuntu 20.04+ with SSH access
- Domain configured (78968.site → 103.82.195.215)
- Root or sudo access
- SSH client on your local machine

---

## Step 1: Connect to VPS

```bash
# SSH into your VPS
ssh -i your_key.pem ubuntu@103.82.195.215

# Update SSH and verify connection
sudo apt update && sudo apt upgrade -y
```

---

## Step 2: Run Automated Setup Script

The setup script automates 90% of the installation:

```bash
# Download the setup script
cd /tmp
wget https://your-repo/install_environment.sh
# OR copy it manually
scp install_environment.sh ubuntu@103.82.195.215:/tmp/

# Make it executable
chmod +x /tmp/install_environment.sh

# Run the script (takes 15-20 minutes)
/tmp/install_environment.sh

# The script will:
# ✓ Update system packages
# ✓ Install Node.js 16.20.0 via NVM
# ✓ Create directory structure (/var/app)
# ✓ Setup MySQL database (cgame)
# ✓ Configure Redis cache
# ✓ Setup UFW firewall
# ✓ Configure SSL certificates (Let's Encrypt)
# ✓ Setup Nginx reverse proxy
# ✓ Configure PM2 process manager
# ✓ Create environment files
```

---

## Step 3: Verify Installation

After script completes, verify everything is working:

```bash
# Check Node.js
node --version   # Should be v16.20.0
npm --version    # Should be 8.x

# Check services status
sudo systemctl status mysql
sudo systemctl status redis-server
sudo systemctl status nginx
sudo systemctl status pm2-ubuntu

# Check PM2 processes
pm2 list          # Should show 0 apps (waiting for source code)

# Check ports are open
sudo ss -tlnp | grep LISTEN

# Test Nginx configuration
sudo nginx -t
```

---

## Step 4: Upload Application Source Code

From your local machine:

```bash
# Get your server's .pem key
# Copy apps to server

scp -i your_key.pem -r /path/to/backend \
    ubuntu@103.82.195.215:/var/app/apps/

scp -i your_key.pem -r /path/to/frontend \
    ubuntu@103.82.195.215:/var/app/apps/

scp -i your_key.pem -r /path/to/client-cms \
    ubuntu@103.82.195.215:/var/app/apps/

scp -i your_key.pem -r /path/to/cms-agent \
    ubuntu@103.82.195.215:/var/app/apps/
```

OR use Git:

```bash
ssh ubuntu@103.82.195.215

cd /var/app/apps

# Clone from GitHub
git clone https://github.com/your-repo/backend.git
git clone https://github.com/your-repo/frontend.git
git clone https://github.com/your-repo/client-cms.git
git clone https://github.com/your-repo/cms-agent.git

# Or pull from existing repo
cd backend && git pull origin main
```

---

## Step 5: Install Dependencies & Build Apps

```bash
ssh ubuntu@103.82.195.215

# Backend
cd /var/app/apps/backend
npm ci --production
npm run build 2>/dev/null || true

# Frontend - Build required for Next.js
cd /var/app/apps/frontend
npm ci --production
npm run build
# This creates .next folder (production build)

# Client CMS
cd /var/app/apps/client-cms
npm ci --production

# CMS Agent
cd /var/app/apps/cms-agent
npm ci --production
```

---

## Step 6: Configure Environment Files

The setup script already created .env files, but you need to customize them:

```bash
ssh ubuntu@103.82.195.215

# Edit Backend configuration
nano /var/app/apps/backend/.env

# Required changes:
JWT_SCRET_KEY=your_unique_secret_key_minimum_32_chars
SESSION_SECRET=your_unique_session_secret_minimum_32_chars
SITE_DOMAIN=78968.site

# Keep database credentials from setup script
# Or update to your preferences

# Save: Ctrl+O, Enter, Ctrl+X
```

Repeat for other apps:
```bash
nano /var/app/apps/frontend/.env.local
nano /var/app/apps/client-cms/.env
nano /var/app/apps/cms-agent/.env
```

---

## Step 7: Setup Database

```bash
ssh ubuntu@103.82.195.215

# Connect to MySQL
mysql -u casino_user -p
# Password: Casino@2024#Secure

# Verify database
SHOW DATABASES;
USE cgame;
SHOW TABLES;

# Exit
exit
```

If you have database dump file:

```bash
# From local machine
scp -i your_key.pem schema.sql ubuntu@103.82.215:/tmp/
scp -i your_key.pem seed_data.sql ubuntu@103.215.215:/tmp/

# On server
mysql -u casino_user -p cgame < /tmp/schema.sql
mysql -u casino_user -p cgame < /tmp/seed_data.sql
```

---

## Step 8: Import Initial Data (if available)

```bash
ssh ubuntu@103.82.195.215

# If you have SQL dump
mysql -u casino_user -p cgame < /path/to/seed_data.sql

# Verify
mysql -u casino_user -p cgame -e "SELECT COUNT(*) as users FROM users;"
mysql -u casino_user -p cgame -e "SELECT COUNT(*) as games FROM api_product_configs;"
```

---

## Step 9: Start Applications with PM2

```bash
ssh ubuntu@103.82.215

cd /var/app

# Start all apps
pm2 start ecosystem.config.js

# Verify they're running
pm2 list

# Expected output:
# ┌────────────────┬──────┬─────────┬─────────┬───────────┬──────────┐
# │ App Name       │ id   │ mode    │ status  │ ↺ restart │ uptime   │
# ├────────────────┼──────┼─────────┼─────────┼───────────┼──────────┤
# │ backend-api    │ 0-3  │ cluster │ online  │ 0         │ 1m       │
# │ frontend       │ 4-5  │ cluster │ online  │ 0         │ 1m       │
# │ client-cms     │ 6-7  │ cluster │ online  │ 0         │ 1m       │
# │ cms-agent      │ 8-9  │ cluster │ online  │ 0         │ 1m       │
# └────────────────┴──────┴─────────┴─────────┴───────────┴──────────┘

# Save state for auto-start on reboot
pm2 save
pm2 startup
sudo systemctl enable pm2-ubuntu
```

---

## Step 10: Verify All Services are Running

```bash
# Check all processes are online
pm2 list

# Check Nginx is serving requests
curl -i https://78968.site
curl -i https://api.78968.site

# Monitor logs in real-time
pm2 logs

# Or specific app
pm2 logs backend-api
pm2 logs frontend

# Check system resources
pm2 monit
```

---

## Step 11: Domain & DNS Configuration

Ensure your DNS records point to the VPS:

```
Type    | Name              | Value
--------|-------------------|-------------------
A       | 78968.site        | 103.82.195.215
A       | *.78968.site      | 103.82.195.215
A       | api.78968.site    | 103.82.195.215
A       | cms.78968.site    | 103.82.195.215
A       | agent.78968.site  | 103.82.195.215
```

Wait 24-48 hours for DNS propagation, then verify:

```bash
# From local machine
nslookup 78968.site
nslookup api.78968.site

# Should resolve to 103.82.195.215
```

---

## Step 12: Test All Endpoints

```bash
# Frontend
curl -I https://78968.site
# Expected: HTTP/2 200

# Backend API
curl -I https://api.78968.site
# Expected: HTTP/2 200 or 404 (API might not have root endpoint)

# CMS
curl -I https://cms.78968.site
# Expected: HTTP/2 200 or 301 (redirect)

# Agent
curl -I https://agent.78968.site
# Expected: HTTP/2 200 or 301 (redirect)
```

---

## Troubleshooting

### Issue: Apps not starting
```bash
# Check PM2 logs
pm2 logs backend-api

# Verify .env files are correct
cat /var/app/apps/backend/.env | grep PORT

# Check port conflicts
sudo ss -tlnp | grep 8009
```

### Issue: Database connection failed
```bash
# Check MySQL is running
sudo systemctl status mysql

# Verify credentials
mysql -u casino_user -p -e "SELECT DATABASE();"

# Check .env has correct DB_HOST
cat /var/app/apps/backend/.env | grep DB_
```

### Issue: Nginx 502 Bad Gateway
```bash
# Check upstream is running
pm2 list

# Check Nginx logs
tail -f /var/log/nginx/error.log

# Verify proxy configuration
sudo nginx -T | grep upstream
```

### Issue: SSL certificate expired
```bash
# Renew manually
sudo certbot renew --force-renewal

# Check certificate
sudo certbot certificates
```

### Issue: Out of Memory
```bash
# Check memory usage
free -h

# Reduce PM2 instances in ecosystem.config.js
nano /var/app/ecosystem.config.js
# Reduce 'instances' value for each app

# Restart
pm2 restart all
```

---

## Daily Operations

### Checking Application Health

```bash
# Quick health check
pm2 list

# View real-time metrics
pm2 monit

# View recent logs
pm2 logs --lines 100

# Check specific app
pm2 logs backend-api --lines 50
```

### Restarting Applications

```bash
# Restart single app
pm2 restart backend-api

# Restart all apps
pm2 restart all

# Stop all apps
pm2 stop all

# Start all apps
pm2 start all

# Reload (graceful restart)
pm2 reload all
```

### Database Maintenance

```bash
# Backup database
mysqldump -u casino_user -p cgame > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
mysql -u casino_user -p cgame < backup_20241213_120000.sql

# Optimize database
mysql -u casino_user -p cgame -e "OPTIMIZE TABLE users; OPTIMIZE TABLE bet_histories;"
```

### Log Rotation

```bash
# View log size
du -sh /var/app/logs/

# Manual cleanup (keep last 7 days)
find /var/app/logs -name "*.log" -mtime +7 -delete

# Or setup logrotate (automated)
sudo nano /etc/logrotate.d/casino-apps
```

---

## Backup & Disaster Recovery

### Daily Backups

```bash
# Create backup script
sudo tee /usr/local/bin/backup-casino.sh > /dev/null <<'EOF'
#!/bin/bash
BACKUP_DIR="/var/app/database/backups"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
mysqldump -u casino_user -p"Casino@2024#Secure" cgame > \
    $BACKUP_DIR/cgame_$DATE.sql

# Compress
gzip $BACKUP_DIR/cgame_$DATE.sql

# Keep only 7 days of backups
find $BACKUP_DIR -name "cgame_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/cgame_$DATE.sql.gz"
EOF

sudo chmod +x /usr/local/bin/backup-casino.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-casino.sh
```

### Restore from Backup

```bash
# List available backups
ls -la /var/app/database/backups/

# Restore
gunzip -c /var/app/database/backups/cgame_20241213_020000.sql.gz | \
    mysql -u casino_user -p cgame

# Verify
mysql -u casino_user -p cgame -e "SELECT COUNT(*) FROM users;"
```

---

## Performance Monitoring

### Memory & CPU Usage

```bash
# Real-time monitoring
pm2 monit

# Detailed process info
ps aux | grep node

# Memory by process
ps aux --sort=-%mem | head -10

# System resources
free -h              # Memory
df -h                # Disk space
top                  # System load
```

### Database Performance

```bash
# Check slow queries
mysql -u casino_user -p cgame -e "SHOW PROCESSLIST;"

# Check database size
mysql -u casino_user -p cgame -e "
  SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
  FROM information_schema.tables
  WHERE table_schema = 'cgame'
  ORDER BY size_mb DESC;
"

# Check indexes
mysql -u casino_user -p cgame -e "SELECT * FROM information_schema.statistics WHERE table_schema='cgame' LIMIT 20;"
```

### Network & Port Status

```bash
# Check listening ports
sudo ss -tlnp | grep node

# Check connections to database
sudo ss -tlnp | grep 3306

# Network statistics
netstat -tuln | grep LISTEN
```

---

## Security Hardening

### Change Default Passwords

```bash
# Change MySQL password
mysqladmin -u casino_user -p"Casino@2024#Secure" password "YourNewSecurePassword"

# Change Redis password
redis-cli CONFIG SET requirepass "YourNewRedisPassword"

# Update .env files
nano /var/app/apps/backend/.env
# Update: REDIS_PASSWORD=YourNewRedisPassword
```

### Firewall Configuration

```bash
# View current rules
sudo ufw show added

# Add custom rules
sudo ufw allow from 203.0.113.0/24 to any port 22  # Restrict SSH to specific IP

# Deny specific ports
sudo ufw deny 3306      # Only allow MySQL from localhost

# Check firewall status
sudo ufw status numbered
```

### SSL/TLS Hardening

```bash
# Update SSL configuration in /etc/nginx/sites-available/backend.conf
# Already includes TLSv1.2+ and strong ciphers

# Test SSL score
curl -I https://78968.site

# Or use SSL Labs: https://www.ssllabs.com/ssltest/
```

---

## Deployment Updates

### Update Application Code

```bash
# SSH to server
ssh ubuntu@103.82.195.215

# Pull latest code
cd /var/app/apps/backend
git pull origin main

# Update dependencies if changed
npm ci --production

# Restart app
pm2 restart backend-api

# Check logs
pm2 logs backend-api
```

### Zero-Downtime Deployment

```bash
# Using PM2 reload (graceful restart)
pm2 reload backend-api

# Or deploy new version without downtime
pm2 start new-app.js -i 2  # Start new instances
pm2 delete old-app         # Stop old instances
```

---

## Maintenance Checklist

- [ ] Daily: Check PM2 status (`pm2 list`)
- [ ] Daily: Monitor error logs (`pm2 logs`)
- [ ] Weekly: Database optimization (`OPTIMIZE TABLE`)
- [ ] Weekly: Backup database (`backup-casino.sh`)
- [ ] Monthly: Update system packages (`sudo apt update && upgrade`)
- [ ] Monthly: Review SSL certificate status (`sudo certbot certificates`)
- [ ] Quarterly: Security audit and patches
- [ ] Quarterly: Performance analysis and optimization
- [ ] Yearly: Update Node.js version (LTS)
- [ ] Yearly: Full security audit

---

## Contact & Support

For issues:
1. Check logs: `pm2 logs`
2. Review `/var/app/logs/` directory
3. Check system resources: `pm2 monit`
4. Verify database: `mysql -u casino_user -p cgame -e "SHOW TABLES;"`
5. Test endpoints manually: `curl https://api.78968.site`

---

**Document Version:** 1.0  
**Last Updated:** December 2025  
**Platform:** 78968 Casino  
**Support Email:** admin@78968.site
