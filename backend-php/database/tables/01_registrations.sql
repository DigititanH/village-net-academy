CREATE TABLE IF NOT EXISTS registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role ENUM('admin','reseller','customer') DEFAULT 'customer',
  avatar VARCHAR(500) DEFAULT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  is_verified TINYINT(1) DEFAULT 0,
  is_approved ENUM('pending','approved','declined') DEFAULT 'pending',
  verification_token VARCHAR(255) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
