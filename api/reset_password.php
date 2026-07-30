<?php
require_once __DIR__ . '/db_config.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

$email = trim($data['email'] ?? '');
$newPassword = trim($data['new_password'] ?? '');

if (empty($email) || empty($newPassword)) {
    echo json_encode(['success' => false, 'message' => 'Email dan Password Baru wajib diisi!']);
    exit();
}

try {
    // 1. Check if user exists
    $stmt = $pdo->prepare("SELECT id, name FROM users WHERE email = :email LIMIT 1");
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();

    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'Email tidak ditemukan di sistem database SUPID!']);
        exit();
    }

    // 2. Update password hash & plain_password
    $hash = password_hash($newPassword, PASSWORD_BCRYPT);
    $stmtUpd = $pdo->prepare("UPDATE users SET password_hash = :hash, plain_password = :plain WHERE id = :uid");
    $stmtUpd->execute(['hash' => $hash, 'plain' => $newPassword, 'uid' => $user['id']]);

    echo json_encode([
        'success' => true,
        'message' => "🔑 Password akun '" . $user['name'] . "' ($email) BERHASIL DI-RESET! Silakan login dengan password baru Anda."
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
