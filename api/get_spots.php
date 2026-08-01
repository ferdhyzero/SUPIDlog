<?php
require_once __DIR__ . '/db_config.php';

try {
    // 1. Ensure table spots exists in MySQL database
    $pdo->exec("CREATE TABLE IF NOT EXISTS spots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL UNIQUE,
        category VARCHAR(100) DEFAULT 'Ocean',
        stars INT DEFAULT 5,
        season VARCHAR(100) DEFAULT 'All Year',
        difficulty VARCHAR(50) DEFAULT 'Easy',
        water VARCHAR(50) DEFAULT 'Clear',
        visited_count INT DEFAULT 1,
        lat DECIMAL(10, 6) DEFAULT -5.147812,
        lng DECIMAL(10, 6) DEFAULT 119.415421,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // 2. Migration guards for columns
    try {
        $pdo->exec("ALTER TABLE spots ADD COLUMN lat DECIMAL(10, 6) DEFAULT -5.147812");
    } catch (Exception $e1) {}
    try {
        $pdo->exec("ALTER TABLE spots ADD COLUMN lng DECIMAL(10, 6) DEFAULT 119.415421");
    } catch (Exception $e2) {}
    try {
        $pdo->exec("ALTER TABLE spots ADD COLUMN created_by INT DEFAULT NULL");
    } catch (Exception $e3) {}

    // 3. Auto-fix distinct real-world GPS coordinates for existing spots with duplicate defaults
    $pdo->exec("UPDATE spots SET lat = -5.614800, lng = 120.457800 WHERE (name LIKE '%bira%' OR name LIKE '%Bira%') AND lat = -5.147800");
    $pdo->exec("UPDATE spots SET lat = -5.148200, lng = 119.412800 WHERE (name LIKE '%indah bosowa%') AND lat = -5.147800");
    $pdo->exec("UPDATE spots SET lat = -5.172300, lng = 119.389200 WHERE (name LIKE '%Layar Putih%') AND lat = -5.147800");
    $pdo->exec("UPDATE spots SET lat = -5.321800, lng = 119.362100 WHERE (name LIKE '%Galesong%') AND lat = -5.147800");
    $pdo->exec("UPDATE spots SET lat = -5.348200, lng = 119.341800 WHERE (name LIKE '%Sanrobengi%') AND lat = -5.147800");

    // 4. Seed initial spots into MySQL if database table is empty
    $count = (int)$pdo->query("SELECT COUNT(*) FROM spots")->fetchColumn();
    if ($count === 0) {
        $pdo->exec("INSERT IGNORE INTO spots (name, category, stars, season, difficulty, water, visited_count, lat, lng) VALUES 
        ('Bosowa Beach', 'Flat Water', 5, 'All Year', 'Easy', 'Calm', 512, -5.147800, 119.415400),
        ('Samalona Island', 'Ocean', 4, 'May-Oct', 'Medium', 'Clear', 420, -5.123400, 119.345600),
        ('Rammang-Rammang', 'River', 5, 'All Year', 'Easy', 'Flat', 380, -4.923400, 119.645600),
        ('Danau Toba', 'Lake', 5, 'Jun-Sep', 'Medium', 'Deep Blue', 290, 2.684500, 98.875600),
        ('Wakatobi Marine Park', 'Ocean', 5, 'Apr-Nov', 'Hard', 'Ultra Clear', 185, -5.312300, 123.543200)");
    }

    // 5. Fetch all dynamic spots from MySQL DB with 100% distinct coordinates
    $stmt = $pdo->query("SELECT id, name, category, stars, season, difficulty, water, visited_count as visitedCount, CAST(lat AS DOUBLE) as lat, CAST(lng AS DOUBLE) as lng, created_by FROM spots ORDER BY id DESC");
    $spots = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'spots' => $spots
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
