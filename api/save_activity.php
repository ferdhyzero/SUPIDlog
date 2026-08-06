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

$safetyScore = (int)($data['safetyScore'] ?? 100);
$safetyItemsJson = is_array($data['safetyItems'] ?? null) ? json_encode($data['safetyItems']) : (string)($data['safetyItemsJson'] ?? '');

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
    try {
        $pdo->exec("ALTER TABLE activities ADD COLUMN safety_score INT DEFAULT 100 AFTER water_condition");
    } catch (Exception $ex6) {}
    try {
        $pdo->exec("ALTER TABLE activities ADD COLUMN safety_items_json TEXT DEFAULT NULL AFTER safety_score");
    } catch (Exception $ex7) {}

    // 1. Insert into activities table
    $stmt = $pdo->prepare("INSERT INTO activities (user_id, spot_name, distance_km, duration_formatted, calories, avg_speed, max_speed_kmh, weather, water_condition, safety_score, safety_items_json, route_json, shared_to_community, local_tips) VALUES (:uid, :spot, :dist, :dur, :cal, :spd, :mspd, :wea, :wat, :sscore, :sjson, :rjson, :share, :tips)");
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
        'sscore' => $safetyScore,
        'sjson' => $safetyItemsJson,
        'rjson' => $routeJson,
        'share' => $sharedToCommunity,
        'tips' => $localTips
    ]);

    // 2. Unlock stamp in passport_stamps table & auto-register new spot if needed
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS passport_stamps (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            spot_name VARCHAR(191) NOT NULL,
            unlocked TINYINT(1) DEFAULT 1,
            unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY user_spot (user_id, spot_name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        $stmtStamp = $pdo->prepare("INSERT INTO passport_stamps (user_id, spot_name, unlocked) VALUES (:uid, :spot, 1) ON DUPLICATE KEY UPDATE unlocked_at = CURRENT_TIMESTAMP");
        $stmtStamp->execute(['uid' => $userId, 'spot' => $spotName]);

        // Auto-register spot to master spots table if new
        $stmtCheckMaster = $pdo->prepare("SELECT id FROM spots WHERE name = :name LIMIT 1");
        $stmtCheckMaster->execute(['name' => $spotName]);
        if (!$stmtCheckMaster->fetch()) {
            $stmtAddSpot = $pdo->prepare("INSERT INTO spots (name, category, description) VALUES (:name, 'Coastal / SUP', 'Spot dayung baru yang dijelajahi pengguna')");
            $stmtAddSpot->execute(['name' => $spotName]);
        }
    } catch (Exception $exStamp) {}

    // 3. Update user total distance safely handling NULL values
    $stmtUser = $pdo->prepare("UPDATE users SET total_distance_km = COALESCE(total_distance_km, 0) + :dist WHERE id = :uid");
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
