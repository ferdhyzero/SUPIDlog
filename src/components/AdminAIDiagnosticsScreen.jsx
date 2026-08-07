import React, { useState, useEffect } from 'react';

export default function AdminAIDiagnosticsScreen({ currentUser }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'resolved'
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
      alert('🤖 Diagnostik AI Berhasil! Catatan perbaikan telah dihasilkan oleh AI.');
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
    <div style={{ width: '100%', padding: '16px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Hero Header */}
      <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#38BDF8', fontWeight: 800 }}>
              SUP.ID AUTOMATED SYSTEM DIAGNOSTICS
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🤖 AI Repair Logs Engine
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#94A3B8', margin: '4px 0 0' }}>
              Multi-Provider AI (Gemini 3-Keys Rotation, Groq, OpenRouter, OpenAI) mendiagnosis error & membuat catatan perbaikan otomatis.
            </p>
          </div>

          <button
            onClick={handleTestAiConnectivity}
            disabled={testingAi}
            style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)' }}
          >
            {testingAi ? '⏳ Menguji Koneksi AI...' : '⚡ Tes Koneksi Multi-AI'}
          </button>
        </div>

        {/* AI Health Output Card */}
        {aiHealth && (
          <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: aiHealth.success ? '#10B981' : '#EF4444' }} />
              <strong style={{ color: aiHealth.success ? '#34D399' : '#F87171' }}>
                Provider Aktif: {aiHealth.provider?.toUpperCase()} ({aiHealth.model})
              </strong>
            </div>
            <p style={{ margin: 0, color: '#E2E8F0', fontStyle: 'italic' }}>"{aiHealth.sample_response || aiHealth.message}"</p>
          </div>
        )}
      </div>

      {/* Manual Diagnostic Simulation Form */}
      <form onSubmit={handleSimulateError} style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          🧪 Tes Uji Diagnostik & Catatan Perbaikan AI
        </h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={testFeature}
            onChange={(e) => setTestFeature(e.target.value)}
            placeholder="Nama Fitur (misal: GPS Sea Tracking)"
            style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
          />
          <input
            type="text"
            value={testErrorMsg}
            onChange={(e) => setTestErrorMsg(e.target.value)}
            placeholder="Pesan / Stack Trace Error"
            style={{ flex: 2, padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
          />
          <button
            type="submit"
            disabled={submittingTest}
            style={{ background: '#0284C7', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
          >
            {submittingTest ? 'AI Menganalisis...' : '🔍 Lakukan Diagnostik AI'}
          </button>
        </div>
      </form>

      {/* Log Filter & Actions Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setFilter('all')}
            style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: filter === 'all' ? '#0284C7' : '#F1F5F9', color: filter === 'all' ? 'white' : '#64748B', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
          >
            Semua ({logs.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: filter === 'pending' ? '#EF4444' : '#F1F5F9', color: filter === 'pending' ? 'white' : '#64748B', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
          >
            Perlu Perbaikan ({logs.filter(l => l.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('resolved')}
            style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: filter === 'resolved' ? '#10B981' : '#F1F5F9', color: filter === 'resolved' ? 'white' : '#64748B', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
          >
            Selesai ({logs.filter(l => l.status === 'resolved').length})
          </button>
        </div>

        <button
          onClick={handleClearResolved}
          style={{ background: 'none', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '8px', color: '#64748B', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
        >
          🧹 Bersihkan Selesai
        </button>
      </div>

      {/* Repair Logs List */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>⏳ Memuat log diagnostik AI...</div>
      ) : filteredLogs.length === 0 ? (
        <div style={{ background: '#F8FAFC', padding: '30px', borderRadius: '16px', textAlign: 'center', border: '1px dashed #CBD5E1', color: '#64748B' }}>
          🎉 Tidak ada laporan error/kendala sistem saat ini. Seluruh fitur berjalan optimal!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredLogs.map((item) => (
            <div
              key={item.id}
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '16px',
                border: '1px solid #E2E8F0',
                borderLeft: `5px solid ${item.status === 'resolved' ? '#10B981' : '#EF4444'}`,
                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '6px', background: '#F1F5F9', color: '#0F172A', fontWeight: 800 }}>
                    #{item.id}
                  </span>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{item.feature_name}</strong>
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', background: item.status === 'resolved' ? '#D1FAE5' : '#FEE2E2', color: item.status === 'resolved' ? '#047857' : '#B91C1C', fontWeight: 800 }}>
                    {item.status === 'resolved' ? '✓ RESOLVED' : '⚠️ PENDING FIX'}
                  </span>
                </div>

                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{item.formatted_date}</span>
              </div>

              {/* Raw Error Banner */}
              <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', padding: '8px 12px', borderRadius: '8px', fontSize: '0.78rem', color: '#BE123C', fontFamily: 'monospace' }}>
                <strong>{item.error_type}:</strong> {item.raw_error}
              </div>

              {/* AI Analysis & Suggested Fix Box */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '10px', fontSize: '0.82rem', color: '#334155', lineHeight: 1.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0284C7', textTransform: 'uppercase' }}>
                    🤖 CATATAN PERBAIKAN (Analisis: {item.ai_provider?.toUpperCase()} - {item.ai_model})
                  </span>
                </div>
                <div style={{ whiteSpace: 'pre-line' }}>{item.ai_analysis}</div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                {item.status !== 'resolved' ? (
                  <button
                    onClick={() => handleUpdateStatus(item.id, 'resolved')}
                    style={{ background: '#10B981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    ✓ Tandai Selesai Diperbaiki
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateStatus(item.id, 'pending')}
                    style={{ background: '#F1F5F9', color: '#64748B', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    ↺ Buka Kembali
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
