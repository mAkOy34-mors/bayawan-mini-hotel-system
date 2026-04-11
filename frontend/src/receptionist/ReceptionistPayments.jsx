// ReceptionistPayments.jsx — View payments and record cash payments
import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { SHARED_CSS, fmt, fmtDate, fmtDT, Pill, Skel, Spinner, Pager, useToast, Toast } from '../admin/adminShared';
import {
  CreditCard, Search, RefreshCw, CheckCircle2, Clock,
  XCircle, Banknote, AlertTriangle, Receipt,
} from 'lucide-react';

import { API_BASE as BASE } from '../constants/config';
// then remove: const BASE = '/api/v1';
const PAGE_SIZE = 12;
const h  = (t) => ({ Authorization:`Bearer ${t}`,'ngrok-skip-browser-warning':'true' });
const hj = (t) => ({ ...h(t),'Content-Type':'application/json' });

export function ReceptionistPayments({ token }) {
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('all');
  const [page,     setPage]     = useState(1);

  // Cash payment modal
  const [showCash, setShowCash]   = useState(false);
  const [bookRef,  setBookRef]    = useState('');
  const [cashAmt,  setCashAmt]    = useState('');
  const [cashNote, setCashNote]   = useState('');
  const [cashBook, setCashBook]   = useState(null);
  const [bSearching,setBSearching]= useState(false);
  const [recording, setRecording] = useState(false);
  const { toast, show } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BASE}/receptionist/payments/`, { headers: h(token) });
      const data = await res.json().catch(() => []);
      setPayments(Array.isArray(data) ? data : (data.results || []));
    } catch { show('Failed to load payments', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [token]);

  const isRefund = (p) => p.description?.toLowerCase().startsWith('refund') || p.type === 'REFUND';

  const filtered = payments.filter(p => {
    const matchSearch = !search ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.guestEmail?.toLowerCase().includes(search.toLowerCase()) ||
      p.bookingReference?.toLowerCase().includes(search.toLowerCase());
    let matchFilter = true;
    if (filter === 'REFUNDED') matchFilter = isRefund(p);
    else if (filter !== 'all') matchFilter = p.status === filter && !isRefund(p);
    return matchFilter && matchSearch;
  });

  const visible    = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const totalPaid  = payments.filter(p=>p.status==='PAID'&&!isRefund(p)).reduce((s,p)=>s+parseFloat(p.amount||0),0);
  const totalPend  = payments.filter(p=>p.status==='PENDING').reduce((s,p)=>s+parseFloat(p.amount||0),0);
  const totalRef   = payments.filter(p=>isRefund(p)).reduce((s,p)=>s+parseFloat(p.amount||0),0);

  const searchBooking = async () => {
    if (!bookRef.trim()) return;
    setBSearching(true); setCashBook(null);
    try {
      const res  = await fetch(`${BASE}/receptionist/bookings/?search=${encodeURIComponent(bookRef)}`, { headers: h(token) });
      const data = await res.json().catch(() => []);
      const list = Array.isArray(data) ? data : [];
      const match = list.find(b => b.bookingReference?.toLowerCase() === bookRef.toLowerCase().trim());
      if (match) { setCashBook(match); setCashAmt(String(parseFloat(match.remainingAmount||0))); }
      else show('Booking not found', 'error');
    } catch { show('Search failed', 'error'); }
    finally { setBSearching(false); }
  };

  const recordCash = async () => {
    if (!cashBook) { show('Find a booking first', 'error'); return; }
    if (!cashAmt || parseFloat(cashAmt) <= 0) { show('Enter a valid amount', 'error'); return; }
    setRecording(true);
    try {
      const res = await fetch(`${BASE}/receptionist/payments/`, {
        method: 'POST', headers: hj(token),
        body: JSON.stringify({
          bookingId:   cashBook.id,
          amount:      parseFloat(cashAmt),
          type:        'BALANCE',
          status:      'PAID',
          description: cashNote || `Cash payment for booking ${cashBook.bookingReference}`,
          email:       cashBook.guestEmail,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Failed to record payment');
      }
      show(`Cash payment of ${fmt(cashAmt)} recorded!`);
      setShowCash(false); setBookRef(''); setCashAmt(''); setCashNote(''); setCashBook(null);
      load();
    } catch (e) { show(e.message, 'error'); }
    finally { setRecording(false); }
  };

  return (
    <div className="ap-root">
      <style>{SHARED_CSS}</style>
      <Toast toast={toast}/>

      <div className="ap-hd">
        <div>
          <h1 className="ap-title" style={{ display:'flex', alignItems:'center', gap:'.6rem' }}>
            <CreditCard size={22} color="var(--gold-dark)"/>Payment Records
          </h1>
          <p className="ap-sub">View transactions · Record cash payments for walk-ins and balance payments</p>
        </div>
        <div style={{ display:'flex', gap:'.5rem' }}>
          <button className="ap-btn-ghost" onClick={load}><RefreshCw size={14}/>Refresh</button>
          <button className="ap-btn-primary" onClick={() => setShowCash(true)}>
            <Banknote size={14}/>Record Cash Payment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="ap-stats">
        {[
          { label:'Total Collected', value:fmt(totalPaid),  color:'green'  },
          { label:'Pending',         value:fmt(totalPend),  color:'orange' },
          { label:'Total Refunds',   value:fmt(totalRef),   color:'red'    },
          { label:'Transactions',    value:payments.length, color:'blue'   },
        ].map((s,i) => (
          <div key={i} className={`ap-stat ${s.color}`} style={{ animationDelay:`${i*0.05}s` }}>
            <div className="ap-stat-lbl">{s.label}</div>
            <div className="ap-stat-val">{loading ? <Skel h={24} w={60}/> : s.value}</div>
          </div>
        ))}
      </div>

      <div className="ap-panel">
        <div className="ap-panel-hd">
          <div><div className="ap-panel-title">Transactions</div><div className="ap-panel-sub">{!loading && `${filtered.length} records`}</div></div>
          <div className="ap-toolbar" style={{ margin:0 }}>
            <div className="ap-search-wrap">
              <span className="ap-search-ico"><Search size={13}/></span>
              <input className="ap-search" placeholder="Search by description, email or ref…" value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}/>
            </div>
            <select className="ap-select" value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}>
              <option value="all">All</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding:'2.5rem', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:'.65rem' }}><Spinner/></div>
        ) : filtered.length === 0 ? (
          <div className="ap-empty">
            <div style={{ display:'flex', justifyContent:'center', opacity:.25, marginBottom:'.65rem' }}><Receipt size={44} strokeWidth={1}/></div>
            <div className="ap-empty-title">No payments found</div>
          </div>
        ) : (
          <>
            <div style={{ overflowX:'auto' }}>
              <table className="ap-tbl">
                <thead>
                  <tr><th>Description</th><th>Booking Ref</th><th>Guest</th><th>Type</th><th>Amount</th><th>Date</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {visible.map(p => {
                    const refund = isRefund(p);
                    return (
                      <tr key={p.id}>
                        <td style={{ maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:'.8rem', color: refund?'var(--red)':'var(--text)', fontWeight:600 }}>
                          {p.description || 'Payment'}
                        </td>
                        <td style={{ fontFamily:'monospace', fontSize:'.72rem', color:'var(--gold-dark)', fontWeight:700, whiteSpace:'nowrap' }}>
                          {p.bookingReference || p.bookingId || '—'}
                        </td>
                        <td style={{ fontSize:'.78rem', color:'var(--text-muted)' }}>{p.guestEmail || p.email || '—'}</td>
                        <td style={{ fontSize:'.75rem' }}>{refund ? 'REFUND' : (p.type||'—').replace(/_/g,' ')}</td>
                        <td style={{ fontWeight:700, fontSize:'.82rem', color: refund?'var(--red)':'var(--text)', whiteSpace:'nowrap' }}>
                          {refund ? '−' : ''}{fmt(p.amount)}
                        </td>
                        <td style={{ fontSize:'.75rem', color:'var(--text-muted)', whiteSpace:'nowrap' }}>{fmtDate(p.createdAt || p.paidAt)}</td>
                        <td>
                          <span className={`ap-pill ${refund?'PAID':p.status}`} style={refund?{background:'var(--red-bg)',color:'var(--red)',borderColor:'rgba(220,53,69,0.25)'}:{}}>
                            <span className="ap-pill-dot"/>
                            {refund ? 'Refunded' : p.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pager page={page} total={filtered.length} size={PAGE_SIZE} setPage={setPage}/>
          </>
        )}
      </div>

      {/* ── Record Cash Payment Modal ── */}
      <Modal show={showCash} onHide={() => setShowCash(false)} centered className="ap-modal">
        <Modal.Header closeButton>
          <Modal.Title style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
            <Banknote size={17} color="var(--green)"/>Record Cash Payment
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ background:'rgba(45,155,111,0.06)', border:'1px solid rgba(45,155,111,0.2)', borderRadius:9, padding:'.7rem .9rem', marginBottom:'1rem', fontSize:'.79rem', color:'var(--green)' }}>
            Use this to record cash payments for walk-in guests or balance settlements.
            You cannot modify payment amounts — enter the exact amount received.
          </div>

          {/* Booking search */}
          <div className="ap-field" style={{ marginBottom:'.85rem' }}>
            <label className="ap-label">Booking Reference <span className="req">*</span></label>
            <div style={{ display:'flex', gap:'.5rem' }}>
              <input className="ap-input" placeholder="e.g. CGH-XXXXXXXX" value={bookRef}
                onChange={e => { setBookRef(e.target.value); setCashBook(null); }}
                onKeyDown={e => e.key==='Enter' && searchBooking()}
                style={{ flex:1 }}/>
              <button className="ap-btn-ghost" onClick={searchBooking} disabled={bSearching}>
                {bSearching ? <div className="ap-spin-sm" style={{ borderTopColor:'var(--gold)' }}/> : <Search size={14}/>}
              </button>
            </div>
          </div>

          {/* Booking info */}
          {cashBook && (
            <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:9, padding:'.75rem .9rem', marginBottom:'.85rem' }}>
              {[
                ['Guest',     cashBook.guestUsername || cashBook.guestEmail],
                ['Room',      `${cashBook.roomType} #${cashBook.roomNumber}`],
                ['Check-Out', fmtDate(cashBook.checkOutDate)],
                ['Total',     fmt(cashBook.totalAmount)],
                ['Deposit Paid', fmt(cashBook.depositAmount)],
                ['Balance Due',  fmt(cashBook.remainingAmount||0)],
              ].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:'.8rem', marginBottom:'.25rem' }}>
                  <span style={{ color:'var(--text-muted)' }}>{k}</span>
                  <span style={{ fontWeight:600 }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Amount */}
          <div className="ap-form-grid">
            <div className="ap-field">
              <label className="ap-label">Amount Received (₱) <span className="req">*</span></label>
              <input className="ap-input" type="number" step="0.01" min="0"
                placeholder="0.00" value={cashAmt} onChange={e => setCashAmt(e.target.value)}/>
            </div>
          </div>
          <div className="ap-field" style={{ marginBottom:'.85rem' }}>
            <label className="ap-label">Note (optional)</label>
            <input className="ap-input" placeholder="e.g. Cash payment at front desk" value={cashNote}
              onChange={e => setCashNote(e.target.value)}/>
          </div>

          {cashBook && parseFloat(cashAmt||0) > 0 && (
            <div style={{ display:'flex', justifyContent:'space-between', background:'var(--green-bg)', border:'1px solid rgba(45,155,111,0.22)', borderRadius:8, padding:'.6rem .9rem', fontSize:'.82rem', color:'var(--green)', fontWeight:600 }}>
              <span>Recording cash payment of</span>
              <span>{fmt(cashAmt)}</span>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className="ap-btn-ghost" onClick={() => setShowCash(false)}>Cancel</button>
          <button className="ap-btn-primary" disabled={recording || !cashBook || !cashAmt}
            style={{ background:'linear-gradient(135deg,#059669,#34d399)', boxShadow:'0 2px 8px rgba(5,150,105,0.25)' }}
            onClick={recordCash}>
            {recording ? <><div className="ap-spin-sm"/>Recording…</> : <><CheckCircle2 size={14}/>Record Payment</>}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}