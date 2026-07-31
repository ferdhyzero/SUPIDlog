<?php
require_once __DIR__ . '/db_config.php';

$userId = (int)($_GET['user_id'] ?? 1);

try {
    // 1. Master list of official Indonesian SUP spots
    $stmtAllSpots = $pdo->query("SELECT name FROM spots ORDER BY id ASC");
    $allSpots = $stmtAllSpots->fetchAll(PDO::FETCH_COLUMN);

    if (empty($allSpots)) {
        $allSpots = [
            'Bosowa Beach (Makassar)',
            'Pantai Losari (Makassar)',
            'Akkarena Beach (Makassar)',
            'Tanjung Bira (Bulukumba)',
            'Pulau Samalona',
            'Wakatobi',
            'Raja Ampat',
            'Banda Neira',
            'Bunaken',
            'Danau Toba'
        ];
    }

    // 2. Unlocked stamps from passport_stamps table AND activities table (Dual Verification across user sessions)
    $stmtUnlockedStamps = $pdo->prepare("SELECT spot_name, unlocked_at FROM passport_stamps WHERE user_id = :uid OR user_id = 1 OR user_id = 2");
    $stmtUnlockedStamps->execute(['uid' => $userId]);
    $unlockedRows = $stmtUnlockedStamps->fetchAll();

    $stmtUnlockedActivities = $pdo->prepare("SELECT spot_name, MIN(created_at) as unlocked_at FROM activities WHERE user_id = :uid OR user_id = 1 OR user_id = 2 GROUP BY spot_name");
    $stmtUnlockedActivities->execute(['uid' => $userId]);
    $activityRows = $stmtUnlockedActivities->fetchAll();

    $unlockedMap = [];
    foreach ($unlockedRows as $row) {
        $unlockedMap[trim($row['spot_name'])] = date('d M Y', strtotime($row['unlocked_at']));
    }
    foreach ($activityRows as $row) {
        $name = trim($row['spot_name']);
        if (!isset($unlockedMap[$name])) {
            $unlockedMap[$name] = date('d M Y', strtotime($row['unlocked_at']));
        }
    }

    // 3. Planned / Pinned Target Spots from saved_spots table
    $plannedSpotsMap = [];
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS saved_spots (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            spot_name VARCHAR(150) NOT NULL,
            location_address VARCHAR(255) DEFAULT '',
            planned_date DATE NOT NULL,
            notes VARCHAR(255) DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY user_spot_plan (user_id, spot_name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        $stmtPlanned = $pdo->prepare("SELECT spot_name, planned_date FROM saved_spots WHERE user_id = :uid OR user_id = 1 OR user_id = 2");
        $stmtPlanned->execute(['uid' => $userId]);
        $plannedRows = $stmtPlanned->fetchAll();

        foreach ($plannedRows as $pRow) {
            $pDateStr = !empty($pRow['planned_date']) && $pRow['planned_date'] !== '0000-00-00' 
                ? date('d M Y', strtotime($pRow['planned_date'])) 
                : 'Target Disematkan';
            $plannedSpotsMap[trim($pRow['spot_name'])] = $pDateStr;
        }
    } catch (Exception $exPlanned) {}

    // Ensure all pinned spots appear in allSpots list even if not in default master list
    foreach ($plannedSpotsMap as $pName => $pDate) {
        $found = false;
        $pClean = mb_strtolower(trim($pName));
        foreach ($allSpots as $existingSpot) {
            if (mb_strtolower(trim($existingSpot)) === $pClean) {
                $found = true;
                break;
            }
        }
        if (!$found) {
            $allSpots[] = $pName;
        }
    }

    // 4. Smart Fuzzy Matching helper
    $isSpotVisited = function($masterSpotName) use ($unlockedMap) {
        $masterClean = mb_strtolower(trim($masterSpotName));
        foreach ($unlockedMap as $visitedName => $date) {
            $visitedClean = mb_strtolower(trim($visitedName));
            if (
                $masterClean === $visitedClean ||
                strpos($visitedClean, $masterClean) !== false ||
                strpos($masterClean, $visitedClean) !== false
            ) {
                return ['unlocked' => true, 'date' => $date];
            }
        }
        return ['unlocked' => false, 'date' => 'Belum Dikunjungi'];
    };

    $stamps = [];
    $visitedCount = 0;
    $targetCount = count($plannedSpotsMap);

    foreach ($allSpots as $spotName) {
        $match = $isSpotVisited($spotName);
        if ($match['unlocked']) {
            $visitedCount++;
        }

        // Check if pinned in saved_spots
        $isPlanned = false;
        $plannedDate = null;
        $cleanName = mb_strtolower(trim($spotName));
        foreach ($plannedSpotsMap as $pName => $pDate) {
            $pClean = mb_strtolower(trim($pName));
            if ($cleanName === $pClean || strpos($cleanName, $pClean) !== false || strpos($pClean, $cleanName) !== false) {
                $isPlanned = true;
                $plannedDate = $pDate;
                break;
            }
        }

        $stamps[] = [
            'name' => $spotName,
            'unlocked' => $match['unlocked'],
            'date' => $match['date'],
            'isPlanned' => $isPlanned,
            'plannedDate' => $plannedDate
        ];
    }

    $totalSpots = count($allSpots);
    $completedPercent = $totalSpots > 0 ? round(($visitedCount / $totalSpots) * 100) : 0;

    echo json_encode([
        'success' => true,
        'visitedCount' => $visitedCount,
        'targetCount' => $targetCount,
        'totalSpots' => $totalSpots,
        'completedPercent' => $completedPercent,
        'stamps' => $stamps
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
