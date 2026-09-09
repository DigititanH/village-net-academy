-- Village NetAcad - phpMyAdmin import (cPanel / Afrihost)
-- DO NOT paste into SQL tab - use Import and choose this file
-- DO NOT import .env (that is app config, not SQL)
-- Admin: admin@villagenetacad.com / Admin123!
--
-- STEP 1: In cPanel create MySQL database + user
-- STEP 2: In phpMyAdmin click your database name on the left
-- STEP 3: Import tab -> Choose File -> import.sql -> Go

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 01_registrations.sql
CREATE TABLE IF NOT EXISTS registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role ENUM('admin','super_admin','reseller','customer','academy') DEFAULT 'customer',
  avatar VARCHAR(500) DEFAULT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  academy_name VARCHAR(255) DEFAULT NULL,
  is_verified TINYINT(1) DEFAULT 0,
  is_approved ENUM('pending','approved','declined') DEFAULT 'pending',
  verification_token VARCHAR(255) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 02_logins.sql
CREATE TABLE IF NOT EXISTS logins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  registration_id INT NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  reset_token VARCHAR(255) DEFAULT NULL,
  reset_token_expires DATETIME DEFAULT NULL,
  last_login_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 03_categories.sql
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  image VARCHAR(500) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 04_products.sql
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  compare_price DECIMAL(10,2) DEFAULT NULL,
  category_id INT DEFAULT NULL,
  subcategory VARCHAR(80) DEFAULT NULL,
  image VARCHAR(500) DEFAULT NULL,
  images TEXT DEFAULT NULL,
  stock INT DEFAULT 0,
  sizes TEXT DEFAULT NULL,
  colors TEXT DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 05_orders.sql
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  total DECIMAL(10,2) NOT NULL,
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

-- 06_order_items.sql
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  size VARCHAR(50) DEFAULT NULL,
  color VARCHAR(50) DEFAULT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 07_cart.sql
CREATE TABLE IF NOT EXISTS cart (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  size VARCHAR(50) DEFAULT NULL,
  color VARCHAR(50) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES registrations(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 08_wishlist.sql
CREATE TABLE IF NOT EXISTS wishlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES registrations(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_wishlist_user_product (user_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 09_reviews.sql
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES registrations(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10_donations.sql
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

-- 11_reseller_profiles.sql
CREATE TABLE IF NOT EXISTS reseller_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  referral_code VARCHAR(100) NOT NULL UNIQUE,
  commission_rate DECIMAL(5,2) DEFAULT 56.00,
  status ENUM('pending','approved','rejected','suspended') DEFAULT 'pending',
  wallet_balance DECIMAL(10,2) DEFAULT 0.00,
  total_earned DECIMAL(10,2) DEFAULT 0.00,
  bio TEXT DEFAULT NULL,
  academy VARCHAR(255) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES registrations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12_commissions.sql
CREATE TABLE IF NOT EXISTS commissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reseller_id INT NOT NULL,
  order_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending','paid') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reseller_id) REFERENCES reseller_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13_withdrawals.sql
CREATE TABLE IF NOT EXISTS withdrawals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reseller_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending','approved','rejected','completed') DEFAULT 'pending',
  bank_details TEXT DEFAULT NULL,
  processed_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reseller_id) REFERENCES reseller_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14_notifications.sql
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  type ENUM('info','success','warning','error') DEFAULT 'info',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES registrations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15_contact_messages.sql
CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) DEFAULT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16_ccna_enrolments.sql
CREATE TABLE IF NOT EXISTS ccna_enrolments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  student_type ENUM('south-african','international') NOT NULL DEFAULT 'south-african',
  country VARCHAR(120) NOT NULL DEFAULT 'South Africa',
  course_title VARCHAR(255) NOT NULL,
  notes TEXT DEFAULT NULL,
  amount DECIMAL(10,2) NOT NULL,
  frequency TINYINT NOT NULL DEFAULT 3,
  cycles INT NOT NULL DEFAULT 3,
  payment_status ENUM('pending','active','failed','cancelled') DEFAULT 'pending',
  payment_intent_id VARCHAR(255) DEFAULT NULL,
  subscription_token VARCHAR(255) DEFAULT NULL,
  m_payment_id VARCHAR(100) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17_hero_content.sql
CREATE TABLE IF NOT EXISTS hero_content (
  id INT AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(255) NOT NULL DEFAULT '',
  title VARCHAR(255) NOT NULL DEFAULT '',
  title_highlight VARCHAR(255) NOT NULL DEFAULT '',
  subtitle TEXT,
  body TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hero_slides (
  id INT AUTO_INCREMENT PRIMARY KEY,
  image_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255) DEFAULT '',
  label VARCHAR(255) NOT NULL DEFAULT '',
  title VARCHAR(255) NOT NULL DEFAULT '',
  title_highlight VARCHAR(255) NOT NULL DEFAULT '',
  subtitle TEXT,
  body TEXT,
  text_position VARCHAR(40) NOT NULL DEFAULT 'center',
  sort_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19_hero_buttons.sql
CREATE TABLE IF NOT EXISTS hero_buttons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slide_id INT NULL,
  label VARCHAR(120) NOT NULL,
  url VARCHAR(500) NOT NULL,
  style VARCHAR(40) DEFAULT 'primary',
  sort_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  open_in_new_tab TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- seed.sql
INSERT IGNORE INTO categories (name, slug) VALUES ('Merchandise', 'merchandise');
INSERT IGNORE INTO categories (name, slug) VALUES ('Electronics', 'electronics');
INSERT IGNORE INTO categories (name, slug) VALUES ('T-Shirts', 't-shirts');
INSERT IGNORE INTO categories (name, slug) VALUES ('Hoodies', 'hoodies');
INSERT IGNORE INTO categories (name, slug) VALUES ('Caps', 'caps');
INSERT IGNORE INTO categories (name, slug) VALUES ('Stickers', 'stickers');
INSERT IGNORE INTO categories (name, slug) VALUES ('Bags', 'bags');
INSERT IGNORE INTO categories (name, slug) VALUES ('Books', 'books');

SET FOREIGN_KEY_CHECKS = 1;

INSERT IGNORE INTO registrations (name, role, is_verified, is_approved) VALUES ('Admin', 'admin', 1, 'approved');

INSERT IGNORE INTO logins (registration_id, email, password)
SELECT r.id, 'admin@villagenetacad.com', '$2y$12$5ncCsyV9hyJHSzRFr69vG.F.F/N4kA24JgyPNxeeeh3wnOtgyJNZO'
FROM registrations r
WHERE r.role = 'admin' AND r.name = 'Admin'
AND NOT EXISTS (SELECT 1 FROM logins l WHERE l.email = 'admin@villagenetacad.com');
