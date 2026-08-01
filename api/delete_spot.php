<?php
require_once __DIR__ . '/db_config.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

$spotId = (int)($data['spot_id'] ?? 0);
$userId = (int)($data['user_id'] ?? 0);

if (!$spotId || !$userId) {
    echo json_encode(['success' => false, 'message' => 'Parameter spot_id dan user_id diperlukan.']);
    exit;
}

try {
    // 1. Verify the spot exists and was created by this user
    $stmt = $pdo->prepare("SELECT id, name, created_by FROM spots WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $spotId]);
    $spot = $stmt->fetch();

    if (!$spot) {
        echo json_encode(['success' => false, 'message' => 'Spot tidak ditemukan.']);
        exit;
    }

    if ((int)$spot['created_by'] !== $userId) {
        echo json_encode(['success' => false, 'message' => 'Anda tidak memiliki izin untuk menghapus spot ini. Hanya pembuat spot yang dapat menghapusnya.']);
        exit;
    }

    $spotName = $spot['name'];

    // 2. Delete from saved_spots (all users' pins for this spot)
    $stmtDelSaved = $pdo->prepare("DELETE FROM saved_spots WHERE spot_name = :name");
    $stmtDelSaved->execute(['name' => $spotName]);

    // 3. Delete from master spots table
    $stmtDelSpot = $pdo->prepare("DELETE FROM spots WHERE id = :id AND created_by = :uid");
    $stmtDelSpot->execute(['id' => $spotId, 'uid' => $userId]);

    echo json_encode([
        'success' => true,
        'message' => "Spot '$spotName' berhasil dihapus!"
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
