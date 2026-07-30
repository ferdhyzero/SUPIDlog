<?php
require_once __DIR__ . '/db_config.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

$userId = (int)($data['user_id'] ?? 1);
$spotName = trim($data['spotName'] ?? 'Samalona');
$distance = (float)($data['rawDistance'] ?? $data['distance_km'] ?? 8.4);
$duration = trim($data['timeFormatted'] ?? $data['duration_formatted'] ?? '1h 55m');
$calories = (int)($data['calories'] ?? 0);
$avgSpeed = trim($data['avgSpeed'] ?? $data['avg_speed'] ?? '4.8 km/h');
$maxSpeed = (float)($data['max_speed_kmh'] ?? 0.0);
$weather = trim($data['weather'] ?? '☀ Sunny 30°C');
$water = trim($data['water'] ?? 'Flat Water');
$routeJson = is_array($data['route'] ?? null) ? json_encode($data['route']) : (string)($data['route_json'] ?? '');
$sharedToCommunity = (int)($data['shared_to_community'] ?? 0);
$localTips = trim($data['local_tips'] ?? '');

try {
    // Migration guards
    try {
        $pdo->exec("ALTER TABLE activities ADD COLUMN route_json LONGTEXT DEFAULT NULL AFTER gps_coords");
    } catch (Exception $ex1) {}
    try {
        $pdo->exec("ALTER TABLE activities ADD COLUMN max_speed_kmh DECIMAL(5,2) DEFAULT '0.00' AFTER avg_speed");
    } catch (Exception $ex2) {}
    try {
        $pdo->exec("ALTER TABLE activities ADD COLUMN shared_to_community TINYINT(1) DEFAULT 0 AFTER route_json");
    } catch (Exception $ex3) {}
    try {
        $pdo->exec("ALTER TABLE activities ADD COLUMN local_tips TEXT DEFAULT NULL AFTER shared_to_community");
    } catch (Exception $ex4) {}
    try {
        $pdo->exec("ALTER TABLE community_posts ADD COLUMN local_tips TEXT DEFAULT NULL AFTER image_url");
    } catch (Exception $ex5) {}

    // 1. Insert into activities table
    $stmt = $pdo->prepare("INSERT INTO activities (user_id, spot_name, distance_km, duration_formatted, calories, avg_speed, max_speed_kmh, weather, water_condition, route_json, shared_to_community, local_tips) VALUES (:uid, :spot, :dist, :dur, :cal, :spd, :mspd, :wea, :wat, :rjson, :share, :tips)");
    $stmt->execute([
        'uid' => $userId,
        'spot' => $spotName,
        'dist' => $distance,
        'dur' => $duration,
        'cal' => $calories,
        'spd' => $avgSpeed,
        'mspd' => $maxSpeed,
        'wea' => $weather,
        'wat' => $water,
        'rjson' => $routeJson,
        'share' => $sharedToCommunity,
        'tips' => $localTips
    ]);

    // 2. Unlock stamp in passport_stamps table
    try {
        $stmtStamp = $pdo->prepare("INSERT INTO passport_stamps (user_id, spot_name, unlocked) VALUES (:uid, :spot, 1)");
        $stmtStamp->execute(['uid' => $userId, 'spot' => $spotName]);
    } catch (Exception $exStamp) {}

    // 3. Update user total distance
    $stmtUser = $pdo->prepare("UPDATE users SET total_distance_km = total_distance_km + :dist WHERE id = :uid");
    $stmtUser->execute(['dist' => $distance, 'uid' => $userId]);

    // 4. Auto-create post in community_posts if 1-click share is enabled
    if ($sharedToCommunity === 1) {
        $stmtUName = $pdo->prepare("SELECT name FROM users WHERE id = :uid LIMIT 1");
        $stmtUName->execute(['uid' => $userId]);
        $userName = $stmtUName->fetch()['name'] ?? 'Paddler';

        $title = "Sesi Dayung di $spotName (" . number_format($distance, 1) . " km)";
        $stmtPost = $pdo->prepare("INSERT INTO community_posts (user_id, user_name, spot_name, title, distance_km, local_tips) VALUES (:uid, :uname, :spot, :title, :dist, :tips)");
        $stmtPost->execute([
            'uid' => $userId,
            'uname' => $userName,
            'spot' => $spotName,
            'title' => $title,
            'dist' => number_format($distance, 1) . ' km',
            'tips' => $localTips
        ]);
    }

    echo json_encode([
        'success' => true,
        'message' => 'Sesi paddle berhasil disimpan ke Database MySQL cPanel!',
        'unlockedSpot' => $spotName
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
