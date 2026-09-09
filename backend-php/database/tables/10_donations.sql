CREATE TABLE IF NOT EXISTS donations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  donor_name VARCHAR(255) DEFAULT 'Anonymous',
  email VARCHAR(255) DEFAULT NULL,
  amount DECIMAL(10,2) NOT NULL,
  is_recurring TINYINT(1) DEFAULT 0,
  recurring_interval ENUM('monthly','yearly') DEFAULT NULL,
  payment_intent_id VARCHAR(255) DEFAULT NULL,
  payment_status ENUM('pending','completed','failed') DEFAULT 'pending',
  message TEXT DEFAULT NULL,
  is_anonymous TINYINT(1) DEFAULT 0,
  academy VARCHAR(255) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES registrations(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
