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
    // 1. Ensure columns exist dynamically in MySQL
    try {
        $pdo->exec("ALTER TABLE `users` ADD COLUMN `avatar_url` VARCHAR(255) DEFAULT '' AFTER `name`");
    } catch (Exception $ex) {}

    try {
        $pdo->exec("ALTER TABLE `users` ADD COLUMN `club_name` VARCHAR(100) DEFAULT 'SUP.ID Indonesia' AFTER `avatar_url`");
    } catch (Exception $ex) {}

    try {
        $pdo->exec("ALTER TABLE `users` ADD COLUMN `emergency_contact` VARCHAR(50) DEFAULT '' AFTER `club_name`");
    } catch (Exception $ex) {}

    // 2. Execute UPDATE query
    $stmt = $pdo->prepare("UPDATE users SET name = :name, avatar_url = :avatar, club_name = :club, emergency_contact = :emergency WHERE id = :uid");
    $stmt->execute([
        'name' => $name,
        'avatar' => $avatarUrl,
        'club' => $clubName,
        'emergency' => $emergencyContact,
        'uid' => $userId
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Profil & Kontak Darurat SOS berhasil diperbarui ke Database MySQL!',
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
