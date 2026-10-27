import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  ArrowLeftRight, 
  Wallet, 
  User as UserIcon, 
  LogOut, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="brand-logo">
          <div className="logo-icon">
            <ArrowLeftRight size={20} />
          </div>
          <span className="logo-text">Skill<span>Swap</span></span>
        </Link>

        {user && (
          <nav className="nav-links">
            <NavLink to="/matches" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Users size={18} />
              <span>Matches</span>
            </NavLink>
            <NavLink to="/requests" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <ArrowLeftRight size={18} />
              <span>Sessions</span>
            </NavLink>
            <NavLink to="/wallet" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Wallet size={18} />
              <span>Wallet</span>
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <UserIcon size={18} />
              <span>My Profile</span>
            </NavLink>
          </nav>
        )}

        <div className="navbar-user">
          {user ? (
            <div className="user-profile-badge">
              <Link to={`/u/${user._id}`} className="view-public-btn" title="View Public Profile">
                <span>{user.name}</span>
                <ExternalLink size={14} />
              </Link>
              <button onClick={handleLogout} className="logout-btn" title="Sign Out">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="auth-btns">
              <Link to="/login" className="btn-secondary-sm">Sign In</Link>
              <Link to="/register" className="btn-primary-sm">Register</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
