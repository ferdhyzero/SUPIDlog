<?php
require_once __DIR__ . '/db_config.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

$userId = (int)($data['user_id'] ?? 2);
$action = trim($data['action'] ?? 'add'); // 'add' or 'maintain'

try {
    if ($action === 'maintain') {
        $gearId = (int)($data['gear_id'] ?? 0);
        $stmtM = $pdo->prepare("UPDATE gear_locker SET sessions_count = sessions_count + 1, condition_status = 'Maintained ✨' WHERE id = :gid AND user_id = :uid");
        $stmtM->execute(['gid' => $gearId, 'uid' => $userId]);

        echo json_encode(['success' => true, 'message' => 'Pencucian air tawar & perawatan berhasil dicatat!']);
        exit();
    }

    // Default: Add new gear
    $gearType = trim($data['gear_type'] ?? 'Board');
    $name = trim($data['name'] ?? 'SUP Board Baru');
    $price = trim($data['price'] ?? 'Rp0');
    $reminder = trim($data['reminder'] ?? 'Bilas air tawar setelah mendayung di laut');

    $stmtIns = $pdo->prepare("INSERT INTO gear_locker (user_id, gear_type, name, sessions_count, distance_km, condition_status, purchase_date, price, reminder) VALUES (:uid, :gtype, :name, 0, 0.00, 'Excellent ✨', :pdate, :price, :rem)");
    $stmtIns->execute([
        'uid' => $userId,
        'gtype' => $gearType,
        'name' => $name,
        'pdate' => date('M Y'),
        'price' => $price,
        'rem' => $reminder
    ]);

    echo json_encode(['success' => true, 'message' => "Peralatan '$name' berhasil ditambahkan ke Gear Locker!"]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
