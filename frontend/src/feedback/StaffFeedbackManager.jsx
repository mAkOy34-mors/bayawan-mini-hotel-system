// src/feedback/StaffFeedbackManager.jsx
import { useState, useEffect } from 'react';
import {
  MessageCircle, Send, CheckCircle, Clock, AlertCircle, 
  Star, User, Calendar, Search, Reply, Check, X, Eye, Flag,
  Building2, Shield, ThumbsUp, Edit2, RefreshCw, Loader,
  TrendingUp, Award, Smile, Frown, Meh, Heart, Filter
} from 'lucide-react';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  :root {
    --gold: #C9A84C;
    --gold-dark: #9a7a2e;
    --gold-bg: rgba(201,168,76,0.1);
    --bg: #f4f6f8;
    --surface: #ffffff;
    --surface2: #f8f9fb;
    --text: #1a1f2e;
    --text-sub: #4a5568;
    --text-muted: #8a96a8;
    --border: #e2e8f0;
    --green: #2d9b6f;
    --green-bg: rgba(45,155,111,0.1);
    --red: #dc3545;
    --red-bg: rgba(220,53,69,0.1);
    --blue: #3b82f6;
    --blue-bg: rgba(59,130,246,0.1);
    --orange: #f59e0b;
    --orange-bg: rgba(245,158,11,0.1);
    --purple: #8b5cf6;
    --purple-bg: rgba(139,92,246,0.1);
    --pink: #ec4899;
  }

  * { box-sizing: border-box; scrollbar-width: thin; }

  .sfm-root {
    min-height: 100vh;
    background: var(--bg);
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
    padding: 1.5rem;
  }

  @media (max-width: 768px) {
    .sfm-root { padding: 1rem; }
  }

  /* Header */
  .sfm-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .sfm-title h1 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.8rem;
    font-weight: 600;
    margin: 0;
    color: var(--text);
  }

  .sfm-title p {
    margin: 0.25rem 0 0;
    color: var(--text-muted);
    font-size: 0.8rem;
  }

  .role-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 99px;
    font-weight: 600;
    font-size: 0.8rem;
  }

  .role-badge.receptionist {
    background: var(--blue-bg);
    color: var(--blue);
    border: 1px solid rgba(59,130,246,0.2);
  }

  .role-badge.admin {
    background: var(--purple-bg);
    color: var(--purple);
    border: 1px solid rgba(139,92,246,0.2);
  }

  /* Stats Cards */
  .sfm-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 1024px) {
    .sfm-stats { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 540px) {
    .sfm-stats { grid-template-columns: 1fr; }
  }

  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 1rem;
    transition: transform 0.2s, box-shadow 0.2s;
    position: relative;
    overflow: hidden;
  }

  .stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
  }

  .stat-card.total::before { background: linear-gradient(to right, #8b5cf6, #a78bfa); }
  .stat-card.pending::before { background: linear-gradient(to right, #f59e0b, #fbbf24); }
  .stat-card.responded::before { background: linear-gradient(to right, #2d9b6f, #34d399); }
  .stat-card.avg::before { background: linear-gradient(to right, #9a7a2e, #C9A84C); }

  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.09);
  }

  .stat-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.65rem;
  }

  .stat-icon.total { background: var(--purple-bg); color: var(--purple); }
  .stat-icon.pending { background: var(--orange-bg); color: var(--orange); }
  .stat-icon.responded { background: var(--green-bg); color: var(--green); }
  .stat-icon.avg { background: var(--gold-bg); color: var(--gold); }

  .stat-value {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.8rem;
    font-weight: 700;
    line-height: 1;
  }

  .stat-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    margin-top: 0.25rem;
  }

  /* Filters */
  .sfm-filters {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
  }

  @media (max-width: 768px) {
    .sfm-filters { flex-direction: column; align-items: stretch; }
  }

  .filter-tabs {
    display: flex;
    gap: 0.5rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 0.25rem;
  }

  .filter-tab {
    padding: 0.5rem 1rem;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--text-sub);
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .filter-tab:hover { background: var(--surface2); }
  .filter-tab.active {
    background: var(--gold);
    color: white;
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 0.5rem 0.75rem;
  }

  .search-box input {
    border: none;
    background: transparent;
    outline: none;
    font-size: 0.85rem;
    width: 200px;
  }

  .rating-filter {
    display: flex;
    gap: 0.25rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 0.25rem;
  }

  .rating-btn {
    padding: 0.25rem 0.6rem;
    border: none;
    background: transparent;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.7rem;
    display: flex;
    align-items: center;
    gap: 0.2rem;
    transition: all 0.2s;
  }

  .rating-btn.active {
    background: var(--gold);
    color: white;
  }

  .rating-btn:hover:not(.active) {
    background: var(--surface2);
  }

  .refresh-btn {
    padding: 0.5rem;
    border: 1px solid var(--border);
    background: var(--surface);
    border-radius: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .refresh-btn:hover {
    background: var(--surface2);
    border-color: var(--gold);
  }

  /* Feedback Cards */
  .feedback-grid {
    display: grid;
    gap: 1rem;
  }

  .feedback-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.2s;
  }

  .feedback-card:hover {
    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
  }

  .feedback-card.pending {
    border-left: 4px solid var(--orange);
  }

  .feedback-card.responded {
    border-left: 4px solid var(--green);
    opacity: 0.85;
  }

  .feedback-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1rem 1.25rem;
    background: var(--surface2);
    border-bottom: 1px solid var(--border);
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  @media (max-width: 768px) {
    .feedback-header { flex-direction: column; }
  }

  .guest-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .guest-name {
    font-weight: 700;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.95rem;
  }

  .guest-detail {
    font-size: 0.7rem;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .feedback-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .rating-display {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    background: var(--gold-bg);
    padding: 0.25rem 0.7rem;
    border-radius: 99px;
    font-weight: 700;
    font-size: 0.85rem;
    color: var(--gold-dark);
  }

  .status-badge {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.7rem;
    border-radius: 99px;
    font-size: 0.65rem;
    font-weight: 600;
  }

  .status-badge.pending {
    background: var(--orange-bg);
    color: var(--orange);
  }

  .status-badge.responded {
    background: var(--green-bg);
    color: var(--green);
  }

  .feedback-body {
    padding: 1.25rem;
  }

  .feedback-comment {
    font-size: 0.9rem;
    line-height: 1.6;
    color: var(--text-sub);
    margin-bottom: 1rem;
    padding: 0.85rem;
    background: var(--surface2);
    border-radius: 12px;
    font-style: italic;
    position: relative;
  }

  .feedback-comment::before {
    content: '"';
    font-size: 2rem;
    color: var(--gold);
    opacity: 0.3;
    position: absolute;
    top: 0.25rem;
    left: 0.5rem;
    font-family: serif;
  }

  .response-section {
    margin-top: 1rem;
    padding: 0.85rem;
    background: var(--green-bg);
    border-radius: 12px;
    border-left: 3px solid var(--green);
  }

  .response-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--green);
    margin-bottom: 0.5rem;
  }

  .response-text {
    font-size: 0.85rem;
    line-height: 1.5;
    color: var(--text-sub);
  }

  .response-meta {
    font-size: 0.65rem;
    color: var(--text-muted);
    margin-top: 0.5rem;
  }

  /* Reply Form */
  .reply-form {
    margin-top: 1rem;
  }

  .reply-textarea {
    width: 100%;
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 0.75rem;
    font-family: inherit;
    font-size: 0.85rem;
    resize: vertical;
    transition: all 0.2s;
  }

  .reply-textarea:focus {
    outline: none;
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgba(201,168,76,0.1);
  }

  .reply-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  /* Buttons */
  .btn-primary {
    background: linear-gradient(135deg, #9a7a2e, #C9A84C);
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    color: white;
    font-weight: 600;
    font-size: 0.8rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
  }

  .btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    opacity: 0.9;
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: var(--surface);
    border: 1px solid var(--border);
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    transition: all 0.2s;
  }

  .btn-secondary:hover {
    background: var(--surface2);
    border-color: var(--gold);
  }

  .btn-respond {
    background: var(--blue);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    font-weight: 500;
    margin-top: 0.5rem;
    transition: all 0.2s;
  }

  .btn-respond:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }

  /* Admin Actions */
  .admin-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border);
  }

  .action-btn {
    background: transparent;
    border: 1px solid var(--border);
    padding: 0.35rem 0.75rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.7rem;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    transition: all 0.2s;
  }

  .action-btn:hover { background: var(--surface2); }
  .action-btn.delete { color: var(--red); border-color: var(--red); }
  .action-btn.delete:hover { background: var(--red-bg); }
  .action-btn.escalate { color: var(--orange); border-color: var(--orange); }
  .action-btn.escalate:hover { background: var(--orange-bg); }

  /* Loading & Empty States */
  .loading-spinner {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border);
    border-top-color: var(--gold);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(100px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    background: var(--surface);
    border-radius: 16px;
    color: var(--text-muted);
  }

  .empty-state-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 1rem;
    background: var(--surface2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--gold);
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: var(--surface);
    border-radius: 20px;
    width: 90%;
    max-width: 450px;
    overflow: hidden;
    animation: slideIn 0.2s ease;
  }

  .modal-header {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--surface2);
  }

  .modal-header h3 {
    margin: 0;
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.1rem;
  }

  .modal-body { padding: 1.25rem; }
  .modal-footer {
    padding: 1rem 1.25rem;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  /* Toast */
  .toast {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 10px;
    color: white;
    z-index: 1001;
    animation: slideIn 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }

  .toast.success { background: var(--green); }
  .toast.error { background: var(--red); }
  .toast.info { background: var(--blue); }
`;

const StaffFeedbackManager = ({ token, user, role = 'receptionist' }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState(null);
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState(null);
  
  const isAdmin = role === 'admin';

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const API_BASE = 'http://localhost:8000/api/v1';

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const url = isAdmin 
        ? `${API_BASE}/feedback/all/`
        : `${API_BASE}/feedback/unresponded/`;
      
      const response = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch feedback');
      
      const data = await response.json();
      setFeedbacks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      showToast('Failed to load feedback', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchFeedbacks();
  }, [token, isAdmin]);

  const handleRespond = async (feedbackId) => {
    if (!responseText.trim()) {
      showToast('Please enter a response', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/feedback/${feedbackId}/respond/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ response: responseText })
      });

      if (response.ok) {
        showToast('Response sent successfully!');
        fetchFeedbacks();
        setRespondingTo(null);
        setResponseText('');
      } else {
        throw new Error('Failed to send response');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      showToast('Failed to send response', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFeedback) return;
    
    try {
      const response = await fetch(`${API_BASE}/feedback/${selectedFeedback.id}/delete/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        showToast('Feedback deleted successfully');
        fetchFeedbacks();
        setShowDeleteModal(false);
        setSelectedFeedback(null);
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
      showToast('Failed to delete feedback', 'error');
    }
  };

  const handleEscalate = async (feedbackId) => {
    try {
      const response = await fetch(`${API_BASE}/feedback/${feedbackId}/escalate/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ escalated: true })
      });

      if (response.ok) {
        showToast('Feedback escalated to admin');
        fetchFeedbacks();
      } else {
        throw new Error('Failed to escalate');
      }
    } catch (error) {
      console.error('Error escalating:', error);
      showToast('Failed to escalate', 'error');
    }
  };

  const filteredFeedbacks = feedbacks.filter(fb => {
    if (filter === 'pending' && fb.is_responded) return false;
    if (filter === 'responded' && !fb.is_responded) return false;
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesGuest = fb.user_name?.toLowerCase().includes(search);
      const matchesComment = fb.comment?.toLowerCase().includes(search);
      const matchesRoom = fb.room_number?.toLowerCase().includes(search);
      if (!matchesGuest && !matchesComment && !matchesRoom) return false;
    }
    
    if (ratingFilter && fb.overall_rating !== ratingFilter) return false;
    
    return true;
  });

  const stats = {
    total: feedbacks.length,
    pending: feedbacks.filter(f => !f.is_responded).length,
    responded: feedbacks.filter(f => f.is_responded).length,
    avgRating: feedbacks.length > 0 
      ? (feedbacks.reduce((sum, f) => sum + f.overall_rating, 0) / feedbacks.length).toFixed(1)
      : 0
  };

  const getRatingEmoji = (rating) => {
    if (rating >= 4.5) return <Smile size={14} />;
    if (rating >= 3) return <Meh size={14} />;
    return <Frown size={14} />;
  };

  if (loading) {
    return (
      <div className="sfm-root">
        <style>{css}</style>
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="sfm-root">
      <style>{css}</style>

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' && <ThumbsUp size={16} />}
          {toast.type === 'error' && <AlertCircle size={16} />}
          {toast.type === 'info' && <CheckCircle size={16} />}
          {toast.message}
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Feedback</h3>
              <button className="action-btn" onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this feedback? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleDelete} style={{ background: 'var(--red)' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="sfm-header">
        <div className="sfm-title">
          <h1>Guest Feedback</h1>
          <p>Monitor and respond to guest reviews</p>
        </div>
        <div className={`role-badge ${isAdmin ? 'admin' : 'receptionist'}`}>
          {isAdmin ? <Shield size={16} /> : <Building2 size={16} />}
          {isAdmin ? 'Administrator' : 'Receptionist'}
        </div>
      </div>

      <div className="sfm-stats">
        <div className="stat-card total">
          <div className="stat-icon total"><MessageCircle size={18} /></div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Feedback</div>
        </div>
        <div className="stat-card pending">
          <div className="stat-icon pending"><Clock size={18} /></div>
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Pending Response</div>
        </div>
        <div className="stat-card responded">
          <div className="stat-icon responded"><CheckCircle size={18} /></div>
          <div className="stat-value">{stats.responded}</div>
          <div className="stat-label">Responded</div>
        </div>
        <div className="stat-card avg">
          <div className="stat-icon avg"><Star size={18} /></div>
          <div className="stat-value">{stats.avgRating} ★</div>
          <div className="stat-label">Average Rating</div>
        </div>
      </div>

      <div className="sfm-filters">
        <div className="filter-tabs">
          <button className={`filter-tab ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>
            <Clock size={14} /> Pending ({stats.pending})
          </button>
          <button className={`filter-tab ${filter === 'responded' ? 'active' : ''}`} onClick={() => setFilter('responded')}>
            <CheckCircle size={14} /> Responded ({stats.responded})
          </button>
          {isAdmin && (
            <button className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
              <Eye size={14} /> All ({stats.total})
            </button>
          )}
        </div>

        <div className="search-box">
          <Search size={16} />
          <input type="text" placeholder="Search guest, room, or comment..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <div className="rating-filter">
          {[5,4,3,2,1].map(r => (
            <button key={r} className={`rating-btn ${ratingFilter === r ? 'active' : ''}`} onClick={() => setRatingFilter(ratingFilter === r ? null : r)}>
              <Star size={10} /> {r}
            </button>
          ))}
        </div>

        <button className="refresh-btn" onClick={fetchFeedbacks} title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="feedback-grid">
        {filteredFeedbacks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <CheckCircle size={32} />
            </div>
            <h3>No feedback found</h3>
            <p>All caught up! Great job! 🎉</p>
          </div>
        ) : (
          filteredFeedbacks.map(feedback => (
            <div key={feedback.id} className={`feedback-card ${!feedback.is_responded ? 'pending' : 'responded'}`}>
              <div className="feedback-header">
                <div className="guest-info">
                  <div className="guest-name">
                    <User size={14} />
                    {feedback.user_name || 'Guest'}
                    <span style={{ fontSize: '0.7rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>
                      • Booking #{feedback.booking_reference || feedback.booking}
                    </span>
                  </div>
                  <div className="guest-detail">
                    <span><Calendar size={12} /> {new Date(feedback.created_at).toLocaleDateString()}</span>
                    <span><Building2 size={12} /> Room {feedback.room_number || 'N/A'}</span>
                    {feedback.room_type && <span>{feedback.room_type}</span>}
                  </div>
                </div>
                <div className="feedback-meta">
                  <div className="rating-display">
                    {getRatingEmoji(feedback.overall_rating)}
                    <Star size={12} fill="#C9A84C" />
                    {feedback.overall_rating}/5
                  </div>
                  <div className={`status-badge ${!feedback.is_responded ? 'pending' : 'responded'}`}>
                    {!feedback.is_responded ? <Clock size={10} /> : <CheckCircle size={10} />}
                    {!feedback.is_responded ? 'Pending' : 'Responded'}
                  </div>
                </div>
              </div>

              <div className="feedback-body">
                <div className="feedback-comment">
                  {feedback.comment || 'No comment provided'}
                </div>

                {feedback.is_responded && feedback.response ? (
                  <div className="response-section">
                    <div className="response-header">
                      <Reply size={12} />
                      Response from {feedback.responded_by_name || 'Staff'}
                    </div>
                    <div className="response-text">{feedback.response}</div>
                    <div className="response-meta">
                      {new Date(feedback.responded_at).toLocaleString()}
                    </div>
                  </div>
                ) : respondingTo === feedback.id ? (
                  <div className="reply-form">
                    <textarea
                      className="reply-textarea"
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Type your response here..."
                      rows="3"
                      autoFocus
                    />
                    <div className="reply-actions">
                      <button className="btn-secondary" onClick={() => { setRespondingTo(null); setResponseText(''); }}>
                        Cancel
                      </button>
                      <button className="btn-primary" onClick={() => handleRespond(feedback.id)} disabled={submitting}>
                        {submitting ? <Loader size={14} className="spinner" /> : <><Send size={14} /> Send Response</>}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button className="btn-respond" onClick={() => setRespondingTo(feedback.id)}>
                    <MessageCircle size={14} /> Respond to Guest
                  </button>
                )}

                {isAdmin && (
                  <div className="admin-actions">
                    {!feedback.escalated && (
                      <button className="action-btn escalate" onClick={() => handleEscalate(feedback.id)}>
                        <Flag size={12} /> Escalate
                      </button>
                    )}
                    <button className="action-btn delete" onClick={() => { setSelectedFeedback(feedback); setShowDeleteModal(true); }}>
                      <X size={12} /> Delete
                    </button>
                    {feedback.is_responded && (
                      <button className="action-btn" onClick={() => { setRespondingTo(feedback.id); setResponseText(feedback.response || ''); }}>
                        <Edit2 size={12} /> Edit Response
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StaffFeedbackManager;