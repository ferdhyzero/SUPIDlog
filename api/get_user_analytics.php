<?php
require_once __DIR__ . '/db_config.php';

$userId = (int)($_GET['user_id'] ?? 1);
$period = trim($_GET['period'] ?? 'monthly'); // 'weekly', 'monthly', 'yearly'

try {
    // 1. Calculate time boundaries based on period
    $dateCondition = "1=1";
    if ($period === 'weekly') {
        $dateCondition = "created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
    } elseif ($period === 'monthly') {
        $dateCondition = "MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())";
    } elseif ($period === 'yearly') {
        $dateCondition = "YEAR(created_at) = YEAR(CURRENT_DATE())";
    }

    // 2. Fetch Aggregated Statistics
    $stmtStats = $pdo->prepare("
        SELECT 
            COUNT(*) as total_sessions,
            COALESCE(SUM(distance_km), 0) as total_distance,
            COALESCE(MAX(max_speed_kmh), 0) as top_speed,
            COALESCE(SUM(calories), 0) as total_calories
        FROM activities 
        WHERE user_id = :uid AND $dateCondition
    ");
    $stmtStats->execute(['uid' => $userId]);
    $stats = $stmtStats->fetch();

    // 3. Fetch Recent Activities for this timeframe
    $stmtList = $pdo->prepare("
        SELECT id, spot_name, distance_km, duration_formatted, calories, avg_speed, max_speed_kmh, weather, water_condition, local_tips, DATE_FORMAT(created_at, '%d %b %Y %H:%i') as formatted_date 
        FROM activities 
        WHERE user_id = :uid AND $dateCondition
        ORDER BY id DESC LIMIT 20
    ");
    $stmtList->execute(['uid' => $userId]);
    $activities = $stmtList->fetchAll();

    echo json_encode([
        'success' => true,
        'period' => $period,
        'stats' => [
            'total_sessions' => (int)$stats['total_sessions'],
            'total_distance_km' => number_format((float)$stats['total_distance'], 2),
            'top_speed_kmh' => number_format((float)$stats['top_speed'], 1),
            'total_calories' => (int)$stats['total_calories']
        ],
        'activities' => $activities
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
