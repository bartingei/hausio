import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Navbar.module.css';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const close = () => setMenuOpen(false);

  return (
    <nav className={styles.nav}>
      <Link to="/browse" className={styles.logo} onClick={close}>
        🏠 Hausio
      </Link>

      {/* Desktop links */}
      <div className={styles.links}>
        <Link to="/browse">Browse</Link>
        {!user && <Link to="/login">Login</Link>}
        {!user && <Link to="/register">Register</Link>}
        {user?.role === 'tenant'   && <Link to="/tenant">My Account</Link>}
        {user?.role === 'landlord' && <Link to="/dashboard">My Listings</Link>}
        {user?.role === 'admin'    && <Link to="/admin">Admin</Link>}
        {user && (
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Logout
          </button>
        )}
      </div>

      {/* Hamburger button */}
      <button
        className={styles.hamburger}
        onClick={() => setMenuOpen(v => !v)}
        aria-label="Menu"
      >
        <span className={menuOpen ? styles.barTop : styles.bar} />
        <span className={menuOpen ? styles.barHide : styles.bar} />
        <span className={menuOpen ? styles.barBottom : styles.bar} />
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          <Link to="/browse" onClick={close}>Browse</Link>
          {!user && <Link to="/login" onClick={close}>Login</Link>}
          {!user && <Link to="/register" onClick={close}>Register</Link>}
          {user?.role === 'tenant'   && <Link to="/tenant" onClick={close}>My Account</Link>}
          {user?.role === 'landlord' && <Link to="/dashboard" onClick={close}>My Listings</Link>}
          {user?.role === 'admin'    && <Link to="/admin" onClick={close}>Admin</Link>}
          {user && (
            <button onClick={handleLogout} className={styles.mobileLogout}>
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;