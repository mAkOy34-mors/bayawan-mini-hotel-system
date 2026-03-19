// ReceptionistDashboard.jsx
import { useState, useEffect } from 'react';
import { SHARED_CSS, fmt, fmtDate, Pill, Skel, Spinner, useToast, Toast } from '../admin/adminShared';
import {
  LogIn, LogOut, BedDouble, Users, RefreshCw,
  Clock, CheckCircle2, AlertTriangle, ChevronRight,
} from 'lucide-react';

import { API_BASE as BASE } from '../constants/config';
// then remove: const BASE = '/api/v1';
const h = (t) => ({ Authorization: `Bearer ${t}`, 'ngrok-skip-browser-warning': 'true' });

export function ReceptionistDashboard({ token, setPage }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast, show } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [bookRes, roomRes] = await Promise.all([
        fetch(`${BASE}/admin/bookings/`, { headers: h(token) }),
        fetch(`${BASE}/admin/rooms/`,    { headers: h(token) }),
      ]);
      const bookings = await bookRes.json().catch(() => []);
      const rooms    = await roomRes.json().catch(() => []);
      const today    = new Date().toISOString().slice(0,10);

      setData({
        arrivals:   (Array.isArray(bookings) ? bookings : []).filter(b => b.checkInDate?.slice(0,10)  === today && b.status === 'CONFIRMED'),
        departures: (Array.isArray(bookings) ? bookings : []).filter(b => b.checkOutDate?.slice(0,10) === today && b.status === 'CHECKED_IN'),
        checkedIn:  (Array.isArray(bookings) ? bookings : []).filter(b => b.status === 'CHECKED_IN').length,
        totalRooms: Array.isArray(rooms) ? rooms.length : 0,
        available:  Array.isArray(rooms)  ? rooms.filter(r => r.available).length : 0,
        recentBookings: (Array.isArray(bookings) ? bookings : []).slice(0,6),
      });
    } catch (e) { show('Failed to load dashboard', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [token]);

  const stats = data ? [
    { label:"Today's Arrivals",   value: data.arrivals.length,   Icon: LogIn,    color:'blue',   action: () => setPage('arrivals')   },
    { label:"Today's Departures", value: data.departures.length, Icon: LogOut,   color:'orange', action: () => setPage('departures') },
    { label:'Currently In-House', value: data.checkedIn,         Icon: Users,    color:'green'   },
    { label:'Available Rooms',    value: data.available,         Icon: BedDouble,color:'gold',   action: () => setPage('roomboard')  },
  ] : [];

  return (
    <div className="ap-root">
      <style>{SHARED_CSS}</style>
      <Toast toast={toast}/>

      <div className="ap-hd">
        <div>
          <h1 className="ap-title">Reception Dashboard</h1>
          <p className="ap-sub">{new Date().toLocaleDateString('en-PH', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
        </div>
        <button className="ap-btn-ghost" onClick={load}><RefreshCw size={14}/>Refresh</button>
      </div>

      {/* Stats */}
      <div className="ap-stats">
        {loading
          ? [1,2,3,4].map(i => (
              <div key={i} className="ap-stat gold"><Skel h={14} w={80} mb={8}/><Skel h={32} w={50}/></div>
            ))
          : stats.map((s, i) => (
              <div key={i} className={`ap-stat ${s.color}`}
                style={{ cursor: s.action ? 'pointer' : 'default', animationDelay:`${i*0.06}s` }}
                onClick={s.action}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.55rem' }}>
                  <div style={{ width:30, height:30, borderRadius:8, background:'rgba(255,255,255,.6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <s.Icon size={15}/>
                  </div>
                  {s.action && <ChevronRight size={14} style={{ opacity:.4 }}/>}
                </div>
                <div className="ap-stat-lbl">{s.label}</div>
                <div className="ap-stat-val">{s.value}</div>
              </div>
            ))
        }
      </div>

      {/* Two column: Arrivals + Departures */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>

        {/* Arrivals */}
        <div className="ap-panel" style={{ marginBottom:0 }}>
          <div className="ap-panel-hd">
            <div>
              <div className="ap-panel-title" style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
                <LogIn size={15} color="var(--blue)"/>Today's Arrivals
              </div>
            </div>
            <button className="ap-btn-ghost" style={{ fontSize:'.72rem', padding:'.3rem .65rem' }} onClick={() => setPage('arrivals')}>
              View All <ChevronRight size={12}/>
            </button>
          </div>
          {loading ? (
            <div className="ap-panel-body"><Spinner/></div>
          ) : !data?.arrivals.length ? (
            <div style={{ padding:'2rem', textAlign:'center', color:'var(--text-muted)', fontSize:'.8rem' }}>No arrivals today</div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table className="ap-tbl">
                <thead><tr><th>Ref</th><th>Guest</th><th>Room</th><th>Status</th></tr></thead>
                <tbody>
                  {data.arrivals.slice(0,5).map(b => (
                    <tr key={b.id}>
                      <td style={{ fontFamily:'monospace', fontSize:'.72rem', color:'var(--gold-dark)', fontWeight:700 }}>{b.bookingReference}</td>
                      <td style={{ fontSize:'.8rem', fontWeight:600 }}>{b.guestUsername || b.guestEmail}</td>
                      <td style={{ fontSize:'.78rem' }}>{b.roomType} #{b.roomNumber}</td>
                      <td><Pill status={b.status}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Departures */}
        <div className="ap-panel" style={{ marginBottom:0 }}>
          <div className="ap-panel-hd">
            <div>
              <div className="ap-panel-title" style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
                <LogOut size={15} color="var(--orange)"/>Today's Departures
              </div>
            </div>
            <button className="ap-btn-ghost" style={{ fontSize:'.72rem', padding:'.3rem .65rem' }} onClick={() => setPage('departures')}>
              View All <ChevronRight size={12}/>
            </button>
          </div>
          {loading ? (
            <div className="ap-panel-body"><Spinner/></div>
          ) : !data?.departures.length ? (
            <div style={{ padding:'2rem', textAlign:'center', color:'var(--text-muted)', fontSize:'.8rem' }}>No departures today</div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table className="ap-tbl">
                <thead><tr><th>Ref</th><th>Guest</th><th>Room</th><th>Remaining</th></tr></thead>
                <tbody>
                  {data.departures.slice(0,5).map(b => (
                    <tr key={b.id}>
                      <td style={{ fontFamily:'monospace', fontSize:'.72rem', color:'var(--gold-dark)', fontWeight:700 }}>{b.bookingReference}</td>
                      <td style={{ fontSize:'.8rem', fontWeight:600 }}>{b.guestUsername || b.guestEmail}</td>
                      <td style={{ fontSize:'.78rem' }}>{b.roomType} #{b.roomNumber}</td>
                      <td style={{ color: parseFloat(b.remainingAmount||0) > 0 ? 'var(--red)' : 'var(--green)', fontWeight:700, fontSize:'.8rem' }}>
                        {fmt(b.remainingAmount||0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent bookings */}
      <div className="ap-panel">
        <div className="ap-panel-hd">
          <div className="ap-panel-title" style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
            <Clock size={15}/>Recent Bookings
          </div>
          <button className="ap-btn-ghost" style={{ fontSize:'.72rem', padding:'.3rem .65rem' }} onClick={() => setPage('bookings')}>
            All Bookings <ChevronRight size={12}/>
          </button>
        </div>
        {loading ? (
          <div className="ap-panel-body" style={{ display:'flex', justifyContent:'center' }}><Spinner/></div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table className="ap-tbl">
              <thead><tr><th>Reference</th><th>Guest</th><th>Room</th><th>Check-In</th><th>Check-Out</th><th>Status</th></tr></thead>
              <tbody>
                {(data?.recentBookings || []).map(b => (
                  <tr key={b.id}>
                    <td style={{ fontFamily:'monospace', fontSize:'.72rem', color:'var(--gold-dark)', fontWeight:700 }}>{b.bookingReference}</td>
                    <td style={{ fontSize:'.8rem', fontWeight:600 }}>{b.guestUsername || b.guestEmail}</td>
                    <td style={{ fontSize:'.78rem', whiteSpace:'nowrap' }}>{b.roomType} #{b.roomNumber}</td>
                    <td style={{ fontSize:'.76rem', color:'var(--text-muted)', whiteSpace:'nowrap' }}>{fmtDate(b.checkInDate)}</td>
                    <td style={{ fontSize:'.76rem', color:'var(--text-muted)', whiteSpace:'nowrap' }}>{fmtDate(b.checkOutDate)}</td>
                    <td><Pill status={b.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}