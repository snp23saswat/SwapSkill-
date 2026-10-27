import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { 
  ArrowLeftRight, 
  Inbox, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  Video, 
  DollarSign, 
  ShieldCheck, 
  AlertCircle,
  ExternalLink,
  Star 
} from 'lucide-react';
import { ReviewModal } from '../components/ReviewModal';

export function RequestsDashboard() {
  const { user } = useAuth();
  const [box, setBox] = useState('incoming'); // 'incoming' | 'outgoing'
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reviewingSession, setReviewingSession] = useState(null);

  // Accept modal state
  const [acceptingReq, setAcceptingReq] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = async (currentBox) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getRequests(currentBox);
      setRequests(data.requests || []);
    } catch (err) {
      setError(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(box);
  }, [box]);

  const openAcceptModal = (req) => {
    setAcceptingReq(req);
    setSelectedSlot(req.proposedSlots[0] || '');
    setMeetingLink('https://meet.google.com/new');
  };

  const handleAcceptSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please choose a time slot');
      return;
    }
    if (!meetingLink.trim()) {
      setError('Please provide a meeting link');
      return;
    }

    setActionLoading(true);
    setError('');
    try {
      await api.acceptRequest(acceptingReq._id, {
        slot: selectedSlot,
        meetingLink: meetingLink.trim(),
      });
      setSuccess('Session request accepted!');
      setAcceptingReq(null);
      fetchRequests(box);
    } catch (err) {
      setError(err.message || 'Failed to accept request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to decline this session request?')) return;
    setActionLoading(true);
    try {
      await api.rejectRequest(id);
      setSuccess('Request declined');
      fetchRequests(box);
    } catch (err) {
      setError(err.message || 'Failed to decline request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this session request? (Any held escrow payment will be refunded)')) return;
    setActionLoading(true);
    try {
      await api.cancelRequest(id);
      setSuccess('Session cancelled');
      fetchRequests(box);
    } catch (err) {
      setError(err.message || 'Failed to cancel request');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePay = async (id, price) => {
    setActionLoading(true);
    setError('');
    try {
      await api.paySession(id);
      setSuccess(`Demo payment of ₹${price} processed! Funds are now securely held in escrow.`);
      fetchRequests(box);
    } catch (err) {
      setError(err.message || 'Payment simulation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (id) => {
    if (!window.confirm('Confirm that this session has taken place? Funds will be released to the tutor.')) return;
    setActionLoading(true);
    setError('');
    try {
      await api.completeRequest(id);
      setSuccess('Session marked as completed! Payment released.');
      fetchRequests(box);
    } catch (err) {
      setError(err.message || 'Failed to complete session');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div className="requests-page">
      <div className="page-header">
        <div className="page-header-content">
          <h2>Exchange & Tutoring Sessions</h2>
          <p>Manage incoming requests, schedule calls, pay in escrow, and release earnings</p>
        </div>

        <div className="box-tab-bar">
          <button
            className={`box-tab-btn ${box === 'incoming' ? 'active' : ''}`}
            onClick={() => setBox('incoming')}
          >
            <Inbox size={16} />
            <span>Incoming Sessions</span>
          </button>
          <button
            className={`box-tab-btn ${box === 'outgoing' ? 'active' : ''}`}
            onClick={() => setBox('outgoing')}
          >
            <Send size={16} />
            <span>Sent Requests</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="form-error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="form-success-banner">
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="center-loader">
          <div className="spinner"></div>
          <p>Loading session requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-state-card">
          <Clock size={40} className="empty-icon" />
          <h3>No {box} sessions</h3>
          <p>
            {box === 'incoming'
              ? 'You have no pending invitations. Explore matches to initiate swaps!'
              : 'You have not sent any requests yet. Find partners in the Matches tab!'}
          </p>
        </div>
      ) : (
        <div className="requests-list">
          {requests.map((req) => {
            const isReceiver = req.receiver?._id === user._id;
            const isInitiator = req.initiatedBy?._id === user._id;
            const isLearner = req.learner?._id === user._id;
            const isTeacher = req.teacher?._id === user._id;
            const counterpart = isReceiver ? req.initiatedBy : req.receiver;

            return (
              <div key={req._id} className={`request-card status-${req.status}`}>
                <div className="request-card-header">
                  <div className="request-type-badge">
                    {req.type === 'swap' ? (
                      <span className="badge-type swap">
                        <ArrowLeftRight size={13} />
                        <span>Skill Swap</span>
                      </span>
                    ) : (
                      <span className="badge-type paid">
                        <DollarSign size={13} />
                        <span>Paid Session (₹{req.price})</span>
                      </span>
                    )}

                    <span className={`status-pill ${req.status}`}>
                      {req.status.toUpperCase()}
                    </span>

                    {req.type === 'paid' && (
                      <span className={`payment-pill ${req.paymentStatus}`}>
                        Payment: {req.paymentStatus.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <span className="request-created">
                    Requested on {new Date(req.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="request-card-body">
                  <div className="counterpart-info">
                    <strong>{isReceiver ? 'From: ' : 'To: '}</strong>
                    <span className="counterpart-name">{counterpart?.name || 'User'}</span>
                    <span className="counterpart-email">({counterpart?.email})</span>
                  </div>

                  {req.type === 'swap' ? (
                    <div className="session-skill-details">
                      <div className="skill-detail-item">
                        <span className="detail-label">Initiator Teaches:</span>
                        <span className="skill-chip-sm highlight">
                          {req.skillTeachByInitiator || 'None (One-Way)'}
                        </span>
                      </div>
                      <div className="skill-detail-item">
                        <span className="detail-label">Receiver Teaches:</span>
                        <span className="skill-chip-sm highlight">
                          {req.skillTeachByReceiver || 'None (One-Way)'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="session-skill-details">
                      <div className="skill-detail-item">
                        <span className="detail-label">Subject Skill:</span>
                        <span className="skill-chip-sm highlight">{req.skill}</span>
                      </div>
                      <div className="skill-detail-item">
                        <span className="detail-label">Duration:</span>
                        <span>{req.durationMinutes} minutes</span>
                      </div>
                      <div className="skill-detail-item">
                        <span className="detail-label">Total Fee:</span>
                        <strong>₹{req.price}</strong>
                      </div>
                    </div>
                  )}

                  {req.message && (
                    <p className="request-message">
                      &ldquo;{req.message}&rdquo;
                    </p>
                  )}

                  {/* Scheduled info if accepted */}
                  {req.status === 'accepted' && (
                    <div className="scheduled-info-box">
                      <div className="scheduled-row">
                        <Calendar size={15} />
                        <span><strong>Scheduled Time:</strong> {formatDate(req.scheduledAt)}</span>
                      </div>
                      {req.meetingLink && (
                        <div className="scheduled-row">
                          <Video size={15} />
                          <span>
                            <strong>Meeting Link: </strong>
                            <a href={req.meetingLink} target="_blank" rel="noreferrer" className="link-external">
                              {req.meetingLink}
                            </a>
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Proposed slots if pending */}
                  {req.status === 'pending' && (
                    <div className="proposed-slots-box">
                      <span className="detail-label">Proposed Times:</span>
                      <ul>
                        {req.proposedSlots.map((slot, sIdx) => (
                          <li key={sIdx}>{formatDate(slot)}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Payment Escrow Notice for Paid Sessions */}
                  {req.type === 'paid' && req.status === 'accepted' && (
                    <div className="escrow-notice-card">
                      <ShieldCheck size={16} />
                      <div>
                        {req.paymentStatus === 'unpaid' && (
                          <span>
                            Awaiting student payment of ₹{req.price}. Funds will be held in simulated escrow.
                          </span>
                        )}
                        {req.paymentStatus === 'held' && (
                          <span className="escrow-held-text">
                            ₹{req.price} securely held in Escrow (Ref: {req.paymentRef}). Will be released to tutor upon session completion.
                          </span>
                        )}
                        {req.paymentStatus === 'released' && (
                          <span className="escrow-released-text">
                            Payment of ₹{req.price} has been released to {req.teacher?.name}!
                          </span>
                        )}
                        {req.paymentStatus === 'refunded' && (
                          <span className="escrow-refunded-text">
                            Payment of ₹{req.price} was refunded back to {req.learner?.name}.
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="request-card-actions">
                  {/* Receiver pending actions */}
                  {isReceiver && req.status === 'pending' && (
                    <>
                      <button
                        onClick={() => openAcceptModal(req)}
                        className="btn-primary-sm"
                        disabled={actionLoading}
                      >
                        <CheckCircle size={14} />
                        <span>Accept & Schedule</span>
                      </button>
                      <button
                        onClick={() => handleReject(req._id)}
                        className="btn-danger-sm"
                        disabled={actionLoading}
                      >
                        <XCircle size={14} />
                        <span>Decline</span>
                      </button>
                    </>
                  )}

                  {/* Initiator pending actions */}
                  {isInitiator && req.status === 'pending' && (
                    <button
                      onClick={() => handleCancel(req._id)}
                      className="btn-secondary-sm"
                      disabled={actionLoading}
                    >
                      Cancel Request
                    </button>
                  )}

                  {/* Paid accepted: Learner pays */}
                  {req.type === 'paid' && req.status === 'accepted' && req.paymentStatus === 'unpaid' && isLearner && (
                    <button
                      onClick={() => handlePay(req._id, req.price)}
                      className="btn-primary-sm pay-btn"
                      disabled={actionLoading}
                    >
                      <DollarSign size={14} />
                      <span>Pay ₹{req.price} (Demo Payment)</span>
                    </button>
                  )}

                  {/* Cancel accepted paid before scheduled time */}
                  {req.type === 'paid' && req.status === 'accepted' && (isLearner || isInitiator) && (
                    <button
                      onClick={() => handleCancel(req._id)}
                      className="btn-secondary-sm"
                      disabled={actionLoading}
                    >
                      Cancel & Refund
                    </button>
                  )}

                  {/* Mark Completed (for swap or paid with held payment) */}
                  {req.status === 'accepted' && (req.type === 'swap' || req.paymentStatus === 'held') && (
                    <button
                      onClick={() => handleComplete(req._id)}
                      className="btn-success-sm"
                      disabled={actionLoading}
                    >
                      <CheckCircle size={14} />
                      <span>Mark Completed</span>
                    </button>
                  )}

                  {/* Rate Partner on Completed Sessions */}
                  {req.status === 'completed' && (
                    !req.reviewedByMe ? (
                      <button
                        onClick={() => setReviewingSession(req)}
                        className="btn-primary-sm rate-btn"
                        disabled={actionLoading}
                        title="Leave a star rating & review for your peer"
                      >
                        <Star size={14} fill="#f59e0b" stroke="#f59e0b" />
                        <span>Rate your partner</span>
                      </button>
                    ) : (
                      <span className="reviewed-badge">
                        <Star size={13} fill="#f59e0b" stroke="#f59e0b" />
                        <span>Reviewed</span>
                      </span>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Accept Scheduling Modal */}
      {acceptingReq && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3>Accept Session with {acceptingReq.initiatedBy?.name}</h3>
                <p className="modal-subtitle">Confirm one of the proposed slots and provide a meeting link</p>
              </div>
              <button onClick={() => setAcceptingReq(null)} className="modal-close-btn">
                ×
              </button>
            </div>

            <form onSubmit={handleAcceptSubmit} className="modal-form">
              <div className="form-group">
                <label>Choose Confirmed Time Slot</label>
                <div className="slot-selection-list">
                  {acceptingReq.proposedSlots.map((slot, idx) => (
                    <label key={idx} className="slot-radio-label">
                      <input
                        type="radio"
                        name="selectedSlot"
                        value={slot}
                        checked={selectedSlot === slot}
                        onChange={() => setSelectedSlot(slot)}
                        required
                      />
                      <span>{formatDate(slot)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Meeting Link (Google Meet, Zoom, etc.)</label>
                <input
                  type="url"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/abc-defg-hij"
                  required
                  className="form-input"
                />
                <span className="field-hint">Paste any accessible video conference link</span>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setAcceptingReq(null)}
                  className="btn-secondary"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Confirming...' : 'Confirm & Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Review Modal */}
      {reviewingSession && (
        <ReviewModal
          isOpen={!!reviewingSession}
          onClose={() => setReviewingSession(null)}
          session={reviewingSession}
          currentUser={user}
          onSuccess={() => {
            setSuccess('Review submitted! Thank you for rating your peer.');
            fetchRequests(box);
          }}
        />
      )}
    </div>
  );
}
