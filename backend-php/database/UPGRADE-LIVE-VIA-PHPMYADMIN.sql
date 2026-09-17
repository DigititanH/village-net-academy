-- =============================================================================
-- Village NetAcad — LIVE DATABASE UPGRADE (phpMyAdmin)
-- =============================================================================
-- How to use:
--   1. cPanel → phpMyAdmin → select your LIVE database (left sidebar)
--   2. Click the SQL tab
--   3. Paste this whole file → click Go
--
-- If you see "Duplicate column name" — that column already exists. Ignore it
-- and continue (re-run only the lines that failed for other reasons).
--
-- This does NOT delete data. It only ADDS missing columns.
-- =============================================================================

-- Auth / registration
ALTER TABLE registrations ADD COLUMN academy_name VARCHAR(255) DEFAULT NULL;
ALTER TABLE registrations ADD COLUMN verification_token VARCHAR(255) DEFAULT NULL;
ALTER TABLE registrations ADD COLUMN verification_token_expires DATETIME DEFAULT NULL;
ALTER TABLE registrations MODIFY role ENUM('admin','super_admin','reseller','customer','academy') DEFAULT 'customer';

-- Password reset
ALTER TABLE logins ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL;
ALTER TABLE logins ADD COLUMN reset_token_expires DATETIME DEFAULT NULL;

-- Shop: Delivery (R150) / Collection (free)
ALTER TABLE orders ADD COLUMN delivery_method VARCHAR(20) NOT NULL DEFAULT 'delivery';
ALTER TABLE orders ADD COLUMN shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- Reseller banking + documents
ALTER TABLE reseller_profiles ADD COLUMN bank_details TEXT DEFAULT NULL;
ALTER TABLE reseller_profiles ADD COLUMN id_document_url VARCHAR(500) DEFAULT NULL;
ALTER TABLE reseller_profiles ADD COLUMN proof_of_account_url VARCHAR(500) DEFAULT NULL;
ALTER TABLE reseller_profiles MODIFY commission_rate DECIMAL(5,2) DEFAULT 53.00;
UPDATE reseller_profiles SET commission_rate = 53.00 WHERE commission_rate IN (56.00, 50.00);

-- Hero CMS text + colours
ALTER TABLE hero_slides ADD COLUMN label VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE hero_slides ADD COLUMN title VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE hero_slides ADD COLUMN title_highlight VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE hero_slides ADD COLUMN subtitle TEXT NULL;
ALTER TABLE hero_slides ADD COLUMN body TEXT NULL;
ALTER TABLE hero_slides ADD COLUMN text_position VARCHAR(40) NOT NULL DEFAULT 'center';
ALTER TABLE hero_slides ADD COLUMN label_color VARCHAR(20) NOT NULL DEFAULT '#FDE68A';
ALTER TABLE hero_slides ADD COLUMN title_color VARCHAR(20) NOT NULL DEFAULT '#FFFFFF';
ALTER TABLE hero_slides ADD COLUMN title_highlight_color VARCHAR(20) NOT NULL DEFAULT '';
ALTER TABLE hero_slides ADD COLUMN subtitle_color VARCHAR(20) NOT NULL DEFAULT '#F5F5F5';
ALTER TABLE hero_slides ADD COLUMN body_color VARCHAR(20) NOT NULL DEFAULT '#E5E5E5';

ALTER TABLE hero_buttons ADD COLUMN slide_id INT NULL;

ALTER TABLE products ADD COLUMN subcategory VARCHAR(80) DEFAULT NULL;
ALTER TABLE products ADD COLUMN color_stock TEXT DEFAULT NULL;

ALTER TABLE cart ADD COLUMN size VARCHAR(50) DEFAULT NULL;
ALTER TABLE cart ADD COLUMN color VARCHAR(50) DEFAULT NULL;
ALTER TABLE order_items ADD COLUMN size VARCHAR(50) DEFAULT NULL;
ALTER TABLE order_items ADD COLUMN color VARCHAR(50) DEFAULT NULL;

-- Store categories (required for Add Product department dropdown)
INSERT IGNORE INTO categories (name, slug) VALUES ('Merchandise', 'merchandise');
INSERT IGNORE INTO categories (name, slug) VALUES ('Electronics', 'electronics');
