// AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { getDashboard, getRevenue, getCheckins, adminGetBookings } from './adminApi';
import { SHARED_CSS, fmt, fmtDate, Pill, Skel, Spinner, BarChart } from './adminShared';

export function AdminDashboard({ token, setPage }) {
  const [kpi,      setKpi]      = useState(null);
  const [revenue,  setRevenue]  = useState([]);
  const [checkins, setCheckins] = useState({ checkins:[], checkouts:[] });
  const [bookings, setBookings] = useState([]);
  const [period,   setPeriod]   = useState('monthly');
  const [loading,  setLoading]  = useState(true);
  const today = new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});

  const loadRevenue = async (per) => {
    const r = await getRevenue(token, per).catch(()=>null);
    if (!r?.data) return;
    const slice = r.data.slice(-12).map(d => ({
      label: d.period?.slice(5,10) || d.period?.slice(0,7) || d.period,
      total: d.total,
    }));
    setRevenue(slice);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getDashboard(token).catch(()=>null),
      getCheckins(token).catch(()=>({ checkins:[], checkouts:[] })),
      adminGetBookings(token,'').catch(()=>[]),
    ]).then(([k, c, b]) => {
      if (k) setKpi(k);
      setCheckins(c || { checkins:[], checkouts:[] });
      setBookings(Array.isArray(b) ? b.slice(0,8) : []);
    }).finally(() => setLoading(false));
    loadRevenue(period);
  }, [token]);

  useEffect(() => { loadRevenue(period); }, [period]);

  const stats = kpi ? [
    { icon:'🛏️', label:'Total Bookings',    value: kpi.totalBookings,    color:'gold'   },
    { icon:'👥', label:'Total Guests',      value: kpi.totalGuests,      color:'blue'   },
    { icon:'💰', label:'Total Revenue',     value: fmt(kpi.totalRevenue), color:'green'  },
    { icon:'🏨', label:'Available Rooms',   value: kpi.availableRooms,   color:'teal'   },
    { icon:'📥', label:"Today's Check-ins", value: kpi.todaysCheckins,   color:'orange' },
    { icon:'📤', label:"Check-outs",        value: kpi.todaysCheckouts,  color:'purple' },
    { icon:'⏳', label:'Pending Deposits',  value: kpi.pendingBookings,   color:'red'    },
    { icon:'📈', label:'This Week',         value: kpi.bookingChangePct != null ? `${kpi.bookingChangePct > 0 ? '+':''}${kpi.bookingChangePct}%` : '—', color:'slate' },
  ] : [];

  return (
    <div className="ap-root">
      <style>{SHARED_CSS}</style>

      {/* Header */}
      <div className="ap-hd">
        <div>
          <h1 className="ap-title">Admin Dashboard</h1>
          <p className="ap-sub">Hotel operations overview</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'.45rem', padding:'.4rem .9rem', borderRadius:99, background:'#fff', border:'1px solid var(--border)', fontSize:'.75rem', color:'var(--text-sub)', boxShadow:'0 1px 3px rgba(0,0,0,.05)' }}>
          📅 {today}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="ap-stats">
        {loading
          ? Array.from({length:8},(_,i) => (
              <div key={i} className={`ap-stat gold`} style={{animationDelay:`${i*0.05}s`}}>
                <Skel h={20} w={20} mb={10} r={6}/><Skel h={10} w="60%" mb={8}/><Skel h={26} w="45%"/>
              </div>
            ))
          : stats.map((s,i) => (
              <div key={i} className={`ap-stat ${s.color}`} style={{animationDelay:`${i*0.06}s`}}>
                <span className="ap-stat-icon">{s.icon}</span>
                <div className="ap-stat-lbl">{s.label}</div>
                <div className="ap-stat-val">{s.value}</div>
              </div>
            ))
        }
      </div>

      {/* Main grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 310px', gap:'1rem' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

          {/* Revenue Chart */}
          <div className="ap-panel" style={{ marginBottom:0, animationDelay:'.05s' }}>
            <div className="ap-panel-hd">
              <div>
                <div className="ap-panel-title">Revenue Overview</div>
                <div className="ap-panel-sub">{period} breakdown · {revenue.length} periods</div>
              </div>
              <div style={{ display:'flex', gap:'.35rem' }}>
                {['daily','weekly','monthly'].map(p => (
                  <button key={p} onClick={()=>setPeriod(p)}
                    style={{ padding:'.3rem .7rem', borderRadius:7, border:'1px solid var(--border)', background: period===p ? 'linear-gradient(135deg,#9a7a2e,#C9A84C)' : '#fff', color: period===p ? '#fff' : 'var(--text-muted)', fontSize:'.72rem', fontFamily:"'DM Sans',sans-serif", fontWeight:600, cursor:'pointer', transition:'all .15s' }}>
                    {p.charAt(0).toUpperCase()+p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="ap-panel-body">
              {revenue.length > 0
                ? <BarChart data={revenue} height={120} />
                : <div style={{ textAlign:'center', padding:'2.5rem', color:'var(--text-muted)', fontSize:'.8rem' }}>No revenue data for this period</div>
              }
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="ap-panel" style={{ marginBottom:0, animationDelay:'.08s' }}>
            <div className="ap-panel-hd">
              <div>
                <div className="ap-panel-title">Recent Bookings</div>
                <div className="ap-panel-sub">{loading ? 'Loading…' : `${bookings.length} shown`}</div>
              </div>
              <button className="ap-btn-ghost" onClick={()=>setPage('bookings')}>View All →</button>
            </div>
            {loading
              ? <div style={{ padding:'2rem', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:'.65rem' }}><Spinner/><span style={{ fontSize:'.78rem', color:'var(--text-muted)' }}>Loading…</span></div>
              : bookings.length === 0
                ? <div className="ap-empty"><div className="ap-empty-ico">🛏️</div><div className="ap-empty-title">No bookings yet</div></div>
                : (
                  <div style={{ overflowX:'auto' }}>
                    <table className="ap-tbl">
                      <thead>
                        <tr><th>Reference</th><th>Guest</th><th>Room</th><th>Check-in</th><th>Amount</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {bookings.map(b => (
                          <tr key={b.id}>
                            <td><span style={{ fontFamily:'monospace', fontSize:'.74rem', color:'var(--gold-dark)', fontWeight:700 }}>{b.bookingReference}</span></td>
                            <td>
                              <div style={{ fontWeight:600, color:'var(--text)', fontSize:'.82rem' }}>{b.guestUsername}</div>
                              <div style={{ fontSize:'.7rem', color:'var(--text-muted)' }}>{b.guestEmail}</div>
                            </td>
                            <td style={{ fontSize:'.8rem' }}>{b.roomType} #{b.roomNumber}</td>
                            <td style={{ fontSize:'.76rem', color:'var(--text-muted)' }}>{fmtDate(b.checkInDate)}</td>
                            <td><span style={{ fontWeight:700, color:'var(--text)' }}>{fmt(b.totalAmount)}</span></td>
                            <td><Pill status={b.status}/></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
            }
          </div>
        </div>

        {/* Right column */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

          {/* Check-ins */}
          <div className="ap-panel" style={{ marginBottom:0, animationDelay:'.06s' }}>
            <div className="ap-panel-hd">
              <div>
                <div className="ap-panel-title">📥 Today's Check-ins</div>
                <div className="ap-panel-sub">{checkins.checkins?.length||0} arrivals</div>
              </div>
              <button className="ap-btn-ghost" style={{ fontSize:'.7rem', padding:'.28rem .65rem' }} onClick={()=>setPage('bookings')}>Manage</button>
            </div>
            <div className="ap-panel-body" style={{ padding:'0 1.25rem' }}>
              {(checkins.checkins||[]).length === 0
                ? <div style={{ textAlign:'center', color:'var(--text-muted)', fontSize:'.78rem', padding:'1.25rem 0' }}>No arrivals today</div>
                : (checkins.checkins||[]).slice(0,6).map((ci,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'.7rem', padding:'.68rem 0', borderBottom: i<5 ? '1px solid #f8f9fb' : 'none' }}>
                      <div style={{ width:32, height:32, borderRadius:8, background:'var(--gold-bg)', border:'1px solid rgba(201,168,76,0.18)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.85rem', flexShrink:0 }}>🛏️</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'.82rem', fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ci.user__username||ci.user__email}</div>
                        <div style={{ fontSize:'.7rem', color:'var(--text-muted)' }}>Room {ci.room__room_number}</div>
                      </div>
                      <Pill status={ci.status}/>
                    </div>
                  ))
              }
            </div>
          </div>

          {/* Check-outs */}
          <div className="ap-panel" style={{ marginBottom:0, animationDelay:'.09s' }}>
            <div className="ap-panel-hd">
              <div>
                <div className="ap-panel-title">📤 Check-outs</div>
                <div className="ap-panel-sub">{checkins.checkouts?.length||0} departures</div>
              </div>
            </div>
            <div className="ap-panel-body" style={{ padding:'0 1.25rem' }}>
              {(checkins.checkouts||[]).length === 0
                ? <div style={{ textAlign:'center', color:'var(--text-muted)', fontSize:'.78rem', padding:'1.25rem 0' }}>No departures today</div>
                : (checkins.checkouts||[]).slice(0,5).map((co,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'.7rem', padding:'.68rem 0', borderBottom: i<4 ? '1px solid #f8f9fb' : 'none' }}>
                      <div style={{ width:32, height:32, borderRadius:8, background:'#f1f5f9', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.85rem', flexShrink:0 }}>🚪</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'.82rem', fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{co.user__username||co.user__email}</div>
                        <div style={{ fontSize:'.7rem', color:'var(--text-muted)' }}>Room {co.room__room_number}</div>
                      </div>
                      <Pill status={co.status}/>
                    </div>
                  ))
              }
            </div>
          </div>

          {/* Quick Actions */}
          <div className="ap-panel" style={{ marginBottom:0, animationDelay:'.12s' }}>
            <div className="ap-panel-hd"><div className="ap-panel-title">Quick Actions</div></div>
            <div className="ap-panel-body" style={{ padding:'0 1.25rem' }}>
              {[
                { icon:'🏨', label:'Add Room',         sub:'Create a new room listing',    page:'rooms'    },
                { icon:'👥', label:'Manage Guests',    sub:'View and control accounts',    page:'guests'   },
                { icon:'💳', label:'Verify Payments',  sub:'Approve pending transactions', page:'payments' },
                { icon:'💬', label:'Support Tickets',  sub:'Reply to guest queries',       page:'support'  },
              ].map((a,i) => (
                <div key={i} onClick={()=>setPage(a.page)} style={{ display:'flex', alignItems:'center', gap:'.75rem', padding:'.72rem 0', borderBottom: i<3 ? '1px solid #f8f9fb' : 'none', cursor:'pointer' }}
                  onMouseEnter={e=>e.currentTarget.style.paddingLeft='.35rem'}
                  onMouseLeave={e=>e.currentTarget.style.paddingLeft='0'}>
                  <div style={{ width:32, height:32, borderRadius:8, background:'#f1f5f9', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.88rem', flexShrink:0 }}>{a.icon}</div>
                  <div>
                    <div style={{ fontSize:'.83rem', fontWeight:600, color:'var(--text)' }}>{a.label}</div>
                    <div style={{ fontSize:'.7rem', color:'var(--text-muted)' }}>{a.sub}</div>
                  </div>
                  <span style={{ marginLeft:'auto', color:'var(--text-muted)', fontSize:'.88rem' }}>›</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
