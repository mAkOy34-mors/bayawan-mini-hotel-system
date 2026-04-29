// pages/ServiceCheckoutPayment.jsx
import { useState, useEffect } from 'react';
import { API_BASE } from '../constants/config';
import { CreditCard, Banknote, Smartphone, Hotel, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next'

export function ServiceCheckoutPayment({ token, onClose }) {
  const { t } = useTranslation()
  const [unpaidServices, setUnpaidServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('ROOM_CHARGE');
  const [processing, setProcessing] = useState(false);
  const [paid, setPaid] = useState(false);

  const loadUnpaidServices = async () => {
    try {
      const response = await fetch(`${API_BASE}/services/guest/`, {
        headers: { Authorization: t('bearerToken', 'Bearer {{token}}', { token }) }
      });
      if (response.ok) {
        const services = await response.json();
        const unpaid = services.filter(s => !s.is_paid && s.status === 'COMPLETED');
        setUnpaidServices(unpaid);
      }
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (unpaidServices.length === 0) return;
    setProcessing(true);
    try {
      const response = await fetch(`${API_BASE}/services/payment/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: t('bearerToken', 'Bearer {{token}}', { token })
        },
        body: JSON.stringify({
          service_ids: unpaidServices.map(s => s.id),
          payment_method: paymentMethod
        })
      });
      if (response.ok) {
        const data = await response.json();
        setPaid(true);
        setTimeout(() => onClose?.(), 2000);
      }
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    loadUnpaidServices();
  }, [token]);

  const totalAmount = unpaidServices.reduce((sum, s) => sum + s.service_charge, 0);

  return (
    <div style={{ padding: '1rem' }}>
      <h3>{t('serviceCharges', 'Service Charges')}</h3>
      
      {loading ? (
        <div>Loading...</div>
      ) : unpaidServices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <CheckCircle2 size={48} color="#10b981" />
          <p>{t('noOutstandingServiceCharges', 'No outstanding service charges')}</p>
        </div>
      ) : paid ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <CheckCircle2 size={48} color="#10b981" />
          <p>{t('paymentSuccessful', 'Payment successful!')}</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '1rem' }}>
            {unpaidServices.map(service => (
              <div key={service.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #e2e8f0' }}>
                <span>{t('service_type_labelRoomRoom_number', '{{service_type_label}} - Room {{room_number}}', { service_type_label: service.service_type_label, room_number: service.room_number })}</span>
                <span>{t('service_charge', '₱{{service_charge}}', { service_charge: service.service_charge })}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '2px solid #e2e8f0' }}>
              <span>{t('total', 'Total')}</span>
              <span>{t('totalamount', '₱{{totalAmount}}', { totalAmount })}</span>
            </div>
          </div>

          <div className="ap-field" style={{ marginBottom: '1rem' }}>
            <label className="ap-label">{t('paymentMethod', 'Payment Method')}</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {[
                { value: 'ROOM_CHARGE', label: t('roomCharge', 'Room Charge'), icon: <Hotel size={16} /> },
                { value: 'CASH', label: t('cash', 'Cash'), icon: <Banknote size={16} /> },
                { value: 'CARD', label: t('creditCard', 'Credit Card'), icon: <CreditCard size={16} /> },
                { value: 'GCASH', label: t('gcash', 'GCash'), icon: <Smartphone size={16} /> },
              ].map(method => (
                <button
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value)}
                  style={{
                    padding: '0.75rem',
                    border: `2px solid ${paymentMethod === method.value ? '#C9A84C' : '#e2e8f0'}`,
                    borderRadius: 8,
                    background: paymentMethod === method.value ? 'rgba(201,168,76,0.1)' : '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {method.icon} {method.label}
                </button>
              ))}
            </div>
          </div>

          <button
            className="ap-btn-primary"
            style={{ width: '100%' }}
            disabled={processing}
            onClick={handlePayment}
          >
            {processing ? <div className="ap-spin-sm" /> : t('payTotalamount', 'Pay ₱{{totalAmount}}', { totalAmount })}
          </button>
        </>
      )}
    </div>
  );
}