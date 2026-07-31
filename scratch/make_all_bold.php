<?php
// Generate start-paddle-bold-blue.png (Ocean Blue version of start-paddle-bold.png for light backgrounds)
$src = imagecreatefrompng('c:/xampp1/htdocs/SUPIDlog/public/start-paddle-bold.png');
$w = imagesx($src);
$h = imagesy($src);

$blueImg = imagecreatetruecolor($w, $h);
imagealphablending($blueImg, false);
imagesavealpha($blueImg, true);
$transparent = imagecolorallocatealpha($blueImg, 0, 0, 0, 127);
imagefill($blueImg, 0, 0, $transparent);

for ($x = 0; $x < $w; $x++) {
    for ($y = 0; $y < $h; $y++) {
        $rgb = imagecolorat($src, $x, $y);
        $alpha = ($rgb >> 24) & 0x7F;

        if ($alpha < 120) {
            $blueColor = imagecolorallocatealpha($blueImg, 2, 132, 199, $alpha); // #0284c7 Ocean Blue
            imagesetpixel($blueImg, $x, $y, $blueColor);
        }
    }
}

imagepng($blueImg, 'c:/xampp1/htdocs/SUPIDlog/public/start-paddle-bold-blue.png');

echo "Ocean Blue variant of start-paddle-bold.png generated successfully at public/start-paddle-bold-blue.png!\n";
?>
