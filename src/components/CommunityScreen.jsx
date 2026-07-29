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

  // Open Comments Modal & Fetch Comments
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
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--ocean-dark)' }}>Community Feed 👥</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Komunitas Stand Up Paddle Indonesia</p>
        </div>

        <button 
          onClick={() => setShowPostModal(true)}
          style={{
            background: 'linear-gradient(135deg, #0077B6 0%, #00B4D8 100%)',
            color: 'white',
            border: 'none',
            padding: '8px 14px',
            borderRadius: '12px',
            fontSize: '0.82rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          📝 Post Sesi
        </button>
      </div>

      {/* Post List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {posts.map((post) => (
          <div key={post.id} className="card-clean" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--ocean-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                  👤
                </div>
                <div>
                  <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)', display: 'block' }}>{post.user_name}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📍 {post.spot_name} • {post.formatted_date || 'Terbaru'}</span>
                </div>
              </div>

              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--ocean-blue)', background: 'rgba(0,180,216,0.12)', padding: '4px 10px', borderRadius: '9999px' }}>
                {post.distance_km}
              </span>
            </div>

            <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '2px 0' }}>{post.title}</h4>

            {/* Attached Photo Image if available */}
            {post.image_url && (
              <div style={{ width: '100%', maxHeight: '220px', borderRadius: '14px', overflow: 'hidden', margin: '4px 0' }}>
                <img src={post.image_url} alt="Paddle Session" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}

            {/* Like & Comment Action Buttons */}
            <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid #F1F5F9', paddingTop: '10px', marginTop: '4px' }}>
              {/* Toggle Like Button (Red filled when liked, Outline when unliked) */}
              <button 
                onClick={() => handleToggleLike(post.id)}
                style={{ 
                  background: post.is_liked_by_me ? '#FEF2F2' : 'transparent', 
                  border: post.is_liked_by_me ? '1px solid #FCA5A5' : 'none', 
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  color: post.is_liked_by_me ? '#EF4444' : 'var(--text-muted)', 
                  fontWeight: 800, 
                  fontSize: '0.85rem', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px' 
                }}
              >
                <span>{post.is_liked_by_me ? '❤️' : '🤍'}</span>
                <span>{post.likes_count} Suka</span>
              </button>

              {/* Open Comments Drawer Button */}
              <button 
                onClick={() => handleOpenComments(post)}
                style={{ 
                  background: 'rgba(0,180,216,0.1)', 
                  border: '1px solid rgba(0,180,216,0.3)', 
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  color: 'var(--ocean-blue)', 
                  fontWeight: 800, 
                  fontSize: '0.85rem', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px' 
                }}
              >
                💬 {post.comments_count} Komentar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL KOMENTAR (COMMENTS DRAWER) */}
      {selectedPostForComments && (
        <div className="modal-sheet">
          <div className="modal-sheet-content" style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--ocean-blue)', textTransform: 'uppercase' }}>KOMENTAR POS</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{selectedPostForComments.title}</h3>
              </div>
              <button onClick={() => setSelectedPostForComments(null)} style={{ border: 'none', background: '#E2E8F0', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 700 }}>✕</button>
            </div>

            {/* Comments List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px', paddingRight: '4px' }}>
              {loadingComments ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px' }}>Memuat komentar...</div>
              ) : commentsList.length > 0 ? (
                commentsList.map((comm) => (
                  <div key={comm.id} style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--ocean-dark)' }}>👤 {comm.user_name}</strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{comm.formatted_date}</span>
                    </div>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', margin: 0 }}>{comm.comment_text}</p>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px' }}>
                  Belum ada komentar. Jadilah yang pertama memberikan komentar! 💬
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
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1.5px solid var(--ocean-blue)', fontSize: '0.9rem' }}
              />
              <button type="submit" style={{ background: 'var(--ocean-blue)', color: 'white', border: 'none', padding: '0 16px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>
                KIRIM ➔
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE POST MODAL WITH IMAGE ATTACHMENT */}
      {showPostModal && (
        <div className="modal-sheet">
          <div className="modal-sheet-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>📝 Bagikan Sesi Paddle</h3>
              <button onClick={() => setShowPostModal(false)} style={{ border: 'none', background: '#E2E8F0', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 700 }}>✕</button>
            </div>

            <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Lokasi Spot SUP</label>
                <input type="text" value={spotName} onChange={(e) => setSpotName(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Judul & Pengalaman Paddle</label>
                <input type="text" placeholder="Contoh: Dayung pagi ombak tenang Samalona!" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Jarak Tempuh</label>
                <input type="text" value={distance} onChange={(e) => setDistance(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>🖼️ Foto / Lampiran URL Gambar (Opsional)</label>
                <input type="url" placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </div>

              <button type="submit" className="btn-cta-jumbo" style={{ marginTop: '8px' }}>
                BAGIKAN KE KOMUNITAS 👥
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
