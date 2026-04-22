// pages/AdminPartnerManagement.jsx - Complete with Services Management
import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { Alert } from '../components/ui/Alert';
import { useAlert } from '../hooks/useAlert';
import { API_BASE } from '../constants/config';
import {
  Building2, Plus, Edit2, Trash2, Phone, Mail, Globe,
  MapPin, Clock, Star, Percent, CheckCircle2, X,
  Scissors, Sparkles, Heart, Map, Car, UtensilsCrossed,
  Camera, Mountain, ShoppingBag, MoreHorizontal,
  Eye, EyeOff, Save, ChevronRight, Users, DollarSign,
  Package, Tag, List, CreditCard, Banknote, Smartphone
} from 'lucide-react';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  .apm-root {
    min-height: 100vh;
    background: var(--bg);
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
    -webkit-font-smoothing: antialiased;
    padding: 2rem 2.25rem;
  }
  @media (max-width: 768px) { .apm-root { padding: 1.25rem 1rem; } }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .apm-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.75rem;
    animation: fadeUp .4s ease both;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .apm-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.9rem;
    font-weight: 600;
    color: var(--text);
    margin: 0 0 .18rem;
  }
  .apm-sub { font-size: .82rem; color: var(--text-muted); }

  .add-btn {
    display: flex;
    align-items: center;
    gap: .4rem;
    padding: .55rem 1rem;
    border-radius: 10px;
    border: none;
    background: linear-gradient(135deg, #9a7a2e, #C9A84C);
    color: #fff;
    font-size: .82rem;
    font-weight: 700;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    box-shadow: 0 2px 8px rgba(201,168,76,.3);
    transition: all .2s;
  }
  .add-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(201,168,76,.35); }

  .partners-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.1rem;
  }
  @media (max-width: 1000px) { .partners-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 600px) { .partners-grid { grid-template-columns: 1fr; } }

  .admin-partner-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    animation: fadeUp .45s ease both;
    transition: box-shadow .2s;
  }
  .admin-partner-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,.08); }
  .admin-partner-card.inactive { opacity: .6; }

  .card-cover {
    height: 80px;
    background: linear-gradient(135deg, #c9a84c18, #9a7a2e28);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  .cat-icon-badge {
    width: 44px; height: 44px;
    border-radius: 50%;
    background: linear-gradient(135deg, #9a7a2e, #C9A84C);
    display: flex; align-items: center; justify-content: center;
    color: #fff;
    box-shadow: 0 3px 12px rgba(201,168,76,.32);
  }
  .status-dot {
    position: absolute; top: 10px; right: 10px;
    width: 8px; height: 8px;
    border-radius: 50%;
    border: 2px solid var(--surface);
  }
  .status-dot.active { background: #10b981; }
  .status-dot.inactive { background: #ef4444; }

  .card-body { padding: .95rem 1rem 1rem; }
  .card-cat-label { font-size: .62rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--gold-dark); margin-bottom: .25rem; }
  .card-name { font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 600; color: var(--text); margin-bottom: .2rem; }
  .card-tagline { font-size: .72rem; color: var(--text-muted); margin-bottom: .7rem; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }

  .card-stats { display: flex; gap: .75rem; margin-bottom: .85rem; }
  .card-stat { font-size: .7rem; color: var(--text-muted); display: flex; align-items: center; gap: .25rem; }
  .card-stat strong { color: var(--gold-dark); }

  /* Services Section Styles */
  .services-section {
    margin-top: .75rem;
    padding-top: .75rem;
    border-top: 1px solid var(--border);
  }
  .services-title {
    font-size: .7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: var(--text-muted);
    margin-bottom: .5rem;
    display: flex;
    align-items: center;
    gap: .4rem;
  }
  .service-item-admin {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: .5rem .6rem;
    background: var(--surface2);
    border-radius: 8px;
    margin-bottom: .4rem;
    font-size: .75rem;
  }
  .service-name {
    font-weight: 600;
    color: var(--text);
  }
  .service-price {
    font-weight: 700;
    color: var(--gold-dark);
  }
  .service-actions {
    display: flex;
    gap: .3rem;
  }
  .service-icon-btn {
    padding: .2rem .4rem;
    border-radius: 5px;
    border: 1px solid var(--border);
    background: #fff;
    cursor: pointer;
    transition: all .15s;
  }
  .service-icon-btn:hover { border-color: var(--gold); color: var(--gold-dark); }
  .add-service-btn {
    width: 100%;
    padding: .4rem;
    margin-top: .5rem;
    border: 1px dashed var(--border);
    border-radius: 8px;
    background: var(--surface2);
    color: var(--text-muted);
    font-size: .7rem;
    cursor: pointer;
    transition: all .18s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: .3rem;
  }
  .add-service-btn:hover { border-color: var(--gold); color: var(--gold-dark); background: var(--gold-bg); }

  .card-actions {
    display: flex;
    gap: .5rem;
    padding-top: .75rem;
    margin-top: .5rem;
    border-top: 1px solid var(--border);
  }
  .action-btn {
    flex: 1;
    padding: .45rem;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface2);
    font-size: .72rem;
    font-weight: 600;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: .3rem;
    transition: all .18s;
    color: var(--text-muted);
  }
  .action-btn:hover { border-color: var(--gold); color: var(--gold-dark); background: var(--gold-bg); }
  .action-btn.danger:hover { border-color: #ef4444; color: #ef4444; background: rgba(239,68,68,.05); }

  /* Bootstrap Modal Overrides */
  .apm-modal .modal-content {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 18px;
    box-shadow: 0 20px 60px rgba(0,0,0,.15);
    overflow: hidden;
  }
  .apm-modal .modal-header {
    background: var(--surface2);
    border-bottom: 1px solid var(--border);
    padding: 1.1rem 1.45rem;
  }
  .apm-modal .modal-body {
    background: #fff;
    padding: 1.5rem;
    max-height: 70vh;
    overflow-y: auto;
  }
  .apm-modal .modal-footer {
    background: var(--surface2);
    border-top: 1px solid var(--border);
    padding: 1rem 1.45rem;
  }
  .apm-modal .modal-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.1rem;
    color: var(--text);
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: .5rem;
  }

  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
  @media (max-width: 480px) { .form-grid { grid-template-columns: 1fr; } }
  .form-field { display: flex; flex-direction: column; gap: .35rem; margin-bottom: .7rem; }
  .form-field.full { grid-column: 1 / -1; }
  .form-label { font-size: .65rem; text-transform: uppercase; letter-spacing: .08em; color: var(--text-muted); font-weight: 700; }
  .form-input, .form-select, .form-textarea {
    background: var(--surface2);
    border: 1px solid var(--border);
    color: var(--text);
    border-radius: 8px;
    padding: .6rem .85rem;
    font-size: .875rem;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    transition: border-color .2s, box-shadow .2s;
    width: 100%;
    box-sizing: border-box;
  }
  .form-input:focus, .form-select:focus, .form-textarea:focus {
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgba(201,168,76,.12);
  }
  .form-textarea { resize: vertical; min-height: 80px; }

  .save-btn {
    width: 100%; padding: .85rem;
    border: none; border-radius: 10px;
    background: linear-gradient(135deg, #9a7a2e, #C9A84C);
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: .9rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: .5rem;
    box-shadow: 0 2px 8px rgba(201,168,76,.28);
    transition: all .2s;
    margin-top: .5rem;
  }
  .save-btn:hover:not(:disabled) { transform: translateY(-1px); }
  .save-btn:disabled { opacity: .5; cursor: not-allowed; }

  .toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: .6rem 0;
  }
  .toggle-label { font-size: .82rem; font-weight: 500; color: var(--text); }
  .toggle-switch {
    width: 40px; height: 22px;
    border-radius: 999px;
    border: none;
    cursor: pointer;
    position: relative;
    transition: background .2s;
  }
  .toggle-switch.on { background: linear-gradient(135deg, #9a7a2e, #C9A84C); }
  .toggle-switch.off { background: var(--border); }
  .toggle-knob {
    position: absolute;
    width: 16px; height: 16px;
    border-radius: 50%;
    background: #fff;
    top: 3px;
    transition: left .2s;
    box-shadow: 0 1px 4px rgba(0,0,0,.2);
  }
  .toggle-switch.on .toggle-knob { left: 21px; }
  .toggle-switch.off .toggle-knob { left: 3px; }

  .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .section-divider {
    font-size: .7rem;
    font-weight: 700;
    color: var(--gold-dark);
    margin: 1rem 0 .5rem;
    padding-top: .5rem;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: .5rem;
  }
`;

const CATEGORIES = [
  { value: 'SALON', label: 'Salon & Hair' },
  { value: 'SPA', label: 'Spa & Wellness' },
  { value: 'MASSAGE', label: 'Massage Therapy' },
  { value: 'TOUR_GUIDE', label: 'Tourist Guide' },
  { value: 'TRANSPORT', label: 'Transportation' },
  { value: 'DINING', label: 'Dining & Catering' },
  { value: 'PHOTOGRAPHY', label: 'Photography' },
  { value: 'ADVENTURE', label: 'Adventure & Activities' },
  { value: 'SHOPPING', label: 'Shopping Concierge' },
  { value: 'OTHER', label: 'Other' },
];

const CAT_ICONS = {
  SALON: <Scissors size={20} />, SPA: <Sparkles size={20} />, MASSAGE: <Heart size={20} />,
  TOUR_GUIDE: <Map size={20} />, TRANSPORT: <Car size={20} />, DINING: <UtensilsCrossed size={20} />,
  PHOTOGRAPHY: <Camera size={20} />, ADVENTURE: <Mountain size={20} />, SHOPPING: <ShoppingBag size={20} />,
  OTHER: <MoreHorizontal size={20} />,
};

const EMPTY_FORM = {
  name: '', category: 'SALON', description: '', tagline: '',
  contact_person: '', phone: '', email: '', website: '', address: '',
  commission_rate: '20.00', operating_hours: '8:00 AM – 9:00 PM',
  availability_notes: '', status: 'ACTIVE', is_featured: false,
  payout_email: '', bank_account_name: '', bank_name: '', bank_account_number: '', gcash_number: '',
};

const EMPTY_SERVICE = {
  name: '', description: '', price: '', duration_minutes: '', is_available: true
};

export default function AdminPartnerManagement({ token: propToken }) {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  
  // Service management state
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState(EMPTY_SERVICE);
  const [savingService, setSavingService] = useState(false);
  
  const { alert, showAlert } = useAlert();
  
  const token = propToken || localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

  useEffect(() => { 
    fetchPartners(); 
  }, []);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/services/partners/admin/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPartners(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch partners:', res.status);
        setPartners([]);
      }
    } catch (e) { 
      console.error('Error fetching partners:', e);
      setPartners([]);
    }
    setLoading(false);
  };

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (partner) => {
    setEditing(partner);
    setForm({
      name: partner.name || '',
      category: partner.category || 'SALON',
      description: partner.description || '',
      tagline: partner.tagline || '',
      contact_person: partner.contact_person || '',
      phone: partner.phone || '',
      email: partner.email || '',
      website: partner.website || '',
      address: partner.address || '',
      commission_rate: partner.commission_rate || '20.00',
      operating_hours: partner.operating_hours || '8:00 AM – 9:00 PM',
      availability_notes: partner.availability_notes || '',
      status: partner.status || 'ACTIVE',
      is_featured: partner.is_featured || false,
      payout_email: partner.payout_email || '',
      bank_account_name: partner.bank_account_name || '',
      bank_name: partner.bank_name || '',
      bank_account_number: partner.bank_account_number || '',
      gcash_number: partner.gcash_number || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.phone || !form.contact_person) {
      showAlert('Name, contact person, and phone are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const url = editing
        ? `${API_BASE}/services/partners/admin/${editing.id}/`
        : `${API_BASE}/services/partners/admin/`;
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showAlert(editing ? 'Partner updated!' : 'Partner added!', 'success');
        setShowModal(false);
        fetchPartners();
      } else {
        const err = await res.json();
        showAlert(err.error || err.message || 'Failed to save partner', 'error');
      }
    } catch (e) {
      showAlert('Network error: ' + e.message, 'error');
    }
    setSaving(false);
  };

  const handleDeactivate = async (partner) => {
    if (!window.confirm(`Deactivate "${partner.name}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/services/partners/admin/${partner.id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showAlert('Partner deactivated.', 'success');
        fetchPartners();
      } else {
        showAlert('Failed to deactivate partner', 'error');
      }
    } catch (e) {
      showAlert('Network error', 'error');
    }
  };

  // =====================================================
  // SERVICE MANAGEMENT FUNCTIONS
  // =====================================================
  
  const openAddService = (partner) => {
    setSelectedPartner(partner);
    setEditingService(null);
    setServiceForm(EMPTY_SERVICE);
    setShowServiceModal(true);
  };

  const openEditService = (partner, service) => {
    setSelectedPartner(partner);
    setEditingService(service);
    setServiceForm({
      name: service.name || '',
      description: service.description || '',
      price: service.price || '',
      duration_minutes: service.duration_minutes || '',
      is_available: service.is_available !== undefined ? service.is_available : true,
    });
    setShowServiceModal(true);
  };

  const saveService = async () => {
    if (!serviceForm.name || !serviceForm.price) {
      showAlert('Service name and price are required.', 'error');
      return;
    }
    
    setSavingService(true);
    try {
      let url, method;
      
      if (editingService) {
        url = `${API_BASE}/services/partners/admin/${selectedPartner.id}/services/${editingService.id}/`;
        method = 'PUT';
      } else {
        url = `${API_BASE}/services/partners/admin/${selectedPartner.id}/services/`;
        method = 'POST';
      }
      
      const payload = {
        name: serviceForm.name,
        description: serviceForm.description,
        price: parseFloat(serviceForm.price),
        duration_minutes: serviceForm.duration_minutes ? parseInt(serviceForm.duration_minutes) : null,
        is_available: serviceForm.is_available,
      };
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        showAlert(editingService ? 'Service updated!' : 'Service added!', 'success');
        setShowServiceModal(false);
        fetchPartners();
      } else {
        const err = await res.json();
        showAlert(err.error || err.message || 'Failed to save service', 'error');
      }
    } catch (e) {
      showAlert('Network error: ' + e.message, 'error');
    }
    setSavingService(false);
  };

  const deleteService = async (partner, service) => {
    if (!window.confirm(`Delete service "${service.name}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/services/partners/admin/${partner.id}/services/${service.id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showAlert('Service deleted.', 'success');
        fetchPartners();
      } else {
        showAlert('Failed to delete service', 'error');
      }
    } catch (e) {
      showAlert('Network error', 'error');
    }
  };

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setServiceField = (k, v) => setServiceForm(f => ({ ...f, [k]: v }));

  return (
    <div className="apm-root">
      <style>{css}</style>
      <Alert alert={alert} />

      <div className="apm-header">
        <div>
          <h1 className="apm-title">Partner Management</h1>
          <p className="apm-sub">Manage third-party service partners, services & commission rates</p>
        </div>
        <button className="add-btn" onClick={openAdd}>
          <Plus size={15} /> Add Partner
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading partners…</div>
      ) : partners.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1.5rem', color: 'var(--text-muted)' }}>
          <Building2 size={40} style={{ opacity: .3, marginBottom: '1rem' }} />
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', fontWeight: 600, color: 'var(--text)', marginBottom: '.5rem' }}>No partners yet</div>
          <p style={{ fontSize: '.82rem' }}>Add your first partner to start earning commission.</p>
          <button className="add-btn" style={{ margin: '1.5rem auto 0' }} onClick={openAdd}>
            <Plus size={15} /> Add Partner
          </button>
        </div>
      ) : (
        <div className="partners-grid">
          {partners.map((p, i) => (
            <div key={p.id} className={`admin-partner-card ${p.status !== 'ACTIVE' ? 'inactive' : ''}`} style={{ animationDelay: `${i * 0.04}s` }}>
              <div className="card-cover">
                <div className="cat-icon-badge">{CAT_ICONS[p.category] || <Building2 size={20} />}</div>
                <div className={`status-dot ${p.status === 'ACTIVE' ? 'active' : 'inactive'}`} />
              </div>
              <div className="card-body">
                <div className="card-cat-label">{p.category_label || p.category}</div>
                <div className="card-name">{p.name}</div>
                {p.tagline && <div className="card-tagline">{p.tagline}</div>}
                <div className="card-stats">
                  <div className="card-stat">
                    <Percent size={11} />
                    Commission: <strong>{p.commission_rate}%</strong>
                  </div>
                  <div className="card-stat">
                    <Phone size={11} />
                    <strong>{p.phone}</strong>
                  </div>
                </div>
                {p.is_featured && (
                  <div style={{ fontSize: '.65rem', color: 'var(--gold-dark)', fontWeight: 700, marginBottom: '.6rem' }}>
                    ★ Featured Partner
                  </div>
                )}
                
                {/* SERVICES SECTION - Shows services with prices */}
                <div className="services-section">
                  <div className="services-title">
                    <Package size={12} /> Services & Pricing
                  </div>
                  {p.services && p.services.length > 0 ? (
                    p.services.map(service => (
                      <div key={service.id} className="service-item-admin">
                        <div>
                          <div className="service-name">{service.name}</div>
                          {service.description && (
                            <div style={{ fontSize: '.65rem', color: 'var(--text-muted)' }}>{service.description}</div>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                          <div className="service-price">₱{Number(service.price).toLocaleString()}</div>
                          <div className="service-actions">
                            <button 
                              className="service-icon-btn" 
                              onClick={(e) => { e.stopPropagation(); openEditService(p, service); }}
                              title="Edit service"
                            >
                              <Edit2 size={11} />
                            </button>
                            <button 
                              className="service-icon-btn" 
                              onClick={(e) => { e.stopPropagation(); deleteService(p, service); }}
                              title="Delete service"
                              style={{ color: '#dc3545' }}
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', textAlign: 'center', padding: '.5rem' }}>
                      No services added yet
                    </div>
                  )}
                  <button className="add-service-btn" onClick={() => openAddService(p)}>
                    <Plus size={12} /> Add Service
                  </button>
                </div>

                <div className="card-actions">
                  <button className="action-btn" onClick={() => openEdit(p)}>
                    <Edit2 size={12} /> Edit Partner
                  </button>
                  <button className="action-btn danger" onClick={() => handleDeactivate(p)}>
                    <Trash2 size={12} /> {p.status === 'ACTIVE' ? 'Deactivate' : 'Remove'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Partner Modal - Add/Edit Partner */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered className="apm-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            {editing ? <Edit2 size={16} /> : <Plus size={16} />}
            {editing ? ' Edit Partner' : ' Add New Partner'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="form-grid">
            <div className="form-field full">
              <label className="form-label">Partner Name *</label>
              <input className="form-input" placeholder="e.g. Luminara Spa & Wellness" value={form.name} onChange={e => setField('name', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Category *</label>
              <select className="form-select" value={form.category} onChange={e => setField('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Commission Rate (%) *</label>
              <input className="form-input" type="number" min="0" max="100" step="0.5" value={form.commission_rate} onChange={e => setField('commission_rate', e.target.value)} />
            </div>
            <div className="form-field full">
              <label className="form-label">Tagline</label>
              <input className="form-input" placeholder="Short promotional tagline…" value={form.tagline} onChange={e => setField('tagline', e.target.value)} />
            </div>
            <div className="form-field full">
              <label className="form-label">Description *</label>
              <textarea className="form-textarea" placeholder="Describe the partner's services…" value={form.description} onChange={e => setField('description', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Contact Person *</label>
              <input className="form-input" placeholder="Full name" value={form.contact_person} onChange={e => setField('contact_person', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Phone Number *</label>
              <input className="form-input" placeholder="+63 917 000 0000" value={form.phone} onChange={e => setField('phone', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="partner@example.com" value={form.email} onChange={e => setField('email', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Website</label>
              <input className="form-input" placeholder="https://…" value={form.website} onChange={e => setField('website', e.target.value)} />
            </div>
            <div className="form-field full">
              <label className="form-label">Address</label>
              <input className="form-input" placeholder="Street address or landmark" value={form.address} onChange={e => setField('address', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Operating Hours</label>
              <input className="form-input" placeholder="8:00 AM – 9:00 PM" value={form.operating_hours} onChange={e => setField('operating_hours', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setField('status', e.target.value)}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
            <div className="form-field full">
              <div className="toggle-row">
                <span className="toggle-label">Featured Partner (shown at top)</span>
                <button
                  className={`toggle-switch ${form.is_featured ? 'on' : 'off'}`}
                  onClick={() => setField('is_featured', !form.is_featured)}
                  type="button"
                >
                  <div className="toggle-knob" />
                </button>
              </div>
            </div>
            
            {/* Payout Information Section */}
            <div className="section-divider">
              <Banknote size={14} /> Payout Information
            </div>
            <div className="form-field">
              <label className="form-label">Payout Email</label>
              <input className="form-input" type="email" placeholder="payout@partner.com" value={form.payout_email} onChange={e => setField('payout_email', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">GCash Number</label>
              <input className="form-input" placeholder="+63 912 345 6789" value={form.gcash_number} onChange={e => setField('gcash_number', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Bank Name</label>
              <input className="form-input" placeholder="BPI, BDO, etc." value={form.bank_name} onChange={e => setField('bank_name', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Account Name</label>
              <input className="form-input" placeholder="Account holder name" value={form.bank_account_name} onChange={e => setField('bank_account_name', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Account Number</label>
              <input className="form-input" placeholder="Bank account number" value={form.bank_account_number} onChange={e => setField('bank_account_number', e.target.value)} />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="action-btn" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="save-btn" onClick={handleSave} disabled={saving} style={{ width: 'auto', padding: '.6rem 1.5rem' }}>
            {saving ? <><div className="spinner" /> Saving…</> : <><Save size={16} /> Save Partner</>}
          </button>
        </Modal.Footer>
      </Modal>

      {/* Service Modal - Add/Edit Service */}
      <Modal show={showServiceModal} onHide={() => setShowServiceModal(false)} size="md" centered className="apm-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingService ? <Edit2 size={16} /> : <Plus size={16} />}
            {editingService ? ' Edit Service' : ' Add Service'} - {selectedPartner?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="form-grid">
            <div className="form-field full">
              <label className="form-label">Service Name *</label>
              <input 
                className="form-input" 
                placeholder="e.g., Swedish Massage"
                value={serviceForm.name}
                onChange={e => setServiceField('name', e.target.value)}
              />
            </div>
            <div className="form-field full">
              <label className="form-label">Description</label>
              <textarea 
                className="form-textarea" 
                rows={2}
                placeholder="Describe the service..."
                value={serviceForm.description}
                onChange={e => setServiceField('description', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Price (₱) *</label>
              <input 
                className="form-input" 
                type="number" 
                min="0" 
                step="0.01"
                placeholder="1000"
                value={serviceForm.price}
                onChange={e => setServiceField('price', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Duration (minutes)</label>
              <input 
                className="form-input" 
                type="number" 
                min="0"
                placeholder="60"
                value={serviceForm.duration_minutes}
                onChange={e => setServiceField('duration_minutes', e.target.value)}
              />
            </div>
            <div className="form-field full">
              <div className="toggle-row">
                <span className="toggle-label">Available for booking</span>
                <button
                  className={`toggle-switch ${serviceForm.is_available ? 'on' : 'off'}`}
                  onClick={() => setServiceField('is_available', !serviceForm.is_available)}
                  type="button"
                >
                  <div className="toggle-knob" />
                </button>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="action-btn" onClick={() => setShowServiceModal(false)}>Cancel</button>
          <button className="save-btn" onClick={saveService} disabled={savingService} style={{ width: 'auto', padding: '.6rem 1.5rem' }}>
            {savingService ? <><div className="spinner" /> Saving…</> : <><Save size={16} /> Save Service</>}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}