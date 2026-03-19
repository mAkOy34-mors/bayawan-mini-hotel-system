// ReceptionistBookings.jsx — View and search all bookings
import { useState, useEffect, useCallback } from 'react';
import { Modal } from 'react-bootstrap';
import { SHARED_CSS, fmt, fmtDate, fmtDT, Pill, Skel, Spinner, Pager, useToast, Toast } from '../admin/adminShared';
import { CalendarCheck, Search, RefreshCw, LogIn, LogOut, Eye } from 'lucide-react';

import { API_BASE as BASE } from '../constants/config';
// then remove: const BASE = '/api/v1'; 
const PAGE_SIZE = 10;
const h  = (t) => ({ Authorization:`Bearer ${t}`,'ngrok-skip-browser-warning':'true' });
const hj = (t) => ({ ...h(t),'Content-Type':'application/json' });

const STATUS_OPTIONS = ['PENDING_DEPOSIT','CONFIRMED','CHECKED_IN','CHECKED_OUT','COMPLETED','CANCELLED'];

export function ReceptionistBookings({ token }) {
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('');
  const [page,     setPage]     = useState(1);
  const [detail,   setDetail]   = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [newStatus,setNewStatus]= useState('');
  const { toast, show } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.set('status', filter);
      if (search) params.set('search', search);

      // Try admin endpoint first, fall back to regular bookings
      let data = [];
      const adminRes = await fetch(`${BASE}/admin/bookings/?${params}`, { headers: h(token) });
      if (adminRes.ok) {
        data = await adminRes.json().catch(() => []);
      } else {
        // Fallback — fetch all bookings via reports or bookings endpoint
        const fallbackRes = await fetch(`${BASE}/bookings/my-bookings/`, { headers: h(token) });
        data = await fallbackRes.json().catch(() => []);
      }
      setItems(Array.isArray(data) ? data : []);
      setPage(1);
    } catch { show('Failed to load bookings', 'error'); }
    finally { setLoading(false); }
  }, [token, filter, search]);

  useEffect(() => { load(); }, [load]);

  const openDetail = (b) => { setDetail(b); setNewStatus(b.status); };

  const applyStatus = async () => {
    if (!detail || newStatus === detail.status || newStatus === 'CANCELLED') return;
    setSaving(true);
    try {
      await fetch(`${BASE}/admin/bookings/${detail.id}/status/`, {
        method:'POST', headers:hj(token), body:JSON.stringify({ status:newStatus }),
      });
      show(`Status updated to ${newStatus}`);
      setDetail(d => ({ ...d, status:newStatus }));
      setItems(prev => prev.map(b => b.id === detail.id ? { ...b, status:newStatus } : b));
      setDetail(null);
    } catch (e) { show(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const visible = items.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  return (
    <div className="ap-root">
      <style>{SHARED_CSS}</style>
      <Toast toast={toast}/>

      <div className="ap-hd">
        <div>
          <h1 className="ap-title" style={{ display:'flex', alignItems:'center', gap:'.6rem' }}>
            <CalendarCheck size={22} color="var(--gold-dark)"/>All Bookings
          </h1>
          <p className="ap-sub">Search and manage all guest reservations</p>
        </div>
      </div>

      {/* Stats */}
      <div className="ap-stats">
        {[
          { label:'Total',     value:items.length,                                         color:'gold'   },
          { label:'Pending',   value:items.filter(b=>b.status==='PENDING_DEPOSIT').length, color:'orange' },
          { label:'Confirmed', value:items.filter(b=>b.status==='CONFIRMED').length,       color:'blue'   },
          { label:'In-House',  value:items.filter(b=>b.status==='CHECKED_IN').length,      color:'green'  },
        ].map((s,i) => (
          <div key={i} className={`ap-stat ${s.color}`} style={{ animationDelay:`${i*0.05}s` }}>
            <div className="ap-stat-lbl">{s.label}</div>
            <div className="ap-stat-val">{loading ? <Skel h={24} w={30}/> : s.value}</div>
          </div>
        ))}
      </div>

      <div className="ap-panel">
        <div className="ap-panel-hd">
          <div><div className="ap-panel-title">Bookings</div><div className="ap-panel-sub">{!loading && `${items.length} records`}</div></div>
          <div className="ap-toolbar" style={{ margin:0 }}>
            <div className="ap-search-wrap">
              <span className="ap-search-ico"><Search size={13}/></span>
              <input className="ap-search" placeholder="Reference or email…" value={search}
                onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key==='Enter' && load()}/>
            </div>
            <select className="ap-select" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
            </select>
            <button className="ap-btn-primary" onClick={load} style={{ padding:'.58rem .9rem' }}><RefreshCw size={13}/></button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding:'2.5rem', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:'.65rem' }}>
            <Spinner/>
          </div>
        ) : items.length === 0 ? (
          <div className="ap-empty">
            <div className="ap-empty-ico" style={{ display:'flex', justifyContent:'center', opacity:.25 }}><CalendarCheck size={44} strokeWidth={1}/></div>
            <div className="ap-empty-title">No bookings found</div>
            <div className="ap-empty-sub">Try adjusting your filters</div>
          </div>
        ) : (
          <>
            <div style={{ overflowX:'auto' }}>
              <table className="ap-tbl">
                <thead>
                  <tr><th>Reference</th><th>Guest</th><th>Room</th><th>Check-In</th><th>Check-Out</th><th>Nights</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {visible.map(b => (
                    <tr key={b.id} style={{ opacity: b.status==='CANCELLED' ? .55 : 1 }}>
                      <td style={{ fontFamily:'monospace', fontSize:'.73rem', color: b.status==='CANCELLED'?'var(--red)':'var(--gold-dark)', fontWeight:700 }}>
                        {b.status==='CANCELLED' && <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:'var(--red)', marginRight:4 }}/>}
                        {b.bookingReference}
                      </td>
                      <td>
                        <div style={{ fontWeight:600, fontSize:'.82rem' }}>{b.guestUsername}</div>
                        <div style={{ fontSize:'.7rem', color:'var(--text-muted)' }}>{b.guestEmail}</div>
                      </td>
                      <td style={{ whiteSpace:'nowrap' }}>{b.roomType} #{b.roomNumber}</td>
                      <td style={{ fontSize:'.76rem', color:'var(--text-muted)', whiteSpace:'nowrap' }}>{fmtDate(b.checkInDate)}</td>
                      <td style={{ fontSize:'.76rem', color:'var(--text-muted)', whiteSpace:'nowrap' }}>{fmtDate(b.checkOutDate)}</td>
                      <td style={{ textAlign:'center' }}>{b.numberOfNights}</td>
                      <td><Pill status={b.status}/></td>
                      <td>
                        <button className="ap-btn-ghost" style={{ padding:'.28rem .65rem', fontSize:'.72rem' }} onClick={() => openDetail(b)}>
                          <Eye size={12}/>View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={page} total={items.length} size={PAGE_SIZE} setPage={setPage}/>
          </>
        )}
      </div>

      {/* Detail Modal */}
      <Modal show={!!detail} onHide={() => setDetail(null)} size="lg" centered className="ap-modal"
        style={{ '--bs-modal-header-padding':'1rem 1.25rem' }}>
        <Modal.Header closeButton>
          <Modal.Title>Booking {detail && <span style={{ fontFamily:'monospace', fontSize:'.85rem', color:'var(--gold-dark)', marginLeft:'.4rem' }}>#{detail?.bookingReference}</span>}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight:'70vh', overflowY:'auto' }}>
          {detail && (
            <>
              {detail.status === 'CANCELLED' && (
                <div style={{ display:'flex', alignItems:'center', gap:'.6rem', background:'var(--red-bg)', border:'1px solid rgba(220,53,69,0.22)', borderRadius:9, padding:'.7rem .9rem', marginBottom:'1rem', fontSize:'.8rem', color:'var(--red)', fontWeight:600 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--red)', flexShrink:0 }}/>
                  This booking has been cancelled.
                </div>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'.6rem', marginBottom:'.85rem' }}>
                {[
                  ['Guest',    detail.guestUsername],
                  ['Email',    detail.guestEmail],
                  ['Room',     `${detail.roomType} #${detail.roomNumber}`],
                  ['Guests',   `${detail.numberOfGuests} pax`],
                  ['Check-In', fmtDate(detail.checkInDate)],
                  ['Check-Out',fmtDate(detail.checkOutDate)],
                  ['Nights',   detail.numberOfNights],
                  ['Total',    fmt(detail.totalAmount)],
                  ['Remaining',fmt(detail.remainingAmount||0)],
                ].map(([k,v]) => (
                  <div key={k} style={{ background:'var(--surface2)', borderRadius:8, padding:'.6rem .8rem', border:'1px solid var(--border)' }}>
                    <div style={{ fontSize:'.62rem', textTransform:'uppercase', letterSpacing:'.08em', color:'var(--text-muted)', fontWeight:700, marginBottom:'.18rem' }}>{k}</div>
                    <div style={{ fontSize:'.84rem', color:'var(--text)', fontWeight:600 }}>{v||'—'}</div>
                  </div>
                ))}
              </div>

              {detail.specialRequests && (
                <div style={{ background:'#fffbf0', border:'1px solid rgba(201,168,76,0.25)', borderRadius:8, padding:'.65rem .9rem', marginBottom:'.85rem', fontSize:'.82rem', color:'var(--text-sub)', fontStyle:'italic' }}>
                  <div style={{ fontStyle:'normal', fontWeight:700, fontSize:'.62rem', textTransform:'uppercase', letterSpacing:'.08em', color:'var(--gold-dark)', marginBottom:'.22rem' }}>Special Requests</div>
                  {detail.specialRequests}
                </div>
              )}

              {/* Status update — disabled for cancelled */}
              <div style={{ display:'flex', alignItems:'center', gap:'.75rem', background:'var(--surface2)', borderRadius:10, padding:'.8rem 1rem', border:'1px solid var(--border)', flexWrap:'wrap' }}>
                <div style={{ fontWeight:600, fontSize:'.83rem' }}>Update Status:</div>
                {detail.status === 'CANCELLED' ? (
                  <div style={{ display:'flex', alignItems:'center', gap:.5+'rem', background:'var(--red-bg)', border:'1px solid rgba(220,53,69,0.2)', borderRadius:8, padding:'.5rem .85rem', fontSize:'.8rem', color:'var(--red)', fontWeight:600, flex:1 }}>
                    <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--red)', display:'inline-block' }}/>
                    Status updates disabled for cancelled bookings
                  </div>
                ) : (
                  <>
                    <select className="ap-sel" value={newStatus} onChange={e => setNewStatus(e.target.value)} style={{ flex:1, maxWidth:220 }}>
                      {STATUS_OPTIONS.filter(s => s !== 'CANCELLED').map(s => (
                        <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
                      ))}
                    </select>
                    <button className="ap-btn-primary" disabled={saving || newStatus===detail.status} onClick={applyStatus}>
                      {saving ? <><div className="ap-spin-sm"/>Saving…</> : '✓ Apply'}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}