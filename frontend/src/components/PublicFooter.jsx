// components/PublicFooter.jsx
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer style={{
      background: '#1a1f2e',
      color: '#8a96a8',
      padding: '50px 5% 30px'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '40px',
        maxWidth: 1200,
        margin: '0 auto'
      }}>
        <div>
          <h3 style={{ color: 'white', marginBottom: '15px', fontSize: '1.1rem' }}>Bayawan Mini Hotel</h3>
          <p style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>Experience luxury and comfort in the heart of Bayawan City. Your perfect getaway awaits.</p>
        </div>
        <div>
          <h4 style={{ color: 'white', marginBottom: '15px', fontSize: '0.9rem' }}>Quick Links</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li><a href="#home" style={{ color: '#8a96a8', textDecoration: 'none', fontSize: '0.85rem', lineHeight: 2 }}>Home</a></li>
            <li><a href="#rooms" style={{ color: '#8a96a8', textDecoration: 'none', fontSize: '0.85rem', lineHeight: 2 }}>Rooms</a></li>
            <li><a href="#services" style={{ color: '#8a96a8', textDecoration: 'none', fontSize: '0.85rem', lineHeight: 2 }}>Services</a></li>
          </ul>
        </div>
        <div>
          <h4 style={{ color: 'white', marginBottom: '15px', fontSize: '0.9rem' }}>Contact</h4>
          <p style={{ fontSize: '0.85rem', lineHeight: 2 }}>
            <MapPin size={14} style={{ display: 'inline', marginRight: '8px' }} /> Bayawan City, Negros Oriental<br />
            <Phone size={14} style={{ display: 'inline', marginRight: '8px' }} /> +63 32 888 8888<br />
            <Mail size={14} style={{ display: 'inline', marginRight: '8px' }} /> info@bayawanhotel.com
          </p>
        </div>
        <div>
          <h4 style={{ color: 'white', marginBottom: '15px', fontSize: '0.9rem' }}>Follow Us</h4>
          <div style={{ display: 'flex', gap: '15px' }}>
            <Facebook size={20} style={{ cursor: 'pointer' }} />
            <Instagram size={20} style={{ cursor: 'pointer' }} />
            <Twitter size={20} style={{ cursor: 'pointer' }} />
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'center', paddingTop: '30px', marginTop: '30px', borderTop: '1px solid #2d3748', fontSize: '0.75rem' }}>
        &copy; 2026 Bayawan Mini Hotel. All rights reserved.
      </div>
    </footer>
  );
}