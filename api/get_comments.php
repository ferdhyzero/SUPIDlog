<?php
require_once __DIR__ . '/db_config.php';

$postId = (int)($_GET['post_id'] ?? 0);

try {
    // Ensure table structure exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS post_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        user_name VARCHAR(100) NOT NULL,
        comment_text TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $stmt = $pdo->prepare("SELECT id, user_id, user_name, comment_text, DATE_FORMAT(created_at, '%d %b %Y %H:%i') as formatted_date FROM post_comments WHERE post_id = :pid ORDER BY id ASC");
    $stmt->execute(['pid' => $postId]);
    $comments = $stmt->fetchAll();

    echo json_encode(['success' => true, 'comments' => $comments]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
