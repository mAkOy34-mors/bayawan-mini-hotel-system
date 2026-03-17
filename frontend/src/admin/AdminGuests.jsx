// AdminGuests.jsx
import { useState, useEffect, useCallback } from 'react';
import { Modal } from 'react-bootstrap';
import { adminGetGuests, adminGetGuest, adminToggleGuest } from './adminApi';
import { SHARED_CSS, fmtDate, fmtDT, Pill, Skel, Spinner, Pager, Toast, useToast } from './adminShared';

const PAGE_SIZE = 10;

export function AdminGuests({ token }) {
  const [guests,  setGuests]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [page,    setPage]    = useState(1);
  const [detail,  setDetail]  = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const { toast, show } = useToast();

  const load = useCallback(async (q='') => {
    setLoading(true);
    const data = await adminGetGuests(token, q).catch(()=>[]);
    setGuests(Array.isArray(data) ? data : []);
    setPage(1);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id) => {
    setDetailLoading(true); setShowDetail(true); setDetail(null);
    const d = await adminGetGuest(token, id).catch(()=>null);
    setDetail(d); setDetailLoading(false);
  };

  const toggle = async (g) => {
    try {
      const r = await adminToggleGuest(token, g.id);
      show(r.message);
      setGuests(prev => prev.map(x => x.id===g.id ? {...x, isActive:r.isActive} : x));
      if (detail?.id === g.id) setDetail(d => ({ ...d, isActive: r.isActive }));
    } catch (e) { show(e.message, 'error'); }
  };

  const visible = guests.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const active   = guests.filter(g=>g.isActive).length;

  return (
    <div className="ap-root">
      <style>{SHARED_CSS}</style>
      <Toast toast={toast}/>

      <div className="ap-hd">
        <div><h1 className="ap-title">Guests</h1><p className="ap-sub">Manage registered guest accounts</p></div>
      </div>

      {/* Stats */}
      <div className="ap-stats" style={{ gridTemplateColumns:'repeat(3,1fr)', maxWidth:600 }}>
        {[
          { icon:'👥', label:'Total Guests', value: guests.length, color:'blue' },
          { icon:'✅', label:'Active',        value: active,        color:'green' },
          { icon:'🚫', label:'Inactive',      value: guests.length - active, color:'red' },
        ].map((s,i) => (
          <div key={i} className={`ap-stat ${s.color}`} style={{animationDelay:`${i*0.06}s`}}>
            <span className="ap-stat-icon">{s.icon}</span>
            <div className="ap-stat-lbl">{s.label}</div>
            <div className="ap-stat-val">{loading ? <Skel h={24} w={30}/> : s.value}</div>
          </div>
        ))}
      </div>

      <div className="ap-panel">
        <div className="ap-panel-hd">
          <div>
            <div className="ap-panel-title">All Guests</div>
            <div className="ap-panel-sub">{!loading && `${guests.length} accounts`}</div>
          </div>
          <div className="ap-toolbar" style={{ margin:0 }}>
            <div className="ap-search-wrap">
              <span className="ap-search-ico">🔍</span>
              <input className="ap-search" placeholder="Search email or username…" value={search}
                onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load(search)}/>
            </div>
            <button className="ap-btn-primary" onClick={()=>load(search)} style={{ padding:'.58rem .9rem' }}>🔍</button>
          </div>
        </div>

        {loading
          ? <div style={{ padding:'2.5rem', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:'.65rem' }}><Spinner/><span style={{ color:'var(--text-muted)', fontSize:'.78rem' }}>Loading guests…</span></div>
          : guests.length === 0
            ? <div className="ap-empty"><div className="ap-empty-ico">👥</div><div className="ap-empty-title">No guests found</div></div>
            : <>
                <div style={{ overflowX:'auto' }}>
                  <table className="ap-tbl">
                    <thead>
                      <tr><th>#</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {visible.map((g,i) => (
                        <tr key={g.id}>
                          <td style={{ color:'var(--text-muted)', fontSize:'.75rem' }}>{(page-1)*PAGE_SIZE+i+1}</td>
                          <td>
                            <div style={{ display:'flex', alignItems:'center', gap:'.55rem' }}>
                              <div style={{ width:30, height:30, borderRadius:8, background:'linear-gradient(135deg,#9a7a2e,#C9A84C)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Cormorant Garamond',serif", fontSize:'.82rem', fontWeight:600, color:'#fff', flexShrink:0 }}>
                                {g.username?.slice(0,1).toUpperCase()||'?'}
                              </div>
                              <span style={{ fontWeight:600, color:'var(--text)', fontSize:'.84rem' }}>{g.username}</span>
                            </div>
                          </td>
                          <td style={{ color:'var(--text-muted)', fontSize:'.8rem' }}>{g.email}</td>
                          <td><span style={{ fontSize:'.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--gold-dark)' }}>{g.role}</span></td>
                          <td><Pill status={g.isActive?'active':'inactive'} label={g.isActive?'Active':'Inactive'}/></td>
                          <td style={{ fontSize:'.75rem', color:'var(--text-muted)' }}>{fmtDate(g.createdAt)}</td>
                          <td>
                            <div style={{ display:'flex', gap:'.38rem' }}>
                              <button className="ap-btn-ghost" style={{ fontSize:'.72rem', padding:'.28rem .65rem' }} onClick={()=>openDetail(g.id)}>View</button>
                              <button className={g.isActive ? 'ap-btn-red' : 'ap-btn-green'} style={{ fontSize:'.72rem', padding:'.28rem .65rem' }} onClick={()=>toggle(g)}>
                                {g.isActive ? '🚫 Disable' : '✅ Enable'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pager page={page} total={guests.length} size={PAGE_SIZE} setPage={setPage}/>
              </>
        }
      </div>

      {/* Guest Detail Modal */}
      <Modal show={showDetail} onHide={()=>setShowDetail(false)} size="md" centered className="ap-modal">
        <Modal.Header closeButton>
          <Modal.Title>Guest Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailLoading
            ? <div style={{ textAlign:'center', padding:'2rem', display:'flex', flexDirection:'column', alignItems:'center', gap:'.65rem' }}><Spinner/></div>
            : !detail ? null
            : <>
                {/* Avatar */}
                <div style={{ display:'flex', alignItems:'center', gap:'.9rem', padding:'1rem', background:'var(--surface2)', borderRadius:10, border:'1px solid var(--border)', marginBottom:'1rem' }}>
                  <div style={{ width:52, height:52, borderRadius:12, background:'linear-gradient(135deg,#9a7a2e,#C9A84C)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Cormorant Garamond',serif", fontSize:'1.35rem', fontWeight:600, color:'#fff', flexShrink:0 }}>
                    {detail.username?.slice(0,1).toUpperCase()||'?'}
                  </div>
                  <div>
                    <div style={{ fontSize:'1.05rem', fontWeight:600, color:'var(--text)' }}>{detail.username}</div>
                    <div style={{ fontSize:'.78rem', color:'var(--text-muted)' }}>{detail.email}</div>
                    <div style={{ marginTop:'.35rem' }}><Pill status={detail.isActive?'active':'inactive'} label={detail.isActive?'Active':'Inactive'}/></div>
                  </div>
                  <div style={{ marginLeft:'auto' }}>
                    <button className={detail.isActive ? 'ap-btn-red' : 'ap-btn-green'} style={{ fontSize:'.78rem' }} onClick={()=>toggle(detail)}>
                      {detail.isActive ? '🚫 Disable' : '✅ Enable'}
                    </button>
                  </div>
                </div>

                {/* Info grid */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.65rem', marginBottom:'1rem' }}>
                  {[
                    ['Role', detail.role],
                    ['Bookings', detail.bookingCount ?? '—'],
                    ['Joined', fmtDate(detail.createdAt)],
                    ['Status', detail.isActive ? 'Active' : 'Inactive'],
                  ].map(([k,v]) => (
                    <div key={k} style={{ background:'var(--surface2)', borderRadius:8, padding:'.62rem .85rem', border:'1px solid var(--border)' }}>
                      <div style={{ fontSize:'.63rem', textTransform:'uppercase', letterSpacing:'.08em', color:'var(--text-muted)', fontWeight:700, marginBottom:'.18rem' }}>{k}</div>
                      <div style={{ fontSize:'.85rem', color:'var(--text)', fontWeight:600 }}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* Profile info */}
                {detail.profile && (
                  <div style={{ background:'var(--surface2)', borderRadius:10, padding:'1rem', border:'1px solid var(--border)' }}>
                    <div style={{ fontSize:'.65rem', textTransform:'uppercase', letterSpacing:'.1em', color:'var(--text-muted)', fontWeight:700, marginBottom:'.75rem' }}>Profile Information</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.5rem' }}>
                      {[
                        ['Name', [detail.profile.firstName, detail.profile.lastName].filter(Boolean).join(' ')||'—'],
                        ['Contact', detail.profile.contactNumber||'—'],
                        ['Nationality', detail.profile.nationality||'—'],
                      ].map(([k,v]) => (
                        <div key={k}>
                          <div style={{ fontSize:'.63rem', color:'var(--text-muted)', marginBottom:'.1rem' }}>{k}</div>
                          <div style={{ fontSize:'.82rem', color:'var(--text-sub)', fontWeight:500 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
          }
        </Modal.Body>
      </Modal>
    </div>
  );
}
