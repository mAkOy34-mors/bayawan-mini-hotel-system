// housekeeper/HousekeeperRoomDetail.jsx
import { useState, useEffect } from 'react';
import { ArrowLeft, Wrench, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { updateRoomStatus } from './housekeeperService';
import { ROOM_STATUS, ROOM_STATUS_CONFIG, getStatusOptions } from './roomStatus';

export function HousekeeperRoomDetail({ token, selectedRoom, setPage }) {
  const [room, setRoom] = useState(selectedRoom);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(room?.status || 'DIRTY');

  useEffect(() => {
    setRoom(selectedRoom);
    setSelectedStatus(selectedRoom?.status || 'DIRTY');
  }, [selectedRoom]);

  const handleStatusUpdate = async () => {
    if (!room) return;
    setUpdating(true);
    try {
      await updateRoomStatus(token, room.id, selectedStatus);
      setRoom({ ...room, status: selectedStatus });
    } catch (err) {
      console.error('Error updating room status:', err);
    } finally {
      setUpdating(false);
    }
  };

  if (!room) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <p>No room selected</p>
        <button onClick={() => setPage('rooms')} style={{ padding: '0.5rem 1rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          Back to Rooms
        </button>
      </div>
    );
  }

  const currentStatusConfig = ROOM_STATUS_CONFIG[room.status] || ROOM_STATUS_CONFIG[ROOM_STATUS.DIRTY];
  const statusOptions = getStatusOptions();

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setPage('rooms')}
          style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Room {room.roomNumber}</h1>
          <p style={{ fontSize: '0.8rem', color: '#8a96a8', margin: 0 }}>{room.roomType} Room</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Left Column - Room Info */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', background: '#f8f9fb' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Room Information</h3>
          </div>
          <div style={{ padding: '1.25rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.25rem' }}>Room Number</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{room.roomNumber}</div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.25rem' }}>Room Type</div>
              <div style={{ fontSize: '1rem', fontWeight: 500 }}>{room.roomType}</div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.25rem' }}>Max Occupancy</div>
              <div style={{ fontSize: '1rem', fontWeight: 500 }}>{room.maxOccupancy} guests</div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.25rem' }}>Price per Night</div>
              <div style={{ fontSize: '1rem', fontWeight: 500 }}>₱{room.pricePerNight?.toLocaleString()}</div>
            </div>
            {room.description && (
              <div>
                <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.25rem' }}>Description</div>
                <div style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: 1.6 }}>{room.description}</div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Status Management */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', background: '#f8f9fb' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Status Management</h3>
          </div>
          <div style={{ padding: '1.25rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.25rem' }}>Current Status</div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.4rem 1rem', borderRadius: 99,
                background: currentStatusConfig.bgColor, color: currentStatusConfig.color,
                fontSize: '0.85rem', fontWeight: 600
              }}>
                {currentStatusConfig.icon} {currentStatusConfig.label}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.25rem' }}>Update Status</div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', marginBottom: '1rem' }}
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleStatusUpdate}
              disabled={updating || selectedStatus === room.status}
              style={{
                width: '100%', padding: '0.6rem',
                borderRadius: 8, border: 'none',
                background: selectedStatus === room.status ? '#cbd5e1' : 'linear-gradient(135deg, #10b981, #34d399)',
                color: '#fff', fontWeight: 600, cursor: selectedStatus === room.status ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
              }}
            >
              {updating ? <Clock size={16} /> : <CheckCircle size={16} />}
              {updating ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </div>
      </div>

      {/* Amenities Section */}
      {room.amenities && room.amenities.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', marginTop: '1rem' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', background: '#f8f9fb' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Amenities</h3>
          </div>
          <div style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {(Array.isArray(room.amenities) ? room.amenities : room.amenities?.split(',') || []).map((amenity, i) => (
                <span key={i} style={{ padding: '0.3rem 0.8rem', background: '#f1f5f9', borderRadius: 99, fontSize: '0.75rem', color: '#4a5568' }}>
                  {amenity.trim()}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}