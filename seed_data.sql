-- Seed data for 78968_SYSTEM_CORE - Based on production logs
USE cgame;

-- ===========================
-- Seed admin_accounts
-- ===========================
INSERT INTO admin_accounts (name, username, position, email, phone, password, avatar, role, status, createdAt, updatedAt) VALUES
('System Administrator', 'admin', 'administrator', 'admin@78968.site', '0000000000', '$2b$10$examplehash', 0, 'admin', 'active', NOW(), NOW()),
('Content Manager', 'manager', 'manager', 'manager@78968.site', '0100000000', '$2b$10$examplehash', 0, 'manager', 'active', NOW(), NOW());

-- ===========================
-- Seed users (including user 1179 from logs)
-- ===========================
INSERT INTO users (name, username, is_bot, email, phone, password, avatar, role, status, coin, verify, code, createdAt, updatedAt) VALUES
(1179, 'vip_player', FALSE, 'user1179@78968.site', '0987654321', '$2b$10$examplehash', 0, 'user', 'active', 500000.00, TRUE, 'CODE1179', NOW(), NOW()),
('Player 001', 'player001', FALSE, 'player001@78968.site', '0901111111', '$2b$10$examplehash', 0, 'user', 'active', 250000.00, TRUE, NULL, NOW(), NOW()),
('Player 002', 'player002', FALSE, 'player002@78968.site', '0902222222', '$2b$10$examplehash', 0, 'user', 'active', 150000.00, FALSE, NULL, NOW(), NOW()),
('Player 003', 'player003', FALSE, 'player003@78968.site', '0903333333', '$2b$10$examplehash', 0, 'user', 'active', 75000.00, TRUE, NULL, NOW(), NOW()),
('Bot Player 001', 'bot_player_001', TRUE, 'bot001@78968.site', '0000000001', '$2b$10$examplehash', 0, 'bot', 'active', 1000000.00, TRUE, NULL, NOW(), NOW());

-- ===========================
-- Seed user_devices
-- ===========================
INSERT INTO user_devices (uid, ip, user_agent, location, last_login, createdAt, updatedAt) VALUES
(1179, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Ha Noi', NOW(), NOW(), NOW()),
(1180, '192.168.1.101', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)', 'Ho Chi Minh', NOW(), NOW(), NOW()),
(1181, '192.168.1.102', 'Mozilla/5.0 (Android 11; Mobile; rv:89.0) Gecko/89.0 Firefox/89.0', 'Da Nang', NOW(), NOW(), NOW()),
(1182, '192.168.1.103', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0', 'Hanoi', NOW(), NOW(), NOW()),
(1183, '192.168.1.104', 'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X)', 'Thai Nguyen', NOW(), NOW(), NOW());

-- ===========================
-- Seed api_configs with API_1
-- ===========================
INSERT INTO api_configs (is_mainternance, api_name, api_product, api_config, description, logo, createdAt, updatedAt) VALUES
(FALSE, 'API_1', 'PROVIDER_MAIN', '{\"endpoint\": \"https://api.provider.com\", \"timeout\": 30000}', 'Main API Provider', 'https://cdn.site.com/api_1_logo.png', NOW(), NOW()),
(FALSE, 'API_2', 'PROVIDER_SECONDARY', '{\"endpoint\": \"https://api2.provider.com\", \"timeout\": 25000}', 'Secondary API Provider', 'https://cdn.site.com/api_2_logo.png', NOW(), NOW());

-- ===========================
-- Seed api_product_configs (Product codes from logs)
-- ===========================
INSERT INTO api_product_configs (is_mainternance, product_api, product_name, product_code, product_type, product_mode, description, logo, thumbnail, icon, createdAt, updatedAt) VALUES
(FALSE, 'API_1', 'Dragon Games', 'DG', 'slot', 1, 'Dragon Games - Popular slot game', 'https://cdn.site.com/dg_logo.png', 'https://cdn.site.com/dg_thumb.png', 'https://cdn.site.com/dg_icon.png', NOW(), NOW()),
(FALSE, 'API_1', 'SA Gaming', 'SA', 'live', 1, 'SA Gaming - Live casino games', 'https://cdn.site.com/sa_logo.png', 'https://cdn.site.com/sa_thumb.png', 'https://cdn.site.com/sa_icon.png', NOW(), NOW()),
(FALSE, 'API_1', 'Sexy Gaming', 'SEX', 'live', 1, 'Sexy Gaming - Live dealer casino', 'https://cdn.site.com/sex_logo.png', 'https://cdn.site.com/sex_thumb.png', 'https://cdn.site.com/sex_icon.png', NOW(), NOW()),
(FALSE, 'API_1', 'Sbobet', 'SB', 'sports', 1, 'Sbobet - Sports betting platform', 'https://cdn.site.com/sb_logo.png', 'https://cdn.site.com/sb_thumb.png', 'https://cdn.site.com/sb_icon.png', NOW(), NOW()),
(FALSE, 'API_1', 'JDB Slots', 'JDB', 'slot', 1, 'JDB - Jackpot Slot Machines', 'https://cdn.site.com/jdb_logo.png', 'https://cdn.site.com/jdb_thumb.png', 'https://cdn.site.com/jdb_icon.png', NOW(), NOW()),
(FALSE, 'API_1', 'Microgaming', 'MG', 'slot', 1, 'Microgaming - Classic slots', 'https://cdn.site.com/mg_logo.png', 'https://cdn.site.com/mg_thumb.png', 'https://cdn.site.com/mg_icon.png', NOW(), NOW()),
(FALSE, 'API_1', 'SBO Sports', 'SBO', 'sports', 1, 'SBO - Live sports betting', 'https://cdn.site.com/sbo_logo.png', 'https://cdn.site.com/sbo_thumb.png', 'https://cdn.site.com/sbo_icon.png', NOW(), NOW()),
(FALSE, 'API_1', 'PlayPearls', 'PP', 'slot', 1, 'PlayPearls - Innovative slots', 'https://cdn.site.com/pp_logo.png', 'https://cdn.site.com/pp_thumb.png', 'https://cdn.site.com/pp_icon.png', NOW(), NOW()),
(FALSE, 'API_2', 'Joker Lottery', 'JL', 'lottery', 1, 'Joker Lottery - Number games', 'https://cdn.site.com/jl_logo.png', 'https://cdn.site.com/jl_thumb.png', 'https://cdn.site.com/jl_icon.png', NOW(), NOW()),
(FALSE, 'API_1', 'CQ9', 'CQ9', 'slot', 1, 'CQ9 Gaming - Asian slots', 'https://cdn.site.com/cq9_logo.png', 'https://cdn.site.com/cq9_thumb.png', 'https://cdn.site.com/cq9_icon.png', NOW(), NOW()),
(FALSE, 'API_1', 'CMD', 'CMD', 'live', 1, 'CMD - Live casino platform', 'https://cdn.site.com/cmd_logo.png', 'https://cdn.site.com/cmd_thumb.png', 'https://cdn.site.com/cmd_icon.png', NOW(), NOW()),
(FALSE, 'API_2', 'BetBreakers', 'BB', 'sports', 1, 'BetBreakers - Sports & esports', 'https://cdn.site.com/bb_logo.png', 'https://cdn.site.com/bb_thumb.png', 'https://cdn.site.com/bb_icon.png', NOW(), NOW()),
(FALSE, 'API_1', 'WS168', 'WS168', 'slot', 1, 'WS168 - Premium slots', 'https://cdn.site.com/ws168_logo.png', 'https://cdn.site.com/ws168_thumb.png', 'https://cdn.site.com/ws168_icon.png', NOW(), NOW()),
(FALSE, 'API_1', 'EGaming', 'EG', 'live', 1, 'EGaming - Electronic gaming', 'https://cdn.site.com/eg_logo.png', 'https://cdn.site.com/eg_thumb.png', 'https://cdn.site.com/eg_icon.png', NOW(), NOW()),
(FALSE, 'API_2', 'WM Casino', 'WM', 'live', 1, 'WM Casino - Premium live games', 'https://cdn.site.com/wm_logo.png', 'https://cdn.site.com/wm_thumb.png', 'https://cdn.site.com/wm_icon.png', NOW(), NOW());

-- ===========================
-- Seed bank_list
-- ===========================
INSERT INTO bank_list (bankProvide, bankNumber, bankName, status, createdAt, updatedAt) VALUES
('Vietcombank', '123456789', 'Vietcombank', 'active', NOW(), NOW()),
('Techcombank', '987654321', 'Techcombank', 'active', NOW(), NOW()),
('BIDV', '111111111', 'BIDV', 'active', NOW(), NOW()),
('ACB', '222222222', 'ACB', 'active', NOW(), NOW());

-- ===========================
-- Seed bank_user (user deposit accounts)
-- ===========================
INSERT INTO bank_user (uid, bankProvide, bankNumber, bankName, bankBranch, status, createdAt, updatedAt) VALUES
(1179, 'Vietcombank', '123456789', 'Nguyen Van A', 'Ha Noi Branch', 'active', NOW(), NOW()),
(1180, 'Techcombank', '987654321', 'Tran Thi B', 'HCMC Branch', 'active', NOW(), NOW()),
(1181, 'BIDV', '111111111', 'Le Van C', 'Da Nang Branch', 'active', NOW(), NOW()),
(1182, 'ACB', '222222222', 'Pham Van D', 'Hanoi Branch', 'active', NOW(), NOW());

-- ===========================
-- Seed bet_histories
-- ===========================
INSERT INTO bet_histories (uid, username, betAmount, validBetAmount, winAmount, netPnl, currency, transactionTime, gameCode, gameName, betOrderNo, betTime, productType, gameCategory, sessionId, status, createdAt, updatedAt) VALUES
(1179, 'vip_player', 50000.00, 50000.00, 120000.00, 70000.00, 'VND', '2025-10-31T13:00:00Z', 'DRAGON_GOLD', 'Dragon Gold', 'ORD_1179_001', '2025-10-31T13:00:00Z', 1, 'slot', 'SESSION_001', 'success', NOW(), NOW()),
(1179, 'vip_player', 75000.00, 75000.00, 0.00, -75000.00, 'VND', '2025-10-31T13:15:00Z', 'SA_BACCARAT', 'SA Baccarat', 'ORD_1179_002', '2025-10-31T13:15:00Z', 2, 'live', 'SESSION_002', 'failed', NOW(), NOW()),
(1180, 'player001', 20000.00, 20000.00, 45000.00, 25000.00, 'VND', '2025-10-31T13:20:00Z', 'JDB_JACKPOT', 'JDB Jackpot', 'ORD_1180_001', '2025-10-31T13:20:00Z', 1, 'slot', 'SESSION_003', 'success', NOW(), NOW()),
(1180, 'player001', 30000.00, 30000.00, 30000.00, 0.00, 'VND', '2025-10-31T13:30:00Z', 'CQ9_LUCKY', 'CQ9 Lucky', 'ORD_1180_002', '2025-10-31T13:30:00Z', 1, 'slot', 'SESSION_004', 'success', NOW(), NOW()),
(1181, 'player002', 100000.00, 100000.00, 50000.00, -50000.00, 'VND', '2025-10-31T13:35:00Z', 'SBO_FOOTBALL', 'SBO Football', 'ORD_1181_001', '2025-10-31T13:35:00Z', 3, 'sports', 'SESSION_005', 'failed', NOW(), NOW()),
(1182, 'player003', 15000.00, 15000.00, 60000.00, 45000.00, 'VND', '2025-10-31T13:40:00Z', 'MG_STARBURST', 'Starburst', 'ORD_1182_001', '2025-10-31T13:40:00Z', 1, 'slot', 'SESSION_006', 'success', NOW(), NOW()),
(1183, 'bot_player_001', 5000.00, 5000.00, 15000.00, 10000.00, 'VND', '2025-10-31T13:45:00Z', 'JL_LOTTERY', 'Joker Lottery', 'ORD_1183_001', '2025-10-31T13:45:00Z', 4, 'lottery', 'SESSION_007', 'success', NOW(), NOW());

-- ===========================
-- Seed configs (site settings)
-- ===========================
INSERT INTO configs (`key`, `value`, createdAt, updatedAt) VALUES
('site_name', '78968', NOW(), NOW()),
('site_infomation', '{\"title\": \"78968 Casino\", \"description\": \"Premium Online Casino\", \"contact\": \"support@78968.site\"}', NOW(), NOW()),
('maintenance', 'false', NOW(), NOW()),
('maintenance_message', 'System is under maintenance', NOW(), NOW()),
('min_deposit', '10000', NOW(), NOW()),
('max_deposit', '50000000', NOW(), NOW()),
('min_withdraw', '50000', NOW(), NOW()),
('max_withdraw', '20000000', NOW(), NOW());

-- ===========================
-- Seed promotions
-- ===========================
INSERT INTO promotions (title, thumbnail, content, isRegister, status, createdAt, updatedAt) VALUES
('Welcome Bonus 100%', 'https://cdn.site.com/welcome_100.png', 'Get 100% bonus on your first deposit up to 5,000,000 VND', TRUE, TRUE, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY)),
('Daily Cashback', 'https://cdn.site.com/daily_cashback.png', 'Get 10% cashback on all losses every day', FALSE, TRUE, NOW(), DATE_ADD(NOW(), INTERVAL 365 DAY)),
('VIP Exclusive Bonus', 'https://cdn.site.com/vip_bonus.png', 'VIP members get exclusive bonuses and rewards', FALSE, TRUE, NOW(), DATE_ADD(NOW(), INTERVAL 365 DAY)),
('Refer Friends', 'https://cdn.site.com/refer.png', 'Get 500,000 VND for each friend you refer', TRUE, TRUE, NOW(), DATE_ADD(NOW(), INTERVAL 180 DAY));

-- ===========================
-- Seed promotion_registers
-- ===========================
INSERT INTO promotion_registers (uid, promotion, register_date, createdAt, updatedAt) VALUES
(1179, 1, NOW(), NOW(), NOW()),
(1179, 2, NOW(), NOW(), NOW()),
(1180, 1, NOW(), NOW(), NOW()),
(1181, 1, NOW(), NOW(), NOW()),
(1182, 2, NOW(), NOW(), NOW());

-- ===========================
-- Seed agencies
-- ===========================
INSERT INTO agencies (uid, code, status, createdAt, updatedAt) VALUES
(1179, 'AGENCY_78968_001', 'active', NOW(), NOW()),
(1180, 'AGENCY_78968_002', 'active', NOW(), NOW());

-- ===========================
-- Seed vips
-- ===========================
INSERT INTO vips (uid, vip_current, createdAt, updatedAt) VALUES
(1179, 3, NOW(), NOW()),
(1180, 1, NOW(), NOW()),
(1181, 0, NOW(), NOW()),
(1182, 2, NOW(), NOW()),
(1183, 0, NOW(), NOW());

-- ===========================
-- Seed vip_upgrade (VIP promotion history)
-- ===========================
INSERT INTO vip_upgrade (uid, `from`, `to`, coin_reward, coin_monthly, createdAt, updatedAt) VALUES
(1179, 0, 1, 100000, 50000, DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_SUB(NOW(), INTERVAL 60 DAY)),
(1179, 1, 2, 200000, 100000, DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 30 DAY)),
(1179, 2, 3, 500000, 250000, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
(1180, 0, 1, 100000, 50000, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 20 DAY)),
(1182, 0, 2, 300000, 150000, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY));

-- ===========================
-- Seed bank_histories
-- ===========================
INSERT INTO bank_histories (uid, bankProvide, bankNumber, bankName, transId, type, amount, info, status, is_first, createdAt, updatedAt) VALUES
(1179, 'Vietcombank', '123456789', 'Nguyen Van A', 'TXN_1179_001', 'deposit', 500000.00, 'First deposit', 'completed', TRUE, NOW(), NOW()),
(1179, 'Vietcombank', '123456789', 'Nguyen Van A', 'TXN_1179_002', 'withdraw', 200000.00, 'Withdrawal request', 'pending', FALSE, NOW(), NOW()),
(1180, 'Techcombank', '987654321', 'Tran Thi B', 'TXN_1180_001', 'deposit', 300000.00, 'Deposit', 'completed', TRUE, NOW(), NOW()),
(1181, 'BIDV', '111111111', 'Le Van C', 'TXN_1181_001', 'deposit', 1000000.00, 'Large deposit', 'completed', TRUE, NOW(), NOW());

-- ===========================
-- Seed user_incentives
-- ===========================
INSERT INTO user_incentives (uid, type, amount, description, createdAt, updatedAt) VALUES
(1179, 'bonus', 500000.00, 'Welcome bonus received', NOW(), NOW()),
(1179, 'cashback', 50000.00, 'Daily cashback reward', NOW(), NOW()),
(1180, 'bonus', 300000.00, 'Welcome bonus received', NOW(), NOW()),
(1181, 'refer_reward', 500000.00, 'Referral reward', NOW(), NOW());

-- ===========================
-- Seed balance_fluct (balance fluctuation history)
-- ===========================
INSERT INTO balance_fluct (uid, action, type, amount, balance, note, createdAt, updatedAt) VALUES
(1179, 'deposit', 'credit', 500000.00, 500000.00, 'Bank transfer deposit', NOW(), NOW()),
(1179, 'bet', 'debit', 50000.00, 450000.00, 'Game bet placed', NOW(), NOW()),
(1179, 'win', 'credit', 120000.00, 570000.00, 'Game win payout', NOW(), NOW()),
(1179, 'withdraw', 'debit', 200000.00, 370000.00, 'Withdrawal request', NOW(), NOW()),
(1180, 'deposit', 'credit', 300000.00, 300000.00, 'Bank transfer deposit', NOW(), NOW()),
(1180, 'bonus', 'credit', 100000.00, 400000.00, 'Welcome bonus', NOW(), NOW()),
(1180, 'bet', 'debit', 20000.00, 380000.00, 'Game bet placed', NOW(), NOW());

-- ===========================
-- Seed withdrawal_conditions
-- ===========================
INSERT INTO withdraw_conditions (uid, minimumNumbOfBet, totalMinimumBetAmount, createdAt, updatedAt) VALUES
(1179, 20, 2500000.00, NOW(), NOW()),
(1180, 10, 1500000.00, NOW(), NOW()),
(1181, 15, 2000000.00, NOW(), NOW());

-- ===========================
-- Seed password_securitys
-- ===========================
INSERT INTO password_securitys (uid, password, createdAt, updatedAt) VALUES
(1179, '$2b$10$previoushash1', DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 30 DAY)),
(1180, '$2b$10$previoushash2', DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 20 DAY));

-- ===========================
-- Seed admin_permissions
-- ===========================
INSERT INTO admin_permissions (uid, position, allow, createdAt, updatedAt) VALUES
(1, 'manage_users', TRUE, NOW(), NOW()),
(1, 'manage_games', TRUE, NOW(), NOW()),
(1, 'manage_payments', TRUE, NOW(), NOW()),
(1, 'view_reports', TRUE, NOW(), NOW()),
(2, 'manage_promotions', TRUE, NOW(), NOW()),
(2, 'manage_content', TRUE, NOW(), NOW()),
(2, 'view_reports', TRUE, NOW(), NOW());

-- ===========================
-- Seed messages (notifications)
-- ===========================
INSERT INTO messages (type, uid, title, content, seen, is_welcome, createdAt, updatedAt) VALUES
('system', 0, 'Welcome to 78968', 'Welcome to our premium casino platform', FALSE, TRUE, NOW(), NOW()),
('promotion', 1179, 'New Promotion Available', 'Check out our latest daily cashback promotion!', FALSE, FALSE, NOW(), NOW()),
('promotion', 1180, 'VIP Exclusive Offer', 'As a VIP member, you have exclusive offers waiting', FALSE, FALSE, NOW(), NOW()),
('withdrawal', 1179, 'Withdrawal Pending', 'Your withdrawal request of 200,000 VND is being processed', FALSE, FALSE, NOW(), NOW()),
('notification', 1181, 'Account Verification', 'Please verify your account for enhanced security', FALSE, FALSE, NOW(), NOW());

-- ===========================
-- Seed ip_registereds (IP registration history)
-- ===========================
INSERT INTO ip_registereds (uid, ip, createdAt, updatedAt) VALUES
(1179, '192.168.1.100', NOW(), NOW()),
(1180, '192.168.1.101', NOW(), NOW()),
(1181, '192.168.1.102', NOW(), NOW()),
(1182, '192.168.1.103', NOW(), NOW()),
(1183, '192.168.1.104', NOW(), NOW());

-- ===========================
-- Seed mini_taixiu_users
-- ===========================
INSERT INTO mini_taixiu_users (uid, username, is_bot, total_bet, total_win, total_win_log, total_lose, total_refurn, createdAt, updatedAt) VALUES
(1179, 'vip_player', FALSE, 500000.00, 350000.00, 250000.00, 150000.00, 0.00, NOW(), NOW()),
(1180, 'player001', FALSE, 200000.00, 150000.00, 100000.00, 50000.00, 0.00, NOW(), NOW()),
(1183, 'bot_player_001', TRUE, 1000000.00, 850000.00, 750000.00, 150000.00, 0.00, NOW(), NOW());

-- ===========================
-- Seed xocxoc_users
-- ===========================
INSERT INTO xocxoc_users (uid, username, is_bot, total_bet, total_win, total_win_log, total_lose, total_refurn, createdAt, updatedAt) VALUES
(1179, 'vip_player', FALSE, 300000.00, 200000.00, 150000.00, 100000.00, 0.00, NOW(), NOW()),
(1181, 'player002', FALSE, 150000.00, 80000.00, 60000.00, 70000.00, 0.00, NOW(), NOW()),
(1183, 'bot_player_001', TRUE, 800000.00, 650000.00, 550000.00, 150000.00, 0.00, NOW(), NOW());

-- ===========================
-- Seed mini_taixiu_session
-- ===========================
INSERT INTO mini_taixiu_session (result, total_bet, total_win, total_lose, total_refurn, completed, createdAt, updatedAt) VALUES
('{\"result\": \"tai\", \"dice1\": 3, \"dice2\": 4, \"dice3\": 2, \"sum\": 9}', 500000.00, 300000.00, 200000.00, 0.00, TRUE, NOW(), NOW()),
('{\"result\": \"xiu\", \"dice1\": 1, \"dice2\": 2, \"dice3\": 1, \"sum\": 4}', 450000.00, 200000.00, 250000.00, 0.00, TRUE, NOW(), NOW()),
('{\"result\": \"tai\", \"dice1\": 6, \"dice2\": 5, \"dice3\": 4, \"sum\": 15}', 350000.00, 280000.00, 70000.00, 0.00, TRUE, NOW(), NOW());

-- ===========================
-- Seed xocxoc_session
-- ===========================
INSERT INTO xocxoc_session (result, total_bet, total_win, total_lose, total_refurn, completed, createdAt, updatedAt) VALUES
('{\"result\": \"red4\", \"dice\": [6, 5, 4]}', 400000.00, 300000.00, 100000.00, 0.00, TRUE, NOW(), NOW()),
('{\"result\": \"white3\", \"dice\": [1, 1, 1]}', 300000.00, 150000.00, 150000.00, 0.00, TRUE, NOW(), NOW()),
('{\"result\": \"even\", \"dice\": [2, 4, 2]}', 250000.00, 200000.00, 50000.00, 0.00, TRUE, NOW(), NOW());

-- ===========================
-- END OF SEED DATA
-- ===========================
