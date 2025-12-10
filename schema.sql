-- MySQL schema for 78968_SYSTEM_CORE
CREATE DATABASE IF NOT EXISTS cgame CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cgame;

-- ---------------------------
-- Table structure for admin_accounts
-- ---------------------------
CREATE TABLE IF NOT EXISTS admin_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL UNIQUE,
  position VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  password VARCHAR(255) NOT NULL,
  avatar INT DEFAULT 0,
  role VARCHAR(64) DEFAULT 'custom',
  status VARCHAR(32) DEFAULT 'active',
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME
);

-- ---------------------------
-- Table structure for admin_permissions
-- ---------------------------
CREATE TABLE IF NOT EXISTS admin_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uid INT NOT NULL,
  position VARCHAR(255) NOT NULL,
  allow BOOLEAN NOT NULL DEFAULT FALSE,
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME,
  UNIQUE KEY uid_position (uid, position),
  FOREIGN KEY (uid) REFERENCES admin_accounts(id) ON DELETE CASCADE
);

-- ---------------------------
-- Table structure for admin_password_securitys
-- ---------------------------
CREATE TABLE IF NOT EXISTS admin_password_securitys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uid INT NOT NULL,
  password VARCHAR(255) NOT NULL,
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME,
  FOREIGN KEY (uid) REFERENCES admin_accounts(id) ON DELETE CASCADE
);

-- ---------------------------
-- Table structure for users
-- ---------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL UNIQUE,
  is_bot BOOLEAN DEFAULT FALSE,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  password VARCHAR(255) NOT NULL,
  avatar INT DEFAULT 0,
  role VARCHAR(64) DEFAULT 'user',
  status VARCHAR(32) DEFAULT 'active',
  coin DECIMAL(19,2) DEFAULT 0,
  verify BOOLEAN DEFAULT FALSE,
  code VARCHAR(255),
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME
);

-- ---------------------------
-- Table structure for user_devices
-- ---------------------------
CREATE TABLE IF NOT EXISTS user_devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uid INT NOT NULL,
  ip VARCHAR(45) DEFAULT '',
  user_agent VARCHAR(512) DEFAULT '',
  location VARCHAR(255) DEFAULT '',
  last_login DATETIME,
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME,
  FOREIGN KEY (uid) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------
-- Table structure for user_incentives
-- ---------------------------
CREATE TABLE IF NOT EXISTS user_incentives (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uid INT NOT NULL,
  type VARCHAR(64),
  amount DECIMAL(19,2) DEFAULT 0,
  description VARCHAR(512) DEFAULT '',
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME,
  FOREIGN KEY (uid) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------
-- Table structure for user_incentive_donates
-- ---------------------------
CREATE TABLE IF NOT EXISTS user_incentive_donates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  uid INT NOT NULL,
  amount DECIMAL(19,2) DEFAULT 0,
  note VARCHAR(512) DEFAULT '',
  description VARCHAR(512) DEFAULT '',
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME,
  FOREIGN KEY (uid) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------
-- Table structure for ip_registereds
-- ---------------------------
CREATE TABLE IF NOT EXISTS ip_registereds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uid INT NOT NULL,
  ip VARCHAR(45) DEFAULT '',
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME,
  FOREIGN KEY (uid) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------
-- Table structure for balance_fluct
-- ---------------------------
CREATE TABLE IF NOT EXISTS balance_fluct (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uid INT NOT NULL,
  action VARCHAR(64) NOT NULL,
  type VARCHAR(32) NOT NULL,
  amount DECIMAL(19,2) DEFAULT 0,
  balance DECIMAL(19,2) DEFAULT 0,
  note LONGTEXT,
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME,
  FOREIGN KEY (uid) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------
-- Table structure for bank_list
-- ---------------------------
CREATE TABLE IF NOT EXISTS bank_list (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bankProvide VARCHAR(255) NOT NULL,
  bankNumber VARCHAR(255) NOT NULL,
  bankName VARCHAR(255) NOT NULL,
  status VARCHAR(32) DEFAULT 'active',
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME
);

-- ---------------------------
-- Table structure for bank_user
-- ---------------------------
CREATE TABLE IF NOT EXISTS bank_user (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uid INT NOT NULL,
  bankProvide VARCHAR(255) NOT NULL,
  bankNumber VARCHAR(255) NOT NULL,
  bankName VARCHAR(255) NOT NULL,
  bankBranch VARCHAR(255) NOT NULL,
  status VARCHAR(32) DEFAULT 'active',
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME,
  FOREIGN KEY (uid) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------
-- Table structure for bank_histories
-- ---------------------------
CREATE TABLE IF NOT EXISTS bank_histories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uid INT NOT NULL,
  bankProvide VARCHAR(255) NOT NULL,
  bankNumber VARCHAR(255) NOT NULL,
  bankName VARCHAR(255) NOT NULL,
  transId VARCHAR(255),
  type VARCHAR(64) NOT NULL,
  amount DECIMAL(19,2) DEFAULT 0,
  info VARCHAR(512) DEFAULT '',
  status VARCHAR(32) DEFAULT 'pending',
  is_first BOOLEAN DEFAULT FALSE,
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME,
  FOREIGN KEY (uid) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------
-- Table structure for card_histories
-- ---------------------------
CREATE TABLE IF NOT EXISTS card_histories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uid INT NOT NULL,
  transId VARCHAR(255) NOT NULL,
  type VARCHAR(32) NOT NULL,
  amount DECIMAL(19,2) DEFAULT 0,
  network VARCHAR(128) NOT NULL,
  pin VARCHAR(255) NOT NULL,
  seri VARCHAR(255) NOT NULL,
  info VARCHAR(512) DEFAULT '',
  status VARCHAR(32) DEFAULT 'pending',
  is_first BOOLEAN DEFAULT FALSE,
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME,
  FOREIGN KEY (uid) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------
-- Table structure for bet_histories
-- ---------------------------
CREATE TABLE IF NOT EXISTS bet_histories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uid INT NOT NULL,
  username VARCHAR(255),
  betAmount DECIMAL(19,2) DEFAULT 0,
  validBetAmount DECIMAL(19,2) DEFAULT 0,
  winAmount DECIMAL(19,2) DEFAULT 0,
  netPnl DECIMAL(19,2) DEFAULT 0,
  currency VARCHAR(32),
  transactionTime VARCHAR(128),
  gameCode VARCHAR(128),
  gameName VARCHAR(255),
  betOrderNo VARCHAR(255) UNIQUE,
  betTime VARCHAR(128),
  productType INT,
  gameCategory VARCHAR(128),
  sessionId VARCHAR(128),
  status VARCHAR(32) DEFAULT 'success',
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME,
  FOREIGN KEY (uid) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------
-- Table structure for bet_refurns
-- ---------------------------
CREATE TABLE IF NOT EXISTS bet_refurns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uid INT NOT NULL,
  username VARCHAR(255),
  betAmount DECIMAL(19,2),
  validBetAmount DECIMAL(19,2),
  winAmount DECIMAL(19,2),
  netPnl DECIMAL(19,2),
  percentReturn DECIMAL(10,2),
  amountReturn DECIMAL(19,2),
  currency VARCHAR(32),
  gameCategory VARCHAR(128),
  status VARCHAR(32) DEFAULT 'pending',
  timeFrom DATETIME,
  timeTo DATETIME,
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME,
  FOREIGN KEY (uid) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------
-- Table structure for agencies
-- ---------------------------
CREATE TABLE IF NOT EXISTS agencies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uid INT NOT NULL,
  code VARCHAR(255) NOT NULL,
  status VARCHAR(32) DEFAULT 'active',
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME,
  UNIQUE KEY uid_code (uid, code),
  FOREIGN KEY (uid) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------
-- Table structure for agency_referer
-- ---------------------------
CREATE TABLE IF NOT EXISTS agency_referer (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uid INT NOT NULL,
  agency INT NOT NULL,
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME,
  UNIQUE KEY uid_unique (uid),
  FOREIGN KEY (uid) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (agency) REFERENCES agencies(id) ON DELETE CASCADE
);

-- ---------------------------
-- Table structure for vips
-- ---------------------------
CREATE TABLE IF NOT EXISTS vips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uid INT NOT NULL,
  vip_current INT DEFAULT 0,
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME,
  UNIQUE KEY uid_unique_vip (uid),
  FOREIGN KEY (uid) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------
-- Table structure for vip_upgrade
-- ---------------------------
CREATE TABLE IF NOT EXISTS vip_upgrade (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uid INT NOT NULL,
  `from` INT DEFAULT 0,
  `to` INT DEFAULT 0,
  coin_reward DECIMAL(19,2) DEFAULT 0,
  coin_monthly DECIMAL(19,2) DEFAULT 0,
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME,
  FOREIGN KEY (uid) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------
-- Table structure for promotions
-- ---------------------------
CREATE TABLE IF NOT EXISTS promotions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) DEFAULT '',
  thumbnail VARCHAR(512) DEFAULT '',
  content LONGTEXT,
  isRegister BOOLEAN DEFAULT TRUE,
  status BOOLEAN DEFAULT TRUE,
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME
);

-- ---------------------------
-- Table structure for promotion_registers
-- ---------------------------
CREATE TABLE IF NOT EXISTS promotion_registers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uid INT NOT NULL,
  promotion INT NOT NULL,
  register_date DATETIME,
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME,
  FOREIGN KEY (uid) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (promotion) REFERENCES promotions(id) ON DELETE CASCADE
);

-- ---------------------------
-- Table structure for messages
-- ---------------------------
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(32) NOT NULL,
  uid INT NOT NULL DEFAULT 0,
  title VARCHAR(255) DEFAULT '',
  content LONGTEXT DEFAULT '',
  seen BOOLEAN DEFAULT FALSE,
  is_welcome BOOLEAN DEFAULT FALSE,
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME,
  FOREIGN KEY (uid) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------
-- Table structure for password_securitys
-- ---------------------------
CREATE TABLE IF NOT EXISTS password_securitys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uid INT NOT NULL,
  password VARCHAR(255) NOT NULL,
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME,
  FOREIGN KEY (uid) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------
-- Table structure for withdraw_conditions
-- ---------------------------
CREATE TABLE IF NOT EXISTS withdraw_conditions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uid INT NOT NULL,
  minimumNumbOfBet INT DEFAULT 0,
  totalMinimumBetAmount DECIMAL(19,2) DEFAULT 0,
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME,
  UNIQUE KEY uid_unique_withdraw (uid),
  FOREIGN KEY (uid) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------
-- Table structure for configs
-- ---------------------------
CREATE TABLE IF NOT EXISTS configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(255) NOT NULL UNIQUE,
  `value` LONGTEXT NOT NULL,
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME
);

-- ---------------------------
-- Table structure for api_configs
-- ---------------------------
CREATE TABLE IF NOT EXISTS api_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  is_mainternance BOOLEAN DEFAULT FALSE,
  api_name VARCHAR(255) NOT NULL UNIQUE,
  api_product VARCHAR(255),
  api_config LONGTEXT NOT NULL,
  description VARCHAR(512),
  logo VARCHAR(512),
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME
);

-- ---------------------------
-- Table structure for api_game_configs
-- ---------------------------
CREATE TABLE IF NOT EXISTS api_game_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  is_mainternance BOOLEAN DEFAULT FALSE,
  product_type VARCHAR(255) NOT NULL,
  product_code VARCHAR(255) NOT NULL,
  game_type VARCHAR(64) NOT NULL,
  game_code VARCHAR(255) NOT NULL UNIQUE,
  game_name VARCHAR(255) NOT NULL,
  game_icon VARCHAR(512) NOT NULL,
  game_trial_support BOOLEAN DEFAULT FALSE,
  is_hot BOOLEAN DEFAULT FALSE,
  play_count INT DEFAULT 0,
  description VARCHAR(512),
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME
);

-- ---------------------------
-- Table structure for api_product_configs
-- ---------------------------
CREATE TABLE IF NOT EXISTS api_product_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  is_mainternance BOOLEAN DEFAULT FALSE,
  product_api VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NOT NULL UNIQUE,
  product_code VARCHAR(255) NOT NULL UNIQUE,
  product_type VARCHAR(255) NOT NULL UNIQUE,
  product_mode INT DEFAULT 1,
  description VARCHAR(512),
  logo VARCHAR(512),
  thumbnail VARCHAR(512),
  icon VARCHAR(512),
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME
);

-- ---------------------------
-- Table structure for mini_taixiu_users
-- ---------------------------
CREATE TABLE IF NOT EXISTS mini_taixiu_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uid INT NOT NULL UNIQUE,
  username VARCHAR(255) NOT NULL,
  is_bot BOOLEAN DEFAULT FALSE,
  total_bet DECIMAL(19,2) DEFAULT 0,
  total_win DECIMAL(19,2) DEFAULT 0,
  total_win_log DECIMAL(19,2) DEFAULT 0,
  total_lose DECIMAL(19,2) DEFAULT 0,
  total_refurn DECIMAL(19,2) DEFAULT 0,
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME,
  FOREIGN KEY (uid) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------
-- Table structure for mini_taixiu_session
-- ---------------------------
CREATE TABLE IF NOT EXISTS mini_taixiu_session (
  id INT AUTO_INCREMENT PRIMARY KEY,
  result LONGTEXT NOT NULL,
  total_bet DECIMAL(19,2) DEFAULT 0,
  total_win DECIMAL(19,2) DEFAULT 0,
  total_lose DECIMAL(19,2) DEFAULT 0,
  total_refurn DECIMAL(19,2) DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME
);

-- ---------------------------
-- Table structure for mini_taixiu_bet_order
-- ---------------------------
CREATE TABLE IF NOT EXISTS mini_taixiu_bet_order (
  id INT AUTO_INCREMENT PRIMARY KEY,
  is_bot BOOLEAN DEFAULT FALSE,
  session INT NOT NULL,
  uid INT NOT NULL,
  amount DECIMAL(19,2) DEFAULT 0,
  bet_type BOOLEAN NOT NULL,
  total_win DECIMAL(19,2) DEFAULT 0,
  total_lose DECIMAL(19,2) DEFAULT 0,
  total_refurn DECIMAL(19,2) DEFAULT 0,
  is_win BOOLEAN DEFAULT FALSE,
  paid BOOLEAN DEFAULT FALSE,
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME,
  FOREIGN KEY (uid) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (session) REFERENCES mini_taixiu_session(id) ON DELETE CASCADE
);

-- ---------------------------
-- Table structure for mini_taixiu_chat
-- ---------------------------
CREATE TABLE IF NOT EXISTS mini_taixiu_chat (
  id INT AUTO_INCREMENT PRIMARY KEY,
  is_bot BOOLEAN DEFAULT FALSE,
  uid INT NOT NULL,
  message VARCHAR(1024) NOT NULL,
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME,
  FOREIGN KEY (uid) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------
-- Table structure for xocxoc_users
-- ---------------------------
CREATE TABLE IF NOT EXISTS xocxoc_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uid INT NOT NULL UNIQUE,
  username VARCHAR(255) NOT NULL,
  is_bot BOOLEAN DEFAULT FALSE,
  total_bet DECIMAL(19,2) DEFAULT 0,
  total_win DECIMAL(19,2) DEFAULT 0,
  total_win_log DECIMAL(19,2) DEFAULT 0,
  total_lose DECIMAL(19,2) DEFAULT 0,
  total_refurn DECIMAL(19,2) DEFAULT 0,
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME,
  FOREIGN KEY (uid) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------
-- Table structure for xocxoc_session
-- ---------------------------
CREATE TABLE IF NOT EXISTS xocxoc_session (
  id INT AUTO_INCREMENT PRIMARY KEY,
  result LONGTEXT NOT NULL,
  total_bet DECIMAL(19,2) DEFAULT 0,
  total_win DECIMAL(19,2) DEFAULT 0,
  total_lose DECIMAL(19,2) DEFAULT 0,
  total_refurn DECIMAL(19,2) DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME
);

-- ---------------------------
-- Table structure for xocxoc_bet_order
-- ---------------------------
CREATE TABLE IF NOT EXISTS xocxoc_bet_order (
  id INT AUTO_INCREMENT PRIMARY KEY,
  is_bot BOOLEAN DEFAULT FALSE,
  session INT NOT NULL,
  uid INT NOT NULL,
  even DECIMAL(19,2) DEFAULT 0,
  odd DECIMAL(19,2) DEFAULT 0,
  red3 DECIMAL(19,2) DEFAULT 0,
  red4 DECIMAL(19,2) DEFAULT 0,
  white3 DECIMAL(19,2) DEFAULT 0,
  white4 DECIMAL(19,2) DEFAULT 0,
  total_win DECIMAL(19,2) DEFAULT 0,
  total_lose DECIMAL(19,2) DEFAULT 0,
  total_refurn DECIMAL(19,2) DEFAULT 0,
  is_win BOOLEAN DEFAULT FALSE,
  paid BOOLEAN DEFAULT FALSE,
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME,
  FOREIGN KEY (uid) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (session) REFERENCES xocxoc_session(id) ON DELETE CASCADE
);

-- End of schema
