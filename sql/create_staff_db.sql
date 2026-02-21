
CREATE DATABASE IF NOT EXISTS `ethans_cafe_staff` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `ethans_cafe_staff`;

CREATE TABLE IF NOT EXISTS `staff` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(200) NOT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `role` VARCHAR(50) DEFAULT 'staff',
  `status` ENUM('active','inactive','suspended') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `last_login` DATETIME NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Example insert (replace the hash with a real hash from PHP's password_hash):
-- INSERT INTO `staff` (`username`, `password_hash`, `full_name`, `email`, `role`) 
-- VALUES ('admin', '$2y$10$EXAMPLE_HASH_REPLACE_ME', 'Admin User', 'admin@example.com', 'admin');
