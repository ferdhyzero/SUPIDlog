<?php
require_once __DIR__ . '/db_config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'message' => 'Tidak ada file yang diunggah']);
    exit;
}

$file = $_FILES['image'];
$allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

if (!in_array($file['type'], $allowedTypes)) {
    echo json_encode(['success' => false, 'message' => 'Format file harus JPG, PNG, atau WEBP']);
    exit;
}

$uploadDir = __DIR__ . '/../uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = 'post_' . time() . '_' . uniqid() . '.' . $extension;
$targetPath = $uploadDir . $filename;

if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    $publicUrl = '/uploads/' . $filename;
    echo json_encode([
        'success' => true,
        'message' => 'Foto berhasil diunggah!',
        'image_url' => $publicUrl
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Gagal menyimpan file ke server']);
}
?>
