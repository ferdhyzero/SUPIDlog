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

$db_host = '127.0.0.1'; // or 'localhost'
$db_user = 'root';
$db_pass = '';
$primary_db = 'myhostzo_sup'; // Production cPanel Database Name
$fallback_db = 'supidlog_db'; // Local XAMPP Database Name

$pdo = null;

// 1. Try Primary Production cPanel Database `myhostzo_sup`
try {
    $pdo = new PDO("mysql:host={$db_host};dbname={$primary_db};charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $ePrimary) {
    // 2. Try Fallback Local Database `supidlog_db`
    try {
        $pdo = new PDO("mysql:host={$db_host};dbname={$fallback_db};charset=utf8mb4", $db_user, $db_pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (PDOException $eFallback) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database Connection Failed: ' . $ePrimary->getMessage(),
            'hint' => "Pastikan database 'myhostzo_sup' atau 'supidlog_db' sudah dibuat dan di-import."
        ]);
        exit();
    }
}
?>
