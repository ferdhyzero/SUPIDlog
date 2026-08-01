<?php
require_once __DIR__ . '/db_config.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

$userId = (int)($data['user_id'] ?? 0);
$activityId = (int)($data['activity_id'] ?? 0);

if (!$userId || !$activityId) {
    echo json_encode(['success' => false, 'message' => 'Parameter user_id dan activity_id diperlukan.']);
    exit;
}

try {
    // Migration guard: create kudos table if not exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS activity_kudos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        activity_id INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_kudos (user_id, activity_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Migration guard: ensure kudos_count column in activities
    try {
        $pdo->exec("ALTER TABLE activities ADD COLUMN kudos_count INT DEFAULT 0");
    } catch (Exception $ex) {}

    // Check if user already kudosed this activity
    $stmtCheck = $pdo->prepare("SELECT id FROM activity_kudos WHERE user_id = :uid AND activity_id = :aid");
    $stmtCheck->execute(['uid' => $userId, 'aid' => $activityId]);
    $existing = $stmtCheck->fetch();

    if ($existing) {
        // Remove kudos (toggle off)
        $pdo->prepare("DELETE FROM activity_kudos WHERE user_id = :uid AND activity_id = :aid")
            ->execute(['uid' => $userId, 'aid' => $activityId]);
        $pdo->prepare("UPDATE activities SET kudos_count = GREATEST(0, kudos_count - 1) WHERE id = :aid")
            ->execute(['aid' => $activityId]);
        $action = 'removed';
    } else {
        // Add kudos (toggle on)
        $pdo->prepare("INSERT INTO activity_kudos (user_id, activity_id) VALUES (:uid, :aid)")
            ->execute(['uid' => $userId, 'aid' => $activityId]);
        $pdo->prepare("UPDATE activities SET kudos_count = kudos_count + 1 WHERE id = :aid")
            ->execute(['aid' => $activityId]);
        $action = 'added';
    }

    // Get updated count
    $stmtCount = $pdo->prepare("SELECT kudos_count FROM activities WHERE id = :aid");
    $stmtCount->execute(['aid' => $activityId]);
    $row = $stmtCount->fetch();

    echo json_encode([
        'success' => true,
        'action' => $action,
        'kudos_count' => (int)($row['kudos_count'] ?? 0),
        'is_kudosed' => $action === 'added'
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
