// housekeeper/HousekeeperRooms.jsx
import { useState, useEffect } from 'react';
import { getRooms, updateRoomStatus } from './housekeeperService';
import { ROOM_STATUS, ROOM_STATUS_CONFIG, getStatusOptions } from './roomStatus';
import { Search, RefreshCw, Filter, Eye } from 'lucide-react';

export function HousekeeperRooms({ token, setPage, setSelectedRoom }) {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updating, setUpdating] = useState(null);

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

  useEffect(() => {
    loadRooms();
  }, [token]);

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

  const handleViewRoom = (room) => {
    setSelectedRoom(room);
    setPage('room-detail');
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
      STANDARD: '#6366f1',
      DELUXE: '#0ea5e9',
      SUITE: '#10b981',
      PRESIDENTIAL: '#f59e0b',
      VILLA: '#ef4444',
    };
    return colors[roomType] || '#C9A84C';
  };

  return (
    <div>
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

      {/* Rooms Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading rooms...</div>
      ) : filteredRooms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#8a96a8' }}>No rooms found</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {filteredRooms.map(room => (
            <div key={room.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}>
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
                  <div style={{ fontSize: '0.75rem', color: '#4a5568', marginBottom: '0.25rem' }}>
                    <span>Max Occupancy: {room.maxOccupancy} guests</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#4a5568' }}>
                    <span>Price: ₱{room.pricePerNight?.toLocaleString()}/night</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    value={room.status || 'DIRTY'}
                    onChange={(e) => handleStatusChange(room.id, e.target.value)}
                    disabled={updating === room.id}
                    style={{
                      flex: 2,
                      padding: '0.4rem 0.6rem',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      background: '#fff',
                    }}
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleViewRoom(room)}
                    style={{
                      flex: 1,
                      padding: '0.4rem 0.6rem',
                      borderRadius: 8,
                      border: '1px solid #10b981',
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#10b981',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <Eye size={12} /> View
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