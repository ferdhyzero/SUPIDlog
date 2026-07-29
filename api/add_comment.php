<?php
require_once __DIR__ . '/db_config.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

$postId = (int)($data['post_id'] ?? 0);
$userId = (int)($data['user_id'] ?? 2);
$userName = trim($data['user_name'] ?? 'Sapril SUPer');
$commentText = trim($data['comment_text'] ?? '');

if ($postId <= 0 || empty($commentText)) {
    echo json_encode(['success' => false, 'message' => 'Komentar tidak boleh kosong!']);
    exit();
}

try {
    // 1. Ensure table structure exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS post_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        user_name VARCHAR(100) NOT NULL,
        comment_text TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // 2. Insert comment
    $stmt = $pdo->prepare("INSERT INTO post_comments (post_id, user_id, user_name, comment_text) VALUES (:pid, :uid, :uname, :ctext)");
    $stmt->execute([
        'pid' => $postId,
        'uid' => $userId,
        'uname' => $userName,
        'ctext' => $commentText
    ]);

    // 3. Increment comments_count in community_posts
    $stmtInc = $pdo->prepare("UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = :pid");
    $stmtInc->execute(['pid' => $postId]);

    // Fetch total comment count
    $stmtCount = $pdo->prepare("SELECT comments_count FROM community_posts WHERE id = :pid LIMIT 1");
    $stmtCount->execute(['pid' => $postId]);
    $row = $stmtCount->fetch();

    echo json_encode([
        'success' => true,
        'comments_count' => (int)($row['comments_count'] ?? 0),
        'message' => 'Komentar berhasil ditambahkan!'
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
