<?php
require_once __DIR__ . '/db_config.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

$action = trim($_GET['action'] ?? $data['action'] ?? 'list');

try {
    // Ensure status, plain_password, reset_status, requested_password columns exist
    try {
        $pdo->exec("ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'approved'");
    } catch (Exception $exCol) {}
    try {
        $pdo->exec("ALTER TABLE users ADD COLUMN plain_password VARCHAR(255) DEFAULT ''");
    } catch (Exception $exCol2) {}
    try {
        $pdo->exec("ALTER TABLE users ADD COLUMN reset_status VARCHAR(20) DEFAULT NULL");
    } catch (Exception $e1) {}
    try {
        $pdo->exec("ALTER TABLE users ADD COLUMN requested_password VARCHAR(255) DEFAULT NULL");
    } catch (Exception $e2) {}

    if ($action === 'list') {
        $stmt = $pdo->query("SELECT id, name, email, role, status, reset_status, requested_password, level, community_rank, total_distance_km, plain_password, DATE_FORMAT(created_at, '%d %b %Y %H:%i') as formatted_date FROM users ORDER BY reset_status DESC, status DESC, id DESC");
        $users = $stmt->fetchAll();

        foreach ($users as &$u) {
            $stmtSess = $pdo->prepare("SELECT COUNT(*) as sess_cnt FROM activities WHERE user_id = :uid");
            $stmtSess->execute(['uid' => $u['id']]);
            $u['total_sessions'] = (int)($stmtSess->fetch()['sess_cnt'] ?? 0);
            if (empty($u['plain_password'])) {
                $u['plain_password'] = '[Password Encrypted]';
            }
        }

        echo json_encode(['success' => true, 'users' => $users]);
        exit();
    }

    if ($action === 'approve_reset') {
        $targetUserId = (int)($data['user_id'] ?? 0);
        $stmtGet = $pdo->prepare("SELECT requested_password, name, email FROM users WHERE id = :uid LIMIT 1");
        $stmtGet->execute(['uid' => $targetUserId]);
        $targetUser = $stmtGet->fetch();

        if (!$targetUser || empty($targetUser['requested_password'])) {
            echo json_encode(['success' => false, 'message' => 'Tidak ada permintaan reset password untuk user ini!']);
            exit();
        }

        $newPass = $targetUser['requested_password'];
        $hash = password_hash($newPass, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("UPDATE users SET password_hash = :hash, plain_password = :plain, reset_status = NULL, requested_password = NULL WHERE id = :uid");
        $stmt->execute(['hash' => $hash, 'plain' => $newPass, 'uid' => $targetUserId]);

        echo json_encode([
            'success' => true,
            'message' => "🔑 VERIFIKASI LUPA PASSWORD DISETUJUI! Password akun " . $targetUser['name'] . " berhasil diperbarui menjadi '$newPass'!"
        ]);
        exit();
    }

    if ($action === 'reset_password') {
        $targetUserId = (int)($data['user_id'] ?? 0);
        $newPassword = trim($data['new_password'] ?? '');

        if ($targetUserId <= 0 || empty($newPassword)) {
            echo json_encode(['success' => false, 'message' => 'User ID dan Password Baru wajib diisi!']);
            exit();
        }

        $hash = password_hash($newPassword, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("UPDATE users SET password_hash = :hash, plain_password = :plain, reset_status = NULL, requested_password = NULL WHERE id = :uid");
        $stmt->execute(['hash' => $hash, 'plain' => $newPassword, 'uid' => $targetUserId]);

        echo json_encode([
            'success' => true,
            'message' => "Password akun ID #$targetUserId BERHASIL DI-RESET menjadi '$newPassword'!"
        ]);
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

    if ($action === 'delete_post') {
        $postId = (int)($data['post_id'] ?? 0);
        if ($postId > 0) {
            $stmt = $pdo->prepare("DELETE FROM community_posts WHERE id = :pid");
            $stmt->execute(['pid' => $postId]);
            echo json_encode(['success' => true, 'message' => "Postingan #$postId berhasil dihapus!"]);
            exit();
        }
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
