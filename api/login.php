<?php
require_once __DIR__ . '/db_config.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

$email = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '');

if (empty($email)) {
    echo json_encode(['success' => false, 'message' => 'Email / Username wajib diisi!']);
    exit();
}

try {
    // 1. Ensure status column exists in users table
    try {
        $pdo->exec("ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'approved'");
    } catch (Exception $exCol) {}

    // 2. Search user by email or name in MySQL
    $stmt = $pdo->prepare("SELECT id, email, name, role, status, level, community_rank, favorite_spot, total_distance_km FROM users WHERE email = :email OR name = :name LIMIT 1");
    $stmt->execute(['email' => $email, 'name' => $email]);
    $user = $stmt->fetch();

    if ($user) {
        // Check if user status is pending verification
        if (isset($user['status']) && $user['status'] === 'pending') {
            echo json_encode([
                'success' => false,
                'isPending' => true,
                'message' => '⏳ Akun Anda saat ini masih MENUNGGU VERIFIKASI dari Super Admin (ferdhy). Silakan hubungi Super Admin untuk menyetujui akun Anda!'
            ]);
            exit();
        }

        // Dynamically calculate distance & sessions
        $uid = $user['id'];
        $stmtDist = $pdo->prepare("SELECT COALESCE(SUM(distance_km), 0) as tot_dist, COUNT(id) as tot_sess FROM activities WHERE user_id = :uid");
        $stmtDist->execute(['uid' => $uid]);
        $distRow = $stmtDist->fetch();
        
        $user['total_distance_km'] = (float)($distRow['tot_dist'] ?? $user['total_distance_km']);
        $user['total_sessions'] = (int)($distRow['tot_sess'] ?? 0);

        echo json_encode([
            'success' => true,
            'message' => 'Login berhasil! Selamat mendayung 🏄‍♂️',
            'user' => $user
        ]);
        exit();
    }

    // 3. Check for Super Admin Ferdhy Demo Email/Username
    if (strtolower($email) === 'ahmadferdy66@gmail.com' || strtolower($email) === 'ferdhy') {
        echo json_encode([
            'success' => true,
            'message' => 'Super Admin Logged In',
            'user' => [
                'id' => 1,
                'email' => 'ahmadferdy66@gmail.com',
                'name' => 'ferdhy',
                'role' => 'super_admin',
                'status' => 'approved',
                'level' => 'Super Admin 👑',
                'community_rank' => 1,
                'favorite_spot' => 'Bosowa Beach',
                'total_distance_km' => 120.50,
                'total_sessions' => 1
            ]
        ]);
        exit();
    }

    // 4. Check for Sapril Demo Email/Username
    if (strtolower($email) === 'sapril@sup.id' || strtolower($email) === 'sapril') {
        echo json_encode([
            'success' => true,
            'message' => 'Demo User Logged In',
            'user' => [
                'id' => 2,
                'email' => 'sapril@sup.id',
                'name' => 'Sapril',
                'role' => 'user',
                'status' => 'approved',
                'level' => 'Explorer',
                'community_rank' => 2,
                'favorite_spot' => 'Samalona Island',
                'total_distance_km' => 45.80,
                'total_sessions' => 3
            ]
        ]);
        exit();
    }

    // 5. Return error if email not registered
    echo json_encode([
        'success' => false,
        'message' => 'Email atau Username tidak ditemukan. Silakan klik tab "Daftar (Register)" untuk membuat akun baru!'
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
