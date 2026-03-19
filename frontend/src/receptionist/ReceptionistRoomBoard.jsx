// ReceptionistRoomBoard.jsx — Room status overview + mark clean/dirty/maintenance
import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { SHARED_CSS, Spinner, useToast, Toast } from '../admin/adminShared';
import {
  BedDouble, RefreshCw, CheckCircle2, XCircle, Wrench,
  Sparkles, AlertTriangle, Filter,
} from 'lucide-react';

import { API_BASE as BASE } from '../constants/config';
const h  = (t) => ({ Authorization:`Bearer ${t}`,'ngrok-skip-browser-warning':'true' });
const hj = (t) => ({ ...h(t),'Content-Type':'application/json' });

const ROOM_TYPES = ['ALL','STANDARD','DELUXE','SUITE','PRESIDENTIAL','VILLA'];

// Room housekeeping status stored locally (backend may not support it yet)
const HKSTATUS = {
  clean:       { label:'Clean',       color:'#2d9b6f', bg:'rgba(45,155,111,0.1)',  border:'rgba(45,155,111,0.25)', Icon: CheckCircle2 },
  dirty:       { label:'Dirty',       color:'#f59e0b', bg:'rgba(245,158,11,0.1)',  border:'rgba(245,158,11,0.25)', Icon: AlertTriangle },
  maintenance: { label:'Maintenance', color:'#dc3545', bg:'rgba(220,53,69,0.1)',   border:'rgba(220,53,69,0.25)',  Icon: Wrench },
};

const EXTRA_CSS = `
  .rb-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(168px,1fr)); gap:.75rem; }
  .rb-card {
    background:#fff; border:1.5px solid var(--border); border-radius:12px;
    padding:.9rem 1rem; position:relative; overflow:hidden;
    transition:transform .2s,box-shadow .2s;
    animation:fadeUp .4s cubic-bezier(.22,1,.36,1) both;
  }
  .rb-card:hover { transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,0,0,.08); }
  .rb-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; }
  .rb-card.available::before   { background:linear-gradient(to right,#059669,#34d399); }
  .rb-card.unavailable::before { background:linear-gradient(to right,#dc2626,#f87171); }
  .rb-num  { font-family:'Cormorant Garamond',serif; font-size:1.55rem; font-weight:600; color:var(--text); line-height:1; margin-bottom:.25rem; }
  .rb-type { font-size:.68rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--text-muted); margin-bottom:.5rem; }
  .rb-avail-badge {
    display:inline-flex; align-items:center; gap:.28rem;
    padding:.18rem .55rem; border-radius:99px; font-size:.63rem; font-weight:700;
    text-transform:uppercase; letter-spacing:.04em; border:1px solid transparent;
    margin-bottom:.55rem;
  }
  .rb-avail-badge.available   { background:var(--green-bg); color:var(--green); border-color:rgba(45,155,111,0.25); }
  .rb-avail-badge.unavailable { background:var(--red-bg);   color:var(--red);   border-color:rgba(220,53,69,0.25); }

  .rb-hk-badge {
    display:flex; align-items:center; gap:.3rem;
    padding:.28rem .6rem; border-radius:7px; font-size:.68rem; font-weight:600;
    cursor:pointer; transition:all .15s; border:1px solid;
    margin-top:.4rem;
  }
  .rb-price { font-size:.72rem; color:var(--text-muted); margin-top:.35rem; }
`;

export function ReceptionistRoomBoard({ token }) {
  const [rooms,      setRooms]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [avFilter,   setAvFilter]   = useState('ALL');
  const [hkStatuses, setHkStatuses] = useState({}); // { roomId: 'clean'|'dirty'|'maintenance' }

  // Housekeeping modal
  const [hkRoom,    setHkRoom]    = useState(null);
  const [hkSel,     setHkSel]     = useState('clean');
  const [hkSaving,  setHkSaving]  = useState(false);
  const { toast, show } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BASE}/admin/rooms/`, { headers: h(token) });
      const data = await res.json().catch(() => []);
      setRooms(Array.isArray(data) ? data : []);
      // Init housekeeping from localStorage
      const saved = JSON.parse(localStorage.getItem('rc_hk_status') || '{}');
      setHkStatuses(saved);
    } catch { show('Failed to load rooms', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [token]);

  const openHk = (room) => {
    setHkRoom(room);
    setHkSel(hkStatuses[room.id] || 'clean');
  };

  const saveHk = async () => {
    setHkSaving(true);
    try {
      // Try to update via API (if backend supports it)
      await fetch(`${BASE}/admin/rooms/${hkRoom.id}/`, {
        method:'PATCH', headers:hj(token),
        body: JSON.stringify({ housekeepingStatus: hkSel }),
      }).catch(() => {});

      // Always save locally as fallback
      const updated = { ...hkStatuses, [hkRoom.id]: hkSel };
      setHkStatuses(updated);
      localStorage.setItem('rc_hk_status', JSON.stringify(updated));
      show(`Room #${hkRoom.roomNumber} marked as ${HKSTATUS[hkSel].label}`);
      setHkRoom(null);
    } finally { setHkSaving(false); }
  };

  const filtered = rooms.filter(r => {
    const matchType = typeFilter === 'ALL' || r.roomType === typeFilter;
    const matchAv   = avFilter   === 'ALL' || (avFilter==='AVAILABLE' ? r.available : !r.available);
    return matchType && matchAv;
  });

  const counts = {
    total:       rooms.length,
    available:   rooms.filter(r=>r.available).length,
    unavailable: rooms.filter(r=>!r.available).length,
    clean:       Object.values(hkStatuses).filter(s=>s==='clean').length,
    dirty:       Object.values(hkStatuses).filter(s=>s==='dirty').length,
    maintenance: Object.values(hkStatuses).filter(s=>s==='maintenance').length,
  };

  return (
    <div className="ap-root">
      <style>{SHARED_CSS}{EXTRA_CSS}</style>
      <Toast toast={toast}/>

      <div className="ap-hd">
        <div>
          <h1 className="ap-title" style={{ display:'flex', alignItems:'center', gap:'.6rem' }}>
            <BedDouble size={22} color="var(--gold-dark)"/>Room Status Board
          </h1>
          <p className="ap-sub">Click any room to update its housekeeping status</p>
        </div>
        <button className="ap-btn-ghost" onClick={load}><RefreshCw size={14}/>Refresh</button>
      </div>

      {/* Stats */}
      <div className="ap-stats" style={{ gridTemplateColumns:'repeat(6,1fr)' }}>
        {[
          { label:'Total',       value:counts.total,       color:'gold'   },
          { label:'Available',   value:counts.available,   color:'green'  },
          { label:'Unavailable', value:counts.unavailable, color:'red'    },
          { label:'Clean',       value:counts.clean,       color:'teal'   },
          { label:'Dirty',       value:counts.dirty,       color:'orange' },
          { label:'Maintenance', value:counts.maintenance, color:'slate'  },
        ].map((s,i) => (
          <div key={i} className={`ap-stat ${s.color}`} style={{ padding:'.8rem 1rem' }}>
            <div className="ap-stat-lbl">{s.label}</div>
            <div className="ap-stat-val" style={{ fontSize:'1.5rem' }}>{loading ? '—' : s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap', marginBottom:'1rem' }}>
        <select className="ap-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          {ROOM_TYPES.map(t => <option key={t} value={t}>{t==='ALL'?'All Types':t}</option>)}
        </select>
        <select className="ap-select" value={avFilter} onChange={e => setAvFilter(e.target.value)}>
          <option value="ALL">All Availability</option>
          <option value="AVAILABLE">Available Only</option>
          <option value="UNAVAILABLE">Unavailable Only</option>
        </select>
        <div style={{ display:'flex', gap:'.75rem', alignItems:'center', marginLeft:'.25rem', flexWrap:'wrap' }}>
          {Object.entries(HKSTATUS).map(([key, s]) => (
            <div key={key} style={{ display:'flex', alignItems:'center', gap:'.35rem', fontSize:'.75rem', color:s.color, fontWeight:600 }}>
              <s.Icon size={12}/>{s.label}
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'3rem' }}><Spinner/></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)', fontSize:'.85rem' }}>No rooms match filters</div>
      ) : (
        <div className="rb-grid">
          {filtered.map((r, i) => {
            const hk    = hkStatuses[r.id] || 'clean';
            const hkCfg = HKSTATUS[hk];
            return (
              <div key={r.id} className={`rb-card ${r.available?'available':'unavailable'}`}
                style={{ animationDelay:`${i*0.03}s` }}>
                <div className="rb-type">{r.roomType}</div>
                <div className="rb-num">#{r.roomNumber}</div>
                <div className={`rb-avail-badge ${r.available?'available':'unavailable'}`}>
                  {r.available ? <CheckCircle2 size={10}/> : <XCircle size={10}/>}
                  {r.available ? 'Available' : 'Unavailable'}
                </div>
                <div className="rb-price">₱{Number(r.pricePerNight||0).toLocaleString()}/night</div>
                {/* Housekeeping badge — clickable */}
                <div className="rb-hk-badge" onClick={() => openHk(r)}
                  style={{ color:hkCfg.color, background:hkCfg.bg, borderColor:hkCfg.border }}>
                  <hkCfg.Icon size={11}/>
                  {hkCfg.label}
                  <span style={{ marginLeft:'auto', fontSize:'.6rem', opacity:.6 }}>tap</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Housekeeping Modal */}
      <Modal show={!!hkRoom} onHide={() => setHkRoom(null)} centered className="ap-modal">
        <Modal.Header closeButton>
          <Modal.Title style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
            <Sparkles size={16} color="var(--gold-dark)"/>
            Update Room Status — #{hkRoom?.roomNumber}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p style={{ fontSize:'.82rem', color:'var(--text-muted)', marginBottom:'1rem' }}>
            Mark the current housekeeping status for <strong>{hkRoom?.roomType} #{hkRoom?.roomNumber}</strong>.
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:'.5rem' }}>
            {Object.entries(HKSTATUS).map(([key, cfg]) => (
              <div key={key} onClick={() => setHkSel(key)}
                style={{ display:'flex', alignItems:'center', gap:'.85rem', padding:'.85rem 1rem', borderRadius:10, border:`1.5px solid ${hkSel===key ? cfg.color : 'var(--border)'}`, background:hkSel===key ? cfg.bg : '#fff', cursor:'pointer', transition:'all .18s' }}>
                <div style={{ width:36, height:36, borderRadius:9, background:cfg.bg, border:`1px solid ${cfg.border}`, display:'flex', alignItems:'center', justifyContent:'center', color:cfg.color, flexShrink:0 }}>
                  <cfg.Icon size={16}/>
                </div>
                <div>
                  <div style={{ fontWeight:600, fontSize:'.85rem', color: hkSel===key ? cfg.color : 'var(--text)' }}>{cfg.label}</div>
                  <div style={{ fontSize:'.72rem', color:'var(--text-muted)' }}>
                    {key==='clean'       && 'Room is cleaned and ready for new guests'}
                    {key==='dirty'       && 'Room needs cleaning before next check-in'}
                    {key==='maintenance' && 'Room has issues — do not assign to guests'}
                  </div>
                </div>
                {hkSel===key && <CheckCircle2 size={16} color={cfg.color} style={{ marginLeft:'auto' }}/>}
              </div>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="ap-btn-ghost" onClick={() => setHkRoom(null)}>Cancel</button>
          <button className="ap-btn-primary" disabled={hkSaving} onClick={saveHk}>
            {hkSaving ? <><div className="ap-spin-sm"/>Saving…</> : <><CheckCircle2 size={14}/>Update Status</>}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}