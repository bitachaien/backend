-- Example seed data for 78968_SYSTEM_CORE
-- Seed data for 78968_SYSTEM_CORE
USE cgame;

-- Seed admin account (system administrator)
INSERT INTO admin_accounts (name, username, password, email, phone, role, status, createdAt, updatedAt) VALUES
('System Admin', 'admin', '$2b$10$examplehash', 'admin@78968.site', '0000000000', 'admin', 'active', NOW(), NOW());

-- Seed users
INSERT INTO users (name, username, password, email, phone, coin, createdAt, updatedAt) VALUES
('User One', 'user1', '$2b$10$examplehash', 'user1@78968.site', '0123456789', 100000.00, NOW(), NOW()),
('User Two', 'user2', '$2b$10$examplehash', 'user2@78968.site', '0987654321', 50000.00, NOW(), NOW());

-- Seed bank list (one provider) and bank_user linked to users
INSERT INTO bank_list (bankProvide, bankNumber, bankName, status, createdAt, updatedAt) VALUES
('Vietcombank', '0123456789', 'Vietcombank', 'active', NOW(), NOW());

INSERT INTO bank_user (uid, bankProvide, bankNumber, bankName, bankBranch, status, createdAt, updatedAt) VALUES
(1, 'Vietcombank', '0123456789', 'Nguyen Van A', 'Hanoi Branch', 'active', NOW(), NOW()),
(2, 'Techcombank', '9876543210', 'Tran Thi B', 'HCMC Branch', 'active', NOW(), NOW());

-- Seed bet histories (maps to `bet_histories`)
INSERT INTO bet_histories (uid, username, betAmount, gameCode, status, createdAt, updatedAt) VALUES
(1, 'user1', 50000.00, 'taixiu', 'success', NOW(), NOW()),
(2, 'user2', 20000.00, 'xocxoc', 'failed', NOW(), NOW());

-- Seed promotions
INSERT INTO promotions (title, thumbnail, content, isRegister, status, createdAt, updatedAt) VALUES
('Welcome Bonus', '', 'Get 100k on signup', TRUE, TRUE, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY));

-- Seed agencies
INSERT INTO agencies (uid, code, status, createdAt, updatedAt) VALUES
(1, 'AGENCY001', 'active', NOW(), NOW()),
(2, 'AGENCY002', 'active', NOW(), NOW());

-- Seed basic configs
INSERT INTO configs (`key`, `value`, createdAt, updatedAt) VALUES
('site_name', '78968', NOW(), NOW()),
('maintenance', 'false', NOW(), NOW());

-- Seed api_configs and product configs so admin UI can show providers
INSERT INTO api_configs (is_mainternance, api_name, api_product, api_config, description, logo, createdAt, updatedAt) VALUES
(FALSE, 'provider_example', 'product_example', '{}', 'Example API provider', '', NOW(), NOW());

INSERT INTO api_product_configs (is_mainternance, product_api, product_name, product_code, product_type, product_mode, description, createdAt, updatedAt) VALUES
(FALSE, 'provider_example', 'Example Game', 'EX_GAME', 'game', 1, 'Example product', NOW(), NOW());

-- NOTE: Table names updated to snake_case to match `schema.sql` (admin_accounts, users, bank_user, bet_histories, promotions, agencies, configs, api_configs, api_product_configs).
