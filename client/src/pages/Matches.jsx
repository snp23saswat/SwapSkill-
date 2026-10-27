import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { RequestModal } from '../components/RequestModal';
import { 
  Users, 
  Sparkles, 
  ArrowLeftRight, 
  DollarSign, 
  GraduationCap, 
  Clock, 
  Award, 
  AlertCircle,
  ExternalLink,
  Star 
} from 'lucide-react';

export function Matches() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'mutual-swap' | 'paid-tutor' | 'potential-student'
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTargetUser, setModalTargetUser] = useState(null);
  const [modalType, setModalType] = useState('swap');
  const [modalSkill, setModalSkill] = useState('');

  const fetchMatches = async (tab) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getMatches(tab);
      setMatches(data.matches || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch matches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches(activeTab);
  }, [activeTab]);

  const handleOpenModal = (targetUser, initialType, initialSkill) => {
    setModalTargetUser(targetUser);
    setModalType(initialType);
    setModalSkill(initialSkill || '');
    setModalOpen(true);
  };

  const tabs = [
    { key: 'all', label: 'All Matches', icon: Users },
    { key: 'mutual-swap', label: 'Perfect Swaps', icon: ArrowLeftRight },
    { key: 'paid-tutor', label: 'Paid Tutors', icon: DollarSign },
    { key: 'potential-student', label: 'Students for You', icon: GraduationCap },
  ];

  return (
    <div className="matches-page">
      <div className="page-header">
        <div className="page-header-content">
          <h2>Peer Matches & Tutors</h2>
          <p>Discover mutual exchange partners, paid mentors, or students who want what you teach</p>
        </div>

        <div className="matches-tab-bar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="form-error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="center-loader">
          <div className="spinner"></div>
          <p>Calculating peer compatibility & rates...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="empty-state-card">
          <Sparkles size={40} className="empty-icon" />
          <h3>No matches found in this category</h3>
          <p>Try adding more skills you can teach or want to learn in your profile!</p>
          <Link to="/profile" className="btn-primary">Update Profile</Link>
        </div>
      ) : (
        <div className="matches-grid">
          {matches.map((matchItem) => {
            const other = matchItem.user;
            const categories = matchItem.categories || [];

            // Primary category for styling
            const mutual = categories.find((c) => c.type === 'mutual-swap');
            const paidTutor = categories.find((c) => c.type === 'paid-tutor');
            const student = categories.find((c) => c.type === 'potential-student');
            const oneWay = categories.find((c) => c.type === 'one-way-swap');

            return (
              <div key={other._id} className="match-card">
                <div className="match-card-header">
                  <div className="match-user-meta">
                    <div className="avatar-placeholder">
                      {other.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="match-name">{other.name}</h4>
                      {other.availability && (
                        <div className="match-availability">
                          <Clock size={12} />
                          <span>{other.availability}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="match-card-badges-col">
                    <div className="rating-pill">
                      <Star size={13} fill="#f59e0b" stroke="#f59e0b" />
                      {other.ratingCount > 0 ? (
                        <span>
                          <strong>{other.ratingAverage.toFixed(1)}</strong> ★ ({other.ratingCount})
                        </span>
                      ) : (
                        <span className="badge-new-text">New</span>
                      )}
                    </div>
                    <div className="sessions-badge">
                      <Award size={13} />
                      <span>{other.sessionsCompleted || 0} completed</span>
                    </div>
                  </div>
                </div>

                {other.bio && <p className="match-bio">{other.bio}</p>}

                {/* Match Badges & Categories */}
                <div className="match-categories-container">
                  {mutual && (
                    <div className="category-section mutual-box">
                      <div className="category-pill mutual">
                        <ArrowLeftRight size={13} />
                        <span>Perfect Mutual Swap</span>
                      </div>
                      <div className="exchange-preview">
                        <div className="exchange-half">
                          <span className="exchange-label">They teach:</span>
                          <div className="skills-inline">
                            {mutual.theyTeachMe.map((s, idx) => (
                              <span key={idx} className="skill-chip-sm highlight">{s.skill}</span>
                            ))}
                          </div>
                        </div>
                        <div className="exchange-divider">⇄</div>
                        <div className="exchange-half">
                          <span className="exchange-label">You teach:</span>
                          <div className="skills-inline">
                            {mutual.iTeachThem.map((s, idx) => (
                              <span key={idx} className="skill-chip-sm highlight">{s.skill}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {paidTutor && (
                    <div className="category-section paid-box">
                      <div className="category-pill paid">
                        <DollarSign size={13} />
                        <span>Available as Paid Tutor</span>
                      </div>
                      <div className="tutor-skills-list">
                        {paidTutor.skills.map((s, idx) => (
                          <span key={idx} className="skill-chip-sm rate-chip">
                            {s.skill} • <strong>₹{s.rate}/hr</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {student && (
                    <div className="category-section student-box">
                      <div className="category-pill student">
                        <GraduationCap size={13} />
                        <span>Potential Student for You</span>
                      </div>
                      <div className="tutor-skills-list">
                        {student.skills.map((s, idx) => (
                          <span key={idx} className="skill-chip-sm student-chip">
                            Wants to learn <strong>{s.skill}</strong> (You charge ₹{s.rate}/hr)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {oneWay && !mutual && (
                    <div className="category-section oneway-box">
                      <div className="category-pill oneway">
                        <span>One-Way Swap Opportunity</span>
                      </div>
                      <div className="skills-inline">
                        {oneWay.theyTeachMe?.length > 0 && (
                          <span>Teaches you: {oneWay.theyTeachMe.map((s) => s.skill).join(', ')}</span>
                        )}
                        {oneWay.iTeachThem?.length > 0 && (
                          <span>You teach them: {oneWay.iTeachThem.map((s) => s.skill).join(', ')}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Match Action Buttons */}
                <div className="match-card-actions">
                  <Link to={`/u/${other._id}`} className="btn-secondary-sm" title="View Full Profile">
                    <ExternalLink size={14} />
                    <span>Profile</span>
                  </Link>

                  {mutual ? (
                    <button
                      onClick={() => handleOpenModal(other, 'swap', mutual.theyTeachMe[0]?.skill)}
                      className="btn-primary-sm"
                    >
                      <ArrowLeftRight size={14} />
                      <span>Request Swap</span>
                    </button>
                  ) : paidTutor ? (
                    <button
                      onClick={() => handleOpenModal(other, 'paid', paidTutor.skills[0]?.skill)}
                      className="btn-primary-sm paid-btn"
                    >
                      <DollarSign size={14} />
                      <span>Book Session</span>
                    </button>
                  ) : student ? (
                    <button
                      onClick={() => handleOpenModal(other, 'paid', student.skills[0]?.skill)}
                      className="btn-primary-sm"
                    >
                      <GraduationCap size={14} />
                      <span>Offer to Teach</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenModal(other, 'swap', '')}
                      className="btn-secondary-sm"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking / Request Modal */}
      <RequestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        targetUser={modalTargetUser}
        currentUser={user}
        initialType={modalType}
        initialSkill={modalSkill}
        onSuccess={() => {
          fetchMatches(activeTab);
        }}
      />
    </div>
  );
}
