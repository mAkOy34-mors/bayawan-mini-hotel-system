// ReceptionistRoomBoard.jsx - With Create Task button for DIRTY rooms
import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { SHARED_CSS, Spinner, useToast, Toast } from '../admin/adminShared';
import {
  BedDouble, RefreshCw, CheckCircle2, XCircle, Wrench,
  Sparkles, AlertTriangle, Filter, ClipboardList, PlusCircle
} from 'lucide-react';

import { API_BASE as BASE } from '../constants/config';

const h = (t) => ({ Authorization: `Bearer ${t}`, 'ngrok-skip-browser-warning': 'true' });
const hj = (t) => ({ ...h(t), 'Content-Type': 'application/json' });

const ROOM_TYPES = ['ALL', 'STANDARD', 'DELUXE', 'SUITE', 'PRESIDENTIAL', 'VILLA'];

const ROOM_STATUS = {
  CLEAN: { label: 'Clean', color: '#2d9b6f', bg: 'rgba(45,155,111,0.1)', border: 'rgba(45,155,111,0.25)', Icon: CheckCircle2 },
  DIRTY: { label: 'Dirty', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', Icon: AlertTriangle },
  MAINTENANCE: { label: 'Maintenance', color: '#dc3545', bg: 'rgba(220,53,69,0.1)', border: 'rgba(220,53,69,0.25)', Icon: Wrench },
  OCCUPIED: { label: 'Occupied', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)', Icon: BedDouble },
  READY: { label: 'Ready', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', Icon: CheckCircle2 },
  VACANT: { label: 'Vacant', color: '#8a96a8', bg: 'rgba(138,150,168,0.1)', border: 'rgba(138,150,168,0.25)', Icon: BedDouble },
};

const EXTRA_CSS = `
  .rb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: .75rem; }
  .rb-card {
    background: #fff; border: 1.5px solid var(--border); border-radius: 12px;
    padding: .9rem 1rem; position: relative; overflow: hidden;
    transition: transform .2s, box-shadow .2s;
    animation: fadeUp .4s cubic-bezier(.22,1,.36,1) both;
    display: flex;
    flex-direction: column;
  }
  .rb-card:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,.08); }
  .rb-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
  .rb-card.status-CLEAN::before { background: linear-gradient(to right, #059669, #34d399); }
  .rb-card.status-DIRTY::before { background: linear-gradient(to right, #f59e0b, #fbbf24); }
  .rb-card.status-MAINTENANCE::before { background: linear-gradient(to right, #dc2626, #f87171); }
  .rb-card.status-OCCUPIED::before { background: linear-gradient(to right, #3b82f6, #60a5fa); }
  .rb-card.status-READY::before { background: linear-gradient(to right, #10b981, #34d399); }
  .rb-card.status-VACANT::before { background: linear-gradient(to right, #64748b, #94a3b8); }
  .rb-num { font-family: 'Cormorant Garamond', serif; font-size: 1.55rem; font-weight: 600; color: var(--text); line-height: 1; margin-bottom: .25rem; }
  .rb-type { font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); margin-bottom: .5rem; }
  .rb-status-badge {
    display: inline-flex; align-items: center; gap: .28rem;
    padding: .18rem .55rem; border-radius: 99px; font-size: .63rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: .04em; border: 1px solid transparent;
    margin-bottom: .55rem;
  }
  .rb-price { font-size: .72rem; color: var(--text-muted); margin-top: .35rem; margin-bottom: .5rem; }
  .rb-availability {
    font-size: .6rem;
    padding: .15rem .4rem;
    border-radius: 99px;
    display: inline-block;
    margin-bottom: .5rem;
  }
  .rb-availability.available { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.25); }
  .rb-availability.unavailable { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.25); }
  .rb-update-btn {
    width: 100%;
    display: flex; align-items: center; gap: .3rem;
    padding: .4rem .6rem;
    border-radius: 7px;
    font-size: .68rem;
    font-weight: 600;
    cursor: pointer;
    transition: all .15s;
    border: 1px solid;
    justify-content: center;
    margin-bottom: 0.5rem;
  }
  .rb-task-btn {
    width: 100%;
    display: flex; align-items: center; gap: .3rem;
    padding: .4rem .6rem;
    border-radius: 7px;
    font-size: .68rem;
    font-weight: 600;
    cursor: pointer;
    transition: all .15s;
    justify-content: center;
    background: linear-gradient(135deg, #f59e0b, #fbbf24);
    color: white;
    border: none;
    margin-top: 0.25rem;
  }
  .rb-task-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(245,158,11,0.3);
  }
  .rb-task-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .task-created-toast {
    position: fixed; bottom: 20px; right: 20px;
    background: #10b981; color: white; padding: 12px 20px;
    border-radius: 10px; z-index: 1000;
    animation: slideIn 0.3s ease;
    display: flex; align-items: center; gap: 8px; font-size: 0.85rem;
  }
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  .ap-spin-sm {
    width: 12px;
    height: 12px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export function ReceptionistRoomBoard({ token }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [avFilter, setAvFilter] = useState('ALL');
  const [updating, setUpdating] = useState(null);
  const [creatingTask, setCreatingTask] = useState(null);
  const [showTaskToast, setShowTaskToast] = useState(false);
  const [taskMessage, setTaskMessage] = useState('');
  
  const { toast, show } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const roomsRes = await fetch(`${BASE}/receptionist/rooms/`, { headers: h(token) });
      const roomsData = await roomsRes.json().catch(() => []);
      setRooms(Array.isArray(roomsData) ? roomsData : []);
    } catch (err) {
      console.error('Error loading data:', err);
      show('Failed to load rooms', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]);

  // ReceptionistRoomBoard.jsx - Updated createCleaningTask function

// ReceptionistRoomBoard.jsx - Simplified createCleaningTask
const createCleaningTask = async (room) => {
  setCreatingTask(room.id);
  try {
    const taskData = {
      title: `Clean Room ${room.roomNumber}`,
      description: `Room ${room.roomNumber} (${room.roomType}) requires cleaning.`,
      taskType: 'ROOM_CLEANING',
      priority: 'HIGH',
      roomNumber: room.roomNumber,
      // Remove assignedTo - backend will auto-assign
      notes: `Room marked as DIRTY. Cleaning task created by receptionist.`
    };
    
    console.log('Task data:', taskData);
    
    const response = await fetch(`${BASE}/housekeepers/tasks/create/`, {
      method: 'POST',
      headers: hj(token),
      body: JSON.stringify(taskData)
    });
    
    const responseData = await response.json();
    
    if (response.ok) {
      const assignedName = responseData.assigned_to_name || 'housekeeper';
      setTaskMessage(`Cleaning task created for Room ${room.roomNumber} and assigned to ${assignedName}`);
      setShowTaskToast(true);
      setTimeout(() => setShowTaskToast(false), 3000);
      show(`🧹 Cleaning task created for Room ${room.roomNumber} (assigned to ${assignedName})`, 'success');
    } else {
      show(responseData.error || 'Failed to create task', 'error');
    }
  } catch (error) {
    console.error('Error creating task:', error);
    show('Network error. Please try again.', 'error');
  } finally {
    setCreatingTask(null);
  }
};

  const updateRoomStatus = async (room, newStatus) => {
    setUpdating(room.id);
    try {
      const response = await fetch(`${BASE}/receptionist/rooms/${room.id}/status/`, {
        method: 'PATCH',
        headers: hj(token),
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        setRooms(prev => prev.map(r => 
          r.id === room.id ? { ...r, status: newStatus } : r
        ));
        
        show(`Room ${room.roomNumber} status updated to ${newStatus}`, 'success');
      } else {
        const error = await response.json();
        show(error.error || 'Failed to update status', 'error');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      show('Network error. Please try again.', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusConfig = (status) => {
    return ROOM_STATUS[status] || ROOM_STATUS.CLEAN;
  };

  const filtered = rooms.filter(r => {
    if (typeFilter !== 'ALL' && r.roomType !== typeFilter) return false;
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (avFilter !== 'ALL') {
      if (avFilter === 'AVAILABLE' && !r.available) return false;
      if (avFilter === 'UNAVAILABLE' && r.available) return false;
    }
    return true;
  });

  const counts = {
    total: rooms.length,
    clean: rooms.filter(r => r.status === 'CLEAN').length,
    dirty: rooms.filter(r => r.status === 'DIRTY').length,
    maintenance: rooms.filter(r => r.status === 'MAINTENANCE').length,
    occupied: rooms.filter(r => r.status === 'OCCUPIED').length,
    available: rooms.filter(r => r.available).length,
    unavailable: rooms.filter(r => !r.available).length,
  };

  return (
    <div className="ap-root">
      <style>{SHARED_CSS}{EXTRA_CSS}</style>
      <Toast toast={toast} />

      {showTaskToast && (
        <div className="task-created-toast">
          <ClipboardList size={16} />
          {taskMessage}
        </div>
      )}

      <div className="ap-hd">
        <div>
          <h1 className="ap-title" style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <BedDouble size={22} color="var(--gold-dark)"/> Room Status Board
          </h1>
          <p className="ap-sub">View and update room status | Dirty rooms: {counts.dirty}</p>
        </div>
        <button className="ap-btn-ghost" onClick={load}><RefreshCw size={14}/> Refresh</button>
      </div>

      {/* Stats */}
      <div className="ap-stats" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
        {[
          { label: 'Total', value: counts.total, color: 'gold' },
          { label: 'Clean', value: counts.clean, color: 'green' },
          { label: 'Dirty', value: counts.dirty, color: 'orange' },
          { label: 'Occupied', value: counts.occupied, color: 'blue' },
          { label: 'Available', value: counts.available, color: 'teal' },
          { label: 'Unavailable', value: counts.unavailable, color: 'red' },
        ].map((s, i) => (
          <div key={i} className={`ap-stat ${s.color}`} style={{ padding: '.8rem 1rem' }}>
            <div className="ap-stat-lbl">{s.label}</div>
            <div className="ap-stat-val" style={{ fontSize: '1.5rem' }}>{loading ? '—' : s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
        <select className="ap-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}>
          {ROOM_TYPES.map(t => <option key={t} value={t}>{t === 'ALL' ? 'All Types' : t}</option>)}
        </select>
        <select className="ap-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}>
          <option value="ALL">All Status</option>
          <option value="CLEAN">Clean</option>
          <option value="DIRTY">Dirty</option>
          <option value="OCCUPIED">Occupied</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="READY">Ready</option>
          <option value="VACANT">Vacant</option>
        </select>
        <select className="ap-select" value={avFilter} onChange={e => setAvFilter(e.target.value)} style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}>
          <option value="ALL">All Availability</option>
          <option value="AVAILABLE">Available Only</option>
          <option value="UNAVAILABLE">Unavailable Only</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '.85rem' }}>No rooms match filters</div>
      ) : (
        <div className="rb-grid">
          {filtered.map((r, i) => {
            const statusConfig = getStatusConfig(r.status);
            const StatusIcon = statusConfig.Icon;
            const isDirty = r.status === 'DIRTY';
            
            return (
              <div key={r.id} className={`rb-card status-${r.status || 'CLEAN'}`} style={{ animationDelay: `${i * 0.03}s` }}>
                <div className="rb-type">{r.roomType}</div>
                <div className="rb-num">#{r.roomNumber}</div>
                
                <div className="rb-status-badge" style={{ background: statusConfig.bg, color: statusConfig.color, borderColor: statusConfig.border }}>
                  <StatusIcon size={10} />
                  {statusConfig.label}
                </div>
                
                <div className={`rb-availability ${r.available ? 'available' : 'unavailable'}`}>
                  {r.available ? '✓ Available' : '✗ Not Available'}
                </div>
                
                <div className="rb-price">₱{Number(r.pricePerNight || 0).toLocaleString()}/night</div>
                
                {/* Status Update Dropdown */}
                <select
                  className="rb-update-btn"
                  value={r.status || 'CLEAN'}
                  onChange={(e) => updateRoomStatus(r, e.target.value)}
                  disabled={updating === r.id}
                  style={{
                    color: statusConfig.color,
                    background: statusConfig.bg,
                    borderColor: statusConfig.border,
                    cursor: updating === r.id ? 'wait' : 'pointer'
                  }}
                >
                  <option value="CLEAN">✓ Clean</option>
                  <option value="DIRTY">🧹 Dirty</option>
                  <option value="OCCUPIED">👤 Occupied</option>
                  <option value="MAINTENANCE">🔧 Maintenance</option>
                  <option value="READY">✅ Ready</option>
                  <option value="VACANT">🏠 Vacant</option>
                </select>
                
                {/* Create Task Button - Only for DIRTY rooms */}
                {isDirty && (
                  <button
                    className="rb-task-btn"
                    onClick={() => createCleaningTask(r)}
                    disabled={creatingTask === r.id}
                  >
                    {creatingTask === r.id ? (
                      <div className="ap-spin-sm" />
                    ) : (
                      <PlusCircle size={12} />
                    )}
                    Create Cleaning Task
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}