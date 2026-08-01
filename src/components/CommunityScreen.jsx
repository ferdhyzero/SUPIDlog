import React, { useState, useEffect } from 'react';

export default function CommunityScreen({ userId = 2, userName = 'Sapril SUPer' }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [spotName, setSpotName] = useState('Samalona Island');
  const [title, setTitle] = useState('');
  const [distance, setDistance] = useState('8.4 km');
  const [imageUrl, setImageUrl] = useState('');

  const [selectedPostForComments, setSelectedPostForComments] = useState(null);
  const [commentsList, setCommentsList] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const loadPosts = async () => {
    try {
      const res = await fetch(`/api/get_community.php?user_id=${userId}`);
      const data = await res.json();
      if (data.success) setPosts(data.posts);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [userId]);

  const handleToggleLike = async (postId) => {
    try {
      const res = await fetch('/api/like_post.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, post_id: postId })
      });
      const data = await res.json();
      if (data.success) {
        setPosts(posts.map(p => p.id === postId ? { ...p, likes_count: data.likes_count, is_liked_by_me: data.liked } : p));
      }
    } catch (e) {}
  };

  const handleOpenComments = async (post) => {
    setSelectedPostForComments(post);
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/get_comments.php?post_id=${post.id}`);
      const data = await res.json();
      if (data.success) setCommentsList(data.comments);
    } catch (e) {
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedPostForComments) return;

    try {
      const res = await fetch('/api/add_comment.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: selectedPostForComments.id, user_id: userId, user_name: userName, comment_text: newCommentText })
      });
      const data = await res.json();
      if (data.success) {
        setNewCommentText('');
        setPosts(posts.map(p => p.id === selectedPostForComments.id ? { ...p, comments_count: data.comments_count } : p));
        const resComm = await fetch(`/api/get_comments.php?post_id=${selectedPostForComments.id}`);
        const dataComm = await resComm.json();
        if (dataComm.success) setCommentsList(dataComm.comments);
      }
    } catch (e) {}
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!title) return;

    try {
      await fetch('/api/create_post.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, user_name: userName, spot_name: spotName, title, distance, image_url: imageUrl })
      });
      setShowPostModal(false);
      setTitle('');
      setImageUrl('');
      loadPosts();
    } catch (e) {
      setShowPostModal(false);
    }
  };

  return (
    <div style={{ width: '100%', padding: '12px 12px 24px 12px', display: 'flex', flexDirection: 'column', gap: '12px', boxSizing: 'border-box' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span>Community Feed</span>
        </h2>

        <button 
          onClick={() => setShowPostModal(true)}
          style={{ background: '#0284c7', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
        >
          + Post Sesi
        </button>
      </div>

      {/* Post List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {posts.map((post) => (
          <div key={post.id} className="card-clean" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0284c7', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)', display: 'block', fontWeight: 800 }}>{post.user_name}</strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{post.spot_name} • {post.formatted_date || 'Baru'}</span>
                </div>
              </div>

              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284c7', background: 'rgba(2, 132, 199, 0.1)', padding: '3px 8px', borderRadius: '9999px' }}>
                {post.distance_km}
              </span>
            </div>

            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '2px 0', color: 'var(--text-main)' }}>{post.title}</h4>

            {post.local_tips && (
              <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', color: '#166534', padding: '6px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>
                <strong>Tips:</strong> {post.local_tips}
              </div>
            )}

            {post.image_url && (
              <div style={{ width: '100%', maxHeight: '200px', borderRadius: '10px', overflow: 'hidden', margin: '2px 0' }}>
                <img src={post.image_url} alt="Paddle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #F1F5F9', paddingTop: '8px', marginTop: '2px', alignItems: 'center' }}>
              <button onClick={() => handleToggleLike(post.id)} style={{ background: post.is_liked_by_me ? '#FEF2F2' : 'transparent', border: post.is_liked_by_me ? '1px solid #FCA5A5' : '1px solid #E2E8F0', padding: '4px 10px', borderRadius: '9999px', color: post.is_liked_by_me ? '#EF4444' : 'var(--text-muted)', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill={post.is_liked_by_me ? "#EF4444" : "none"} stroke={post.is_liked_by_me ? "#EF4444" : "currentColor"} strokeWidth="2.2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                <span>{post.likes_count}</span>
              </button>

              <button onClick={() => handleOpenComments(post)} style={{ background: 'rgba(2, 132, 199, 0.08)', border: '1px solid rgba(2, 132, 199, 0.2)', padding: '4px 10px', borderRadius: '9999px', color: '#0284c7', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer' }}>
                {post.comments_count} Komentar
              </button>

              <button onClick={() => {
                const shareText = `Sesi SUP ${post.spot_name} oleh ${post.user_name}: ${post.title}\nhttps://supid.myhostzone.biz.id`;
                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
              }} style={{ background: '#DCFCE7', border: '1px solid #86EFAC', color: '#15803D', padding: '4px 10px', borderRadius: '9999px', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', marginLeft: 'auto' }}>
                Bagikan
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Komentar */}
      {selectedPostForComments && (
        <div className="modal-sheet">
          <div className="modal-sheet-content" style={{ borderRadius: '16px 16px 0 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Komentar</h3>
              <button onClick={() => setSelectedPostForComments(null)} style={{ border: 'none', background: '#E2E8F0', borderRadius: '50%', width: '26px', height: '26px' }}>✕</button>
            </div>

            <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
              {commentsList.map(comm => (
                <div key={comm.id} style={{ background: '#F8FAFC', padding: '8px 10px', borderRadius: '8px', fontSize: '0.8rem' }}>
                  <strong style={{ fontWeight: 800 }}>{comm.user_name}: </strong>{comm.comment_text}
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '6px' }}>
              <input type="text" placeholder="Tulis komentar..." value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)} required style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #0284c7', fontSize: '0.8rem' }} />
              <button type="submit" style={{ background: '#0284c7', color: 'white', border: 'none', padding: '0 12px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>Kirim</button>
            </form>
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      {showPostModal && (
        <div className="modal-sheet">
          <div className="modal-sheet-content" style={{ borderRadius: '16px 16px 0 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Post Sesi Dayung</h3>
              <button onClick={() => setShowPostModal(false)} style={{ border: 'none', background: '#E2E8F0', borderRadius: '50%', width: '26px', height: '26px' }}>✕</button>
            </div>

            <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input type="text" placeholder="Spot (Samalona, Sanur...)" value={spotName} onChange={(e) => setSpotName(e.target.value)} required style={{ padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }} />
              <input type="text" placeholder="Judul & Pengalaman" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }} />
              <input type="text" placeholder="Jarak (8.4 km)" value={distance} onChange={(e) => setDistance(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }} />
              <button type="submit" className="btn-cta-jumbo" style={{ marginTop: '4px' }}>Bagikan</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
