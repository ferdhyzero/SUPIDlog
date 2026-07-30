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
$tmpPath = $file['tmp_name'];
$mimeType = mime_content_type($tmpPath);

$allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
if (!in_array($mimeType, $allowedTypes)) {
    echo json_encode(['success' => false, 'message' => 'Format file harus JPG, PNG, atau WEBP']);
    exit;
}

$uploadDir = __DIR__ . '/../uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Generate unique WebP filename
$filename = 'img_' . time() . '_' . uniqid() . '.webp';
$targetWebpPath = $uploadDir . $filename;

// Automatic WebP Compression & Resizing Engine
function convertAndCompressToWebp($sourcePath, $targetPath, $mime, $maxWidth = 800, $quality = 80) {
    if (!function_exists('imagewebp')) {
        return false; // GD extension missing fallback
    }

    list($width, $height) = getimagesize($sourcePath);
    if (!$width || !$height) return false;

    // Calculate new dimensions (Max width 800px)
    if ($width > $maxWidth) {
        $newWidth = $maxWidth;
        $newHeight = (int)(($height / $width) * $maxWidth);
    } else {
        $newWidth = $width;
        $newHeight = $height;
    }

    // Create GD image resource based on mime type
    switch ($mime) {
        case 'image/jpeg':
            $image = imagecreatefromjpeg($sourcePath);
            break;
        case 'image/png':
            $image = imagecreatefrompng($sourcePath);
            imagepalettetotruecolor($image);
            imagealphablending($image, true);
            imagesavealpha($image, true);
            break;
        case 'image/webp':
            $image = imagecreatefromwebp($sourcePath);
            break;
        default:
            return false;
    }

    if (!$image) return false;

    // Create resampled canvas
    $canvas = imagecreatetruecolor($newWidth, $newHeight);
    imagecopyresampled($canvas, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

    // Save as WEBP format with 80% quality compression
    $success = imagewebp($canvas, $targetPath, $quality);

    imagedestroy($image);
    imagedestroy($canvas);

    return $success;
}

// Try WebP compression engine first
$converted = convertAndCompressToWebp($tmpPath, $targetWebpPath, $mimeType, 800, 80);

if ($converted) {
    $publicUrl = '/uploads/' . $filename;
    $filesizeKb = round(filesize($targetWebpPath) / 1024, 1);
    echo json_encode([
        'success' => true,
        'message' => "Foto berhasil dikompresi ke WEBP ({$filesizeKb} KB)!",
        'image_url' => $publicUrl
    ]);
} else {
    // Direct Fallback if GD is missing
    $origExtension = pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'jpg';
    $fallbackFilename = 'img_' . time() . '_' . uniqid() . '.' . $origExtension;
    $fallbackPath = $uploadDir . $fallbackFilename;

    if (move_uploaded_file($tmpPath, $fallbackPath)) {
        $publicUrl = '/uploads/' . $fallbackFilename;
        echo json_encode([
            'success' => true,
            'message' => 'Foto berhasil diunggah!',
            'image_url' => $publicUrl
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Gagal menyimpan file ke server']);
    }
}
?>
