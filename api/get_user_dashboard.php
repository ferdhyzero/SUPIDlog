<?php
require_once __DIR__ . '/db_config.php';

$userId = (int)($_GET['user_id'] ?? 2);

try {
    // 1. Fetch User Profile
    $stmtUser = $pdo->prepare("SELECT id, name, email, role, level, status FROM users WHERE id = :uid LIMIT 1");
    $stmtUser->execute(['uid' => $userId]);
    $user = $stmtUser->fetch();

    if (!$user) {
        $user = [
            'id' => $userId,
            'name' => 'Sapril SUPer',
            'role' => 'user',
            'level' => 'Explorer',
            'status' => 'approved'
        ];
    }

    // 2. Dynamically calculate All-Time Distance & Monthly Distance from activities table
    $stmtDistAll = $pdo->prepare("SELECT COALESCE(SUM(distance_km), 0) as alltime_dist FROM activities WHERE user_id = :uid");
    $stmtDistAll->execute(['uid' => $userId]);
    $alltimeDist = (float)($stmtDistAll->fetch()['alltime_dist'] ?? 0.0);

    $stmtDistMonth = $pdo->prepare("SELECT COALESCE(SUM(distance_km), 0) as month_dist FROM activities WHERE user_id = :uid AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())");
    $stmtDistMonth->execute(['uid' => $userId]);
    $monthDist = (float)($stmtDistMonth->fetch()['month_dist'] ?? 0.0);

    // 3. Dynamically determine Favorite Spot (Spot with most activity logs by user)
    $stmtFavSpot = $pdo->prepare("SELECT spot_name, COUNT(id) as visit_count FROM activities WHERE user_id = :uid GROUP BY spot_name ORDER BY visit_count DESC LIMIT 1");
    $stmtFavSpot->execute(['uid' => $userId]);
    $favSpotRow = $stmtFavSpot->fetch();
    $favoriteSpot = $favSpotRow ? $favSpotRow['spot_name'] : '-';

    // 4. Dynamically calculate Community Rank (Comparing user total distance against all users)
    $stmtRank = $pdo->prepare("SELECT COUNT(*) + 1 as rank_pos FROM (
        SELECT user_id, SUM(distance_km) as total_dist FROM activities GROUP BY user_id
    ) as t WHERE t.total_dist > :my_dist");
    $stmtRank->execute(['my_dist' => $alltimeDist]);
    $communityRank = (int)($stmtRank->fetch()['rank_pos'] ?? 1);

    // Update user payload
    $user['total_distance_km'] = number_format($alltimeDist, 1);
    $user['monthly_distance_km'] = number_format($monthDist, 1);
    $user['favorite_spot'] = $favoriteSpot;
    $user['community_rank'] = $communityRank;

    // 5. Fetch Today's Metrics (Activities created today)
    $stmtToday = $pdo->prepare("SELECT distance_km, calories, duration_formatted FROM activities WHERE user_id = :uid AND DATE(created_at) = CURDATE()");
    $stmtToday->execute(['uid' => $userId]);
    $todayRows = $stmtToday->fetchAll();

    $todayDist = 0.0;
    $todayCal = 0;
    $totalSeconds = 0;

    foreach ($todayRows as $r) {
        $todayDist += (float)$r['distance_km'];
        $todayCal += (int)$r['calories'];

        $durStr = trim($r['duration_formatted']);
        if (preg_match('/(\d+)\s*h\s*(\d+)\s*m/i', $durStr, $m)) {
            $totalSeconds += ((int)$m[1] * 3600) + ((int)$m[2] * 60);
        } else if (preg_match('/(\d+)\s*m/i', $durStr, $m)) {
            $totalSeconds += (int)$m[1] * 60;
        } else {
            $parts = explode(':', $durStr);
            if (count($parts) === 3) {
                $totalSeconds += ((int)$parts[0] * 3600) + ((int)$parts[1] * 60) + (int)$parts[2];
            } else if (count($parts) === 2) {
                $totalSeconds += ((int)$parts[0] * 60) + (int)$parts[1];
            }
        }
    }

    if ($todayDist <= 0 || $totalSeconds <= 0) {
        $todayDist = 0.0;
        $todayCal = 0;
        $todayTimeFormatted = "00:00";
    } else {
        $hrs = (int)floor($totalSeconds / 3600);
        $mins = (int)floor(($totalSeconds % 3600) / 60);
        $secs = $totalSeconds % 60;

        if ($hrs > 0) {
            $todayTimeFormatted = sprintf("%02d:%02d:%02d", $hrs, $mins, $secs);
        } else {
            $todayTimeFormatted = sprintf("%02d:%02d", $mins, $secs);
        }
    }

    // 6. Fetch Recent Activities from MySQL
    $stmtRecent = $pdo->prepare("SELECT id, spot_name as spot, distance_km, duration_formatted, calories, avg_speed, weather, water_condition as type, DATE_FORMAT(created_at, '%d %b %Y') as date FROM activities WHERE user_id = :uid ORDER BY id DESC LIMIT 5");
    $stmtRecent->execute(['uid' => $userId]);
    $recentActivities = $stmtRecent->fetchAll();

    foreach ($recentActivities as &$act) {
        $act['distance'] = number_format((float)$act['distance_km'], 1) . ' km';
    }

    // 7. Fetch Goal Progress (100km Target)
    $targetGoalKm = 100.0;
    $currentGoalKm = fmod($alltimeDist, $targetGoalKm);
    if ($currentGoalKm == 0 && $alltimeDist > 0) {
        $currentGoalKm = 100.0;
    }

    echo json_encode([
        'success' => true,
        'user' => $user,
        'today' => [
            'distance' => number_format($todayDist, 1),
            'calories' => $todayCal,
            'time' => $todayTimeFormatted
        ],
        'goal' => [
            'target' => 100,
            'current' => round($currentGoalKm, 1),
            'percent' => min(100, round(($currentGoalKm / 100) * 100))
        ],
        'recentActivities' => $recentActivities
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
