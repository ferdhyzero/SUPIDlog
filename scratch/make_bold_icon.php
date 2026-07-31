<?php
$sourcePath = 'c:/xampp1/htdocs/SUPIDlog/logo icon app.png';
$src = imagecreatefrompng($sourcePath);

$w = imagesx($src);
$h = imagesy($src);

// 1. Copy original PADDLE ID logo back to public/logo.png
copy('c:/xampp1/htdocs/SUPIDlog/src/assets/logo.png', 'c:/xampp1/htdocs/SUPIDlog/public/logo.png');

// 2. Generate BOLD THICK HIGH CONTRAST White Icon for Start Paddling FAB Button
$boldWhite = imagecreatetruecolor($w, $h);
imagealphablending($boldWhite, false);
imagesavealpha($boldWhite, true);
$transparent = imagecolorallocatealpha($boldWhite, 0, 0, 0, 127);
imagefill($boldWhite, 0, 0, $transparent);

// 3. Generate BOLD THICK HIGH CONTRAST Blue Icon for Light Cards
$boldBlue = imagecreatetruecolor($w, $h);
imagealphablending($boldBlue, false);
imagesavealpha($boldBlue, true);
imagefill($boldBlue, 0, 0, $transparent);

for ($x = 0; $x < $w; $x++) {
    for ($y = 0; $y < $h; $y++) {
        $rgb = imagecolorat($src, $x, $y);
        $r = ($rgb >> 16) & 0xFF;
        $g = ($rgb >> 8) & 0xFF;
        $b = $rgb & 0xFF;
        $alpha = ($rgb >> 24) & 0x7F;

        $brightness = ($r + $g + $b) / 3;

        // If stroke line
        if ($brightness < 240 && $alpha < 100) {
            // Apply dilation (thickening lines by 3px radius for maximum visibility & bold contrast)
            for ($dx = -3; $dx <= 3; $dx++) {
                for ($dy = -3; $dy <= 3; $dy++) {
                    $nx = $x + $dx;
                    $ny = $y + $dy;
                    if ($nx >= 0 && $nx < $w && $ny >= 0 && $ny < $h) {
                        $wCol = imagecolorallocatealpha($boldWhite, 255, 255, 255, 0); // Solid bold white
                        $bCol = imagecolorallocatealpha($boldBlue, 2, 132, 199, 0);   // Solid bold ocean blue
                        imagesetpixel($boldWhite, $nx, $ny, $wCol);
                        imagesetpixel($boldBlue, $nx, $ny, $bCol);
                    }
                }
            }
        }
    }
}

imagepng($boldWhite, 'c:/xampp1/htdocs/SUPIDlog/public/logo-icon-app-white.png');
imagepng($boldBlue, 'c:/xampp1/htdocs/SUPIDlog/public/logo-icon-app-blue.png');

echo "Original PADDLE ID logo restored to public/logo.png!\n";
echo "Bold, thick, high contrast SUP Paddle icons generated!\n";
?>
