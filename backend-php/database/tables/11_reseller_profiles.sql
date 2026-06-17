CREATE TABLE IF NOT EXISTS reseller_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  referral_code VARCHAR(100) NOT NULL UNIQUE,
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  status ENUM('pending','approved','rejected','suspended') DEFAULT 'pending',
  wallet_balance DECIMAL(10,2) DEFAULT 0.00,
  total_earned DECIMAL(10,2) DEFAULT 0.00,
  bio TEXT DEFAULT NULL,
  academy VARCHAR(255) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES registrations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
