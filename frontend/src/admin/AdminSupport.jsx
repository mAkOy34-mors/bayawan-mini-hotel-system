// AdminSupport.jsx
import { useState, useEffect, useCallback } from 'react';
import { Modal } from 'react-bootstrap';
import { adminGetAllTickets, adminReplyTicket, adminSetTicketStatus } from './adminApi';
import { SHARED_CSS, fmtDT, Pill, Spinner, Pager, Toast, useToast } from './adminShared';

const PAGE_SIZE = 10;
const STATUS_OPTS = ['', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const PRIORITY_COLORS = { HIGH: '#dc3545', MEDIUM: '#f59e0b', LOW: '#64748b' };

export function AdminSupport({ token }) {
  const [tickets,  setTickets]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('');
  const [page,     setPage]     = useState(1);
  const [detail,   setDetail]   = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [reply,    setReply]    = useState('');
  const [sending,  setSending]  = useState(false);
  const [newStatus,setNewStatus]= useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { toast, show } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const data = await adminGetAllTickets(token, filter).catch(() => []);
    setTickets(Array.isArray(data) ? data : []);
    setPage(1);
    setLoading(false);
  }, [token, filter]);

  useEffect(() => { load(); }, [load]);

  const openDetail = (t) => {
    setDetail(t); setNewStatus(t.status); setReply(''); setShowDetail(true);
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await adminReplyTicket(token, detail.id, reply.trim());
      show('Reply sent');
      // Optimistically add reply
      const newReply = { id: Date.now(), message: reply.trim(), isStaff: true, authorEmail: 'admin', createdAt: new Date().toISOString() };
      const updated = { ...detail, replies: [...(detail.replies || []), newReply], status: detail.status === 'OPEN' ? 'IN_PROGRESS' : detail.status };
      setDetail(updated);
      setTickets(prev => prev.map(t => t.id === detail.id ? { ...t, status: updated.status } : t));
      setReply('');
    } catch (e) { show(e.message, 'error'); }
    finally { setSending(false); }
  };

  const applyStatus = async () => {
    if (newStatus === detail.status) return;
    setUpdatingStatus(true);
    try {
      await adminSetTicketStatus(token, detail.id, newStatus);
      show(`Status updated to ${newStatus}`);
      const updated = { ...detail, status: newStatus };
      setDetail(updated);
      setTickets(prev => prev.map(t => t.id === detail.id ? { ...t, status: newStatus } : t));
    } catch (e) { show(e.message, 'error'); }
    finally { setUpdatingStatus(false); }
  };

  const counts = {
    OPEN:        tickets.filter(t => t.status === 'OPEN').length,
    IN_PROGRESS: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    RESOLVED:    tickets.filter(t => t.status === 'RESOLVED').length,
    CLOSED:      tickets.filter(t => t.status === 'CLOSED').length,
  };

  const visible = tickets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="ap-root">
      <style>{SHARED_CSS}</style>
      <Toast toast={toast} />

      <div className="ap-hd">
        <div><h1 className="ap-title">Support</h1><p className="ap-sub">Manage guest support tickets</p></div>
      </div>

      {/* Stats */}
      <div className="ap-stats">
        {[
          { icon: '📋', label: 'Total',       value: tickets.length,    color: 'blue'   },
          { icon: '🔓', label: 'Open',        value: counts.OPEN,       color: 'orange' },
          { icon: '🔄', label: 'In Progress', value: counts.IN_PROGRESS,color: 'teal'   },
          { icon: '✅', label: 'Resolved',    value: counts.RESOLVED,   color: 'green'  },
        ].map((s, i) => (
          <div key={i} className={`ap-stat ${s.color}`} style={{ animationDelay: `${i * 0.06}s` }}>
            <span className="ap-stat-icon">{s.icon}</span>
            <div className="ap-stat-lbl">{s.label}</div>
            <div className="ap-stat-val">{loading ? '—' : s.value}</div>
          </div>
        ))}
      </div>

      {/* Open tickets alert */}
      {!loading && counts.OPEN > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem', padding: '.9rem 1.15rem', borderRadius: 12, marginBottom: '1.25rem', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', animation: 'fadeUp .4s both' }}>
          <span style={{ fontSize: '1.1rem' }}>💬</span>
          <div style={{ flex: 1, fontSize: '.83rem', color: '#92400e', fontWeight: 600 }}>
            {counts.OPEN} open ticket{counts.OPEN > 1 ? 's' : ''} awaiting response
          </div>
          <button className="ap-btn-ghost" style={{ fontSize: '.76rem', padding: '.3rem .75rem' }} onClick={() => setFilter('OPEN')}>
            View Open →
          </button>
        </div>
      )}

      <div className="ap-panel">
        <div className="ap-panel-hd">
          <div>
            <div className="ap-panel-title">All Tickets</div>
            <div className="ap-panel-sub">{!loading && `${tickets.length} records`}</div>
          </div>
          {/* Status filter chips */}
          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
            {STATUS_OPTS.map(s => (
              <button key={s || 'all'} onClick={() => setFilter(s)}
                style={{
                  padding: '.32rem .78rem', borderRadius: 99,
                  fontFamily: "'DM Sans',sans-serif", fontSize: '.72rem', fontWeight: 600,
                  cursor: 'pointer', transition: 'all .15s', border: '1px solid var(--border)',
                  background: filter === s ? 'linear-gradient(135deg,#9a7a2e,#C9A84C)' : '#fff',
                  color: filter === s ? '#fff' : 'var(--text-muted)',
                }}>
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>

        {loading
          ? <div style={{ padding: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.65rem' }}>
              <Spinner /><span style={{ color: 'var(--text-muted)', fontSize: '.78rem' }}>Loading tickets…</span>
            </div>
          : tickets.length === 0
            ? <div className="ap-empty"><div className="ap-empty-ico">💬</div><div className="ap-empty-title">No tickets found</div></div>
            : <>
                <div style={{ overflowX: 'auto' }}>
                  <table className="ap-tbl">
                    <thead>
                      <tr><th>#</th><th>Subject</th><th>From</th><th>Priority</th><th>Status</th><th>Replies</th><th>Date</th><th></th></tr>
                    </thead>
                    <tbody>
                      {visible.map(t => (
                        <tr key={t.id}>
                          <td style={{ color: 'var(--text-muted)', fontSize: '.75rem', fontFamily: 'monospace' }}>#{t.id}</td>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '.83rem', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: '.8rem', color: 'var(--text-sub)' }}>{t.name || '—'}</div>
                            <div style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>{t.email}</div>
                          </td>
                          <td>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.28rem', fontSize: '.72rem', fontWeight: 700, color: PRIORITY_COLORS[t.priority] || 'var(--text-muted)' }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIORITY_COLORS[t.priority] || 'var(--text-muted)' }} />
                              {t.priority}
                            </span>
                          </td>
                          <td><Pill status={t.status} /></td>
                          <td>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.28rem', fontSize: '.75rem', color: 'var(--text-muted)' }}>
                              💬 {t.replies?.length || 0}
                            </span>
                          </td>
                          <td style={{ fontSize: '.74rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDT(t.createdAt)}</td>
                          <td>
                            <button className="ap-btn-ghost" style={{ fontSize: '.72rem', padding: '.28rem .65rem' }} onClick={() => openDetail(t)}>
                              Open
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pager page={page} total={tickets.length} size={PAGE_SIZE} setPage={setPage} />
              </>
        }
      </div>

      {/* Ticket Detail / Reply Modal */}
      <Modal show={showDetail} onHide={() => setShowDetail(false)} size="lg" centered className="ap-modal">
        <Modal.Header closeButton>
          <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
            <span>Ticket #{detail?.id}</span>
            {detail && <Pill status={detail.status} />}
            {detail && (
              <span style={{ fontSize: '.72rem', fontWeight: 700, color: PRIORITY_COLORS[detail.priority], display: 'flex', alignItems: 'center', gap: '.25rem' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIORITY_COLORS[detail.priority] }} />
                {detail.priority}
              </span>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0 }}>
          {detail && <>
            {/* Ticket info header */}
            <div style={{ padding: '1.1rem 1.45rem', background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--text)', marginBottom: '.35rem' }}>{detail.subject}</div>
              <div style={{ fontSize: '.77rem', color: 'var(--text-muted)' }}>
                From: <strong style={{ color: 'var(--text-sub)' }}>{detail.name || detail.email}</strong> · {detail.email} · {fmtDT(detail.createdAt)}
              </div>
            </div>

            {/* Conversation thread */}
            <div style={{ maxHeight: 380, overflowY: 'auto', padding: '1.1rem 1.45rem', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {/* Original message */}
              <div style={{ display: 'flex', gap: '.75rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--blue-bg)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.85rem', flexShrink: 0 }}>👤</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.3rem' }}>
                    <span style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--text)' }}>{detail.name || detail.email}</span>
                    <span style={{ fontSize: '.68rem', color: 'var(--text-muted)' }}>{fmtDT(detail.createdAt)}</span>
                  </div>
                  <div style={{ background: '#f8f9fb', border: '1px solid var(--border)', borderRadius: '0 10px 10px 10px', padding: '.75rem 1rem', fontSize: '.83rem', color: 'var(--text-sub)', lineHeight: 1.6 }}>
                    {detail.message}
                  </div>
                </div>
              </div>

              {/* Replies */}
              {(detail.replies || []).map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: '.75rem', flexDirection: r.isStaff ? 'row-reverse' : 'row' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: r.isStaff ? 'linear-gradient(135deg,#9a7a2e,#C9A84C)' : 'var(--blue-bg)', border: r.isStaff ? 'none' : '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.85rem', flexShrink: 0 }}>
                    {r.isStaff ? '⚙️' : '👤'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.3rem', justifyContent: r.isStaff ? 'flex-end' : 'flex-start' }}>
                      <span style={{ fontSize: '.78rem', fontWeight: 700, color: r.isStaff ? 'var(--gold-dark)' : 'var(--text)' }}>{r.isStaff ? '⚙ Admin' : r.authorEmail}</span>
                      <span style={{ fontSize: '.68rem', color: 'var(--text-muted)' }}>{fmtDT(r.createdAt)}</span>
                    </div>
                    <div style={{ background: r.isStaff ? 'rgba(201,168,76,0.08)' : '#f8f9fb', border: `1px solid ${r.isStaff ? 'rgba(201,168,76,0.25)' : 'var(--border)'}`, borderRadius: r.isStaff ? '10px 0 10px 10px' : '0 10px 10px 10px', padding: '.75rem 1rem', fontSize: '.83rem', color: 'var(--text-sub)', lineHeight: 1.6 }}>
                      {r.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply input */}
            <div style={{ padding: '1rem 1.45rem', borderTop: '1px solid var(--border)', background: 'var(--surface2)' }}>
              <div style={{ fontWeight: 600, fontSize: '.78rem', color: 'var(--text-sub)', marginBottom: '.55rem' }}>Reply as Admin</div>
              <textarea
                className="ap-ta"
                rows={3}
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Type your reply…"
                style={{ marginBottom: '.65rem', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                {/* Status changer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem' }}>
                  <span style={{ fontSize: '.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status:</span>
                  <select className="ap-sel" value={newStatus} onChange={e => setNewStatus(e.target.value)} style={{ padding: '.38rem .7rem', fontSize: '.76rem' }}>
                    {STATUS_OPTS.filter(Boolean).map(s => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                  {newStatus !== detail.status && (
                    <button className="ap-btn-ghost" style={{ fontSize: '.74rem', padding: '.32rem .7rem' }} disabled={updatingStatus} onClick={applyStatus}>
                      {updatingStatus ? '…' : '✓ Apply'}
                    </button>
                  )}
                </div>
                <button className="ap-btn-primary" disabled={sending || !reply.trim()} onClick={sendReply} style={{ minWidth: 110 }}>
                  {sending ? <><div className="ap-spin-sm" />Sending…</> : '📤 Send Reply'}
                </button>
              </div>
            </div>
          </>}
        </Modal.Body>
      </Modal>
    </div>
  );
}
