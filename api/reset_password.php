<?php
require_once __DIR__ . '/db_config.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

$identifier = trim($data['email'] ?? $data['identifier'] ?? '');
$newPassword = trim($data['new_password'] ?? '');

if (empty($identifier) || empty($newPassword)) {
    echo json_encode(['success' => false, 'message' => 'Email / Username dan Password Baru wajib diisi!']);
    exit();
}

try {
    // 1. Ensure reset_status and requested_password columns exist
    try {
        $pdo->exec("ALTER TABLE users ADD COLUMN reset_status VARCHAR(20) DEFAULT NULL");
    } catch (Exception $e1) {}
    try {
        $pdo->exec("ALTER TABLE users ADD COLUMN requested_password VARCHAR(255) DEFAULT NULL");
    } catch (Exception $e2) {}

    // 2. Check if user exists by Email or Username
    $stmt = $pdo->prepare("SELECT id, name, email FROM users WHERE email = :id OR name = :id LIMIT 1");
    $stmt->execute(['id' => $identifier]);
    $user = $stmt->fetch();

    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'Email atau Username tidak ditemukan di database!']);
        exit();
    }

    // 3. Set reset_status = 'reset_pending' waiting for Super Admin approval
    $stmtUpd = $pdo->prepare("UPDATE users SET reset_status = 'reset_pending', requested_password = :req_pass WHERE id = :uid");
    $stmtUpd->execute(['req_pass' => $newPassword, 'uid' => $user['id']]);

    echo json_encode([
        'success' => true,
        'isPending' => true,
        'message' => "⏳ Permintaan reset password untuk '" . $user['name'] . "' (" . $user['email'] . ") BERHASIL DIKIRIM! Silakan hubungi Super Admin (ferdhy) untuk menyetujui verifikasi reset password Anda."
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
