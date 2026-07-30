<?php
require_once __DIR__ . '/db_config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

// 1. Support JSON Input containing Remote URL (e.g. {"url": "https://...", "category": "avatar"})
$rawInput = file_get_contents('php://input');
$json = json_decode($rawInput, true);

if ($json && !empty($json['url'])) {
    $remoteUrl = trim($json['url']);
    $category = trim($json['category'] ?? 'posts');
    
    $subFolder = 'posts/';
    if ($category === 'avatar' || $category === 'avatars') {
        $subFolder = 'avatars/';
    } elseif ($category === 'spot' || $category === 'spots') {
        $subFolder = 'spots/';
    }

    $baseUploadDir = __DIR__ . '/../uploads/';
    $targetDir = $baseUploadDir . $subFolder;
    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0755, true);
    }

    $prefix = rtrim($subFolder, '/');
    $filename = $prefix . '_' . time() . '_' . uniqid() . '.webp';
    $targetWebpPath = $targetDir . $filename;

    // Fetch remote image content
    $imgData = @file_get_contents($remoteUrl);
    if ($imgData) {
        $tempRemoteFile = tempnam(sys_get_temp_dir(), 'remote_img');
        file_put_contents($tempRemoteFile, $imgData);
        $mimeType = mime_content_type($tempRemoteFile);

        // Convert downloaded remote image to WebP
        list($width, $height) = @getimagesize($tempRemoteFile);
        if ($width && $height && function_exists('imagewebp')) {
            $maxWidth = 800;
            if ($width > $maxWidth) {
                $newWidth = $maxWidth;
                $newHeight = (int)(($height / $width) * $maxWidth);
            } else {
                $newWidth = $width;
                $newHeight = $height;
            }

            switch ($mimeType) {
                case 'image/jpeg': $image = imagecreatefromjpeg($tempRemoteFile); break;
                case 'image/png': $image = imagecreatefrompng($tempRemoteFile); break;
                case 'image/webp': $image = imagecreatefromwebp($tempRemoteFile); break;
                default: $image = null; break;
            }

            if ($image) {
                $canvas = imagecreatetruecolor($newWidth, $newHeight);
                imagecopyresampled($canvas, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
                imagewebp($canvas, $targetWebpPath, 80);
                imagedestroy($image);
                imagedestroy($canvas);
                @unlink($tempRemoteFile);

                $publicUrl = '/uploads/' . $subFolder . $filename;
                echo json_encode([
                    'success' => true,
                    'message' => 'Gambar dari Link berhasil diunduh & dikompresi ke WebP!',
                    'image_url' => $publicUrl
                ]);
                exit;
            }
        }
        @unlink($tempRemoteFile);
    }

    // Direct URL Fallback if fetch fails
    echo json_encode([
        'success' => true,
        'message' => 'Link URL Gambar siap digunakan!',
        'image_url' => $remoteUrl
    ]);
    exit;
}

// 2. Support Multipart Form Data File Upload
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

$category = trim($_POST['category'] ?? 'posts');
$subFolder = 'posts/';
if ($category === 'avatar' || $category === 'avatars') {
    $subFolder = 'avatars/';
} elseif ($category === 'spot' || $category === 'spots') {
    $subFolder = 'spots/';
}

$baseUploadDir = __DIR__ . '/../uploads/';
$targetDir = $baseUploadDir . $subFolder;

if (!is_dir($targetDir)) {
    mkdir($targetDir, 0755, true);
}

$prefix = rtrim($subFolder, '/');
$filename = $prefix . '_' . time() . '_' . uniqid() . '.webp';
$targetWebpPath = $targetDir . $filename;

function convertAndCompressToWebp($sourcePath, $targetPath, $mime, $maxWidth = 800, $quality = 80) {
    if (!function_exists('imagewebp')) {
        return false;
    }

    list($width, $height) = getimagesize($sourcePath);
    if (!$width || !$height) return false;

    if ($width > $maxWidth) {
        $newWidth = $maxWidth;
        $newHeight = (int)(($height / $width) * $maxWidth);
    } else {
        $newWidth = $width;
        $newHeight = $height;
    }

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

    $canvas = imagecreatetruecolor($newWidth, $newHeight);
    imagecopyresampled($canvas, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

    $success = imagewebp($canvas, $targetPath, $quality);

    imagedestroy($image);
    imagedestroy($canvas);

    return $success;
}

$converted = convertAndCompressToWebp($tmpPath, $targetWebpPath, $mimeType, 800, 80);

if ($converted) {
    $publicUrl = '/uploads/' . $subFolder . $filename;
    $filesizeKb = round(filesize($targetWebpPath) / 1024, 1);
    echo json_encode([
        'success' => true,
        'message' => "Foto berhasil dikompresi ke WEBP ({$filesizeKb} KB) dan tersimpan di folder uploads/{$subFolder}!",
        'image_url' => $publicUrl
    ]);
} else {
    $origExtension = pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'jpg';
    $fallbackFilename = $prefix . '_' . time() . '_' . uniqid() . '.' . $origExtension;
    $fallbackPath = $targetDir . $fallbackFilename;

    if (move_uploaded_file($tmpPath, $fallbackPath)) {
        $publicUrl = '/uploads/' . $subFolder . $fallbackFilename;
        echo json_encode([
            'success' => true,
            'message' => "Foto tersimpan di folder uploads/{$subFolder}!",
            'image_url' => $publicUrl
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Gagal menyimpan file ke server']);
    }
}
?>
