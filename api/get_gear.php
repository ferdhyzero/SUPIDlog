<?php
require_once __DIR__ . '/db_config.php';

$userId = (int)($_GET['user_id'] ?? 2);

try {
    // Ensure table structure exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS gear_locker (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        gear_type VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        sessions_count INT DEFAULT 0,
        distance_km DECIMAL(6,2) DEFAULT 0.00,
        condition_status VARCHAR(50) DEFAULT 'Excellent',
        purchase_date VARCHAR(50) DEFAULT 'Jan 2026',
        price VARCHAR(50) DEFAULT 'Rp0',
        reminder VARCHAR(255) DEFAULT 'Wash with fresh water after salt water',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $stmt = $pdo->prepare("SELECT * FROM gear_locker WHERE user_id = :uid ORDER BY id ASC");
    $stmt->execute(['uid' => $userId]);
    $gearItems = $stmt->fetchAll();

    if (empty($gearItems)) {
        // Seed initial gear for user
        $seedGear = [
            ['gear_type' => 'Board', 'name' => "Meng Ke 14' Carbon", 'sessions_count' => 68, 'distance_km' => 530.00, 'condition_status' => 'Excellent ✨', 'purchase_date' => 'Jan 2026', 'price' => 'Rp12.500.000', 'reminder' => 'Wash with fresh water after salt water paddling'],
            ['gear_type' => 'Paddle', 'name' => 'Quickblade Carbon', 'sessions_count' => 68, 'distance_km' => 530.00, 'condition_status' => 'Great 👍', 'purchase_date' => 'Dec 2025', 'price' => 'Rp4.800.000', 'reminder' => 'Check blade edge for nicks'],
            ['gear_type' => 'PFD', 'name' => 'NRS Ninja PFD', 'sessions_count' => 61, 'distance_km' => 470.00, 'condition_status' => 'Good 👌', 'purchase_date' => 'Nov 2025', 'price' => 'Rp2.100.000', 'reminder' => 'Air dry in shade away from direct sunlight'],
            ['gear_type' => 'Leash', 'name' => 'Creatures Coiled 10ft', 'sessions_count' => 68, 'distance_km' => 530.00, 'condition_status' => 'Excellent ✨', 'purchase_date' => 'Jan 2026', 'price' => 'Rp650.000', 'reminder' => 'Inspect velcro cuff and swivel joints regularly'],
        ];

        $stmtIns = $pdo->prepare("INSERT INTO gear_locker (user_id, gear_type, name, sessions_count, distance_km, condition_status, purchase_date, price, reminder) VALUES (:uid, :gtype, :name, :sess, :dist, :cond, :pdate, :price, :rem)");
        foreach ($seedGear as $g) {
            $stmtIns->execute([
                'uid' => $userId,
                'gtype' => $g['gear_type'],
                'name' => $g['name'],
                'sess' => $g['sessions_count'],
                'dist' => $g['distance_km'],
                'cond' => $g['condition_status'],
                'pdate' => $g['purchase_date'],
                'price' => $g['price'],
                'rem' => $g['reminder']
            ]);
        }

        $stmt = $pdo->prepare("SELECT * FROM gear_locker WHERE user_id = :uid ORDER BY id ASC");
        $stmt->execute(['uid' => $userId]);
        $gearItems = $stmt->fetchAll();
    }

    echo json_encode(['success' => true, 'gearItems' => $gearItems]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
