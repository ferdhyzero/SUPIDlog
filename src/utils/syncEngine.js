// Hybrid Offline-to-Online Background Synchronization Engine

export const saveActivityHybrid = async (activityData, userId) => {
  const payload = {
    ...activityData,
    user_id: userId,
    created_at_local: new Date().toISOString()
  };

  // 1. Always save to LocalStorage first (Offline-First strategy)
  const localActivities = JSON.parse(localStorage.getItem('offline_activities_queue') || '[]');
  localActivities.push(payload);
  localStorage.setItem('offline_activities_queue', JSON.stringify(localActivities));

  // 2. Try sending to MySQL server API if online
  if (navigator.onLine) {
    try {
      const response = await fetch('/api/save_activity.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (data.success) {
        // Remove from offline queue if successfully saved to MySQL
        const updatedQueue = localActivities.filter(a => a.created_at_local !== payload.created_at_local);
        localStorage.setItem('offline_activities_queue', JSON.stringify(updatedQueue));
        return { synced: true, message: data.message };
      }
    } catch (err) {
      console.log('Server unreachable, kept in offline queue:', err);
    }
  }

  return { synced: false, message: 'Disimpan di HP (Offline Mode). Akan otomatis ter-update ke server saat online!' };
};

// Auto-sync background task when device comes back online
export const processPendingOfflineSync = async () => {
  if (!navigator.onLine) return;

  const offlineQueue = JSON.parse(localStorage.getItem('offline_activities_queue') || '[]');
  if (offlineQueue.length === 0) return;

  let syncedCount = 0;
  const remainingQueue = [];

  for (const activity of offlineQueue) {
    try {
      const response = await fetch('/api/save_activity.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity),
      });
      const data = await response.json();
      if (data.success) {
        syncedCount++;
      } else {
        remainingQueue.push(activity);
      }
    } catch (err) {
      remainingQueue.push(activity);
    }
  }

  localStorage.setItem('offline_activities_queue', JSON.stringify(remainingQueue));

  if (syncedCount > 0) {
    console.log(`⚡ ${syncedCount} data aktivitas offline berhasil disinkronisasi ke Database MySQL!`);
  }
};
