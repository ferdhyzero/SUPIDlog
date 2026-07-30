<?php
require_once __DIR__ . '/db_config.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

$action = trim($_GET['action'] ?? $data['action'] ?? 'list');
$userId = (int)($_GET['user_id'] ?? $data['user_id'] ?? 1);

try {
    // Migration guard
    try {
        $pdo->exec("ALTER TABLE saved_spots ADD COLUMN is_completed TINYINT(1) DEFAULT 0 AFTER notes");
    } catch (Exception $e1) {}
    try {
        $pdo->exec("ALTER TABLE saved_spots ADD COLUMN target_month VARCHAR(50) DEFAULT NULL AFTER is_completed");
    } catch (Exception $e2) {}

    if ($action === 'list') {
        $stmt = $pdo->prepare("SELECT id, spot_name, location_address, planned_date, notes, is_completed, target_month, DATE_FORMAT(created_at, '%d %b %Y') as added_date FROM saved_spots WHERE user_id = :uid ORDER BY is_completed ASC, id DESC");
        $stmt->execute(['uid' => $userId]);
        $items = $stmt->fetchAll();

        echo json_encode(['success' => true, 'bucket_list' => $items]);
        exit();
    }

    if ($action === 'add') {
        $spotName = trim($data['spot_name'] ?? '');
        $targetMonth = trim($data['target_month'] ?? 'Agustus 2026');
        $notes = trim($data['notes'] ?? 'Spot impian sesi dayung');

        if (empty($spotName)) {
            echo json_encode(['success' => false, 'message' => 'Nama spot impian wajib diisi!']);
            exit();
        }

        $stmt = $pdo->prepare("INSERT INTO saved_spots (user_id, spot_name, planned_date, notes, target_month) VALUES (:uid, :spot, CURRENT_DATE(), :notes, :tmonth) ON DUPLICATE KEY UPDATE notes = :notes, target_month = :tmonth");
        $stmt->execute([
            'uid' => $userId,
            'spot' => $spotName,
            'notes' => $notes,
            'tmonth' => $targetMonth
        ]);

        echo json_encode(['success' => true, 'message' => "🎯 Spot '$spotName' berhasil ditambahkan ke Bucket List Impian Anda!"]);
        exit();
    }

    if ($action === 'complete') {
        $id = (int)($data['id'] ?? 0);
        $spotName = trim($data['spot_name'] ?? '');

        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'ID tidak valid!']);
            exit();
        }

        // 1. Mark completed
        $stmt = $pdo->prepare("UPDATE saved_spots SET is_completed = 1 WHERE id = :id AND user_id = :uid");
        $stmt->execute(['id' => $id, 'uid' => $userId]);

        // 2. Unlock passport stamp
        if (!empty($spotName)) {
            try {
                $stmtStamp = $pdo->prepare("INSERT INTO passport_stamps (user_id, spot_name, unlocked) VALUES (:uid, :spot, 1)");
                $stmtStamp->execute(['uid' => $userId, 'spot' => $spotName]);
            } catch (Exception $exS) {}
        }

        echo json_encode(['success' => true, 'message' => "🏆 Selamat! Spot '$spotName' telah dikunjungi & stempel Paspor Digital terbuka!"]);
        exit();
    }

    if ($action === 'delete') {
        $id = (int)($data['id'] ?? 0);
        $stmt = $pdo->prepare("DELETE FROM saved_spots WHERE id = :id AND user_id = :uid");
        $stmt->execute(['id' => $id, 'uid' => $userId]);

        echo json_encode(['success' => true, 'message' => 'Item berhasil dihapus dari Bucket List.']);
        exit();
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
