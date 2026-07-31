<?php
require_once __DIR__ . '/db_config.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

$id = (int)($data['id'] ?? $_GET['id'] ?? 0);
$userId = (int)($data['user_id'] ?? $_GET['user_id'] ?? 0);

try {
    if ($id <= 0 || $userId <= 0) {
        echo json_encode(['success' => false, 'message' => 'Parameter ID atau User ID tidak valid']);
        exit();
    }

    $stmt = $pdo->prepare("DELETE FROM saved_spots WHERE id = :id AND user_id = :uid");
    $stmt->execute(['id' => $id, 'uid' => $userId]);

    echo json_encode([
        'success' => true,
        'message' => 'Sematan lokasi berhasil dilepaskan!'
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
