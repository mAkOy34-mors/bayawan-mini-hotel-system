// pages/Homepage.jsx (updated with image URL fix)
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Calendar, Users, Search, Star, Wifi, Coffee, Shield, Clock,
  CheckCircle, ArrowRight, Sparkles, Bath, Dumbbell, Car,
  Utensils, Eye, X, MapPin, Phone, Mail, ChevronDown, Quote
} from 'lucide-react';
import { API_BASE } from '../constants/config';
import { PublicHeader } from '../components/PublicHeader';
import { PublicFooter } from '../components/PublicFooter';

/* ─────────────────────────────────────────────
   Tiny helper – animate elements into view
───────────────────────────────────────────── */
function useFadeIn(threshold = 0.15) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
          obs.unobserve(el);
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ─────────────────────────────────────────────
   Static data (Services and Why Us)
───────────────────────────────────────────── */
const SERVICES = [
  { icon: <Sparkles size={26} />, title: 'Daily Housekeeping', desc: 'Professional cleaning every day', color: '#10b981' },
  { icon: <Wifi size={26} />, title: 'Free High-Speed WiFi', desc: 'Blazing-fast connection throughout', color: '#3b82f6' },
  { icon: <Coffee size={26} />, title: 'Complimentary Breakfast', desc: 'Fresh local cuisine every morning', color: '#f59e0b' },
  { icon: <Shield size={26} />, title: '24/7 Security', desc: 'Round-the-clock safety personnel', color: '#dc2626' },
  { icon: <Bath size={26} />, title: 'Spa & Wellness', desc: 'Relax, recharge, rejuvenate', color: '#8b5cf6' },
  { icon: <Dumbbell size={26} />, title: 'Fitness Center', desc: 'State-of-the-art equipment', color: '#ef4444' },
  { icon: <Car size={26} />, title: 'Airport Transfer', desc: 'Seamless door-to-door service', color: '#06b6d4' },
  { icon: <Utensils size={26} />, title: 'Fine Dining', desc: 'Exquisite cuisine, curated menu', color: '#f97316' },
];

const WHY_US = [
  { icon: <Star size={22} />, title: 'Luxury Experience', desc: 'Premium amenities, impeccable service' },
  { icon: <Clock size={22} />, title: '24/7 Support', desc: 'Always here whenever you need us' },
  { icon: <CheckCircle size={22} />, title: 'Best Price Guarantee', desc: 'Competitive rates, no hidden fees' },
  { icon: <Shield size={22} />, title: 'Safe & Secure', desc: 'Your comfort is our top priority' },
];

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
const Homepage = ({ onLoginClick, onRegisterClick }) => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [displayRooms, setDisplayRooms] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useState({ checkIn: '', checkOut: '', guests: 1 });
  const [availabilityChecking, setAvailabilityChecking] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showAllRooms, setShowAllRooms] = useState(true);

  // Refs for fade-in sections
  const searchRef = useFadeIn();
  const roomsRef = useFadeIn();
  const servicesRef = useFadeIn();
  const whyRef = useFadeIn();
  const testimonialRef = useFadeIn();
  const contactRef = useFadeIn();

  // Helper function to get full image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    // Remove /api/v1 from API_BASE to get the base URL
    const baseUrl = API_BASE.replace('/api/v1', '');
    return `${baseUrl}${imageUrl}`;
  };

  // Helper function to normalize amenities (handles array, string, or object)
  const normalizeAmenities = (amenities) => {
    if (!amenities) return [];
    if (Array.isArray(amenities)) return amenities;
    if (typeof amenities === 'string') {
      return amenities.split(',').map(a => a.trim()).filter(a => a);
    }
    if (typeof amenities === 'object') {
      return Object.values(amenities);
    }
    return [];
  };

  useEffect(() => {
    fetchRooms();
    fetchTestimonials();
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    setSearchParams({
      checkIn: today.toISOString().split('T')[0],
      checkOut: tomorrow.toISOString().split('T')[0],
      guests: 1,
    });
  }, []);

  // Fetch rooms from public API
  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/rooms/public/`, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        const roomsList = Array.isArray(data) ? data : (data.rooms || data.results || []);
        console.log('Rooms fetched:', roomsList.length, 'rooms');
        setRooms(roomsList);
        setDisplayRooms(roomsList);
      } else {
        setError('Unable to load rooms. Please try again later.');
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError('Network error loading rooms');
    } finally {
      setLoading(false);
    }
  };

  // Fetch testimonials from API
  const fetchTestimonials = async () => {
    try {
      setTestimonialsLoading(true);
      
      let response = await fetch(`${API_BASE}/testimonials/`);
      
      if (!response.ok) {
        response = await fetch(`${API_BASE}/feedback/`);
      }
      
      if (response.ok) {
        const data = await response.json();
        const testimonialsList = Array.isArray(data) ? data : (data.testimonials || data.results || []);
        setTestimonials(testimonialsList.slice(0, 6));
      } else {
        setTestimonials([
          { id: 1, guest_name: 'Maria Santos', rating: 5, message: 'Absolutely wonderful stay! The staff was incredibly warm and the room was spotless.' },
          { id: 2, guest_name: 'John Reyes', rating: 5, message: 'Best hotel in Bayawan City by far. The breakfast was amazing!' },
          { id: 3, guest_name: 'Ana Villanueva', rating: 5, message: 'Perfect getaway. Everything was top-notch. Highly recommended!' },
        ]);
      }
    } catch (err) {
      console.error('Error fetching testimonials:', err);
      setTestimonials([]);
    } finally {
      setTestimonialsLoading(false);
    }
  };

  // Check room availability
  const checkAvailability = async () => {
    if (!searchParams.checkIn || !searchParams.checkOut) {
      alert('Please select check-in and check-out dates.');
      return;
    }
    if (searchParams.checkOut <= searchParams.checkIn) {
      alert('Check-out date must be after check-in date.');
      return;
    }
    
    setAvailabilityChecking(true);
    try {
      const response = await fetch(
        `${API_BASE}/rooms/available/?checkIn=${searchParams.checkIn}&checkOut=${searchParams.checkOut}`,
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const availableRooms = Array.isArray(data) ? data.filter(room => room.available === true) : [];
        
        if (availableRooms.length === 0) {
          alert('No rooms available for selected dates. Please try different dates.');
          setDisplayRooms([]);
        } else {
          setDisplayRooms(availableRooms);
          setShowAllRooms(false);
          alert(`Found ${availableRooms.length} room(s) available for your dates!`);
        }
        document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        alert('Unable to check availability. Please try again.');
      }
    } catch (err) {
      console.error('Availability check failed:', err);
      alert('Network error. Please try again.');
    } finally {
      setAvailabilityChecking(false);
    }
  };

  // Reset to show all rooms
  const resetToAllRooms = () => {
    setDisplayRooms(rooms);
    setShowAllRooms(true);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    setSearchParams({
      checkIn: today.toISOString().split('T')[0],
      checkOut: tomorrow.toISOString().split('T')[0],
      guests: 1,
    });
  };

  const bookNow = (roomId) => {
    if (!user) { 
      onLoginClick?.(); 
      return; 
    }
    window.location.href = `/booking?room=${roomId}&check_in=${searchParams.checkIn}&check_out=${searchParams.checkOut}&guests=${searchParams.guests}`;
  };

  const getMinDate = () => new Date().toISOString().split('T')[0];

  // Calculate stats from real data
  const totalRooms = rooms.length;
  const roomTypes = [...new Set(rooms.map(r => r.room_type))].length;
  const avgRating = testimonials.length > 0 
    ? (testimonials.reduce((sum, t) => sum + (t.rating || 5), 0) / testimonials.length).toFixed(1)
    : '4.9';
  const availableRoomsCount = rooms.filter(r => r.available === true).length;

  const roomsToShow = displayRooms.length > 0 ? displayRooms : rooms;
  const testimonialsToShow = testimonials;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'DM Sans', sans-serif; }

        .fade-section {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .fade-section.visible {
          opacity: 1;
          transform: translateY(0);
        }

        @keyframes heroFade {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .hero-content { animation: heroFade 1s ease forwards; }
        .hero-badge   { animation: heroFade 1s ease 0.2s both; }
        .hero-title   { animation: heroFade 1s ease 0.35s both; }
        .hero-sub     { animation: heroFade 1s ease 0.5s both; }
        .hero-cta     { animation: heroFade 1s ease 0.65s both; }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(6px); }
        }
        .scroll-cue { animation: bounce 1.8s ease-in-out infinite; }

        .room-card {
          background: #fff;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.07);
          transition: transform 0.35s cubic-bezier(.25,.8,.25,1), box-shadow 0.35s ease;
        }
        .room-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 18px 40px rgba(0,0,0,0.13);
        }

        .service-card {
          background: #fff;
          border-radius: 18px;
          padding: 30px 22px;
          text-align: center;
          box-shadow: 0 4px 16px rgba(0,0,0,0.05);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .service-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(201,168,76,0.06), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .service-card:hover { transform: translateY(-6px); box-shadow: 0 16px 32px rgba(0,0,0,0.1); }
        .service-card:hover::before { opacity: 1; }

        .why-card {
          text-align: center;
          padding: 32px 24px;
          border-radius: 18px;
          transition: background 0.3s;
        }
        .why-card:hover { background: rgba(201,168,76,0.05); }

        .btn-gold {
          background: linear-gradient(135deg, #9a7a2e, #C9A84C);
          color: #fff;
          border: none;
          padding: 14px 36px;
          font-size: 0.95rem;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          border-radius: 50px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: transform 0.25s ease, box-shadow 0.25s ease, opacity 0.25s;
          box-shadow: 0 4px 20px rgba(201,168,76,0.35);
        }
        .btn-gold:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 8px 28px rgba(201,168,76,0.5);
        }
        .btn-gold:disabled { opacity: 0.65; cursor: not-allowed; }

        .btn-outline-gold {
          background: transparent;
          border: 1.5px solid #C9A84C;
          color: #9a7a2e;
          padding: 10px 22px;
          font-size: 0.85rem;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          border-radius: 50px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.25s, color 0.25s;
          width: 100%;
          justify-content: center;
          margin-top: 14px;
        }
        .btn-outline-gold:hover { background: #C9A84C; color: #fff; }

        .testimonial-card {
          background: #fff;
          border-radius: 18px;
          padding: 28px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
          display: flex;
          flex-direction: column;
          gap: 14px;
          border: 1px solid #f1ede4;
          transition: box-shadow 0.3s;
        }
        .testimonial-card:hover { box-shadow: 0 12px 32px rgba(0,0,0,0.1); }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15,15,20,0.75);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 20px;
          animation: heroFade 0.25s ease;
        }
        .modal-body {
          background: #fff;
          border-radius: 22px;
          max-width: 580px;
          width: 100%;
          max-height: 92vh;
          overflow-y: auto;
          position: relative;
        }

        .search-input {
          width: 100%;
          padding: 13px 16px;
          border: 1.5px solid #e8e3d9;
          border-radius: 12px;
          font-size: 0.9rem;
          font-family: 'DM Sans', sans-serif;
          color: #1a1f2e;
          background: #fdfcfa;
          outline: none;
          transition: border-color 0.2s;
        }
        .search-input:focus { border-color: #C9A84C; }

        .ornament {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          margin-bottom: 12px;
        }
        .ornament::before, .ornament::after {
          content: '';
          display: block;
          width: 50px;
          height: 1px;
          background: linear-gradient(to right, transparent, #C9A84C);
        }
        .ornament::after { background: linear-gradient(to left, transparent, #C9A84C); }

        .stat-card {
          text-align: center;
          padding: 30px 20px;
        }

        .amenity-badge {
          background: #f8f5ef;
          color: #6b5e3e;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.7rem;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .search-card-inner { flex-direction: column !important; }
        }
        @media (max-width: 600px) {
          .hero-title-text { font-size: 2.2rem !important; }
        }
      `}</style>

      <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#1a1f2e', background: '#fff' }}>
        <PublicHeader onLoginClick={onLoginClick} onRegisterClick={onRegisterClick} />

        {/* HERO SECTION */}
        <section
          id="home"
          style={{
            height: '100vh',
            minHeight: 640,
            backgroundImage: 'linear-gradient(to bottom, rgba(15,12,8,0.55) 0%, rgba(15,12,8,0.3) 60%, rgba(15,12,8,0.7) 100%), url("https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            color: '#fff',
            position: 'relative',
            paddingTop: 80,
          }}
        >
          <div style={{ maxWidth: 800, padding: '0 24px' }}>
            <div className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(201,168,76,0.2)', border: '1px solid rgba(201,168,76,0.5)', backdropFilter: 'blur(10px)', borderRadius: 50, padding: '8px 20px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 28, color: '#f0d98a' }}>
              <Star size={12} fill="#f0d98a" color="#f0d98a" /> Bayawan City, Negros Oriental
            </div>
            <h1 className="hero-title hero-title-text" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2.8rem, 7vw, 4.6rem)', fontWeight: 700, lineHeight: 1.1, marginBottom: 22, letterSpacing: '-0.5px' }}>
              Where Every Stay Becomes&nbsp;<em style={{ fontStyle: 'italic', color: '#f0d98a' }}>a Memory</em>
            </h1>
            <p className="hero-sub" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.15rem)', lineHeight: 1.7, opacity: 0.88, marginBottom: 36 }}>
              Experience luxury, warmth, and Filipino hospitality at Bayawan Mini Hotel — your perfect sanctuary in the heart of the city.
            </p>
            <div className="hero-cta" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn-gold" onClick={() => document.getElementById('search')?.scrollIntoView({ behavior: 'smooth' })}>
                Book Your Stay <ArrowRight size={17} />
              </button>
              <button style={{ background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.4)', backdropFilter: 'blur(10px)', color: '#fff', padding: '14px 32px', borderRadius: 50, cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600 }} onClick={() => document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' })}>
                Explore Rooms
              </button>
            </div>
          </div>
          <div className="scroll-cue" style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.55)', cursor: 'pointer' }} onClick={() => document.getElementById('search')?.scrollIntoView({ behavior: 'smooth' })}>
            <ChevronDown size={28} />
          </div>
        </section>

        {/* SEARCH BAR SECTION */}
        <div id="search" ref={searchRef} className="fade-section" style={{ maxWidth: 1100, margin: '-56px auto 0', padding: '0 24px', position: 'relative', zIndex: 10 }}>
          <div style={{ background: '#fff', borderRadius: 22, boxShadow: '0 24px 60px rgba(0,0,0,0.12)', padding: '28px 32px', border: '1px solid #f1ede4' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#C9A84C', marginBottom: 16 }}>Check Availability</p>
            <div className="search-card-inner" style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 7 }}>
                  <Calendar size={11} style={{ display: 'inline', marginRight: 5 }} /> Check-in
                </label>
                <input type="date" className="search-input" min={getMinDate()} value={searchParams.checkIn} onChange={e => setSearchParams({ ...searchParams, checkIn: e.target.value })} />
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 7 }}>
                  <Calendar size={11} style={{ display: 'inline', marginRight: 5 }} /> Check-out
                </label>
                <input type="date" className="search-input" min={searchParams.checkIn || getMinDate()} value={searchParams.checkOut} onChange={e => setSearchParams({ ...searchParams, checkOut: e.target.value })} />
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 7 }}>
                  <Users size={11} style={{ display: 'inline', marginRight: 5 }} /> Guests
                </label>
                <select className="search-input" value={searchParams.guests} onChange={e => setSearchParams({ ...searchParams, guests: parseInt(e.target.value) })}>
                  {[1, 2, 3, 4, 5, 6].map(n => (<option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>))}
                </select>
              </div>
              <button className="btn-gold" style={{ borderRadius: 12, whiteSpace: 'nowrap', flexShrink: 0, padding: '13px 28px' }} onClick={checkAvailability} disabled={availabilityChecking}>
                <Search size={16} /> {availabilityChecking ? 'Checking…' : 'Check Availability'}
              </button>
            </div>
            {!showAllRooms && (
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <button onClick={resetToAllRooms} style={{ background: 'none', border: 'none', color: '#C9A84C', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}>
                  ← Show All Rooms
                </button>
              </div>
            )}
          </div>
        </div>

        {/* STATS STRIP */}
        <div style={{ background: '#faf8f4', borderTop: '1px solid #f1ede4', borderBottom: '1px solid #f1ede4', marginTop: 80 }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
            <div className="stat-card">
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.2rem', fontWeight: 700, color: '#C9A84C', lineHeight: 1 }}>{totalRooms}</div>
              <div style={{ fontSize: '0.8rem', color: '#8a96a8', marginTop: 6, fontWeight: 500 }}>Total Rooms</div>
            </div>
            <div className="stat-card">
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.2rem', fontWeight: 700, color: '#C9A84C', lineHeight: 1 }}>{availableRoomsCount}</div>
              <div style={{ fontSize: '0.8rem', color: '#8a96a8', marginTop: 6, fontWeight: 500 }}>Available Now</div>
            </div>
            <div className="stat-card">
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.2rem', fontWeight: 700, color: '#C9A84C', lineHeight: 1 }}>{roomTypes}</div>
              <div style={{ fontSize: '0.8rem', color: '#8a96a8', marginTop: 6, fontWeight: 500 }}>Room Types</div>
            </div>
            <div className="stat-card">
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.2rem', fontWeight: 700, color: '#C9A84C', lineHeight: 1 }}>{avgRating}★</div>
              <div style={{ fontSize: '0.8rem', color: '#8a96a8', marginTop: 6, fontWeight: 500 }}>Guest Rating</div>
            </div>
          </div>
        </div>

        {/* ROOMS SECTION */}
        <section id="rooms" ref={roomsRef} className="fade-section" style={{ padding: '90px 5%', maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div className="ornament"><Star size={14} fill="#C9A84C" color="#C9A84C" /></div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2rem, 5vw, 2.6rem)', fontWeight: 600 }}>
              {!showAllRooms ? 'Available Rooms' : 'Our Premium Rooms'}
            </h2>
            <p style={{ color: '#8a96a8', marginTop: 10, fontSize: '0.95rem', maxWidth: 500, margin: '10px auto 0' }}>
              {!showAllRooms 
                ? `Showing ${roomsToShow.length} room(s) available for your selected dates`
                : 'Beautifully designed spaces crafted for comfort, rest, and relaxation.'}
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#8a96a8' }}><div style={{ fontSize: '2rem', marginBottom: 12 }}>✦</div>Loading rooms…</div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#dc2626' }}>{error}</div>
          ) : roomsToShow.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#8a96a8' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🏨</div>
              <div>No rooms available at the moment.</div>
              <div style={{ fontSize: '0.85rem', marginTop: 8 }}>Please check back later or try different dates.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 28 }}>
              {roomsToShow.map(room => {
                const amenitiesList = normalizeAmenities(room.amenities);
                const imageUrl = getImageUrl(room.image_url || room.imageUrl);
                return (
                  <div key={room.id} className="room-card">
                    <div style={{ position: 'relative', overflow: 'hidden' }}>
                      <img 
                        src={imageUrl || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600'} 
                        alt={room.room_type} 
                        style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block', transition: 'transform 0.5s ease' }} 
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')} 
                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600';
                        }}
                      />
                      <div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(201,168,76,0.92)', color: '#fff', padding: '5px 14px', borderRadius: 50, fontSize: '0.75rem', fontWeight: 700, backdropFilter: 'blur(4px)' }}>{room.room_type}</div>
                      {room.available === false && (
                        <div style={{ position: 'absolute', bottom: 14, left: 14, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600 }}>Not Available</div>
                      )}
                    </div>
                    <div style={{ padding: '22px 22px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{room.room_type} Room</h3>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#C9A84C' }}>₱{Number(room.price_per_night || room.pricePerNight).toLocaleString()}</span>
                          <span style={{ fontSize: '0.7rem', color: '#8a96a8', display: 'block' }}>/night</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                        {amenitiesList.slice(0, 3).map((a, i) => (
                          <span key={i} className="amenity-badge">
                            <CheckCircle size={9} /> {a}
                          </span>
                        ))}
                      </div>
                      <button className="btn-outline-gold" onClick={() => { setSelectedRoom(room); setShowRoomModal(true); }}>View Details <Eye size={14} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* SERVICES SECTION */}
        <section id="services" ref={servicesRef} className="fade-section" style={{ padding: '90px 5%', background: '#faf8f4' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <div className="ornament"><Sparkles size={14} color="#C9A84C" /></div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2rem, 5vw, 2.6rem)', fontWeight: 600 }}>Hotel Services</h2>
              <p style={{ color: '#8a96a8', marginTop: 10, fontSize: '0.95rem', maxWidth: 500, margin: '10px auto 0' }}>Exceptional services designed to make every moment of your stay memorable.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 22 }}>
              {SERVICES.map((s, i) => (
                <div key={i} className="service-card">
                  <div style={{ width: 58, height: 58, borderRadius: 18, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: s.color }}>{s.icon}</div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 6 }}>{s.title}</h3>
                  <p style={{ fontSize: '0.8rem', color: '#8a96a8', lineHeight: 1.5 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHY CHOOSE US */}
        <section ref={whyRef} className="fade-section" style={{ padding: '90px 5%', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div className="ornament"><CheckCircle size={14} color="#C9A84C" /></div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2rem, 5vw, 2.6rem)', fontWeight: 600 }}>Why Choose Us?</h2>
            <p style={{ color: '#8a96a8', marginTop: 10, fontSize: '0.95rem', maxWidth: 500, margin: '10px auto 0' }}>What sets Bayawan Mini Hotel apart from the rest.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {WHY_US.map((item, i) => (
              <div key={i} className="why-card">
                <div style={{ width: 62, height: 62, background: 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(154,122,46,0.08))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}>{item.icon}</div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: '0.82rem', color: '#8a96a8', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* TESTIMONIALS SECTION */}
        <section ref={testimonialRef} className="fade-section" style={{ padding: '90px 5%', background: '#faf8f4' }}>
          <div style={{ maxWidth: 1300, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <div className="ornament"><Quote size={14} color="#C9A84C" /></div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2rem, 5vw, 2.6rem)', fontWeight: 600 }}>Guest Reviews</h2>
              <p style={{ color: '#8a96a8', marginTop: 10, fontSize: '0.95rem', maxWidth: 500, margin: '10px auto 0' }}>Hear directly from guests who have stayed with us.</p>
            </div>

            {testimonialsLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#8a96a8' }}>Loading reviews…</div>
            ) : testimonialsToShow.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#8a96a8' }}>No reviews yet. Be the first to share your experience!</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                {testimonialsToShow.map((t, i) => (
                  <div key={i} className="testimonial-card">
                    <div style={{ display: 'flex', gap: 3 }}>{[...Array(5)].map((_, si) => (<Star key={si} size={14} fill={si < (t.rating || 5) ? '#C9A84C' : 'none'} color="#C9A84C" />))}</div>
                    <p style={{ fontSize: '0.88rem', lineHeight: 1.75, color: '#4a5568', fontStyle: 'italic' }}>"{t.message || t.comment || t.review}"</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 'auto' }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #9a7a2e, #C9A84C)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.9rem', fontWeight: 700, flexShrink: 0 }}>{t.guest_name?.[0] || t.name?.[0] || 'G'}</div>
                      <div><div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{t.guest_name || t.name || 'Guest'}</div><div style={{ fontSize: '0.72rem', color: '#b0bac8' }}>Verified Guest</div></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CONTACT SECTION */}
        <section id="contact" ref={contactRef} className="fade-section" style={{ padding: '90px 5%', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div className="ornament"><MapPin size={14} color="#C9A84C" /></div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2rem, 5vw, 2.6rem)', fontWeight: 600 }}>Get in Touch</h2>
            <p style={{ color: '#8a96a8', marginTop: 10, fontSize: '0.95rem', maxWidth: 500, margin: '10px auto 0' }}>We are always happy to assist you — reach out anytime.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {[
              { icon: <MapPin size={22} color="#C9A84C" />, title: 'Our Location', lines: ['Bayawan City, Negros Oriental', 'Philippines 6221'] },
              { icon: <Phone size={22} color="#C9A84C" />, title: 'Call Us', lines: ['+63 32 888 8888', 'info@bayawanhotel.com'] },
              { icon: <Clock size={22} color="#C9A84C" />, title: 'Hours', lines: ['Check-in: 2:00 PM', 'Check-out: 12:00 PM', 'Front Desk: 24/7'] },
            ].map((card, i) => (
              <div key={i} style={{ background: '#faf8f4', border: '1px solid #ede9df', borderRadius: 18, padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 12, transition: 'box-shadow 0.3s' }} onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.08)')} onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(201,168,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{card.icon}</div>
                <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{card.title}</h3>
                {card.lines.map((l, li) => (<p key={li} style={{ fontSize: '0.85rem', color: '#6b7280', lineHeight: 1.6 }}>{l}</p>))}
              </div>
            ))}
          </div>
        </section>

        {/* CTA BANNER */}
        <div style={{ backgroundImage: 'linear-gradient(135deg, rgba(15,12,8,0.8), rgba(15,12,8,0.65)), url("https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1600&q=80")', backgroundSize: 'cover', backgroundPosition: 'center', padding: '80px 5%', textAlign: 'center', color: '#fff' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2rem, 5vw, 2.8rem)', fontWeight: 600, marginBottom: 16 }}>Ready for Your Next Escape?</h2>
          <p style={{ fontSize: '1rem', opacity: 0.85, marginBottom: 32, maxWidth: 520, margin: '0 auto 32px' }}>Book directly with us for the best rates and a personalised experience.</p>
          <button className="btn-gold" style={{ fontSize: '1rem', padding: '15px 42px' }} onClick={() => document.getElementById('search')?.scrollIntoView({ behavior: 'smooth' })}>Reserve Now <ArrowRight size={18} /></button>
        </div>

        <PublicFooter />

        {/* ROOM MODAL */}
        {showRoomModal && selectedRoom && (
          <div className="modal-backdrop" onClick={() => setShowRoomModal(false)}>
            <div className="modal-body" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowRoomModal(false)} style={{ position: 'absolute', top: 14, right: 14, zIndex: 10, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}><X size={18} /></button>
              <img 
                src={getImageUrl(selectedRoom.image_url || selectedRoom.imageUrl) || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600'} 
                alt={selectedRoom.room_type} 
                style={{ width: '100%', height: 260, objectFit: 'cover', borderRadius: '22px 22px 0 0', display: 'block' }} 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600';
                }}
              />
              <div style={{ padding: '28px 28px 30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.7rem', fontWeight: 600 }}>{selectedRoom.room_type} Room</h2>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#C9A84C' }}>₱{Number(selectedRoom.price_per_night || selectedRoom.pricePerNight).toLocaleString()}</div>
                    <div style={{ fontSize: '0.7rem', color: '#8a96a8' }}>per night</div>
                  </div>
                </div>
                <p style={{ fontSize: '0.88rem', color: '#6b7280', lineHeight: 1.75, marginBottom: 20 }}>{selectedRoom.description || 'Experience luxury and comfort in this beautifully furnished room, designed for a relaxing and memorable stay.'}</p>
                {normalizeAmenities(selectedRoom.amenities).length > 0 && (
                  <>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#9a96a8', marginBottom: 12 }}>Amenities</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                      {normalizeAmenities(selectedRoom.amenities).map((a, i) => (
                        <span key={i} className="amenity-badge" style={{ padding: '6px 14px', fontSize: '0.75rem' }}>
                          <CheckCircle size={11} /> {a}
                        </span>
                      ))}
                    </div>
                  </>
                )}
                <button className="btn-gold" style={{ width: '100%', justifyContent: 'center', borderRadius: 14, padding: '15px', fontSize: '1rem' }} onClick={() => bookNow(selectedRoom.id)}>Book This Room <ArrowRight size={18} /></button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Homepage;