# 78968 Casino Platform - Complete Documentation Index

## 📚 Documentation Files

Dự án gồm 5 tài liệu tổng thể:

### 1. 📋 QUICK_REFERENCE.md
**Mục đích:** Tham chiếu nhanh cho các lệnh và thông tin thường dùng  
**Nội dung:**
- Quick setup (copy-paste commands)
- Application overview table
- Environment variables checklist
- Common tasks & troubleshooting
- **Dùng khi:** Cần lệnh nhanh hoặc nhớ lại cấu hình

**👉 Bắt đầu từ đây nếu bạn cần cài đặt nhanh**

---

### 2. 🔧 APPLICATIONS_ANALYSIS.md
**Mục đích:** Chi tiết phân tích 4 ứng dụng  
**Nội dung:**
- Backend API (Express + Socket.IO)
- Frontend (Next.js 15.5)
- Client CMS (Admin panel)
- CMS Agent (Partner portal)
- Architecture diagram
- Data flow & integrations
- Technology stack analysis

**👉 Bắt đầu từ đây nếu bạn cần hiểu cấu trúc dự án**

---

### 3. 📖 ENVIRONMENT_SETUP.md
**Mục đích:** Danh sách đầy đủ yêu cầu hệ thống và cấu hình  
**Nội dung:**
- Hardware requirements
- Software dependencies (chi tiết cho mỗi app)
- System services & ports
- Database configuration
- Redis setup
- SSL/TLS setup
- Nginx configuration
- Environment variables (đầy đủ)
- PM2 process management
- Performance tuning

**👉 Bắt đầu từ đây nếu bạn cần tài liệu tham khảo chi tiết**

---

### 4. 🚀 DEPLOYMENT_GUIDE.md
**Mục đích:** Hướng dẫn từng bước triển khai trên VPS  
**Nội dung:**
- Bước 1-12: Chi tiết cài đặt
- Upload source code
- Install dependencies
- Configure environment
- Setup database
- Start applications
- Verify endpoints
- Troubleshooting
- Daily operations
- Backup & recovery
- Performance monitoring
- Security hardening

**👉 Bắt đầu từ đây nếu bạn cần cài đặt chi tiết**

---

### 5. 🔨 install_environment.sh
**Mục đích:** Script tự động hóa 90% quá trình cài đặt  
**Chức năng:**
```bash
✓ Cập nhật system packages
✓ Cài Node.js 16.20.0
✓ Tạo directory structure (/var/app)
✓ Setup MySQL (cgame database)
✓ Setup Redis
✓ Configure UFW firewall
✓ Setup SSL certificates (Let's Encrypt)
✓ Configure Nginx reverse proxy
✓ Setup PM2 process manager
✓ Create .env files
✓ Create ecosystem.config.js
```

**Cách sử dụng:**
```bash
chmod +x install_environment.sh
./install_environment.sh
# Hoặc run trên VPS:
ssh ubuntu@103.82.195.215
/path/to/install_environment.sh
```

---

## 🎯 How to Use This Documentation

### Scenario 1: Cài đặt nhanh trên VPS mới
```
1. Đọc: QUICK_REFERENCE.md (5 phút)
2. Chạy: install_environment.sh (15 phút)
3. Follow: DEPLOYMENT_GUIDE.md Step 4-12 (30 phút)
⏱️ Total: ~1 giờ
```

### Scenario 2: Hiểu kiến trúc dự án
```
1. Đọc: APPLICATIONS_ANALYSIS.md
2. Đọc: ENVIRONMENT_SETUP.md (phần System Architecture)
3. Review: Code từng app
⏱️ Total: ~2 giờ
```

### Scenario 3: Troubleshooting sự cố
```
1. Check: QUICK_REFERENCE.md (Troubleshooting section)
2. Run: pm2 logs [app-name]
3. Consult: DEPLOYMENT_GUIDE.md (Troubleshooting section)
4. Monitor: pm2 monit
```

### Scenario 4: Production deployment
```
1. Read: ENVIRONMENT_SETUP.md (đầy đủ)
2. Follow: DEPLOYMENT_GUIDE.md (step-by-step)
3. Configure: Tất cả .env files
4. Secure: Security checklist
5. Monitor: Daily operations
```

---

## 📊 Configuration Files Generated

Script sẽ tạo ra các file sau:

### 1. `/var/app/ecosystem.config.js`
PM2 configuration cho 4 ứng dụng
```
- backend-api (4 instances)
- frontend (2 instances)
- client-cms (2 instances)
- cms-agent (2 instances)
```

### 2. Environment Files
```
/var/app/apps/backend/.env
/var/app/apps/frontend/.env.local
/var/app/apps/client-cms/.env
/var/app/apps/cms-agent/.env
```

### 3. Nginx Configs
```
/etc/nginx/sites-available/backend.conf
/etc/nginx/sites-available/frontend.conf
/etc/nginx/sites-available/cms.conf
```

### 4. Database
```
Database: cgame
User: casino_user
Password: Casino@2024#Secure (THAY ĐỔI!)
```

---

## 🔐 Security Checklist

Sau khi cài đặt, phải thực hiện:

- [ ] Thay đổi tất cả default passwords
- [ ] Update JWT_SCRET_KEY trong .env
- [ ] Update SESSION_SECRET trong .env
- [ ] Setup SSL certificates (Let's Encrypt)
- [ ] Configure firewall rules (UFW)
- [ ] Enable database backups
- [ ] Setup monitoring & alerts
- [ ] Regular security patches
- [ ] Enable audit logging

---

## 📞 Application URLs

Sau khi deploy:

```
Frontend:       https://78968.site
API:            https://api.78968.site
Admin CMS:      https://cms.78968.site
Agent Portal:   https://agent.78968.site
```

---

## 🗂️ Directory Structure

```
/var/app/
├── apps/
│   ├── backend/          # Express API + Socket.IO
│   ├── frontend/         # Next.js application
│   ├── client-cms/       # Admin panel
│   └── cms-agent/        # Agent portal
│
├── logs/
│   ├── backend/
│   ├── frontend/
│   ├── client-cms/
│   ├── cms-agent/
│   └── nginx/
│
├── database/
│   └── backups/          # Database backups
│
├── ssl/                  # SSL certificates (auto)
├── configs/              # Configuration files
│
├── ecosystem.config.js   # PM2 configuration
├── QUICK_REFERENCE.md
├── ENVIRONMENT_SETUP.md
├── DEPLOYMENT_GUIDE.md
├── APPLICATIONS_ANALYSIS.md
└── install_environment.sh

/etc/nginx/sites-available/
├── backend.conf          # API reverse proxy
├── frontend.conf         # Frontend proxy
└── cms.conf             # CMS proxies
```

---

## 🚀 Useful Commands Cheat Sheet

```bash
# PM2 Management
pm2 list                    # View all processes
pm2 logs [app]             # View logs
pm2 monit                  # Monitor resources
pm2 restart all            # Restart all apps
pm2 stop all               # Stop all apps
pm2 start ecosystem.config.js  # Start all apps

# System Checks
df -h                      # Disk space
free -h                    # Memory
htop                       # System resources
sudo ss -tlnp              # Open ports

# Database
mysql -u casino_user -p cgame -e "SHOW TABLES;"
mysqldump -u casino_user -p cgame > backup.sql

# Nginx
sudo nginx -t              # Test configuration
sudo systemctl reload nginx # Reload
sudo systemctl restart nginx # Restart

# SSL
sudo certbot certificates  # Check SSL status
sudo certbot renew         # Renew certificates

# Logs
tail -f /var/app/logs/backend/out.log
tail -f /var/log/nginx/error.log
```

---

## 📈 Performance Expectations

### Frontend (Next.js)
- Page load: < 2 seconds
- Time to Interactive: < 3 seconds
- Bundle size: ~300KB

### Backend API
- Response time: < 100ms
- Concurrent users: 10,000+
- Throughput: 1,000 req/s

### Database
- Query response: < 50ms
- Connections: 100+
- Memory: 500MB-1GB

### System
- CPU: 4 cores (utilized up to 80%)
- Memory: 8GB (50-70% utilized)
- Disk: 50GB SSD (20-30% utilized)

---

## 🔄 Update & Maintenance Workflow

### Daily
```bash
pm2 list               # Check all processes online
pm2 logs               # Review error logs
```

### Weekly
```bash
mysqldump -u casino_user -p cgame > backup_$(date +%Y%m%d).sql
sudo apt update && sudo apt list --upgradable
```

### Monthly
```bash
sudo apt upgrade -y
pm2 save
sudo systemctl restart pm2-ubuntu
```

### Quarterly
```bash
# Database maintenance
mysql -u casino_user -p cgame -e "OPTIMIZE TABLE users; OPTIMIZE TABLE bet_histories;"

# SSL renewal check
sudo certbot renew --dry-run
```

---

## 💡 Tips & Tricks

### Nhanh chóng khởi động lại tất cả
```bash
pm2 restart all && pm2 logs
```

### Kiểm tra tất cả ports
```bash
sudo ss -tlnp | grep -E ':(80|443|8008|8009|3000|3001|3002|3306|6379)'
```

### Xem real-time dashboard
```bash
pm2 monit
```

### Quick database backup + compress
```bash
mysqldump -u casino_user -p cgame | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Clear old logs (keep 7 days)
```bash
find /var/app/logs -name "*.log" -mtime +7 -delete
```

### SSH autologin (setup once)
```bash
# Bổ sung vào ~/.ssh/config:
Host casino-vps
    HostName 103.82.195.215
    User ubuntu
    IdentityFile ~/.ssh/your_key.pem
    
# Sau đó: ssh casino-vps
```

---

## 📝 Configuration Reference

### JWT Secret Generation
```bash
# Generate strong JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Session Secret Generation
```bash
# Generate strong session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Database User Permissions
```sql
CREATE USER 'casino_user'@'127.0.0.1' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON cgame.* TO 'casino_user'@'127.0.0.1';
FLUSH PRIVILEGES;
```

---

## 🆘 Support & Debugging

### Check Application Status
```bash
pm2 list
pm2 logs backend-api
curl https://api.78968.site
curl https://78968.site
```

### Database Troubleshooting
```bash
# Check connection
mysql -u casino_user -p cgame -e "SELECT 1;"

# View processes
mysql -u casino_user -p cgame -e "SHOW PROCESSLIST;"

# Check table status
mysql -u casino_user -p cgame -e "SHOW TABLE STATUS;"
```

### Nginx Troubleshooting
```bash
# Test config
sudo nginx -t

# View error log
tail -f /var/log/nginx/error.log

# Reload
sudo systemctl reload nginx
```

---

## 🎓 Learning Resources

### For Backend Developers
- Read: APPLICATIONS_ANALYSIS.md (Backend section)
- Review: Backend package.json
- Study: src/controllers/ and src/routers/
- Reference: Express.js docs

### For Frontend Developers
- Read: APPLICATIONS_ANALYSIS.md (Frontend section)
- Review: Frontend package.json
- Study: src/components/ and src/app/
- Reference: Next.js docs

### For DevOps/SysAdmin
- Read: ENVIRONMENT_SETUP.md
- Study: install_environment.sh
- Review: ecosystem.config.js
- Reference: PM2, Nginx, MySQL docs

---

## 📞 Quick Contact Info

**Server IP:** 103.82.195.215  
**Domain:** 78968.site  
**Install Path:** /var/app  
**Database:** cgame  
**Admin Email:** admin@78968.site  

---

## ✅ Installation Checklist

Before going live, verify:

- [ ] All apps running: `pm2 list`
- [ ] Nginx working: `sudo nginx -t`
- [ ] SSL valid: `sudo certbot certificates`
- [ ] Database accessible: `mysql -u casino_user -p cgame -e "SHOW TABLES;"`
- [ ] Redis online: `redis-cli ping`
- [ ] Backups scheduled: Check crontab
- [ ] Monitoring setup: pm2 logs working
- [ ] Firewall configured: `sudo ufw status`
- [ ] All credentials changed: Check .env files
- [ ] DNS propagated: `nslookup 78968.site`

---

## 📚 Document Versions

| Document | Version | Updated | Status |
|----------|---------|---------|--------|
| QUICK_REFERENCE.md | 1.0 | Dec 2025 | ✅ Complete |
| APPLICATIONS_ANALYSIS.md | 1.0 | Dec 2025 | ✅ Complete |
| ENVIRONMENT_SETUP.md | 1.0 | Dec 2025 | ✅ Complete |
| DEPLOYMENT_GUIDE.md | 1.0 | Dec 2025 | ✅ Complete |
| install_environment.sh | 1.0 | Dec 2025 | ✅ Complete |

---

## 🎯 Next Steps

1. **Review** tài liệu phù hợp với role của bạn
2. **Prepare** VPS Ubuntu 20.04+ với SSH access
3. **Run** `install_environment.sh`
4. **Follow** DEPLOYMENT_GUIDE.md
5. **Verify** tất cả endpoints
6. **Monitor** với `pm2 logs`
7. **Backup** database regularly

---

## 🏁 Summary

Bạn bây giờ có:
✅ 5 tài liệu tổng thể  
✅ 1 script tự động cài đặt  
✅ Chi tiết 4 ứng dụng  
✅ Hướng dẫn triển khai step-by-step  
✅ Troubleshooting guide  
✅ Production-ready configuration  

**Platform:** 78968 Casino v1.0.0  
**Ready for:** Ubuntu 20.04+ VPS  
**Domain:** 78968.site (103.82.195.215)  
**Path:** /var/app  

---

**Last Updated:** December 2025  
**Maintained by:** 78968 DevOps Team
