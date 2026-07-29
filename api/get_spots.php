<?php
require_once __DIR__ . '/db_config.php';

try {
    $stmt = $pdo->query("SELECT * FROM spots ORDER BY visited_count DESC");
    $spots = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'spots' => $spots
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
