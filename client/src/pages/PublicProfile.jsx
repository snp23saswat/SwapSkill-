import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { RequestModal } from '../components/RequestModal';
import { 
  User, 
  Clock, 
  Award, 
  GraduationCap, 
  BookOpen, 
  ArrowLeftRight, 
  DollarSign, 
  AlertCircle,
  Star,
  MessageSquare,
  Filter 
} from 'lucide-react';

export function PublicProfile() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [skillFilter, setSkillFilter] = useState('');
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('swap');

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError('');
      try {
        const data = await api.getPublicProfile(id);
        setProfileUser(data.user);
      } catch (err) {
        setError(err.message || 'Failed to load user profile');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [id]);

  // Load reviews whenever id or skillFilter changes
  useEffect(() => {
    async function fetchReviews() {
      if (!id) return;
      setReviewsLoading(true);
      try {
        const data = await api.getUserReviews(id, skillFilter);
        setReviews(data.reviews || []);
        setReviewsTotal(data.total || 0);
      } catch (err) {
        console.error('Failed to load reviews:', err);
      } finally {
        setReviewsLoading(false);
      }
    }
    fetchReviews();
  }, [id, skillFilter]);

  if (loading) {
    return (
      <div className="center-loader">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="empty-state-card">
        <AlertCircle size={40} className="empty-icon text-danger" />
        <h3>User not found</h3>
        <p>{error || 'This profile does not exist or may have been removed.'}</p>
        <Link to="/matches" className="btn-primary">Back to Matches</Link>
      </div>
    );
  }

  const isSelf = currentUser && currentUser._id === profileUser._id;

  // Unique skills taught by this user for the filter dropdown
  const taughtSkills = Array.from(new Set(profileUser.offered.map((s) => s.skill)));

  return (
    <div className="public-profile-page">
      <div className="public-profile-card">
        <div className="profile-banner">
          <div className="profile-avatar-large">
            {profileUser.name.charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="profile-info-content">
          <div className="profile-heading-row">
            <div>
              <h2 className="profile-display-name">{profileUser.name}</h2>
              {profileUser.availability && (
                <div className="profile-avail">
                  <Clock size={15} />
                  <span>{profileUser.availability}</span>
                </div>
              )}
            </div>

            <div className="profile-stats-group">
              {/* Rating Pill */}
              <div className="stat-pill rating-stat-pill">
                <Star size={16} fill="#f59e0b" stroke="#f59e0b" />
                {profileUser.ratingCount > 0 ? (
                  <span>
                    <strong>{profileUser.ratingAverage?.toFixed(1)}</strong> ★ ({profileUser.ratingCount} reviews)
                  </span>
                ) : (
                  <span>
                    <strong className="text-muted">New Peer</strong> (0 reviews)
                  </span>
                )}
              </div>

              {/* Sessions Completed */}
              <div className="stat-pill">
                <Award size={16} />
                <span><strong>{profileUser.sessionsCompleted || 0}</strong> Sessions Completed</span>
              </div>
            </div>
          </div>

          {profileUser.bio && (
            <p className="profile-bio-text">{profileUser.bio}</p>
          )}

          {/* Connect Action for other users */}
          {!isSelf && currentUser && (
            <div className="profile-actions-bar">
              <button
                onClick={() => {
                  setModalType('swap');
                  setModalOpen(true);
                }}
                className="btn-primary"
              >
                <ArrowLeftRight size={16} />
                <span>Request Swap</span>
              </button>
              {profileUser.offered.some((s) => s.mode === 'paid' || s.mode === 'both') && (
                <button
                  onClick={() => {
                    setModalType('paid');
                    setModalOpen(true);
                  }}
                  className="btn-primary paid-btn"
                >
                  <DollarSign size={16} />
                  <span>Book as Tutor</span>
                </button>
              )}
            </div>
          )}

          {isSelf && (
            <div className="profile-actions-bar">
              <Link to="/profile" className="btn-secondary">Edit My Skills & Info</Link>
            </div>
          )}

          {/* Skills Grid */}
          <div className="skills-showcase-grid">
            <div className="skills-showcase-card">
              <div className="card-section-title">
                <GraduationCap size={18} />
                <h3>Skills Offered to Teach</h3>
              </div>
              <div className="skills-list-detailed">
                {profileUser.offered.length === 0 ? (
                  <p className="empty-hint">No teaching skills listed</p>
                ) : (
                  profileUser.offered.map((s, idx) => (
                    <div key={idx} className="skill-item-row">
                      <span className="skill-name">{s.skill}</span>
                      <div className="skill-badges">
                        <span className={`mode-badge ${s.mode}`}>
                          {s.mode.toUpperCase()}
                        </span>
                        {(s.mode === 'paid' || s.mode === 'both') && (
                          <span className="rate-badge">
                            ₹{s.hourlyRate}/hr
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="skills-showcase-card">
              <div className="card-section-title">
                <BookOpen size={18} />
                <h3>Skills Wanting to Learn</h3>
              </div>
              <div className="wanted-chips-list">
                {profileUser.wanted.length === 0 ? (
                  <div className="tutor-callout-inline">
                    <span>Participating purely as a Paid Tutor</span>
                  </div>
                ) : (
                  profileUser.wanted.map((skill, idx) => (
                    <span key={idx} className="wanted-chip">{skill}</span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Reviews & Ratings Section */}
          <div className="profile-reviews-section">
            <div className="reviews-section-header">
              <div className="reviews-title-wrap">
                <MessageSquare size={18} />
                <h3>Peer Ratings & Reviews</h3>
                <span className="badge-counter">{reviewsTotal} reviews</span>
              </div>

              {/* Skill Filter Dropdown */}
              {taughtSkills.length > 0 && (
                <div className="reviews-filter-wrap">
                  <Filter size={14} className="filter-icon" />
                  <select
                    value={skillFilter}
                    onChange={(e) => setSkillFilter(e.target.value)}
                    className="reviews-filter-select"
                  >
                    <option value="">All Skills</option>
                    {taughtSkills.map((sk) => (
                      <option key={sk} value={sk}>
                        {sk}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {reviewsLoading ? (
              <div className="center-loader py-4">
                <div className="spinner"></div>
                <p>Loading peer reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="empty-reviews-box">
                <p>No reviews yet {skillFilter ? `for "${skillFilter}"` : 'for this peer'}. Complete a session to leave the first review!</p>
              </div>
            ) : (
              <div className="reviews-list">
                {reviews.map((rev) => (
                  <div key={rev._id} className="review-card">
                    <div className="review-card-top">
                      <div className="reviewer-meta">
                        <div className="reviewer-avatar">
                          {rev.reviewer?.name?.charAt(0).toUpperCase() || 'P'}
                        </div>
                        <div>
                          <strong className="reviewer-name">{rev.reviewer?.name}</strong>
                          <span className="review-date">
                            {new Date(rev.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="review-card-rating">
                        <div className="stars-row">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={14}
                              fill={star <= rev.rating ? '#f59e0b' : 'none'}
                              stroke={star <= rev.rating ? '#f59e0b' : '#64748b'}
                            />
                          ))}
                        </div>
                        {rev.skill && (
                          <span className="review-skill-badge">{rev.skill}</span>
                        )}
                      </div>
                    </div>

                    {rev.comment && (
                      <p className="review-comment-text">&ldquo;{rev.comment}&rdquo;</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {!isSelf && currentUser && (
        <RequestModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          targetUser={profileUser}
          currentUser={currentUser}
          initialType={modalType}
        />
      )}
    </div>
  );
}
