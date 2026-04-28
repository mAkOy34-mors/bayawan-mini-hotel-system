// ReceptionistGuests.jsx — View guest profiles (no edit, no delete)
import { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { SHARED_CSS, fmtDate, Pill, Spinner, useToast, Toast } from '../admin/adminShared';
import {
  Users, Search, User, Mail, Phone,
  CheckCircle2, XCircle, Calendar, Hash,
} from 'lucide-react';

const BASE = 'http://127.0.0.1:8000/api/v1';
const h  = (t) => ({ Authorization:`Bearer ${t}`,'ngrok-skip-browser-warning':'true' });

export function ReceptionistGuests({ token }) {
  const [query,    setQuery]    = useState('');
  const [guests,   setGuests]   = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [selected, setSelected] = useState(null);
  const [searched, setSearched] = useState(false);
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

  const selectGuest = (guest) => {
    setSelected(guest);
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
          <p className="ap-sub">Search and view guest information</p>
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
                  <span style={{ fontSize:'.65rem', padding:'.15rem .5rem', borderRadius:99, background:g.isActive ?? g.is_active?'var(--green-bg)':'var(--red-bg)', color:g.isActive ?? g.is_active?'var(--green)':'var(--red)', fontWeight:700, border:`1px solid ${g.isActive ?? g.is_active?'rgba(45,155,111,0.25)':'rgba(220,53,69,0.25)'}`, flexShrink:0 }}>
                    {g.isActive ?? g.is_active?'Active':'Inactive'}
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
          </div>

          {!selected ? (
            <div style={{ padding:'2.5rem 1.5rem', textAlign:'center', color:'var(--text-muted)', fontSize:'.82rem' }}>
              <div style={{ display:'flex', justifyContent:'center', opacity:.25, marginBottom:'.65rem' }}><User size={36} strokeWidth={1}/></div>
              Select a guest to view their profile
            </div>
          ) : (
            <div className="ap-panel-body">
              {/* Profile card */}
              <div style={{ 
                background: 'linear-gradient(135deg, #1a1209 0%, #2d1f08 60%, #3a2610 100%)',
                borderRadius: 16,
                padding: '1.25rem',
                marginBottom: '1rem',
                color: '#fff'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ 
                    width: 64, height: 64, borderRadius: 16, 
                    background: 'linear-gradient(135deg,#9a7a2e,#C9A84C)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    color: '#fff', fontFamily: "'Cormorant Garamond',serif", 
                    fontSize: '1.5rem', fontWeight: 600, flexShrink: 0,
                    boxShadow: '0 4px 16px rgba(201,168,76,.35)'
                  }}>
                    {(selected.username||selected.email||'G').slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.3rem', fontWeight: 600, marginBottom: '.35rem' }}>
                      {selected.username || '—'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.2rem' }}>
                      <div style={{ fontSize: '.8rem', opacity: 0.75, display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                        <Mail size={12}/>{selected.email}
                      </div>
                      {(selected.phone||selected.profile?.phone) && (
                        <div style={{ fontSize: '.8rem', opacity: 0.75, display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                          <Phone size={12}/>{selected.phone||selected.profile?.phone}
                        </div>
                      )}
                    </div>
                  </div>
                  <span style={{ 
                    fontSize: '.7rem', padding: '.25rem .8rem', borderRadius: 99, 
                    background: selected.isActive ?? selected.is_active ? 'rgba(34,197,94,.15)' : 'rgba(239,68,68,.15)', 
                    color: selected.isActive ?? selected.is_active ? '#4ade80' : '#f87171', 
                    fontWeight: 700, 
                    border: `1px solid ${selected.isActive ?? selected.is_active ? 'rgba(34,197,94,.25)' : 'rgba(239,68,68,.25)'}`
                  }}>
                    {selected.isActive ?? selected.is_active ? '● Active' : '● Inactive'}
                  </span>
                </div>
              </div>

              {/* Additional details */}
              <div style={{ marginTop: '1rem' }}>
                <div style={{ 
                  fontSize: '.68rem', textTransform: 'uppercase', letterSpacing: '.08em', 
                  color: 'var(--text-muted)', fontWeight: 700, marginBottom: '.75rem', 
                  display: 'flex', alignItems: 'center', gap: '.4rem' 
                }}>
                  <User size={12}/>Account Information
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                  <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '.75rem 1rem' }}>
                    <div style={{ fontSize: '.6rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', marginBottom: '.25rem', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                      <Hash size={10}/>Role
                    </div>
                    <div style={{ fontSize: '.85rem', fontWeight: 500, color: 'var(--text)' }}>
                      {selected.role || 'GUEST'}
                    </div>
                  </div>
                  <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '.75rem 1rem' }}>
                    <div style={{ fontSize: '.6rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', marginBottom: '.25rem', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                      <Calendar size={10}/>Member Since
                    </div>
                    <div style={{ fontSize: '.85rem', fontWeight: 500, color: 'var(--text)' }}>
                      {fmtDate(selected.createdAt)}
                    </div>
                  </div>
                </div>

                {selected.profile?.address && (
                  <div style={{ marginTop: '.75rem', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '.75rem 1rem' }}>
                    <div style={{ fontSize: '.6rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', marginBottom: '.25rem' }}>
                      Address
                    </div>
                    <div style={{ fontSize: '.85rem', color: 'var(--text)' }}>
                      {selected.profile.address}
                    </div>
                  </div>
                )}

                {selected.profile?.nationality && (
                  <div style={{ marginTop: '.75rem', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '.75rem 1rem' }}>
                    <div style={{ fontSize: '.6rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', marginBottom: '.25rem' }}>
                      Nationality
                    </div>
                    <div style={{ fontSize: '.85rem', color: 'var(--text)' }}>
                      {selected.profile.nationality}
                    </div>
                  </div>
                )}
              </div>

              {/* Note about edit permissions */}
              <div style={{ 
                marginTop: '1.5rem', 
                padding: '.75rem 1rem', 
                background: 'rgba(201,168,76,0.06)', 
                borderRadius: 10, 
                border: '1px solid rgba(201,168,76,0.15)',
                fontSize: '.72rem',
                color: 'var(--text-muted)',
                textAlign: 'center'
              }}>
                <span style={{ opacity: 0.6 }}>ℹ️</span> Guest information is view-only. Contact an administrator to make changes.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}