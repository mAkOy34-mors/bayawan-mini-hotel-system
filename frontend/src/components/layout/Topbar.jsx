// Topbar.jsx – Light card UI matching BookingPage style
import { LANGUAGES } from '../../constants/config';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

  .tb-wrap {
    height: 56px;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 1.5rem;
    flex-shrink: 0; font-family: 'DM Sans', sans-serif;
    position: sticky; top: 0; z-index: 100;
    box-shadow: 0 1px 0 #e2e8f0;
  }

  .tb-left { display: flex; align-items: center; gap: .85rem; }

  .tb-menu {
    display: none; width: 34px; height: 34px; border-radius: 8px;
    border: 1px solid #e2e8f0; background: #fff;
    align-items: center; justify-content: center;
    cursor: pointer; color: #8a96a8; font-size: 1rem;
    transition: all .15s; flex-shrink: 0;
  }
  .tb-menu:hover { background: #f4f6f8; color: #1a1f2e; }
  @media(max-width: 768px) { .tb-menu { display: flex; } }

  .tb-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.2rem; font-weight: 600; color: #1a1f2e;
    letter-spacing: .02em;
  }
  @media(max-width: 768px) { .tb-title { display: none; } }

  .tb-right { display: flex; align-items: center; gap: .7rem; }

  .tb-lang {
    appearance: none;
    background: #f4f6f8 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='7' viewBox='0 0 10 7'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%238a96a8' fill='none' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right .65rem center;
    border: 1px solid #e2e8f0; border-radius: 8px;
    color: #4a5568; padding: .36rem .55rem .36rem .7rem;
    padding-right: 2rem;
    font-size: .79rem; font-family: 'DM Sans', sans-serif;
    cursor: pointer; outline: none; transition: border-color .15s;
  }
  .tb-lang:focus { border-color: #C9A84C; background-color: #fff; }

  .tb-av {
    width: 32px; height: 32px; border-radius: 9px;
    background: linear-gradient(135deg, #9a7a2e, #C9A84C);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif;
    font-size: .85rem; font-weight: 600; color: #fff;
    cursor: default; user-select: none;
    box-shadow: 0 1px 6px rgba(201,168,76,0.25);
  }
`;

function initials(user) {
  const n = user?.fullName || user?.username || user?.email || '';
  const p = n.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : n.slice(0,2).toUpperCase() || 'G';
}

export function Topbar({ title, user, onMenuClick, lang, setLang }) {
  return (
    <header className="tb-wrap">
      <style>{css}</style>
      <div className="tb-left">
        <button className="tb-menu" onClick={onMenuClick} aria-label="Open menu">☰</button>
        <span className="tb-title">{title}</span>
      </div>
      <div className="tb-right">
        {LANGUAGES && (
          <select className="tb-lang" value={lang} onChange={e => setLang(e.target.value)}>
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
            ))}
          </select>
        )}
        <div className="tb-av">{initials(user)}</div>
      </div>
    </header>
  );
}