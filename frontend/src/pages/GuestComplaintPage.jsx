// GuestComplaintPage.jsx – Guest complaint submission and tracking
import { useState, useEffect } from 'react';
import { Alert } from '../components/ui/Alert';
import { useAlert } from '../hooks/useAlert';
import { API_BASE } from '../constants/config';
import {
  AlertTriangle, Send, CheckCircle2, Clock, XCircle,
  MessageSquare, Phone, Mail, ChevronDown, ChevronUp,
  RefreshCw, Plus, Eye, Search,
  User, Flag,
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
  @media(max-width:480px){ .complaint-stats { grid-template-columns:1fr 1fr; } }

  .complaint-stat {
    background:var(--surface); border:1px solid var(--border); border-radius:14px;
    padding:1rem 1.15rem; position:relative; overflow:hidden;
    box-shadow:0 1px 6px rgba(0,0,0,.05); animation:fadeUp .45s cubic-bezier(.22,1,.36,1) both;
    transition:transform .2s,box-shadow .2s;
  }
  .complaint-stat:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,.09); }
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
    background:var(--surface); border:1px solid var(--border); border-radius:14px;
    overflow:hidden; box-shadow:0 1px 6px rgba(0,0,0,.05); animation:fadeUp .45s cubic-bezier(.22,1,.36,1) both;
    margin-bottom:1rem;
  }
  .complaint-panel-hd {
    display:flex; align-items:center; justify-content:space-between;
    padding:.95rem 1.25rem; border-bottom:1px solid var(--border); background:var(--surface2);
  }
  .complaint-panel-title { font-family:'Cormorant Garamond',serif; font-size:1.05rem; font-weight:600; color:var(--text); display:flex; align-items:center; gap:.5rem; }
  .complaint-panel-body  { padding:1.25rem; }

  .complaint-filter-bar { display:flex; gap:.75rem; flex-wrap:wrap; margin-bottom:1rem; align-items:center; }
  .complaint-search-wrap { position:relative; flex:1; min-width:160px; }
  .complaint-search-ico { position:absolute; left:.75rem; top:50%; transform:translateY(-50%); color:var(--text-muted); }
  .complaint-search {
    width:100%; background:var(--surface2); border:1px solid var(--border);
    color:var(--text); border-radius:8px; padding:.6rem .85rem .6rem 2.2rem; font-size:.82rem;
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
    background:var(--surface); border:1px solid var(--border); border-radius:12px;
    margin-bottom:.85rem; overflow:hidden; transition:all .2s;
    animation:fadeUp .3s cubic-bezier(.22,1,.36,1) both;
  }
  .complaint-card:hover { border-color:rgba(201,168,76,0.3); box-shadow:0 4px 12px rgba(0,0,0,.08); }
  .complaint-card::before { content:''; display:block; height:3px; }
  .complaint-card.status-PENDING::before   { background:linear-gradient(to right,#f59e0b,#fbbf24); }
  .complaint-card.status-IN_PROGRESS::before { background:linear-gradient(to right,#3b82f6,#60a5fa); }
  .complaint-card.status-RESOLVED::before  { background:linear-gradient(to right,#059669,#34d399); }
  .complaint-card.status-CLOSED::before    { background:linear-gradient(to right,#64748b,#94a3b8); }

  .complaint-card-hd {
    display:flex; align-items:center; justify-content:space-between;
    padding:1rem 1.25rem; flex-wrap:wrap; gap:.5rem;
  }
  .complaint-type-badge {
    display:inline-flex; align-items:center; gap:.3rem;
    padding:.2rem .65rem; border-radius:99px; font-size:.65rem; font-weight:700;
  }
  .complaint-type-badge.NOISE     { background:rgba(139,92,246,0.12); color:#8b5cf6; border:1px solid rgba(139,92,246,0.25); }
  .complaint-type-badge.CLEANING  { background:rgba(45,155,111,0.12); color:#2d9b6f; border:1px solid rgba(45,155,111,0.25); }
  .complaint-type-badge.AC        { background:rgba(59,130,246,0.12); color:#3b82f6; border:1px solid rgba(59,130,246,0.25); }
  .complaint-type-badge.TV        { background:rgba(59,130,246,0.12); color:#3b82f6; border:1px solid rgba(59,130,246,0.25); }
  .complaint-type-badge.PLUMBING  { background:rgba(245,158,11,0.12); color:#f59e0b; border:1px solid rgba(245,158,11,0.25); }
  .complaint-type-badge.STAFF     { background:rgba(220,53,69,0.12); color:#dc3545; border:1px solid rgba(220,53,69,0.25); }
  .complaint-type-badge.AMENITIES { background:rgba(201,168,76,0.12); color:#9a7a2e; border:1px solid rgba(201,168,76,0.25); }
  .complaint-type-badge.SECURITY  { background:rgba(220,38,38,0.12); color:#dc2626; border:1px solid rgba(220,38,38,0.25); }
  .complaint-type-badge.OTHER     { background:#f1f5f9; color:#64748b; border:1px solid #e2e8f0; }

  .complaint-status-pill {
    display:inline-flex; align-items:center; gap:.25rem;
    padding:.2rem .6rem; border-radius:99px; font-size:.65rem; font-weight:700;
    text-transform:uppercase; letter-spacing:.04em;
  }
  .complaint-status-pill.PENDING     { background:var(--orange-bg); color:var(--orange); }
  .complaint-status-pill.IN_PROGRESS { background:var(--blue-bg); color:var(--blue); }
  .complaint-status-pill.RESOLVED    { background:var(--green-bg); color:var(--green); }
  .complaint-status-pill.CLOSED      { background:#f1f5f9; color:#64748b; }

  .complaint-card-body { padding:0 1.25rem .9rem; }
  .complaint-title { font-size:.9rem; font-weight:700; color:var(--text); margin-bottom:.35rem; }
  .complaint-desc { font-size:.78rem; color:var(--text-sub); line-height:1.55; margin-bottom:.65rem; }
  .complaint-meta { display:flex; gap:.75rem; font-size:.7rem; color:var(--text-muted); flex-wrap:wrap; }
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
    border-radius:8px; padding:.65rem .9rem; font-size:.85rem;
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
    width:100%; padding:.78rem; border:none; border-radius:10px;
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
  }
  .complaint-contact-card:hover { transform:translateY(-2px); box-shadow:0 4px 12px rgba(0,0,0,.08); border-color:rgba(201,168,76,0.3); }
  .complaint-contact-icon { width:48px; height:48px; border-radius:12px; background:var(--gold-bg); display:flex; align-items:center; justify-content:center; margin:0 auto .65rem; color:var(--gold-dark); }
  .complaint-contact-name { font-weight:700; font-size:.85rem; color:var(--text); margin-bottom:.12rem; }
  .complaint-contact-detail { font-size:.72rem; color:var(--text-muted); }

  .complaint-empty { text-align:center; padding:2.5rem; color:var(--text-muted); }
  .complaint-empty-icon { display:flex; justify-content:center; margin-bottom:.75rem; opacity:.3; }

  .complaint-timeline { margin-top:.65rem; padding-top:.65rem; border-top:1px dashed var(--border); }
  .complaint-timeline-item { display:flex; gap:.6rem; margin-top:.5rem; font-size:.7rem; }
  .complaint-timeline-dot { width:8px; height:8px; border-radius:50%; margin-top:4px; flex-shrink:0; }
`;

const COMPLAINT_TYPES = [
  { value: 'NOISE', label: 'Noise Complaint', icon: '🔊', color: '#8b5cf6' },
  { value: 'CLEANING', label: 'Cleaning Issue', icon: '🧹', color: '#2d9b6f' },
  { value: 'AC', label: 'Air Conditioning', icon: '❄️', color: '#3b82f6' },
  { value: 'TV', label: 'TV/Entertainment', icon: '📺', color: '#3b82f6' },
  { value: 'PLUMBING', label: 'Plumbing Issue', icon: '🚰', color: '#f59e0b' },
  { value: 'STAFF', label: 'Staff Behavior', icon: '👥', color: '#dc3545' },
  { value: 'AMENITIES', label: 'Amenities Missing', icon: '🍽️', color: '#9a7a2e' },
  { value: 'SECURITY', label: 'Security Concern', icon: '🛡️', color: '#dc2626' },
  { value: 'OTHER', label: 'Other', icon: '📝', color: '#64748b' },
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
    // GuestComplaintPage.jsx - Updated fetchActiveRoom function
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
      
      // Find active booking (CHECKED_IN status)
      const activeBooking = bookings.find(b => 
        b.status === 'CHECKED_IN' &&
        b.checkInDate <= today && 
        b.checkOutDate >= today
      );
      
      console.log('Active booking found:', activeBooking);
      
      if (activeBooking) {
        // Try multiple possible field names for room number
        let roomNum = null;
        
        // Check all possible locations for room number
        if (activeBooking.roomNumber) {
          roomNum = activeBooking.roomNumber;
        } else if (activeBooking.room_number) {
          roomNum = activeBooking.room_number;
        } else if (activeBooking.room?.roomNumber) {
          roomNum = activeBooking.room.roomNumber;
        } else if (activeBooking.room?.room_number) {
          roomNum = activeBooking.room.room_number;
        } else if (activeBooking.room?.number) {
          roomNum = activeBooking.room.number;
        } else if (activeBooking.room__room_number) {
          roomNum = activeBooking.room__room_number;
        }
        
        console.log('Found room number:', roomNum);
        
        if (roomNum) {
          setActiveRoom(String(roomNum));
        } else {
          console.warn('No room number in booking:', activeBooking);
          setActiveRoom('');
        }
      } else {
        console.log('No active CHECKED_IN booking found');
        setActiveRoom('');
      }
    } else {
      console.error('Failed to fetch bookings:', response.status);
      setActiveRoom('');
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
      
      // Only add room_number if we have one
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
        const errorMessage = data.message || data.error || Object.values(data).flat().join(', ') || 'Failed to submit complaint';
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
    { name: 'Front Desk', detail: '+63 32 888 8888', icon: '📞', action: 'tel' },
    { name: 'Customer Support', detail: 'support@cebugrand.ph', icon: '✉️', action: 'email' },
    { name: 'Duty Manager', detail: '+63 32 888 8899', icon: '👔', action: 'tel' },
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
                  <span className="complaint-search-ico"><Search size={13} /></span>
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
                  <div className="complaint-spinner" style={{ borderTopColor: 'var(--gold)', width: 24, height: 24 }} />
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
                  const isExpanded = expandedId === complaint.id;

                  return (
                    <div
                      key={complaint.id}
                      className={`complaint-card status-${complaint.status}`}
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <div className="complaint-card-hd">
                        <div className={`complaint-type-badge ${complaint.complaint_type || complaint.complaintType}`}>
                          <span>{typeInfo.icon}</span> {typeInfo.label}
                        </div>
                        <div className={`complaint-status-pill ${complaint.status}`}>
                          <StatusIcon size={10} /> {statusInfo.label}
                        </div>
                      </div>

                      <div className="complaint-card-body">
                        <div className="complaint-title">{complaint.title}</div>
                        <div className="complaint-desc">
                          {isExpanded ? complaint.description : complaint.description?.length > 100 ? complaint.description.substring(0, 100) + '...' : complaint.description}
                        </div>

                        <div className="complaint-meta">
                          <span>🆔 #{complaint.id}</span>
                          <span>📅 {formatDate(complaint.created_at || complaint.createdAt)}</span>
                          {complaint.room_number && <span>🏨 Room {complaint.room_number}</span>}
                        </div>

                        {complaint.response && (
                          <div className="complaint-response">
                            <strong style={{ color: 'var(--gold-dark)', fontSize: '.7rem' }}>📝 Staff Response:</strong><br />
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
                                    <div style={{ fontWeight: 600, fontSize: '.7rem', color: itemStatus.color }}>
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
                        <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
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

                  <div style={{ 
                    fontSize: '.72rem', 
                    color: 'var(--text-muted)', 
                    marginBottom: '.85rem', 
                    background: 'var(--surface2)', 
                    padding: '.65rem', 
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>🏨 Room: <strong>{displayRoom}</strong></span>
                    <span>👤 Guest: <strong>{guestName}</strong></span>
                  </div>

                  <button
                    className="complaint-submit-btn"
                    disabled={submitting || !form.title || !form.description}
                    onClick={submitComplaint}
                  >
                    {submitting ? (
                      <><div className="complaint-spinner" /> Submitting...</>
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
                const handleClick = () => {
                  if (contact.action === 'tel') {
                    window.location.href = `tel:${contact.detail.replace(/\D/g, '')}`;
                  } else if (contact.action === 'email') {
                    window.location.href = `mailto:${contact.detail}`;
                  }
                };
                return (
                  <div key={i} className="complaint-contact-card" onClick={handleClick} style={{ marginBottom: i < contacts.length - 1 ? '.65rem' : 0 }}>
                    <div className="complaint-contact-icon">
                      <span style={{ fontSize: '1.3rem' }}>{contact.icon}</span>
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
            padding: '.75rem',
            background: 'var(--gold-bg)',
            borderRadius: '10px',
            border: '1px solid rgba(201,168,76,0.25)',
            fontSize: '.72rem',
            color: 'var(--text-sub)',
            textAlign: 'center',
          }}>
            <Flag size={14} style={{ display: 'inline', marginRight: '.3rem', verticalAlign: 'middle' }} />
            For urgent matters, please call the front desk immediately.
          </div>
        </div>
      </div>
    </div>
  );
}