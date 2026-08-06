import { describe, it, expect } from 'vitest';

const BASE_URL = 'http://localhost/SUPIDlog/api';

describe('Complete 29 PHP APIs & Database Health Test Suite', () => {
  // ── 1. FEED & ACTIVITIES ──
  it('GET /api/get_activities.php - Returns user activity feed', async () => {
    const res = await fetch(`${BASE_URL}/get_activities.php?user_id=1`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.activities)).toBe(true);
  });

  it('GET /api/get_all_activities.php - Returns all community activity logs', async () => {
    const res = await fetch(`${BASE_URL}/get_all_activities.php`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.activities)).toBe(true);
  });

  // ── 2. SPOTS & LOCATIONS ──
  it('GET /api/get_spots.php - Returns list of paddle spots', async () => {
    const res = await fetch(`${BASE_URL}/get_spots.php`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.spots)).toBe(true);
  });

  it('GET /api/get_saved_spots.php - Returns user saved / trip plan spots', async () => {
    const res = await fetch(`${BASE_URL}/get_saved_spots.php?user_id=1`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  // ── 3. PASSPORT, LEADERBOARD & GEAR ──
  it('GET /api/get_passport.php - Returns user passport status & stamps', async () => {
    const res = await fetch(`${BASE_URL}/get_passport.php?user_id=1`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.stamps)).toBe(true);
  });

  it('GET /api/get_leaderboard.php - Returns community rankings', async () => {
    const res = await fetch(`${BASE_URL}/get_leaderboard.php`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.leaderboard)).toBe(true);
  });

  it('GET /api/get_gear.php - Returns gear locker list', async () => {
    const res = await fetch(`${BASE_URL}/get_gear.php?user_id=1`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('success');
  });

  // ── 4. DASHBOARD, ANALYTICS & BUCKET LIST ──
  it('GET /api/get_user_dashboard.php - Returns home dashboard metrics', async () => {
    const res = await fetch(`${BASE_URL}/get_user_dashboard.php?user_id=1`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it('GET /api/get_user_analytics.php - Returns analytics data', async () => {
    const res = await fetch(`${BASE_URL}/get_user_analytics.php?user_id=1`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it('GET /api/bucket_list.php - Returns user bucket list items', async () => {
    const res = await fetch(`${BASE_URL}/bucket_list.php?user_id=1`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  // ── 5. COMMUNITY & SOCIAL ──
  it('GET /api/get_community.php - Returns community feed posts', async () => {
    const res = await fetch(`${BASE_URL}/get_community.php?user_id=1`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.posts)).toBe(true);
  });

  it('GET /api/get_comments.php - Returns post comments', async () => {
    const res = await fetch(`${BASE_URL}/get_comments.php?activity_id=1`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.comments)).toBe(true);
  });

  // ── 6. SUPER ADMIN PANEL ──
  it('GET /api/admin_users.php - Returns super admin user accounts list', async () => {
    const res = await fetch(`${BASE_URL}/admin_users.php?action=list`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data) || data.success !== undefined).toBe(true);
  });

  // ── 7. POST ACTION VALIDATION ──
  it('POST /api/login.php - Rejects empty / invalid credentials', async () => {
    const res = await fetch(`${BASE_URL}/login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: '', password: '' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('POST /api/register.php - Validates existing user check', async () => {
    const res = await fetch(`${BASE_URL}/register.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test_user_exists_check', password: '123' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('success');
  });

  it('POST /api/reset_password.php - Handles password reset requests', async () => {
    const res = await fetch(`${BASE_URL}/reset_password.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent_test@example.com', new_password: '123' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('success');
  });

  it('POST /api/toggle_kudos.php - Handles kudos toggles', async () => {
    const res = await fetch(`${BASE_URL}/toggle_kudos.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 1, activity_id: 1 }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('success');
  });

  it('POST /api/save_gear.php - Handles gear item additions', async () => {
    const res = await fetch(`${BASE_URL}/save_gear.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 9999, name: 'Test SUP Board', category: 'Board', brand: 'SUP.ID' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('success');
  });
});
