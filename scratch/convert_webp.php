<?php
$source = 'C:/Users/Lenovo/.gemini/antigravity-ide/brain/02122fa0-5e21-4a45-9947-e0ae6ea4a03d/media__1785542472175.jpg';
$dest = 'c:/xampp1/htdocs/SUPIDlog/public/sup-hero-bg.webp';

$img = imagecreatefromstring(file_get_contents($source));
if ($img) {
    // Save high quality WebP at 85% quality
    imagewebp($img, $dest, 85);
    imagedestroy($img);
    echo "WebP conversion successful. File size: " . filesize($dest) . " bytes\n";
} else {
    echo "Failed to load source image\n";
}
