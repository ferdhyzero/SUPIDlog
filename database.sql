-- Database SQL Dump for SUPIDlog (Local XAMPP & cPanel Sync)
-- Target Database: supidlog_db / myhostzo_sup

SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS `saved_spots`;
DROP TABLE IF EXISTS `post_likes`;
DROP TABLE IF EXISTS `post_comments`;
DROP TABLE IF EXISTS `passport_stamps`;
DROP TABLE IF EXISTS `gear_locker`;
DROP TABLE IF EXISTS `community_posts`;
DROP TABLE IF EXISTS `activities`;
DROP TABLE IF EXISTS `spots`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS=1;

-- --------------------------------------------------------

CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `plain_password` varchar(255) DEFAULT '',
  `name` varchar(100) NOT NULL,
  `avatar_url` varchar(255) DEFAULT '',
  `club_name` varchar(100) DEFAULT 'SUP.ID Indonesia',
  `bio` varchar(255) DEFAULT 'SUP Enthusiast 🏄‍♂️',
  `instagram_handle` varchar(100) DEFAULT NULL,
  `map_mode` varchar(20) DEFAULT 'roadmap',
  `emergency_contact` varchar(50) DEFAULT '',
  `role` varchar(20) DEFAULT 'user',
  `status` varchar(20) DEFAULT 'approved',
  `reset_status` varchar(20) DEFAULT NULL,
  `requested_password` varchar(255) DEFAULT NULL,
  `level` varchar(50) DEFAULT 'Explorer',
  `community_rank` int DEFAULT '15',
  `favorite_spot` varchar(100) DEFAULT 'Bosowa',
  `total_distance_km` decimal(8,2) DEFAULT '1842.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`id`, `email`, `password_hash`, `plain_password`, `name`, `role`, `status`, `reset_status`, `requested_password`, `level`, `community_rank`, `favorite_spot`, `total_distance_km`, `created_at`) VALUES
(1, 'ahmadferdy66@gmail.com', '$2y$10$w6QO8q7GZ2i7n2S6y9ZqeuG7vK7O8g8J1mQ2r3s4t5u6v7w8x9y0z', 'admin123', 'ferdhy', 'super_admin', 'approved', NULL, NULL, 'Beginner SUPer', 1, 'Samalona', 0.52, '2026-07-29 12:51:06'),
(2, 'sapril@sup.id', '$2y$10$w6QO8q7GZ2i7n2S6y9ZqeuG7vK7O8g8J1mQ2r3s4t5u6v7w8x9y0z', '1234567', 'Sapril', 'user', 'approved', NULL, NULL, 'Advanced SUPer', 2, 'Samalona', 0.00, '2026-07-29 12:51:06'),
(4, 'musliadi.ptp02@gmail.com', '$2y$10$5LDsi0rVBgQq38kEK/ZJZ.aer13ABM5fjq42k.nDcf.nNCSn2riz.', 'Musliadi12', 'Musliadi', 'user', 'approved', NULL, NULL, 'Beginner SUPer', 3, '-', 0.00, '2026-07-30 02:20:17'),
(5, 'rezkydewa03@gmail.com', '$2y$10$3sLJ7Q0dIl.hTfpp8lS7vOW3ikj7Cf4UL3r3k8iS2qnvIC0xenWLe', 'RezkyRDS03', 'Andi Rezky Dewa Singke', 'user', 'approved', NULL, NULL, 'Beginner SUPer', 4, '-', 0.00, '2026-07-30 02:39:53');

-- --------------------------------------------------------

CREATE TABLE `spots` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `stars` int DEFAULT '5',
  `category` varchar(50) DEFAULT 'Flat Water',
  `tag` varchar(50) DEFAULT '',
  `season` varchar(50) DEFAULT 'All Year',
  `difficulty` varchar(50) DEFAULT 'Easy',
  `water` varchar(50) DEFAULT 'Calm',
  `visited_count` int DEFAULT '0',
  `lat` decimal(10,8) DEFAULT '-5.14780000',
  `lng` decimal(11,8) DEFAULT '119.41540000',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `spots` (`id`, `name`, `stars`, `category`, `tag`, `season`, `difficulty`, `water`, `visited_count`, `lat`, `lng`, `created_at`) VALUES
(1, 'Bosowa Beach', 5, 'Flat Water', 'Popular', 'All Year', 'Easy', 'Calm', 512, -5.14780000, 119.41540000, '2026-07-29 12:51:06'),
(2, 'Samalona Island', 4, 'Ocean', 'Island Tour', 'May-Oct', 'Medium', 'Clear', 420, -5.12340000, 119.34560000, '2026-07-29 12:51:06'),
(3, 'Rammang-Rammang', 5, 'River', 'Nature', 'All Year', 'Easy', 'Flat', 380, -4.92340000, 119.64560000, '2026-07-29 12:51:06'),
(4, 'Danau Toba', 5, 'Lake', 'Volcano', 'Jun-Sep', 'Medium', 'Deep Blue', 290, 2.68450000, 98.87560000, '2026-07-29 12:51:06'),
(5, 'Wakatobi Marine Park', 5, 'Ocean', 'Surf & Reef', 'Apr-Nov', 'Hard', 'Ultra Clear', 185, -5.31230000, 123.54320000, '2026-07-29 12:51:06'),
(6, 'Pantai bira', 5, 'Custom Spot', '', 'All Year', 'Easy', 'Clear', 1, -5.14780000, 119.41540000, '2026-07-30 02:15:09'),
(7, 'Pantai indah bosowa', 5, 'Custom Spot', '', 'All Year', 'Easy', 'Clear', 1, -5.14780000, 119.41540000, '2026-07-30 02:48:45');

-- --------------------------------------------------------

CREATE TABLE `activities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `spot_name` varchar(100) NOT NULL,
  `distance_km` decimal(8,2) NOT NULL,
  `duration_formatted` varchar(50) NOT NULL,
  `calories` int DEFAULT '0',
  `avg_speed` varchar(50) DEFAULT '0.0 km/h',
  `max_speed_kmh` decimal(5,2) DEFAULT '0.00',
  `weather` varchar(100) DEFAULT 'Cerah 30°C',
  `water_condition` varchar(100) DEFAULT 'Flat Water',
  `gps_coords` varchar(100) DEFAULT '',
  `route_json` longtext DEFAULT NULL,
  `shared_to_community` tinyint(1) DEFAULT 0,
  `local_tips` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `activities_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `activities` (`id`, `user_id`, `spot_name`, `distance_km`, `duration_formatted`, `calories`, `avg_speed`, `weather`, `water_condition`, `gps_coords`, `created_at`) VALUES
(1, 1, 'Samalona', 0.00, '00:07', 693, '0.0 km/h', '☀ Sunny', 'Flat', '', '2026-07-30 01:16:23'),
(2, 1, 'Samalona', 0.00, '00:35', 693, '0.0 km/h', '☀ Sunny', 'Flat', '', '2026-07-30 01:34:04'),
(3, 1, 'Bili-Bili', 0.01, '00:27', 693, '1.3 km/h', '🌧 Rain', 'Wave', '', '2026-07-30 01:34:06'),
(4, 1, 'Samalona', 0.06, '00:41', 693, '5.3 km/h', '☀ Sunny', 'Flat', '', '2026-07-30 02:09:05'),
(5, 1, 'Samalona', 0.00, '00:10', 693, '0.0 km/h', '☀ Sunny', 'Flat', '', '2026-07-30 02:13:14'),
(6, 1, 'Samalona', 0.08, '00:40', 693, '7.2 km/h', '☀ Sunny', 'Flat', '', '2026-07-30 02:13:44'),
(7, 1, 'Samalona', 0.08, '00:40', 693, '7.2 km/h', '☀ Sunny', 'Flat', '', '2026-07-30 02:13:44'),
(8, 1, 'Samalona', 0.08, '00:40', 693, '7.2 km/h', '☀ Sunny', 'Flat', '', '2026-07-30 02:13:44'),
(9, 1, 'Raja Ampat', 0.21, '00:09', 693, '84.0 km/h', '☀ Sunny', 'Flat', '', '2026-07-30 02:14:39'),
(10, 2, 'Samalona', 0.00, '00:10', 693, '0.0 km/h', '☀ Sunny', 'Flat', '', '2026-07-30 02:49:50');

-- --------------------------------------------------------

CREATE TABLE `community_posts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `user_name` varchar(100) NOT NULL,
  `spot_name` varchar(100) NOT NULL,
  `title` varchar(255) NOT NULL,
  `distance_km` varchar(50) NOT NULL,
  `image_url` varchar(255) DEFAULT '',
  `local_tips` text DEFAULT NULL,
  `likes_count` int DEFAULT '0',
  `comments_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `community_posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

CREATE TABLE `gear_locker` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `gear_name` varchar(100) NOT NULL,
  `brand` varchar(100) DEFAULT '',
  `category` varchar(50) DEFAULT 'Board',
  `usage_km` decimal(8,2) DEFAULT '0.00',
  `last_maintained` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `gear_locker_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

CREATE TABLE `passport_stamps` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `spot_id` int DEFAULT NULL,
  `spot_name` varchar(100) NOT NULL,
  `unlocked` tinyint(1) DEFAULT '1',
  `unlocked_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `passport_stamps_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `passport_stamps` (`id`, `user_id`, `spot_id`, `spot_name`, `unlocked`, `unlocked_at`) VALUES
(1, 1, NULL, 'Samalona', 1, '2026-07-30 01:16:23'),
(2, 1, NULL, 'Samalona', 1, '2026-07-30 01:34:04'),
(3, 1, NULL, 'Bili-Bili', 1, '2026-07-30 01:34:06'),
(4, 1, NULL, 'Samalona', 1, '2026-07-30 02:09:05'),
(5, 1, NULL, 'Samalona', 1, '2026-07-30 02:13:14'),
(6, 1, NULL, 'Samalona', 1, '2026-07-30 02:13:44'),
(7, 1, NULL, 'Samalona', 1, '2026-07-30 02:13:44'),
(8, 1, NULL, 'Samalona', 1, '2026-07-30 02:13:44'),
(9, 1, NULL, 'Raja Ampat', 1, '2026-07-30 02:14:39'),
(10, 2, NULL, 'Samalona', 1, '2026-07-30 02:49:50');

-- --------------------------------------------------------

CREATE TABLE `post_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL,
  `user_id` int NOT NULL,
  `user_name` varchar(100) NOT NULL,
  `comment_text` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `post_id` (`post_id`),
  CONSTRAINT `post_comments_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `community_posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

CREATE TABLE `post_likes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `post_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_post_like` (`user_id`,`post_id`),
  KEY `post_id` (`post_id`),
  CONSTRAINT `post_likes_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `community_posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

CREATE TABLE `saved_spots` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `spot_name` varchar(100) NOT NULL,
  `location_address` varchar(255) DEFAULT '',
  `planned_date` date NOT NULL,
  `notes` text,
  `is_completed` tinyint(1) DEFAULT 0,
  `target_month` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_planned_spot` (`user_id`,`spot_name`),
  CONSTRAINT `saved_spots_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `saved_spots` (`id`, `user_id`, `spot_name`, `location_address`, `planned_date`, `notes`, `created_at`) VALUES
(1, 1, 'Bosowa Beach', '', '2026-08-05', 'Rencana paddle trip ke Bosowa Beach', '2026-07-29 14:00:45'),
(2, 1, 'Samalona Island', '', '2026-08-06', 'Rencana paddle trip ke Samalona Island', '2026-07-30 01:14:38'),
(3, 1, 'Pantai bira', 'Hasil Pencarian: Pantai bira', '2026-07-30', 'Rencana paddle trip ke Pantai bira', '2026-07-30 02:15:09'),
(4, 2, 'Pantai indah bosowa', 'Hasil Pencarian: Pantai indah bosowa', '2026-08-06', 'Rencana paddle trip ke Pantai indah bosowa', '2026-07-30 02:48:45');
