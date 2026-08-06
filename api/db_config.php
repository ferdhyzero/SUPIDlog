<?php
// ========================================================
// Database Connection Config for SUPID Log (MySQL PDO)
// ========================================================

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$db_host = 'localhost';

// cPanel Production Credentials vs Local XAMPP Fallback
$cpanel_user = 'myhostzo_sup'; // Username MySQL cPanel
$cpanel_pass = 'Sup!D2026@#$'; // Password MySQL cPanel
$primary_db  = 'myhostzo_sup';

$local_user   = 'root';
$local_pass   = '';
$fallback_db  = 'supidlog_db';

$pdo = null;

// 1. Try Production cPanel Credentials
try {
    $pdo = new PDO("mysql:host={$db_host};dbname={$primary_db};charset=utf8mb4", $cpanel_user, $cpanel_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $eCpanel) {
    // 2. Try Local XAMPP Credentials
    try {
        $pdo = new PDO("mysql:host={$db_host};dbname={$fallback_db};charset=utf8mb4", $local_user, $local_pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (PDOException $eLocal) {
        // Return clear JSON error message instead of 500 server crash
        echo json_encode([
            'success' => false,
            'message' => 'Gagal Konek MySQL (cPanel: ' . $eCpanel->getMessage() . ' | Local: ' . $eLocal->getMessage() . ')',
            'hint' => 'Pastikan database MySQL supidlog_db / myhostzo_sup di XAMPP / cPanel sudah dibuat.'
        ]);
        exit();
    }
}
?>
