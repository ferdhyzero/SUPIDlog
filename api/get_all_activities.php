<?php
require_once __DIR__ . '/db_config.php';

$limit = (int)($_GET['limit'] ?? 30);
$offset = (int)($_GET['offset'] ?? 0);

try {
    // Migration guard: ensure kudos_count column exists
    try {
        $pdo->exec("ALTER TABLE activities ADD COLUMN kudos_count INT DEFAULT 0");
    } catch (Exception $ex) {}

    // Fetch all activities from all users, joined with user info
    $stmt = $pdo->prepare("
        SELECT 
            a.id,
            a.user_id,
            a.spot_name,
            a.distance_km,
            a.duration_formatted,
            a.calories,
            a.avg_speed,
            a.weather,
            a.water_condition,
            a.route_json,
            a.kudos_count,
            a.created_at,
            u.name AS user_name,
            u.avatar_url
        FROM activities a
        JOIN users u ON a.user_id = u.id
        ORDER BY a.created_at DESC
        LIMIT :lim OFFSET :off
    ");
    $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':off', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format timestamps as relative time
    $now = time();
    foreach ($activities as &$act) {
        $ts = strtotime($act['created_at']);
        $diff = $now - $ts;

        if ($diff < 3600) {
            $act['time_ago'] = floor($diff / 60) . ' menit lalu';
        } elseif ($diff < 86400) {
            $act['time_ago'] = floor($diff / 3600) . ' jam lalu';
        } elseif ($diff < 172800) {
            $act['time_ago'] = 'Kemarin';
        } else {
            $act['time_ago'] = floor($diff / 86400) . ' hari lalu';
        }

        // Format created_at as readable date+time
        $act['formatted_date'] = date('d M Y · H:i', $ts);
        $act['kudos_count'] = (int)$act['kudos_count'];
    }

    echo json_encode([
        'success' => true,
        'activities' => $activities,
        'total' => count($activities)
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
