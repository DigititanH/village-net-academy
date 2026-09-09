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
