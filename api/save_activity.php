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
$weather = trim($data['weather'] ?? '☀ Sunny 30°C');
$water = trim($data['water'] ?? 'Flat Water');
$routeJson = is_array($data['route'] ?? null) ? json_encode($data['route']) : (string)($data['route_json'] ?? '');

try {
    // Ensure route_json column exists
    try {
        $pdo->exec("ALTER TABLE activities ADD COLUMN route_json LONGTEXT DEFAULT NULL AFTER gps_coords");
    } catch (Exception $exRoute) {}

    // 1. Insert into activities table
    $stmt = $pdo->prepare("INSERT INTO activities (user_id, spot_name, distance_km, duration_formatted, calories, avg_speed, weather, water_condition, route_json) VALUES (:uid, :spot, :dist, :dur, :cal, :spd, :wea, :wat, :rjson)");
    $stmt->execute([
        'uid' => $userId,
        'spot' => $spotName,
        'dist' => $distance,
        'dur' => $duration,
        'cal' => $calories,
        'spd' => $avgSpeed,
        'wea' => $weather,
        'wat' => $water,
        'rjson' => $routeJson
    ]);

    // 2. Unlock stamp in passport_stamps table
    try {
        $stmtStamp = $pdo->prepare("INSERT INTO passport_stamps (user_id, spot_name, unlocked) VALUES (:uid, :spot, 1)");
        $stmtStamp->execute(['uid' => $userId, 'spot' => $spotName]);
    } catch (Exception $exStamp) {}

    // 3. Update user total distance
    $stmtUser = $pdo->prepare("UPDATE users SET total_distance_km = total_distance_km + :dist WHERE id = :uid");
    $stmtUser->execute(['dist' => $distance, 'uid' => $userId]);

    echo json_encode([
        'success' => true,
        'message' => 'Sesi paddle berhasil disimpan ke Database MySQL cPanel!',
        'unlockedSpot' => $spotName
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
