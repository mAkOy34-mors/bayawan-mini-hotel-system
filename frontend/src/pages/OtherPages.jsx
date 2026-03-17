// OtherPages.jsx – Rewards, Settings, Support with Lucide icons
import { useState, useEffect } from 'react';
import { fmt } from '../utils/format';
import { Alert } from '../components/ui/Alert';
import { useAlert } from '../hooks/useAlert';
import { API_BASE } from '../constants/config';
import { fetchPayments, fetchRecentBookings } from '../services/api';
import {
  Star, BarChart2, Wallet, CheckCircle2, Trophy,
  Bell, Globe, Lock, Save, Send, HelpCircle,
  Phone, Mail, MessageCircle, ChevronDown, ChevronUp,
  RefreshCw, ClipboardList,
} from 'lucide-react';

const sharedCss = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  :root {
    --gold:       #C9A84C; --gold-dark:  #9a7a2e; --gold-bg: rgba(201,168,76,0.1);
    --bg:         #f4f6f8; --surface:    #ffffff;  --surface2: #f8f9fb;
    --text:       #1a1f2e; --text-sub:   #4a5568;  --text-muted: #8a96a8;
    --border:     #e2e8f0;
    --green:      #2d9b6f; --green-bg:   rgba(45,155,111,0.1);
    --red:        #dc3545; --red-bg:     rgba(220,53,69,0.1);
    --blue:       #3b82f6; --blue-bg:    rgba(59,130,246,0.1);
    --orange:     #f59e0b;
  }

  * { box-sizing:border-box; scrollbar-width:thin; scrollbar-color:rgba(201,168,76,0.3) #f0f0f0; }
  *::-webkit-scrollbar { width:5px; }
  *::-webkit-scrollbar-track { background:#f0f0f0; border-radius:99px; }
  *::-webkit-scrollbar-thumb { background:rgba(201,168,76,0.4); border-radius:99px; }

  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin   { to{transform:rotate(360deg)} }
  @keyframes shimmer{ 0%{background-position:-600px 0} 100%{background-position:600px 0} }

  .op-root { min-height:100vh; background:var(--bg); font-family:'DM Sans',sans-serif; color:var(--text); -webkit-font-smoothing:antialiased; padding:2rem 2.25rem; }
  @media(max-width:768px){ .op-root { padding:1.25rem 1rem; } }

  .op-hd { margin-bottom:1.6rem; animation:fadeUp .4s cubic-bezier(.22,1,.36,1) both; }
  .op-title { font-family:'Cormorant Garamond',serif; font-size:1.9rem; font-weight:600; color:var(--text); margin:0 0 .18rem; }
  .op-sub   { font-size:.82rem; color:var(--text-muted); }

  .op-panel { background:var(--surface); border:1px solid var(--border); border-radius:14px; overflow:hidden; box-shadow:0 1px 6px rgba(0,0,0,.05); animation:fadeUp .45s cubic-bezier(.22,1,.36,1) both; margin-bottom:1rem; }
  .op-panel-hd { display:flex; align-items:center; justify-content:space-between; padding:.95rem 1.25rem; border-bottom:1px solid var(--border); background:var(--surface2); }
  .op-panel-title { font-family:'Cormorant Garamond',serif; font-size:1.05rem; font-weight:600; color:var(--text); display:flex; align-items:center; gap:.5rem; }
  .op-panel-sub   { font-size:.72rem; color:var(--text-muted); margin-top:.08rem; }
  .op-panel-body  { padding:1.25rem; }

  .op-stat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:1rem; }
  @media(max-width:900px){ .op-stat-grid { grid-template-columns:repeat(2,1fr); } }
  @media(max-width:480px){ .op-stat-grid { grid-template-columns:1fr 1fr; } }
  .op-stat { background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:1.1rem 1.15rem; position:relative; overflow:hidden; box-shadow:0 1px 6px rgba(0,0,0,.05); animation:fadeUp .5s cubic-bezier(.22,1,.36,1) both; transition:transform .2s,box-shadow .2s; }
  .op-stat:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,.09); }
  .op-stat::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; }
  .op-stat.gold::before   { background:linear-gradient(to right,#9a7a2e,#C9A84C); }
  .op-stat.green::before  { background:linear-gradient(to right,#059669,#34d399); }
  .op-stat.blue::before   { background:linear-gradient(to right,#2563eb,#60a5fa); }
  .op-stat.red::before    { background:linear-gradient(to right,#dc2626,#f87171); }
  .op-stat-ico   { width:32px; height:32px; border-radius:8px; margin-bottom:.6rem; display:flex; align-items:center; justify-content:center; }
  .op-stat.gold   .op-stat-ico { background:rgba(201,168,76,0.12); color:#9a7a2e; }
  .op-stat.green  .op-stat-ico { background:rgba(45,155,111,0.12); color:#2d9b6f; }
  .op-stat.blue   .op-stat-ico { background:rgba(59,130,246,0.12); color:#3b82f6; }
  .op-stat.red    .op-stat-ico { background:rgba(220,38,38,0.12);  color:#dc2626; }
  .op-stat-label { font-size:.67rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--text-muted); margin-bottom:.3rem; }
  .op-stat-val   { font-family:'Cormorant Garamond',serif; font-size:1.85rem; font-weight:600; color:var(--text); line-height:1; }
  .op-stat-sub   { font-size:.68rem; color:var(--text-muted); margin-top:.3rem; }

  .op-tier { border-radius:12px; padding:1.25rem; margin-bottom:1rem; position:relative; overflow:hidden; border:1px solid rgba(201,168,76,0.3); background:linear-gradient(135deg,rgba(201,168,76,0.06) 0%,rgba(201,168,76,0.02) 100%); }
  .op-tier::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:linear-gradient(to right,#9a7a2e,#C9A84C,#dfc06e); }
  .op-tier-row  { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:.75rem; }
  .op-tier-ico  { font-size:2rem; }
  .op-tier-name { font-family:'Cormorant Garamond',serif; font-size:1.3rem; font-weight:600; color:var(--gold-dark); }
  .op-tier-sub  { font-size:.77rem; color:var(--text-muted); margin-top:.12rem; }
  .op-tier-pts  { font-family:'Cormorant Garamond',serif; font-size:2.2rem; font-weight:600; color:var(--gold-dark); text-align:right; }
  .op-tier-pts-lbl { font-size:.68rem; color:var(--text-muted); text-align:right; text-transform:uppercase; letter-spacing:.07em; }
  .op-tier-prog { margin-top:.85rem; }
  .op-tier-prog-row { display:flex; justify-content:space-between; margin-bottom:.35rem; font-size:.73rem; color:var(--text-muted); }
  .op-tier-track { height:6px; border-radius:99px; background:rgba(201,168,76,0.15); }
  .op-tier-fill  { height:100%; border-radius:99px; background:linear-gradient(to right,#9a7a2e,#C9A84C); transition:width .7s ease; }

  .op-perk-list { display:flex; flex-direction:column; gap:.45rem; }
  .op-perk-item { display:flex; align-items:center; gap:.75rem; padding:.72rem .85rem; border-radius:10px; border:1px solid var(--border); background:#fff; animation:fadeUp .4s cubic-bezier(.22,1,.36,1) both; }
  .op-perk-ico   { flex-shrink:0; color:var(--green); }
  .op-perk-name  { font-size:.84rem; font-weight:600; color:var(--text); }
  .op-perk-badge { margin-left:auto; flex-shrink:0; padding:.18rem .6rem; border-radius:99px; font-size:.67rem; font-weight:700; background:var(--gold-bg); color:var(--gold-dark); border:1px solid rgba(201,168,76,0.25); letter-spacing:.03em; }

  .op-htable { width:100%; border-collapse:collapse; }
  .op-htable th { font-size:.65rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--text-muted); padding:.58rem .75rem; text-align:left; border-bottom:1px solid var(--border); background:var(--surface2); }
  .op-htable td { padding:.72rem .75rem; border-bottom:1px solid #f8f9fb; font-size:.82rem; color:var(--text-sub); vertical-align:middle; }
  .op-htable tr:last-child td { border-bottom:none; }
  .op-htable tr:hover td { background:#fafbfc; }
  .op-pts-earn { color:var(--green); font-weight:700; }
  .op-pts-use  { color:var(--red);   font-weight:700; }

  .op-fg  { display:grid; grid-template-columns:1fr 1fr; gap:.9rem; margin-bottom:.9rem; }
  @media(max-width:640px){ .op-fg { grid-template-columns:1fr; } }
  .op-f   { display:flex; flex-direction:column; gap:.38rem; }
  .op-lbl { font-size:.68rem; letter-spacing:.08em; text-transform:uppercase; color:var(--text-muted); font-weight:700; }
  .op-input, .op-select, .op-textarea { background:#fff; border:1px solid var(--border); color:var(--text); border-radius:8px; padding:.65rem .9rem; font-size:.875rem; font-family:'DM Sans',sans-serif; outline:none; transition:border-color .2s,box-shadow .2s; }
  .op-input::placeholder, .op-textarea::placeholder { color:var(--text-muted); }
  .op-input:focus, .op-select:focus, .op-textarea:focus { border-color:var(--gold); box-shadow:0 0 0 3px rgba(201,168,76,0.12); }
  .op-select { appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238a96a8' fill='none' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right .85rem center; padding-right:2.4rem; background-color:#fff; }
  .op-textarea { resize:vertical; min-height:90px; }

  .op-toggle-row { display:flex; align-items:center; justify-content:space-between; padding:.82rem 0; border-bottom:1px solid #f8f9fb; }
  .op-toggle-row:last-child { border-bottom:none; }
  .op-toggle-info { flex:1; }
  .op-toggle-label { font-size:.84rem; font-weight:600; color:var(--text); }
  .op-toggle-sub   { font-size:.71rem; color:var(--text-muted); margin-top:.08rem; }
  .op-toggle { width:42px; height:24px; border-radius:99px; border:none; cursor:pointer; position:relative; flex-shrink:0; transition:background .22s; }
  .op-toggle.on  { background:linear-gradient(135deg,#9a7a2e,#C9A84C); }
  .op-toggle.off { background:#e2e8f0; }
  .op-toggle::after { content:''; position:absolute; top:3px; width:18px; height:18px; border-radius:50%; background:#fff; transition:left .22s; box-shadow:0 1px 4px rgba(0,0,0,.15); }
  .op-toggle.on::after  { left:21px; }
  .op-toggle.off::after { left:3px; }

  .op-save-btn { padding:.7rem 1.75rem; border:none; border-radius:8px; font-size:.875rem; font-family:'DM Sans',sans-serif; font-weight:600; cursor:pointer; background:linear-gradient(135deg,#9a7a2e,#C9A84C); color:#fff; transition:all .22s; display:inline-flex; align-items:center; gap:.5rem; box-shadow:0 2px 8px rgba(201,168,76,0.28); margin-top:.85rem; }
  .op-save-btn:hover:not(:disabled) { background:linear-gradient(135deg,#b09038,#dfc06e); transform:translateY(-1px); }
  .op-save-btn:disabled { opacity:.5; cursor:not-allowed; }
  .op-spin { width:14px; height:14px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }

  .op-faq-item { border:1px solid var(--border); border-radius:10px; margin-bottom:.5rem; overflow:hidden; animation:fadeUp .4s cubic-bezier(.22,1,.36,1) both; }
  .op-faq-q { display:flex; align-items:center; justify-content:space-between; padding:.82rem 1rem; cursor:pointer; font-size:.855rem; font-weight:600; color:var(--text); transition:background .15s; }
  .op-faq-q:hover { background:var(--surface2); }
  .op-faq-a { padding:0 1rem .85rem; font-size:.82rem; color:var(--text-sub); line-height:1.65; }

  .op-contact-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:.85rem; margin-bottom:1rem; }
  @media(max-width:768px){ .op-contact-grid { grid-template-columns:1fr; } }
  .op-contact-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:1.1rem; text-align:center; cursor:pointer; transition:transform .2s,box-shadow .2s,border-color .2s; box-shadow:0 1px 4px rgba(0,0,0,.05); position:relative; overflow:hidden; }
  .op-contact-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; }
  .op-contact-card.phone::before { background:linear-gradient(to right,#059669,#34d399); }
  .op-contact-card.email::before { background:linear-gradient(to right,#2563eb,#60a5fa); }
  .op-contact-card.chat::before  { background:linear-gradient(to right,#9a7a2e,#C9A84C); }
  .op-contact-card:hover { transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,0,0,.09); border-color:rgba(201,168,76,0.3); }
  .op-contact-ico   { display:flex; justify-content:center; margin-bottom:.5rem; }
  .op-contact-name  { font-size:.84rem; font-weight:600; color:var(--text); margin-bottom:.22rem; }
  .op-contact-detail{ font-size:.72rem; color:var(--text-muted); }

  .op-skel { display:block; border-radius:6px; background:linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 50%,#f1f5f9 100%); background-size:600px 100%; animation:shimmer 1.4s ease-in-out infinite; }

  .op-status-badge { display:inline-block; padding:.1rem .5rem; border-radius:99px; font-size:.64rem; font-weight:700; text-transform:uppercase; letter-spacing:.04em; }
  .op-status-badge.cancelled { background:var(--red-bg); color:var(--red); }
  .op-status-badge.confirmed { background:var(--blue-bg); color:var(--blue); }
  .op-status-badge.completed { background:rgba(100,116,139,0.1); color:#64748b; }
  .op-status-badge.pending   { background:rgba(245,158,11,0.1); color:var(--orange); }
`;

const TIERS = [
  { name:'Bronze',   minPts:0,     maxPts:999,      icon:'🥉', perks:['5% room discount','Free welcome drink','Priority check-in'] },
  { name:'Silver',   minPts:1000,  maxPts:4999,     icon:'🥈', perks:['10% room discount','Free breakfast','Late checkout','Room upgrade'] },
  { name:'Gold',     minPts:5000,  maxPts:9999,     icon:'🏅', perks:['15% discount','Daily breakfast','Spa credit','Suite upgrade','Dedicated concierge'] },
  { name:'Platinum', minPts:10000, maxPts:Infinity, icon:'💎', perks:['20% discount','Full board','Limousine pickup','Villa upgrade','Personal butler'] },
];

/* ════════════════════════════════ REWARDS ════════════════════════════════ */
export function RewardsPage({ token }) {
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [faqOpen,  setFaqOpen]  = useState(null);

  useEffect(() => {
    Promise.all([
      fetchRecentBookings(token).catch((err) => {
        console.error('Bookings error:', err);
        return [];
      }),
      fetchPayments(token).catch((err) => {
        console.error('Payments error:', err);
        return [];
      }),
    ]).then(([bData, pData]) => {
      console.log('📦 Bookings:', bData);
      console.log('💳 Payments:', pData);
      setBookings(Array.isArray(bData) ? bData : []);
      setPayments(Array.isArray(pData) ? pData : []);
      setLoading(false);
    });
  }, [token]);

  // Paid amounts from payments table
  const isRefund  = (p) => p.description?.toLowerCase().startsWith('refund') || p.type === 'REFUND';
  const paidAmt   = payments.filter(p => p.status === 'PAID' && !isRefund(p)).reduce((s,p) => s + parseFloat(p.amount||0), 0);
  const refundAmt = payments.filter(p => isRefund(p)).reduce((s,p) => s + parseFloat(p.amount||0), 0);
  const netSpent  = Math.max(0, paidAmt - refundAmt);

  // Points only from non-cancelled bookings
  const points = bookings
    .filter(b => b.status !== 'CANCELLED')
    .reduce((s,b) => s + Math.floor(parseFloat(b.totalAmount || b.total_amount || 0) / 100) * 10, 0);

  const totalBookings    = bookings.length;
  const activeBookings   = bookings.filter(b => !['CANCELLED','COMPLETED'].includes(b.status)).length;
  const cancelledCount   = bookings.filter(b => b.status === 'CANCELLED').length;

  const tier      = TIERS.slice().reverse().find(t => points >= t.minPts) || TIERS[0];
  const nextTier  = TIERS[TIERS.indexOf(tier) + 1];
  const pctToNext = nextTier ? Math.min(100, ((points - tier.minPts) / (nextTier.minPts - tier.minPts)) * 100) : 100;

  // History — all bookings including cancelled
  const history = bookings.slice(0, 10).map(b => ({
    date:      b.checkInDate?.slice(0,10) || b.check_in_date?.slice(0,10) || '—',
    desc:      `${b.room?.roomType || b.roomType || 'Room'} Booking`,
    pts:       b.status === 'CANCELLED' ? 0 : Math.floor(parseFloat(b.totalAmount || b.total_amount || 0) / 100) * 10,
    cancelled: b.status === 'CANCELLED',
    status:    b.status,
  }));

  const faqs = [
    { q:'How do I earn reward points?',        a:'Earn 10 points for every ₱100 spent on room bookings. Cancelled bookings do not earn points.' },
    { q:'When do points expire?',               a:'Points are valid for 2 years from the date of earning. Tier status resets annually.' },
    { q:'Can I transfer points to another guest?', a:'Points are non-transferable between accounts.' },
    { q:'How do I redeem my points?',           a:'Points can be redeemed during booking checkout. Minimum redemption is 500 points (₱50 value).' },
  ];

  return (
    <div className="op-root">
      <style>{sharedCss}</style>
      <div className="op-hd">
        <h1 className="op-title">Rewards Programme</h1>
        <p className="op-sub">Your loyalty points, tier benefits and booking history</p>
      </div>

      {/* Stats — 4 cards */}
      <div className="op-stat-grid">
        {[
          { Icon: Star,      label:'Total Points',     value: loading ? '—' : points.toLocaleString(),    color:'gold',  sub: `${tier.name} tier` },
          { Icon: BarChart2, label:'Total Bookings',   value: loading ? '—' : totalBookings,              color:'blue',  sub: `${activeBookings} active` },
          { Icon: Wallet,    label:'Net Spent',        value: loading ? '—' : fmt(netSpent),              color:'green', sub: refundAmt > 0 ? `₱${refundAmt.toFixed(0)} refunded` : 'All time' },
          { Icon: Trophy,    label:'Cancelled',        value: loading ? '—' : cancelledCount,             color:'red',   sub: 'bookings' },
        ].map((s, i) => (
          <div key={i} className={`op-stat ${s.color}`} style={{ animationDelay:`${i*0.07}s` }}>
            <div className="op-stat-ico"><s.Icon size={16}/></div>
            <div className="op-stat-label">{s.label}</div>
            <div className="op-stat-val">
              {loading
                ? <span className="op-skel" style={{ display:'block', height:28, width:60 }}/>
                : s.value
              }
            </div>
            {!loading && <div className="op-stat-sub">{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Tier card */}
      <div className="op-tier">
        <div className="op-tier-row">
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'.5rem', marginBottom:'.2rem' }}>
              <span className="op-tier-ico">{tier.icon}</span>
              <div className="op-tier-name">{tier.name} Member</div>
            </div>
            <div className="op-tier-sub">
              {nextTier
                ? `${(nextTier.minPts - points).toLocaleString()} pts to ${nextTier.name}`
                : 'Top tier achieved! 🎉'}
            </div>
          </div>
          <div>
            <div className="op-tier-pts">{points.toLocaleString()}</div>
            <div className="op-tier-pts-lbl">Points</div>
          </div>
        </div>
        {nextTier && (
          <div className="op-tier-prog">
            <div className="op-tier-prog-row"><span>{tier.name}</span><span>{nextTier.name}</span></div>
            <div className="op-tier-track"><div className="op-tier-fill" style={{ width:`${pctToNext}%` }}/></div>
          </div>
        )}
      </div>

      {/* Perks + History */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
        <div className="op-panel" style={{ animationDelay:'.12s', marginBottom:0 }}>
          <div className="op-panel-hd">
            <div className="op-panel-title"><Trophy size={16}/>{tier.name} Perks</div>
          </div>
          <div className="op-panel-body">
            <div className="op-perk-list">
              {tier.perks.map((p, i) => (
                <div key={i} className="op-perk-item" style={{ animationDelay:`${i*0.06}s` }}>
                  <span className="op-perk-ico"><CheckCircle2 size={16}/></span>
                  <div className="op-perk-name">{p}</div>
                  <span className="op-perk-badge">Active</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="op-panel" style={{ animationDelay:'.15s', marginBottom:0 }}>
          <div className="op-panel-hd">
            <div className="op-panel-title"><Star size={16}/>Booking History</div>
          </div>
          <div style={{ overflowX:'auto' }}>
            {loading ? (
              <div style={{ padding:'2rem', textAlign:'center' }}>
                <div style={{ width:22, height:22, border:'2.5px solid #e2e8f0', borderTopColor:'#C9A84C', borderRadius:'50%', animation:'spin .7s linear infinite', margin:'0 auto .65rem' }}/>
                <div style={{ fontSize:'.78rem', color:'#8a96a8' }}>Loading…</div>
              </div>
            ) : history.length ? (
              <table className="op-htable">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i}>
                      <td style={{ fontSize:'.72rem', color:'var(--text-muted)' }}>{h.date}</td>
                      <td>{h.desc}</td>
                      <td>
                        <span className={`op-status-badge ${h.status?.toLowerCase()}`}>
                          {h.status}
                        </span>
                      </td>
                      <td>
                        {h.cancelled
                          ? <span style={{ color:'var(--text-muted)', fontSize:'.75rem' }}>—</span>
                          : <span className="op-pts-earn">+{h.pts}</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding:'2.5rem', textAlign:'center', color:'var(--text-muted)', fontSize:'.79rem' }}>
                No bookings yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="op-panel" style={{ animationDelay:'.18s', marginTop:'1rem' }}>
        <div className="op-panel-hd">
          <div className="op-panel-title"><HelpCircle size={16}/>Frequently Asked Questions</div>
        </div>
        <div className="op-panel-body">
          {faqs.map((f, i) => (
            <div key={i} className="op-faq-item" style={{ animationDelay:`${i*0.05}s` }}>
              <div className="op-faq-q" onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                <span style={{ flex:1, marginRight:'.5rem' }}>{f.q}</span>
                {faqOpen === i ? <ChevronUp size={15} color="var(--text-muted)"/> : <ChevronDown size={15} color="var(--text-muted)"/>}
              </div>
              {faqOpen === i && <div className="op-faq-a">{f.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════ SETTINGS ══════════════════════════════ */
export function SettingsPage({ user, token, lang, setLang }) {
  const [notif,  setNotif]  = useState({ email:true, sms:false, promotions:true, reminders:true });
  const [prefs,  setPrefs]  = useState({ language:lang||'en', currency:'PHP', timezone:'Asia/Manila' });
  const [saving, setSaving] = useState(false);
  const { alert, showAlert } = useAlert();

  const toggleNotif = (key) => setNotif(n => ({ ...n, [key]: !n[key] }));

  const save = async () => {
    setSaving(true);
    if (prefs.language !== lang) setLang?.(prefs.language);
    await new Promise(r => setTimeout(r, 700));
    setSaving(false);
    showAlert('Settings saved!', 'success');
  };

  return (
    <div className="op-root">
      <style>{sharedCss}</style>
      <Alert alert={alert}/>
      <div className="op-hd">
        <h1 className="op-title">Settings</h1>
        <p className="op-sub">Manage your account preferences and notifications</p>
      </div>

      {/* Notifications */}
      <div className="op-panel">
        <div className="op-panel-hd">
          <div>
            <div className="op-panel-title"><Bell size={16}/>Notifications</div>
            <div className="op-panel-sub">Choose how we contact you</div>
          </div>
        </div>
        <div className="op-panel-body">
          {[
            { key:'email',      label:'Email Notifications',  sub:'Booking confirmations, receipts' },
            { key:'sms',        label:'SMS Notifications',    sub:'Check-in reminders via text' },
            { key:'promotions', label:'Promotional Emails',   sub:'Special offers and discounts' },
            { key:'reminders',  label:'Stay Reminders',       sub:'Reminders before your check-in' },
          ].map(({ key, label, sub }) => (
            <div key={key} className="op-toggle-row">
              <div className="op-toggle-info">
                <div className="op-toggle-label">{label}</div>
                <div className="op-toggle-sub">{sub}</div>
              </div>
              <button
                className={`op-toggle ${notif[key] ? 'on' : 'off'}`}
                onClick={() => toggleNotif(key)}
                aria-label="toggle"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Preferences */}
      <div className="op-panel" style={{ animationDelay:'.07s' }}>
        <div className="op-panel-hd">
          <div className="op-panel-title"><Globe size={16}/>Preferences</div>
        </div>
        <div className="op-panel-body">
          <div className="op-fg">
            <div className="op-f">
              <label className="op-lbl">Language</label>
              <select className="op-select" value={prefs.language} onChange={e => setPrefs({...prefs, language:e.target.value})}>
                <option value="en">🇺🇸 English</option>
                <option value="fil">🇵🇭 Filipino</option>
                <option value="ceb">🇵🇭 Cebuano</option>
              </select>
            </div>
            <div className="op-f">
              <label className="op-lbl">Currency</label>
              <select className="op-select" value={prefs.currency} onChange={e => setPrefs({...prefs, currency:e.target.value})}>
                <option value="PHP">🇵🇭 PHP — Philippine Peso</option>
                <option value="USD">🇺🇸 USD — US Dollar</option>
                <option value="EUR">🇪🇺 EUR — Euro</option>
              </select>
            </div>
          </div>
          <div className="op-f" style={{ marginBottom:'.9rem' }}>
            <label className="op-lbl">Timezone</label>
            <select className="op-select" value={prefs.timezone} onChange={e => setPrefs({...prefs, timezone:e.target.value})}>
              <option value="Asia/Manila">🇵🇭 Asia/Manila (PHT +8:00)</option>
              <option value="Asia/Singapore">🇸🇬 Asia/Singapore (SGT +8:00)</option>
              <option value="UTC">🌐 UTC (+0:00)</option>
            </select>
          </div>
          <button className="op-save-btn" disabled={saving} onClick={save}>
            {saving ? <><div className="op-spin"/>Saving…</> : <><Save size={14}/>Save Settings</>}
          </button>
        </div>
      </div>

      {/* Privacy */}
      <div className="op-panel" style={{ animationDelay:'.12s' }}>
        <div className="op-panel-hd">
          <div className="op-panel-title"><Lock size={16}/>Privacy & Security</div>
        </div>
        <div className="op-panel-body">
          {[
            { label:'Two-Factor Authentication', sub:'Secure your account with 2FA',                    defaultOn: false },
            { label:'Activity Log',              sub:'Show login and activity history',                 defaultOn: true  },
            { label:'Data Sharing',              sub:'Share anonymous usage data to improve service',   defaultOn: false },
          ].map(({ label, sub, defaultOn }, idx) => {
            const [tog, setTog] = useState(defaultOn);
            return (
              <div key={idx} className="op-toggle-row">
                <div className="op-toggle-info">
                  <div className="op-toggle-label">{label}</div>
                  <div className="op-toggle-sub">{sub}</div>
                </div>
                <button className={`op-toggle ${tog ? 'on' : 'off'}`} onClick={() => setTog(!tog)} aria-label="toggle"/>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════ SUPPORT ═══════════════════════════════ */
export function SupportPage({ token }) {
  const [form,      setForm]      = useState({ category:'BOOKING', subject:'', message:'' });
  const [faqOpen,   setFaqOpen]   = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [sending,   setSending]   = useState(false);
  const { alert, showAlert }      = useAlert();

  const submit = async () => {
    if (!form.subject || !form.message) { showAlert('Please fill in all fields', 'error'); return; }
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/support/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          email:    'guest@cebugrand.com',
          subject:  form.subject,
          message:  form.message,
          priority: 'MEDIUM',
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        showAlert("Ticket submitted! We'll respond within 24 hours.", 'success');
        setForm({ category:'BOOKING', subject:'', message:'' });
      } else {
        showAlert('Failed to submit ticket. Please try again.', 'error');
      }
    } catch {
      showAlert('Connection error. Please try again.', 'error');
    } finally {
      setSending(false);
    }
  };

  const faqs = [
    { q:'How do I cancel a booking?',           a:'Go to My Bookings, select your reservation, and click "Cancel". A 50% refund of your deposit will be processed within 5–7 business days.' },
    { q:'When will I receive my refund?',        a:'Refunds are processed within 5–7 business days to your original payment method.' },
    { q:'Can I modify my booking dates?',        a:'Yes, submit a Change Request from My Bookings. Our team will review and respond within 24 hours.' },
    { q:'How do I request an early check-in?',   a:'Early check-in is subject to availability and can be requested by contacting the front desk at least 24 hours before arrival.' },
    { q:"What is the hotel's pet policy?",       a:'We are a pet-friendly hotel. Pets under 10kg are welcome in select rooms. A refundable pet deposit of ₱500 is required.' },
  ];

  const contacts = [
    { cls:'phone', Icon: Phone,         name:'Call Us',   detail:'+63 32 888 8888',      sub:'Available 24/7' },
    { cls:'email', Icon: Mail,          name:'Email Us',  detail:'support@cebugrand.ph', sub:'Reply within 4 hours' },
    { cls:'chat',  Icon: MessageCircle, name:'Live Chat', detail:'Chat with an agent',   sub:'Mon–Sun 6am–10pm' },
  ];

  return (
    <div className="op-root">
      <style>{sharedCss}</style>
      <Alert alert={alert}/>
      <div className="op-hd">
        <h1 className="op-title">Help & Support</h1>
        <p className="op-sub">We're here to help — contact us or browse common questions</p>
      </div>

      {/* Contact cards */}
      <div className="op-contact-grid">
        {contacts.map((c, i) => (
          <div key={i} className={`op-contact-card ${c.cls}`} style={{ animationDelay:`${i*0.06}s` }}>
            <div className="op-contact-ico">
              <c.Icon size={28} strokeWidth={1.5} color={c.cls==='phone'?'#2d9b6f':c.cls==='email'?'#3b82f6':'#9a7a2e'}/>
            </div>
            <div className="op-contact-name">{c.name}</div>
            <div className="op-contact-detail">{c.detail}</div>
            <div style={{ fontSize:'.68rem', color:'var(--text-muted)', marginTop:'.18rem' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Ticket + FAQ */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
        <div className="op-panel" style={{ animationDelay:'.1s', marginBottom:0 }}>
          <div className="op-panel-hd">
            <div className="op-panel-title"><ClipboardList size={16}/>Submit a Ticket</div>
          </div>
          <div className="op-panel-body">
            {submitted ? (
              <div style={{ textAlign:'center', padding:'2rem 1rem' }}>
                <div style={{ display:'flex', justifyContent:'center', marginBottom:'.65rem' }}>
                  <CheckCircle2 size={48} strokeWidth={1.5} color="var(--green)"/>
                </div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.1rem', fontWeight:600, color:'var(--text)', marginBottom:'.3rem' }}>
                  Ticket Submitted!
                </div>
                <div style={{ fontSize:'.79rem', color:'var(--text-muted)', marginBottom:'1rem' }}>
                  We'll respond within 24 hours.
                </div>
                <button className="op-save-btn" style={{ margin:'0 auto' }} onClick={() => setSubmitted(false)}>
                  Submit Another
                </button>
              </div>
            ) : (
              <>
                <div className="op-f" style={{ marginBottom:'.85rem' }}>
                  <label className="op-lbl">Category</label>
                  <select className="op-select" value={form.category} onChange={e => setForm({...form, category:e.target.value})}>
                    <option value="BOOKING">Booking Issue</option>
                    <option value="PAYMENT">Payment Issue</option>
                    <option value="ROOM">Room Request</option>
                    <option value="REWARDS">Rewards</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="op-f" style={{ marginBottom:'.85rem' }}>
                  <label className="op-lbl">Subject</label>
                  <input className="op-input" type="text" value={form.subject}
                    onChange={e => setForm({...form, subject:e.target.value})}
                    placeholder="Brief summary of your issue"/>
                </div>
                <div className="op-f" style={{ marginBottom:'.85rem' }}>
                  <label className="op-lbl">Message</label>
                  <textarea className="op-textarea" rows={4} value={form.message}
                    onChange={e => setForm({...form, message:e.target.value})}
                    placeholder="Describe your issue in detail…"/>
                </div>
                <button className="op-save-btn" disabled={sending} onClick={submit}>
                  {sending ? <><div className="op-spin"/>Sending…</> : <><Send size={14}/>Submit Ticket</>}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="op-panel" style={{ animationDelay:'.13s', marginBottom:0 }}>
          <div className="op-panel-hd">
            <div className="op-panel-title"><HelpCircle size={16}/>Frequently Asked</div>
          </div>
          <div className="op-panel-body">
            {faqs.map((f, i) => (
              <div key={i} className="op-faq-item" style={{ animationDelay:`${i*0.05}s` }}>
                <div className="op-faq-q" onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                  <span style={{ flex:1, marginRight:'.5rem' }}>{f.q}</span>
                  {faqOpen === i ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                </div>
                {faqOpen === i && <div className="op-faq-a">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}