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
    // 1. Verify the spot exists
    $stmt = $pdo->prepare("SELECT id, name, category, created_by FROM spots WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $spotId]);
    $spot = $stmt->fetch();

    if (!$spot) {
        echo json_encode(['success' => false, 'message' => 'Spot tidak ditemukan.']);
        exit;
    }

    $spotName = $spot['name'];
    $createdBy = $spot['created_by'] ? (int)$spot['created_by'] : null;
    $isCustomSpot = ($spot['category'] === 'Custom Spot');

    // 2. Permission check: 
    //    - If created_by matches userId -> allowed
    //    - If it's a Custom Spot category -> allowed (these are always user-created)
    $allowed = false;

    if ($createdBy === $userId) {
        $allowed = true;
    } elseif ($isCustomSpot) {
        $allowed = true;
    }

    if (!$allowed) {
        echo json_encode(['success' => false, 'message' => 'Anda tidak memiliki izin untuk menghapus spot ini. Hanya pembuat spot yang dapat menghapusnya.']);
        exit;
    }

    // 3. Delete from saved_spots (this user's pins for this spot)
    $stmtDelSaved = $pdo->prepare("DELETE FROM saved_spots WHERE spot_name = :name AND user_id = :uid");
    $stmtDelSaved->execute(['name' => $spotName, 'uid' => $userId]);

    // 4. Delete from master spots table
    $stmtDelSpot = $pdo->prepare("DELETE FROM spots WHERE id = :id");
    $stmtDelSpot->execute(['id' => $spotId]);

    echo json_encode([
        'success' => true,
        'message' => "Spot '$spotName' berhasil dihapus!"
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
