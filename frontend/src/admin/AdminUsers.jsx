// AdminUsers.jsx - Complete working version with Lucide icons and scrollable form
import { useState, useEffect, useCallback, useRef } from 'react';
import { Modal } from 'react-bootstrap';
import { 
  Users, UserPlus, Edit2, Trash2, UserCheck, UserX,
  Search, RefreshCw, AlertTriangle, Eye, EyeOff,
  Mail, Phone, MapPin, Briefcase, Calendar, CreditCard,
  Building2, BadgeIndianRupee, Hash, UserCircle, Shield,
  CheckCircle, XCircle, Clock, Save, X, Plus, Coffee
} from 'lucide-react';
import { SHARED_CSS, fmtDate, Pill, Spinner, Pager, Toast, useToast } from './adminShared';
import { API_BASE } from '../constants/config';

const PAGE_SIZE = 10;

const ROLE_OPTIONS = [
  { value: 'RECEPTIONIST', label: 'Receptionist', icon: <Phone size={14} />, color: '#3b82f6' },
  { value: 'HOUSEKEEPER', label: 'Housekeeper', icon: <Building2 size={14} />, color: '#10b981' },
  { value: 'STAFF', label: 'Staff', icon: <Briefcase size={14} />, color: '#f59e0b' },
  { value: 'ADMIN', label: 'Admin', icon: <Shield size={14} />, color: '#dc2626' },
];

const DEPARTMENT_OPTIONS = [
  { value: 'FRONT_DESK', label: 'Front Desk', icon: <Phone size={14} /> },
  { value: 'HOUSEKEEPING', label: 'Housekeeping', icon: <Building2 size={14} /> },
  { value: 'MAINTENANCE', label: 'Maintenance', icon: <Briefcase size={14} /> },
  { value: 'SECURITY', label: 'Security', icon: <Shield size={14} /> },
  { value: 'FOOD_BEVERAGE', label: 'Food & Beverage', icon: <Coffee size={14} /> },
  { value: 'MANAGEMENT', label: 'Management', icon: <Users size={14} /> },
  { value: 'ADMIN', label: 'Administration', icon: <Shield size={14} /> },
];

const EMPTY_USER = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'STAFF',
  isActive: true,
  firstName: '',
  lastName: '',
  contactNumber: '',
  employeeId: '',
  department: '',
  position: '',
  hireDate: new Date().toISOString().split('T')[0],
};

export function AdminUsers({ token }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(EMPTY_USER);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const { toast, show } = useToast();
  
  const hasLoadedRef = useRef(false);

  // Load users from API
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/admin/users/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : []);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Error loading users:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load only once on mount
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadUsers();
    }
  }, [loadUsers]);

  // Filter users
  const filteredUsers = (users || []).filter(user => {
    const matchSearch = !search || 
      (user.username || '').toLowerCase().includes(search.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (user.firstName || '').toLowerCase().includes(search.toLowerCase()) ||
      (user.lastName || '').toLowerCase().includes(search.toLowerCase()) ||
      (user.employeeId || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || user.role === roleFilter;
    const matchStatus = !statusFilter || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);
    return matchSearch && matchRole && matchStatus;
  });

  const visibleUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Stats
  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
    receptionists: users.filter(u => u.role === 'RECEPTIONIST').length,
    housekeepers: users.filter(u => u.role === 'HOUSEKEEPER').length,
    staff: users.filter(u => u.role === 'STAFF').length,
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!form.username) errors.username = 'Username is required';
    if (!form.email) errors.email = 'Email is required';
    if (!form.email.includes('@')) errors.email = 'Invalid email format';
    if (!editingUser && !form.password) errors.password = 'Password is required';
    if (!editingUser && form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    if (form.password && form.password.length < 6) errors.password = 'Password must be at least 6 characters';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create or update user
  const saveUser = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      const payload = {
        username: form.username,
        email: form.email,
        role: form.role,
        isActive: form.isActive,
        firstName: form.firstName,
        lastName: form.lastName,
        contactNumber: form.contactNumber,
        employeeId: form.employeeId,
        department: form.department,
        position: form.position,
        hireDate: form.hireDate,
      };
      
      if (!editingUser) {
        payload.password = form.password;
      }
      
      let url, method;
      if (editingUser) {
        url = `${API_BASE}/admin/users/${editingUser.id}/`;
        method = 'PUT';
      } else {
        url = `${API_BASE}/admin/users/create/`;
        method = 'POST';
      }
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        show(editingUser ? 'User updated successfully' : 'User created successfully');
        setShowForm(false);
        hasLoadedRef.current = false;
        loadUsers();
        resetForm();
      } else {
        const error = await response.json();
        show(error.error || error.message || 'Failed to save user', 'error');
      }
    } catch (err) {
      console.error('Error saving user:', err);
      show('Failed to save user', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Toggle user status
  const toggleUserStatus = async (user) => {
    try {
      const response = await fetch(`${API_BASE}/admin/users/${user.id}/toggle-status/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !user.isActive })
      });
      
      if (response.ok) {
        show(`${user.username} ${user.isActive ? 'disabled' : 'enabled'} successfully`);
        hasLoadedRef.current = false;
        loadUsers();
      } else {
        const error = await response.json();
        show(error.error || error.message || 'Failed to update user status', 'error');
      }
    } catch (err) {
      console.error('Error toggling user status:', err);
      show('Failed to update user status', 'error');
    }
  };

  // Delete user
  const deleteUser = async () => {
    if (!showDelete) return;
    
    try {
      const response = await fetch(`${API_BASE}/admin/users/${showDelete.id}/delete/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        show(`User ${showDelete.username} deleted successfully`);
        setShowDelete(null);
        hasLoadedRef.current = false;
        loadUsers();
      } else {
        const error = await response.json();
        show(error.error || error.message || 'Failed to delete user', 'error');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      show('Failed to delete user', 'error');
    }
  };

  // Reset form
  const resetForm = () => {
    setForm(EMPTY_USER);
    setEditingUser(null);
    setFormErrors({});
    setShowPassword(false);
  };

  // Open edit modal
  const openEdit = (user) => {
    setEditingUser(user);
    setForm({
      username: user.username || '',
      email: user.email || '',
      password: '',
      confirmPassword: '',
      role: user.role || 'STAFF',
      isActive: user.isActive !== undefined ? user.isActive : true,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      contactNumber: user.contactNumber || '',
      employeeId: user.employeeId || '',
      department: user.department || '',
      position: user.position || '',
      hireDate: user.hireDate || new Date().toISOString().split('T')[0],
    });
    setFormErrors({});
    setShowForm(true);
  };

  // Open create modal
  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const getRoleIcon = (role) => {
    const r = ROLE_OPTIONS.find(opt => opt.value === role);
    return r ? r.icon : <UserCircle size={14} />;
  };

  const getRoleColor = (role) => {
    const r = ROLE_OPTIONS.find(opt => opt.value === role);
    return r ? r.color : '#8a96a8';
  };

  // Show loading spinner while loading
  if (loading) {
    return (
      <div className="ap-root">
        <style>{SHARED_CSS}</style>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
          <Spinner />
          <div style={{ color: 'var(--text-muted)' }}>Loading employees...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="ap-root">
      <style>{SHARED_CSS}</style>
      <Toast toast={toast} />

      {/* Header */}
      <div className="ap-hd">
        <div>
          <h1 className="ap-title">User Management</h1>
          <p className="ap-sub">Manage employees (Receptionists, Housekeepers, Staff)</p>
        </div>
        <button className="ap-btn-primary" onClick={openCreate}>
          <UserPlus size={16} /> Add Employee
        </button>
      </div>

      {/* Stats Cards */}
      <div className="ap-stats" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
        {[
          { icon: <Users size={20} />, label: 'Total Employees', value: stats.total, color: 'blue' },
          { icon: <CheckCircle size={20} />, label: 'Active', value: stats.active, color: 'green' },
          { icon: <XCircle size={20} />, label: 'Inactive', value: stats.inactive, color: 'red' },
          { icon: <Phone size={20} />, label: 'Receptionists', value: stats.receptionists, color: 'teal' },
          { icon: <Building2 size={20} />, label: 'Housekeepers', value: stats.housekeepers, color: 'purple' },
          { icon: <Briefcase size={20} />, label: 'Staff', value: stats.staff, color: 'orange' },
        ].map((s, i) => (
          <div key={i} className={`ap-stat ${s.color}`}>
            <div className="ap-stat-icon">{s.icon}</div>
            <div className="ap-stat-lbl">{s.label}</div>
            <div className="ap-stat-val">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="ap-toolbar">
        <div className="ap-search-wrap">
          <Search size={14} className="ap-search-ico" />
          <input
            className="ap-search"
            placeholder="Search by name, email, employee ID..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="ap-select" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          {ROLE_OPTIONS.map(role => (
            <option key={role.value} value={role.value}>
              {role.icon} {role.label}
            </option>
          ))}
        </select>
        <select className="ap-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button className="ap-btn-ghost" onClick={() => { hasLoadedRef.current = false; loadUsers(); }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Users Table */}
      <div className="ap-panel">
        <div className="ap-panel-hd">
          <div>
            <div className="ap-panel-title">Employee Directory</div>
            <div className="ap-panel-sub">{filteredUsers.length} employees found</div>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="ap-empty">
            <div className="ap-empty-ico"><Users size={48} strokeWidth={1} /></div>
            <div className="ap-empty-title">No employees found</div>
            <div className="ap-empty-sub">Click "Add Employee" to create a new employee record</div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="ap-tbl">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Employee ID</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map(user => (
                    <tr key={user.id} style={{ opacity: user.isActive ? 1 : 0.6 }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: `linear-gradient(135deg, ${getRoleColor(user.role)}40, ${getRoleColor(user.role)}20)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {getRoleIcon(user.role)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                              {user.firstName} {user.lastName}
                            </div>
                            <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>
                              <UserCircle size={10} style={{ display: 'inline', marginRight: '.2rem' }} />@{user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '.78rem', fontWeight: 600, color: 'var(--gold-dark)' }}>
                        <Hash size={12} style={{ display: 'inline', marginRight: '.2rem' }} />
                        {user.employeeId || '—'}
                      </td>
                      <td>
                        <Mail size={12} style={{ display: 'inline', marginRight: '.2rem', color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: '.78rem', color: 'var(--text-sub)' }}>{user.email}</span>
                       </td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '.3rem',
                          padding: '.2rem .6rem', borderRadius: 99,
                          background: `${getRoleColor(user.role)}15`,
                          color: getRoleColor(user.role),
                          fontSize: '.72rem', fontWeight: 600
                        }}>
                          {getRoleIcon(user.role)} {user.role?.charAt(0) + user.role?.slice(1).toLowerCase()}
                        </span>
                       </td>
                      <td>
                        <Building2 size={12} style={{ display: 'inline', marginRight: '.2rem', color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: '.78rem' }}>{user.department?.replace('_', ' ') || '—'}</span>
                       </td>
                      <td><Pill status={user.isActive ? 'active' : 'inactive'} label={user.isActive ? 'Active' : 'Inactive'} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: '.4rem' }}>
                          <button className="ap-btn-ghost" style={{ padding: '.28rem .6rem', fontSize: '.72rem' }} onClick={() => openEdit(user)}>
                            <Edit2 size={13} /> Edit
                          </button>
                          <button 
                            className={user.isActive ? 'ap-btn-red' : 'ap-btn-green'}
                            style={{ padding: '.28rem .6rem', fontSize: '.72rem' }}
                            onClick={() => toggleUserStatus(user)}
                          >
                            {user.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                            {user.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button 
                            className="ap-btn-red" 
                            style={{ padding: '.28rem .6rem', fontSize: '.72rem' }}
                            onClick={() => setShowDelete(user)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                       </td>
                     </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={page} total={filteredUsers.length} size={PAGE_SIZE} setPage={setPage} />
          </>
        )}
      </div>

      {/* Create/Edit User Modal with Scrollable Body */}
      <Modal show={showForm} onHide={() => { setShowForm(false); resetForm(); }} size="lg" centered className="ap-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingUser ? <Edit2 size={16} /> : <UserPlus size={16} />}
            {editingUser ? ' Edit Employee' : ' Add New Employee'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ 
          maxHeight: '70vh', 
          overflowY: 'auto',
          padding: '1.5rem',
          scrollbarWidth: 'thin'
        }}>
          <div className="ap-form-grid">
            <div className="ap-field">
              <label className="ap-label"><UserCircle size={12} /> First Name</label>
              <input 
                className="ap-input"
                value={form.firstName}
                onChange={e => setForm({ ...form, firstName: e.target.value })}
              />
            </div>
            <div className="ap-field">
              <label className="ap-label"><UserCircle size={12} /> Last Name</label>
              <input 
                className="ap-input"
                value={form.lastName}
                onChange={e => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
          </div>

          <div className="ap-form-grid">
            <div className="ap-field">
              <label className="ap-label"><UserCircle size={12} /> Username <span className="req">*</span></label>
              <input 
                className={`ap-input ${formErrors.username ? 'error' : ''}`}
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
              />
              {formErrors.username && <span style={{ fontSize: '.7rem', color: '#dc3545' }}>{formErrors.username}</span>}
            </div>
            <div className="ap-field">
              <label className="ap-label"><Mail size={12} /> Email <span className="req">*</span></label>
              <input 
                className={`ap-input ${formErrors.email ? 'error' : ''}`}
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
              {formErrors.email && <span style={{ fontSize: '.7rem', color: '#dc3545' }}>{formErrors.email}</span>}
            </div>
          </div>

          <div className="ap-form-grid">
            <div className="ap-field">
              <label className="ap-label"><Shield size={12} /> Role <span className="req">*</span></label>
              <select 
                className="ap-sel"
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
              >
                {ROLE_OPTIONS.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.icon} {role.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="ap-field">
              <label className="ap-label"><Building2 size={12} /> Department</label>
              <input 
                className="ap-input"
                value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })}
                placeholder="e.g., FRONT_DESK"
              />
            </div>
          </div>

          <div className="ap-form-grid">
            <div className="ap-field">
              <label className="ap-label"><Phone size={12} /> Contact Number</label>
              <input 
                className="ap-input"
                value={form.contactNumber}
                onChange={e => setForm({ ...form, contactNumber: e.target.value })}
                placeholder="+63 912 345 6789"
              />
            </div>
            <div className="ap-field">
              <label className="ap-label"><Hash size={12} /> Employee ID</label>
              <input 
                className="ap-input"
                value={form.employeeId}
                onChange={e => setForm({ ...form, employeeId: e.target.value })}
                placeholder="Auto-generated"
              />
            </div>
          </div>

          <div className="ap-form-grid">
            <div className="ap-field">
              <label className="ap-label"><Briefcase size={12} /> Position</label>
              <input 
                className="ap-input"
                value={form.position}
                onChange={e => setForm({ ...form, position: e.target.value })}
                placeholder="e.g., Senior Receptionist"
              />
            </div>
            <div className="ap-field">
              <label className="ap-label"><Calendar size={12} /> Hire Date</label>
              <input 
                type="date"
                className="ap-input"
                value={form.hireDate}
                onChange={e => setForm({ ...form, hireDate: e.target.value })}
              />
            </div>
          </div>

          <div className="ap-form-grid">
            <div className="ap-field">
              <label className="ap-label">
                <Eye size={12} /> {editingUser ? 'New Password (optional)' : 'Password <span class="req">*</span>'}
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  className={`ap-input ${formErrors.password ? 'error' : ''}`}
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder={editingUser ? 'Leave blank to keep current' : 'Enter password'}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {formErrors.password && <span style={{ fontSize: '.7rem', color: '#dc3545' }}>{formErrors.password}</span>}
            </div>
            <div className="ap-field">
              <label className="ap-label"><CheckCircle size={12} /> Confirm Password</label>
              <input 
                className={`ap-input ${formErrors.confirmPassword ? 'error' : ''}`}
                type="password"
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              />
              {formErrors.confirmPassword && <span style={{ fontSize: '.7rem', color: '#dc3545' }}>{formErrors.confirmPassword}</span>}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.75rem 1rem', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)', marginTop: '.5rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '.84rem', fontWeight: 600, color: 'var(--text)' }}>Account Status</div>
              <div style={{ fontSize: '.71rem', color: 'var(--text-muted)' }}>Enable or disable this user's account</div>
            </div>
            <button 
              onClick={() => setForm({ ...form, isActive: !form.isActive })}
              style={{
                width: 42, height: 24, borderRadius: 99, border: 'none', cursor: 'pointer',
                position: 'relative', transition: 'background .22s',
                background: form.isActive ? 'linear-gradient(135deg,#9a7a2e,#C9A84C)' : '#e2e8f0'
              }}
            >
              <div style={{
                position: 'absolute', top: 3, left: form.isActive ? 21 : 3,
                width: 18, height: 18, borderRadius: '50%', background: '#fff',
                transition: 'left .22s'
              }} />
            </button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="ap-btn-ghost" onClick={() => { setShowForm(false); resetForm(); }}>
            <X size={14} /> Cancel
          </button>
          <button className="ap-btn-primary" disabled={saving} onClick={saveUser}>
            {saving ? <><div className="ap-spin-sm" />Saving...</> : editingUser ? <Save size={14} /> : <Plus size={14} />}
            {saving ? ' Saving...' : editingUser ? ' Save Changes' : ' Create Employee'}
          </button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={!!showDelete} onHide={() => setShowDelete(null)} centered className="ap-modal">
        <Modal.Header closeButton>
          <Modal.Title><AlertTriangle size={16} /> Delete Employee</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ textAlign: 'center', padding: '.5rem 0' }}>
            <AlertTriangle size={48} style={{ marginBottom: '.75rem', opacity: 0.5, color: '#dc3545' }} />
            <p>Are you sure you want to delete <strong>{showDelete?.firstName} {showDelete?.lastName}</strong>?</p>
            <p style={{ fontSize: '.75rem', color: '#8a96a8' }}>This action cannot be undone.</p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="ap-btn-ghost" onClick={() => setShowDelete(null)}>Cancel</button>
          <button className="ap-btn-red" onClick={deleteUser}>
            <Trash2 size={14} /> Delete Employee
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}