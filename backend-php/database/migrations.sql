-- Incremental changes for existing databases. Safe to re-run (errors ignored by migrate.php).

-- Resellers earn 56% commission on referred shop orders
ALTER TABLE reseller_profiles MODIFY commission_rate DECIMAL(5,2) DEFAULT 56.00;
UPDATE reseller_profiles SET commission_rate = 56.00;

-- Academies receive 26% of sales made by resellers linked to that academy (computed in admin Finance).

-- Super admin role for elevated CMS / admin access
ALTER TABLE registrations MODIFY role ENUM('admin','super_admin','reseller','customer') DEFAULT 'customer';

-- Per-slide hero messages
ALTER TABLE hero_slides ADD COLUMN label VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE hero_slides ADD COLUMN title VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE hero_slides ADD COLUMN title_highlight VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE hero_slides ADD COLUMN subtitle TEXT NULL;
ALTER TABLE hero_slides ADD COLUMN body TEXT NULL;
ALTER TABLE hero_buttons ADD COLUMN slide_id INT NULL;

-- Store departments
INSERT IGNORE INTO categories (name, slug) VALUES ('Merchandise', 'merchandise');
INSERT IGNORE INTO categories (name, slug) VALUES ('Electronics', 'electronics');

-- Hero slide wording placement
ALTER TABLE hero_slides ADD COLUMN text_position VARCHAR(40) NOT NULL DEFAULT 'center';

-- Electronics / merchandise product types
ALTER TABLE products ADD COLUMN subcategory VARCHAR(80) DEFAULT NULL;

-- Academy affiliate accounts
ALTER TABLE registrations MODIFY role ENUM('admin','super_admin','reseller','customer','academy') DEFAULT 'customer';
ALTER TABLE registrations ADD COLUMN academy_name VARCHAR(255) DEFAULT NULL;

