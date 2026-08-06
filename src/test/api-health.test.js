import { describe, it, expect } from 'vitest';

const BASE_URL = 'http://localhost/SUPIDlog/api';

describe('PHP API & MySQL Database Health Check', () => {
  it('GET /api/get_activities.php - Should return status 200 and valid activities array', async () => {
    try {
      const res = await fetch(`${BASE_URL}/get_activities.php`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.activities)).toBe(true);
    } catch (err) {
      throw new Error(`Koneksi PHP/MySQL Gagal pada /get_activities.php: ${err.message}`);
    }
  });

  it('GET /api/get_spots.php - Should return status 200 and valid spots array', async () => {
    try {
      const res = await fetch(`${BASE_URL}/get_spots.php`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.spots)).toBe(true);
    } catch (err) {
      throw new Error(`Koneksi PHP/MySQL Gagal pada /get_spots.php: ${err.message}`);
    }
  });

  it('GET /api/get_leaderboard.php - Should return status 200 and leaderboard array', async () => {
    try {
      const res = await fetch(`${BASE_URL}/get_leaderboard.php`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.leaderboard)).toBe(true);
    } catch (err) {
      throw new Error(`Koneksi PHP/MySQL Gagal pada /get_leaderboard.php: ${err.message}`);
    }
  });

  it('GET /api/get_community.php - Should return status 200 and posts array', async () => {
    try {
      const res = await fetch(`${BASE_URL}/get_community.php`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.posts)).toBe(true);
    } catch (err) {
      throw new Error(`Koneksi PHP/MySQL Gagal pada /get_community.php: ${err.message}`);
    }
  });

  it('POST /api/login.php - Should handle invalid credentials correctly', async () => {
    try {
      const res = await fetch(`${BASE_URL}/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'nonexistent_test_user_123', password: 'wrongpassword' }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.message).toBeDefined();
    } catch (err) {
      throw new Error(`Koneksi PHP/MySQL Gagal pada /login.php: ${err.message}`);
    }
  });
});
