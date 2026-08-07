import { describe, it, expect } from 'vitest';

const BASE_URL = 'http://localhost/SUPIDlog/api';

describe('Multi-Provider AI Engine & System Diagnostics Test Suite', () => {
  
  // ── 1. AI Health Check & Multi-Provider Connectivity ──
  it('GET /api/ai_diagnose.php?action=health_check - Connects to active AI provider', async () => {
    const res = await fetch(`${BASE_URL}/ai_diagnose.php?action=health_check`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.provider).toBeDefined();
    expect(data.model).toBeDefined();
  }, 35000);

  // ── 2. AI Diagnostics & Repair Notes Generation ──
  it('POST /api/ai_diagnose.php?action=diagnose - Generates AI repair notes & saves log to MySQL', async () => {
    const res = await fetch(`${BASE_URL}/ai_diagnose.php?action=diagnose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feature_name: 'Sistem Tracking GPS Laut',
        error_type: 'Signal Timeout',
        raw_error: 'GPS Geolocation timeout after 10000ms',
        user_id: 1
      })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.log_id).toBeGreaterThan(0);
    expect(data.ai_analysis).toBeDefined();
  }, 35000);

  // ── 3. List Repair Logs ──
  it('GET /api/ai_diagnose.php?action=list - Retrieves list of AI repair logs', async () => {
    const res = await fetch(`${BASE_URL}/ai_diagnose.php?action=list`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.logs)).toBe(true);
  }, 35000);
});
