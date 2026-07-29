<?php
require_once __DIR__ . '/db_config.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

$userId = (int)($data['user_id'] ?? 2);
$userName = trim($data['user_name'] ?? 'Sapril SUPer');
$spotName = trim($data['spot_name'] ?? 'Samalona Island');
$title = trim($data['title'] ?? 'Sesi Paddle Terbaru!');
$distance = trim($data['distance'] ?? '5.0 km');
$imageUrl = trim($data['image_url'] ?? '');

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

    // Ensure image_url column exists
    try {
        $pdo->exec("ALTER TABLE community_posts ADD COLUMN image_url VARCHAR(255) DEFAULT ''");
    } catch (Exception $eCol) {}

    $stmt = $pdo->prepare("INSERT INTO community_posts (user_id, user_name, spot_name, title, distance_km, image_url, likes_count, comments_count) VALUES (:uid, :uname, :spot, :title, :dist, :img, 0, 0)");
    $stmt->execute([
        'uid' => $userId,
        'uname' => $userName,
        'spot' => $spotName,
        'title' => $title,
        'dist' => $distance,
        'img' => $imageUrl
    ]);

    echo json_encode(['success' => true, 'message' => 'Postingan sesi paddle berhasil dibagikan ke SUP Indonesia Community!']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
