// housekeeper/HousekeeperRooms.jsx
import { useState, useEffect } from 'react';
import { getRooms, updateRoomStatus } from './housekeeperService';
import { ROOM_STATUS, ROOM_STATUS_CONFIG, getStatusOptions } from './roomStatus';
import { Search, RefreshCw, X } from 'lucide-react';

export function HousekeeperRooms({ token }) {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updating, setUpdating] = useState(null);
  const [viewRoom, setViewRoom] = useState(null); // ← replaces setPage/setSelectedRoom

  const loadRooms = async () => {
    setLoading(true);
    try {
      const data = await getRooms(token);
      setRooms(data);
      setFilteredRooms(data);
    } catch (err) {
      console.error('Error loading rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRooms(); }, [token]);

  useEffect(() => {
    let filtered = rooms;
    if (search) {
      filtered = filtered.filter(r =>
        r.roomNumber?.toLowerCase().includes(search.toLowerCase()) ||
        r.roomType?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter) {
      filtered = filtered.filter(r => r.status === statusFilter);
    }
    setFilteredRooms(filtered);
  }, [search, statusFilter, rooms]);

  const handleStatusChange = async (roomId, newStatus) => {
    setUpdating(roomId);
    try {
      await updateRoomStatus(token, roomId, newStatus);
      await loadRooms();
    } catch (err) {
      console.error('Error updating room status:', err);
    } finally {
      setUpdating(null);
    }
  };

  const statusOptions = getStatusOptions();

  const getStatusBadge = (status) => {
    const config = ROOM_STATUS_CONFIG[status] || ROOM_STATUS_CONFIG[ROOM_STATUS.DIRTY];
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
        padding: '0.2rem 0.6rem', borderRadius: 99,
        background: config.bgColor, color: config.color,
        fontSize: '0.72rem', fontWeight: 600
      }}>
        {config.icon} {config.label}
      </span>
    );
  };

  const getRoomTypeColor = (roomType) => {
    const colors = {
      STANDARD: '#6366f1', DELUXE: '#0ea5e9', SUITE: '#10b981',
      PRESIDENTIAL: '#f59e0b', VILLA: '#ef4444',
    };
    return colors[roomType] || '#C9A84C';
  };

  return (
    <div>
      {/* View-only Modal */}
      {viewRoom && (
        <div
          onClick={() => setViewRoom(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 16, width: 360,
              overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ height: 3, background: `linear-gradient(to right, ${getRoomTypeColor(viewRoom.roomType)}, ${getRoomTypeColor(viewRoom.roomType)}99)` }} />
            <div style={{ padding: '1.25rem' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: getRoomTypeColor(viewRoom.roomType) }}>
                    {viewRoom.roomType}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#1a1f2e' }}>
                    Room {viewRoom.roomNumber}
                  </div>
                </div>
                <button
                  onClick={() => setViewRoom(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#8a96a8' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Status — read-only display only */}
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '0.85rem 1rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#8a96a8', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Current Status
                </div>
                {getStatusBadge(viewRoom.status)}
              </div>

              {/* Room details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: '1.25rem' }}>
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '0.75rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: 2 }}>Max occupancy</div>
                  <div style={{ fontWeight: 700, color: '#1a1f2e' }}>{viewRoom.maxOccupancy} guests</div>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '0.75rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: 2 }}>Price per night</div>
                  <div style={{ fontWeight: 700, color: '#1a1f2e' }}>₱{viewRoom.pricePerNight?.toLocaleString()}</div>
                </div>
              </div>

              <button
                onClick={() => setViewRoom(null)}
                style={{
                  width: '100%', padding: '0.55rem', borderRadius: 8,
                  border: '1px solid #e2e8f0', background: '#fff',
                  cursor: 'pointer', fontSize: '0.85rem', color: '#4a5568'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Room Status</h1>
        <p style={{ fontSize: '0.8rem', color: '#8a96a8', margin: 0 }}>View and update room cleaning status</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#8a96a8' }} />
          <input
            type="text"
            placeholder="Search by room number or type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.2rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem' }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '0.6rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', background: '#fff' }}
        >
          <option value="">All Status</option>
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
          ))}
        </select>
        <button onClick={loadRooms} style={{ padding: '0.6rem 1rem', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Rooms Grid — unchanged below */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading rooms...</div>
      ) : filteredRooms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#8a96a8' }}>No rooms found</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {filteredRooms.map(room => (
            <div key={room.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ height: 3, background: `linear-gradient(to right, ${getRoomTypeColor(room.roomType)}, ${getRoomTypeColor(room.roomType)}99)` }} />
              <div style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: getRoomTypeColor(room.roomType) }}>
                      {room.roomType}
                    </span>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1f2e' }}>Room {room.roomNumber}</div>
                  </div>
                  {getStatusBadge(room.status)}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#4a5568', marginBottom: '0.25rem' }}>Max Occupancy: {room.maxOccupancy} guests</div>
                  <div style={{ fontSize: '0.75rem', color: '#4a5568' }}>Price: ₱{room.pricePerNight?.toLocaleString()}/night</div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {room.status !== 'CLEAN' ? (
                    <button
                      onClick={() => handleStatusChange(room.id, 'CLEAN')}
                      disabled={updating === room.id}
                      style={{
                        flex: 2, padding: '0.4rem 0.6rem', borderRadius: 8,
                        border: 'none',
                        background: updating === room.id ? '#34d399' : 'linear-gradient(135deg, #10b981, #34d399)',
                        color: '#fff', fontSize: '0.75rem', fontWeight: 600,
                        cursor: updating === room.id ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                        opacity: updating === room.id ? 0.7 : 1,
                      }}
                    >
                      {updating === room.id ? 'Updating...' : '✓ Mark as Clean'}
                    </button>
                  ) : (
                    <div style={{
                      flex: 2, padding: '0.4rem 0.6rem', borderRadius: 8,
                      border: '1px solid #10b98133', background: 'rgba(16,185,129,0.08)',
                      color: '#10b981', fontSize: '0.75rem', fontWeight: 600,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                    }}>
                      ✓ Already Clean
                    </div>
                  )}

                  {/* View button — opens read-only modal */}
                  <button
                    onClick={() => setViewRoom(room)}
                    style={{
                      flex: 1, padding: '0.4rem 0.6rem', borderRadius: 8,
                      border: '1px solid #10b981', background: 'rgba(16,185,129,0.1)',
                      color: '#10b981', fontSize: '0.75rem', fontWeight: 600,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                    }}
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}