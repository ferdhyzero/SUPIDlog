<?php
require_once __DIR__ . '/db_config.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

$name = trim($data['name'] ?? '');
$category = trim($data['category'] ?? 'Ocean');
$difficulty = trim($data['difficulty'] ?? 'Easy');
$water = trim($data['water'] ?? 'Clear');
$lat = (float)($data['lat'] ?? -5.1478);
$lng = (float)($data['lng'] ?? 119.4154);

if (!$name) {
    echo json_encode(['success' => false, 'message' => 'Nama spot tidak boleh kosong!']);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO spots (name, category, difficulty, water, lat, lng, stars, visited_count) VALUES (:name, :cat, :diff, :water, :lat, :lng, 5, 1)");
    $stmt->execute([
        'name' => $name,
        'cat' => $category,
        'diff' => $difficulty,
        'water' => $water,
        'lat' => $lat,
        'lng' => $lng
    ]);

    $newId = $pdo->lastInsertId();

    echo json_encode([
        'success' => true,
        'message' => "Spot '$name' dengan lokasi GPS ($lat, $lng) berhasil ditambahkan!",
        'spot' => [
            'id' => $newId,
            'name' => $name,
            'category' => $category,
            'difficulty' => $difficulty,
            'water' => $water,
            'lat' => $lat,
            'lng' => $lng,
            'stars' => 5,
            'visitedCount' => 1
        ]
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
