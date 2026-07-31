<?php
// Generate a 256x256 Crisp, Bold, Solid White Stand Up Paddleboard & Paddle icon for the Center FAB Button
$w = 256;
$h = 256;

$img = imagecreatetruecolor($w, $h);
imagealphablending($img, false);
imagesavealpha($img, true);
$transparent = imagecolorallocatealpha($img, 0, 0, 0, 127);
imagefill($img, 0, 0, $transparent);

$white = imagecolorallocatealpha($img, 255, 255, 255, 0);

// Draw Stand Up Paddleboard (Filled Solid White Ellipse Shape)
imagefilledellipse($img, 96, 128, 48, 180, $white);

// Draw Paddle Shaft (Vertical Line)
imagefilledrectangle($img, 156, 24, 166, 210, $white);

// Draw Paddle T-Grip (Top Horizontal Bar)
imagefilledrectangle($img, 146, 24, 176, 34, $white);

// Draw Paddle Blade (Bottom Teardrop Shape)
imagefilledellipse($img, 161, 200, 36, 50, $white);

imagepng($img, 'c:/xampp1/htdocs/SUPIDlog/public/start-paddle-bold.png');

echo "Crisp, bold, solid white SUP Paddleboard & Paddle icon generated successfully at public/start-paddle-bold.png!\n";
?>
