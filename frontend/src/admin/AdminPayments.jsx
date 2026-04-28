// AdminPayments.jsx
import { useState, useEffect, useCallback } from 'react';
import { Modal } from 'react-bootstrap';
import { adminGetPayments, adminGetPayment, adminVerifyPayment } from './adminApi';
import { DollarSign, CheckCircle2, Clock, XCircle, Search, RefreshCw } from 'lucide-react';
import { SHARED_CSS, fmt, fmtDate, fmtDT, Pill, Skel, Spinner, Pager, Toast, useToast } from './adminShared';

const PAGE_SIZE = 12;
const STATUS_OPTS = ['', 'PAID', 'PENDING', 'FAILED', 'REFUNDED'];
const TYPE_ICONS = { DEPOSIT: '💎', FULL_PAYMENT: '💳', REFUND: '↩️', MANUAL: '🖊' };

export function AdminPayments({ token }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const { toast, show } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const params = filter ? `status=${filter}` : '';
    const data = await adminGetPayments(token, params).catch(() => []);
    setPayments(Array.isArray(data) ? data : []);
    setPage(1);
    setLoading(false);
  }, [token, filter]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id) => {
    setDetailLoading(true);
    setShowDetail(true);
    setDetail(null);
    const d = await adminGetPayment(token, id).catch(() => null);
    setDetail(d);
    setDetailLoading(false);
  };

  const verify = async (id) => {
    setVerifying(true);
    try {
      const r = await adminVerifyPayment(token, id);
      show(r.message);
      setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'PAID' } : p));
      if (detail?.id === id) setDetail(d => ({ ...d, status: 'PAID' }));
    } catch (e) {
      show(e.message, 'error');
    } finally {
      setVerifying(false);
    }
  };

  // Calculate payment statistics with refund handling
  const paidPayments = payments.filter(p => p.status === 'PAID' && p.type !== 'REFUND');
  const pendingPayments = payments.filter(p => p.status === 'PENDING' && p.type !== 'REFUND');
  const failedPayments = payments.filter(p => p.status === 'FAILED');
  const refundPayments = payments.filter(p => p.type === 'REFUND' && p.status === 'REFUNDED');

  const totalPaidAmount = paidPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const totalRefundedAmount = refundPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const netTotal = totalPaidAmount - totalRefundedAmount;

  const visible = payments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const isRefund = (p) => p.type === 'REFUND';

  return (
    <div className="ap-root">
      <style>{SHARED_CSS}</style>
      <Toast toast={toast} />

      <div className="ap-hd">
        <div>
          <h1 className="ap-title">Payments</h1>
          <p className="ap-sub">Monitor and verify all transactions</p>
        </div>
      </div>

      {/* Stats */}
      <div className="ap-stats">
        {[
          { Icon: DollarSign, label: 'Net Revenue', value: fmt(netTotal), color: 'green' },
          { Icon: CheckCircle2, label: 'Paid', value: paidPayments.length, color: 'blue' },
          { Icon: Clock, label: 'Pending', value: pendingPayments.length, color: 'orange' },
          { Icon: XCircle, label: 'Refunded', value: refundPayments.length, color: 'red' },
        ].map((s, i) => (
          <div key={i} className={`ap-stat ${s.color}`} style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="ap-stat-icon" style={{ background: 'rgba(255,255,255,.15)', borderRadius: 9 }}>
              <s.Icon size={16} />
            </div>
            <div className="ap-stat-lbl">{s.label}</div>
            <div className="ap-stat-val">{loading ? <Skel h={24} w="55%" /> : s.value}</div>
          </div>
        ))}
      </div>

      {/* Pending alert banner */}
      {!loading && pendingPayments.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '.85rem', padding: '.9rem 1.15rem',
          borderRadius: 12, marginBottom: '1.25rem', background: 'rgba(245,158,11,0.07)',
          border: '1px solid rgba(245,158,11,0.25)', animation: 'fadeUp .4s both'
        }}>
          <span style={{ fontSize: '1.1rem' }}>⏳</span>
          <div style={{ flex: 1, fontSize: '.83rem', color: '#92400e', fontWeight: 600 }}>
            {pendingPayments.length} payment{pendingPayments.length > 1 ? 's' : ''} awaiting manual verification
          </div>
          <button className="ap-btn-ghost" style={{ fontSize: '.76rem', padding: '.3rem .75rem' }} onClick={() => setFilter('PENDING')}>
            View Pending →
          </button>
        </div>
      )}

      <div className="ap-panel">
        <div className="ap-panel-hd">
          <div>
            <div className="ap-panel-title">All Transactions</div>
            <div className="ap-panel-sub">{!loading && `${payments.length} records`}</div>
          </div>
          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
            {STATUS_OPTS.map(s => (
              <button
                key={s || 'all'}
                onClick={() => { setFilter(s); }}
                style={{
                  padding: '.32rem .78rem', borderRadius: 99, fontFamily: "'DM Sans',sans-serif",
                  fontSize: '.72rem', fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
                  background: filter === s ? 'linear-gradient(135deg,#9a7a2e,#C9A84C)' : '#fff',
                  color: filter === s ? '#fff' : 'var(--text-muted)',
                  border: filter === s ? 'none' : '1px solid var(--border)',
                }}>
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.65rem' }}>
            <Spinner />
            <span style={{ color: 'var(--text-muted)', fontSize: '.78rem' }}>Loading payments…</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="ap-empty">
            <div className="ap-empty-ico">💳</div>
            <div className="ap-empty-title">No payments found</div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="ap-tbl">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Description</th>
                    <th>Email</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Paid At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(p => {
                    const refund = isRefund(p);
                    return (
                      <tr key={p.id}>
                        <td><span style={{ fontFamily: 'monospace', fontSize: '.75rem', color: 'var(--text-muted)' }}>#{p.id}</span></td>
                        <td style={{ maxWidth: 180 }}>
                          <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.description || '—'}
                          </div>
                          {p.bookingId && <div style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>Booking #{p.bookingId}</div>}
                        </td>
                        <td style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>{p.email}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                            <span>{TYPE_ICONS[p.type] || '💳'}</span>
                            <span style={{ fontSize: '.75rem', color: 'var(--text-sub)' }}>{refund ? 'REFUND' : (p.type?.replace('_', ' ') || '—')}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: refund ? 'var(--red)' : 'var(--text)', whiteSpace: 'nowrap' }}>
                            {refund ? '-' : ''}{fmt(p.amount)}
                          </span>
                        </td>
                        <td>
                          {refund ? (
                            <Pill status="REFUNDED" label="REFUNDED" />
                          ) : (
                            <Pill status={p.status} />
                          )}
                        </td>
                        <td style={{ fontSize: '.74rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(p.createdAt)}</td>
                        <td style={{ fontSize: '.74rem', color: p.paidAt ? 'var(--green)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {p.paidAt ? fmtDate(p.paidAt) : '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '.35rem' }}>
                            <button className="ap-btn-ghost" style={{ fontSize: '.72rem', padding: '.28rem .6rem' }} onClick={() => openDetail(p.id)}>
                              View
                            </button>
                            {p.status === 'PENDING' && !refund && (
                              <button className="ap-btn-green" style={{ fontSize: '.72rem', padding: '.28rem .6rem' }} onClick={() => verify(p.id)}>
                                ✓ Verify
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pager page={page} total={payments.length} size={PAGE_SIZE} setPage={setPage} />
          </>
        )}
      </div>

      {/* Detail Modal */}
      <Modal show={showDetail} onHide={() => setShowDetail(false)} size="md" centered className="ap-modal">
        <Modal.Header closeButton>
          <Modal.Title>Payment Detail</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.65rem' }}>
              <Spinner />
            </div>
          ) : !detail ? null : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.9rem 1rem', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '.64rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', fontWeight: 700 }}>Amount</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.85rem', fontWeight: 600, color: detail.type === 'REFUND' ? 'var(--red)' : 'var(--text)' }}>
                    {detail.type === 'REFUND' ? '-' : ''}{fmt(detail.amount)}
                  </div>
                </div>
                <Pill status={detail.status} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.65rem', marginBottom: '1rem' }}>
                {[
                  ['ID', `#${detail.id}`],
                  ['Type', detail.type === 'REFUND' ? 'REFUND' : (detail.type?.replace('_', ' ') || '—')],
                  ['Email', detail.email],
                  ['Booking', detail.bookingId ? `#${detail.bookingId}` : '—'],
                  ['Created', fmtDT(detail.createdAt)],
                  ['Paid At', detail.paidAt ? fmtDT(detail.paidAt) : 'Not yet paid'],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '.62rem .85rem', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '.63rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '.2rem' }}>{k}</div>
                    <div style={{ fontSize: '.83rem', color: 'var(--text)', fontWeight: 500, wordBreak: 'break-all' }}>{v || '—'}</div>
                  </div>
                ))}
              </div>
              {detail.description && (
                <div style={{ padding: '.75rem 1rem', background: '#fffbf0', border: '1px solid rgba(201,168,76,0.22)', borderRadius: 8, marginBottom: '1rem', fontSize: '.83rem', color: 'var(--text-sub)' }}>
                  <div style={{ fontSize: '.63rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--gold-dark)', fontWeight: 700, marginBottom: '.28rem' }}>Description</div>
                  {detail.description}
                </div>
              )}
              {detail.checkoutUrl && detail.type !== 'REFUND' && (
                <div style={{ padding: '.65rem 1rem', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, marginBottom: '1rem' }}>
                  <div style={{ fontSize: '.63rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '.28rem' }}>Checkout URL</div>
                  <a href={detail.checkoutUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '.75rem', color: 'var(--blue)', wordBreak: 'break-all' }}>{detail.checkoutUrl}</a>
                </div>
              )}
              {detail.status === 'PENDING' && detail.type !== 'REFUND' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="ap-btn-green" disabled={verifying} onClick={() => verify(detail.id)}>
                    {verifying ? <><div className="ap-spin-sm" />Verifying…</> : '✓ Mark as Paid'}
                  </button>
                </div>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}