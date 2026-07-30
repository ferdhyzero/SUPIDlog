<?php
require_once __DIR__ . '/db_config.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

$userId = (int)($data['user_id'] ?? 0);
$name = trim($data['name'] ?? '');
$avatarUrl = trim($data['avatar_url'] ?? '');
$clubName = trim($data['club_name'] ?? 'SUP.ID Indonesia');
$emergencyContact = trim($data['emergency_contact'] ?? '');

if (!$userId || !$name) {
    echo json_encode(['success' => false, 'message' => 'Data tidak lengkap!']);
    exit;
}

try {
    // Check if columns exist or update user
    $stmt = $pdo->prepare("UPDATE users SET name = :name WHERE id = :uid");
    $stmt->execute(['name' => $name, 'uid' => $userId]);

    echo json_encode([
        'success' => true,
        'message' => 'Profil berhasil diperbarui!',
        'user' => [
            'id' => $userId,
            'name' => $name,
            'avatar_url' => $avatarUrl,
            'club_name' => $clubName,
            'emergency_contact' => $emergencyContact
        ]
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
