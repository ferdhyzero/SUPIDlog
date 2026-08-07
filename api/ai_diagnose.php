<?php
// ==============================================================================
// AI System Diagnostics & Repair Logs Engine API for SUP.ID Log
// Actions: list, diagnose, health_check, update_status, clear
// ==============================================================================

require_once __DIR__ . '/db_config.php';
require_once __DIR__ . '/ai_config.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

$action = trim($_GET['action'] ?? $data['action'] ?? 'list');
$userId = (int)($_GET['user_id'] ?? $data['user_id'] ?? 1);

try {
    // 1. Ensure ai_repair_logs table structure exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS ai_repair_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        feature_name VARCHAR(150) NOT NULL,
        error_type VARCHAR(100) NOT NULL DEFAULT 'System Error',
        raw_error TEXT DEFAULT NULL,
        ai_provider VARCHAR(50) DEFAULT 'gemini',
        ai_model VARCHAR(100) DEFAULT 'gemma-4-31b-it',
        ai_analysis TEXT DEFAULT NULL,
        suggested_fix TEXT DEFAULT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // ── ACTION: LIST REPAIR LOGS ──
    if ($action === 'list') {
        $stmt = $pdo->query("SELECT id, user_id, feature_name, error_type, raw_error, ai_provider, ai_model, ai_analysis, suggested_fix, status, DATE_FORMAT(created_at, '%d %b %Y %H:%i') as formatted_date FROM ai_repair_logs ORDER BY status DESC, id DESC LIMIT 50");
        $logs = $stmt->fetchAll();

        echo json_encode(['success' => true, 'logs' => $logs]);
        exit();
    }

    // ── ACTION: HEALTH CHECK (TEST MULTI-PROVIDER AI CONNECTIVITY) ──
    if ($action === 'health_check') {
        $prompt = "Tes konektivitas Multi-Provider AI Engine SUP.ID. Berikan 1 kalimat konfirmasi.";
        $aiResult = callMultiProviderAI($prompt, "Singkat dan padat.");

        echo json_encode([
            'success' => true,
            'provider' => $aiResult['provider'],
            'model' => $aiResult['model'],
            'message' => 'Multi-Provider AI Engine Aktif & Normal!',
            'sample_response' => $aiResult['response']
        ]);
        exit();
    }

    // ── ACTION: DIAGNOSE & LOG REPAIR NOTES ──
    if ($action === 'diagnose' || $action === 'create') {
        $featureName = trim($data['feature_name'] ?? 'Sistem Dayung');
        $errorType = trim($data['error_type'] ?? 'Unhandled Exception');
        $rawError = trim($data['raw_error'] ?? 'Unspecified error payload');

        $prompt = "Telah terjadi kendala sistem pada aplikasi Stand Up Paddle Boarding SUP.ID.\n\n" .
                  "**Nama Fitur**: $featureName\n" .
                  "**Tipe Error**: $errorType\n" .
                  "**Detail Stack Trace / Pesan Error**: $rawError\n\n" .
                  "Tolong berikan analisis singkat:\n" .
                  "1. **Penyebab Utama**\n" .
                  "2. **Catatan & Langkah Perbaikan Kode / UI** (dalam bentuk rekomendasi teknis yang tepat).";

        $systemInstruction = "Anda adalah AI Systems Reliability Specialist untuk aplikasi SUP.ID Log. Jawaban harus terstruktur, profesional, dan dalam bahasa Indonesia.";
        $aiResult = callMultiProviderAI($prompt, $systemInstruction);

        $aiAnalysis = $aiResult['response'];
        $provider = $aiResult['provider'];
        $model = $aiResult['model'];

        $stmtIns = $pdo->prepare("INSERT INTO ai_repair_logs (user_id, feature_name, error_type, raw_error, ai_provider, ai_model, ai_analysis, suggested_fix, status) VALUES (:uid, :fname, :etype, :rerror, :provider, :model, :analysis, :fix, 'pending')");
        $stmtIns->execute([
            'uid' => $userId,
            'fname' => $featureName,
            'etype' => $errorType,
            'rerror' => $rawError,
            'provider' => $provider,
            'model' => $model,
            'analysis' => $aiAnalysis,
            'fix' => $aiAnalysis
        ]);

        $logId = $pdo->lastInsertId();

        echo json_encode([
            'success' => true,
            'log_id' => (int)$logId,
            'provider' => $provider,
            'model' => $model,
            'ai_analysis' => $aiAnalysis,
            'message' => 'Laporan diagnostik & catatan perbaikan buatan AI berhasil disimpan ke database MySQL!'
        ]);
        exit();
    }

    // ── ACTION: UPDATE LOG STATUS ──
    if ($action === 'update_status') {
        $id = (int)($data['id'] ?? 0);
        $newStatus = trim($data['status'] ?? 'resolved');

        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'ID log tidak valid!']);
            exit();
        }

        $stmtUpd = $pdo->prepare("UPDATE ai_repair_logs SET status = :status WHERE id = :id");
        $stmtUpd->execute(['status' => $newStatus, 'id' => $id]);

        echo json_encode(['success' => true, 'message' => "Status log perbaikan #$id diubah menjadi '$newStatus'."]);
        exit();
    }

    // ── ACTION: CLEAR RESOLVED LOGS ──
    if ($action === 'clear') {
        $pdo->exec("DELETE FROM ai_repair_logs WHERE status = 'resolved'");
        echo json_encode(['success' => true, 'message' => 'Log perbaikan yang sudah selesai berhasil dibersihkan.']);
        exit();
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
