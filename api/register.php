<?php
require_once __DIR__ . '/db_config.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

$name = trim($data['name'] ?? '');
$email = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '123456');

if (empty($name) || empty($email)) {
    echo json_encode(['success' => false, 'message' => 'Nama dan Email wajib diisi!']);
    exit();
}

try {
    // 1. Ensure status column exists in users table
    try {
        $pdo->exec("ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'approved'");
    } catch (Exception $exCol) {}

    // 2. Check if email already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
    $stmt->execute(['email' => $email]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Email sudah terdaftar. Silakan login atau hubungi Super Admin!']);
        exit();
    }

    // 3. Insert new user with status = 'pending'
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmtIns = $pdo->prepare("INSERT INTO users (name, email, password_hash, role, level, community_rank, status, total_distance_km, total_sessions) VALUES (:name, :email, :hash, 'user', 'Beginner SUPer', 99, 'pending', 0.00, 0)");
    $stmtIns->execute(['name' => $name, 'email' => $email, 'hash' => $hash]);

    $newId = $pdo->lastInsertId();

    echo json_encode([
        'success' => true,
        'isPending' => true,
        'message' => 'Pendaftaran berhasil! Akun Anda saat ini MENUNGGU VERIFIKASI dari Super Admin (ferdhy). Silakan hubungi Super Admin untuk menyetujui pendaftaran Anda!',
        'registeredUser' => [
            'id' => (int)$newId,
            'email' => $email,
            'name' => $name,
            'status' => 'pending'
        ]
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
