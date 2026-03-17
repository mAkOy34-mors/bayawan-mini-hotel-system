// AdminBookings.jsx
import { useState, useEffect, useCallback } from 'react';
import { Modal } from 'react-bootstrap';
import { adminGetBookings, adminGetBooking, adminSetBookingStatus } from './adminApi';
import { SHARED_CSS, fmt, fmtDate, fmtDT, Pill, Skel, Spinner, Pager, Toast, useToast } from './adminShared';

const PAGE_SIZE = 10;
const STATUS_OPTIONS = ['PENDING_DEPOSIT','CONFIRMED','CHECKED_IN','CHECKED_OUT','COMPLETED','CANCELLED'];

export function AdminBookings({ token }) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('');
  const [page,    setPage]    = useState(1);
  const [detail,  setDetail]  = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const { toast, show } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter) params.set('status', filter);
    if (search) params.set('search', search);
    const data = await adminGetBookings(token, params.toString()).catch(()=>[]);
    setItems(Array.isArray(data) ? data : []);
    setPage(1);
    setLoading(false);
  }, [token, filter, search]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id) => {
    setDetailLoading(true); setShowDetail(true); setDetail(null);
    const d = await adminGetBooking(token, id).catch(()=>null);
    setDetail(d); setNewStatus(d?.status||''); setDetailLoading(false);
  };

  const applyStatus = async () => {
    if (!detail || newStatus === detail.status) return;
    setSaving(true);
    try {
      await adminSetBookingStatus(token, detail.id, newStatus);
      show(`Status updated to ${newStatus}`);
      setDetail(d => ({ ...d, status: newStatus }));
      setItems(prev => prev.map(b => b.id === detail.id ? { ...b, status: newStatus } : b));
      setShowDetail(false);
    } catch (e) { show(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const isCancelled = (status) => status === 'CANCELLED';

  const visible = items.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const extraCss = `
    /* ── Cancelled row indicator ── */
    .ab-row-cancelled td { opacity:.55; }
    .ab-row-cancelled { background:rgba(220,53,69,0.03) !important; }
    .ab-row-cancelled:hover td { background:rgba(220,53,69,0.04) !important; }
    .ab-cancelled-badge {
      display:inline-flex; align-items:center; gap:.28rem;
      background:rgba(220,53,69,0.1); color:#dc3545;
      border:1px solid rgba(220,53,69,0.25); border-radius:6px;
      padding:.2rem .55rem; font-size:.65rem; font-weight:700;
      text-transform:uppercase; letter-spacing:.04em; white-space:nowrap;
    }
    .ab-cancelled-stripe {
      position:absolute; top:0; left:0; right:0; height:100%;
      background:repeating-linear-gradient(
        -45deg,
        transparent, transparent 8px,
        rgba(220,53,69,0.04) 8px, rgba(220,53,69,0.04) 16px
      );
      pointer-events:none; border-radius:inherit;
    }

    /* ── Cancelled modal banner ── */
    .ab-cancelled-banner {
      display:flex; align-items:center; gap:.85rem;
      background:rgba(220,53,69,0.07); border:1px solid rgba(220,53,69,0.22);
      border-radius:10px; padding:.85rem 1.1rem; margin-bottom:1rem;
    }
    .ab-cancelled-banner-ico {
      width:36px; height:36px; border-radius:9px; flex-shrink:0;
      background:rgba(220,53,69,0.12); display:flex; align-items:center; justify-content:center;
      font-size:1rem;
    }
    .ab-cancelled-banner-title { font-size:.83rem; font-weight:700; color:#dc3545; margin-bottom:.12rem; }
    .ab-cancelled-banner-sub   { font-size:.74rem; color:#e05a5a; line-height:1.4; }

    /* ── Locked status box ── */
    .ab-status-locked {
      display:flex; align-items:center; gap:.75rem; padding:.9rem 1rem;
      background:rgba(220,53,69,0.05); border:1px solid rgba(220,53,69,0.18);
      border-radius:10px; margin-top:.5rem;
    }
    .ab-status-locked-ico { font-size:1.1rem; flex-shrink:0; }
    .ab-status-locked-text { font-size:.82rem; color:#dc3545; font-weight:600; }
    .ab-status-locked-sub  { font-size:.74rem; color:#e05a5a; margin-top:.1rem; }

    /* ── Compact modal grid ── */
    .ab-detail-scroll {
      overflow-y: auto;
      max-height: calc(75vh - 120px);
      scrollbar-width: thin;
      scrollbar-color: rgba(201,168,76,0.3) #f4f6f8;
      padding-right: 2px;
    }
    .ab-detail-scroll::-webkit-scrollbar { width: 4px; }
    .ab-detail-scroll::-webkit-scrollbar-track { background: #f4f6f8; border-radius: 99px; }
    .ab-detail-scroll::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.4); border-radius: 99px; }

    .ab-detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: .6rem;
      margin-bottom: .85rem;
    }
    @media(max-width:640px){ .ab-detail-grid { grid-template-columns: 1fr 1fr; } }

    .ab-detail-item {
      background: var(--surface2); border-radius: 8px;
      padding: .55rem .75rem; border: 1px solid var(--border);
    }
    .ab-detail-key {
      font-size: .61rem; text-transform: uppercase; letter-spacing: .08em;
      color: var(--text-muted); font-weight: 700; margin-bottom: .15rem;
    }
    .ab-detail-val {
      font-size: .82rem; color: var(--text); font-weight: 600; white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis;
    }
    .ab-detail-val.gold   { color: var(--gold-dark); }
    .ab-detail-val.green  { color: #2d9b6f; }
    .ab-detail-val.orange { color: #f59e0b; }
    .ab-detail-val.red    { color: #dc3545; }
  `;

  return (
    <div className="ap-root">
      <style>{SHARED_CSS}{extraCss}</style>
      <Toast toast={toast}/>

      <div className="ap-hd">
        <div><h1 className="ap-title">Bookings</h1><p className="ap-sub">Manage all reservations</p></div>
      </div>

      {/* Stats row */}
      <div className="ap-stats" style={{ gridTemplateColumns:'repeat(6,1fr)' }}>
        {[
          { label:'Total',     value: items.length,                                          color:'gold'   },
          { label:'Pending',   value: items.filter(b=>b.status==='PENDING_DEPOSIT').length,  color:'orange' },
          { label:'Confirmed', value: items.filter(b=>b.status==='CONFIRMED').length,        color:'blue'   },
          { label:'Checked In',value: items.filter(b=>b.status==='CHECKED_IN').length,       color:'teal'   },
          { label:'Completed', value: items.filter(b=>b.status==='COMPLETED').length,        color:'green'  },
          { label:'Cancelled', value: items.filter(b=>b.status==='CANCELLED').length,        color:'red'    },
        ].map((s,i) => (
          <div key={i} className={`ap-stat ${s.color}`}
            style={{ animationDelay:`${i*0.05}s`, padding:'.9rem 1rem', cursor:s.label!=='Total'?'pointer':'default' }}
            onClick={()=>{ if(s.label!=='Total') setFilter(f=>f===s.label.toUpperCase().replace(' ','_')?'':s.label.toUpperCase().replace(' ','_')); }}>
            <div className="ap-stat-lbl">{s.label}</div>
            <div className="ap-stat-val" style={{ fontSize:'1.6rem' }}>{loading ? <Skel h={24} w={30}/> : s.value}</div>
          </div>
        ))}
      </div>

      <div className="ap-panel">
        <div className="ap-panel-hd">
          <div>
            <div className="ap-panel-title">All Bookings</div>
            <div className="ap-panel-sub">{!loading && `${items.length} records`}</div>
          </div>
          <div className="ap-toolbar" style={{ margin:0 }}>
            <div className="ap-search-wrap">
              <span className="ap-search-ico">🔍</span>
              <input className="ap-search" placeholder="Reference or email…" value={search}
                onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()}/>
            </div>
            <select className="ap-select" value={filter} onChange={e=>setFilter(e.target.value)}>
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}
            </select>
            <button className="ap-btn-primary" onClick={load} style={{ padding:'.58rem .9rem' }}>🔍</button>
          </div>
        </div>

        {loading
          ? <div style={{ padding:'2.5rem', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:'.65rem' }}><Spinner/><span style={{ fontSize:'.78rem', color:'var(--text-muted)' }}>Loading bookings…</span></div>
          : items.length === 0
            ? <div className="ap-empty"><div className="ap-empty-ico">🛏️</div><div className="ap-empty-title">No bookings found</div><div className="ap-empty-sub">Try adjusting your filters</div></div>
            : <>
                <div style={{ overflowX:'auto' }}>
                  <table className="ap-tbl">
                    <thead>
                      <tr>
                        <th>Reference</th><th>Guest</th><th>Room</th>
                        <th>Check-in</th><th>Check-out</th><th>Nights</th>
                        <th>Total</th><th>Deposit</th><th>Remaining</th>
                        <th>Payment</th><th>Status</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map(b => (
                        <tr key={b.id} className={isCancelled(b.status) ? 'ab-row-cancelled' : ''} style={{ position:'relative' }}>
                          <td>
                            <div style={{ display:'flex', alignItems:'center', gap:'.45rem' }}>
                              <span style={{ fontFamily:'monospace', fontSize:'.74rem', color: isCancelled(b.status) ? '#dc3545' : 'var(--gold-dark)', fontWeight:700 }}>
                                {b.bookingReference}
                              </span>
                              {isCancelled(b.status) && (
                                <span className="ab-cancelled-badge">✕ Cancelled</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight:600, color:'var(--text)', fontSize:'.82rem', whiteSpace:'nowrap' }}>{b.guestUsername}</div>
                            <div style={{ fontSize:'.7rem', color:'var(--text-muted)' }}>{b.guestEmail}</div>
                          </td>
                          <td style={{ whiteSpace:'nowrap' }}>{b.roomType} #{b.roomNumber}</td>
                          <td style={{ fontSize:'.76rem', color:'var(--text-muted)', whiteSpace:'nowrap' }}>{fmtDate(b.checkInDate)}</td>
                          <td style={{ fontSize:'.76rem', color:'var(--text-muted)', whiteSpace:'nowrap' }}>{fmtDate(b.checkOutDate)}</td>
                          <td style={{ textAlign:'center' }}>{b.numberOfNights}</td>
                          <td><span style={{ fontWeight:700, color:'var(--text)', whiteSpace:'nowrap' }}>{fmt(b.totalAmount)}</span></td>
                          <td style={{ fontSize:'.78rem', color:'var(--orange)', whiteSpace:'nowrap' }}>{fmt(b.depositAmount)}</td>
                          <td style={{ fontSize:'.78rem', color:'var(--red)', whiteSpace:'nowrap' }}>{fmt(b.remainingAmount)}</td>
                          <td><Pill status={b.paymentStatus} label={b.paymentStatus}/></td>
                          <td><Pill status={b.status}/></td>
                          <td>
                            <button className="ap-btn-ghost" style={{ padding:'.28rem .65rem', fontSize:'.72rem' }} onClick={()=>openDetail(b.id)}>
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pager page={page} total={items.length} size={PAGE_SIZE} setPage={setPage}/>
              </>
        }
      </div>

      {/* ── Detail Modal ── */}
      <Modal show={showDetail} onHide={()=>setShowDetail(false)} size="lg" centered className="ap-modal">
        <Modal.Header closeButton style={{ padding:'.9rem 1.35rem', borderBottom:'1px solid var(--border)' }}>
          <Modal.Title style={{ display:'flex', alignItems:'center', gap:'.65rem' }}>
            Booking Detail
            {detail && (
              <span style={{ fontFamily:'monospace', fontSize:'.82rem', color:'var(--gold-dark)', fontWeight:700 }}>
                #{detail.bookingReference}
              </span>
            )}
            {detail && isCancelled(detail.status) && (
              <span className="ab-cancelled-badge" style={{ fontSize:'.62rem' }}>✕ Cancelled</span>
            )}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ padding:'1.1rem 1.35rem' }}>
          {detailLoading
            ? <div style={{ textAlign:'center', padding:'2rem', display:'flex', flexDirection:'column', alignItems:'center', gap:'.65rem' }}>
                <Spinner/>
                <span style={{ color:'var(--text-muted)', fontSize:'.8rem' }}>Loading…</span>
              </div>
            : !detail ? null
            : <div className="ab-detail-scroll">

                {/* ── Cancelled banner ── */}
                {isCancelled(detail.status) && (
                  <div className="ab-cancelled-banner">
                    <div className="ab-cancelled-banner-ico">🚫</div>
                    <div>
                      <div className="ab-cancelled-banner-title">This booking has been cancelled</div>
                      <div className="ab-cancelled-banner-sub">
                        This reservation was cancelled and cannot be modified. Status updates are disabled.
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Detail grid — 3 columns ── */}
                <div className="ab-detail-grid">
                  <div className="ab-detail-item">
                    <div className="ab-detail-key">Guest</div>
                    <div className="ab-detail-val">{detail.guestUsername || '—'}</div>
                  </div>
                  <div className="ab-detail-item" style={{ gridColumn:'span 2' }}>
                    <div className="ab-detail-key">Email</div>
                    <div className="ab-detail-val">{detail.guestEmail || '—'}</div>
                  </div>
                  <div className="ab-detail-item">
                    <div className="ab-detail-key">Room</div>
                    <div className="ab-detail-val">{detail.roomType} #{detail.roomNumber}</div>
                  </div>
                  <div className="ab-detail-item">
                    <div className="ab-detail-key">Guests</div>
                    <div className="ab-detail-val">{detail.numberOfGuests}</div>
                  </div>
                  <div className="ab-detail-item">
                    <div className="ab-detail-key">Nights</div>
                    <div className="ab-detail-val">{detail.numberOfNights}</div>
                  </div>
                  <div className="ab-detail-item">
                    <div className="ab-detail-key">Check-In</div>
                    <div className="ab-detail-val">{fmtDate(detail.checkInDate)}</div>
                  </div>
                  <div className="ab-detail-item">
                    <div className="ab-detail-key">Check-Out</div>
                    <div className="ab-detail-val">{fmtDate(detail.checkOutDate)}</div>
                  </div>
                  <div className="ab-detail-item">
                    <div className="ab-detail-key">Created</div>
                    <div className="ab-detail-val">{fmtDT(detail.createdAt)}</div>
                  </div>
                  <div className="ab-detail-item">
                    <div className="ab-detail-key">Total</div>
                    <div className="ab-detail-val gold">{fmt(detail.totalAmount)}</div>
                  </div>
                  <div className="ab-detail-item">
                    <div className="ab-detail-key">Deposit Paid</div>
                    <div className="ab-detail-val green">{fmt(detail.depositAmount)}</div>
                  </div>
                  <div className="ab-detail-item">
                    <div className="ab-detail-key">Remaining</div>
                    <div className={`ab-detail-val ${parseFloat(detail.remainingAmount) > 0 ? 'orange' : 'green'}`}>
                      {fmt(detail.remainingAmount)}
                    </div>
                  </div>
                  <div className="ab-detail-item">
                    <div className="ab-detail-key">Payment Status</div>
                    <div className="ab-detail-val"><Pill status={detail.paymentStatus} label={detail.paymentStatus}/></div>
                  </div>
                  <div className="ab-detail-item">
                    <div className="ab-detail-key">Booking Status</div>
                    <div className="ab-detail-val"><Pill status={detail.status}/></div>
                  </div>
                </div>

                {/* Special requests */}
                {detail.specialRequests && (
                  <div style={{ background:'#fffbf0', border:'1px solid rgba(201,168,76,0.25)', borderRadius:8, padding:'.65rem .9rem', marginBottom:'.85rem' }}>
                    <div style={{ fontSize:'.61rem', textTransform:'uppercase', letterSpacing:'.08em', color:'var(--gold-dark)', fontWeight:700, marginBottom:'.22rem' }}>Special Requests</div>
                    <div style={{ fontSize:'.82rem', color:'var(--text-sub)', lineHeight:1.55 }}>{detail.specialRequests}</div>
                  </div>
                )}

                {/* ── Status update — LOCKED if cancelled ── */}
                {isCancelled(detail.status) ? (
                  <div className="ab-status-locked">
                    <span className="ab-status-locked-ico">🔒</span>
                    <div>
                      <div className="ab-status-locked-text">Status updates are disabled</div>
                      <div className="ab-status-locked-sub">Cancelled bookings cannot be modified or reactivated.</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display:'flex', alignItems:'center', gap:'.85rem', padding:'.9rem 1rem', background:'var(--surface2)', borderRadius:10, border:'1px solid var(--border)' }}>
                    <div style={{ fontWeight:600, fontSize:'.84rem', color:'var(--text)', whiteSpace:'nowrap' }}>Update Status:</div>
                    <select className="ap-sel" value={newStatus} onChange={e=>setNewStatus(e.target.value)} style={{ flex:1, maxWidth:200 }}>
                      {STATUS_OPTIONS.filter(s => s !== 'CANCELLED').map(s => (
                        <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
                      ))}
                    </select>
                    <button className="ap-btn-primary" disabled={saving || newStatus===detail.status} onClick={applyStatus}>
                      {saving ? <><div className="ap-spin-sm"/>Saving…</> : '✓ Apply'}
                    </button>
                  </div>
                )}
              </div>
          }
        </Modal.Body>
      </Modal>
    </div>
  );
}