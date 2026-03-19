// ReceptionistGuests.jsx — View guest profiles, edit contact details (no delete)
import { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { SHARED_CSS, fmt, fmtDate, Pill, Spinner, useToast, Toast } from '../admin/adminShared';
import {
  Users, Search, User, Mail, Phone, BedDouble,
  Edit3, Save, X, CheckCircle2, AlertTriangle,
} from 'lucide-react';

const BASE = '/api/v1';
const h  = (t) => ({ Authorization:`Bearer ${t}`,'ngrok-skip-browser-warning':'true' });
const hj = (t) => ({ ...h(t),'Content-Type':'application/json' });

export function ReceptionistGuests({ token }) {
  const [query,    setQuery]    = useState('');
  const [guests,   setGuests]   = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [selected, setSelected] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [bLoading, setBLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Edit modal
  const [editOpen,  setEditOpen]  = useState(false);
  const [editData,  setEditData]  = useState({});
  const [saving,    setSaving]    = useState(false);
  const { toast, show } = useToast();

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true); setSearched(true); setSelected(null);
    try {
      const res  = await fetch(`${BASE}/admin/guests/?search=${encodeURIComponent(query)}`, { headers: h(token) });
      if (!res.ok) { show(`Error ${res.status}: Cannot load guests`, 'error'); return; }
      const data = await res.json().catch(() => []);
      // Handle both array and paginated { results: [] } responses
      const list = Array.isArray(data) ? data : (data.results || []);
      setGuests(list);
      if (list.length === 0) show('No guests found', 'error');
    } catch (e) { show('Search failed: ' + e.message, 'error'); }
    finally { setLoading(false); }
  };

  const selectGuest = async (guest) => {
    setSelected(guest);
    setBLoading(true);
    try {
      const res  = await fetch(`${BASE}/admin/bookings/?search=${encodeURIComponent(guest.email)}`, { headers: h(token) });
      const data = await res.json().catch(() => []);
      setBookings(Array.isArray(data) ? data : []);
    } catch { setBookings([]); }
    finally { setBLoading(false); }
  };

  const openEdit = () => {
    setEditData({
      username: selected.username || '',
      email:    selected.email    || '',
      phone:    selected.phone    || selected.profile?.phone || '',
    });
    setEditOpen(true);
  };

  const saveContact = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/admin/guests/${selected.id}/`, {
        method: 'PATCH', headers: hj(token),
        body: JSON.stringify({ username: editData.username, phone: editData.phone }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Failed to update guest');
      }
      const updated = await res.json().catch(() => ({ ...selected, ...editData }));
      setSelected(prev => ({ ...prev, ...editData, ...updated }));
      setGuests(prev => prev.map(g => g.id === selected.id ? { ...g, ...editData } : g));
      show('Guest contact updated!');
      setEditOpen(false);
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
            <Users size={22} color="var(--gold-dark)"/>Guest Profiles
          </h1>
          <p className="ap-sub">Search and manage guest information · Edit contact details</p>
        </div>
      </div>

      {/* Search */}
      <div className="ap-panel">
        <div className="ap-panel-body">
          <div style={{ display:'flex', gap:'.75rem' }}>
            <div className="ap-search-wrap" style={{ flex:1, maxWidth:'100%' }}>
              <span className="ap-search-ico"><Search size={13}/></span>
              <input className="ap-search" style={{ maxWidth:'100%' }}
                placeholder="Search by name, email or phone…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key==='Enter' && search()}/>
            </div>
            <button className="ap-btn-primary" onClick={search} disabled={loading}>
              {loading ? <><div className="ap-spin-sm"/>Searching…</> : <><Search size={14}/>Search</>}
            </button>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:'1rem', alignItems:'start' }}>
        {/* Results list */}
        <div className="ap-panel" style={{ marginBottom:0 }}>
          <div className="ap-panel-hd">
            <div className="ap-panel-title">Results {searched && `(${guests.length})`}</div>
          </div>
          {!searched ? (
            <div style={{ padding:'2.5rem 1.5rem', textAlign:'center', color:'var(--text-muted)', fontSize:'.82rem' }}>
              <div style={{ display:'flex', justifyContent:'center', opacity:.25, marginBottom:'.65rem' }}><Search size={36} strokeWidth={1}/></div>
              Search for a guest to get started
            </div>
          ) : loading ? (
            <div style={{ padding:'2rem', display:'flex', justifyContent:'center' }}><Spinner/></div>
          ) : guests.length === 0 ? (
            <div style={{ padding:'2rem', textAlign:'center', color:'var(--text-muted)', fontSize:'.82rem' }}>No guests found</div>
          ) : (
            <div>
              {guests.map(g => (
                <div key={g.id} onClick={() => selectGuest(g)}
                  style={{
                    display:'flex', alignItems:'center', gap:'.7rem',
                    padding:'.75rem 1.25rem', cursor:'pointer', transition:'background .15s',
                    background: selected?.id===g.id ? 'rgba(201,168,76,0.06)' : 'transparent',
                    borderBottom:'1px solid #f8f9fb',
                    borderLeft: selected?.id===g.id ? '3px solid var(--gold)' : '3px solid transparent',
                  }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#9a7a2e,#C9A84C)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontFamily:"'Cormorant Garamond',serif", fontSize:'.95rem', fontWeight:600, flexShrink:0 }}>
                    {(g.username||g.email||'G').slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:'.83rem', color:'var(--text)' }}>{g.username||g.email?.split('@')[0]}</div>
                    <div style={{ fontSize:'.72rem', color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{g.email}</div>
                  </div>
                  <span style={{ fontSize:'.65rem', padding:'.15rem .5rem', borderRadius:99, background:g.is_active?'var(--green-bg)':'var(--red-bg)', color:g.is_active?'var(--green)':'var(--red)', fontWeight:700, border:`1px solid ${g.is_active?'rgba(45,155,111,0.25)':'rgba(220,53,69,0.25)'}`, flexShrink:0 }}>
                    {g.is_active?'Active':'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Guest detail */}
        <div className="ap-panel" style={{ marginBottom:0 }}>
          <div className="ap-panel-hd">
            <div className="ap-panel-title">
              {selected ? `${selected.username||selected.email?.split('@')[0]}'s Profile` : 'Guest Profile'}
            </div>
            {selected && (
              <button className="ap-btn-ghost" onClick={openEdit}>
                <Edit3 size={14}/>Edit Contact
              </button>
            )}
          </div>

          {!selected ? (
            <div style={{ padding:'2.5rem 1.5rem', textAlign:'center', color:'var(--text-muted)', fontSize:'.82rem' }}>
              <div style={{ display:'flex', justifyContent:'center', opacity:.25, marginBottom:'.65rem' }}><User size={36} strokeWidth={1}/></div>
              Select a guest to view their profile
            </div>
          ) : (
            <div className="ap-panel-body">
              {/* Profile card */}
              <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.1rem', padding:'.9rem', background:'var(--surface2)', borderRadius:12, border:'1px solid var(--border)' }}>
                <div style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(135deg,#9a7a2e,#C9A84C)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontFamily:"'Cormorant Garamond',serif", fontSize:'1.25rem', fontWeight:600, flexShrink:0 }}>
                  {(selected.username||selected.email||'G').slice(0,2).toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.2rem', fontWeight:600, color:'var(--text)', marginBottom:'.25rem' }}>
                    {selected.username||'—'}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'.18rem' }}>
                    <div style={{ fontSize:'.78rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'.35rem' }}>
                      <Mail size={12}/>{selected.email}
                    </div>
                    {(selected.phone||selected.profile?.phone) && (
                      <div style={{ fontSize:'.78rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'.35rem' }}>
                        <Phone size={12}/>{selected.phone||selected.profile?.phone}
                      </div>
                    )}
                  </div>
                </div>
                <span style={{ fontSize:'.7rem', padding:'.25rem .7rem', borderRadius:99, background:selected.is_active?'var(--green-bg)':'var(--red-bg)', color:selected.is_active?'var(--green)':'var(--red)', fontWeight:700, border:`1px solid ${selected.is_active?'rgba(45,155,111,0.25)':'rgba(220,53,69,0.25)'}` }}>
                  {selected.is_active?'Active':'Inactive'}
                </span>
              </div>

              {/* Booking history */}
              <div style={{ fontSize:'.68rem', textTransform:'uppercase', letterSpacing:'.08em', color:'var(--text-muted)', fontWeight:700, marginBottom:'.5rem', display:'flex', alignItems:'center', gap:'.4rem' }}>
                <BedDouble size={12}/>Booking History ({bookings.length})
              </div>

              {bLoading ? (
                <div style={{ display:'flex', justifyContent:'center', padding:'1.5rem' }}><Spinner/></div>
              ) : bookings.length === 0 ? (
                <div style={{ textAlign:'center', padding:'1.5rem', color:'var(--text-muted)', fontSize:'.8rem' }}>No bookings on record</div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table className="ap-tbl">
                    <thead><tr><th>Reference</th><th>Room</th><th>Check-In</th><th>Check-Out</th><th>Total</th><th>Status</th></tr></thead>
                    <tbody>
                      {bookings.slice(0,10).map(b => (
                        <tr key={b.id}>
                          <td style={{ fontFamily:'monospace', fontSize:'.72rem', color:'var(--gold-dark)', fontWeight:700 }}>{b.bookingReference}</td>
                          <td style={{ fontSize:'.78rem', whiteSpace:'nowrap' }}>{b.roomType} #{b.roomNumber}</td>
                          <td style={{ fontSize:'.75rem', color:'var(--text-muted)', whiteSpace:'nowrap' }}>{fmtDate(b.checkInDate)}</td>
                          <td style={{ fontSize:'.75rem', color:'var(--text-muted)', whiteSpace:'nowrap' }}>{fmtDate(b.checkOutDate)}</td>
                          <td style={{ fontSize:'.78rem', fontWeight:700 }}>{fmt(b.totalAmount)}</td>
                          <td><Pill status={b.status}/></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Contact Modal */}
      <Modal show={editOpen} onHide={() => setEditOpen(false)} centered className="ap-modal">
        <Modal.Header closeButton>
          <Modal.Title style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
            <Edit3 size={16}/>Edit Contact Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:9, padding:'.65rem .9rem', marginBottom:'1rem', fontSize:'.79rem', color:'var(--orange)', display:'flex', gap:'.5rem' }}>
            <AlertTriangle size={14} style={{ flexShrink:0, marginTop:1 }}/>
            You can edit name and phone number. Email and account settings can only be changed by admin.
          </div>
          <div className="ap-form-grid">
            <div className="ap-field">
              <label className="ap-label">Full Name</label>
              <input className="ap-input" value={editData.username||''} onChange={e => setEditData(d=>({...d,username:e.target.value}))}/>
            </div>
            <div className="ap-field">
              <label className="ap-label">Email <span style={{ color:'var(--text-muted)', fontWeight:400, textTransform:'none' }}>(read-only)</span></label>
              <input className="ap-input" value={editData.email||''} disabled style={{ background:'var(--surface2)', color:'var(--text-muted)' }}/>
            </div>
            <div className="ap-field">
              <label className="ap-label">Phone</label>
              <input className="ap-input" value={editData.phone||''} onChange={e => setEditData(d=>({...d,phone:e.target.value}))} placeholder="+63 9XX XXX XXXX"/>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="ap-btn-ghost" onClick={() => setEditOpen(false)}>Cancel</button>
          <button className="ap-btn-primary" disabled={saving} onClick={saveContact}>
            {saving ? <><div className="ap-spin-sm"/>Saving…</> : <><Save size={14}/>Save Changes</>}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}