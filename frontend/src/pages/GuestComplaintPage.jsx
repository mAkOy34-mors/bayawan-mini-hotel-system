// GuestComplaintPage.jsx – Guest complaint submission and tracking
import { useState, useEffect } from 'react';
import { Alert } from '../components/ui/Alert';
import { useAlert } from '../hooks/useAlert';
import { API_BASE } from '../constants/config';
import {
  AlertTriangle, Send, CheckCircle2, Clock, XCircle,
  MessageSquare, Phone, Mail, ChevronDown, ChevronUp,
  RefreshCw, Plus, Eye, Search, Star,
  User, Flag, Volume2, Wrench, Tv, Wind, Droplet,
  Users, Coffee, Shield, Home, MoreHorizontal,
  Calendar, CornerDownRight, Headphones, Building2,
  Sparkles, Loader2
} from 'lucide-react';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  :root {
    --gold:       #C9A84C;
    --gold-dark:  #9a7a2e;
    --gold-bg:    rgba(201,168,76,0.1);
    --bg:         #f4f6f8;
    --surface:    #ffffff;
    --surface2:   #f8f9fb;
    --text:       #1a1f2e;
    --text-sub:   #4a5568;
    --text-muted: #8a96a8;
    --border:     #e2e8f0;
    --green:      #2d9b6f;
    --green-bg:   rgba(45,155,111,0.1);
    --red:        #dc3545;
    --red-bg:     rgba(220,53,69,0.1);
    --blue:       #3b82f6;
    --blue-bg:    rgba(59,130,246,0.1);
    --orange:     #f59e0b;
    --orange-bg:  rgba(245,158,11,0.1);
    --purple:     #8b5cf6;
    --purple-bg:  rgba(139,92,246,0.1);
  }

  * { box-sizing:border-box; scrollbar-width:thin; scrollbar-color:rgba(201,168,76,0.3) #f0f0f0; }
  *::-webkit-scrollbar { width:5px; }
  *::-webkit-scrollbar-track { background:#f0f0f0; border-radius:99px; }
  *::-webkit-scrollbar-thumb { background:rgba(201,168,76,0.4); border-radius:99px; }

  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin   { to{transform:rotate(360deg)} }
  @keyframes slideUp{ from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

  .complaint-root {
    min-height:100vh; background:var(--bg); font-family:'DM Sans',sans-serif;
    color:var(--text); -webkit-font-smoothing:antialiased; padding:2rem 2.25rem;
  }
  @media(max-width:768px){ .complaint-root { padding:1.25rem 1rem; } }

  .complaint-hd { margin-bottom:1.6rem; animation:fadeUp .4s cubic-bezier(.22,1,.36,1) both; }
  .complaint-title { font-family:'Cormorant Garamond',serif; font-size:1.9rem; font-weight:600; color:var(--text); margin:0 0 .18rem; display:flex; align-items:center; gap:.5rem; }
  .complaint-sub   { font-size:.82rem; color:var(--text-muted); }

  .complaint-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:1.5rem; }
  @media(max-width:900px){ .complaint-stats { grid-template-columns:repeat(2,1fr); } }

  .complaint-stat {
    background:var(--surface); border:1px solid var(--border); border-radius:14px;
    padding:1rem 1.15rem; position:relative; overflow:hidden;
    box-shadow:0 2px 8px rgba(0,0,0,.04); animation:fadeUp .45s cubic-bezier(.22,1,.36,1) both;
    transition:transform .2s,box-shadow .2s;
  }
  .complaint-stat:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,.1); }
  .complaint-stat::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; }
  .complaint-stat.red::before    { background:linear-gradient(to right,#dc2626,#f87171); }
  .complaint-stat.orange::before { background:linear-gradient(to right,#f59e0b,#fbbf24); }
  .complaint-stat.green::before  { background:linear-gradient(to right,#059669,#34d399); }
  .complaint-stat.blue::before   { background:linear-gradient(to right,#2563eb,#60a5fa); }

  .complaint-stat-icon {
    width:34px; height:34px; border-radius:9px; margin-bottom:.55rem;
    display:flex; align-items:center; justify-content:center;
  }
  .complaint-stat.red   .complaint-stat-icon { background:rgba(220,38,38,0.12); color:#dc2626; }
  .complaint-stat.orange .complaint-stat-icon { background:rgba(245,158,11,0.12); color:#f59e0b; }
  .complaint-stat.green .complaint-stat-icon { background:rgba(45,155,111,0.12); color:#2d9b6f; }
  .complaint-stat.blue  .complaint-stat-icon { background:rgba(59,130,246,0.12); color:#3b82f6; }

  .complaint-stat-label { font-size:.67rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--text-muted); margin-bottom:.3rem; }
  .complaint-stat-val   { font-family:'Cormorant Garamond',serif; font-size:1.85rem; font-weight:600; color:var(--text); line-height:1; }

  .complaint-grid { display:grid; grid-template-columns:1fr 360px; gap:1rem; }
  @media(max-width:1024px){ .complaint-grid { grid-template-columns:1fr; } }

  .complaint-panel {
    background:var(--surface); border:1px solid var(--border); border-radius:16px;
    overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.04); animation:fadeUp .45s cubic-bezier(.22,1,.36,1) both;
    margin-bottom:1rem;
  }
  .complaint-panel-hd {
    display:flex; align-items:center; justify-content:space-between;
    padding:.95rem 1.25rem; border-bottom:1px solid var(--border); background:var(--surface2);
  }
  .complaint-panel-title { font-family:'Cormorant Garamond',serif; font-size:1rem; font-weight:600; color:var(--text); display:flex; align-items:center; gap:.5rem; }
  .complaint-panel-body  { padding:1.25rem; }

  .complaint-filter-bar { display:flex; gap:.75rem; flex-wrap:wrap; margin-bottom:1rem; align-items:center; }
  .complaint-search-wrap { position:relative; flex:1; min-width:160px; }
  .complaint-search-ico { position:absolute; left:.75rem; top:50%; transform:translateY(-50%); color:var(--text-muted); }
  .complaint-search {
    width:100%; background:var(--surface2); border:1px solid var(--border);
    color:var(--text); border-radius:10px; padding:.6rem .85rem .6rem 2.2rem; font-size:.82rem;
    font-family:'DM Sans',sans-serif; outline:none; transition:border-color .18s,box-shadow .18s;
  }
  .complaint-search:focus { border-color:var(--gold); background:#fff; box-shadow:0 0 0 3px rgba(201,168,76,0.1); }

  .complaint-chip {
    padding:.35rem .85rem; border-radius:99px; font-size:.73rem; font-weight:600;
    font-family:'DM Sans',sans-serif; cursor:pointer; transition:all .18s;
    border:1px solid var(--border); background:#fff; color:var(--text-muted);
  }
  .complaint-chip:hover { border-color:var(--gold); color:var(--gold-dark); }

  .complaint-card {
    background:var(--surface); border:1px solid var(--border); border-radius:14px;
    margin-bottom:.85rem; overflow:hidden; transition:all .2s;
    animation:fadeUp .3s cubic-bezier(.22,1,.36,1) both;
  }
  .complaint-card:hover { border-color:rgba(201,168,76,0.3); box-shadow:0 4px 16px rgba(0,0,0,.08); }
  .complaint-card::before { content:''; display:block; height:3px; }
  .complaint-card.status-PENDING::before   { background:linear-gradient(to right,#f59e0b,#fbbf24); }
  .complaint-card.status-IN_PROGRESS::before { background:linear-gradient(to right,#3b82f6,#60a5fa); }
  .complaint-card.status-RESOLVED::before  { background:linear-gradient(to right,#059669,#34d399); }
  .complaint-card.status-CLOSED::before    { background:linear-gradient(to right,#64748b,#94a3b8); }

  .complaint-card-hd {
    display:flex; align-items:center; justify-content:space-between;
    padding:1rem 1.25rem; flex-wrap:wrap; gap:.5rem;
  }
  .complaint-card-body { padding:0 1.25rem .9rem; }
  .complaint-title { font-size:.9rem; font-weight:700; color:var(--text); margin-bottom:.35rem; }
  .complaint-desc { font-size:.78rem; color:var(--text-sub); line-height:1.55; margin-bottom:.65rem; }
  .complaint-meta { display:flex; gap:.75rem; font-size:.7rem; color:var(--text-muted); flex-wrap:wrap; margin-bottom:.5rem; }
  .complaint-response {
    margin-top:.65rem; padding:.65rem .85rem; background:var(--surface2);
    border-radius:10px; border-left:3px solid var(--gold);
    font-size:.75rem; color:var(--text-sub); line-height:1.5;
  }
  .complaint-expand-btn {
    background:none; border:none; color:var(--text-muted); cursor:pointer;
    display:flex; align-items:center; gap:.25rem; font-size:.7rem;
    font-family:'DM Sans',sans-serif; padding:.3rem .6rem; border-radius:7px;
    transition:all .15s;
  }
  .complaint-expand-btn:hover { background:var(--surface2); color:var(--text); }

  .complaint-field { display:flex; flex-direction:column; gap:.4rem; margin-bottom:.85rem; }
  .complaint-label {
    font-size:.68rem; text-transform:uppercase; letter-spacing:.08em;
    color:var(--text-muted); font-weight:700;
  }
  .complaint-label .req { color:var(--red); margin-left:.2rem; }
  .complaint-input, .complaint-select, .complaint-textarea {
    background:#fff; border:1px solid var(--border); color:var(--text);
    border-radius:10px; padding:.65rem .9rem; font-size:.85rem;
    font-family:'DM Sans',sans-serif; outline:none;
    transition:border-color .2s,box-shadow .2s;
  }
  .complaint-input:focus, .complaint-select:focus, .complaint-textarea:focus {
    border-color:var(--gold); box-shadow:0 0 0 3px rgba(201,168,76,0.12);
  }
  .complaint-textarea { resize:vertical; min-height:100px; }
  .complaint-select {
    appearance:none;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238a96a8' fill='none' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:right .85rem center; padding-right:2.2rem;
  }

  .complaint-submit-btn {
    width:100%; padding:.78rem; border:none; border-radius:12px;
    background:linear-gradient(135deg,#9a7a2e,#C9A84C); color:#fff;
    font-family:'DM Sans',sans-serif; font-size:.88rem; font-weight:600;
    cursor:pointer; transition:all .22s; display:flex; align-items:center;
    justify-content:center; gap:.5rem; margin-top:.65rem;
    box-shadow:0 2px 8px rgba(201,168,76,0.28);
  }
  .complaint-submit-btn:hover:not(:disabled) {
    background:linear-gradient(135deg,#b09038,#dfc06e);
    transform:translateY(-1px);
    box-shadow:0 4px 14px rgba(201,168,76,0.32);
  }
  .complaint-submit-btn:disabled { opacity:.5; cursor:not-allowed; }

  .complaint-spinner { width:15px; height:15px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }

  .complaint-success { text-align:center; padding:1.5rem; }
  .complaint-success-icon { width:64px; height:64px; border-radius:50%; background:var(--green-bg); display:flex; align-items:center; justify-content:center; margin:0 auto .85rem; }
  .complaint-success-title { font-family:'Cormorant Garamond',serif; font-size:1.35rem; font-weight:600; color:var(--text); margin-bottom:.3rem; }
  .complaint-success-sub { font-size:.8rem; color:var(--text-muted); margin-bottom:.85rem; }

  .complaint-contact-card {
    background:var(--surface); border:1px solid var(--border); border-radius:12px;
    padding:1rem; text-align:center; transition:all .2s; cursor:pointer;
    margin-bottom:.65rem;
  }
  .complaint-contact-card:last-child { margin-bottom:0; }
  .complaint-contact-card:hover { transform:translateY(-2px); box-shadow:0 4px 12px rgba(0,0,0,.08); border-color:rgba(201,168,76,0.3); }
  .complaint-contact-icon { width:48px; height:48px; border-radius:12px; background:var(--gold-bg); display:flex; align-items:center; justify-content:center; margin:0 auto .65rem; color:var(--gold-dark); }
  .complaint-contact-name { font-weight:700; font-size:.85rem; color:var(--text); margin-bottom:.12rem; }
  .complaint-contact-detail { font-size:.72rem; color:var(--text-muted); }

  .complaint-empty { text-align:center; padding:2.5rem; color:var(--text-muted); }
  .complaint-empty-icon { display:flex; justify-content:center; margin-bottom:.75rem; opacity:.3; }

  .complaint-timeline { margin-top:.65rem; padding-top:.65rem; border-top:1px dashed var(--border); }
  .complaint-timeline-item { display:flex; gap:.6rem; margin-top:.5rem; font-size:.7rem; }
  .complaint-timeline-dot { width:8px; height:8px; border-radius:50%; margin-top:4px; flex-shrink:0; }

  .room-info-box {
    background:var(--surface2);
    border-radius:12px;
    padding:.75rem;
    margin-bottom:.85rem;
    display:flex;
    justify-content:space-between;
    align-items:center;
    border:1px solid var(--border);
  }
  .room-info-label {
    font-size:.65rem;
    text-transform:uppercase;
    letter-spacing:.08em;
    color:var(--text-muted);
    font-weight:700;
  }
  .room-info-value {
    font-size:.9rem;
    font-weight:700;
    color:var(--gold-dark);
  }
`;

// Complaint Types with Lucide Icons
const COMPLAINT_TYPES = [
  { value: 'NOISE', label: 'Noise Complaint', icon: Volume2, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  { value: 'CLEANING', label: 'Cleaning Issue', icon: Sparkles, color: '#2d9b6f', bg: 'rgba(45,155,111,0.12)' },
  { value: 'AC', label: 'Air Conditioning', icon: Wind, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { value: 'TV', label: 'TV/Entertainment', icon: Tv, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { value: 'PLUMBING', label: 'Plumbing Issue', icon: Droplet, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { value: 'STAFF', label: 'Staff Behavior', icon: Users, color: '#dc3545', bg: 'rgba(220,53,69,0.12)' },
  { value: 'AMENITIES', label: 'Amenities Missing', icon: Coffee, color: '#9a7a2e', bg: 'rgba(201,168,76,0.12)' },
  { value: 'SECURITY', label: 'Security Concern', icon: Shield, color: '#dc2626', bg: 'rgba(220,38,38,0.12)' },
  { value: 'OTHER', label: 'Other', icon: MoreHorizontal, color: '#64748b', bg: '#f1f5f9' },
];

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', icon: Clock, color: '#f59e0b', bg: 'var(--orange-bg)' },
  IN_PROGRESS: { label: 'In Progress', icon: RefreshCw, color: '#3b82f6', bg: 'var(--blue-bg)' },
  RESOLVED: { label: 'Resolved', icon: CheckCircle2, color: '#2d9b6f', bg: 'var(--green-bg)' },
  CLOSED: { label: 'Closed', icon: XCircle, color: '#64748b', bg: '#f1f5f9' },
};

export function GuestComplaintPage({ token, user }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);
  const [activeRoom, setActiveRoom] = useState('');
  const [loadingRoom, setLoadingRoom] = useState(true);
  
  const [form, setForm] = useState({
    complaintType: 'OTHER',
    title: '',
    description: '',
    preferredContact: 'EMAIL',
  });

  const { alert, showAlert } = useAlert();

  const guestName = user?.fullName || user?.username || user?.email?.split('@')[0] || 'Guest';

  // Fetch the actual room number from active booking
  useEffect(() => {
    const fetchActiveRoom = async () => {
      if (!token) return;
      
      setLoadingRoom(true);
      try {
        const response = await fetch(`${API_BASE}/bookings/my-bookings/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.ok) {
          const bookings = await response.json();
          const today = new Date().toISOString().split('T')[0];
          
          const activeBooking = bookings.find(b => 
            b.status === 'CHECKED_IN' &&
            b.checkInDate <= today && 
            b.checkOutDate >= today
          );
          
          if (activeBooking) {
            let roomNum = activeBooking.roomNumber || 
                         activeBooking.room_number || 
                         activeBooking.room?.roomNumber || 
                         activeBooking.room?.room_number;
            
            if (roomNum) {
              setActiveRoom(String(roomNum));
            } else {
              setActiveRoom('');
            }
          } else {
            setActiveRoom('');
          }
        }
      } catch (error) {
        console.error('Failed to fetch active room:', error);
        setActiveRoom('');
      } finally {
        setLoadingRoom(false);
      }
    };
    
    fetchActiveRoom();
  }, [token]);

  // Load complaints
  const loadComplaints = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/complaints/guest/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setComplaints(Array.isArray(data) ? data : []);
      } else {
        setComplaints([]);
      }
    } catch (error) {
      console.error('Failed to load complaints:', error);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadComplaints();
    }
  }, [token]);

  // Submit complaint
  const submitComplaint = async () => {
    if (!form.title.trim()) {
      showAlert('Please enter a title for your complaint', 'error');
      return;
    }
    if (!form.description.trim()) {
      showAlert('Please describe your complaint', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        complaint_type: form.complaintType,
        title: form.title.trim(),
        description: form.description.trim(),
        preferred_contact: form.preferredContact,
      };
      
      if (activeRoom && activeRoom.trim() !== '') {
        payload.room_number = activeRoom;
      }

      const response = await fetch(`${API_BASE}/complaints/guest/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        setForm({
          complaintType: 'OTHER',
          title: '',
          description: '',
          preferredContact: 'EMAIL',
        });
        await loadComplaints();
        setTimeout(() => setSubmitted(false), 3000);
        showAlert('Complaint submitted successfully!', 'success');
      } else {
        const errorMessage = data.message || data.error || 'Failed to submit complaint';
        showAlert(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Submit error:', error);
      showAlert('Network error. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getComplaintTypeInfo = (type) => {
    return COMPLAINT_TYPES.find(t => t.value === type) || COMPLAINT_TYPES[8];
  };

  const getStatusInfo = (status) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const filteredComplaints = complaints.filter(c => {
    const matchSearch = !search ||
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase()) ||
      c.id?.toString().includes(search);
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'PENDING').length,
    inProgress: complaints.filter(c => c.status === 'IN_PROGRESS').length,
    resolved: complaints.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length,
  };

  const contacts = [
    { name: 'Front Desk', detail: '+63 32 888 8888', icon: Headphones, action: 'tel', phone: '+63328888888' },
    { name: 'Customer Support', detail: 'support@cebugrand.ph', icon: Mail, action: 'email', email: 'support@cebugrand.ph' },
    { name: 'Duty Manager', detail: '+63 32 888 8899', icon: User, action: 'tel', phone: '+63328888899' },
  ];

  const displayRoom = activeRoom || (loadingRoom ? 'Loading...' : 'Not checked in');

  return (
    <div className="complaint-root">
      <style>{css}</style>
      <Alert alert={alert} />

      <div className="complaint-hd">
        <div className="complaint-title">
          <MessageSquare size={24} color="var(--gold-dark)" />
          Guest Complaints & Feedback
        </div>
        <div className="complaint-sub">
          Submit a complaint or request — our team will respond promptly
        </div>
      </div>

      {/* Stats */}
      <div className="complaint-stats">
        <div className="complaint-stat red" style={{ animationDelay: '0s' }}>
          <div className="complaint-stat-icon"><AlertTriangle size={16} /></div>
          <div className="complaint-stat-label">Total Complaints</div>
          <div className="complaint-stat-val">{stats.total}</div>
        </div>
        <div className="complaint-stat orange" style={{ animationDelay: '0.06s' }}>
          <div className="complaint-stat-icon"><Clock size={16} /></div>
          <div className="complaint-stat-label">Pending</div>
          <div className="complaint-stat-val">{stats.pending}</div>
        </div>
        <div className="complaint-stat blue" style={{ animationDelay: '0.12s' }}>
          <div className="complaint-stat-icon"><RefreshCw size={16} /></div>
          <div className="complaint-stat-label">In Progress</div>
          <div className="complaint-stat-val">{stats.inProgress}</div>
        </div>
        <div className="complaint-stat green" style={{ animationDelay: '0.18s' }}>
          <div className="complaint-stat-icon"><CheckCircle2 size={16} /></div>
          <div className="complaint-stat-label">Resolved</div>
          <div className="complaint-stat-val">{stats.resolved}</div>
        </div>
      </div>

      <div className="complaint-grid">
        {/* Left Column - Complaint List */}
        <div>
          <div className="complaint-panel" style={{ marginBottom: 0 }}>
            <div className="complaint-panel-hd">
              <div className="complaint-panel-title">
                <Eye size={16} /> My Complaints
              </div>
              <button className="complaint-chip" onClick={loadComplaints} style={{ padding: '.3rem .7rem' }}>
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
            <div className="complaint-panel-body">
              <div className="complaint-filter-bar">
                <div className="complaint-search-wrap">
                  <Search size={13} className="complaint-search-ico" />
                  <input
                    className="complaint-search"
                    placeholder="Search complaints..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <select
                  className="complaint-select"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  style={{ width: 'auto', minWidth: 120 }}
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <Loader2 size={24} style={{ animation: 'spin 0.7s linear infinite', color: 'var(--gold)' }} />
                  <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '.65rem' }}>Loading complaints...</div>
                </div>
              ) : filteredComplaints.length === 0 ? (
                <div className="complaint-empty">
                  <div className="complaint-empty-icon"><MessageSquare size={44} strokeWidth={1} /></div>
                  <div style={{ fontSize: '.82rem' }}>No complaints found</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: '.25rem' }}>
                    Submit a complaint using the form
                  </div>
                </div>
              ) : (
                filteredComplaints.map((complaint, idx) => {
                  const typeInfo = getComplaintTypeInfo(complaint.complaint_type || complaint.complaintType);
                  const statusInfo = getStatusInfo(complaint.status);
                  const StatusIcon = statusInfo.icon;
                  const TypeIcon = typeInfo.icon;
                  const isExpanded = expandedId === complaint.id;

                  return (
                    <div
                      key={complaint.id}
                      className={`complaint-card status-${complaint.status}`}
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <div className="complaint-card-hd">
                        <div className={`complaint-type-badge`} style={{ 
                          background: typeInfo.bg, 
                          color: typeInfo.color,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '.3rem',
                          padding: '.2rem .65rem',
                          borderRadius: '99px',
                          fontSize: '.65rem',
                          fontWeight: 700,
                          border: `1px solid ${typeInfo.color}25`
                        }}>
                          <TypeIcon size={12} /> {typeInfo.label}
                        </div>
                        <div className={`complaint-status-pill ${complaint.status}`} style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '.25rem',
                          padding: '.2rem .6rem',
                          borderRadius: '99px',
                          fontSize: '.65rem',
                          fontWeight: 700,
                          background: statusInfo.bg,
                          color: statusInfo.color
                        }}>
                          <StatusIcon size={10} /> {statusInfo.label}
                        </div>
                      </div>

                      <div className="complaint-card-body">
                        <div className="complaint-title">{complaint.title}</div>
                        <div className="complaint-desc">
                          {isExpanded ? complaint.description : complaint.description?.length > 100 ? complaint.description.substring(0, 100) + '...' : complaint.description}
                        </div>

                        <div className="complaint-meta">
                          <span><Calendar size={11} style={{ display: 'inline', marginRight: '.2rem' }} /> {formatDate(complaint.created_at || complaint.createdAt)}</span>
                          {complaint.room_number && <span><Building2 size={11} style={{ display: 'inline', marginRight: '.2rem' }} /> Room {complaint.room_number}</span>}
                          <span><Flag size={11} style={{ display: 'inline', marginRight: '.2rem' }} /> #{complaint.id}</span>
                        </div>

                        {complaint.response && (
                          <div className="complaint-response">
                            <strong style={{ color: 'var(--gold-dark)', fontSize: '.7rem', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                              <CornerDownRight size={12} /> Staff Response:
                            </strong>
                            {complaint.response}
                          </div>
                        )}

                        {isExpanded && complaint.timeline && complaint.timeline.length > 0 && (
                          <div className="complaint-timeline">
                            {complaint.timeline.map((item, i) => {
                              const itemStatus = getStatusInfo(item.status);
                              const ItemIcon = itemStatus.icon;
                              return (
                                <div key={i} className="complaint-timeline-item">
                                  <div className="complaint-timeline-dot" style={{ background: itemStatus.color }} />
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '.7rem', color: itemStatus.color, display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                                      <ItemIcon size={10} /> {itemStatus.label}
                                    </div>
                                    <div style={{ fontSize: '.68rem', color: 'var(--text-muted)' }}>{formatDate(item.created_at || item.timestamp)}</div>
                                    <div style={{ fontSize: '.72rem', marginTop: '.2rem' }}>{item.note}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <button
                          className="complaint-expand-btn"
                          onClick={() => setExpandedId(isExpanded ? null : complaint.id)}
                        >
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          {isExpanded ? 'Show less' : 'Show details'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Submit Form & Contacts */}
        <div>
          <div className="complaint-panel" style={{ marginBottom: '1rem' }}>
            <div className="complaint-panel-hd">
              <div className="complaint-panel-title">
                <Plus size={16} /> Submit Complaint
              </div>
            </div>
            <div className="complaint-panel-body">
              {submitted ? (
                <div className="complaint-success">
                  <div className="complaint-success-icon">
                    <CheckCircle2 size={32} color="var(--green)" />
                  </div>
                  <div className="complaint-success-title">Complaint Submitted!</div>
                  <div className="complaint-success-sub">
                    We've received your complaint. Our team will review it and respond within 24 hours.
                  </div>
                </div>
              ) : (
                <>
                  <div className="complaint-field">
                    <label className="complaint-label">Complaint Type <span className="req">*</span></label>
                    <select
                      className="complaint-select"
                      value={form.complaintType}
                      onChange={e => setForm({ ...form, complaintType: e.target.value })}
                    >
                      {COMPLAINT_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="complaint-field">
                    <label className="complaint-label">Title <span className="req">*</span></label>
                    <input
                      className="complaint-input"
                      placeholder="Brief summary of your issue"
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                    />
                  </div>

                  <div className="complaint-field">
                    <label className="complaint-label">Description <span className="req">*</span></label>
                    <textarea
                      className="complaint-textarea"
                      rows={4}
                      placeholder="Please provide detailed information about your complaint..."
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                    />
                  </div>

                  <div className="complaint-field">
                    <label className="complaint-label">Preferred Contact Method</label>
                    <select
                      className="complaint-select"
                      value={form.preferredContact}
                      onChange={e => setForm({ ...form, preferredContact: e.target.value })}
                    >
                      <option value="EMAIL">Email</option>
                      <option value="PHONE">Phone</option>
                      <option value="IN_PERSON">In Person at Front Desk</option>
                    </select>
                  </div>

                  <div className="room-info-box">
                    <div>
                      <div className="room-info-label">Current Room</div>
                      <div className="room-info-value">{displayRoom}</div>
                    </div>
                    <div>
                      <div className="room-info-label">Guest</div>
                      <div className="room-info-value">{guestName}</div>
                    </div>
                    <Building2 size={18} color="var(--gold-dark)" />
                  </div>

                  <button
                    className="complaint-submit-btn"
                    disabled={submitting || !form.title || !form.description}
                    onClick={submitComplaint}
                  >
                    {submitting ? (
                      <><Loader2 size={15} className="complaint-spinner" /> Submitting...</>
                    ) : (
                      <><Send size={15} /> Submit Complaint</>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Quick Contacts */}
          <div className="complaint-panel" style={{ marginBottom: 0 }}>
            <div className="complaint-panel-hd">
              <div className="complaint-panel-title">
                <Phone size={16} /> Quick Contacts
              </div>
            </div>
            <div className="complaint-panel-body">
              {contacts.map((contact, i) => {
                const IconComponent = contact.icon;
                const handleClick = () => {
                  if (contact.action === 'tel') {
                    window.location.href = `tel:${contact.phone}`;
                  } else if (contact.action === 'email') {
                    window.location.href = `mailto:${contact.email}`;
                  }
                };
                return (
                  <div key={i} className="complaint-contact-card" onClick={handleClick}>
                    <div className="complaint-contact-icon">
                      <IconComponent size={22} />
                    </div>
                    <div className="complaint-contact-name">{contact.name}</div>
                    <div className="complaint-contact-detail">{contact.detail}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info Note */}
          <div style={{
            marginTop: '1rem',
            padding: '.75rem 1rem',
            background: 'var(--gold-bg)',
            borderRadius: '12px',
            border: '1px solid rgba(201,168,76,0.25)',
            fontSize: '.72rem',
            color: 'var(--text-sub)',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '.5rem',
          }}>
            <Flag size={14} />
            For urgent matters, please call the front desk immediately.
          </div>
        </div>
      </div>
    </div>
  );
}