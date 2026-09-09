CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  delivery_method VARCHAR(20) NOT NULL DEFAULT 'delivery',
  shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status ENUM('pending','processing','shipped','delivered','cancelled') DEFAULT 'pending',
  shipping_address TEXT NOT NULL,
  payment_intent_id VARCHAR(255) DEFAULT NULL,
  payment_status ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
  referral_code VARCHAR(100) DEFAULT NULL,
  tracking_number VARCHAR(255) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES registrations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
