// AdminRewards.jsx
import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import {
  Users, Star, TrendingUp, Medal,
  Plus, CheckCircle, XCircle, Calendar,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { adminGetAllRewards, adminAdjustPoints, adminGetRules, adminCreateRule, adminCreatePromo, getActivePromos } from './adminApi';
import { SHARED_CSS, fmt, fmtDate, Skel, Spinner, Pager, Toast, useToast } from './adminShared';

const PAGE_SIZE = 10;
const TIERS = [
  { name:'Bronze',   min:0,     max:999,      icon:'🥉', color:'#cd7f32' },
  { name:'Silver',   min:1000,  max:4999,     icon:'🥈', color:'#94a3b8' },
  { name:'Gold',     min:5000,  max:9999,     icon:'🏅', color:'#C9A84C' },
  { name:'Platinum', min:10000, max:Infinity, icon:'💎', color:'#7c3aed' },
];
function getTier(pts) { return TIERS.slice().reverse().find(t => pts >= t.min) || TIERS[0]; }

const EMPTY_RULE  = { name:'', points_per_php:'1', min_spend:'0', is_active:true };
const EMPTY_PROMO = { title:'', description:'', discount_pct:'0', start_date:'', end_date:'', is_active:true };

export function AdminRewards({ token }) {
  const [tab,       setTab]       = useState('balances');
  const [rewards,   setRewards]   = useState([]);
  const [rules,     setRules]     = useState([]);
  const [promos,    setPromos]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [adjGuest,  setAdjGuest]  = useState(null);
  const [adjForm,   setAdjForm]   = useState({ points:'', reason:'' });
  const [adjSaving, setAdjSaving] = useState(false);
  const [showRule,  setShowRule]  = useState(false);
  const [ruleForm,  setRuleForm]  = useState(EMPTY_RULE);
  const [showPromo, setShowPromo] = useState(false);
  const [promoForm, setPromoForm] = useState(EMPTY_PROMO);
  const [saving,    setSaving]    = useState(false);
  const { toast, show } = useToast();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      adminGetAllRewards(token).catch(() => []),
      adminGetRules(token).catch(() => []),
      getActivePromos(token).catch(() => []),
    ]).then(([r, ru, pr]) => {
      setRewards(Array.isArray(r)  ? r  : []);
      setRules(Array.isArray(ru)   ? ru : []);
      setPromos(Array.isArray(pr)  ? pr : []);
      setLoading(false);
    });
  }, [token]);

  const doAdjust = async () => {
    if (!adjForm.points) { show('Enter point amount', 'error'); return; }
    setAdjSaving(true);
    try {
      const r = await adminAdjustPoints(token, adjGuest.id, {
        points: parseInt(adjForm.points),
        reason: adjForm.reason || 'Manual adjustment',
      });
      show(r.message);
      setRewards(prev => prev.map(rw => rw.id === adjGuest.id ? { ...rw, points: r.currentPoints } : rw));
      setAdjGuest(null);
      setAdjForm({ points:'', reason:'' });
    } catch(e) { show(e.message, 'error'); }
    finally { setAdjSaving(false); }
  };

  const doRule = async () => {
    setSaving(true);
    try {
      const r = await adminCreateRule(token, {
        ...ruleForm,
        points_per_php: parseFloat(ruleForm.points_per_php),
        min_spend:      parseFloat(ruleForm.min_spend),
      });
      setRules(prev => [...prev, r]);
      show('Rule created');
      setShowRule(false);
      setRuleForm(EMPTY_RULE);
    } catch(e) { show(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const doPromo = async () => {
    setSaving(true);
    try {
      const r = await adminCreatePromo(token, {
        ...promoForm,
        discount_pct: parseFloat(promoForm.discount_pct),
      });
      setPromos(prev => [...prev, r]);
      show('Promotion created');
      setShowPromo(false);
      setPromoForm(EMPTY_PROMO);
    } catch(e) { show(e.message, 'error'); }
    finally { setSaving(false); }
  };

  // ── Computed stats ──────────────────────────────────────────────────────────
  const totalPts    = rewards.reduce((s, r) => s + (r.points       || 0), 0);
  const totalEarned = rewards.reduce((s, r) => s + (r.total_earned || 0), 0);
  const goldPlus    = rewards.filter(r => (r.points || 0) >= 5000).length;
  const visible     = rewards.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const STATS = [
    {
      Icon: Users,     label: 'Enrolled Guests',
      value: rewards.length.toLocaleString(),
      sub:   'loyalty members',
      iconColor: '#3b82f6', iconBg: 'rgba(59,130,246,0.1)',
      bar: 'linear-gradient(to right,#2563eb,#60a5fa)',
    },
    {
      Icon: Star,      label: 'Points Balance',
      value: totalPts.toLocaleString(),
      sub:   'current spendable pts',
      iconColor: '#9a7a2e', iconBg: 'rgba(201,168,76,0.1)',
      bar: 'linear-gradient(to right,#9a7a2e,#C9A84C)',
    },
    {
      Icon: TrendingUp, label: 'Total Points Earned',
      value: totalEarned.toLocaleString(),
      sub:   'lifetime issued pts',
      iconColor: '#2d9b6f', iconBg: 'rgba(45,155,111,0.1)',
      bar: 'linear-gradient(to right,#059669,#34d399)',
    },
    {
      Icon: Medal,     label: 'Gold+ Members',
      value: goldPlus.toLocaleString(),
      sub:   '5,000 pts or more',
      iconColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.1)',
      bar: 'linear-gradient(to right,#d97706,#fbbf24)',
    },
  ];

  return (
    <div className="ap-root">
      <style>{SHARED_CSS}</style>
      <Toast toast={toast}/>

      {/* Header */}
      <div className="ap-hd">
        <div>
          <h1 className="ap-title">Rewards</h1>
          <p className="ap-sub">Manage loyalty points, rules and promotions</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'.35rem', marginBottom:'1.2rem' }}>
        {['balances','rules','promotions'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding:'.5rem 1.1rem', borderRadius:9,
            fontFamily:"'DM Sans',sans-serif", fontSize:'.82rem', fontWeight:600,
            cursor:'pointer', transition:'all .18s', border:'1px solid var(--border)',
            background: tab === t ? 'linear-gradient(135deg,#9a7a2e,#C9A84C)' : '#fff',
            color:      tab === t ? '#fff' : 'var(--text-sub)',
            boxShadow:  tab === t ? '0 2px 8px rgba(201,168,76,0.28)' : 'none',
            display:'flex', alignItems:'center', gap:'.4rem',
          }}>
            {t === 'balances'
              ? <><Users     size={13}/> Guest Balances</>
              : t === 'rules'
              ? <><CheckCircle size={13}/> Reward Rules</>
              : <><Star      size={13}/> Promotions</>
            }
          </button>
        ))}
      </div>

      {/* ── Guest Balances ── */}
      {tab === 'balances' && <>

        {/* Stat cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', marginBottom:'1.2rem' }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              background:'#fff', border:'1px solid var(--border)', borderRadius:14,
              padding:'1.1rem 1.15rem', position:'relative', overflow:'hidden',
              boxShadow:'0 1px 6px rgba(0,0,0,.05)',
              transition:'transform .2s,box-shadow .2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,.09)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 1px 6px rgba(0,0,0,.05)'; }}
            >
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:s.bar }}/>
              <div style={{
                width:34, height:34, borderRadius:9, background:s.iconBg,
                display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'.65rem',
              }}>
                <s.Icon size={16} color={s.iconColor} strokeWidth={2}/>
              </div>
              <div style={{ fontSize:'.67rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--text-muted)', marginBottom:'.3rem' }}>
                {s.label}
              </div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.85rem', fontWeight:600, color:'var(--text)', lineHeight:1 }}>
                {loading ? <Skel h={28} w={60}/> : s.value}
              </div>
              {!loading && (
                <div style={{ fontSize:'.68rem', color:'var(--text-muted)', marginTop:'.3rem' }}>{s.sub}</div>
              )}
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="ap-panel">
          <div className="ap-panel-hd">
            <div className="ap-panel-title">
              <Users size={15}/>All Guest Balances
            </div>
          </div>
          {loading
            ? <div style={{ padding:'2.5rem', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:'.65rem' }}>
                <Spinner/>
              </div>
            : rewards.length === 0
              ? <div className="ap-empty">
                  <div className="ap-empty-ico"><Star size={32} color="#C9A84C"/></div>
                  <div className="ap-empty-title">No reward records yet</div>
                </div>
              : <>
                  <div style={{ overflowX:'auto' }}>
                    <table className="ap-tbl">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Guest</th>
                          <th>Points Balance</th>
                          <th>Total Earned</th>
                          <th>Tier</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {visible.map((r, i) => {
                          const tier = getTier(r.points || 0);
                          return (
                            <tr key={r.id}>
                              <td style={{ color:'var(--text-muted)', fontSize:'.75rem' }}>
                                {(page - 1) * PAGE_SIZE + i + 1}
                              </td>
                              <td style={{ fontWeight:600, color:'var(--text)', fontSize:'.84rem' }}>
                                {r.email}
                              </td>
                              <td>
                                <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.1rem', fontWeight:600, color:'var(--gold-dark)' }}>
                                  {(r.points || 0).toLocaleString()}
                                </span>
                              </td>
                              <td>
                                <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1rem', fontWeight:600, color:'#2d9b6f' }}>
                                  {(r.total_earned || 0).toLocaleString()}
                                </span>
                              </td>
                              <td>
                                <span style={{ display:'inline-flex', alignItems:'center', gap:'.3rem', fontSize:'.76rem', fontWeight:700, color:tier.color }}>
                                  {tier.icon} {tier.name}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="ap-btn-ghost"
                                  style={{ fontSize:'.72rem', padding:'.28rem .65rem' }}
                                  onClick={() => { setAdjGuest(r); setAdjForm({ points:'', reason:'' }); }}
                                >
                                  ± Adjust
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <Pager page={page} total={rewards.length} size={PAGE_SIZE} setPage={setPage}/>
                </>
          }
        </div>
      </>}

      {/* ── Rules ── */}
      {tab === 'rules' && <>
        <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'1rem' }}>
          <button className="ap-btn-primary" onClick={() => { setRuleForm(EMPTY_RULE); setShowRule(true); }}
            style={{ display:'flex', alignItems:'center', gap:'.4rem' }}>
            <Plus size={14}/> New Rule
          </button>
        </div>
        <div className="ap-panel">
          <div className="ap-panel-hd">
            <div className="ap-panel-title"><CheckCircle size={15}/>Reward Rules</div>
          </div>
          {loading
            ? <div style={{ padding:'2.5rem', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:'.65rem' }}><Spinner/></div>
            : rules.length === 0
              ? <div className="ap-empty">
                  <div className="ap-empty-ico"><CheckCircle size={32} color="#C9A84C"/></div>
                  <div className="ap-empty-title">No rules defined</div>
                </div>
              : <div style={{ overflowX:'auto' }}>
                  <table className="ap-tbl">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Points/₱</th>
                        <th>Min Spend</th>
                        <th>Active</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rules.map(r => (
                        <tr key={r.id}>
                          <td style={{ fontWeight:600, color:'var(--text)' }}>{r.name}</td>
                          <td><span style={{ fontWeight:700, color:'var(--gold-dark)' }}>{r.points_per_php}</span></td>
                          <td>{fmt(r.min_spend)}</td>
                          <td>
                            <span className={`ap-pill ${r.is_active ? 'COMPLETED' : 'CANCELLED'}`}>
                              <span className="ap-pill-dot"/>
                              {r.is_active
                                ? <><CheckCircle size={10}/> Active</>
                                : <><XCircle     size={10}/> Inactive</>
                              }
                            </span>
                          </td>
                          <td style={{ fontSize:'.75rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'.3rem' }}>
                            <Calendar size={11}/>{fmtDate(r.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
          }
        </div>
      </>}

      {/* ── Promotions ── */}
      {tab === 'promotions' && <>
        <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'1rem' }}>
          <button className="ap-btn-primary" onClick={() => { setPromoForm(EMPTY_PROMO); setShowPromo(true); }}
            style={{ display:'flex', alignItems:'center', gap:'.4rem' }}>
            <Plus size={14}/> New Promotion
          </button>
        </div>
        {promos.length === 0 && !loading
          ? <div className="ap-empty">
              <div className="ap-empty-ico"><Star size={32} color="#C9A84C"/></div>
              <div className="ap-empty-title">No active promotions</div>
            </div>
          : <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem' }}>
              {promos.map(p => (
                <div key={p.id} style={{
                  background:'#fff', border:'1px solid var(--border)', borderRadius:12,
                  overflow:'hidden', boxShadow:'0 1px 5px rgba(0,0,0,.05)',
                }}>
                  <div style={{ height:3, background:'linear-gradient(to right,#9a7a2e,#C9A84C)' }}/>
                  <div style={{ padding:'1rem 1.1rem' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'.55rem' }}>
                      <div style={{ fontSize:'.62rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', color:'var(--text-muted)' }}>
                        Promotion
                      </div>
                      <span className={`ap-pill ${p.is_active ? 'COMPLETED' : 'CANCELLED'}`}>
                        <span className="ap-pill-dot"/>
                        {p.is_active
                          ? <><CheckCircle size={10}/> Active</>
                          : <><XCircle     size={10}/> Inactive</>
                        }
                      </span>
                    </div>
                    <div style={{ fontWeight:700, fontSize:'.95rem', color:'var(--text)', marginBottom:'.35rem' }}>{p.title}</div>
                    {p.description && (
                      <div style={{ fontSize:'.77rem', color:'var(--text-muted)', marginBottom:'.65rem', lineHeight:1.55 }}>
                        {p.description}
                      </div>
                    )}
                    <div style={{
                      display:'flex', justifyContent:'space-between', alignItems:'center',
                      padding:'.55rem .7rem', background:'var(--surface2)', borderRadius:8, border:'1px solid var(--border)',
                    }}>
                      <div>
                        <div style={{ fontSize:'.63rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.07em' }}>Discount</div>
                        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.35rem', fontWeight:600, color:'var(--gold-dark)' }}>
                          {p.discount_pct}%
                        </div>
                      </div>
                      <div style={{ textAlign:'right', display:'flex', alignItems:'center', gap:'.3rem', fontSize:'.63rem', color:'var(--text-muted)' }}>
                        <Calendar size={11}/>{fmtDate(p.start_date)} → {fmtDate(p.end_date)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
        }
      </>}

      {/* ── Adjust Points Modal ── */}
      <Modal show={!!adjGuest} onHide={() => setAdjGuest(null)} size="sm" centered className="ap-modal">
        <Modal.Header closeButton>
          <Modal.Title style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
            <TrendingUp size={16}/> Adjust Points
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {adjGuest && (
            <div style={{ marginBottom:'.75rem', padding:'.75rem 1rem', background:'var(--surface2)', borderRadius:8, border:'1px solid var(--border)' }}>
              <div style={{ fontSize:'.64rem', textTransform:'uppercase', letterSpacing:'.08em', color:'var(--text-muted)', fontWeight:700, marginBottom:'.3rem' }}>
                Guest
              </div>
              <div style={{ fontSize:'.88rem', fontWeight:600, color:'var(--text)', marginBottom:'.4rem' }}>
                {adjGuest.email}
              </div>
              <div style={{ display:'flex', gap:'1.2rem' }}>
                <div>
                  <div style={{ fontSize:'.62rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'.25rem' }}>
                    <Star size={10}/> Current Balance
                  </div>
                  <div style={{ fontSize:'.88rem', fontWeight:700, color:'var(--gold-dark)' }}>
                    {(adjGuest.points || 0).toLocaleString()} pts
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:'.62rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'.25rem' }}>
                    <TrendingUp size={10}/> Total Earned
                  </div>
                  <div style={{ fontSize:'.88rem', fontWeight:700, color:'#2d9b6f' }}>
                    {(adjGuest.total_earned || 0).toLocaleString()} pts
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="ap-field" style={{ marginBottom:'.85rem' }}>
            <label className="ap-label">Points (use negative to deduct)</label>
            <input
              className="ap-input" type="number"
              value={adjForm.points}
              onChange={e => setAdjForm(f => ({ ...f, points:e.target.value }))}
              placeholder="e.g. 500 or -200"
            />
          </div>
          <div className="ap-field">
            <label className="ap-label">Reason</label>
            <input
              className="ap-input"
              value={adjForm.reason}
              onChange={e => setAdjForm(f => ({ ...f, reason:e.target.value }))}
              placeholder="Optional reason…"
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="ap-btn-ghost" onClick={() => setAdjGuest(null)}>Cancel</button>
          <button className="ap-btn-primary" disabled={adjSaving} onClick={doAdjust}
            style={{ display:'flex', alignItems:'center', gap:'.4rem' }}>
            {adjSaving
              ? <><div className="ap-spin-sm"/>Saving…</>
              : <><CheckCircle size={14}/> Apply Adjustment</>
            }
          </button>
        </Modal.Footer>
      </Modal>

      {/* ── New Rule Modal ── */}
      <Modal show={showRule} onHide={() => setShowRule(false)} size="sm" centered className="ap-modal">
        <Modal.Header closeButton>
          <Modal.Title style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
            <Plus size={16}/> New Reward Rule
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="ap-field" style={{ marginBottom:'.85rem' }}>
            <label className="ap-label">Rule Name</label>
            <input
              className="ap-input"
              value={ruleForm.name}
              onChange={e => setRuleForm(f => ({ ...f, name:e.target.value }))}
              placeholder="e.g. Standard Earn Rate"
            />
          </div>
          <div className="ap-form-grid">
            <div className="ap-field">
              <label className="ap-label">Points per ₱</label>
              <input
                className="ap-input" type="number" min={0} step={0.01}
                value={ruleForm.points_per_php}
                onChange={e => setRuleForm(f => ({ ...f, points_per_php:e.target.value }))}
              />
            </div>
            <div className="ap-field">
              <label className="ap-label">Min Spend (₱)</label>
              <input
                className="ap-input" type="number" min={0}
                value={ruleForm.min_spend}
                onChange={e => setRuleForm(f => ({ ...f, min_spend:e.target.value }))}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="ap-btn-ghost" onClick={() => setShowRule(false)}>Cancel</button>
          <button className="ap-btn-primary" disabled={saving} onClick={doRule}
            style={{ display:'flex', alignItems:'center', gap:'.4rem' }}>
            {saving ? <><div className="ap-spin-sm"/>…</> : <><Plus size={14}/> Create</>}
          </button>
        </Modal.Footer>
      </Modal>

      {/* ── New Promo Modal ── */}
      <Modal show={showPromo} onHide={() => setShowPromo(false)} size="md" centered className="ap-modal">
        <Modal.Header closeButton>
          <Modal.Title style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
            <Star size={16}/> New Promotion
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="ap-field" style={{ marginBottom:'.85rem' }}>
            <label className="ap-label">Title</label>
            <input
              className="ap-input"
              value={promoForm.title}
              onChange={e => setPromoForm(f => ({ ...f, title:e.target.value }))}
              placeholder="e.g. Summer Sale"
            />
          </div>
          <div className="ap-field" style={{ marginBottom:'.85rem' }}>
            <label className="ap-label">Description</label>
            <textarea
              className="ap-ta" rows={2}
              value={promoForm.description}
              onChange={e => setPromoForm(f => ({ ...f, description:e.target.value }))}
              placeholder="Describe this promotion…"
            />
          </div>
          <div className="ap-form-grid cols3">
            <div className="ap-field">
              <label className="ap-label">Discount %</label>
              <input
                className="ap-input" type="number" min={0} max={100}
                value={promoForm.discount_pct}
                onChange={e => setPromoForm(f => ({ ...f, discount_pct:e.target.value }))}
              />
            </div>
            <div className="ap-field">
              <label className="ap-label">Start Date</label>
              <input
                className="ap-input" type="date"
                value={promoForm.start_date}
                onChange={e => setPromoForm(f => ({ ...f, start_date:e.target.value }))}
              />
            </div>
            <div className="ap-field">
              <label className="ap-label">End Date</label>
              <input
                className="ap-input" type="date"
                value={promoForm.end_date}
                onChange={e => setPromoForm(f => ({ ...f, end_date:e.target.value }))}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="ap-btn-ghost" onClick={() => setShowPromo(false)}>Cancel</button>
          <button className="ap-btn-primary" disabled={saving} onClick={doPromo}
            style={{ display:'flex', alignItems:'center', gap:'.4rem' }}>
            {saving ? <><div className="ap-spin-sm"/>…</> : <><Star size={14}/> Create Promotion</>}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}