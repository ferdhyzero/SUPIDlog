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
    // If default lat/lng passed, auto-generate distinct coordinates based on spot count
    if (abs($lat - (-5.1478)) < 0.0001 && abs($lng - 119.4154) < 0.0001) {
        $count = (int)$pdo->query("SELECT COUNT(*) FROM spots")->fetchColumn();
        $offset = ($count + 1) * 0.015;
        $lat = -5.1478 - $offset;
        $lng = 119.4154 + ($offset * 0.8);
    }

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
