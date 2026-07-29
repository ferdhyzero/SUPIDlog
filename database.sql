-- ========================================================
-- Database Schema for SUPID Log (PaddleLog by SUP.ID Indonesia)
-- Compatible with MySQL 5.7+ / 8.0+ / MariaDB (cPanel & XAMPP)
-- Database Name: myhostzo_sup
-- ========================================================

CREATE DATABASE IF NOT EXISTS `myhostzo_sup` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `myhostzo_sup`;

DROP TABLE IF EXISTS `post_comments`;
DROP TABLE IF EXISTS `post_likes`;
DROP TABLE IF EXISTS `activities`;
DROP TABLE IF EXISTS `passport_stamps`;
DROP TABLE IF EXISTS `saved_spots`;
DROP TABLE IF EXISTS `gear_locker`;
DROP TABLE IF EXISTS `community_posts`;
DROP TABLE IF EXISTS `spots`;
DROP TABLE IF EXISTS `users`;

-- --------------------------------------------------------
-- 1. Table structure for `users`
-- --------------------------------------------------------
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `role` VARCHAR(20) DEFAULT 'user', -- 'user' or 'super_admin'
  `status` VARCHAR(20) DEFAULT 'approved', -- 'approved' or 'pending'
  `level` VARCHAR(50) DEFAULT 'Explorer',
  `community_rank` INT DEFAULT 1,
  `favorite_spot` VARCHAR(100) DEFAULT 'Bosowa Beach',
  `total_distance_km` DECIMAL(8,2) DEFAULT 45.80,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert Default Demo Users (Super Admin Ferdhy & User Sapril)
INSERT INTO `users` (`id`, `email`, `password_hash`, `name`, `role`, `status`, `level`, `community_rank`, `favorite_spot`, `total_distance_km`) VALUES
(1, 'ahmadferdy66@gmail.com', '$2y$10$w6QO8q7GZ2i7n2S6y9ZqeuG7vK7O8g8J1mQ2r3s4t5u6v7w8x9y0z', 'ferdhy', 'super_admin', 'approved', 'Super Admin 👑', 1, 'Bosowa Beach', 120.50),
(2, 'sapril@sup.id', '$2y$10$w6QO8q7GZ2i7n2S6y9ZqeuG7vK7O8g8J1mQ2r3s4t5u6v7w8x9y0z', 'Sapril', 'user', 'approved', 'Explorer', 2, 'Samalona Island', 45.80);

-- --------------------------------------------------------
-- 2. Table structure for `spots`
-- --------------------------------------------------------
CREATE TABLE `spots` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `stars` INT DEFAULT 5,
  `category` VARCHAR(50) DEFAULT 'Flat Water',
  `tag` VARCHAR(50) DEFAULT '',
  `season` VARCHAR(50) DEFAULT 'All Year',
  `difficulty` VARCHAR(50) DEFAULT 'Easy',
  `water` VARCHAR(50) DEFAULT 'Calm',
  `visited_count` INT DEFAULT 0,
  `lat` DECIMAL(10,8) DEFAULT -5.1478,
  `lng` DECIMAL(11,8) DEFAULT 119.4154,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `spots` (`id`, `name`, `stars`, `category`, `tag`, `season`, `difficulty`, `water`, `visited_count`, `lat`, `lng`) VALUES
(1, 'Bosowa Beach', 5, 'Flat Water', 'Popular', 'All Year', 'Easy', 'Calm', 512, -5.1478, 119.4154),
(2, 'Samalona Island', 4, 'Ocean', 'Island Tour', 'May-Oct', 'Medium', 'Clear', 420, -5.1234, 119.3456),
(3, 'Rammang-Rammang', 5, 'River', 'Nature', 'All Year', 'Easy', 'Flat', 380, -4.9234, 119.6456),
(4, 'Danau Toba', 5, 'Lake', 'Volcano', 'Jun-Sep', 'Medium', 'Deep Blue', 290, 2.6845, 98.8756),
(5, 'Wakatobi Marine Park', 5, 'Ocean', 'Surf & Reef', 'Apr-Nov', 'Hard', 'Ultra Clear', 185, -5.3123, 123.5432);

-- --------------------------------------------------------
-- 3. Table structure for `activities`
-- --------------------------------------------------------
CREATE TABLE `activities` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `spot_name` VARCHAR(100) NOT NULL,
  `distance_km` DECIMAL(8,2) NOT NULL,
  `duration_formatted` VARCHAR(50) NOT NULL,
  `calories` INT DEFAULT 0,
  `avg_speed` VARCHAR(50) DEFAULT '0.0 km/h',
  `weather` VARCHAR(100) DEFAULT 'Cerah 30°C',
  `water_condition` VARCHAR(100) DEFAULT 'Flat Water 🌊',
  `gps_coords` VARCHAR(100) DEFAULT '',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Initial Demo Activity Rows for Users
INSERT INTO `activities` (`user_id`, `spot_name`, `distance_km`, `duration_formatted`, `calories`, `avg_speed`, `weather`, `water_condition`, `gps_coords`) VALUES
(2, 'Samalona Island', 12.40, '01:15:30', 480, '6.2 km/h', '☀ Cerah 31°C', 'Ocean Tour 🌊', '-5.1234, 119.3456'),
(2, 'Bosowa Beach', 8.50, '00:45:10', 320, '5.8 km/h', '⛅ Cerah Berawan 29°C', 'Flat Water 🌊', '-5.1478, 119.4154'),
(2, 'Rammang-Rammang', 24.90, '02:30:00', 950, '7.1 km/h', '☀ Cerah 32°C', 'River Cruise 🚣', '-4.9234, 119.6456'),
(1, 'Bosowa Beach', 45.50, '03:45:00', 1650, '8.4 km/h', '☀ Cerah 30°C', 'Flat Water 🌊', '-5.1478, 119.4154'),
(1, 'Danau Toba', 75.00, '05:12:00', 2800, '9.1 km/h', '⛅ Sejuk 24°C', 'Deep Water 🌊', '2.6845, 98.8756');

-- --------------------------------------------------------
-- 4. Table structure for `passport_stamps`
-- --------------------------------------------------------
CREATE TABLE `passport_stamps` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `spot_id` INT DEFAULT NULL,
  `spot_name` VARCHAR(100) NOT NULL,
  `unlocked` TINYINT(1) DEFAULT 1,
  `unlocked_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `passport_stamps` (`user_id`, `spot_name`, `unlocked`) VALUES
(2, 'Samalona Island', 1),
(2, 'Bosowa Beach', 1),
(2, 'Rammang-Rammang', 1);

-- --------------------------------------------------------
-- 5. Table structure for `saved_spots`
-- --------------------------------------------------------
CREATE TABLE `saved_spots` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `spot_name` VARCHAR(100) NOT NULL,
  `location_address` VARCHAR(255) DEFAULT '',
  `planned_date` DATE NOT NULL,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `user_planned_spot` (`user_id`, `spot_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 6. Table structure for `gear_locker`
-- --------------------------------------------------------
CREATE TABLE `gear_locker` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `gear_name` VARCHAR(100) NOT NULL,
  `brand` VARCHAR(100) DEFAULT '',
  `category` VARCHAR(50) DEFAULT 'Board',
  `usage_km` DECIMAL(8,2) DEFAULT 0.00,
  `last_maintained` DATE DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 7. Table structure for `community_posts`
-- --------------------------------------------------------
CREATE TABLE `community_posts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `user_name` VARCHAR(100) NOT NULL,
  `spot_name` VARCHAR(100) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `distance_km` VARCHAR(50) NOT NULL,
  `image_url` VARCHAR(255) DEFAULT '',
  `likes_count` INT DEFAULT 0,
  `comments_count` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `community_posts` (`user_id`, `user_name`, `spot_name`, `title`, `distance_km`, `image_url`, `likes_count`, `comments_count`) VALUES
(2, 'Sapril', 'Samalona Island', 'Dayung pagi ombak tenang Samalona!', '12.4 km', '', 12, 3),
(1, 'ferdhy', 'Bosowa Beach', 'Sesi latihan interval ombak landai Bosowa Sunset', '45.5 km', '', 28, 7);

-- --------------------------------------------------------
-- 8. Table structure for `post_likes`
-- --------------------------------------------------------
CREATE TABLE `post_likes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `post_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `user_post_like` (`user_id`, `post_id`),
  FOREIGN KEY (`post_id`) REFERENCES `community_posts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 9. Table structure for `post_comments`
-- --------------------------------------------------------
CREATE TABLE `post_comments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `post_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `user_name` VARCHAR(100) NOT NULL,
  `comment_text` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`post_id`) REFERENCES `community_posts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
