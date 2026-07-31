<?php
$sourcePath = 'c:/xampp1/htdocs/SUPIDlog/logo icon app.png';

if (!file_exists($sourcePath)) {
    echo "File logo icon app.png not found!\n";
    exit;
}

$src = imagecreatefrompng($sourcePath);
$w = imagesx($src);
$h = imagesy($src);
echo "Source File 'logo icon app.png' dimensions: {$w}x{$h}\n";

// Create clean transparent white version
$whiteCanvas = imagecreatetruecolor($w, $h);
imagealphablending($whiteCanvas, false);
imagesavealpha($whiteCanvas, true);
$transparent = imagecolorallocatealpha($whiteCanvas, 0, 0, 0, 127);
imagefill($whiteCanvas, 0, 0, $transparent);

// Create clean transparent blue version
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

        $brightness = ($r + $g + $b) / 3;

        // If pixel is not pure white background (line/stroke of logo icon app.png)
        if ($brightness < 240 && $alpha < 100) {
            $whiteColor = imagecolorallocatealpha($whiteCanvas, 255, 255, 255, $alpha);
            imagesetpixel($whiteCanvas, $x, $y, $whiteColor);

            $blueColor = imagecolorallocatealpha($darkCanvas, 2, 132, 199, $alpha);
            imagesetpixel($darkCanvas, $x, $y, $blueColor);
        }
    }
}

imagepng($src, 'c:/xampp1/htdocs/SUPIDlog/public/logo-icon-app.png');
imagepng($whiteCanvas, 'c:/xampp1/htdocs/SUPIDlog/public/logo-icon-app-white.png');
imagepng($darkCanvas, 'c:/xampp1/htdocs/SUPIDlog/public/logo-icon-app-blue.png');
imagepng($src, 'c:/xampp1/htdocs/SUPIDlog/public/logo.png');

echo "Processed logo icon app.png successfully!\n";
?>
