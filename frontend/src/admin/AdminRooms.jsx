// AdminRooms.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { Modal } from 'react-bootstrap';
import { adminGetRooms, adminCreateRoom, adminUpdateRoom, adminDeleteRoom } from './adminApi';
import { SHARED_CSS, fmt, fmtDate, Pill, Skel, Spinner, Pager, Toast, useToast } from './adminShared';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { API_BASE } from '../constants/config';

const PAGE_SIZE = 9;
const ROOM_TYPES = ['STANDARD', 'DELUXE', 'SUITE', 'FAMILY', 'PENTHOUSE', 'VILLA'];
const TYPE_COLORS = { 
  STANDARD: '#6366f1', 
  DELUXE: '#0ea5e9', 
  SUITE: '#10b981', 
  FAMILY: '#f59e0b', 
  PENTHOUSE: '#C9A84C', 
  VILLA: '#ef4444' 
};
const AMENITY_OPTS = ['WiFi', 'Air Conditioning', 'TV', 'Mini Bar', 'Jacuzzi', 'Sea View', 'Pool Access', 'Balcony', 'Breakfast', 'King Bed', 'Twin Beds', 'Safe'];

const EMPTY_FORM = { 
  roomNumber: '', 
  roomType: 'STANDARD', 
  description: '', 
  pricePerNight: '', 
  maxOccupancy: 2, 
  available: true, 
  amenities: '', 
  imageUrl: '',
  imageFile: null
};

export function AdminRooms({ token }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showDel, setShowDel] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const { toast, show } = useToast();

  // Helper function to get full image URL
  const getFullImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    // Remove /api/v1 from API_BASE to get the base URL
    const baseUrl = API_BASE.replace('/api/v1', '');
    return `${baseUrl}${imageUrl}`;
  };

  const load = useCallback(async () => {
    setLoading(true);
    const data = await adminGetRooms(token).catch(() => []);
    setRooms(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const filtered = rooms.filter(r =>
    (!filter || r.roomType === filter) &&
    (!search || r.roomNumber?.toLowerCase().includes(search.toLowerCase()) || r.roomType?.toLowerCase().includes(search.toLowerCase()))
  );
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (r) => {
    const imageUrl = r.imageUrl || r.image_url || '';
    setForm({
      roomNumber: r.roomNumber || r.room_number || '',
      roomType: r.roomType || r.room_type || 'STANDARD',
      description: r.description || '',
      pricePerNight: r.pricePerNight || r.price_per_night || '',
      maxOccupancy: r.maxOccupancy || r.max_occupancy || 2,
      available: r.available !== undefined ? r.available : true,
      amenities: Array.isArray(r.amenities) ? r.amenities.join(',') : (r.amenities || ''),
      imageUrl: imageUrl,
      imageFile: null
    });
    // Show preview with full URL
    setImagePreview(imageUrl ? getFullImageUrl(imageUrl) : null);
    setEditing(r.id);
    setShowForm(true);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        show('Please select an image file', 'error');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        show('Image size should be less than 5MB', 'error');
        return;
      }
      setForm({ ...form, imageFile: file, imageUrl: '' });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const save = async () => {
    // Validation
    if (!form.roomNumber || !form.roomNumber.trim()) {
      show('Room number is required', 'error');
      return;
    }
    
    if (!form.pricePerNight || parseFloat(form.pricePerNight) <= 0) {
      show('Valid price per night is required', 'error');
      return;
    }
    
    if (!form.roomType) {
      show('Room type is required', 'error');
      return;
    }
    
    setSaving(true);
    try {
      const priceValue = parseFloat(form.pricePerNight);
      const occupancyValue = parseInt(form.maxOccupancy);
      
      let amenitiesValue = null;
      if (form.amenities && form.amenities.trim()) {
        amenitiesValue = form.amenities.split(',').map(s => s.trim()).filter(Boolean).join(',');
      }
      
      // Prepare payload - exclude imageFile as it's handled separately
      const payload = {
        roomNumber: form.roomNumber.trim(),
        roomType: form.roomType,
        description: form.description || null,
        pricePerNight: priceValue,
        maxOccupancy: occupancyValue,
        available: form.available,
        amenities: amenitiesValue,
      };
      
      // Only include imageUrl if it's from an external URL (not a local file)
      if (form.imageUrl && !form.imageFile) {
        payload.imageUrl = form.imageUrl;
      }
      
      console.log('Saving room:', payload);
      
      let url, method;
      let roomId = editing;
      
      if (editing) {
        url = `${API_BASE}/admin/rooms/${editing}/`;
        method = 'PUT';
      } else {
        url = `${API_BASE}/admin/rooms/`;
        method = 'POST';
      }
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      let responseData;
      const responseText = await response.text();
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { message: responseText || 'Unknown error' };
      }
      
      console.log('Room save response:', response.status, responseData);
      
      if (response.ok) {
        // Get the room ID for new rooms
        if (!editing && responseData.id) {
          roomId = responseData.id;
        }
        
        // If there's a local image file, upload it now
        if (form.imageFile && roomId) {
          console.log('Uploading image for room:', roomId);
          setUploadingImage(true);
          
          const uploadFormData = new FormData();
          uploadFormData.append('image', form.imageFile);
          
          const uploadResponse = await fetch(`${API_BASE}/admin/rooms/${roomId}/upload-image/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: uploadFormData
          });
          
          const uploadData = await uploadResponse.json();
          console.log('Upload response:', uploadData);
          
          if (uploadResponse.ok && uploadData.image_url) {
            show(editing ? 'Room updated with image successfully' : 'Room created with image successfully');
          } else {
            show(editing ? 'Room updated but image upload failed' : 'Room created but image upload failed', 'warning');
          }
        } else {
          show(editing ? 'Room updated successfully' : 'Room created successfully');
        }
        
        setShowForm(false);
        await load(); // Reload the rooms list
        resetForm();
      } else {
        // Handle error
        let errorMessage = '';
        if (responseData.message) {
          errorMessage = responseData.message;
        } else if (responseData.error) {
          errorMessage = responseData.error;
        } else if (typeof responseData === 'object') {
          const errors = [];
          for (const [field, error] of Object.entries(responseData)) {
            errors.push(`${field}: ${error}`);
          }
          errorMessage = errors.join(', ');
        } else {
          errorMessage = `Failed to save room (Status: ${response.status})`;
        }
        
        if (errorMessage.toLowerCase().includes('unique') || errorMessage.toLowerCase().includes('already exists')) {
          errorMessage = `Room number "${form.roomNumber}" already exists. Please use a different room number.`;
        }
        
        show(errorMessage, 'error');
      }
    } catch (err) {
      console.error('Error saving room:', err);
      show(`Error: ${err.message}`, 'error');
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  const doDelete = async (id) => {
    try {
      await adminDeleteRoom(token, id);
      show('Room deleted');
      setShowDel(null);
      load();
    } catch (e) {
      show(e.message, 'error');
      setShowDel(null);
    }
  };

  const toggleAmenity = (a) => {
    const current = form.amenities ? form.amenities.split(',').map(s => s.trim()).filter(Boolean) : [];
    const next = current.includes(a) ? current.filter(x => x !== a) : [...current, a];
    setForm(f => ({ ...f, amenities: next.join(',') }));
  };

  const selectedAmenities = form.amenities ? form.amenities.split(',').map(s => s.trim()).filter(Boolean) : [];

  return (
    <div className="ap-root">
      <style>{SHARED_CSS}</style>
      <style>{`
        .image-preview {
          position: relative;
          display: inline-block;
          margin-top: 10px;
        }
        .image-preview img {
          width: 100px;
          height: 100px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid var(--border);
        }
        .remove-image {
          position: absolute;
          top: -8px;
          right: -8px;
          background: var(--red);
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 12px;
        }
        .upload-area {
          border: 2px dashed var(--border);
          border-radius: 8px;
          padding: 1rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: var(--surface2);
        }
        .upload-area:hover {
          border-color: var(--gold);
          background: var(--gold-bg);
        }
        .modal-scrollable-body {
          max-height: 65vh;
          overflow-y: auto;
          padding: 1.5rem;
          scrollbar-width: thin;
          scrollbar-color: rgba(201,168,76,0.3) #f0f0f0;
        }
        .modal-scrollable-body::-webkit-scrollbar {
          width: 5px;
        }
        .modal-scrollable-body::-webkit-scrollbar-track {
          background: #f0f0f0;
          border-radius: 99px;
        }
        .modal-scrollable-body::-webkit-scrollbar-thumb {
          background: rgba(201,168,76,0.4);
          border-radius: 99px;
        }
      `}</style>
      <Toast toast={toast} />

      <div className="ap-hd">
        <div><h1 className="ap-title">Rooms</h1><p className="ap-sub">Manage hotel room listings</p></div>
        <button className="ap-btn-primary" onClick={openCreate}>＋ Add Room</button>
      </div>

      {/* Type filter chips */}
      <div style={{ display: 'flex', gap: '.45rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
        {['', ...ROOM_TYPES].map(t => (
          <button key={t || 'all'} onClick={() => { setFilter(t); setPage(1); }}
            style={{
              padding: '.32rem .82rem', borderRadius: 99, fontFamily: "'DM Sans',sans-serif", fontSize: '.73rem', fontWeight: 600, cursor: 'pointer', transition: 'all .18s',
              background: filter === t ? `linear-gradient(135deg,${TYPE_COLORS[t] || '#9a7a2e'},${TYPE_COLORS[t] || '#C9A84C'})` : '#fff',
              color: filter === t ? '#fff' : 'var(--text-muted)',
              border: filter === t ? 'none' : '1px solid var(--border)',
              boxShadow: filter === t ? `0 2px 8px ${TYPE_COLORS[t] || '#C9A84C'}40` : 'none',
            }}>
            {t || 'All Types'}
          </button>
        ))}
      </div>

      <div className="ap-panel">
        <div className="ap-panel-hd">
          <div>
            <div className="ap-panel-title">Room Inventory</div>
            <div className="ap-panel-sub">{!loading && `${filtered.length} rooms`}</div>
          </div>
          <div className="ap-toolbar" style={{ margin: 0 }}>
            <div className="ap-search-wrap">
              <span className="ap-search-ico">🔍</span>
              <input className="ap-search" placeholder="Room number or type…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
          </div>
        </div>

        {loading
          ? <div style={{ padding: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.65rem' }}><Spinner /><span style={{ color: 'var(--text-muted)', fontSize: '.78rem' }}>Loading rooms…</span></div>
          : rooms.length === 0
            ? <div className="ap-empty"><div className="ap-empty-ico">🏨</div><div className="ap-empty-title">No rooms yet</div><div className="ap-empty-sub">Click "Add Room" to create the first listing</div><button className="ap-btn-primary" style={{ marginTop: '1rem' }} onClick={openCreate}>＋ Add Room</button></div>
            : <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', padding: '1.25rem' }}>
                {visible.map(r => {
                  const imageFullUrl = getFullImageUrl(r.imageUrl || r.image_url);
                  return (
                    <div key={r.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 5px rgba(0,0,0,.05)', transition: 'transform .2s,box-shadow .2s', position: 'relative' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,.09)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 1px 5px rgba(0,0,0,.05)'; }}>
                      <div style={{ height: 3, background: `linear-gradient(to right,${TYPE_COLORS[r.roomType] || '#C9A84C'},${TYPE_COLORS[r.roomType] || '#C9A84C'}99)` }} />
                      <div style={{ height: 110, background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {imageFullUrl
                          ? <img 
                              src={imageFullUrl} 
                              alt={r.roomType} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<span style="font-size: 2.2rem; opacity: .35;">🏨</span>';
                              }}
                            />
                          : <span style={{ fontSize: '2.2rem', opacity: .35 }}>🏨</span>
                        }
                      </div>
                      <div style={{ padding: '.9rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.45rem' }}>
                          <span style={{ fontSize: '.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-muted)' }}>{r.roomType}</span>
                          <Pill status={r.available ? 'active' : 'inactive'} label={r.available ? 'Available' : 'Unavailable'} />
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--text)', marginBottom: '.35rem' }}>Room #{r.roomNumber}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '.22rem', marginBottom: '.75rem' }}>
                          <div style={{ fontSize: '.75rem', color: 'var(--text-sub)', display: 'flex', gap: '.4rem', alignItems: 'center' }}>
                            <span>💰</span><span style={{ fontWeight: 700, color: 'var(--gold-dark)' }}>{fmt(r.pricePerNight)}</span><span style={{ color: 'var(--text-muted)' }}>/night</span>
                          </div>
                          <div style={{ fontSize: '.75rem', color: 'var(--text-sub)', display: 'flex', gap: '.4rem', alignItems: 'center' }}>
                            <span>👥</span><span>Max {r.maxOccupancy} guests</span>
                          </div>
                        </div>
                        {r.amenities?.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.28rem', marginBottom: '.8rem' }}>
                            {(Array.isArray(r.amenities) ? r.amenities : r.amenities.split(',')).slice(0, 4).map((a, i) => (
                              <span key={i} style={{ fontSize: '.62rem', padding: '.18rem .5rem', borderRadius: 5, background: '#f1f5f9', color: 'var(--text-sub)', border: '1px solid #e2e8f0' }}>{a.trim()}</span>
                            ))}
                            {(Array.isArray(r.amenities) ? r.amenities : r.amenities.split(',')).length > 4 &&
                              <span style={{ fontSize: '.62rem', padding: '.18rem .5rem', borderRadius: 5, background: '#f1f5f9', color: 'var(--text-muted)', border: '1px solid #e2e8f0' }}>+{(Array.isArray(r.amenities) ? r.amenities : r.amenities.split(',')).length - 4}</span>
                            }
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '.4rem', borderTop: '1px solid var(--border)', paddingTop: '.75rem' }}>
                          <button className="ap-btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: '.74rem', padding: '.38rem .5rem' }} onClick={() => openEdit(r)}>✏️ Edit</button>
                          <button className="ap-btn-red" style={{ fontSize: '.74rem', padding: '.38rem .65rem' }} onClick={() => setShowDel(r)}>🗑</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Pager page={page} total={filtered.length} size={PAGE_SIZE} setPage={setPage} />
            </>
        }
      </div>

      {/* Create / Edit Modal */}
      <Modal show={showForm} onHide={() => {
        setShowForm(false);
        resetForm();
      }} size="lg" centered className="ap-modal">
        <Modal.Header closeButton>
          <Modal.Title>{editing ? '✏️ Edit Room' : '＋ Add New Room'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-scrollable-body">
          <div className="ap-form-grid">
            <div className="ap-field">
              <label className="ap-label">Room Number <span className="req">*</span></label>
              <input className="ap-input" value={form.roomNumber} onChange={e => setForm(f => ({ ...f, roomNumber: e.target.value }))} placeholder="e.g. 101" />
            </div>
            <div className="ap-field">
              <label className="ap-label">Room Type <span className="req">*</span></label>
              <select className="ap-sel" value={form.roomType} onChange={e => setForm(f => ({ ...f, roomType: e.target.value }))}>
                {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="ap-form-grid">
            <div className="ap-field">
              <label className="ap-label">Price Per Night (₱) <span className="req">*</span></label>
              <input className="ap-input" type="number" min={0} step={0.01} value={form.pricePerNight} onChange={e => setForm(f => ({ ...f, pricePerNight: e.target.value }))} placeholder="e.g. 2500" />
            </div>
            <div className="ap-field">
              <label className="ap-label">Max Occupancy</label>
              <input className="ap-input" type="number" min={1} max={20} value={form.maxOccupancy} onChange={e => setForm(f => ({ ...f, maxOccupancy: e.target.value }))} />
            </div>
          </div>

          <div className="ap-field" style={{ marginBottom: '.9rem' }}>
            <label className="ap-label">Description</label>
            <textarea className="ap-ta" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief room description…" />
          </div>

          {/* Image Upload Section */}
          <div className="ap-field" style={{ marginBottom: '.9rem' }}>
            <label className="ap-label">Room Image</label>
            <div
              className="upload-area"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={24} color="var(--text-muted)" />
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Click to upload an image
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Supports: JPG, PNG, GIF (Max 5MB)
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageSelect}
            />

            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
                <div
                  className="remove-image"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImagePreview(null);
                    setForm({ ...form, imageFile: null, imageUrl: '' });
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  <X size={14} />
                </div>
              </div>
            )}
          </div>

          {/* Alternative: Image URL input */}
          <div className="ap-field" style={{ marginBottom: '.9rem' }}>
            <label className="ap-label">Or Image URL (optional)</label>
            <input
              className="ap-input"
              value={form.imageUrl}
              onChange={e => {
                setForm(f => ({ ...f, imageUrl: e.target.value, imageFile: null }));
                setImagePreview(e.target.value);
              }}
              placeholder="https://example.com/image.jpg"
            />
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              You can use an external image URL or upload a local image above
            </div>
          </div>

          {/* Amenities picker */}
          <div className="ap-field" style={{ marginBottom: '.9rem' }}>
            <label className="ap-label">Amenities</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.38rem', padding: '.75rem', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)' }}>
              {AMENITY_OPTS.map(a => (
                <button key={a} onClick={() => toggleAmenity(a)}
                  style={{
                    padding: '.28rem .72rem', borderRadius: 99, fontFamily: "'DM Sans',sans-serif", fontSize: '.73rem', fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
                    background: selectedAmenities.includes(a) ? 'linear-gradient(135deg,#9a7a2e,#C9A84C)' : '#fff',
                    color: selectedAmenities.includes(a) ? '#fff' : 'var(--text-muted)',
                    border: selectedAmenities.includes(a) ? 'none' : '1px solid var(--border)',
                  }}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Available toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.75rem 1rem', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '.84rem', fontWeight: 600, color: 'var(--text)' }}>Available for Booking</div>
              <div style={{ fontSize: '.71rem', color: 'var(--text-muted)' }}>Toggle to enable/disable this room from guest bookings</div>
            </div>
            <button onClick={() => setForm(f => ({ ...f, available: !f.available }))}
              style={{ width: 42, height: 24, borderRadius: 99, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .22s', background: form.available ? 'linear-gradient(135deg,#9a7a2e,#C9A84C)' : '#e2e8f0' }}>
              <div style={{ position: 'absolute', top: 3, left: form.available ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .22s', boxShadow: '0 1px 4px rgba(0,0,0,.15)' }} />
            </button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="ap-btn-ghost" onClick={() => {
            setShowForm(false);
            resetForm();
          }}>Cancel</button>
          <button className="ap-btn-primary" disabled={saving || uploadingImage} onClick={save}>
            {saving || uploadingImage ? <><div className="ap-spin-sm" />Saving…</> : editing ? '✓ Save Changes' : '＋ Create Room'}
          </button>
        </Modal.Footer>
      </Modal>

      {/* Delete confirm */}
      <Modal show={!!showDel} onHide={() => setShowDel(null)} centered className="ap-modal">
        <Modal.Header closeButton><Modal.Title>Delete Room</Modal.Title></Modal.Header>
        <Modal.Body>
          <div style={{ textAlign: 'center', padding: '.5rem 0' }}>
            <div style={{ fontSize: '2.2rem', marginBottom: '.65rem' }}>⚠️</div>
            <p style={{ color: 'var(--text-sub)', fontSize: '.85rem' }}>
              Delete <strong>Room #{showDel?.roomNumber} ({showDel?.roomType})</strong>?<br />
              <span style={{ color: 'var(--red)', fontSize: '.8rem' }}>This cannot be undone.</span>
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="ap-btn-ghost" onClick={() => setShowDel(null)}>Cancel</button>
          <button className="ap-btn-red" onClick={() => doDelete(showDel.id)}>🗑 Delete</button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}