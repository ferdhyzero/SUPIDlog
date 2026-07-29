<?php
require_once __DIR__ . '/db_config.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

$userId = (int)($data['user_id'] ?? 1);
$spotName = trim($data['spotName'] ?? 'Samalona');
$distance = (float)($data['rawDistance'] ?? 8.4);
$duration = trim($data['timeFormatted'] ?? '1h 55m');
$calories = (int)($data['calories'] ?? 693);
$avgSpeed = trim($data['avgSpeed'] ?? '4.8 km/h');
$strokes = (int)($data['strokes'] ?? 3890);
$weather = trim($data['weather'] ?? '☀ Sunny');
$water = trim($data['water'] ?? 'Flat Water');
$wind = trim($data['wind'] ?? '6 knot');
$notes = trim($data['notes'] ?? '');

try {
    // 1. Insert into activities table
    $stmt = $pdo->prepare("INSERT INTO activities (user_id, spot_name, distance_km, duration_formatted, calories, avg_speed, strokes, weather, water_condition, wind, notes) VALUES (:uid, :spot, :dist, :dur, :cal, :spd, :str, :wea, :wat, :wnd, :notes)");
    $stmt->execute([
        'uid' => $userId,
        'spot' => $spotName,
        'dist' => $distance,
        'dur' => $duration,
        'cal' => $calories,
        'spd' => $avgSpeed,
        'str' => $strokes,
        'wea' => $weather,
        'wat' => $water,
        'wnd' => $wind,
        'notes' => $notes
    ]);

    // 2. Unlock stamp in passport_stamps table
    $stmtStamp = $pdo->prepare("INSERT INTO passport_stamps (user_id, spot_name) VALUES (:uid, :spot) ON DUPLICATE KEY UPDATE unlocked_at = CURRENT_TIMESTAMP");
    $stmtStamp->execute(['uid' => $userId, 'spot' => $spotName]);

    // 3. Update user total distance & sessions
    $stmtUser = $pdo->prepare("UPDATE users SET total_distance_km = total_distance_km + :dist, total_sessions = total_sessions + 1 WHERE id = :uid");
    $stmtUser->execute(['dist' => $distance, 'uid' => $userId]);

    echo json_encode([
        'success' => true,
        'message' => 'Sesi paddle berhasil disimpan ke Database MySQL server!',
        'unlockedSpot' => $spotName
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
