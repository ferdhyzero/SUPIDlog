<?php
require_once __DIR__ . '/db_config.php';

try {
    // 1. Fetch all approved users
    $stmtUsers = $pdo->query("SELECT id, name, email, level, role FROM users WHERE status = 'approved' OR status IS NULL OR id IN (1,2)");
    $users = $stmtUsers->fetchAll();

    $leaderboardData = [];

    foreach ($users as $u) {
        $uid = $u['id'];

        // Dynamic All-time Distance
        $stmtAll = $pdo->prepare("SELECT COALESCE(SUM(distance_km), 0) as alltime_dist FROM activities WHERE user_id = :uid");
        $stmtAll->execute(['uid' => $uid]);
        $alltimeDist = (float)($stmtAll->fetch()['alltime_dist'] ?? 0.0);

        // Dynamic Monthly Distance (Resets to 0.0 on 1st of every month)
        $stmtMonth = $pdo->prepare("SELECT COALESCE(SUM(distance_km), 0) as month_dist FROM activities WHERE user_id = :uid AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())");
        $stmtMonth->execute(['uid' => $uid]);
        $monthDist = (float)($stmtMonth->fetch()['month_dist'] ?? 0.0);

        // Dynamic Favorite Spot (Most visited spot in activities)
        $stmtFav = $pdo->prepare("SELECT spot_name, COUNT(id) as cnt FROM activities WHERE user_id = :uid GROUP BY spot_name ORDER BY cnt DESC LIMIT 1");
        $stmtFav->execute(['uid' => $uid]);
        $favRow = $stmtFav->fetch();
        $favoriteSpot = $favRow ? $favRow['spot_name'] : '-';

        // Dynamic Activity Sessions Count
        $stmtSess = $pdo->prepare("SELECT COUNT(*) as sess_cnt FROM activities WHERE user_id = :uid");
        $stmtSess->execute(['uid' => $uid]);
        $sessionsCnt = (int)($stmtSess->fetch()['sess_cnt'] ?? 0);

        // Max speed
        $stmtMaxSpeed = $pdo->prepare("SELECT avg_speed FROM activities WHERE user_id = :uid ORDER BY id DESC LIMIT 1");
        $stmtMaxSpeed->execute(['uid' => $uid]);
        $speedRow = $stmtMaxSpeed->fetch();
        $maxSpeedStr = $speedRow ? $speedRow['avg_speed'] : '5.2 km/h';

        $leaderboardData[] = [
            'id' => $u['id'],
            'name' => $u['name'],
            'email' => $u['email'],
            'level' => $u['level'] ?? 'Explorer',
            'role' => $u['role'],
            'alltime_distance_km' => $alltimeDist,
            'monthly_distance_km' => $monthDist,
            'total_distance_km' => $alltimeDist,
            'total_sessions' => $sessionsCnt,
            'favorite_spot' => $favoriteSpot,
            'max_speed' => $maxSpeedStr
        ];
    }

    // Sort leaderboard by alltime_distance_km DESC
    usort($leaderboardData, function($a, $b) {
        return $b['alltime_distance_km'] <=> $a['alltime_distance_km'];
    });

    $finalLeaderboard = [];
    $rank = 1;

    foreach ($leaderboardData as $item) {
        $item['rank'] = $rank;
        $item['formatted_alltime_dist'] = number_format($item['alltime_distance_km'], 1) . ' km';
        $item['formatted_monthly_dist'] = number_format($item['monthly_distance_km'], 1) . ' km';
        $item['badge'] = $rank === 1 ? '🥇 TOP #1' : ($rank === 2 ? '🥈 RANK #2' : ($rank === 3 ? '🥉 RANK #3' : "#$rank"));
        
        // Update rank in MySQL users table
        $stmtUpdRank = $pdo->prepare("UPDATE users SET community_rank = :rank, favorite_spot = :fav, total_distance_km = :dist WHERE id = :uid");
        $stmtUpdRank->execute(['rank' => $rank, 'fav' => $item['favorite_spot'], 'dist' => $item['alltime_distance_km'], 'uid' => $item['id']]);

        $finalLeaderboard[] = $item;
        $rank++;
    }

    echo json_encode([
        'success' => true,
        'leaderboard' => $finalLeaderboard
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
