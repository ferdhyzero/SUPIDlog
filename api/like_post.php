<?php
require_once __DIR__ . '/db_config.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

$userId = (int)($data['user_id'] ?? 2);
$postId = (int)($data['post_id'] ?? 0);

if ($postId <= 0) {
    echo json_encode(['success' => false, 'message' => 'Post ID tidak valid!']);
    exit();
}

try {
    // 1. Ensure table structure exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS post_likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        post_id INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY user_post_like (user_id, post_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // 2. Check if already liked by this user
    $stmtCheck = $pdo->prepare("SELECT id FROM post_likes WHERE user_id = :uid AND post_id = :pid LIMIT 1");
    $stmtCheck->execute(['uid' => $userId, 'pid' => $postId]);
    $alreadyLiked = $stmtCheck->fetch();

    if ($alreadyLiked) {
        // UNLIKE: Remove from post_likes & decrement likes_count
        $stmtDel = $pdo->prepare("DELETE FROM post_likes WHERE user_id = :uid AND post_id = :pid");
        $stmtDel->execute(['uid' => $userId, 'pid' => $postId]);

        $stmtDec = $pdo->prepare("UPDATE community_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = :pid");
        $stmtDec->execute(['pid' => $postId]);

        $isLiked = false;
        $msg = 'Batal menyukai';
    } else {
        // LIKE: Insert into post_likes & increment likes_count
        $stmtIns = $pdo->prepare("INSERT INTO post_likes (user_id, post_id) VALUES (:uid, :pid)");
        $stmtIns->execute(['uid' => $userId, 'pid' => $postId]);

        $stmtInc = $pdo->prepare("UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = :pid");
        $stmtInc->execute(['pid' => $postId]);

        $isLiked = true;
        $msg = 'Menyukai postingan! ❤️';
    }

    // Fetch updated likes_count
    $stmtCount = $pdo->prepare("SELECT likes_count FROM community_posts WHERE id = :pid LIMIT 1");
    $stmtCount->execute(['pid' => $postId]);
    $row = $stmtCount->fetch();

    echo json_encode([
        'success' => true,
        'liked' => $isLiked,
        'likes_count' => (int)($row['likes_count'] ?? 0),
        'message' => $msg
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
