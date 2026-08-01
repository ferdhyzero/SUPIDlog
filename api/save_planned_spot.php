<?php
require_once __DIR__ . '/db_config.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

$userId = (int)($data['user_id'] ?? 2);
$spotName = trim($data['spot_name'] ?? 'Pantai Losari');
$locationAddress = trim($data['location_address'] ?? '');
$plannedDate = trim($data['planned_date'] ?? date('Y-m-d', strtotime('+7 days')));
$notes = trim($data['notes'] ?? 'Rencana Paddle Trip Custom');
$lat = isset($data['lat']) ? (float)$data['lat'] : null;
$lng = isset($data['lng']) ? (float)$data['lng'] : null;

try {
    // 1. Ensure table structure exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS saved_spots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        spot_name VARCHAR(150) NOT NULL,
        location_address VARCHAR(255) DEFAULT '',
        lat DECIMAL(10, 7) DEFAULT NULL,
        lng DECIMAL(10, 7) DEFAULT NULL,
        planned_date DATE NOT NULL,
        notes VARCHAR(255) DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY user_spot_plan (user_id, spot_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // 2. Ensure lat and lng columns exist if table was created previously without them
    try {
        $pdo->exec("ALTER TABLE saved_spots ADD COLUMN location_address VARCHAR(255) DEFAULT ''");
    } catch (Exception $ex) {}

    try {
        $pdo->exec("ALTER TABLE saved_spots ADD COLUMN lat DECIMAL(10, 7) DEFAULT NULL");
    } catch (Exception $ex) {}

    try {
        $pdo->exec("ALTER TABLE saved_spots ADD COLUMN lng DECIMAL(10, 7) DEFAULT NULL");
    } catch (Exception $ex) {}

    // 3. Insert or Update Planned Spot with Lat/Lng
    $stmt = $pdo->prepare("INSERT INTO saved_spots (user_id, spot_name, location_address, lat, lng, planned_date, notes) 
                           VALUES (:uid, :spot, :addr, :lat, :lng, :pdate, :notes) 
                           ON DUPLICATE KEY UPDATE 
                             planned_date = VALUES(planned_date), 
                             location_address = VALUES(location_address), 
                             notes = VALUES(notes),
                             lat = COALESCE(VALUES(lat), lat),
                             lng = COALESCE(VALUES(lng), lng)");
    $stmt->execute([
        'uid' => $userId,
        'spot' => $spotName,
        'addr' => $locationAddress,
        'lat' => $lat,
        'lng' => $lng,
        'pdate' => $plannedDate,
        'notes' => $notes
    ]);

    // 4. Ensure spot exists in master spots table with exact coordinates
    $stmtCheck = $pdo->prepare("SELECT id FROM spots WHERE LOWER(name) = LOWER(:spot) LIMIT 1");
    $stmtCheck->execute(['spot' => $spotName]);
    $existingSpot = $stmtCheck->fetch();

    if (!$existingSpot) {
        $stmtInsertSpot = $pdo->prepare("INSERT INTO spots (name, category, lat, lng, stars, season, difficulty, water, visited_count) VALUES (:spot, 'Custom Spot', :lat, :lng, 5, 'All Year', 'Easy', 'Clear', 1)");
        $stmtInsertSpot->execute([
            'spot' => $spotName,
            'lat' => $lat ?? -5.147812,
            'lng' => $lng ?? 119.415421
        ]);
    } else if ($lat && $lng) {
        // Update lat/lng in spots if missing
        $stmtUpdSpot = $pdo->prepare("UPDATE spots SET lat = :lat, lng = :lng WHERE id = :id AND (lat IS NULL OR lat = 0)");
        $stmtUpdSpot->execute(['lat' => $lat, 'lng' => $lng, 'id' => $existingSpot['id']]);
    }

    echo json_encode([
        'success' => true,
        'message' => "Lokasi '$spotName' berhasil disematkan untuk tanggal $plannedDate!"
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
