// ReceptionistArrivals.jsx — Check-in management
import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { SHARED_CSS, fmt, fmtDate, Pill, Skel, Spinner, useToast, Toast } from '../admin/adminShared';
import {
  LogIn, Search, RefreshCw, CheckCircle2, AlertTriangle,
  BedDouble, User, Calendar, CreditCard, FileText,
} from 'lucide-react';

const BASE = '/api/v1';
const h = (t) => ({ Authorization: `Bearer ${t}`, 'ngrok-skip-browser-warning': 'true' });
const hj = (t) => ({ ...h(t), 'Content-Type': 'application/json' });

export function ReceptionistArrivals({ token }) {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const { toast, show } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0,10);
      const res   = await fetch(`${BASE}/admin/bookings/?checkIn=${today}`, { headers: h(token) });
      const data  = await res.json().catch(() => []);
      setBookings((Array.isArray(data) ? data : []).filter(b =>
        b.checkInDate?.slice(0,10) === today && ['CONFIRMED','PENDING_DEPOSIT'].includes(b.status)
      ));
    } catch { show('Failed to load arrivals', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [token]);

  const filtered = bookings.filter(b =>
    !search ||
    b.bookingReference?.toLowerCase().includes(search.toLowerCase()) ||
    b.guestUsername?.toLowerCase().includes(search.toLowerCase()) ||
    b.guestEmail?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCheckIn = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/admin/bookings/${selected.id}/status/`, {
        method: 'POST',
        headers: hj(token),
        body: JSON.stringify({ status: 'CHECKED_IN' }),
      });
      if (!res.ok) throw new Error('Failed to check in');
      show(`${selected.bookingReference} checked in successfully!`);
      setSelected(null);
      load();
    } catch (e) { show(e.message, 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="ap-root">
      <style>{SHARED_CSS}</style>
      <Toast toast={toast}/>

      <div className="ap-hd">
        <div>
          <h1 className="ap-title" style={{ display:'flex', alignItems:'center', gap:'.6rem' }}>
            <LogIn size={22} color="var(--blue)"/>Today's Arrivals
          </h1>
          <p className="ap-sub">{new Date().toLocaleDateString('en-PH', { weekday:'long', year:'numeric', month:'long', day:'numeric' })} · {bookings.length} expected</p>
        </div>
        <button className="ap-btn-ghost" onClick={load}><RefreshCw size={14}/>Refresh</button>
      </div>

      <div className="ap-panel">
        <div className="ap-panel-hd">
          <div className="ap-panel-title">Expected Check-ins</div>
          <div className="ap-toolbar" style={{ margin:0 }}>
            <div className="ap-search-wrap">
              <span className="ap-search-ico"><Search size={13}/></span>
              <input className="ap-search" placeholder="Search by name or reference…" value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding:'2.5rem', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:'.65rem' }}>
            <Spinner/><span style={{ fontSize:'.78rem', color:'var(--text-muted)' }}>Loading arrivals…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="ap-empty">
            <div className="ap-empty-ico" style={{ display:'flex', justifyContent:'center', opacity:.25 }}><LogIn size={44} strokeWidth={1}/></div>
            <div className="ap-empty-title">No arrivals today</div>
            <div className="ap-empty-sub">All check-ins have been processed or no guests are expected</div>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table className="ap-tbl">
              <thead>
                <tr><th>Reference</th><th>Guest</th><th>Room</th><th>Guests</th><th>Deposit</th><th>Remaining</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontFamily:'monospace', fontSize:'.73rem', color:'var(--gold-dark)', fontWeight:700 }}>{b.bookingReference}</td>
                    <td>
                      <div style={{ fontWeight:600, fontSize:'.82rem' }}>{b.guestUsername}</div>
                      <div style={{ fontSize:'.7rem', color:'var(--text-muted)' }}>{b.guestEmail}</div>
                    </td>
                    <td style={{ whiteSpace:'nowrap' }}>{b.roomType} #{b.roomNumber}</td>
                    <td style={{ textAlign:'center' }}>{b.numberOfGuests}</td>
                    <td style={{ color:'var(--green)', fontWeight:700, fontSize:'.8rem' }}>{fmt(b.depositAmount)}</td>
                    <td style={{ color: parseFloat(b.remainingAmount||0) > 0 ? 'var(--red)' : 'var(--green)', fontWeight:700, fontSize:'.8rem' }}>
                      {fmt(b.remainingAmount||0)}
                    </td>
                    <td><Pill status={b.status}/></td>
                    <td>
                      <button className="ap-btn-green" style={{ fontSize:'.73rem', padding:'.3rem .75rem' }} onClick={() => setSelected(b)}>
                        <LogIn size={12}/>Check In
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Check-in Modal */}
      <Modal show={!!selected} onHide={() => setSelected(null)} centered className="ap-modal">
        <Modal.Header closeButton>
          <Modal.Title style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
            <LogIn size={17} color="var(--blue)"/>Confirm Check-In
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selected && (
            <>
              <div style={{ background:'var(--blue-bg)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:10, padding:'.85rem 1rem', marginBottom:'1rem' }}>
                <div style={{ fontSize:'.7rem', color:'var(--blue)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'.55rem', display:'flex', alignItems:'center', gap:'.4rem' }}>
                  <BedDouble size={13}/>Booking Details
                </div>
                {[
                  ['Reference',  selected.bookingReference],
                  ['Guest',      selected.guestUsername],
                  ['Room',       `${selected.roomType} #${selected.roomNumber}`],
                  ['Check-Out',  fmtDate(selected.checkOutDate)],
                  ['Deposit',    fmt(selected.depositAmount)],
                  ['Remaining',  fmt(selected.remainingAmount||0)],
                ].map(([k,v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:'.81rem', marginBottom:'.3rem' }}>
                    <span style={{ color:'var(--text-muted)' }}>{k}</span>
                    <span style={{ fontWeight:600, color:'var(--text)' }}>{v}</span>
                  </div>
                ))}
              </div>

              {parseFloat(selected.remainingAmount||0) > 0 && (
                <div style={{ display:'flex', gap:'.6rem', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.22)', borderRadius:9, padding:'.7rem .9rem', marginBottom:'1rem', fontSize:'.8rem', color:'var(--orange)' }}>
                  <AlertTriangle size={15} style={{ flexShrink:0, marginTop:1 }}/>
                  <span>Guest has a remaining balance of <strong>{fmt(selected.remainingAmount)}</strong>. Collect payment before or during check-in.</span>
                </div>
              )}

              {selected.specialRequests && (
                <div style={{ background:'#fffbf0', border:'1px solid rgba(201,168,76,0.25)', borderRadius:9, padding:'.65rem .9rem', fontSize:'.8rem', color:'var(--text-sub)', fontStyle:'italic' }}>
                  <div style={{ fontStyle:'normal', fontWeight:700, fontSize:'.65rem', textTransform:'uppercase', letterSpacing:'.07em', color:'var(--gold-dark)', marginBottom:'.25rem' }}>Special Requests</div>
                  {selected.specialRequests}
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className="ap-btn-ghost" onClick={() => setSelected(null)}>Cancel</button>
          <button className="ap-btn-primary" disabled={saving} onClick={handleCheckIn}
            style={{ background:'linear-gradient(135deg,#2563eb,#60a5fa)', boxShadow:'0 2px 8px rgba(59,130,246,0.28)' }}>
            {saving ? <><div className="ap-spin-sm"/>Processing…</> : <><LogIn size={14}/>Confirm Check-In</>}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}