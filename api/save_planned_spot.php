<?php
require_once __DIR__ . '/db_config.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

$userId = (int)($data['user_id'] ?? 2);
$spotName = trim($data['spot_name'] ?? 'Pantai Losari');
$locationAddress = trim($data['location_address'] ?? '');
$plannedDate = trim($data['planned_date'] ?? date('Y-m-d', strtotime('+7 days')));
$notes = trim($data['notes'] ?? 'Rencana Paddle Trip Custom');

try {
    // 1. Ensure table structure exists
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

    // 2. Ensure location_address column exists if table was created previously without it
    try {
        $pdo->exec("ALTER TABLE saved_spots ADD COLUMN location_address VARCHAR(255) DEFAULT ''");
    } catch (Exception $exColumn) {
        // Column already exists, safe to continue
    }

    // 3. Insert or Update Planned Spot using VALUES() MySQL syntax to prevent PDO parameter count mismatch
    $stmt = $pdo->prepare("INSERT INTO saved_spots (user_id, spot_name, location_address, planned_date, notes) 
                           VALUES (:uid, :spot, :addr, :pdate, :notes) 
                           ON DUPLICATE KEY UPDATE planned_date = VALUES(planned_date), location_address = VALUES(location_address), notes = VALUES(notes)");
    $stmt->execute([
        'uid' => $userId,
        'spot' => $spotName,
        'addr' => $locationAddress,
        'pdate' => $plannedDate,
        'notes' => $notes
    ]);

    // 4. Ensure spot exists in master spots table
    $stmtCheck = $pdo->prepare("SELECT id FROM spots WHERE LOWER(name) = LOWER(:spot) LIMIT 1");
    $stmtCheck->execute(['spot' => $spotName]);
    if (!$stmtCheck->fetch()) {
        $stmtInsertSpot = $pdo->prepare("INSERT INTO spots (name, category, stars, season, difficulty, water, visited_count) VALUES (:spot, 'Custom Spot', 5, 'All Year', 'Easy', 'Clear', 1)");
        $stmtInsertSpot->execute(['spot' => $spotName]);
    }

    echo json_encode([
        'success' => true,
        'message' => "Lokasi '$spotName' berhasil disematkan untuk tanggal $plannedDate!"
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
