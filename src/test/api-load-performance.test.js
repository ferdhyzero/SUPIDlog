import { describe, it, expect } from 'vitest';

const BASE_URL = 'http://localhost/SUPIDlog/api';

describe('API Performance & Concurrent Load Stress Test', () => {
  // ── 1. Concurrent Leaderboard Fetching (50 Parallel Requests) ──
  it('Load Stress 1: Handles 25 concurrent leaderboard API requests under 1500ms total batch time', async () => {
    const startTime = Date.now();
    const requests = Array.from({ length: 25 }, () => fetch(`${BASE_URL}/get_leaderboard.php`));
    
    const responses = await Promise.all(requests);
    const duration = Date.now() - startTime;

    responses.forEach(res => {
      expect(res.status).toBe(200);
    });

    expect(duration).toBeLessThan(12000); // 25 concurrent queries within 12 seconds in local server
  });

  // ── 2. Concurrent Spot Discovery Fetching (25 Parallel Requests) ──
  it('Load Stress 2: Handles 25 concurrent spot discovery API requests', async () => {
    const startTime = Date.now();
    const requests = Array.from({ length: 25 }, () => fetch(`${BASE_URL}/get_spots.php`));
    
    const responses = await Promise.all(requests);
    const duration = Date.now() - startTime;

    responses.forEach(res => {
      expect(res.status).toBe(200);
    });

    expect(duration).toBeLessThan(12000);
  });

  // ── 3. Concurrent Passport Fetching ──
  it('Load Stress 3: Handles 15 concurrent passport status requests', async () => {
    const startTime = Date.now();
    const requests = Array.from({ length: 15 }, (_, i) => fetch(`${BASE_URL}/get_passport.php?user_id=${(i % 5) + 1}`));
    
    const responses = await Promise.all(requests);
    const duration = Date.now() - startTime;

    responses.forEach(res => {
      expect(res.status).toBe(200);
    });

    expect(duration).toBeLessThan(10000);
  });
});
