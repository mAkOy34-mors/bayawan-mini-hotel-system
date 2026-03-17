// adminShared.jsx – shared design tokens, helpers, and micro-components

export const fmt  = n  => '₱' + Number(n||0).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
export const fmtDate = d => d ? new Date(d).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'}) : '—';
export const fmtDT   = d => d ? new Date(d).toLocaleString('en-PH',{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';

export const SHARED_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
  :root{
    --gold:#C9A84C;--gold-dark:#9a7a2e;--gold-bg:rgba(201,168,76,0.1);
    --bg:#f4f6f8;--surface:#fff;--surface2:#f8f9fb;
    --text:#1a1f2e;--text-sub:#4a5568;--text-muted:#8a96a8;--border:#e2e8f0;
    --green:#2d9b6f;--green-bg:rgba(45,155,111,0.1);
    --red:#dc3545;--red-bg:rgba(220,53,69,0.1);
    --blue:#3b82f6;--blue-bg:rgba(59,130,246,0.1);
    --orange:#f59e0b;--orange-bg:rgba(245,158,11,0.1);
    --purple:#7c3aed;--purple-bg:rgba(124,58,237,0.1);
  }
  *{box-sizing:border-box;scrollbar-width:thin;scrollbar-color:rgba(201,168,76,0.3) #f0f0f0}
  *::-webkit-scrollbar{width:5px}*::-webkit-scrollbar-track{background:#f0f0f0;border-radius:99px}
  *::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.4);border-radius:99px}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}
  @keyframes barUp{from{transform:scaleY(0)}to{transform:scaleY(1)}}
  @keyframes checkPop{0%{transform:scale(0) rotate(-20deg)}70%{transform:scale(1.15) rotate(5deg)}100%{transform:scale(1) rotate(0)}}

  /* ── Root ── */
  .ap-root{min-height:100vh;background:var(--bg);font-family:'DM Sans',sans-serif;color:var(--text);-webkit-font-smoothing:antialiased;padding:2rem 2.25rem}
  @media(max-width:768px){.ap-root{padding:1.25rem 1rem}}

  /* ── Page header ── */
  .ap-hd{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1.6rem;flex-wrap:wrap;gap:.75rem;animation:fadeUp .4s cubic-bezier(.22,1,.36,1) both}
  .ap-title{font-family:'Cormorant Garamond',serif;font-size:1.9rem;font-weight:600;color:var(--text);margin:0 0 .18rem}
  .ap-sub{font-size:.82rem;color:var(--text-muted)}

  /* ── Stat cards ── */
  .ap-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem}
  @media(max-width:1100px){.ap-stats{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:540px){.ap-stats{grid-template-columns:1fr 1fr}}
  .ap-stat{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:1.15rem 1.2rem;position:relative;overflow:hidden;box-shadow:0 1px 6px rgba(0,0,0,.05);animation:fadeUp .5s cubic-bezier(.22,1,.36,1) both;transition:transform .2s,box-shadow .2s}
  .ap-stat:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.09)}
  .ap-stat::before{content:'';position:absolute;top:0;left:0;right:0;height:3px}
  .ap-stat.gold::before{background:linear-gradient(to right,#9a7a2e,#C9A84C)}
  .ap-stat.green::before{background:linear-gradient(to right,#059669,#34d399)}
  .ap-stat.blue::before{background:linear-gradient(to right,#2563eb,#60a5fa)}
  .ap-stat.orange::before{background:linear-gradient(to right,#d97706,#fbbf24)}
  .ap-stat.red::before{background:linear-gradient(to right,#dc2626,#f87171)}
  .ap-stat.purple::before{background:linear-gradient(to right,#7c3aed,#a78bfa)}
  .ap-stat.slate::before{background:linear-gradient(to right,#475569,#94a3b8)}
  .ap-stat.teal::before{background:linear-gradient(to right,#0d9488,#5eead4)}
  .ap-stat-icon{font-size:1.3rem;margin-bottom:.6rem;display:block}
  .ap-stat-lbl{font-size:.67rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin-bottom:.3rem}
  .ap-stat-val{font-family:'Cormorant Garamond',serif;font-size:1.9rem;font-weight:600;color:var(--text);line-height:1}

  /* ── Panel ── */
  .ap-panel{background:var(--surface);border:1px solid var(--border);border-radius:14px;overflow:hidden;box-shadow:0 1px 6px rgba(0,0,0,.05);animation:fadeUp .45s cubic-bezier(.22,1,.36,1) both;margin-bottom:1rem}
  .ap-panel-hd{display:flex;align-items:center;justify-content:space-between;padding:.95rem 1.25rem;border-bottom:1px solid var(--border);background:var(--surface2);flex-wrap:wrap;gap:.5rem}
  .ap-panel-title{font-family:'Cormorant Garamond',serif;font-size:1.05rem;font-weight:600;color:var(--text)}
  .ap-panel-sub{font-size:.72rem;color:var(--text-muted);margin-top:.08rem}
  .ap-panel-body{padding:1.15rem 1.25rem}

  /* ── Table ── */
  .ap-tbl{width:100%;border-collapse:collapse}
  .ap-tbl th{font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);padding:.6rem .8rem;text-align:left;border-bottom:1px solid var(--border);background:var(--surface2);white-space:nowrap}
  .ap-tbl td{padding:.74rem .8rem;border-bottom:1px solid #f8f9fb;font-size:.82rem;color:var(--text-sub);vertical-align:middle}
  .ap-tbl tr:last-child td{border-bottom:none}
  .ap-tbl tr:hover td{background:#fafbfc}

  /* ── Pills ── */
  .ap-pill{display:inline-flex;align-items:center;gap:.28rem;padding:.18rem .62rem;border-radius:99px;font-size:.67rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;border:1px solid transparent;white-space:nowrap}
  .ap-pill-dot{width:5px;height:5px;border-radius:50%;background:currentColor;flex-shrink:0}
  .ap-pill.CONFIRMED,.ap-pill.OPEN{background:var(--blue-bg);color:var(--blue);border-color:rgba(59,130,246,0.25)}
  .ap-pill.PENDING,.ap-pill.PENDING_DEPOSIT,.ap-pill.IN_PROGRESS{background:var(--orange-bg);color:var(--orange);border-color:rgba(245,158,11,0.25)}
  .ap-pill.COMPLETED,.ap-pill.CHECKED_IN,.ap-pill.PAID,.ap-pill.RESOLVED,.ap-pill.active{background:var(--green-bg);color:var(--green);border-color:rgba(45,155,111,0.25)}
  .ap-pill.CANCELLED,.ap-pill.FAILED,.ap-pill.CLOSED,.ap-pill.inactive{background:var(--red-bg);color:var(--red);border-color:rgba(220,53,69,0.25)}
  .ap-pill.CHECKED_OUT,.ap-pill.LOW{background:#f1f5f9;color:#64748b;border-color:#e2e8f0}
  .ap-pill.HIGH{background:var(--red-bg);color:var(--red);border-color:rgba(220,53,69,0.25)}
  .ap-pill.MEDIUM{background:var(--orange-bg);color:var(--orange);border-color:rgba(245,158,11,0.25)}

  /* ── Toolbar ── */
  .ap-toolbar{display:flex;gap:.75rem;align-items:center;margin-bottom:1rem;flex-wrap:wrap}
  .ap-search-wrap{position:relative;flex:1;min-width:160px;max-width:320px}
  .ap-search-ico{position:absolute;left:.8rem;top:50%;transform:translateY(-50%);color:var(--text-muted);pointer-events:none;font-size:.8rem}
  .ap-search{width:100%;background:var(--surface2);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:.62rem .85rem .62rem 2.2rem;font-size:.83rem;font-family:'DM Sans',sans-serif;outline:none;transition:border-color .18s,box-shadow .18s}
  .ap-search::placeholder{color:var(--text-muted)}
  .ap-search:focus{border-color:var(--gold);background:#fff;box-shadow:0 0 0 3px rgba(201,168,76,0.1)}
  .ap-select{background:#fff;border:1px solid var(--border);color:var(--text-sub);border-radius:8px;padding:.6rem .85rem;font-size:.82rem;font-family:'DM Sans',sans-serif;outline:none;cursor:pointer;transition:border-color .18s;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='7'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%238a96a8' fill='none' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right .7rem center;padding-right:2rem}
  .ap-select:focus{border-color:var(--gold)}

  /* ── Buttons ── */
  .ap-btn-primary{display:inline-flex;align-items:center;gap:.4rem;padding:.58rem 1.1rem;border:none;border-radius:8px;font-size:.82rem;font-family:'DM Sans',sans-serif;font-weight:600;cursor:pointer;background:linear-gradient(135deg,#9a7a2e,#C9A84C);color:#fff;transition:all .2s;box-shadow:0 2px 8px rgba(201,168,76,0.28);white-space:nowrap}
  .ap-btn-primary:hover:not(:disabled){background:linear-gradient(135deg,#b09038,#dfc06e);transform:translateY(-1px);box-shadow:0 4px 14px rgba(201,168,76,0.32)}
  .ap-btn-primary:disabled{opacity:.5;cursor:not-allowed}
  .ap-btn-ghost{display:inline-flex;align-items:center;gap:.4rem;padding:.55rem 1rem;border:1.5px solid var(--border);border-radius:8px;font-size:.8rem;font-family:'DM Sans',sans-serif;font-weight:600;cursor:pointer;background:#fff;color:var(--text-sub);transition:all .18s;white-space:nowrap}
  .ap-btn-ghost:hover{border-color:var(--gold);color:var(--gold-dark);background:var(--gold-bg)}
  .ap-btn-red{display:inline-flex;align-items:center;gap:.4rem;padding:.55rem 1rem;border:1px solid rgba(220,53,69,0.25);border-radius:8px;font-size:.8rem;font-family:'DM Sans',sans-serif;font-weight:600;cursor:pointer;background:var(--red-bg);color:var(--red);transition:all .18s;white-space:nowrap}
  .ap-btn-red:hover{background:rgba(220,53,69,0.14);border-color:rgba(220,53,69,0.4)}
  .ap-btn-green{display:inline-flex;align-items:center;gap:.4rem;padding:.55rem 1rem;border:1px solid rgba(45,155,111,0.25);border-radius:8px;font-size:.8rem;font-family:'DM Sans',sans-serif;font-weight:600;cursor:pointer;background:var(--green-bg);color:var(--green);transition:all .18s;white-space:nowrap}
  .ap-btn-green:hover{background:rgba(45,155,111,0.16);border-color:rgba(45,155,111,0.4)}

  /* ── Form fields ── */
  .ap-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:.9rem;margin-bottom:.9rem}
  @media(max-width:640px){.ap-form-grid{grid-template-columns:1fr}}
  .ap-form-grid.cols3{grid-template-columns:1fr 1fr 1fr}
  @media(max-width:900px){.ap-form-grid.cols3{grid-template-columns:1fr 1fr}}
  .ap-field{display:flex;flex-direction:column;gap:.38rem}
  .ap-label{font-size:.68rem;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);font-weight:700}
  .ap-label .req{color:var(--red);margin-left:.15rem}
  .ap-input,.ap-sel,.ap-ta{background:#fff;border:1px solid var(--border);color:var(--text);border-radius:8px;padding:.65rem .9rem;font-size:.875rem;font-family:'DM Sans',sans-serif;outline:none;transition:border-color .2s,box-shadow .2s;width:100%}
  .ap-input::placeholder,.ap-ta::placeholder{color:var(--text-muted)}
  .ap-input:focus,.ap-sel:focus,.ap-ta:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(201,168,76,0.12)}
  .ap-sel{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238a96a8' fill='none' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right .85rem center;padding-right:2.4rem;background-color:#fff;cursor:pointer}
  .ap-ta{resize:vertical;min-height:80px}

  /* ── Pagination ── */
  .ap-pager{display:flex;align-items:center;justify-content:space-between;padding:.85rem 1.25rem;border-top:1px solid var(--border);background:var(--surface2);flex-wrap:wrap;gap:.5rem}
  .ap-pager-info{font-size:.75rem;color:var(--text-muted)}
  .ap-pager-info strong{color:var(--text-sub)}
  .ap-pager-btns{display:flex;gap:.3rem;align-items:center}
  .ap-pg{width:30px;height:30px;border-radius:7px;border:1px solid var(--border);background:#fff;color:var(--text-muted);font-size:.78rem;font-family:'DM Sans',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s}
  .ap-pg.wide{width:auto;padding:0 .65rem;font-size:.73rem}
  .ap-pg:hover:not(:disabled){border-color:var(--gold);color:var(--gold-dark)}
  .ap-pg.on{background:linear-gradient(135deg,#9a7a2e,#C9A84C);border-color:var(--gold);color:#fff;font-weight:700}
  .ap-pg:disabled{opacity:.3;cursor:not-allowed}

  /* ── Skeleton ── */
  .ap-skel{display:block;border-radius:6px;background:linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 50%,#f1f5f9 100%);background-size:600px 100%;animation:shimmer 1.4s ease-in-out infinite}

  /* ── Spinner ── */
  .ap-spin{width:20px;height:20px;border:2.5px solid #e2e8f0;border-top-color:var(--gold);border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0}
  .ap-spin-sm{width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite}

  /* ── Empty state ── */
  .ap-empty{text-align:center;padding:3rem 2rem}
  .ap-empty-ico{font-size:2.5rem;opacity:.3;margin-bottom:.65rem}
  .ap-empty-title{font-family:'Cormorant Garamond',serif;font-size:1.1rem;color:var(--text-sub);margin-bottom:.3rem}
  .ap-empty-sub{font-size:.78rem;color:var(--text-muted)}

  /* ── Modal overrides ── */
  .ap-modal .modal-content{background:#fff;border:1px solid var(--border);border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.15)}
  .ap-modal .modal-header{background:var(--surface2);border-bottom:1px solid var(--border);padding:1.1rem 1.45rem}
  .ap-modal .modal-body{background:#fff;padding:1.5rem}
  .ap-modal .modal-footer{background:var(--surface2);border-top:1px solid var(--border);padding:.85rem 1.45rem}
  .ap-modal .modal-title{font-family:'Cormorant Garamond',serif;font-size:1.1rem;color:var(--text);font-weight:600}

  /* ── Alert toast ── */
  .ap-toast{position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);z-index:9999;display:flex;align-items:center;gap:.65rem;padding:.75rem 1.3rem;border-radius:10px;font-size:.83rem;font-family:'DM Sans',sans-serif;font-weight:600;animation:fadeUp .3s cubic-bezier(.22,1,.36,1) both;box-shadow:0 8px 24px rgba(0,0,0,.15);min-width:220px;max-width:400px}
  .ap-toast.success{background:#1a1f2e;color:#fff;border:1px solid rgba(45,155,111,0.4)}
  .ap-toast.error{background:#1a1f2e;color:#fff;border:1px solid rgba(220,53,69,0.4)}
`;

export function Pill({ status, label }) {
  const labels = {
    CONFIRMED:'Confirmed', PENDING:'Pending', PENDING_DEPOSIT:'Deposit Pending',
    COMPLETED:'Completed', CHECKED_IN:'Checked In', CHECKED_OUT:'Checked Out',
    CANCELLED:'Cancelled', PAID:'Paid', FAILED:'Failed',
    OPEN:'Open', IN_PROGRESS:'In Progress', RESOLVED:'Resolved', CLOSED:'Closed',
    HIGH:'High', MEDIUM:'Medium', LOW:'Low', active:'Active', inactive:'Inactive',
  };
  return (
    <span className={`ap-pill ${status}`}>
      <span className="ap-pill-dot" />{label || labels[status] || status}
    </span>
  );
}

export function Skel({ w = '100%', h = 14, r = 6, mb = 0 }) {
  return <span className="ap-skel" style={{ display:'block', width:w, height:h, borderRadius:r, marginBottom:mb }} />;
}

export function Spinner() {
  return <div className="ap-spin" />;
}

export function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`ap-toast ${toast.type}`}>
      {toast.type === 'success' ? '✅' : '⚠️'} {toast.msg}
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };
  return { toast, show };
}

// Must import useState for useToast
import { useState } from 'react';

export function Pager({ page, total, size, setPage }) {
  const totalPages = Math.max(1, Math.ceil(total / size));
  const btns = [];
  if (totalPages <= 7) { for (let i=1;i<=totalPages;i++) btns.push(i); }
  else {
    btns.push(1);
    if (page > 3) btns.push('…');
    for (let i=Math.max(2,page-1);i<=Math.min(totalPages-1,page+1);i++) btns.push(i);
    if (page < totalPages-2) btns.push('…');
    btns.push(totalPages);
  }
  const start = (page-1)*size+1;
  const end   = Math.min(page*size, total);
  return (
    <div className="ap-pager">
      <div className="ap-pager-info">Showing <strong>{start}–{end}</strong> of <strong>{total}</strong></div>
      <div className="ap-pager-btns">
        <button className="ap-pg wide" disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
        {btns.map((b,i) => b==='…'
          ? <span key={i} style={{color:'#cbd5e1',fontSize:'.78rem',padding:'0 .1rem'}}>…</span>
          : <button key={i} className={`ap-pg${page===b?' on':''}`} onClick={()=>setPage(b)}>{b}</button>
        )}
        <button className="ap-pg wide" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>Next →</button>
      </div>
    </div>
  );
}

export function BarChart({ data, height = 110, keyVal = 'total', keyLabel = 'label' }) {
  const max = Math.max(...data.map(d => d[keyVal] || 0), 1);
  const fmtV = v => typeof v === 'number' && v > 999 ? fmt(v) : v;
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:'.45rem', position:'relative', paddingBottom:'1.4rem', height: height+22 }}>
      <div style={{ position:'absolute', inset:'0 0 1.4rem 0', pointerEvents:'none', backgroundImage:'repeating-linear-gradient(to top,transparent 0%,transparent calc(25% - 1px),#f1f5f9 calc(25% - 1px),#f1f5f9 25%)' }} />
      {data.map((d, i) => {
        const h = Math.max(4, (d[keyVal] / max) * height);
        return (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'.38rem' }}>
            <div style={{ width:'100%', display:'flex', alignItems:'flex-end', height }}>
              <div
                style={{ width:'100%', height: h, borderRadius:'5px 5px 0 0', cursor:'pointer', position:'relative', background:'linear-gradient(to top,rgba(201,168,76,.7),rgba(201,168,76,.3))', transformOrigin:'bottom', animation:`barUp .5s cubic-bezier(.22,1,.36,1) ${i*0.04}s both`, transition:'background .18s' }}
                data-v={fmtV(d[keyVal])}
                onMouseEnter={e=>{e.currentTarget.style.background='linear-gradient(to top,#C9A84C,rgba(201,168,76,.55))';}}
                onMouseLeave={e=>{e.currentTarget.style.background='linear-gradient(to top,rgba(201,168,76,.7),rgba(201,168,76,.3))';}}
              />
            </div>
            <span style={{ fontSize:'.6rem', color:'var(--text-muted)', letterSpacing:'.02em' }}>{d[keyLabel]}</span>
          </div>
        );
      })}
    </div>
  );
}
