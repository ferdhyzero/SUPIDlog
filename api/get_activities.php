<?php
require_once __DIR__ . '/db_config.php';

$userId = (int)($_GET['user_id'] ?? 1);

try {
    $stmt = $pdo->prepare("SELECT * FROM activities WHERE user_id = :uid ORDER BY id DESC LIMIT 20");
    $stmt->execute(['uid' => $userId]);
    $activities = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'activities' => $activities
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
