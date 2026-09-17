-- Incremental changes for existing databases. Safe to re-run (errors ignored by migrate.php).

-- Resellers earn 53% commission; linked centres earn 26% of referred sales
ALTER TABLE reseller_profiles MODIFY commission_rate DECIMAL(5,2) DEFAULT 53.00;
-- Do not bulk-update existing rates — only change the default for new rows.

-- Academies / centres receive 26% of sales made by resellers linked to that centre (computed in admin Finance).

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
INSERT IGNORE INTO categories (name, slug) VALUES ('Accessories', 'accessories');

-- Hero slide wording placement
ALTER TABLE hero_slides ADD COLUMN text_position VARCHAR(40) NOT NULL DEFAULT 'center';

-- Hero slide text colors
ALTER TABLE hero_slides ADD COLUMN label_color VARCHAR(20) NOT NULL DEFAULT '#FDE68A';
ALTER TABLE hero_slides ADD COLUMN title_color VARCHAR(20) NOT NULL DEFAULT '#FFFFFF';
ALTER TABLE hero_slides ADD COLUMN title_highlight_color VARCHAR(20) NOT NULL DEFAULT '';
ALTER TABLE hero_slides ADD COLUMN subtitle_color VARCHAR(20) NOT NULL DEFAULT '#F5F5F5';
ALTER TABLE hero_slides ADD COLUMN body_color VARCHAR(20) NOT NULL DEFAULT '#E5E5E5';

-- Electronics / merchandise product types
ALTER TABLE products ADD COLUMN subcategory VARCHAR(80) DEFAULT NULL;
ALTER TABLE products ADD COLUMN color_stock TEXT DEFAULT NULL;

-- Academy affiliate accounts
ALTER TABLE registrations MODIFY role ENUM('admin','super_admin','reseller','customer','academy') DEFAULT 'customer';
ALTER TABLE registrations ADD COLUMN academy_name VARCHAR(255) DEFAULT NULL;

-- Email confirmation on register
ALTER TABLE registrations ADD COLUMN verification_token VARCHAR(255) DEFAULT NULL;
ALTER TABLE registrations ADD COLUMN verification_token_expires DATETIME DEFAULT NULL;

-- Password reset
ALTER TABLE logins ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL;
ALTER TABLE logins ADD COLUMN reset_token_expires DATETIME DEFAULT NULL;

-- Shop delivery vs collection at centre
ALTER TABLE orders ADD COLUMN delivery_method VARCHAR(20) NOT NULL DEFAULT 'delivery';
ALTER TABLE orders ADD COLUMN shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- Reseller banking details + payout documents
ALTER TABLE reseller_profiles ADD COLUMN bank_details TEXT DEFAULT NULL;
ALTER TABLE reseller_profiles ADD COLUMN id_document_url VARCHAR(500) DEFAULT NULL;
ALTER TABLE reseller_profiles ADD COLUMN proof_of_account_url VARCHAR(500) DEFAULT NULL;

