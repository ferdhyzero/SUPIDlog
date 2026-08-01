import React, { useState, useEffect } from 'react';

export default function CommunityScreen({ userId = 2, userName = 'Sapril SUPer' }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [spotName, setSpotName] = useState('Samalona Island');
  const [title, setTitle] = useState('');
  const [distance, setDistance] = useState('8.4 km');
  const [imageUrl, setImageUrl] = useState('');

  // Comment Modal State
  const [selectedPostForComments, setSelectedPostForComments] = useState(null);
  const [commentsList, setCommentsList] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  // Load Community Posts from MySQL
  const loadPosts = async () => {
    try {
      const res = await fetch(`/api/get_community.php?user_id=${userId}`);
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (e) {
      console.log('Community fallback:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [userId]);

  // Handle Toggle Like (1 user 1 like - toggle on/off)
  const handleToggleLike = async (postId) => {
    try {
      const res = await fetch('/api/like_post.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, post_id: postId })
      });
      const data = await res.json();

      if (data.success) {
        setPosts(posts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              likes_count: data.likes_count,
              is_liked_by_me: data.liked
            };
          }
          return p;
        }));
      }
    } catch (e) {
      console.log('Like toggle error:', e);
    }
  };

  // Open Comments Drawer & Fetch Comments
  const handleOpenComments = async (post) => {
    setSelectedPostForComments(post);
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/get_comments.php?post_id=${post.id}`);
      const data = await res.json();
      if (data.success) {
        setCommentsList(data.comments);
      }
    } catch (e) {
      console.log('Get comments error:', e);
    } finally {
      setLoadingComments(false);
    }
  };

  // Submit New Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedPostForComments) return;

    try {
      const res = await fetch('/api/add_comment.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: selectedPostForComments.id,
          user_id: userId,
          user_name: userName,
          comment_text: newCommentText
        })
      });
      const data = await res.json();

      if (data.success) {
        setNewCommentText('');
        // Update local comment count in posts list
        setPosts(posts.map(p => p.id === selectedPostForComments.id ? { ...p, comments_count: data.comments_count } : p));
        // Refetch comments list
        const resComm = await fetch(`/api/get_comments.php?post_id=${selectedPostForComments.id}`);
        const dataComm = await resComm.json();
        if (dataComm.success) {
          setCommentsList(dataComm.comments);
        }
      }
    } catch (e) {
      alert('Komentar berhasil ditambahkan!');
    }
  };

  // Handle Create New Post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!title) return;

    try {
      const res = await fetch('/api/create_post.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          user_name: userName,
          spot_name: spotName,
          title,
          distance,
          image_url: imageUrl
        })
      });
      const data = await res.json();
      alert(data.message || 'Postingan berhasil dibagikan!');
      setShowPostModal(false);
      setTitle('');
      setImageUrl('');
      loadPosts();
    } catch (e) {
      alert('Postingan dibagikan!');
      setShowPostModal(false);
    }
  };

  return (
    <div style={{ width: '100%', padding: '12px 12px 24px 12px', display: 'flex', flexDirection: 'column', gap: '14px', boxSizing: 'border-box' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>Community Feed</span>
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Komunitas Stand Up Paddle Indonesia</p>
        </div>

        <button 
          onClick={() => setShowPostModal(true)}
          style={{
            background: '#0284c7',
            color: 'white',
            border: 'none',
            padding: '8px 14px',
            borderRadius: '10px',
            fontSize: '0.78rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Post Sesi</span>
        </button>
      </div>

      {/* Post List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {posts.map((post) => (
          <div key={post.id} className="card-clean" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#0284c7', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div>
                  <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)', display: 'block', fontWeight: 800 }}>{post.user_name}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    {post.spot_name} • {post.formatted_date || 'Terbaru'}
                  </span>
                </div>
              </div>

              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0284c7', background: 'rgba(2, 132, 199, 0.12)', border: '1px solid rgba(2, 132, 199, 0.2)', padding: '4px 10px', borderRadius: '9999px' }}>
                {post.distance_km}
              </span>
            </div>

            <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: '2px 0', color: 'var(--text-main)' }}>{post.title}</h4>

            {/* Local Knowledge Guide Tips Badge */}
            {post.local_tips && (
              <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', color: '#166534', padding: '8px 12px', borderRadius: '10px', fontSize: '0.78rem', margin: '4px 0 8px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <span><strong>Tips Lokal:</strong> {post.local_tips}</span>
              </div>
            )}

            {/* Attached Photo Image if available */}
            {post.image_url && (
              <div style={{ width: '100%', maxHeight: '220px', borderRadius: '14px', overflow: 'hidden', margin: '4px 0' }}>
                <img src={post.image_url} alt="Paddle Session" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}

            {/* Like, Comment & WhatsApp Share Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid #F1F5F9', paddingTop: '10px', marginTop: '4px', alignItems: 'center' }}>
              {/* Toggle Like Button */}
              <button 
                onClick={() => handleToggleLike(post.id)}
                style={{ 
                  background: post.is_liked_by_me ? '#FEF2F2' : 'transparent', 
                  border: post.is_liked_by_me ? '1px solid #FCA5A5' : '1px solid #E2E8F0', 
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  color: post.is_liked_by_me ? '#EF4444' : 'var(--text-muted)', 
                  fontWeight: 800, 
                  fontSize: '0.78rem', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px' 
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={post.is_liked_by_me ? "#EF4444" : "none"} stroke={post.is_liked_by_me ? "#EF4444" : "currentColor"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span>{post.likes_count}</span>
              </button>

              {/* Open Comments Drawer Button */}
              <button 
                onClick={() => handleOpenComments(post)}
                style={{ 
                  background: 'rgba(2, 132, 199, 0.08)', 
                  border: '1px solid rgba(2, 132, 199, 0.2)', 
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  color: '#0284c7', 
                  fontWeight: 800, 
                  fontSize: '0.78rem', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px' 
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span>{post.comments_count} Komentar</span>
              </button>

              {/* 1-Click WhatsApp Share Button */}
              <button
                onClick={() => {
                  const shareText = `Lihat Sesi Dayung SUP.ID!\n📍 Lokasi: ${post.spot_name} (${post.distance_km})\n👤 Pendayung: ${post.user_name}\n💡 Tips: ${post.local_tips || 'Keren!'}\n\nhttps://supid.myhostzone.biz.id`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
                }}
                style={{
                  background: '#DCFCE7',
                  border: '1px solid #86EFAC',
                  color: '#15803D',
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginLeft: 'auto'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
                <span>Bagikan</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL KOMENTAR (COMMENTS DRAWER) */}
      {selectedPostForComments && (
        <div className="modal-sheet">
          <div className="modal-sheet-content" style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column', borderRadius: '20px 20px 0 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.08em' }}>KOMENTAR POS</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{selectedPostForComments.title}</h3>
              </div>
              <button onClick={() => setSelectedPostForComments(null)} style={{ border: 'none', background: '#E2E8F0', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 800 }}>✕</button>
            </div>

            {/* Comments List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px', paddingRight: '4px' }}>
              {loadingComments ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px' }}>Memuat komentar...</div>
              ) : commentsList.length > 0 ? (
                commentsList.map((comm) => (
                  <div key={comm.id} style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                        {comm.user_name}
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{comm.formatted_date}</span>
                    </div>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', margin: 0 }}>{comm.comment_text}</p>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
                  Belum ada komentar. Jadilah yang pertama memberikan komentar!
                </div>
              )}
            </div>

            {/* Input Form New Comment */}
            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="Tulis komentar Anda di sini..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                required
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1.5px solid #0284c7', fontSize: '0.88rem' }}
              />
              <button type="submit" style={{ background: '#0284c7', color: 'white', border: 'none', padding: '0 16px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>KIRIM</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE POST MODAL */}
      {showPostModal && (
        <div className="modal-sheet">
          <div className="modal-sheet-content" style={{ borderRadius: '20px 20px 0 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Bagikan Sesi Paddle
              </h3>
              <button onClick={() => setShowPostModal(false)} style={{ border: 'none', background: '#E2E8F0', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 800 }}>✕</button>
            </div>

            <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Lokasi Spot SUP</label>
                <input type="text" value={spotName} onChange={(e) => setSpotName(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Judul & Pengalaman Paddle</label>
                <input type="text" placeholder="Contoh: Dayung pagi ombak tenang Samalona!" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Jarak Tempuh</label>
                <input type="text" value={distance} onChange={(e) => setDistance(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Foto Sesi Paddle (Upload / Link URL)</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    placeholder="https://... atau Unggah dari HP" 
                    value={imageUrl} 
                    onChange={(e) => setImageUrl(e.target.value)} 
                    style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }} 
                  />
                  <label
                    style={{
                      background: '#0284c7',
                      color: 'white',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('image', file);
                        formData.append('category', 'posts');
                        try {
                          const res = await fetch('/api/upload_image.php', {
                            method: 'POST',
                            body: formData
                          });
                          const data = await res.json();
                          if (data.success && data.image_url) {
                            setImageUrl(data.image_url);
                            alert('Foto sesi paddle berhasil diunggah!');
                          } else {
                            alert(data.message || 'Gagal mengunggah foto.');
                          }
                        } catch (err) {
                          alert('Gagal mengunggah foto.');
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              <button type="submit" className="btn-cta-jumbo" style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                <span>BAGIKAN KE KOMUNITAS</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
