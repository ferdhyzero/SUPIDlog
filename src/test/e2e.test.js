import { describe, it, expect } from 'vitest';

const BASE_URL = 'http://localhost/SUPIDlog/api';

describe('End-to-End (E2E) Paddleboard User Flow Suite', () => {
  const timestamp = Date.now();
  const testUser = {
    name: `E2EPaddler_${timestamp}`,
    email: `e2e_${timestamp}@example.com`,
    password: `pass_${timestamp}`
  };

  let userId = 1; // Default fallback to active test user ID

  // ── Step 1: User Registration ──
  it('E2E Step 1: User registers a new SUP.ID account', async () => {
    const res = await fetch(`${BASE_URL}/register.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: testUser.name,
        email: testUser.email,
        password: testUser.password
      })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    if (data.registeredUser && data.registeredUser.id) {
      userId = data.registeredUser.id;
    }
  });

  // ── Step 1.5: Super Admin User Approval ──
  it('E2E Step 1.5: Super Admin approves the newly registered user', async () => {
    const res = await fetch(`${BASE_URL}/admin_users.php?action=approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'approve',
        user_id: userId
      })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  // ── Step 2: User Login ──
  it('E2E Step 2: User logs in and receives user profile details', async () => {
    const res = await fetch(`${BASE_URL}/login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  // ── Step 3: Spot Discovery & Trip Planning ──
  it('E2E Step 3: User pins a planned paddle spot (Pantai Losari Makassar)', async () => {
    const res = await fetch(`${BASE_URL}/save_planned_spot.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        spot_name: 'Pantai Losari Makassar',
        location_address: 'Makassar, Sulawesi Selatan',
        planned_date: '2026-08-15',
        lat: -5.143,
        lng: 119.458,
        notes: 'Sesi paddle pagi bersama komunitas'
      })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  // ── Step 4: Record & Save Paddle Workout Session ──
  it('E2E Step 4: User completes 12.5 KM paddle session and unlocks passport stamp', async () => {
    const res = await fetch(`${BASE_URL}/save_activity.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        spotName: 'Pantai Losari Makassar',
        rawDistance: 12.5,
        timeFormatted: '2h 15m',
        calories: 680,
        avgSpeed: '5.6 km/h',
        max_speed_kmh: 8.2,
        weather: '☀ Cerah 30°C',
        water: 'Flat Water',
        safetyScore: 100,
        safetyItems: { pfd: true, leash: true, water: true, phone: true },
        route: [
          [-5.143, 119.458],
          [-5.144, 119.459],
          [-5.145, 119.460]
        ],
        shared_to_community: 1,
        local_tips: 'Angin tenang pukul 06:30 WITA'
      })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  // ── Step 5: Verify Passport Digital & Stamp ──
  it('E2E Step 5: User verifies updated passport status & unlocked stamps', async () => {
    const res = await fetch(`${BASE_URL}/get_passport.php?user_id=${userId}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.stamps).toBeDefined();
  });

  // ── Step 6: Verify Dashboard & Community Feed ──
  it('E2E Step 6: User verifies home dashboard metrics & community feed post', async () => {
    const resDash = await fetch(`${BASE_URL}/get_user_dashboard.php?user_id=${userId}`);
    expect(resDash.status).toBe(200);
    const dataDash = await resDash.json();
    expect(dataDash.success).toBe(true);

    const resComm = await fetch(`${BASE_URL}/get_community.php?user_id=${userId}`);
    expect(resComm.status).toBe(200);
    const dataComm = await resComm.json();
    expect(dataComm.success).toBe(true);
  });
});
