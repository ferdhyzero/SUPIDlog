<?php
require_once __DIR__ . '/db_config.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

$action = trim($_GET['action'] ?? $data['action'] ?? 'list');

try {
    // Ensure status column exists in users table
    try {
        $pdo->exec("ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'approved'");
    } catch (Exception $exCol) {}

    if ($action === 'list') {
        $stmt = $pdo->query("SELECT id, name, email, role, status, level, community_rank, total_distance_km, DATE_FORMAT(created_at, '%d %b %Y %H:%i') as formatted_date FROM users ORDER BY status DESC, id DESC");
        $users = $stmt->fetchAll();

        foreach ($users as &$u) {
            $stmtSess = $pdo->prepare("SELECT COUNT(*) as sess_cnt FROM activities WHERE user_id = :uid");
            $stmtSess->execute(['uid' => $u['id']]);
            $u['total_sessions'] = (int)($stmtSess->fetch()['sess_cnt'] ?? 0);
        }

        echo json_encode(['success' => true, 'users' => $users]);
        exit();
    }

    if ($action === 'update_level') {
        $targetUserId = (int)($data['user_id'] ?? 0);
        $newLevel = trim($data['level'] ?? 'Beginner SUPer');

        if ($targetUserId <= 0) {
            echo json_encode(['success' => false, 'message' => 'User ID tidak valid!']);
            exit();
        }

        $stmt = $pdo->prepare("UPDATE users SET level = :lvl WHERE id = :uid");
        $stmt->execute(['lvl' => $newLevel, 'uid' => $targetUserId]);

        echo json_encode([
            'success' => true,
            'message' => "Level akun ID #$targetUserId berhasil diperbarui menjadi '$newLevel'!"
        ]);
        exit();
    }

    if ($action === 'approve' || $action === 'verify') {
        $targetUserId = (int)($data['user_id'] ?? 0);
        if ($targetUserId <= 0) {
            echo json_encode(['success' => false, 'message' => 'User ID tidak valid!']);
            exit();
        }

        $stmt = $pdo->prepare("UPDATE users SET status = 'approved' WHERE id = :uid");
        $stmt->execute(['uid' => $targetUserId]);

        echo json_encode([
            'success' => true,
            'message' => "Akun pengguna ID #$targetUserId BERHASIL DIVERIFIKASI & DISETUJUI oleh Super Admin!"
        ]);
        exit();
    }

    if ($action === 'change_role') {
        $targetUserId = (int)($data['user_id'] ?? 0);
        $newRole = trim($data['new_role'] ?? 'user');

        $stmt = $pdo->prepare("UPDATE users SET role = :role WHERE id = :uid");
        $stmt->execute(['role' => $newRole, 'uid' => $targetUserId]);

        echo json_encode([
            'success' => true,
            'message' => "Peran akun ID #$targetUserId diubah menjadi '$newRole'."
        ]);
        exit();
    }

    if ($action === 'delete') {
        $targetUserId = (int)($data['user_id'] ?? 0);
        if ($targetUserId === 1) {
            echo json_encode(['success' => false, 'message' => 'Super Admin utama tidak dapat dihapus!']);
            exit();
        }

        $stmt = $pdo->prepare("DELETE FROM users WHERE id = :uid");
        $stmt->execute(['uid' => $targetUserId]);

        echo json_encode(['success' => true, 'message' => "Akun pengguna ID #$targetUserId telah dihapus dari database."]);
        exit();
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
