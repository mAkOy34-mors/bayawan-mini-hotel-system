// receptionist/ReceptionServiceList.jsx
import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { SHARED_CSS, Spinner, useToast, Toast } from '../admin/adminShared';
import { API_BASE } from '../constants/config';
import { 
  ClipboardList, Search, RefreshCw, UserCheck, 
  Clock, CheckCircle, AlertCircle, Filter,
  Phone, Mail, Building, Calendar, Sparkles,
  Wrench, Shirt, Package, Bed, Bath, Coffee, Tv
} from 'lucide-react';

// Map service types to departments for assignment
const getDepartmentForService = (serviceType) => {
  const mapping = {
    'CLEANING': 'HOUSEKEEPING',
    'MAINTENANCE': 'MAINTENANCE',
    'LAUNDRY': 'HOUSEKEEPING',
    'DELIVERY': 'FRONT_DESK',
    'EXTRA_PILLOWS': 'HOUSEKEEPING',
    'EXTRA_TOWELS': 'HOUSEKEEPING',
    'MINI_BAR': 'FRONT_DESK',
    'TECH_SUPPORT': 'MAINTENANCE',
    'OTHER': 'FRONT_DESK',
  };
  return mapping[serviceType] || 'FRONT_DESK';
};

// Get service icon
const getServiceIcon = (type) => {
  const icons = {
    'CLEANING': <Sparkles size={16} />,
    'MAINTENANCE': <Wrench size={16} />,
    'LAUNDRY': <Shirt size={16} />,
    'DELIVERY': <Package size={16} />,
    'EXTRA_PILLOWS': <Bed size={16} />,
    'EXTRA_TOWELS': <Bath size={16} />,
    'MINI_BAR': <Coffee size={16} />,
    'TECH_SUPPORT': <Tv size={16} />,
  };
  return icons[type] || <Sparkles size={16} />;
};

// Get service type label
const getServiceTypeLabel = (type) => {
  const labels = {
    'CLEANING': 'Cleaning',
    'MAINTENANCE': 'Maintenance',
    'LAUNDRY': 'Laundry',
    'DELIVERY': 'Delivery',
    'EXTRA_PILLOWS': 'Extra Pillows',
    'EXTRA_TOWELS': 'Extra Towels',
    'MINI_BAR': 'Mini Bar',
    'TECH_SUPPORT': 'Tech Support',
    'OTHER': 'Other',
  };
  return labels[type] || type;
};

export function ReceptionServiceList({ token }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [showAssign, setShowAssign] = useState(false);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [stats, setStats] = useState({ pending: 0, in_progress: 0, completed: 0, total: 0 });
  const { toast, show } = useToast();

  const loadServices = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/services/reception/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
        setStats(data.stats || {});
      } else {
        console.error('Failed to load services:', response.status);
        show('Failed to load service requests', 'error');
      }
    } catch (error) {
      console.error('Failed to load services:', error);
      show('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableStaffForService = async (serviceType) => {
    const department = getDepartmentForService(serviceType);
    setLoadingStaff(true);
    try {
      console.log(`Loading staff for department: ${department}`);
      const response = await fetch(`${API_BASE}/staff/available/?department=${department}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        console.log(`Found ${data.length} staff for ${department}:`, data);
        setAvailableStaff(data);
        if (data.length === 0) {
          show(`No staff available for ${getServiceTypeLabel(serviceType)}. Please add staff to ${department} department.`, 'warning');
        }
      } else {
        console.error('Failed to load staff:', response.status);
        setAvailableStaff([]);
      }
    } catch (error) {
      console.error('Failed to load staff:', error);
      setAvailableStaff([]);
    } finally {
      setLoadingStaff(false);
    }
  };

  const assignService = async () => {
    if (!selectedService || !selectedService.assigned_to_id) {
      show('Please select a staff member to assign', 'error');
      return;
    }
    setAssigning(true);
    try {
      const response = await fetch(`${API_BASE}/services/reception/${selectedService.id}/assign/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ assigned_to: selectedService.assigned_to_id })
      });
      if (response.ok) {
        show('Service request assigned successfully!', 'success');
        loadServices();
        setShowAssign(false);
        setSelectedService(null);
      } else {
        const error = await response.json();
        show(error.error || 'Failed to assign', 'error');
      }
    } catch (error) {
      console.error('Failed to assign:', error);
      show('Network error. Please try again.', 'error');
    } finally {
      setAssigning(false);
    }
  };

  const updateServiceStatus = async (serviceId, status) => {
    try {
      const response = await fetch(`${API_BASE}/services/tasks/${serviceId}/status/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        show(`Service request marked as ${status}`, 'success');
        loadServices();
      } else {
        const error = await response.json();
        show(error.error || 'Failed to update status', 'error');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      show('Network error. Please try again.', 'error');
    }
  };

  const openAssignModal = (service) => {
    setSelectedService(service);
    loadAvailableStaffForService(service.service_type);
    setShowAssign(true);
  };

  useEffect(() => {
    if (token) {
      loadServices();
    }
  }, [token]);

  const getStatusBadge = (status) => {
    const config = {
      'PENDING': { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: <Clock size={12} />, label: 'Pending' },
      'IN_PROGRESS': { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: <AlertCircle size={12} />, label: 'In Progress' },
      'COMPLETED': { color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: <CheckCircle size={12} />, label: 'Completed' },
      'CANCELLED': { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: <AlertCircle size={12} />, label: 'Cancelled' },
    };
    return config[status] || config['PENDING'];
  };

  const getPriorityBadge = (priority) => {
    const config = {
      'URGENT': { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
      'HIGH': { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
      'MEDIUM': { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
      'LOW': { color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    };
    return config[priority] || config['MEDIUM'];
  };

  const filteredServices = services.filter(s => {
    if (filter !== 'ALL' && s.status !== filter) return false;
    if (typeFilter && s.service_type !== typeFilter) return false;
    if (search && !s.guest_name?.toLowerCase().includes(search.toLowerCase()) && 
        !s.room_number?.includes(search)) return false;
    return true;
  });

  return (
    <div className="ap-root">
      <style>{SHARED_CSS}</style>
      <Toast toast={toast} />

      <div className="ap-hd">
        <div>
          <h1 className="ap-title" style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <ClipboardList size={22} color="var(--gold-dark)" />
            Service Requests
          </h1>
          <p className="ap-sub">Manage guest service requests and assign to staff</p>
        </div>
        <button className="ap-btn-ghost" onClick={loadServices}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="ap-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="ap-stat orange">
          <div className="ap-stat-val">{stats.pending}</div>
          <div className="ap-stat-lbl">Pending</div>
        </div>
        <div className="ap-stat blue">
          <div className="ap-stat-val">{stats.in_progress}</div>
          <div className="ap-stat-lbl">In Progress</div>
        </div>
        <div className="ap-stat green">
          <div className="ap-stat-val">{stats.completed}</div>
          <div className="ap-stat-lbl">Completed</div>
        </div>
        <div className="ap-stat gold">
          <div className="ap-stat-val">{stats.total}</div>
          <div className="ap-stat-lbl">Total</div>
        </div>
      </div>

      {/* Filters */}
      <div className="ap-toolbar">
        <div className="ap-search-wrap">
          <Search size={14} className="ap-search-ico" />
          <input
            className="ap-search"
            placeholder="Search by guest name or room..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="ap-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select className="ap-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="CLEANING">Cleaning</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="LAUNDRY">Laundry</option>
          <option value="DELIVERY">Delivery</option>
          <option value="EXTRA_PILLOWS">Extra Pillows</option>
          <option value="EXTRA_TOWELS">Extra Towels</option>
          <option value="MINI_BAR">Mini Bar</option>
          <option value="TECH_SUPPORT">Tech Support</option>
        </select>
      </div>

      {/* Services Table */}
      <div className="ap-panel">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Spinner />
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="ap-empty">
            <div className="ap-empty-ico"><ClipboardList size={48} strokeWidth={1} /></div>
            <div className="ap-empty-title">No service requests found</div>
            <div className="ap-empty-sub">Guest service requests will appear here</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="ap-tbl">
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Room</th>
                  <th>Service</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map(service => {
                  const statusBadge = getStatusBadge(service.status);
                  const priorityBadge = getPriorityBadge(service.priority);
                  return (
                    <tr key={service.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{service.guest_name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{service.guest_email}</div>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--gold-dark)' }}>#{service.room_number}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          {getServiceIcon(service.service_type)}
                          <span>{getServiceTypeLabel(service.service_type)}</span>
                        </div>
                        {service.description && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: 250 }}>
                            {service.description.length > 60 ? service.description.substring(0, 60) + '...' : service.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: 99,
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          background: priorityBadge.bg,
                          color: priorityBadge.color
                        }}>
                          {service.priority_label || service.priority || 'MEDIUM'}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.2rem 0.6rem',
                          borderRadius: 99,
                          background: statusBadge.bg,
                          color: statusBadge.color,
                          fontSize: '0.7rem',
                          fontWeight: 600
                        }}>
                          {statusBadge.icon} {statusBadge.label}
                        </span>
                      </td>
                      <td>
                        {service.assigned_to_name || '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                          {service.status === 'PENDING' && (
                            <button
                              className="ap-btn-primary"
                              style={{ padding: '0.25rem 0.7rem', fontSize: '0.7rem' }}
                              onClick={() => openAssignModal(service)}
                            >
                              <UserCheck size={12} /> Assign
                            </button>
                          )}
                          {service.status === 'IN_PROGRESS' && (
                            <button
                              className="ap-btn-green"
                              style={{ padding: '0.25rem 0.7rem', fontSize: '0.7rem' }}
                              onClick={() => updateServiceStatus(service.id, 'COMPLETED')}
                            >
                              <CheckCircle size={12} /> Complete
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
        )}
      </div>

      {/* Assign Modal */}
      <Modal show={showAssign} onHide={() => { setShowAssign(false); setSelectedService(null); }} centered className="ap-modal">
        <Modal.Header closeButton>
          <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <UserCheck size={18} /> Assign Service Request
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedService && (
            <>
              <div style={{ 
                background: 'var(--surface2)', 
                padding: '0.85rem', 
                borderRadius: 10, 
                marginBottom: '1rem',
                borderLeft: '3px solid var(--gold)'
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{getServiceTypeLabel(selectedService.service_type)}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  <strong>Room {selectedService.room_number}</strong> • Guest: {selectedService.guest_name}
                </div>
                {selectedService.description && (
                  <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)', color: 'var(--text-sub)' }}>
                    <strong>Description:</strong> {selectedService.description}
                  </div>
                )}
              </div>
              <div className="ap-field">
                <label className="ap-label">Assign To</label>
                {loadingStaff ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem' }}>
                    <Spinner /> Loading staff...
                  </div>
                ) : availableStaff.length === 0 ? (
                  <div style={{ 
                    padding: '0.75rem', 
                    background: 'rgba(239,68,68,0.1)', 
                    borderRadius: 8, 
                    color: '#ef4444',
                    fontSize: '0.75rem',
                    textAlign: 'center'
                  }}>
                    No staff available for {getServiceTypeLabel(selectedService.service_type)}.
                    Please add staff to {getDepartmentForService(selectedService.service_type)} department.
                  </div>
                ) : (
                  <select
                    className="ap-select"
                    value={selectedService.assigned_to_id || ''}
                    onChange={e => setSelectedService({ ...selectedService, assigned_to_id: parseInt(e.target.value) })}
                  >
                    <option value="">Select staff...</option>
                    {availableStaff.map(staff => (
                      <option key={staff.id} value={staff.id}>
                        {staff.full_name || staff.username} - {staff.department}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className="ap-btn-ghost" onClick={() => { setShowAssign(false); setSelectedService(null); }}>Cancel</button>
          <button 
            className="ap-btn-primary" 
            disabled={assigning || loadingStaff || !selectedService?.assigned_to_id || availableStaff.length === 0} 
            onClick={assignService}
          >
            {assigning ? <><div className="ap-spin-sm" /> Assigning...</> : 'Assign Task'}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}