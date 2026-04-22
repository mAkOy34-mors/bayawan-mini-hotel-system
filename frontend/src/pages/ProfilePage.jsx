// ProfilePage.jsx – Light card UI matching BookingPage style
import { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from 'react-bootstrap';
import { fetchProfile, saveProfile, deleteProfile } from '../services/api';
import { Alert } from '../components/ui/Alert';
import { useAlert } from '../hooks/useAlert';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

  :root {
    --gold:       #C9A84C;
    --gold-dark:  #9a7a2e;
    --gold-bg:    rgba(201,168,76,0.1);
    --bg:         #f4f6f8;
    --surface:    #ffffff;
    --surface2:   #f8f9fb;
    --text:       #1a1f2e;
    --text-sub:   #4a5568;
    --text-muted: #8a96a8;
    --border:     #e2e8f0;
    --green:      #2d9b6f;
    --green-bg:   rgba(45,155,111,0.1);
    --red:        #dc3545;
    --red-bg:     rgba(220,53,69,0.1);
  }

  * { box-sizing:border-box; scrollbar-width:thin; scrollbar-color:rgba(201,168,76,0.3) #f0f0f0; }
  *::-webkit-scrollbar { width:5px; }
  *::-webkit-scrollbar-track { background:#f0f0f0; border-radius:99px; }
  *::-webkit-scrollbar-thumb { background:rgba(201,168,76,0.4); border-radius:99px; }

  @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes checkPop{ 0%{transform:scale(0) rotate(-20deg)} 70%{transform:scale(1.15) rotate(5deg)} 100%{transform:scale(1) rotate(0)} }
  @keyframes scanLine{ 0%{top:12%;opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{top:88%;opacity:0} }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.25} }

  .pf-root {
    min-height:100vh; background:var(--bg); font-family:'DM Sans',sans-serif;
    color:var(--text); -webkit-font-smoothing:antialiased; padding:2rem 2.25rem;
  }
  @media(max-width:768px){ .pf-root { padding:1.25rem 1rem; } }

  .pf-hd { margin-bottom:1.6rem; animation:fadeUp .4s cubic-bezier(.22,1,.36,1) both; }
  .pf-title { font-family:'Cormorant Garamond',serif; font-size:1.9rem; font-weight:600; color:var(--text); margin:0 0 .18rem; }
  .pf-sub   { font-size:.82rem; color:var(--text-muted); }

  .pf-grid { display:grid; grid-template-columns:272px 1fr; gap:1.1rem; }
  @media(max-width:1024px){ .pf-grid { grid-template-columns:1fr; } }

  .pf-panel {
    background:var(--surface); border:1px solid var(--border); border-radius:14px;
    overflow:hidden; box-shadow:0 1px 6px rgba(0,0,0,.05); animation:fadeUp .45s cubic-bezier(.22,1,.36,1) both;
  }
  .pf-panel-hd {
    display:flex; align-items:center; justify-content:space-between;
    padding:.95rem 1.25rem; border-bottom:1px solid var(--border); background:var(--surface2);
  }
  .pf-panel-title { font-family:'Cormorant Garamond',serif; font-size:1.05rem; font-weight:600; color:var(--text); }
  .pf-panel-sub   { font-size:.72rem; color:var(--text-muted); margin-top:.08rem; }
  .pf-panel-body  { padding:1.25rem; }

  /* ── Avatar ── */
  .pf-avatar {
    width:76px; height:76px; border-radius:16px; margin:0 auto .9rem;
    background:linear-gradient(135deg,#9a7a2e,#C9A84C);
    display:flex; align-items:center; justify-content:center;
    font-family:'Cormorant Garamond',serif; font-size:1.8rem; font-weight:600; color:#fff;
    box-shadow:0 4px 14px rgba(201,168,76,0.28); position:relative;
    transition:box-shadow .2s;
  }
  .pf-avatar.editable { cursor:pointer; }
  .pf-avatar.editable:hover { box-shadow:0 6px 20px rgba(201,168,76,0.42); }

  /* ALL children must never capture pointer events so parent onClick always fires */
  .pf-avatar * { pointer-events:none; }

  .pf-avatar-img {
    width:100%; height:100%; object-fit:cover; border-radius:14px; display:block;
  }
  .pf-avatar-overlay {
    position:absolute; inset:0; border-radius:14px;
    background:rgba(0,0,0,0.38);
    display:flex; align-items:center; justify-content:center;
    font-size:1.3rem; opacity:0; transition:opacity .18s;
  }
  .pf-avatar.editable:hover .pf-avatar-overlay { opacity:1; }
  .pf-avatar-hint {
    font-size:.62rem; color:var(--text-muted); text-align:center;
    margin-top:-.5rem; margin-bottom:.75rem; letter-spacing:.03em;
  }
  .pf-avatar-badge {
    position:absolute; bottom:-4px; right:-4px; width:22px; height:22px; border-radius:6px;
    background:var(--green); border:2px solid var(--surface);
    display:flex; align-items:center; justify-content:center; font-size:.6rem; color:#fff;
  }

  .pf-name  { font-family:'Cormorant Garamond',serif; font-size:1.2rem; font-weight:600; color:var(--text); text-align:center; margin-bottom:.18rem; }
  .pf-email { font-size:.74rem; color:var(--text-muted); text-align:center; margin-bottom:1.1rem; }

  .pf-comp { margin-bottom:.95rem; }
  .pf-comp-row { display:flex; justify-content:space-between; margin-bottom:.38rem; }
  .pf-comp-lbl { font-size:.73rem; font-weight:600; color:var(--text-sub); }
  .pf-comp-pct { font-size:.73rem; font-weight:700; color:var(--gold-dark); }
  .pf-comp-track { height:6px; border-radius:99px; background:#f1f5f9; }
  .pf-comp-fill  { height:100%; border-radius:99px; background:linear-gradient(to right,#9a7a2e,#C9A84C); transition:width .6s ease; }

  .pf-divider { height:1px; background:var(--border); margin:.85rem 0; }

  .pf-info-row { display:flex; justify-content:space-between; align-items:center; padding:.48rem 0; border-bottom:1px solid #f8f9fb; }
  .pf-info-row:last-child { border-bottom:none; }
  .pf-info-lbl { font-size:.7rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:.07em; font-weight:600; }
  .pf-info-val { font-size:.81rem; color:var(--text-sub); font-weight:500; }
  .pf-info-val.green { color:var(--green); }

  .pf-verify-btn {
    width:100%; margin-top:.85rem; padding:.62rem 1rem; border-radius:8px;
    border:1.5px solid rgba(201,168,76,0.35); background:var(--gold-bg);
    color:var(--gold-dark); font-size:.82rem; font-family:'DM Sans',sans-serif;
    font-weight:600; cursor:pointer; transition:all .18s;
    display:flex; align-items:center; justify-content:center; gap:.45rem;
  }
  .pf-verify-btn:hover { background:var(--gold); color:#fff; border-color:var(--gold); }
  .pf-verified-box {
    width:100%; margin-top:.85rem; padding:.58rem 1rem; border-radius:8px;
    background:var(--green-bg); border:1px solid rgba(45,155,111,0.22);
    display:flex; align-items:center; justify-content:center; gap:.4rem;
    font-size:.82rem; color:var(--green); font-weight:600;
  }
  .pf-delete-btn {
    width:100%; margin-top:.55rem; padding:.55rem 1rem; border-radius:8px;
    border:1px solid rgba(220,53,69,0.2); background:rgba(220,53,69,0.05);
    color:var(--red); font-size:.78rem; font-family:'DM Sans',sans-serif;
    cursor:pointer; transition:all .18s;
  }
  .pf-delete-btn:hover { background:rgba(220,53,69,0.1); border-color:rgba(220,53,69,0.35); }

  .pf-edit-btn {
    padding:.38rem .88rem; border-radius:8px; border:1.5px solid var(--border);
    background:#fff; color:var(--text-sub); font-size:.75rem;
    font-family:'DM Sans',sans-serif; font-weight:600; cursor:pointer; transition:all .18s;
  }
  .pf-edit-btn:hover { border-color:var(--gold); color:var(--gold-dark); background:var(--gold-bg); }
  .pf-cancel-btn {
    padding:.38rem .88rem; border-radius:8px; border:1px solid var(--border);
    background:#fff; color:var(--text-muted); font-size:.75rem;
    font-family:'DM Sans',sans-serif; cursor:pointer; transition:all .18s;
  }
  .pf-cancel-btn:hover { background:var(--surface2); color:var(--text); }

  .pf-section {
    font-size:.66rem; text-transform:uppercase; letter-spacing:.1em; color:var(--text-muted);
    font-weight:700; margin-bottom:.9rem; display:flex; align-items:center; gap:.5rem;
  }
  .pf-section::after { content:''; flex:1; height:1px; background:var(--border); }

  .pf-fg  { display:grid; grid-template-columns:1fr 1fr; gap:.9rem; margin-bottom:.9rem; }
  @media(max-width:640px){ .pf-fg { grid-template-columns:1fr; } }
  .pf-f   { display:flex; flex-direction:column; gap:.38rem; }
  .pf-lbl {
    font-size:.68rem; letter-spacing:.08em; text-transform:uppercase;
    color:var(--text-muted); font-weight:700;
  }
  .pf-lbl .req { color:var(--red); margin-left:.15rem; }
  .pf-input, .pf-select, .pf-textarea {
    background:#fff; border:1px solid var(--border); color:var(--text);
    border-radius:8px; padding:.65rem .9rem; font-size:.875rem;
    font-family:'DM Sans',sans-serif; outline:none; transition:border-color .2s,box-shadow .2s;
  }
  .pf-input::placeholder, .pf-textarea::placeholder { color:var(--text-muted); }
  .pf-input:focus, .pf-select:focus, .pf-textarea:focus {
    border-color:var(--gold); box-shadow:0 0 0 3px rgba(201,168,76,0.12);
  }
  .pf-input:disabled, .pf-select:disabled { background:var(--surface2); color:var(--text-sub); cursor:default; }
  .pf-select {
    appearance:none;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238a96a8' fill='none' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:right .85rem center; padding-right:2.4rem;
    background-color:#fff;
  }
  .pf-select:focus { background-color:#fff; }
  .pf-textarea { resize:vertical; min-height:76px; }

  .pf-view-val {
    padding:.62rem .9rem; background:var(--surface2); border:1px solid #f0f4f8;
    border-radius:8px; font-size:.875rem; color:var(--text-sub);
    min-height:40px; display:flex; align-items:center;
  }
  .pf-view-val.empty { color:var(--text-muted); font-style:italic; font-size:.82rem; }

  .pf-save-btn {
    padding:.72rem 1.8rem; border:none; border-radius:8px; font-size:.875rem;
    font-family:'DM Sans',sans-serif; font-weight:600; cursor:pointer;
    background:linear-gradient(135deg,#9a7a2e,#C9A84C); color:#fff;
    transition:all .22s; display:inline-flex; align-items:center; gap:.5rem;
    margin-top:1rem; box-shadow:0 2px 8px rgba(201,168,76,0.28);
  }
  .pf-save-btn:hover:not(:disabled) { background:linear-gradient(135deg,#b09038,#dfc06e); box-shadow:0 4px 14px rgba(201,168,76,0.32); transform:translateY(-1px); }
  .pf-save-btn:disabled { opacity:.5; cursor:not-allowed; }
  .pf-spin { width:14px; height:14px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }

  .pf-modal .modal-content { background:#fff; border:1px solid var(--border); border-radius:16px; box-shadow:0 20px 60px rgba(0,0,0,.15); }
  .pf-modal .modal-header  { background:var(--surface2); border-bottom:1px solid var(--border); padding:1.1rem 1.45rem; }
  .pf-modal .modal-body    { background:#fff; padding:1.5rem; }
  .pf-modal .modal-title   { font-family:'Cormorant Garamond',serif; font-size:1.1rem; color:var(--text); font-weight:600; }

  .vrf-steps { display:flex; align-items:center; justify-content:center; margin-bottom:.45rem; }
  .vrf-dot {
    width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center;
    font-size:.72rem; font-weight:700; border:1.5px solid var(--border); color:var(--text-muted); transition:all .25s;
  }
  .vrf-dot.done   { background:var(--green-bg); color:var(--green); border-color:rgba(45,155,111,0.3); }
  .vrf-dot.active { background:linear-gradient(135deg,#9a7a2e,#C9A84C); color:#fff; border-color:var(--gold); }
  .vrf-line { width:44px; height:1.5px; margin:0 .28rem; transition:background .25s; }
  .vrf-labels { display:flex; justify-content:center; margin-bottom:1.4rem; }
  .vrf-lbl { width:78px; text-align:center; font-size:.66rem; letter-spacing:.04em; color:var(--text-muted); }
  .vrf-lbl.active { color:var(--gold-dark); font-weight:700; }

  .vrf-viewport {
    border-radius:10px; overflow:hidden; position:relative; background:var(--surface2);
    min-height:240px; display:flex; align-items:center; justify-content:center;
    border:1px solid var(--border);
  }
  .vrf-idle { text-align:center; padding:2rem 1.25rem; }
  .vrf-idle-ico  { font-size:2.5rem; margin-bottom:.6rem; opacity:.55; }
  .vrf-idle-text { font-size:.79rem; color:var(--text-muted); margin-bottom:1rem; line-height:1.55; }
  .vrf-btn-row { display:flex; gap:.5rem; justify-content:center; flex-wrap:wrap; }
  .vrf-btn-primary {
    padding:.52rem 1rem; border-radius:8px; border:none; font-size:.78rem;
    font-family:'DM Sans',sans-serif; font-weight:600; cursor:pointer;
    background:linear-gradient(135deg,#9a7a2e,#C9A84C); color:#fff;
    box-shadow:0 2px 6px rgba(201,168,76,0.25); transition:all .18s;
  }
  .vrf-btn-ghost {
    padding:.52rem 1rem; border-radius:8px; border:1.5px solid var(--border); font-size:.78rem;
    font-family:'DM Sans',sans-serif; font-weight:600; cursor:pointer;
    background:#fff; color:var(--text-sub); transition:all .18s;
  }
  .vrf-btn-ghost:hover { border-color:var(--gold); color:var(--gold-dark); }
  .vrf-overlay { position:absolute; inset:0; background:rgba(0,0,0,0.3); z-index:2; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; padding-bottom:.75rem; }
  .vrf-scan-line { position:absolute; width:100%; height:2px; background:linear-gradient(to right,transparent,#C9A84C,transparent); animation:scanLine 1.8s ease-in-out infinite; }
  .vrf-status-pill { background:rgba(255,255,255,0.92); color:var(--gold-dark); padding:.3rem .85rem; border-radius:99px; font-size:.72rem; font-weight:600; z-index:3; border:1px solid rgba(201,168,76,0.2); display:flex; align-items:center; gap:.4rem; }
  .vrf-pulse { width:6px; height:6px; border-radius:50%; background:var(--gold-dark); animation:pulse 1s ease-in-out infinite; }
  .vrf-cam-err { font-size:.74rem; color:var(--orange,#f59e0b); background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.2); padding:.45rem .75rem; border-radius:8px; margin-bottom:.65rem; text-align:center; }
  .vrf-captured { text-align:center; padding:1rem; }
  .vrf-captured img { border:2px solid var(--green); border-radius:9px; max-height:180px; max-width:100%; object-fit:cover; }
  .vrf-check { position:absolute; top:-8px; right:-8px; width:24px; height:24px; border-radius:50%; background:var(--green); border:2px solid #fff; display:flex; align-items:center; justify-content:center; font-size:.65rem; color:#fff; animation:checkPop .4s both; }
  .vrf-retake { margin-top:.6rem; padding:.36rem .8rem; border-radius:7px; border:1px solid var(--border); background:#fff; color:var(--text-muted); font-size:.74rem; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all .18s; }
  .vrf-retake:hover { border-color:var(--gold); color:var(--gold-dark); }
  .vrf-heading { font-family:'Cormorant Garamond',serif; font-size:1.35rem; font-weight:600; color:var(--text); text-align:center; margin-bottom:.28rem; }
  .vrf-desc    { font-size:.79rem; color:var(--text-muted); text-align:center; margin-bottom:1.25rem; line-height:1.6; }
  .vrf-next-btn {
    display:block; width:100%; max-width:230px; margin:.65rem auto 0; padding:.68rem 1rem;
    border:none; border-radius:8px; font-size:.875rem; font-family:'DM Sans',sans-serif;
    font-weight:600; cursor:pointer; background:linear-gradient(135deg,#9a7a2e,#C9A84C); color:#fff;
    box-shadow:0 2px 8px rgba(201,168,76,0.25); transition:all .22s;
  }
  .vrf-next-btn:hover:not(:disabled) { background:linear-gradient(135deg,#b09038,#dfc06e); }
  .vrf-next-btn:disabled { opacity:.4; cursor:not-allowed; }
  .vrf-thumbs { display:flex; justify-content:center; gap:1rem; margin:1rem 0; }
  .vrf-thumb-id   { border:2px solid var(--gold); border-radius:9px; width:105px; height:70px; object-fit:cover; }
  .vrf-thumb-face { border:2px solid var(--green); border-radius:50%; width:68px; height:68px; object-fit:cover; }
  .vrf-thumb-lbl  { font-size:.67rem; color:var(--text-muted); text-align:center; margin-top:.3rem; }
  .vrf-success-box { padding:.65rem 1rem; border-radius:8px; background:var(--green-bg); border:1px solid rgba(45,155,111,0.22); color:var(--green); font-size:.8rem; text-align:center; margin-bottom:1rem; }

  .del-modal .modal-content { background:#fff; border:1px solid rgba(220,53,69,0.2); border-radius:14px; }
  .del-modal .modal-header  { background:var(--surface2); border-bottom:1px solid var(--border); padding:1rem 1.3rem; }
  .del-modal .modal-body    { background:#fff; padding:1.3rem; }
  .del-modal .modal-footer  { background:var(--surface2); border-top:1px solid var(--border); padding:.85rem 1.3rem; }
  .del-modal .modal-title   { font-family:'Cormorant Garamond',serif; font-size:1.05rem; color:var(--red); }
  .del-ok  { padding:.55rem 1.3rem; border:1px solid rgba(220,53,69,0.3); border-radius:8px; font-size:.82rem; font-family:'DM Sans',sans-serif; font-weight:600; cursor:pointer; background:var(--red-bg); color:var(--red); transition:all .18s; }
  .del-ok:hover { background:rgba(220,53,69,0.14); }
  .del-no  { padding:.55rem 1.1rem; border:1px solid var(--border); border-radius:8px; font-size:.82rem; font-family:'DM Sans',sans-serif; cursor:pointer; background:#fff; color:var(--text-muted); transition:all .18s; }
  .del-no:hover { background:var(--surface2); color:var(--text); }
`;

const ID_TYPE_LABELS  = { NATIONAL_ID:'National ID', PASSPORT:'Passport', DRIVERS_LICENSE:"Driver's License", SSS:'SSS ID', PHILHEALTH:'PhilHealth ID', VOTERS_ID:"Voter's ID", OTHER:'Other' };
const GENDER_LABELS   = { MALE:'Male', FEMALE:'Female', NON_BINARY:'Non-binary', PREFER_NOT_TO_SAY:'Prefer not to say' };
const VISA_LABELS     = { TOURIST:'Tourist', BUSINESS:'Business', STUDENT:'Student', WORK:'Work', IMMIGRANT:'Immigrant', DIPLOMATIC:'Diplomatic', TRANSIT:'Transit' };

const ID_SCAN_STEPS   = [[600,'Detecting document…'],[1400,'Reading data…'],[2200,'Verifying…'],[2900,'Capturing…']];
const ID_CAP_DELAY    = 3400;
const FACE_SCAN_STEPS = [[500,'Detecting face…'],[1200,'Mapping features…'],[2000,'Liveness check…'],[2700,'Matching ID…'],[3300,'Calculating score…']];
const FACE_CAP_DELAY  = 3900;

function getInitials(user) {
  const n = user?.fullName || user?.username || user?.email || '';
  const p = n.trim().split(' ');
  return p.length >= 2 ? (p[0][0]+p[1][0]).toUpperCase() : n.slice(0,2).toUpperCase() || 'G';
}
function getUsername(user) {
  return user?.fullName || user?.username || user?.email?.split('@')[0] || 'Guest';
}

function ScanView({ type, videoRef, canvasRef, active, scanStatus, captured, camErr, onCamera, onUpload, onRetake }) {
  const upRef = useRef(null);
  return (
    <div className="vrf-viewport">
      {!captured && !active && (
        <div className="vrf-idle">
          {camErr && <div className="vrf-cam-err">⚠️ {camErr}</div>}
          <div className="vrf-idle-ico">{type==='id'?'🪪':'🤳'}</div>
          <p className="vrf-idle-text">
            {type==='id'
              ? 'Position your ID in good lighting, then open the camera or upload a photo.'
              : 'Look directly at camera in good lighting. Face match is automatic.'}
          </p>
          <div className="vrf-btn-row">
            <button className="vrf-btn-primary" onClick={onCamera}>📷 Camera</button>
            <button className="vrf-btn-ghost"   onClick={()=>upRef.current?.click()}>📁 Upload</button>
          </div>
          <input ref={upRef} type="file" accept="image/*" style={{ display:'none' }} onChange={onUpload}/>
        </div>
      )}
      {active && !captured && (
        <video ref={videoRef} autoPlay playsInline muted style={{ width:'100%', maxHeight:240, objectFit:'cover', display:'block' }}/>
      )}
      {active && !captured && scanStatus && (
        <div className="vrf-overlay">
          <div className="vrf-scan-line"/>
          <div className="vrf-status-pill"><div className="vrf-pulse"/>{scanStatus}</div>
        </div>
      )}
      {captured && (
        <div className="vrf-captured">
          <div style={{ position:'relative', display:'inline-block' }}>
            <img src={captured} alt={type}/>
            <div className="vrf-check">✓</div>
          </div>
          <div><button className="vrf-retake" onClick={onRetake}>↺ Retake</button></div>
        </div>
      )}
      <canvas ref={canvasRef} style={{ display:'none' }}/>
    </div>
  );
}

export function ProfilePage({ user, token, onProfileSave, initialProfile = null }) {
  // Seed state from initialProfile passed by App.jsx — no fetch needed on mount
  const [profile, setProfile] = useState(() => initialProfile || {
    firstName:'', lastName:'', gender:'', dateOfBirth:'',
    nationality:'', contactNumber:'', homeAddress:'',
    idType:'', idNumber:'', passportNumber:'', visaType:'', visaExpiryDate:'',
    profilePicture: null,
  });
  const [editing, setEditing]   = useState(false);
  const [saving,  setSaving]    = useState(false);
  const { alert, showAlert }    = useAlert();

  // ── Profile picture — seed from initialProfile if available ──
  const [profilePic, setProfilePic] = useState(initialProfile?.profilePicture || null);
  const picInputRef = useRef(null);

  const [showVerif,      setShowVerif]      = useState(false);
  const [verifStep,      setVerifStep]      = useState(1);
  const [idImg,          setIdImg]          = useState(null);
  const [faceImg,        setFaceImg]        = useState(null);
  const [verified,       setVerified]       = useState(false);
  const [idCamActive,    setIdCamActive]    = useState(false);
  const [idScanStatus,   setIdScanStatus]   = useState('');
  const [idCamErr,       setIdCamErr]       = useState(null);
  const [faceCamActive,  setFaceCamActive]  = useState(false);
  const [faceScanStatus, setFaceScanStatus] = useState('');
  const [faceCamErr,     setFaceCamErr]     = useState(null);
  const [showDelete,     setShowDelete]     = useState(false);

  const idVideoRef   = useRef(null); const idCanvasRef   = useRef(null); const idStreamRef   = useRef(null);
  const faceVideoRef = useRef(null); const faceCanvasRef = useRef(null); const faceStreamRef = useRef(null);
  const idTOsRef     = useRef([]);   const faceTOsRef    = useRef([]);

  const stopId   = useCallback(()=>{ idStreamRef.current?.getTracks().forEach(t=>t.stop()); idStreamRef.current=null; idTOsRef.current.forEach(clearTimeout); idTOsRef.current=[]; setIdCamActive(false); setIdScanStatus(''); },[]);
  const stopFace = useCallback(()=>{ faceStreamRef.current?.getTracks().forEach(t=>t.stop()); faceStreamRef.current=null; faceTOsRef.current.forEach(clearTimeout); faceTOsRef.current=[]; setFaceCamActive(false); setFaceScanStatus(''); },[]);
  useEffect(()=>()=>{ stopId(); stopFace(); },[stopId,stopFace]);
  useEffect(()=>{ if(!showVerif){ stopId(); stopFace(); } },[showVerif,stopId,stopFace]);

  // ── Load profile ──
  // If App.jsx already passed initialProfile, skip the fetch entirely — instant load.
  // Only fetch if no initialProfile was provided (e.g. direct navigation).
  useEffect(()=>{
    if (initialProfile) return; // already have data, nothing to do
    fetchProfile(token).then(data=>{
      if (data) {
        setProfile(data);
        setProfilePic(data.profilePicture || null);
      }
    }).catch(err=>{ if(!err.message?.includes('404')) showAlert('Error loading profile','error'); });
  },[token]);

  const completion = (() => {
    const fs = [profile.firstName,profile.lastName,profile.gender,profile.dateOfBirth,profile.nationality,profile.contactNumber,profile.homeAddress,profile.idType,profile.idType==='PASSPORT'?profile.passportNumber:profile.idNumber,verified?'v':''];
    return Math.round(fs.filter(Boolean).length/fs.length*100);
  })();

  // ── Profile picture upload ──
  // Key fix: reset e.target.value AFTER the FileReader finishes, not before
  const handlePicUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showAlert('Image must be under 2MB', 'error');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setProfilePic(base64);
      setProfile(prev => ({ ...prev, profilePicture: base64 }));
      e.target.value = ''; // reset after read so same file can be picked again
    };
    reader.readAsDataURL(file);
  };

  // ── Save ──
  const save = async () => {
    setSaving(true);
    try {
      const savedProfile = await saveProfile(token, profile);
      showAlert('Profile saved!', 'success');
      setEditing(false);
      if (savedProfile) {
        setProfile(savedProfile);
        setProfilePic(savedProfile.profilePicture || null);
        // Notify App.jsx so Sidebar & Topbar update immediately
        onProfileSave?.(savedProfile);
      }
    } catch(err) {
      console.error('Save error:', err);
      showAlert(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const captureId = useCallback(()=>{
    const v=idVideoRef.current, c=idCanvasRef.current; if(!v||!c) return;
    c.width=v.videoWidth||640; c.height=v.videoHeight||480;
    c.getContext('2d').drawImage(v,0,0,c.width,c.height);
    const d=c.toDataURL('image/jpeg',.85); stopId(); setIdImg(d);
  },[stopId]);

  const captureFace = useCallback(()=>{
    const v=faceVideoRef.current, c=faceCanvasRef.current; if(!v||!c) return;
    c.width=v.videoWidth||640; c.height=v.videoHeight||480;
    c.getContext('2d').drawImage(v,0,0,c.width,c.height);
    const d=c.toDataURL('image/jpeg',.85); stopFace(); setFaceImg(d);
    setTimeout(()=>{ setVerified(true); setVerifStep(4); },1800);
  },[stopFace]);

  const openIdCam = useCallback(async()=>{
    setIdCamErr(null); stopId();
    if(!navigator.mediaDevices?.getUserMedia){ setIdCamErr('Camera not supported. Please upload a photo.'); return; }
    try{
      const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}}});
      idStreamRef.current=s; setIdCamActive(true);
      setTimeout(()=>{
        if(idVideoRef.current){ idVideoRef.current.srcObject=s; idVideoRef.current.play().catch(()=>{}); }
        ID_SCAN_STEPS.forEach(([d,m])=>{ idTOsRef.current.push(setTimeout(()=>setIdScanStatus(m),d)); });
        idTOsRef.current.push(setTimeout(captureId,ID_CAP_DELAY));
      },80);
    }catch(e){ setIdCamErr(e.name==='NotAllowedError'?'Camera permission denied.':'Camera unavailable. Please upload a photo.'); }
  },[stopId,captureId]);

  const openFaceCam = useCallback(async()=>{
    setFaceCamErr(null); stopFace();
    if(!navigator.mediaDevices?.getUserMedia){ setFaceCamErr('Camera not supported. Please upload a selfie.'); return; }
    try{
      const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'user'}}});
      faceStreamRef.current=s; setFaceCamActive(true);
      setTimeout(()=>{
        if(faceVideoRef.current){ faceVideoRef.current.srcObject=s; faceVideoRef.current.play().catch(()=>{}); }
        FACE_SCAN_STEPS.forEach(([d,m])=>{ faceTOsRef.current.push(setTimeout(()=>setFaceScanStatus(m),d)); });
        faceTOsRef.current.push(setTimeout(captureFace,FACE_CAP_DELAY));
      },80);
    }catch(e){ setFaceCamErr(e.name==='NotAllowedError'?'Camera permission denied.':'Camera unavailable. Please upload a selfie.'); }
  },[stopFace,captureFace]);

  const handleIdUpload = useCallback(e=>{
    const file=e.target.files[0]; if(!file) return; e.target.value='';
    const r=new FileReader(); r.onload=ev=>{ const d=ev.target.result; stopId(); setIdCamActive(true);
      setTimeout(()=>{ ID_SCAN_STEPS.forEach(([delay,msg])=>{ idTOsRef.current.push(setTimeout(()=>setIdScanStatus(msg),delay)); }); idTOsRef.current.push(setTimeout(()=>{ stopId(); setIdImg(d); },ID_CAP_DELAY)); },50); };
    r.readAsDataURL(file);
  },[stopId]);

  const handleFaceUpload = useCallback(e=>{
    const file=e.target.files[0]; if(!file) return; e.target.value='';
    const r=new FileReader(); r.onload=ev=>{ const d=ev.target.result; stopFace(); setFaceCamActive(true);
      setTimeout(()=>{ FACE_SCAN_STEPS.forEach(([delay,msg])=>{ faceTOsRef.current.push(setTimeout(()=>setFaceScanStatus(msg),delay)); }); faceTOsRef.current.push(setTimeout(()=>{ stopFace(); setFaceImg(d); setTimeout(()=>{ setVerified(true); setVerifStep(4); },1800); },FACE_CAP_DELAY)); },50); };
    r.readAsDataURL(file);
  },[stopFace]);

  const resetVerif = useCallback(()=>{ stopId(); stopFace(); setIdImg(null); setFaceImg(null); setIdCamErr(null); setFaceCamErr(null); setVerifStep(1); setVerified(false); },[stopId,stopFace]);
  const goStep = s=>{ if(s!==2) stopId(); if(s!==3) stopFace(); setVerifStep(s); };

  const fullName = [profile.firstName,profile.lastName].filter(Boolean).join(' ') || getUsername(user);
  const isPassport = profile.idType==='PASSPORT';

  const field = (key, label, type='text', required=false, placeholder='') => (
    <div className="pf-f">
      <label className="pf-lbl">{label}{required && <span className="req">*</span>}</label>
      {editing
        ? <input
            className="pf-input"
            type={type}
            value={profile[key] || ''}
            onChange={e => setProfile({ ...profile, [key]: e.target.value })}
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          />
        : <div className={`pf-view-val${!profile[key] ? ' empty' : ''}`}>
            {type==='date' && profile[key]
              ? new Date(profile[key]).toLocaleDateString()
              : profile[key] || 'Not provided'}
          </div>
      }
    </div>
  );

  const select = (key, label, opts, placeholder, required=false) => (
    <div className="pf-f">
      <label className="pf-lbl">{label}{required && <span className="req">*</span>}</label>
      {editing
        ? <select className="pf-select" value={profile[key]||''} onChange={e=>setProfile({...profile,[key]:e.target.value})}>
            <option value="">{placeholder}</option>
            {Object.entries(opts).map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </select>
        : <div className={`pf-view-val${!profile[key]?' empty':''}`}>{opts[profile[key]]||'Not provided'}</div>
      }
    </div>
  );

  return (
    <div className="pf-root">
      <style>{css}</style>
      <Alert alert={alert}/>

      <div className="pf-hd">
        <h1 className="pf-title">My Profile</h1>
        <p className="pf-sub">Manage your personal information and identity verification</p>
      </div>

      <div className="pf-grid">
        {/* ── Left column ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          <div className="pf-panel">
            <div className="pf-panel-body" style={{ textAlign:'center', paddingTop:'1.5rem' }}>

              {/*
                Hidden file input lives OUTSIDE the avatar div.
                This is critical — if it were inside, the browser may not
                open the picker when .click() is called programmatically.
              */}
              <input
                ref={picInputRef}
                type="file"
                accept="image/*"
                style={{ display:'none' }}
                onChange={handlePicUpload}
              />

              {/*
                Avatar — clickable only in edit mode.
                CSS rule `.pf-avatar * { pointer-events:none }` ensures
                the img, overlay div, and badge never swallow the click
                so it always bubbles up to this onClick handler.
              */}
              <div
                className={`pf-avatar${editing ? ' editable' : ''}`}
                onClick={() => editing && picInputRef.current?.click()}
                title={editing ? 'Click to change photo' : ''}
              >
                {profilePic
                  ? <img src={profilePic} alt="Profile" className="pf-avatar-img"/>
                  : <span>{getInitials(user)}</span>
                }
                {editing && <div className="pf-avatar-overlay">📷</div>}
                {verified && <div className="pf-avatar-badge">✓</div>}
              </div>

              {/* Hint only visible in edit mode */}
              {editing && (
                <div className="pf-avatar-hint">Click photo to change</div>
              )}

              <div className="pf-name">{fullName}</div>
              <div className="pf-email">{user?.email}</div>

              <div className="pf-comp">
                <div className="pf-comp-row">
                  <span className="pf-comp-lbl">Profile Completion</span>
                  <span className="pf-comp-pct">{completion}%</span>
                </div>
                <div className="pf-comp-track"><div className="pf-comp-fill" style={{ width:`${completion}%` }}/></div>
              </div>

              <div className="pf-divider"/>

              {[
                ['Username', getUsername(user)],
                ['Email',    user?.email],
                ['Role',     'Guest'],
                ['Status',   verified ? '✅ Verified' : '⏳ Pending'],
              ].map(([lbl,val])=>(
                <div key={lbl} className="pf-info-row">
                  <span className="pf-info-lbl">{lbl}</span>
                  <span className={`pf-info-val${val?.startsWith('✅') ? ' green' : ''}`}>{val||'—'}</span>
                </div>
              ))}

              {!verified
                ? <button className="pf-verify-btn" onClick={()=>{ resetVerif(); setShowVerif(true); }}>🔐 Verify Identity</button>
                : <div className="pf-verified-box">✅ Identity Verified</div>
              }
              <button className="pf-delete-btn" onClick={()=>setShowDelete(true)}>🗑 Delete Account</button>
            </div>
          </div>
        </div>

        {/* ── Right column — form ── */}
        <div className="pf-panel" style={{ animationDelay:'.07s' }}>
          <div className="pf-panel-hd">
            <div>
              <div className="pf-panel-title">Personal Information</div>
              <div className="pf-panel-sub">{editing ? 'Editing — save when done' : 'View your details'}</div>
            </div>
            <div style={{ display:'flex', gap:'.4rem' }}>
              {editing
                ? <button className="pf-cancel-btn" onClick={()=>{
                    setEditing(false);
                    // Revert unsaved picture preview on cancel
                    setProfilePic(profile.profilePicture || null);
                  }}>Cancel</button>
                : <button className="pf-edit-btn" onClick={()=>setEditing(true)}>✏️ Edit</button>
              }
            </div>
          </div>
          <div className="pf-panel-body">

            <div className="pf-section">Basic Information</div>
            <div className="pf-fg">
              {field('firstName','First Name','text',true)}
              {field('lastName','Last Name','text',true)}
            </div>
            <div className="pf-fg">
              {field('dateOfBirth','Date of Birth','date',true)}
              {field('nationality','Nationality','text',true)}
            </div>
            <div className="pf-fg" style={{ marginBottom:'.9rem' }}>
              {field('contactNumber','Contact Number','tel',true)}
              {select('gender','Gender',GENDER_LABELS,'Select gender',true)}
            </div>

            <div className="pf-section">Address</div>
            <div className="pf-f" style={{ marginBottom:'.9rem' }}>
              <label className="pf-lbl">Home Address <span className="req">*</span></label>
              {editing
                ? <textarea className="pf-textarea" value={profile.homeAddress||''} onChange={e=>setProfile({...profile,homeAddress:e.target.value})} placeholder="Enter full address" rows={3}/>
                : <div className={`pf-view-val${!profile.homeAddress?' empty':''}`} style={{ alignItems:'flex-start', paddingTop:'.62rem', minHeight:70 }}>{profile.homeAddress||'Not provided'}</div>
              }
            </div>

            <div className="pf-section">Identity Documents</div>
            <div className="pf-fg" style={{ marginBottom:'.9rem' }}>
              {select('idType','ID Type',ID_TYPE_LABELS,'Select ID type',true)}
              {!isPassport
                ? field('idNumber','ID Number','text',true)
                : field('passportNumber','Passport Number','text',true)
              }
            </div>
            {isPassport && (
              <div className="pf-fg" style={{ marginBottom:'.9rem' }}>
                {select('visaType','Visa Type',VISA_LABELS,'Select visa type')}
                {field('visaExpiryDate','Visa Expiry','date')}
              </div>
            )}

            {editing && (
              <button className="pf-save-btn" disabled={saving} onClick={save}>
                {saving ? <><div className="pf-spin"/>Saving…</> : <>💾 Save Changes</>}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Verification Modal ── */}
      <Modal show={showVerif} onHide={()=>{ stopId(); stopFace(); setShowVerif(false); }} size="lg" centered className="pf-modal">
        <Modal.Header closeButton><Modal.Title>🔐 Identity Verification</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="vrf-steps">
            {[1,2,3,4].map(s=>{
              const st = verifStep>s?'done':verifStep===s?'active':'idle';
              return (
                <div key={s} style={{ display:'flex', alignItems:'center' }}>
                  <div className={`vrf-dot ${st}`} style={{ cursor:verifStep>s?'pointer':'default' }} onClick={()=>verifStep>s&&goStep(s)}>
                    {st==='done'?'✓':s}
                  </div>
                  {s<4&&<div className="vrf-line" style={{ background:verifStep>s?'rgba(45,155,111,0.4)':'#e2e8f0' }}/>}
                </div>
              );
            })}
          </div>
          <div className="vrf-labels">
            {['ID Type','Scan ID','Selfie','Done'].map((l,i)=>(
              <span key={i} className={`vrf-lbl${verifStep===i+1?' active':''}`}>{l}</span>
            ))}
          </div>

          {verifStep===1&&(
            <div style={{ textAlign:'center', paddingBottom:'1rem' }}>
              <div style={{ fontSize:'2.8rem', marginBottom:'.55rem' }}>🪪</div>
              <div className="vrf-heading">Choose ID Type</div>
              <p className="vrf-desc">Select the government-issued ID you'll use for verification.</p>
              <select className="pf-select" style={{ maxWidth:280, margin:'0 auto .9rem', display:'block' }} value={profile.idType||''} onChange={e=>setProfile({...profile,idType:e.target.value})}>
                <option value="">Choose ID type…</option>
                {Object.entries(ID_TYPE_LABELS).map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
              <button className="vrf-next-btn" disabled={!profile.idType} onClick={()=>goStep(2)}>Start Verification →</button>
            </div>
          )}
          {verifStep===2&&(
            <div>
              <div className="vrf-heading">Scan Your {ID_TYPE_LABELS[profile.idType]||'ID'}</div>
              <p className="vrf-desc">Position clearly in good lighting. Scanner captures automatically.</p>
              <ScanView type="id" videoRef={idVideoRef} canvasRef={idCanvasRef} active={idCamActive} scanStatus={idScanStatus} captured={idImg} camErr={idCamErr} onCamera={openIdCam} onUpload={handleIdUpload} onRetake={()=>{ stopId(); setIdImg(null); setIdCamErr(null); }}/>
              {idImg&&<button className="vrf-next-btn" onClick={()=>goStep(3)}>Next: Take Selfie →</button>}
            </div>
          )}
          {verifStep===3&&(
            <div>
              <div className="vrf-heading">Take a Selfie</div>
              <p className="vrf-desc">Look directly at camera. We'll automatically match with your ID.</p>
              <ScanView type="face" videoRef={faceVideoRef} canvasRef={faceCanvasRef} active={faceCamActive} scanStatus={faceScanStatus} captured={faceImg} camErr={faceCamErr} onCamera={openFaceCam} onUpload={handleFaceUpload} onRetake={()=>{ stopFace(); setFaceImg(null); setFaceCamErr(null); }}/>
              {faceImg&&!verified&&<p style={{ textAlign:'center', color:'var(--text-muted)', fontSize:'.76rem', marginTop:'.65rem' }}>⏳ Verifying…</p>}
            </div>
          )}
          {verifStep===4&&(
            <div style={{ textAlign:'center', paddingBottom:'1rem' }}>
              <div style={{ fontSize:'3rem', marginBottom:'.55rem', animation:'checkPop .5s both' }}>✅</div>
              <div className="vrf-heading">Identity Verified!</div>
              <p className="vrf-desc">Profile completion is now <strong style={{ color:'var(--gold-dark)' }}>{completion}%</strong>.</p>
              <div className="vrf-thumbs">
                {idImg&&<div><img src={idImg} alt="ID" className="vrf-thumb-id"/><div className="vrf-thumb-lbl">{ID_TYPE_LABELS[profile.idType]} ✓</div></div>}
                {faceImg&&<div><img src={faceImg} alt="Face" className="vrf-thumb-face"/><div className="vrf-thumb-lbl">Face matched ✓</div></div>}
              </div>
              {verified&&completion===100&&<div className="vrf-success-box">🎉 Profile 100% complete!</div>}
              <button className="vrf-next-btn" style={{ maxWidth:150 }} onClick={()=>setShowVerif(false)}>Done ✓</button>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* ── Delete Modal ── */}
      <Modal show={showDelete} onHide={()=>setShowDelete(false)} centered className="del-modal">
        <Modal.Header closeButton><Modal.Title>Delete Account</Modal.Title></Modal.Header>
        <Modal.Body>
          <div style={{ textAlign:'center', padding:'.5rem 0 .5rem' }}>
            <div style={{ fontSize:'2.2rem', marginBottom:'.55rem' }}>⚠️</div>
            <p style={{ color:'var(--text-sub)', fontSize:'.84rem', lineHeight:1.65 }}>
              Are you sure you want to delete your account?<br/>
              <strong style={{ color:'var(--red)' }}>This action cannot be undone.</strong>
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ justifyContent:'flex-end', gap:'.45rem' }}>
          <button className="del-no" onClick={()=>setShowDelete(false)}>Cancel</button>
          <button className="del-ok" onClick={async()=>{
            try{ await deleteProfile(token); showAlert('Account deleted','success'); }
            catch(err){ showAlert(err.message||'Failed','error'); }
            setShowDelete(false);
          }}>🗑 Delete Account</button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}