// ReceptionistWalkIn.jsx — Create walk-in bookings for guests without reservation
import { useState, useEffect } from 'react';
import { SHARED_CSS, fmt, fmtDate, Spinner, useToast, Toast } from '../admin/adminShared';
import {
  PlusCircle, BedDouble, User, Calendar, Users, CreditCard,
  CheckCircle2, AlertTriangle, Search, RefreshCw,
} from 'lucide-react';

import { API_BASE as BASE } from '../constants/config';
const h  = (t) => ({ Authorization:`Bearer ${t}`,'ngrok-skip-browser-warning':'true' });
const hj = (t) => ({ ...h(t),'Content-Type':'application/json' });

const EXTRA_CSS = `
  .wi-steps { display:flex; gap:0; margin-bottom:1.5rem; }
  .wi-step {
    flex:1; display:flex; flex-direction:column; align-items:center; position:relative;
  }
  .wi-step::after {
    content:''; position:absolute; top:16px; left:calc(50% + 16px);
    right:calc(-50% + 16px); height:2px; background:var(--border); z-index:0;
  }
  .wi-step:last-child::after { display:none; }
  .wi-step-dot {
    width:32px; height:32px; border-radius:50%; display:flex; align-items:center;
    justify-content:center; font-size:.78rem; font-weight:700; z-index:1;
    transition:all .3s; border:2px solid;
  }
  .wi-step-dot.done   { background:var(--green); border-color:var(--green); color:#fff; }
  .wi-step-dot.active { background:#3b82f6; border-color:#3b82f6; color:#fff; }
  .wi-step-dot.idle   { background:#fff; border-color:var(--border); color:var(--text-muted); }
  .wi-step-label { font-size:.68rem; font-weight:600; margin-top:.4rem; color:var(--text-muted); text-align:center; }
  .wi-step-label.active { color:#2563eb; }
  .wi-step-label.done   { color:var(--green); }

  .wi-room-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:.65rem; }
  .wi-room-card {
    border:2px solid var(--border); border-radius:10px; padding:.8rem .9rem; cursor:pointer;
    transition:all .18s; background:#fff;
  }
  .wi-room-card:hover  { border-color:#3b82f6; background:rgba(59,130,246,0.04); }
  .wi-room-card.sel    { border-color:#3b82f6; background:rgba(59,130,246,0.06); }
  .wi-room-card.unavail{ opacity:.4; cursor:not-allowed; }
  .wi-room-num  { font-family:'Cormorant Garamond',serif; font-size:1.4rem; font-weight:600; color:var(--text); }
  .wi-room-type { font-size:.7rem; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); margin-bottom:.3rem; }
  .wi-room-price{ font-size:.76rem; color:var(--text-sub); font-weight:600; }

  .wi-summary-box {
    background:rgba(59,130,246,0.06); border:1px solid rgba(59,130,246,0.2);
    border-radius:12px; padding:1rem 1.1rem;
  }
  .wi-summary-row { display:flex; justify-content:space-between; font-size:.82rem; margin-bottom:.35rem; color:var(--text-sub); }
  .wi-summary-row.total { font-weight:700; color:var(--text); font-size:.9rem; border-top:1px solid rgba(59,130,246,0.15); padding-top:.45rem; margin-top:.45rem; }
`;

const today = () => new Date().toISOString().slice(0,10);
const tomorrow = () => { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().slice(0,10); };

export function ReceptionistWalkIn({ token, setPage }) {
  const [step,    setStep]    = useState(1); // 1=Room, 2=Guest, 3=Confirm
  const [rooms,   setRooms]   = useState([]);
  const [rLoad,   setRLoad]   = useState(true);
  const [selRoom, setSelRoom] = useState(null);
  const [checkIn, setCheckIn] = useState(today());
  const [checkOut,setCheckOut]= useState(tomorrow());
  const [guests,  setGuests]  = useState(1);

  // Guest step
  const [guestMode, setGuestMode]  = useState('existing'); // 'existing' | 'new'
  const [gSearch,   setGSearch]    = useState('');
  const [gResults,  setGResults]   = useState([]);
  const [gLoading,  setGLoading]   = useState(false);
  const [selGuest,  setSelGuest]   = useState(null);
  const [newGuest,  setNewGuest]   = useState({ username:'', email:'', phone:'' });

  // Confirm step
  const [payType,  setPayType]  = useState('DEPOSIT');
  const [saving,   setSaving]   = useState(false);
  const [done,     setDone]     = useState(null);
  const { toast, show } = useToast();

  useEffect(() => {
    fetch(`${BASE}/admin/rooms/`, { headers: h(token) })
      .then(r => r.json()).then(d => setRooms(Array.isArray(d) ? d : [])).catch(() => {})
      .finally(() => setRLoad(false));
  }, [token]);

  const nights = Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000));
  const total  = selRoom ? parseFloat(selRoom.pricePerNight||0) * nights : 0;
  const deposit = total / 2;

  const searchGuests = async () => {
    if (!gSearch.trim()) return;
    setGLoading(true);
    try {
      const res  = await fetch(`${BASE}/admin/guests/?search=${encodeURIComponent(gSearch)}`, { headers: h(token) });
      const data = await res.json().catch(() => []);
      setGResults(Array.isArray(data) ? data : (data.results || []));
    } catch {}
    finally { setGLoading(false); }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      // Register new guest if needed
      let guestEmail = selGuest?.email;
      if (guestMode === 'new') {
        if (!newGuest.email) throw new Error('Guest email is required.');
        guestEmail = newGuest.email;
        // Try to register — ignore if already exists
        await fetch(`${BASE}/users/register`, {
          method:'POST', headers:hj(token),
          body: JSON.stringify({ username:newGuest.username, email:newGuest.email, password:'Hotel@'+Date.now(), phone:newGuest.phone }),
        }).catch(() => {});
      }

      // Create booking via admin endpoint
      const res = await fetch(`${BASE}/admin/bookings/`, {
        method:'POST', headers:hj(token),
        body: JSON.stringify({
          guestEmail,
          roomId:         selRoom.id,
          checkInDate:    checkIn,
          checkOutDate:   checkOut,
          numberOfGuests: guests,
          totalAmount:    total,
          depositAmount:  payType === 'FULL' ? total : deposit,
          paymentType:    payType,
          status:         'CHECKED_IN', // walk-in = immediate check-in
          specialRequests:'Walk-in booking',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create booking');
      setDone(data);
      show('Walk-in booking created successfully!');
    } catch (e) { show(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const STEPS = ['Select Room', 'Guest Info', 'Confirm & Pay'];

  if (done) return (
    <div className="ap-root">
      <style>{SHARED_CSS}{EXTRA_CSS}</style>
      <div style={{ maxWidth:500, margin:'4rem auto', textAlign:'center', padding:'0 1rem' }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:'1rem' }}>
          <CheckCircle2 size={64} strokeWidth={1.5} color="var(--green)"/>
        </div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.7rem', fontWeight:600, marginBottom:'.5rem' }}>Walk-in Created!</div>
        <div style={{ fontSize:'.85rem', color:'var(--text-muted)', marginBottom:'1.5rem' }}>Guest has been checked in successfully.</div>
        <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:'1.5rem', textAlign:'left' }}>
          {[
            ['Reference',  done.bookingReference],
            ['Room',       `${done.roomType||selRoom?.roomType} #${done.roomNumber||selRoom?.roomNumber}`],
            ['Check-In',   fmtDate(checkIn)],
            ['Check-Out',  fmtDate(checkOut)],
            ['Total',      fmt(total)],
          ].map(([k,v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:'.82rem', marginBottom:'.3rem' }}>
              <span style={{ color:'var(--text-muted)' }}>{k}</span>
              <span style={{ fontWeight:700 }}>{v||'—'}</span>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:'.75rem', justifyContent:'center' }}>
          <button className="ap-btn-ghost" onClick={() => { setDone(null); setStep(1); setSelRoom(null); setSelGuest(null); setNewGuest({ username:'', email:'', phone:'' }); }}>
            New Walk-in
          </button>
          <button className="ap-btn-primary" onClick={() => setPage('arrivals')}>
            View Arrivals
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="ap-root">
      <style>{SHARED_CSS}{EXTRA_CSS}</style>
      <Toast toast={toast}/>

      <div className="ap-hd">
        <div>
          <h1 className="ap-title" style={{ display:'flex', alignItems:'center', gap:'.6rem' }}>
            <PlusCircle size={22} color="#2563eb"/>Walk-in Booking
          </h1>
          <p className="ap-sub">Create a booking for a guest who arrives without a reservation</p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="wi-steps" style={{ maxWidth:480, marginBottom:'1.5rem' }}>
        {STEPS.map((label, i) => {
          const n = i + 1;
          const state = n < step ? 'done' : n === step ? 'active' : 'idle';
          return (
            <div key={i} className="wi-step">
              <div className={`wi-step-dot ${state}`}>
                {state === 'done' ? <CheckCircle2 size={16}/> : n}
              </div>
              <div className={`wi-step-label ${state}`}>{label}</div>
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Room Selection ── */}
      {step === 1 && (
        <div className="ap-panel">
          <div className="ap-panel-hd">
            <div className="ap-panel-title" style={{ display:'flex', alignItems:'center', gap:'.5rem' }}><BedDouble size={16}/>Select Room & Dates</div>
          </div>
          <div className="ap-panel-body">
            {/* Dates */}
            <div className="ap-form-grid" style={{ marginBottom:'1.1rem' }}>
              <div className="ap-field">
                <label className="ap-label">Check-In Date</label>
                <input type="date" className="ap-input" value={checkIn} min={today()}
                  onChange={e => { setCheckIn(e.target.value); if (checkOut <= e.target.value) setCheckOut(''); }}/>
              </div>
              <div className="ap-field">
                <label className="ap-label">Check-Out Date</label>
                <input type="date" className="ap-input" value={checkOut} min={checkIn||today()}
                  onChange={e => setCheckOut(e.target.value)}/>
              </div>
              <div className="ap-field">
                <label className="ap-label">Number of Guests</label>
                <input type="number" className="ap-input" value={guests} min={1} max={10}
                  onChange={e => setGuests(parseInt(e.target.value)||1)}/>
              </div>
              <div className="ap-field">
                <label className="ap-label">Duration</label>
                <div className="ap-input" style={{ background:'var(--surface2)', color:'var(--text-muted)' }}>{nights} night{nights!==1?'s':''}</div>
              </div>
            </div>

            {/* Available rooms */}
            <div style={{ fontSize:'.68rem', textTransform:'uppercase', letterSpacing:'.08em', color:'var(--text-muted)', fontWeight:700, marginBottom:'.65rem' }}>
              Available Rooms ({rooms.filter(r=>r.available).length})
            </div>
            {rLoad ? <div style={{ display:'flex', justifyContent:'center', padding:'2rem' }}><Spinner/></div> : (
              <div className="wi-room-grid">
                {rooms.map(r => (
                  <div key={r.id}
                    className={`wi-room-card${selRoom?.id===r.id?' sel':''}${!r.available?' unavail':''}`}
                    onClick={() => r.available && setSelRoom(r)}>
                    <div className="wi-room-type">{r.roomType}</div>
                    <div className="wi-room-num">#{r.roomNumber}</div>
                    <div className="wi-room-price">₱{Number(r.pricePerNight||0).toLocaleString()}/night</div>
                    {!r.available && <div style={{ fontSize:'.65rem', color:'var(--red)', fontWeight:700, marginTop:'.25rem' }}>Unavailable</div>}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'1.25rem' }}>
              <button className="ap-btn-primary" disabled={!selRoom || !checkIn || !checkOut} onClick={() => setStep(2)}>
                Next: Guest Info →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Guest Info ── */}
      {step === 2 && (
        <div className="ap-panel">
          <div className="ap-panel-hd">
            <div className="ap-panel-title" style={{ display:'flex', alignItems:'center', gap:'.5rem' }}><User size={16}/>Guest Information</div>
            <div style={{ display:'flex', gap:'.4rem' }}>
              <button className={`ap-btn-ghost${guestMode==='existing'?' ap-btn-primary':''}`} style={{ fontSize:'.75rem', padding:'.35rem .75rem', ...(guestMode==='existing'?{background:'linear-gradient(135deg,#2563eb,#60a5fa)',color:'#fff',border:'none'}:{}) }} onClick={() => setGuestMode('existing')}>
                Existing Guest
              </button>
              <button className={`ap-btn-ghost${guestMode==='new'?' ap-btn-primary':''}`} style={{ fontSize:'.75rem', padding:'.35rem .75rem', ...(guestMode==='new'?{background:'linear-gradient(135deg,#2563eb,#60a5fa)',color:'#fff',border:'none'}:{}) }} onClick={() => setGuestMode('new')}>
                New Guest
              </button>
            </div>
          </div>
          <div className="ap-panel-body">
            {guestMode === 'existing' ? (
              <>
                <div style={{ display:'flex', gap:'.65rem', marginBottom:'.85rem' }}>
                  <div className="ap-search-wrap" style={{ flex:1, maxWidth:'100%' }}>
                    <span className="ap-search-ico"><Search size={13}/></span>
                    <input className="ap-search" style={{ maxWidth:'100%' }} placeholder="Search by name or email…"
                      value={gSearch} onChange={e => setGSearch(e.target.value)} onKeyDown={e => e.key==='Enter' && searchGuests()}/>
                  </div>
                  <button className="ap-btn-primary" onClick={searchGuests} disabled={gLoading}>
                    {gLoading ? <><div className="ap-spin-sm"/>…</> : <Search size={14}/>}
                  </button>
                </div>
                {gResults.map(g => (
                  <div key={g.id} onClick={() => setSelGuest(g)}
                    style={{ display:'flex', alignItems:'center', gap:'.7rem', padding:'.7rem .85rem', borderRadius:9, border:`1.5px solid ${selGuest?.id===g.id?'#3b82f6':'var(--border)'}`, background: selGuest?.id===g.id?'rgba(59,130,246,0.06)':'#fff', cursor:'pointer', marginBottom:'.4rem', transition:'all .15s' }}>
                    <div style={{ width:34, height:34, borderRadius:9, background:'linear-gradient(135deg,#9a7a2e,#C9A84C)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontFamily:"'Cormorant Garamond',serif", fontSize:'.9rem', fontWeight:600, flexShrink:0 }}>
                      {(g.username||g.email||'G').slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:'.83rem' }}>{g.username||'—'}</div>
                      <div style={{ fontSize:'.72rem', color:'var(--text-muted)' }}>{g.email}</div>
                    </div>
                    {selGuest?.id===g.id && <CheckCircle2 size={16} color="#3b82f6" style={{ marginLeft:'auto' }}/>}
                  </div>
                ))}
                {gResults.length === 0 && gSearch && !gLoading && (
                  <div style={{ textAlign:'center', padding:'1.5rem', color:'var(--text-muted)', fontSize:'.8rem' }}>No guests found. Try "New Guest" to register.</div>
                )}
              </>
            ) : (
              <div className="ap-form-grid">
                <div className="ap-field">
                  <label className="ap-label">Full Name <span className="req">*</span></label>
                  <input className="ap-input" placeholder="e.g. Juan Dela Cruz" value={newGuest.username}
                    onChange={e => setNewGuest(g => ({ ...g, username:e.target.value }))}/>
                </div>
                <div className="ap-field">
                  <label className="ap-label">Email <span className="req">*</span></label>
                  <input className="ap-input" type="email" placeholder="guest@email.com" value={newGuest.email}
                    onChange={e => setNewGuest(g => ({ ...g, email:e.target.value }))}/>
                </div>
                <div className="ap-field">
                  <label className="ap-label">Phone</label>
                  <input className="ap-input" placeholder="+63 9XX XXX XXXX" value={newGuest.phone}
                    onChange={e => setNewGuest(g => ({ ...g, phone:e.target.value }))}/>
                </div>
              </div>
            )}
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:'1.25rem' }}>
              <button className="ap-btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button className="ap-btn-primary"
                disabled={guestMode==='existing' ? !selGuest : !newGuest.email}
                onClick={() => setStep(3)}>
                Next: Confirm & Pay →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Confirm ── */}
      {step === 3 && (
        <div className="ap-panel">
          <div className="ap-panel-hd">
            <div className="ap-panel-title" style={{ display:'flex', alignItems:'center', gap:'.5rem' }}><CreditCard size={16}/>Confirm & Payment</div>
          </div>
          <div className="ap-panel-body">
            <div className="ap-form-grid">
              <div>
                <div style={{ fontSize:'.68rem', textTransform:'uppercase', letterSpacing:'.08em', color:'var(--text-muted)', fontWeight:700, marginBottom:'.5rem' }}>Booking Summary</div>
                <div className="wi-summary-box">
                  {[
                    ['Room',       `${selRoom?.roomType} #${selRoom?.roomNumber}`],
                    ['Guest',      selGuest?.username || newGuest.username || newGuest.email],
                    ['Check-In',   fmtDate(checkIn)],
                    ['Check-Out',  fmtDate(checkOut)],
                    ['Nights',     `${nights} night${nights!==1?'s':''}`],
                    ['Rate/Night', fmt(selRoom?.pricePerNight||0)],
                  ].map(([k,v]) => (
                    <div key={k} className="wi-summary-row"><span>{k}</span><span style={{ fontWeight:600 }}>{v}</span></div>
                  ))}
                  <div className="wi-summary-row total"><span>Total Amount</span><span>{fmt(total)}</span></div>
                </div>
              </div>
              <div>
                <div style={{ fontSize:'.68rem', textTransform:'uppercase', letterSpacing:'.08em', color:'var(--text-muted)', fontWeight:700, marginBottom:'.5rem' }}>Payment Type</div>
                {[
                  { key:'DEPOSIT', label:'50% Deposit',   desc:`Pay ${fmt(deposit)} now, ${fmt(deposit)} on check-out` },
                  { key:'FULL',    label:'Full Payment',   desc:`Pay full ${fmt(total)} now` },
                  { key:'CASH',    label:'Cash on Arrival',desc:'Record as cash payment' },
                ].map(opt => (
                  <div key={opt.key} onClick={() => setPayType(opt.key)}
                    style={{ display:'flex', alignItems:'center', gap:'.75rem', padding:'.75rem .9rem', borderRadius:9, border:`1.5px solid ${payType===opt.key?'#3b82f6':'var(--border)'}`, background:payType===opt.key?'rgba(59,130,246,0.06)':'#fff', cursor:'pointer', marginBottom:'.45rem', transition:'all .15s' }}>
                    <div style={{ width:18, height:18, borderRadius:'50%', border:`2px solid ${payType===opt.key?'#3b82f6':'var(--border)'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {payType===opt.key && <div style={{ width:8, height:8, borderRadius:'50%', background:'#3b82f6' }}/>}
                    </div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:'.83rem' }}>{opt.label}</div>
                      <div style={{ fontSize:'.72rem', color:'var(--text-muted)' }}>{opt.desc}</div>
                    </div>
                  </div>
                ))}

                <div style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:9, padding:'.65rem .85rem', marginTop:'.65rem', fontSize:'.79rem', color:'var(--orange)', display:'flex', gap:'.5rem' }}>
                  <AlertTriangle size={14} style={{ flexShrink:0, marginTop:1 }}/>
                  Walk-in guests are immediately checked in upon booking creation.
                </div>
              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', marginTop:'1.25rem' }}>
              <button className="ap-btn-ghost" onClick={() => setStep(2)}>← Back</button>
              <button className="ap-btn-primary" disabled={saving} onClick={handleSubmit}
                style={{ background:'linear-gradient(135deg,#059669,#34d399)', boxShadow:'0 2px 8px rgba(5,150,105,0.25)' }}>
                {saving ? <><div className="ap-spin-sm"/>Creating…</> : <><CheckCircle2 size={14}/>Create Walk-in</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}