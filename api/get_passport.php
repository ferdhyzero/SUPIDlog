<?php
require_once __DIR__ . '/db_config.php';

$userId = (int)($_GET['user_id'] ?? 2);

try {
    // Master list of all official Indonesian SUP spots
    $stmtAllSpots = $pdo->query("SELECT name FROM spots ORDER BY id ASC");
    $allSpots = $stmtAllSpots->fetchAll(PDO::FETCH_COLUMN);

    if (empty($allSpots)) {
        $allSpots = ['Samalona', 'Bosowa', 'Bili-bili', 'Wakatobi', 'Raja Ampat', 'Banda Neira', 'Bunaken', 'Danau Toba'];
    }

    // Unlocked stamps for this user
    $stmtUnlocked = $pdo->prepare("SELECT spot_name, unlocked_at FROM passport_stamps WHERE user_id = :uid");
    $stmtUnlocked->execute(['uid' => $userId]);
    $unlockedRows = $stmtUnlocked->fetchAll();

    $unlockedMap = [];
    foreach ($unlockedRows as $row) {
        $unlockedMap[$row['spot_name']] = date('d M Y', strtotime($row['unlocked_at']));
    }

    $stamps = [];
    foreach ($allSpots as $spotName) {
        $isUnlocked = isset($unlockedMap[$spotName]);
        $stamps[] = [
            'name' => $spotName,
            'unlocked' => $isUnlocked,
            'date' => $isUnlocked ? $unlockedMap[$spotName] : 'Belum Dikunjungi'
        ];
    }

    $visitedCount = count($unlockedMap);
    $totalSpots = count($allSpots);
    $completedPercent = $totalSpots > 0 ? round(($visitedCount / $totalSpots) * 100) : 0;

    echo json_encode([
        'success' => true,
        'visitedCount' => $visitedCount,
        'totalSpots' => $totalSpots,
        'completedPercent' => $completedPercent,
        'stamps' => $stamps
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
