// pages/GuestPartnerServices.jsx
import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { Alert } from '../components/ui/Alert';
import { useAlert } from '../hooks/useAlert';
import { API_BASE } from '../constants/config';
import {
  Scissors, Sparkles, Heart, Map, Car, UtensilsCrossed,
  Camera, Mountain, ShoppingBag, MoreHorizontal,
  Phone, Mail, Globe, MapPin, Clock, Star, Send,
  ChevronRight, ChevronLeft, Users, CalendarDays,
  CheckCircle2, X, ExternalLink, Building2, Percent,
  AlertCircle, CreditCard, Banknote, Smartphone, ShieldCheck 
} from 'lucide-react';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  .gps-root {
    min-height: 100vh;
    background: var(--bg);
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
    -webkit-font-smoothing: antialiased;
    padding: 2rem 2.25rem;
  }
  @media (max-width: 768px) { .gps-root { padding: 1.25rem 1rem; } }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .gps-header {
    margin-bottom: 1.75rem;
    animation: fadeUp .4s cubic-bezier(.22,1,.36,1) both;
  }
  .gps-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2rem;
    font-weight: 600;
    color: var(--text);
    margin: 0 0 .2rem;
  }
  .gps-sub { font-size: .82rem; color: var(--text-muted); }

  /* Category tabs */
  .cat-tabs {
    display: flex;
    gap: .5rem;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
    animation: fadeUp .42s cubic-bezier(.22,1,.36,1) both;
  }
  .cat-tab {
    padding: .42rem .9rem;
    border-radius: 999px;
    border: 1.5px solid var(--border);
    background: var(--surface);
    font-size: .75rem;
    font-weight: 600;
    color: var(--text-muted);
    cursor: pointer;
    transition: all .18s;
    display: flex;
    align-items: center;
    gap: .3rem;
    font-family: 'DM Sans', sans-serif;
  }
  .cat-tab:hover { border-color: var(--gold); color: var(--gold-dark); }
  .cat-tab.active {
    border-color: var(--gold);
    background: var(--gold-bg);
    color: var(--gold-dark);
  }
  .cat-tab .count {
    background: rgba(0,0,0,.07);
    border-radius: 999px;
    padding: .05rem .38rem;
    font-size: .65rem;
  }
  .cat-tab.active .count { background: rgba(201,168,76,.18); }

  /* Partner cards grid */
  .partners-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.1rem;
    margin-bottom: 2rem;
  }
  @media (max-width: 900px) { .partners-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 560px) { .partners-grid { grid-template-columns: 1fr; } }

  .partner-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    cursor: pointer;
    transition: all .22s cubic-bezier(.22,1,.36,1);
    animation: fadeUp .45s cubic-bezier(.22,1,.36,1) both;
    position: relative;
  }
  .partner-card:hover {
    border-color: var(--gold);
    transform: translateY(-3px);
    box-shadow: 0 8px 28px rgba(0,0,0,.1);
  }
  .partner-card-cover {
    height: 100px;
    background: linear-gradient(135deg, #c9a84c22, #9a7a2e33);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }
  .partner-cat-icon {
    width: 52px; height: 52px;
    border-radius: 50%;
    background: linear-gradient(135deg, #9a7a2e, #C9A84C);
    display: flex; align-items: center; justify-content: center;
    color: #fff;
    box-shadow: 0 4px 16px rgba(201,168,76,.35);
  }
  .featured-badge {
    position: absolute;
    top: 10px; right: 10px;
    background: linear-gradient(135deg, #9a7a2e, #C9A84C);
    color: #fff;
    font-size: .6rem;
    font-weight: 700;
    padding: .2rem .55rem;
    border-radius: 999px;
    letter-spacing: .04em;
    text-transform: uppercase;
  }
  .partner-card-body { padding: 1rem 1.1rem 1.1rem; }
  .partner-cat-label {
    font-size: .63rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: var(--gold-dark);
    margin-bottom: .3rem;
  }
  .partner-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.15rem;
    font-weight: 600;
    color: var(--text);
    margin-bottom: .25rem;
    line-height: 1.2;
  }
  .partner-tagline {
    font-size: .75rem;
    color: var(--text-muted);
    margin-bottom: .7rem;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .partner-meta {
    display: flex;
    align-items: center;
    gap: .9rem;
    font-size: .7rem;
    color: var(--text-muted);
  }
  .partner-meta-item {
    display: flex;
    align-items: center;
    gap: .25rem;
  }
  .partner-rating {
    display: flex; align-items: center; gap: .25rem;
    color: var(--gold-dark); font-weight: 600;
  }
  .partner-cta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: .85rem;
    padding-top: .75rem;
    border-top: 1px solid var(--border);
  }
  .partner-cta-hint { font-size: .7rem; color: var(--text-muted); }
  .partner-cta-arrow {
    width: 28px; height: 28px;
    border-radius: 50%;
    background: var(--gold-bg);
    color: var(--gold-dark);
    display: flex; align-items: center; justify-content: center;
    transition: all .18s;
  }
  .partner-card:hover .partner-cta-arrow {
    background: linear-gradient(135deg, #9a7a2e, #C9A84C);
    color: #fff;
  }

  /* ── MODAL OVERLAY ── */
  .detail-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.6);
    z-index: 1000;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 0;
    animation: fadeIn .2s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  @media (min-width: 640px) {
    .detail-overlay { align-items: center; padding: 1.5rem; }
  }

  /* ── MODAL SHEET — always white, never inherits theme vars ── */
  .detail-sheet {
    background: #ffffff !important;
    border-radius: 24px 24px 0 0;
    width: 100%;
    max-width: 580px;
    max-height: 92vh;
    overflow-y: auto;
    animation: slideUp .3s cubic-bezier(.22,1,.36,1);
    box-shadow: 0 -8px 48px rgba(0,0,0,.22);
  }
  @media (min-width: 640px) {
    .detail-sheet { border-radius: 20px; max-height: 88vh; box-shadow: 0 24px 64px rgba(0,0,0,.25); }
  }
  @keyframes slideUp {
    from { transform: translateY(50px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }

  /* ── MODAL HEADER ── */
  .detail-header {
    position: sticky;
    top: 0;
    background: #ffffff !important;
    border-bottom: 1.5px solid #e5e7eb !important;
    padding: 1rem 1.25rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 10;
  }
  .detail-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.2rem;
    font-weight: 600;
    color: #111827 !important;
  }
  .close-btn {
    width: 34px; height: 34px;
    border-radius: 50%;
    border: 1.5px solid #e5e7eb !important;
    background: #f3f4f6 !important;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: #6b7280 !important;
    transition: all .18s;
  }
  .close-btn:hover { background: #e5e7eb !important; color: #111827 !important; }

  /* ── MODAL BODY ── */
  .detail-body {
    padding: 1.4rem;
    background: #ffffff !important;
  }

  /* partner description text */
  .detail-body > div[style] { color: #374151 !important; }

  /* ── INFO SECTIONS ── */
  .info-section {
    margin-bottom: 1.2rem;
    background: #f9fafb !important;
    border: 1.5px solid #e5e7eb !important;
    border-radius: 14px;
    padding: 1rem 1.1rem;
  }
  .info-section-title {
    font-size: .63rem;
    text-transform: uppercase;
    letter-spacing: .1em;
    color: #9ca3af !important;
    font-weight: 700;
    margin-bottom: .8rem;
  }

  /* ── CONTACT ROWS ── */
  .contact-row {
    display: flex;
    align-items: center;
    gap: .7rem;
    padding: .52rem 0;
    border-bottom: 1px solid #f0f0f0 !important;
    font-size: .855rem;
    color: #1f2937 !important;
  }
  .contact-row:last-child { border-bottom: none !important; padding-bottom: 0; }
  .contact-row span { color: #374151 !important; }
  .contact-row strong { color: #111827 !important; }
  .contact-icon { color: #9a7a2e !important; flex-shrink: 0; }
  .contact-link {
    color: #9a7a2e !important;
    text-decoration: none;
    font-weight: 600;
  }
  .contact-link:hover { text-decoration: underline; color: #7a6020 !important; }

  /* ── SERVICES LIST ── */
  .services-list { display: flex; flex-direction: column; gap: .5rem; }
  .service-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: .7rem .9rem;
    border: 1.5px solid #e5e7eb !important;
    border-radius: 11px;
    background: #ffffff !important;
    cursor: pointer;
    transition: all .18s;
  }
  .service-item:hover {
    border-color: #C9A84C !important;
    background: #fffbf0 !important;
    box-shadow: 0 2px 8px rgba(201,168,76,.12);
  }
  .service-item.selected {
    border-color: #9a7a2e !important;
    background: #fffbf0 !important;
    box-shadow: 0 2px 12px rgba(201,168,76,.18);
  }
  .service-item-left { display: flex; flex-direction: column; gap: .15rem; }
  .service-item-name { font-size: .875rem; font-weight: 600; color: #111827 !important; }
  .service-item-dur  { font-size: .7rem; color: #6b7280 !important; }
  .service-item-price { font-size: .92rem; font-weight: 700; color: #9a7a2e !important; }

  /* ── REQUEST FORM ── */
  .req-form { display: flex; flex-direction: column; gap: .85rem; }
  .req-field { display: flex; flex-direction: column; gap: .35rem; }
  .req-label {
    font-size: .65rem;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: #6b7280 !important;
    font-weight: 700;
  }
  .req-input, .req-textarea {
    background: #ffffff !important;
    border: 1.5px solid #d1d5db !important;
    color: #111827 !important;
    border-radius: 9px;
    padding: .65rem .9rem;
    font-size: .875rem;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    transition: border-color .2s, box-shadow .2s;
    width: 100%;
    box-sizing: border-box;
  }
  .req-input::placeholder, .req-textarea::placeholder { color: #9ca3af !important; }
  .req-input:focus, .req-textarea:focus {
    border-color: #C9A84C !important;
    box-shadow: 0 0 0 3px rgba(201,168,76,.15);
  }
  .req-textarea { resize: vertical; min-height: 80px; }
  .req-row { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }

  /* ── SUBMIT BUTTON ── */
  .submit-btn {
    width: 100%;
    padding: .88rem;
    border: none;
    border-radius: 11px;
    background: linear-gradient(135deg, #9a7a2e, #C9A84C);
    color: #fff !important;
    font-family: 'DM Sans', sans-serif;
    font-size: .9rem;
    font-weight: 700;
    cursor: pointer;
    transition: all .22s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: .5rem;
    box-shadow: 0 3px 12px rgba(201,168,76,.3);
    margin-top: .5rem;
  }
  .submit-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #b09038, #dfc06e);
    transform: translateY(-1px);
    box-shadow: 0 5px 16px rgba(201,168,76,.35);
  }
  .submit-btn:disabled { opacity: .5; cursor: not-allowed; transform: none; }

  /* ── COMMISSION NOTICE ── */
  .commission-notice {
    background: #fffbf0 !important;
    border: 1.5px solid rgba(201,168,76,.35) !important;
    border-radius: 11px;
    padding: .8rem 1rem;
    font-size: .77rem;
    color: #7a6020 !important;
    display: flex;
    align-items: center;
    gap: .5rem;
    margin-bottom: 1rem;
    font-weight: 500;
  }

  /* ── SUCCESS CARD ── */
  .success-card { text-align: center; padding: 2.5rem 1.5rem 2rem; }
  .success-icon { margin-bottom: 1rem; }
  .success-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: .5rem;
    color: #111827 !important;
  }
  .success-sub { font-size: .82rem; color: #6b7280 !important; line-height: 1.65; }

  .empty-state {
    text-align: center;
    padding: 3rem 1.5rem;
    color: var(--text-muted);
  }
  .empty-state svg { margin-bottom: 1rem; opacity: .3; }
  .empty-title { font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; font-weight: 600; color: var(--text); margin-bottom: .4rem; }

  .spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin .7s linear infinite;
    flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .warning-box {
    background: #fee2e2;
    padding: 1rem;
    border-radius: 10px;
    margin-bottom: 1rem;
    color: #dc2626;
    font-size: .85rem;
    text-align: center;
    border: 1px solid #fecaca;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: .5rem;
  }

  /* PayMongo Modal */
  .paymongo-modal .modal-content {
    border-radius: 18px;
    overflow: hidden;
  }
  .paymongo-iframe {
    width: 100%;
    height: 500px;
    border: none;
  }
  .payment-option-btn {
    padding: 1rem;
    border: 2px solid var(--border);
    border-radius: 12px;
    background: #fff;
    cursor: pointer;
    transition: all .18s;
    display: flex;
    align-items: center;
    gap: .75rem;
    width: 100%;
  }
  .payment-option-btn:hover {
    border-color: var(--gold);
    background: var(--gold-bg);
    transform: translateY(-2px);
  }
  .payment-option-btn.selected {
    border-color: var(--gold);
    background: rgba(201,168,76,0.1);
  }
`;

const CATEGORY_ICONS = {
  SALON: <Scissors size={22} />,
  SPA: <Sparkles size={22} />,
  MASSAGE: <Heart size={22} />,
  TOUR_GUIDE: <Map size={22} />,
  TRANSPORT: <Car size={22} />,
  DINING: <UtensilsCrossed size={22} />,
  PHOTOGRAPHY: <Camera size={22} />,
  ADVENTURE: <Mountain size={22} />,
  SHOPPING: <ShoppingBag size={22} />,
  OTHER: <MoreHorizontal size={22} />,
};

function StarRating({ rating }) {
  return (
    <div className="partner-rating">
      <Star size={12} fill="currentColor" />
      <span>{Number(rating).toFixed(1)}</span>
    </div>
  );
}

export default function GuestPartnerServices({ initialCategory }) {
  const [partners, setPartners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(initialCategory || 'ALL');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('info');
  const [selectedService, setSelectedService] = useState(null);
  const [form, setForm] = useState({ preferred_date: '', preferred_time: '', number_of_guests: 1, notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [activeRoom, setActiveRoom] = useState('');
  
  // Payment states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPayMongoModal, setShowPayMongoModal] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentChecking, setPaymentChecking] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [currentRequestAmount, setCurrentRequestAmount] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('online');
  
  const { alert, showAlert } = useAlert();

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  useEffect(() => {
    setActiveCategory(initialCategory || 'ALL');
  }, [initialCategory]);

  useEffect(() => {
    fetchPartners();
    fetchRoom();
  }, [activeCategory]);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const params = activeCategory !== 'ALL' ? `?category=${activeCategory}` : '';
      const res = await fetch(`${API_BASE}/services/partners/${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPartners(data.partners || []);
        if (data.categories) {
          setCategories([{ value: 'ALL', label: 'All', count: data.partners?.length || 0 }, ...data.categories]);
        }
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchRoom = async () => {
    try {
      const res = await fetch(`${API_BASE}/bookings/my-bookings/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const booking = Array.isArray(data) ? data[0] : data;
        setActiveRoom(
          booking?.roomNumber || booking?.room_number ||
          booking?.room?.roomNumber || booking?.room?.room_number || ''
        );
      }
    } catch (e) { setActiveRoom(''); }
  };

  const openPartner = (partner) => {
    setSelected(partner);
    setView('info');
    setForm({ preferred_date: '', preferred_time: '', number_of_guests: 1, notes: '' });
  };

  // Poll payment status
  const pollPaymentStatus = async (requestId) => {
    setPaymentChecking(true);
    
    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/services/partners/requests/${requestId}/verify-payment/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.ok) {
          const data = await res.json();
          
          if (data.payment_status === 'PAID') {
            setPaymentChecking(false);
            setShowPayMongoModal(false);
            setShowPaymentModal(false);
            setView('success');
            showAlert('Payment successful! Your request is confirmed.', 'success');
            // Reset form
            setSelectedService(null);
            setForm({ preferred_date: '', preferred_time: '', number_of_guests: 1, notes: '' });
            return true;
          }
        }
        return false;
      } catch (e) {
        console.error('Status check error:', e);
        return false;
      }
    };
    
    // Poll every 3 seconds for 2 minutes
    let attempts = 0;
    const maxAttempts = 40;
    
    const interval = setInterval(async () => {
      attempts++;
      const completed = await checkStatus();
      
      if (completed || attempts >= maxAttempts) {
        clearInterval(interval);
        setPaymentChecking(false);
        if (!completed && attempts >= maxAttempts) {
          showAlert('Payment is being processed. You will receive a confirmation shortly.', 'info');
          setView('success');
          setShowPaymentModal(false);
          setShowPayMongoModal(false);
        }
      }
    }, 3000);
    
    // Check immediately
    await checkStatus();
  };

  // Create payment for partner request
  const createPayment = async () => {
    if (!currentRequestId) return;
    
    setPaymentProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/services/partners/requests/${currentRequestId}/create-payment/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      
      const data = await res.json();
      
      if (res.ok && data.checkout_url) {
        setPaymentUrl(data.checkout_url);
        setShowPaymentModal(false);
        setShowPayMongoModal(true);
        
        // Start polling for payment status
        pollPaymentStatus(currentRequestId);
      } else {
        showAlert(data.error || 'Failed to create payment link', 'error');
        // If payment fails, still show success and tell guest to pay at reception
        setView('success');
        setShowPaymentModal(false);
      }
    } catch (e) {
      console.error('Payment creation error:', e);
      showAlert('Network error. Please try again.', 'error');
      setView('success');
      setShowPaymentModal(false);
    }
    setPaymentProcessing(false);
  };

  // Skip payment (pay at hotel)
  const skipPayment = () => {
    setShowPaymentModal(false);
    setView('success');
    showAlert('Request submitted! Please pay at the reception to confirm your booking.', 'success');
    setSelectedService(null);
    setForm({ preferred_date: '', preferred_time: '', number_of_guests: 1, notes: '' });
  };

  const handleSubmitRequest = async () => {
    console.log('=== HANDLE SUBMIT REQUEST ===');
    console.log('selectedService:', selectedService);
    console.log('selectedService.id:', selectedService?.id);
    console.log('selectedService.price:', selectedService?.price);
    
    if (!activeRoom) {
      showAlert('You must be checked in to request partner services.', 'error');
      return;
    }
    
    if (!selectedService) {
      showAlert('Please select a service first.', 'error');
      return;
    }
    
    setSubmitting(true);
    try {
      const payload = {
        partner: selected.id,
        room_number: activeRoom,
        notes: form.notes,
        preferred_date: form.preferred_date || null,
        preferred_time: form.preferred_time || null,
        number_of_guests: form.number_of_guests,
        total_amount: selectedService.price,
        partner_service: selectedService.id,
      };
      
      console.log('PAYLOAD:', payload);
      
      const res = await fetch(`${API_BASE}/services/partners/requests/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      console.log('RESPONSE:', data);
      
      if (res.ok) {
        // Store the request ID and amount for payment
        setCurrentRequestId(data.id);
        setCurrentRequestAmount(selectedService.price);
        
        // Show payment option modal
        setShowPaymentModal(true);
      } else {
        showAlert(data.detail || data.error || 'Failed to submit request', 'error');
      }
    } catch (e) {
      console.error('Submit error:', e);
      showAlert('Network error. Please try again.', 'error');
    }
    setSubmitting(false);
  };

  const filtered = activeCategory === 'ALL' ? partners : partners.filter(p => p.category === activeCategory);

  return (
    <div className="gps-root">
      <style>{css}</style>
      <Alert alert={alert} />

      <div className="gps-header">
        <h1 className="gps-title">Partner Services</h1>
        <p className="gps-sub">Exclusive local services — curated for our guests</p>
      </div>

      {/* Category Tabs */}
      <div className="cat-tabs">
        {categories.map(cat => (
          <button
            key={cat.value}
            className={`cat-tab ${activeCategory === cat.value ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.value)}
          >
            {cat.value !== 'ALL' && CATEGORY_ICONS[cat.value]}
            {cat.label}
            <span className="count">{cat.count}</span>
          </button>
        ))}
      </div>

      {/* Partners Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
          Loading partners…
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Building2 size={40} />
          <div className="empty-title">No partners found</div>
          <p style={{ fontSize: '.8rem' }}>Check back soon for new partner services.</p>
        </div>
      ) : (
        <div className="partners-grid">
          {filtered.map((partner, i) => (
            <div
              key={partner.id}
              className="partner-card"
              style={{ animationDelay: `${i * 0.05}s` }}
              onClick={() => openPartner(partner)}
            >
              <div className="partner-card-cover">
                <div className="partner-cat-icon">
                  {CATEGORY_ICONS[partner.category] || <Building2 size={22} />}
                </div>
                {partner.is_featured && <div className="featured-badge">★ Featured</div>}
              </div>
              <div className="partner-card-body">
                <div className="partner-cat-label">{partner.category_label}</div>
                <div className="partner-name">{partner.name}</div>
                {partner.tagline && <div className="partner-tagline">{partner.tagline}</div>}
                <div className="partner-meta">
                  {partner.average_rating > 0 && <StarRating rating={partner.average_rating} />}
                  <div className="partner-meta-item">
                    <Clock size={11} />
                    <span style={{ fontSize: '.68rem' }}>{partner.operating_hours || 'See details'}</span>
                  </div>
                </div>
                <div className="partner-cta">
                  <span className="partner-cta-hint">View details & request</span>
                  <div className="partner-cta-arrow"><ChevronRight size={14} /></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Sheet */}
      {selected && (
        <div className="detail-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="detail-sheet">
            <div className="detail-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                {view === 'request' && (
                  <button className="close-btn" onClick={() => setView('info')}>
                    <ChevronLeft size={14} />
                  </button>
                )}
                <span className="detail-title">
                  {view === 'success' ? 'Request Sent!' : view === 'request' ? 'Send Request' : selected.name}
                </span>
              </div>
              <button className="close-btn" onClick={() => setSelected(null)}><X size={14} /></button>
            </div>

            <div className="detail-body">
              {view === 'success' ? (
                <div className="success-card">
                  <div className="success-icon"><CheckCircle2 size={52} color="#2d9b6f" /></div>
                  <div className="success-title">Request Submitted!</div>
                  <p className="success-sub">
                    Our reception team will confirm your booking with <strong>{selected.name}</strong> and contact you shortly.
                  </p>
                  <button className="submit-btn" style={{ maxWidth: 220, margin: '1.5rem auto 0' }} onClick={() => setSelected(null)}>
                    Done
                  </button>
                </div>
              ) : view === 'request' ? (
                <>
                  <div className="commission-notice">
                    <Percent size={14} />
                    Arranged by hotel — our concierge team will confirm your booking.
                  </div>
                  
                  {/* Warning if no service selected */}
                  {!selectedService && (
                    <div className="warning-box">
                      <AlertCircle size={18} />
                      <strong>No service selected!</strong> Please go back and select a service.
                    </div>
                  )}
                  
                  {/* Show selected service details */}
                  {selectedService && (
                    <div className="info-section" style={{ marginBottom: '1rem' }}>
                      <div className="info-section-title">Selected Service</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '.9rem', color: '#111827' }}>{selectedService.name}</div>
                          {selectedService.duration_display && (
                            <div style={{ fontSize: '.72rem', color: '#6b7280' }}>
                              Duration: {selectedService.duration_display}
                            </div>
                          )}
                        </div>
                        <div style={{ fontWeight: 700, color: '#9a7a2e', fontSize: '1rem' }}>
                          ₱{Number(selectedService.price).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="req-form">
                    <div className="req-row">
                      <div className="req-field">
                        <label className="req-label">Preferred Date</label>
                        <input type="date" className="req-input"
                          value={form.preferred_date}
                          onChange={e => setForm(f => ({ ...f, preferred_date: e.target.value }))}
                        />
                      </div>
                      <div className="req-field">
                        <label className="req-label">Preferred Time</label>
                        <input type="time" className="req-input"
                          value={form.preferred_time}
                          onChange={e => setForm(f => ({ ...f, preferred_time: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="req-field">
                      <label className="req-label">Number of Guests</label>
                      <input type="number" min="1" max="20" className="req-input"
                        value={form.number_of_guests}
                        onChange={e => setForm(f => ({ ...f, number_of_guests: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                    <div className="req-field">
                      <label className="req-label">Special Notes / Requests</label>
                      <textarea className="req-textarea"
                        placeholder="Any special instructions, preferences, or requirements…"
                        value={form.notes}
                        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      />
                    </div>
                    
                    {/* Submit button disabled if no service selected */}
                    <button 
                      className="submit-btn" 
                      onClick={handleSubmitRequest} 
                      disabled={submitting || !activeRoom || !selectedService}
                    >
                      {submitting ? <><div className="spinner" /> Submitting…</> : <><Send size={16} /> Submit Request</>}
                    </button>
                    
                    {!activeRoom && (
                      <div style={{ fontSize: '.72rem', color: '#ef4444', textAlign: 'center' }}>
                        You must be checked in to request partner services.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Partner info view */}
                  <div style={{ fontSize: '.875rem', color: '#374151', lineHeight: 1.75, marginBottom: '1.2rem', padding: '1rem 1.1rem', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 14 }}>
                    {selected.description}
                  </div>

                  {/* Contact info */}
                  <div className="info-section">
                    <div className="info-section-title">Contact Information</div>
                    <div className="contact-row">
                      <Phone size={13} className="contact-icon" />
                      <a href={`tel:${selected.phone}`} className="contact-link">{selected.phone}</a>
                    </div>
                    {selected.email && (
                      <div className="contact-row">
                        <Mail size={13} className="contact-icon" />
                        <a href={`mailto:${selected.email}`} className="contact-link">{selected.email}</a>
                      </div>
                    )}
                    {selected.website && (
                      <div className="contact-row">
                        <Globe size={13} className="contact-icon" />
                        <a href={selected.website} target="_blank" rel="noreferrer" className="contact-link" style={{ display: 'flex', alignItems: 'center', gap: '.25rem' }}>
                          Visit Website <ExternalLink size={10} />
                        </a>
                      </div>
                    )}
                    {selected.address && (
                      <div className="contact-row">
                        <MapPin size={13} className="contact-icon" />
                        <span style={{ color: '#374151' }}>{selected.address}</span>
                      </div>
                    )}
                    <div className="contact-row">
                      <Clock size={13} className="contact-icon" />
                      <span style={{ color: '#374151' }}>{selected.operating_hours}</span>
                    </div>
                    <div className="contact-row">
                      <Users size={13} className="contact-icon" />
                      <span style={{ color: '#374151' }}>Contact person: <strong style={{ color: '#111827' }}>{selected.contact_person}</strong></span>
                    </div>
                  </div>

                  {/* Services */}
                  {selected.services && selected.services.length > 0 && (
                    <div className="info-section">
                      <div className="info-section-title">Available Services</div>
                      <div className="services-list">
                        {selected.services.filter(s => s.is_available).map(svc => (
                          <div
                            key={svc.id}
                            className={`service-item ${selectedService?.id === svc.id ? 'selected' : ''}`}
                            onClick={() => {
                              console.log('Service clicked:', svc);
                              if (selectedService?.id === svc.id) {
                                setSelectedService(null);
                              } else {
                                setSelectedService(svc);
                              }
                            }}
                          >
                            <div className="service-item-left">
                              <div className="service-item-name">{svc.name}</div>
                              {svc.duration_display && (
                                <div className="service-item-dur">{svc.duration_display}</div>
                              )}
                              {svc.description && (
                                <div style={{ fontSize: '.7rem', color: '#9ca3af', marginTop: '.1rem' }}>
                                  {svc.description}
                                </div>
                              )}
                            </div>
                            <div className="service-item-price">₱{Number(svc.price).toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button 
                    className="submit-btn" 
                    onClick={() => setView('request')}
                    disabled={!selectedService}
                    style={{ opacity: !selectedService ? 0.6 : 1 }}
                  >
                    <CalendarDays size={16} />
                    {selectedService ? `Request "${selectedService.name}"` : 'Select a Service First'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Option Modal - Shows after request submission */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered className="ap-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            <CreditCard size={16} /> Complete Your Booking
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ textAlign: 'center', padding: '0.5rem' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #9a7a2e, #C9A84C)',
              width: 60,
              height: 60,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <Sparkles size={28} color="#fff" />
            </div>
            
            <div style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '.5rem' }}>
              {selectedService?.name}
            </div>
            
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#9a7a2e', marginBottom: '1rem' }}>
              ₱{currentRequestAmount.toLocaleString()}
            </div>
            
            <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Your request has been created. Please complete payment to confirm your booking.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              <button 
                className="submit-btn" 
                onClick={createPayment}
                disabled={paymentProcessing}
                style={{ background: 'linear-gradient(135deg, #2563eb, #60a5fa)' }}
              >
                {paymentProcessing ? <><div className="spinner" /> Creating Payment...</> : <><CreditCard size={16} /> Pay Online (GCash/Card)</>}
              </button>
              
              <button 
                className="submit-btn" 
                onClick={skipPayment}
                disabled={paymentProcessing}
                style={{ background: 'linear-gradient(135deg, #6b7280, #9ca3af)' }}
              >
                <Banknote size={16} /> Pay at Reception Later
              </button>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/* PayMongo Payment Modal - Opens in iframe */}
      <Modal 
        show={showPayMongoModal} 
        onHide={() => {
          setShowPayMongoModal(false);
          setShowPaymentModal(true);
        }} 
        size="lg" 
        centered 
        className="paymongo-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <CreditCard size={16} /> Complete Payment
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0 }}>
          {paymentChecking && (
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              background: 'rgba(255,255,255,0.95)',
              padding: '1rem 2rem',
              borderRadius: 12,
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}>
              <div className="spinner" style={{ margin: '0 auto .5rem' }} />
              <div style={{ fontSize: '.85rem' }}>Waiting for payment confirmation...</div>
            </div>
          )}
          <iframe
            src={paymentUrl}
            className="paymongo-iframe"
            title="PayMongo Checkout"
            allow="payment"
          />
        </Modal.Body>
        <Modal.Footer>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>
              <ShieldCheck size={12} style={{ display: 'inline', marginRight: '.3rem' }} />
              Secured by PayMongo
            </div>
            <button 
              className="ap-btn-ghost" 
              onClick={() => {
                setShowPayMongoModal(false);
                setShowPaymentModal(true);
              }}
              style={{ fontSize: '.75rem' }}
            >
              Cancel Payment
            </button>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
}