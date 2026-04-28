// ReceptionistRoomIssues.jsx — View housekeeper-reported room issues & dispatch to maintenance
import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle, RefreshCw, Search, Filter, CheckCircle2,
  Clock, Wrench, ChevronDown, X, Eye, ClipboardList,
  Zap, Droplets, Sofa, Tv2, DoorOpen, Wind, Bug, HelpCircle,
  Lightbulb, Send, User, Building2, CalendarClock, ShieldAlert,
  CheckCheck, XCircle, Loader2, SlidersHorizontal
} from 'lucide-react';
import { API_BASE as BASE } from '../constants/config';

// ── Helpers ────────────────────────────────────────────────────────────────────

const ISSUE_TYPE_META = {
  LIGHTS:       { label: 'Broken Lights',     Icon: Lightbulb,  color: '#f59e0b', bg: '#fffbeb' },
  PLUMBING:     { label: 'Plumbing Problem',   Icon: Droplets,   color: '#3b82f6', bg: '#eff6ff' },
  FURNITURE:    { label: 'Damaged Furniture',  Icon: Sofa,       color: '#8b5cf6', bg: '#f5f3ff' },
  ELECTRICAL:   { label: 'Electrical Issue',   Icon: Zap,        color: '#ef4444', bg: '#fef2f2' },
  TV_ELECTRONICS:{ label: 'TV/Electronics',    Icon: Tv2,        color: '#6366f1', bg: '#eef2ff' },
  DOOR_LOCK:    { label: 'Door/Lock Issue',    Icon: DoorOpen,   color: '#f97316', bg: '#fff7ed' },
  AC_ISSUE:     { label: 'AC/Heating Problem', Icon: Wind,       color: '#06b6d4', bg: '#ecfeff' },
  PEST_CONTROL: { label: 'Pest Issue',         Icon: Bug,        color: '#84cc16', bg: '#f7fee7' },
  OTHER:        { label: 'Other Issue',        Icon: HelpCircle, color: '#6b7280', bg: '#f9fafb' },
};

const PRIORITY_META = {
  HIGH:   { label: 'High',   color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   dot: '#ef4444' },
  MEDIUM: { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  dot: '#f59e0b' },
  LOW:    { label: 'Low',    color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   dot: '#22c55e' },
};

const STATUS_META = {
  PENDING:     { label: 'Pending',     Icon: Clock,        color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
  IN_PROGRESS: { label: 'In Progress', Icon: Loader2,      color: '#3b82f6', bg: 'rgba(59,130,246,0.1)'  },
  COMPLETED:   { label: 'Completed',   Icon: CheckCheck,   color: '#22c55e', bg: 'rgba(34,197,94,0.1)'   },
  REJECTED:    { label: 'Rejected',    Icon: XCircle,      color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
};

// Map issue types → task type for staff_tasks
const ISSUE_TO_TASK_TYPE = {
  LIGHTS:        'MAINTENANCE',
  PLUMBING:      'MAINTENANCE',
  FURNITURE:     'REPAIR',
  ELECTRICAL:    'MAINTENANCE',
  TV_ELECTRONICS:'MAINTENANCE',
  DOOR_LOCK:     'REPAIR',
  AC_ISSUE:      'MAINTENANCE',
  PEST_CONTROL:  'MAINTENANCE',
  OTHER:         'MAINTENANCE',
};

function Badge({ meta, value }) {
  const m = meta[value] || {};
  const StatusIcon = m.Icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 99, fontSize: '.68rem',
      fontWeight: 700, background: m.bg, color: m.color,
      border: `1px solid ${m.color}22`,
    }}>
      {StatusIcon && <StatusIcon size={10} style={value === 'IN_PROGRESS' ? { animation: 'spin .8s linear infinite' } : {}} />}
      {m.label || value}
    </span>
  );
}

function PriorityDot({ priority }) {
  const m = PRIORITY_META[priority] || PRIORITY_META.MEDIUM;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 99, fontSize: '.68rem',
      fontWeight: 700, background: m.bg, color: m.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot, display: 'inline-block' }} />
      {m.label}
    </span>
  );
}

// ── Dispatch Modal ──────────────────────────────────────────────────────────────

function DispatchModal({ issue, token, onClose, onSuccess }) {
  const [staffList,    setStaffList]    = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [taskTitle,    setTaskTitle]    = useState(`Fix: ${issue.title}`);
  const [taskDesc,     setTaskDesc]     = useState(issue.description || '');
  const [priority,     setPriority]     = useState(issue.priority || 'MEDIUM');
  const [note,         setNote]         = useState('');
  const [loading,      setLoading]      = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [error,        setError]        = useState('');

  // Fetch available maintenance staff
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await fetch(`${BASE}/staff/available/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        // Filter to maintenance dept only
        const maintenance = (data.staff || data || []).filter(s =>
          (s.department || '').toUpperCase() === 'MAINTENANCE' ||
          (s.role || '').toUpperCase() === 'MAINTENANCE'
        );
        setStaffList(maintenance);
      } catch {
        setError('Could not load maintenance staff.');
      } finally {
        setLoadingStaff(false);
      }
    };
    fetchStaff();
  }, [token]);

  const handleDispatch = async () => {
    if (!taskTitle.trim()) { setError('Task title is required.'); return; }
    setLoading(true); setError('');
    try {
      const body = {
        title: taskTitle.trim(),
        description: taskDesc.trim() || issue.description,
        task_type: ISSUE_TO_TASK_TYPE[issue.issue_type] || 'MAINTENANCE',
        priority,
        room_number: issue.room_number || '',
        note: note.trim() || undefined,
        source: 'room_issue',
        room_issue_id: issue.id,
      };
      if (selectedStaff) body.assigned_to = parseInt(selectedStaff, 10);

      const res = await fetch(`${BASE}/staff/tasks/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || d.error || 'Failed to create task.');
      }
      onSuccess();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const issueMeta = ISSUE_TYPE_META[issue.issue_type] || ISSUE_TYPE_META.OTHER;
  const IssueIcon = issueMeta.Icon;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '1rem', backdropFilter: 'blur(3px)',
    }}>
      <div style={{
        background: '#fff', borderRadius: 18, width: '100%', maxWidth: 520,
        boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', maxHeight: '90vh',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.2rem 1.4rem', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg,#1e3a5f,#2563eb)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(255,255,255,0.15)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Wrench size={18} color="#fff" />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '.92rem' }}>Dispatch Maintenance Task</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '.7rem' }}>
                Room {issue.room_number} · {issueMeta.label}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
            cursor: 'pointer', padding: 6, color: '#fff', display: 'flex',
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Issue Summary */}
        <div style={{
          margin: '1rem 1.4rem 0', padding: '.85rem 1rem',
          background: issueMeta.bg, border: `1px solid ${issueMeta.color}33`,
          borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <IssueIcon size={16} color={issueMeta.color} style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '.82rem', color: '#1a1f2e' }}>{issue.title}</div>
            <div style={{ fontSize: '.73rem', color: '#64748b', marginTop: 2 }}>{issue.description}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              <PriorityDot priority={issue.priority} />
              <span style={{ fontSize: '.68rem', color: '#8a96a8', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Building2 size={10} /> Room {issue.room_number}
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: '1rem 1.4rem', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8, padding: '.6rem .9rem', fontSize: '.78rem', color: '#dc2626', marginBottom: '.9rem',
            }}>⚠ {error}</div>
          )}

          <Label>Task Title</Label>
          <Input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="e.g. Fix broken AC unit" />

          <Label>Description</Label>
          <textarea
            value={taskDesc}
            onChange={e => setTaskDesc(e.target.value)}
            rows={3}
            style={textareaStyle}
            placeholder="Describe what needs to be done…"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 .75rem' }}>
            <div>
              <Label>Priority</Label>
              <select value={priority} onChange={e => setPriority(e.target.value)} style={selectStyle}>
                <option value="HIGH">🔴 High</option>
                <option value="MEDIUM">🟡 Medium</option>
                <option value="LOW">🟢 Low</option>
              </select>
            </div>
            <div>
              <Label>Assign To (Maintenance)</Label>
              <select value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)} style={selectStyle} disabled={loadingStaff}>
                <option value="">— Auto-assign —</option>
                {loadingStaff
                  ? <option disabled>Loading staff…</option>
                  : staffList.map(s => (
                    <option key={s.id || s.user} value={s.user || s.id}>
                      {s.full_name || s.username || `Staff #${s.id}`}
                    </option>
                  ))
                }
              </select>
            </div>
          </div>

          <Label>Internal Note <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span></Label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            style={textareaStyle}
            placeholder="Any additional instructions for the maintenance team…"
          />
        </div>

        {/* Footer */}
        <div style={{
          padding: '.9rem 1.4rem', borderTop: '1px solid #e2e8f0',
          display: 'flex', gap: '.6rem', justifyContent: 'flex-end', background: '#f8f9fb',
        }}>
          <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
          <button onClick={handleDispatch} disabled={loading} style={primaryBtnStyle}>
            {loading
              ? <><Loader2 size={14} style={{ animation: 'spin .8s linear infinite' }} /> Creating…</>
              : <><Send size={14} /> Dispatch Task</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail Modal ────────────────────────────────────────────────────────────────

function IssueDetailModal({ issue, token, onClose, onDispatch }) {
  const issueMeta = ISSUE_TYPE_META[issue.issue_type] || ISSUE_TYPE_META.OTHER;
  const IssueIcon = issueMeta.Icon;

  const canDispatch = ['PENDING', 'IN_PROGRESS'].includes(issue.status);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9990, padding: '1rem', backdropFilter: 'blur(2px)',
    }}>
      <div style={{
        background: '#fff', borderRadius: 18, width: '100%', maxWidth: 480,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', maxHeight: '90vh',
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem 1.2rem', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: issueMeta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${issueMeta.color}33`,
            }}>
              <IssueIcon size={18} color={issueMeta.color} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#1a1f2e' }}>{issue.title}</div>
              <div style={{ fontSize: '.7rem', color: '#8a96a8' }}>Room {issue.room_number} · Issue #{issue.id}</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: '#f1f5f9', border: 'none', borderRadius: 8,
            cursor: 'pointer', padding: 6, color: '#4a5568', display: 'flex',
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.1rem 1.2rem', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '.9rem' }}>
            <Badge meta={STATUS_META} value={issue.status} />
            <PriorityDot priority={issue.priority} />
            <span style={{
              padding: '3px 9px', borderRadius: 99, fontSize: '.68rem', fontWeight: 700,
              background: issueMeta.bg, color: issueMeta.color,
              border: `1px solid ${issueMeta.color}33`,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <IssueIcon size={10} />{issueMeta.label}
            </span>
          </div>

          <DetailRow icon={Building2} label="Room" value={`Room ${issue.room_number}`} />
          <DetailRow icon={User} label="Reported By" value={issue.reported_by_name || issue.reported_by_employee || 'Housekeeper'} />
          <DetailRow icon={CalendarClock} label="Reported At" value={issue.created_at ? new Date(issue.created_at).toLocaleString('en-PH') : '—'} />
          {issue.assigned_to_name && (
            <DetailRow icon={Wrench} label="Assigned To" value={issue.assigned_to_name} />
          )}

          <div style={{ marginTop: '.85rem' }}>
            <div style={{ fontSize: '.68rem', textTransform: 'uppercase', letterSpacing: '.08em', color: '#94a3b8', fontWeight: 700, marginBottom: 4 }}>Description</div>
            <div style={{
              background: '#f8f9fb', border: '1px solid #e2e8f0', borderRadius: 8,
              padding: '.75rem .9rem', fontSize: '.82rem', color: '#374151', lineHeight: 1.6,
            }}>
              {issue.description || 'No description provided.'}
            </div>
          </div>

          {issue.notes && (
            <div style={{ marginTop: '.75rem' }}>
              <div style={{ fontSize: '.68rem', textTransform: 'uppercase', letterSpacing: '.08em', color: '#94a3b8', fontWeight: 700, marginBottom: 4 }}>Notes</div>
              <div style={{
                background: '#fffbeb', border: '1px solid #fcd34d33', borderRadius: 8,
                padding: '.75rem .9rem', fontSize: '.82rem', color: '#374151', lineHeight: 1.6,
              }}>
                {issue.notes}
              </div>
            </div>
          )}

          {issue.resolution_notes && (
            <div style={{ marginTop: '.75rem' }}>
              <div style={{ fontSize: '.68rem', textTransform: 'uppercase', letterSpacing: '.08em', color: '#94a3b8', fontWeight: 700, marginBottom: 4 }}>Resolution</div>
              <div style={{
                background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8,
                padding: '.75rem .9rem', fontSize: '.82rem', color: '#374151', lineHeight: 1.6,
              }}>
                {issue.resolution_notes}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '.9rem 1.2rem', borderTop: '1px solid #e2e8f0',
          display: 'flex', gap: '.6rem', justifyContent: 'flex-end', background: '#f8f9fb',
        }}>
          <button onClick={onClose} style={cancelBtnStyle}>Close</button>
          {canDispatch && (
            <button onClick={() => { onClose(); onDispatch(issue); }} style={primaryBtnStyle}>
              <Wrench size={14} /> Dispatch to Maintenance
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '.45rem 0',
      borderBottom: '1px solid #f1f5f9',
    }}>
      <Icon size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
      <span style={{ fontSize: '.72rem', color: '#94a3b8', fontWeight: 600, minWidth: 90 }}>{label}</span>
      <span style={{ fontSize: '.8rem', color: '#374151', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

// ── Shared styles ───────────────────────────────────────────────────────────────

const inputStyle = {
  width: '100%', background: '#f8f9fb', border: '1px solid #e2e8f0',
  borderRadius: 8, padding: '.6rem .85rem', fontSize: '.82rem',
  fontFamily: 'inherit', color: '#1a1f2e', outline: 'none',
  marginBottom: '.8rem', display: 'block',
};
const textareaStyle = { ...inputStyle, resize: 'vertical', minHeight: 72 };
const selectStyle = { ...inputStyle, cursor: 'pointer' };
const cancelBtnStyle = {
  padding: '.55rem 1.1rem', borderRadius: 9, border: '1px solid #e2e8f0',
  background: '#fff', color: '#4a5568', fontFamily: 'inherit', fontSize: '.82rem',
  fontWeight: 600, cursor: 'pointer',
};
const primaryBtnStyle = {
  padding: '.55rem 1.2rem', borderRadius: 9, border: 'none',
  background: 'linear-gradient(135deg,#1e40af,#2563eb)', color: '#fff',
  fontFamily: 'inherit', fontSize: '.82rem', fontWeight: 700,
  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
  boxShadow: '0 3px 10px rgba(37,99,235,0.28)',
};

function Label({ children }) {
  return (
    <label style={{
      fontSize: '.67rem', textTransform: 'uppercase', letterSpacing: '.08em',
      color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: '.3rem',
    }}>
      {children}
    </label>
  );
}

function Input({ value, onChange, placeholder }) {
  return <input value={value} onChange={onChange} placeholder={placeholder} style={inputStyle} />;
}

// ── Main Component ──────────────────────────────────────────────────────────────

const CSS = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  .ri-card { animation: fadeIn .2s ease; }
  .ri-card:hover { border-color: #2563eb44 !important; box-shadow: 0 4px 20px rgba(37,99,235,0.08) !important; }
  .ri-dispatch-btn:hover { background: #1d4ed8 !important; transform: translateY(-1px); box-shadow: 0 5px 14px rgba(37,99,235,0.32) !important; }
  .ri-view-btn:hover { background: #e2e8f0 !important; }
  .ri-filter-select:focus { border-color: #60a5fa; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
`;

export function ReceptionistRoomIssues({ token }) {
  const [issues,      setIssues]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [search,      setSearch]      = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterType,  setFilterType]  = useState('ALL');
  const [viewIssue,   setViewIssue]   = useState(null);
  const [dispatchIssue, setDispatchIssue] = useState(null);
  const [successMsg,  setSuccessMsg]  = useState('');

  const fetchIssues = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${BASE}/housekeepers/room-issues/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load room issues.');
      const data = await res.json();
      setIssues(Array.isArray(data) ? data : data.results || data.issues || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  const handleDispatchSuccess = () => {
    setDispatchIssue(null);
    setSuccessMsg('✓ Maintenance task created and dispatched successfully!');
    fetchIssues();
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Filter logic
  const filtered = issues.filter(issue => {
    const searchLower = search.toLowerCase();
    const matchSearch = !search ||
      (issue.title || '').toLowerCase().includes(searchLower) ||
      (issue.room_number || '').toLowerCase().includes(searchLower) ||
      (issue.description || '').toLowerCase().includes(searchLower) ||
      (issue.reported_by_name || '').toLowerCase().includes(searchLower);
    const matchStatus   = filterStatus   === 'ALL' || issue.status   === filterStatus;
    const matchPriority = filterPriority === 'ALL' || issue.priority === filterPriority;
    const matchType     = filterType     === 'ALL' || issue.issue_type === filterType;
    return matchSearch && matchStatus && matchPriority && matchType;
  });

  // Stats
  const stats = {
    total:      issues.length,
    pending:    issues.filter(i => i.status === 'PENDING').length,
    inProgress: issues.filter(i => i.status === 'IN_PROGRESS').length,
    high:       issues.filter(i => i.priority === 'HIGH').length,
  };

  return (
    <div style={{ padding: '1.4rem', fontFamily: "'DM Sans', sans-serif", minHeight: '100%' }}>
      <style>{CSS}</style>

      {/* Success Banner */}
      {successMsg && (
        <div style={{
          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: 10, padding: '.75rem 1rem', marginBottom: '1rem',
          color: '#16a34a', fontWeight: 600, fontSize: '.82rem',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <CheckCircle2 size={16} />{successMsg}
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg,#dc2626,#ef4444)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 3px 10px rgba(220,38,38,0.25)',
            }}>
              <ShieldAlert size={17} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1a1f2e' }}>
                Room Issues
              </h2>
              <p style={{ margin: 0, fontSize: '.72rem', color: '#8a96a8' }}>
                Housekeeper-reported issues · Dispatch to Maintenance
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchIssues}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '.5rem .9rem',
            border: '1px solid #e2e8f0', borderRadius: 9, background: '#fff',
            color: '#4a5568', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <RefreshCw size={13} style={loading ? { animation: 'spin .8s linear infinite' } : {}} />
          Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: '.75rem', marginBottom: '1.2rem' }}>
        {[
          { label: 'Total Issues',  value: stats.total,      color: '#6366f1', bg: '#eef2ff', Icon: ClipboardList },
          { label: 'Pending',       value: stats.pending,    color: '#f59e0b', bg: '#fffbeb', Icon: Clock },
          { label: 'In Progress',   value: stats.inProgress, color: '#3b82f6', bg: '#eff6ff', Icon: Loader2 },
          { label: 'High Priority', value: stats.high,       color: '#ef4444', bg: '#fef2f2', Icon: AlertTriangle },
        ].map(({ label, value, color, bg, Icon }) => (
          <div key={label} style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
            padding: '.85rem 1rem', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9, background: bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon size={15} color={color} />
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1a1f2e', lineHeight: 1.1 }}>{value}</div>
              <div style={{ fontSize: '.65rem', color: '#8a96a8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
        padding: '.9rem 1rem', marginBottom: '1rem',
        display: 'flex', gap: '.6rem', flexWrap: 'wrap', alignItems: 'center',
      }}>
        <SlidersHorizontal size={14} color="#8a96a8" style={{ flexShrink: 0 }} />
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by room, title…"
            style={{
              width: '100%', paddingLeft: 28, paddingRight: 8,
              height: 34, border: '1px solid #e2e8f0', borderRadius: 8,
              background: '#f8f9fb', fontSize: '.78rem', fontFamily: 'inherit',
              color: '#1a1f2e', outline: 'none',
            }}
            className="ri-filter-select"
          />
        </div>
        {/* Status filter */}
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="ri-filter-select"
          style={{ height: 34, border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8f9fb', fontSize: '.78rem', fontFamily: 'inherit', color: '#374151', paddingLeft: 8, paddingRight: 8, outline: 'none', cursor: 'pointer' }}>
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="REJECTED">Rejected</option>
        </select>
        {/* Priority filter */}
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          className="ri-filter-select"
          style={{ height: 34, border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8f9fb', fontSize: '.78rem', fontFamily: 'inherit', color: '#374151', paddingLeft: 8, paddingRight: 8, outline: 'none', cursor: 'pointer' }}>
          <option value="ALL">All Priorities</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        {/* Type filter */}
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="ri-filter-select"
          style={{ height: 34, border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8f9fb', fontSize: '.78rem', fontFamily: 'inherit', color: '#374151', paddingLeft: 8, paddingRight: 8, outline: 'none', cursor: 'pointer' }}>
          <option value="ALL">All Types</option>
          {Object.entries(ISSUE_TYPE_META).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        {/* Clear */}
        {(search || filterStatus !== 'ALL' || filterPriority !== 'ALL' || filterType !== 'ALL') && (
          <button
            onClick={() => { setSearch(''); setFilterStatus('ALL'); setFilterPriority('ALL'); setFilterType('ALL'); }}
            style={{ height: 34, padding: '0 10px', border: '1px solid #fca5a5', borderRadius: 8, background: 'rgba(239,68,68,0.07)', color: '#dc2626', fontSize: '.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <Loader2 size={28} style={{ animation: 'spin .8s linear infinite', marginBottom: 8 }} />
          <div style={{ fontSize: '.82rem' }}>Loading room issues…</div>
        </div>
      ) : error ? (
        <div style={{
          textAlign: 'center', padding: '2.5rem',
          background: '#fff', border: '1px solid #fca5a5', borderRadius: 12, color: '#dc2626',
        }}>
          <AlertTriangle size={24} style={{ marginBottom: 8 }} />
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Failed to load issues</div>
          <div style={{ fontSize: '.78rem', color: '#94a3b8', marginBottom: 12 }}>{error}</div>
          <button onClick={fetchIssues} style={{ ...primaryBtnStyle, margin: '0 auto' }}>
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '3rem',
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
        }}>
          <CheckCircle2 size={32} color="#22c55e" style={{ marginBottom: 10 }} />
          <div style={{ fontWeight: 700, color: '#1a1f2e', marginBottom: 4 }}>No issues found</div>
          <div style={{ fontSize: '.78rem', color: '#8a96a8' }}>
            {issues.length === 0 ? 'No room issues have been reported yet.' : 'No issues match your current filters.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '.65rem' }}>
          {filtered.map(issue => {
            const meta   = ISSUE_TYPE_META[issue.issue_type] || ISSUE_TYPE_META.OTHER;
            const IssIcon = meta.Icon;
            const canDispatch = ['PENDING', 'IN_PROGRESS'].includes(issue.status);

            return (
              <div key={issue.id} className="ri-card" style={{
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
                padding: '1rem 1.1rem', transition: 'all .18s', cursor: 'default',
                display: 'flex', alignItems: 'center', gap: '.85rem', flexWrap: 'wrap',
              }}>
                {/* Issue type icon */}
                <div style={{
                  width: 42, height: 42, borderRadius: 11, background: meta.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, border: `1px solid ${meta.color}33`,
                }}>
                  <IssIcon size={19} color={meta.color} />
                </div>

                {/* Main info */}
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: '.88rem', color: '#1a1f2e' }}>{issue.title}</span>
                    <span style={{ fontSize: '.68rem', color: '#94a3b8', background: '#f1f5f9', borderRadius: 5, padding: '2px 7px', fontWeight: 600 }}>
                      Room {issue.room_number}
                    </span>
                  </div>
                  <div style={{ fontSize: '.75rem', color: '#64748b', marginBottom: 6, lineHeight: 1.4 }}>
                    {(issue.description || '').length > 90
                      ? issue.description.slice(0, 90) + '…'
                      : issue.description || '—'}
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Badge meta={STATUS_META} value={issue.status} />
                    <PriorityDot priority={issue.priority} />
                    <span style={{
                      padding: '3px 8px', borderRadius: 99, fontSize: '.65rem', fontWeight: 700,
                      background: meta.bg, color: meta.color,
                      border: `1px solid ${meta.color}33`,
                      display: 'flex', alignItems: 'center', gap: 3,
                    }}>
                      <IssIcon size={9} />{meta.label}
                    </span>
                    {issue.created_at && (
                      <span style={{ fontSize: '.65rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <CalendarClock size={10} />
                        {new Date(issue.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                  <button
                    className="ri-view-btn"
                    onClick={() => setViewIssue(issue)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '.45rem .85rem', borderRadius: 8,
                      border: '1px solid #e2e8f0', background: '#f8f9fb',
                      color: '#4a5568', fontSize: '.76rem', fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                    }}
                  >
                    <Eye size={13} /> View
                  </button>
                  {canDispatch && (
                    <button
                      className="ri-dispatch-btn"
                      onClick={() => setDispatchIssue(issue)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '.45rem .9rem', borderRadius: 8,
                        border: 'none', background: '#2563eb',
                        color: '#fff', fontSize: '.76rem', fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'inherit', transition: 'all .18s',
                        boxShadow: '0 2px 8px rgba(37,99,235,0.22)',
                      }}
                    >
                      <Wrench size={13} /> Dispatch
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {viewIssue && (
        <IssueDetailModal
          issue={viewIssue}
          token={token}
          onClose={() => setViewIssue(null)}
          onDispatch={issue => { setViewIssue(null); setDispatchIssue(issue); }}
        />
      )}
      {dispatchIssue && (
        <DispatchModal
          issue={dispatchIssue}
          token={token}
          onClose={() => setDispatchIssue(null)}
          onSuccess={handleDispatchSuccess}
        />
      )}
    </div>
  );
}

export default ReceptionistRoomIssues;