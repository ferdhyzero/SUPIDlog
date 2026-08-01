<?php
require_once __DIR__ . '/db_config.php';

$userId = (int)($_GET['user_id'] ?? 2);

try {
    // Ensure table structure exists
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

    // Ensure lat & lng columns exist
    try {
        $pdo->exec("ALTER TABLE saved_spots ADD COLUMN lat DECIMAL(10, 7) DEFAULT NULL");
    } catch (Exception $ex) {}
    try {
        $pdo->exec("ALTER TABLE saved_spots ADD COLUMN lng DECIMAL(10, 7) DEFAULT NULL");
    } catch (Exception $ex) {}

    $stmt = $pdo->prepare("SELECT id, spot_name, location_address, CAST(lat AS DOUBLE) as lat, CAST(lng AS DOUBLE) as lng, planned_date, notes, DATE_FORMAT(planned_date, '%d %b %Y') as formatted_date, DATEDIFF(planned_date, CURDATE()) as days_left FROM saved_spots WHERE user_id = :uid ORDER BY planned_date ASC");
    $stmt->execute(['uid' => $userId]);
    $savedSpots = $stmt->fetchAll();

    echo json_encode(['success' => true, 'savedSpots' => $savedSpots]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
