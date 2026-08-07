import React, { useState, useEffect } from 'react';

export default function AdminAIDiagnosticsScreen({ currentUser }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [aiHealth, setAiHealth] = useState(null);
  const [testingAi, setTestingAi] = useState(false);
  const [submittingTest, setSubmittingTest] = useState(false);
  const [testFeature, setTestFeature] = useState('GPS Sea Tracking');
  const [testErrorMsg, setTestErrorMsg] = useState('Location permission denied on mobile browser');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai_diagnose.php?action=list');
      const data = await res.json();
      if (data.success) setLogs(data.logs || []);
    } catch (e) {
      console.log('Error loading AI logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleTestAiConnectivity = async () => {
    setTestingAi(true);
    try {
      const res = await fetch('/api/ai_diagnose.php?action=health_check');
      const data = await res.json();
      setAiHealth(data);
    } catch (e) {
      setAiHealth({ success: false, message: e.message });
    } finally {
      setTestingAi(false);
    }
  };

  const handleSimulateError = async (e) => {
    e.preventDefault();
    setSubmittingTest(true);
    try {
      await fetch('/api/ai_diagnose.php?action=diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature_name: testFeature,
          error_type: 'Frontend Exception',
          raw_error: testErrorMsg,
          user_id: currentUser?.id || 1
        })
      });
      loadLogs();
      alert('Diagnostik AI Berhasil! Catatan perbaikan telah dihasilkan.');
    } catch (err) {
      alert('Gagal melempar tes diagnostik AI');
    } finally {
      setSubmittingTest(false);
    }
  };

  const handleUpdateStatus = async (logId, newStatus) => {
    try {
      await fetch('/api/ai_diagnose.php?action=update_status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: logId, status: newStatus })
      });
      loadLogs();
    } catch (e) {}
  };

  const handleClearResolved = async () => {
    if (!window.confirm('Bersihkan seluruh log perbaikan yang sudah selesai (Resolved)?')) return;
    try {
      await fetch('/api/ai_diagnose.php?action=clear');
      loadLogs();
    } catch (e) {}
  };

  const filteredLogs = logs.filter(l => {
    if (filter === 'pending') return l.status === 'pending';
    if (filter === 'resolved') return l.status === 'resolved';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      {/* AI Diagnostic Header Card */}
      <div className="card-clean" style={{ background: '#0F172A', color: 'white', padding: '14px 16px', borderRadius: '14px', border: '1px solid #1E293B' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.4)', color: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <rect x="9" y="9" width="6" height="6" />
                <line x1="9" y1="1" x2="9" y2="4" />
                <line x1="15" y1="1" x2="15" y2="4" />
                <line x1="9" y1="20" x2="9" y2="23" />
                <line x1="15" y1="20" x2="15" y2="23" />
                <line x1="20" y1="9" x2="23" y2="9" />
                <line x1="20" y1="15" x2="23" y2="15" />
                <line x1="1" y1="9" x2="4" y2="9" />
                <line x1="1" y1="15" x2="4" y2="15" />
              </svg>
            </div>
            <div>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#38BDF8', fontWeight: 800 }}>AI SYSTEM DIAGNOSTICS</span>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, margin: 0, color: 'white' }}>Multi-Provider AI Repair Logs</h3>
            </div>
          </div>

          <button
            onClick={handleTestAiConnectivity}
            disabled={testingAi}
            style={{ background: '#0284C7', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            {testingAi ? 'Menguji AI...' : 'Tes Koneksi AI'}
          </button>
        </div>

        {/* AI Health Output Banner */}
        {aiHealth && (
          <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.06)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', fontSize: '0.78rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: aiHealth.success ? '#10B981' : '#EF4444' }} />
              <strong style={{ color: aiHealth.success ? '#34D399' : '#F87171' }}>
                {aiHealth.provider?.toUpperCase()} ({aiHealth.model}) - Normal
              </strong>
            </div>
            <p style={{ margin: 0, color: '#CBD5E1', fontStyle: 'italic' }}>"{aiHealth.sample_response || aiHealth.message}"</p>
          </div>
        )}
      </div>

      {/* Manual Diagnostic Test Form */}
      <form onSubmit={handleSimulateError} className="card-clean" style={{ padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          Uji Diagnostik & Catatan Perbaikan AI
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={testFeature}
            onChange={(e) => setTestFeature(e.target.value)}
            placeholder="Nama Fitur (misal: GPS Tracking)"
            style={{ flex: 1, minWidth: '140px', padding: '7px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem' }}
          />
          <input
            type="text"
            value={testErrorMsg}
            onChange={(e) => setTestErrorMsg(e.target.value)}
            placeholder="Pesan / Detail Error"
            style={{ flex: 2, minWidth: '180px', padding: '7px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem' }}
          />
          <button
            type="submit"
            disabled={submittingTest}
            style={{ background: '#0284C7', color: 'white', border: 'none', padding: '7px 14px', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            {submittingTest ? 'Menganalisis...' : 'Jalankan AI'}
          </button>
        </div>
      </form>

      {/* Filter & Clear Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0' }}>
        <div style={{ display: 'flex', background: '#E2E8F0', padding: '2px', borderRadius: '8px', gap: '2px' }}>
          <button
            onClick={() => setFilter('all')}
            style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: filter === 'all' ? '#0284C7' : 'transparent', color: filter === 'all' ? 'white' : '#64748B', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer' }}
          >
            Semua ({logs.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: filter === 'pending' ? '#EF4444' : 'transparent', color: filter === 'pending' ? 'white' : '#64748B', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer' }}
          >
            Pending ({logs.filter(l => l.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('resolved')}
            style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: filter === 'resolved' ? '#10B981' : 'transparent', color: filter === 'resolved' ? 'white' : '#64748B', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer' }}
          >
            Selesai ({logs.filter(l => l.status === 'resolved').length})
          </button>
        </div>

        <button
          onClick={handleClearResolved}
          style={{ background: 'white', border: '1px solid #CBD5E1', padding: '4px 10px', borderRadius: '6px', color: '#64748B', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          Bersihkan Selesai
        </button>
      </div>

      {/* Log Items Grid */}
      {loading ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem' }}>Memuat log diagnostik...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="card-clean" style={{ padding: '20px', textAlign: 'center', color: '#64748B', fontSize: '0.8rem' }}>
          Tidak ada laporan kendala sistem saat ini. Seluruh fitur berjalan optimal.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredLogs.map((item) => {
            const isResolved = item.status === 'resolved';
            return (
              <div
                key={item.id}
                className="card-clean"
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: isResolved ? '1px solid #E2E8F0' : '1px solid #FECDD3',
                  borderLeft: `4px solid ${isResolved ? '#10B981' : '#EF4444'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', background: '#F1F5F9', color: '#0F172A', fontWeight: 800 }}>
                      #{item.id}
                    </span>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{item.feature_name}</strong>
                    <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', background: isResolved ? '#D1FAE5' : '#FEE2E2', color: isResolved ? '#047857' : '#B91C1C', fontWeight: 800 }}>
                      {isResolved ? 'RESOLVED' : 'PENDING FIX'}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{item.formatted_date}</span>
                </div>

                <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', padding: '6px 10px', borderRadius: '6px', fontSize: '0.72rem', color: '#BE123C', fontFamily: 'monospace' }}>
                  <strong>{item.error_type}:</strong> {item.raw_error}
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px', borderRadius: '8px', fontSize: '0.78rem', color: '#334155', lineHeight: 1.45 }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0284C7', display: 'block', marginBottom: '4px' }}>
                    ANALISIS AI ({item.ai_provider?.toUpperCase()} - {item.ai_model})
                  </span>
                  <div style={{ whiteSpace: 'pre-line' }}>{item.ai_analysis}</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '2px' }}>
                  {item.status !== 'resolved' ? (
                    <button
                      onClick={() => handleUpdateStatus(item.id, 'resolved')}
                      style={{ background: '#10B981', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Tandai Selesai
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(item.id, 'pending')}
                      style={{ background: 'white', color: '#64748B', border: '1px solid #CBD5E1', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Buka Kembali
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
