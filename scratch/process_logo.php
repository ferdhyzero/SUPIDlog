<?php
$sourcePath = 'C:/Users/Lenovo/.gemini/antigravity-ide/brain/02122fa0-5e21-4a45-9947-e0ae6ea4a03d/media__1785382829574.png';
$src = imagecreatefrompng($sourcePath);

$w = imagesx($src);
$h = imagesy($src);
echo "Image dimensions: {$w}x{$h}\n";

// 1. Create transparent canvas with WHITE SUP paddle strokes for dark/blue background
$whiteCanvas = imagecreatetruecolor($w, $h);
imagealphablending($whiteCanvas, false);
imagesavealpha($whiteCanvas, true);
$transparent = imagecolorallocatealpha($whiteCanvas, 0, 0, 0, 127);
imagefill($whiteCanvas, 0, 0, $transparent);

// 2. Create transparent canvas with DARK BLUE SUP paddle strokes for light/white background
$darkCanvas = imagecreatetruecolor($w, $h);
imagealphablending($darkCanvas, false);
imagesavealpha($darkCanvas, true);
imagefill($darkCanvas, 0, 0, $transparent);

for ($x = 0; $x < $w; $x++) {
    for ($y = 0; $y < $h; $y++) {
        $rgb = imagecolorat($src, $x, $y);
        $r = ($rgb >> 16) & 0xFF;
        $g = ($rgb >> 8) & 0xFF;
        $b = $rgb & 0xFF;
        $alpha = ($rgb >> 24) & 0x7F;

        // Calculate lightness (0 = black line stroke, 255 = white background)
        $brightness = ($r + $g + $b) / 3;

        if ($brightness < 240) {
            // Dark line/stroke -> Make WHITE on transparent background
            $opacity = (int)((255 - $brightness) / 2); // invert
            $whiteColor = imagecolorallocatealpha($whiteCanvas, 255, 255, 255, 127 - (int)((255 - $brightness) / 2));
            imagesetpixel($whiteCanvas, $x, $y, $whiteColor);

            // Dark line/stroke -> Make OCEAN BLUE on transparent background
            $blueColor = imagecolorallocatealpha($darkCanvas, 2, 132, 199, 127 - (int)((255 - $brightness) / 2));
            imagesetpixel($darkCanvas, $x, $y, $blueColor);
        }
    }
}

imagepng($whiteCanvas, 'c:/xampp1/htdocs/SUPIDlog/public/sup-paddle-icon-white.png');
imagepng($darkCanvas, 'c:/xampp1/htdocs/SUPIDlog/public/sup-paddle-icon-blue.png');
imagepng($darkCanvas, 'c:/xampp1/htdocs/SUPIDlog/public/sup-paddle-icon.png');
imagepng($whiteCanvas, 'c:/xampp1/htdocs/SUPIDlog/public/logo.png');

echo "Transparent White & Blue SUP Paddle icons generated successfully!\n";
?>
