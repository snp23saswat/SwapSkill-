import React, { useState } from 'react';
import { X, Star, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../api';

export function ReviewModal({ isOpen, onClose, session, currentUser, onSuccess }) {
  if (!isOpen || !session) return null;

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Determine partner name and skill
  const isInitiator = session.initiatedBy?._id === currentUser._id;
  const partner = isInitiator ? session.receiver : session.initiatedBy;

  let skillName = session.skill || '';
  if (session.type === 'swap') {
    skillName = isInitiator ? session.skillTeachByReceiver : session.skillTeachByInitiator;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      setError('Please select a star rating from 1 to 5.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.createReview(session._id, {
        rating: Number(rating),
        comment: comment.trim(),
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h3>Rate Your Experience with {partner?.name || 'Peer'}</h3>
            <p className="modal-subtitle">
              Session skill: <strong>{skillName || 'Exchange Session'}</strong>
            </p>
          </div>
          <button onClick={onClose} className="modal-close-btn" disabled={loading}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="form-error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Star Input */}
          <div className="form-group text-center">
            <label className="block mb-2 font-semibold">Your Rating (1 to 5 Stars)</label>
            <div className="star-rating-row">
              {[1, 2, 3, 4, 5].map((starVal) => {
                const filled = (hoverRating || rating) >= starVal;
                return (
                  <button
                    key={starVal}
                    type="button"
                    className={`star-select-btn ${filled ? 'filled' : ''}`}
                    onMouseEnter={() => setHoverRating(starVal)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(starVal)}
                    title={`${starVal} star${starVal > 1 ? 's' : ''}`}
                  >
                    <Star
                      size={32}
                      fill={filled ? '#f59e0b' : 'none'}
                      stroke={filled ? '#f59e0b' : '#64748b'}
                    />
                  </button>
                );
              })}
            </div>
            <span className="rating-text-hint">
              {rating === 5 && '🌟 Outstanding session!'}
              {rating === 4 && '👍 Great learning experience.'}
              {rating === 3 && '👌 Good session, met expectations.'}
              {rating === 2 && '👎 Needs some improvement.'}
              {rating === 1 && '⚠️ Unsatisfactory session.'}
            </span>
          </div>

          {/* Comment */}
          <div className="form-group">
            <label>Share feedback / comment (Optional, max 300 chars)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What made this session great? How was their teaching or communication?"
              maxLength={300}
              rows={3}
              className="form-textarea"
            />
            <span className="char-count">{comment.length}/300</span>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
