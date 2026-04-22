// components/PublicHeader.jsx
import { useState, useEffect } from 'react';
import { Hotel, LogIn, UserPlus, Menu, X, Home, BedDouble, Sparkles, Phone } from 'lucide-react';

export function PublicHeader({ onLoginClick, onRegisterClick }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Close mobile menu when window resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen]);

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking a link
  const handleNavClick = (sectionId) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: <Home size={16} /> },
    { id: 'rooms', label: 'Rooms', icon: <BedDouble size={16} /> },
    { id: 'services', label: 'Services', icon: <Sparkles size={16} /> },
    { id: 'contact', label: 'Contact', icon: <Phone size={16} /> },
  ];

  return (
    <>
      <style>{`
        /* Desktop styles - navigation visible */
        @media (min-width: 769px) {
          .desktop-nav {
            display: flex !important;
          }
          .desktop-buttons {
            display: flex !important;
          }
          .mobile-menu-btn {
            display: none !important;
          }
        }

        /* Mobile styles - hide desktop nav, show hamburger */
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .desktop-buttons {
            display: none !important;
          }
          .mobile-menu-btn {
            display: flex !important;
          }
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>

      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: scrolled ? '#ffffff' : 'rgba(255,255,255,0.98)',
        boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.08)' : '0 2px 10px rgba(0,0,0,0.05)',
        backdropFilter: scrolled ? 'none' : 'blur(10px)',
        zIndex: 1000,
        padding: scrolled ? '12px 5%' : '15px 5%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        transition: 'all 0.3s ease'
      }}>
        {/* Logo */}
        <div 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          <div style={{
            width: 40,
            height: 40,
            background: 'linear-gradient(135deg, #9a7a2e, #C9A84C)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.3s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Hotel size={20} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem', fontWeight: 700, color: '#1a1f2e' }}>
              Bayawan Mini Hotel
            </div>
            <div style={{ fontSize: '0.6rem', color: '#8a96a8', letterSpacing: '0.5px' }}>
              LUXURY STAY
            </div>
          </div>
        </div>

        {/* Desktop Navigation - VISIBLE ON DESKTOP */}
        <nav className="desktop-nav" style={{ 
          display: 'flex', 
          gap: '35px', 
          alignItems: 'center',
          margin: '0 20px'
        }}>
          {navItems.map(item => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(item.id);
              }}
              style={{
                textDecoration: 'none',
                color: '#4a5568',
                fontSize: '0.9rem',
                fontWeight: 500,
                transition: 'color 0.2s',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#C9A84C'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#4a5568'}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop Auth Buttons - VISIBLE ON DESKTOP */}
        <div className="desktop-buttons" style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
          <button
            onClick={onLoginClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 20px',
              border: '1.5px solid #C9A84C',
              background: 'white',
              borderRadius: 30,
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#9a7a2e',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#C9A84C'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#9a7a2e'; }}
          >
            <LogIn size={14} /> Sign In
          </button>
          <button
            onClick={onRegisterClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 20px',
              background: 'linear-gradient(135deg, #9a7a2e, #C9A84C)',
              border: 'none',
              borderRadius: 30,
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'white',
              transition: 'transform 0.2s, box-shadow 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(201,168,76,0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <UserPlus size={14} /> Register
          </button>
        </div>

        {/* Hamburger Menu Button - VISIBLE ON MOBILE ONLY */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="mobile-menu-btn"
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            transition: 'background 0.2s',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          {mobileMenuOpen ? <X size={24} color="#1a1f2e" /> : <Menu size={24} color="#1a1f2e" />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 999,
              backdropFilter: 'blur(4px)',
              animation: 'fadeIn 0.3s ease'
            }}
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Mobile Menu Panel */}
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '300px',
            height: '100vh',
            background: 'white',
            zIndex: 1000,
            boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
            padding: '80px 24px 30px',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideIn 0.3s ease'
          }}>
            {/* Mobile Navigation Links */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
              {navItems.map(item => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(item.id);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    textDecoration: 'none',
                    color: '#4a5568',
                    fontSize: '1rem',
                    fontWeight: 500,
                    padding: '12px 0',
                    borderBottom: '1px solid #f1f5f9',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#C9A84C'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#4a5568'}
                >
                  {item.icon}
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Divider */}
            <div style={{ height: '1px', background: '#e2e8f0', margin: '10px 0 20px' }} />

            {/* Mobile Auth Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLoginClick();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  border: '1.5px solid #C9A84C',
                  background: 'white',
                  borderRadius: 30,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#9a7a2e',
                  width: '100%',
                  transition: 'all 0.2s'
                }}
              >
                <LogIn size={16} /> Sign In
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onRegisterClick();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #9a7a2e, #C9A84C)',
                  border: 'none',
                  borderRadius: 30,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: 'white',
                  width: '100%',
                  transition: 'transform 0.2s'
                }}
              >
                <UserPlus size={16} /> Register
              </button>
            </div>

            {/* Hotel Info in Mobile Menu */}
            <div style={{ marginTop: 'auto', paddingTop: '30px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#8a96a8' }}>
                <Hotel size={14} style={{ display: 'inline', marginRight: '5px' }} />
                Bayawan Mini Hotel
              </div>
              <div style={{ fontSize: '0.6rem', color: '#cbd5e1', marginTop: '5px' }}>
                © 2026 All rights reserved
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}