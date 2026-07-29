<?php
require_once __DIR__ . '/db_config.php';

$userId = (int)($_GET['user_id'] ?? 2);

try {
    // Ensure table structure exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS community_posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        user_name VARCHAR(100) NOT NULL,
        spot_name VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        distance_km VARCHAR(50) NOT NULL,
        image_url VARCHAR(255) DEFAULT '',
        likes_count INT DEFAULT 0,
        comments_count INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    try {
        $pdo->exec("ALTER TABLE community_posts ADD COLUMN image_url VARCHAR(255) DEFAULT ''");
    } catch (Exception $eCol) {}

    // Ensure post_likes table exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS post_likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        post_id INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY user_post_like (user_id, post_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $stmt = $pdo->prepare("SELECT p.id, p.user_id, p.user_name, p.spot_name, p.title, p.distance_km, p.image_url, p.likes_count, p.comments_count, DATE_FORMAT(p.created_at, '%d %b %Y %H:%i') as formatted_date, (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id AND l.user_id = :uid) as is_liked_by_me FROM community_posts p ORDER BY p.id DESC LIMIT 20");
    $stmt->execute(['uid' => $userId]);
    $posts = $stmt->fetchAll();

    foreach ($posts as &$post) {
        $post['is_liked_by_me'] = ((int)$post['is_liked_by_me']) > 0;
    }

    echo json_encode(['success' => true, 'posts' => $posts]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
