import React, { useState } from 'react';
import { X, Calendar, Clock, DollarSign, ArrowLeftRight, AlertCircle } from 'lucide-react';
import { api } from '../api';

export function RequestModal({
  isOpen,
  onClose,
  targetUser,
  currentUser,
  initialType = 'swap', // 'swap' | 'paid'
  initialSkill = '',
  onSuccess,
}) {
  if (!isOpen || !targetUser) return null;

  const [type, setType] = useState(initialType);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Swap fields
  const [initiatorSkill, setInitiatorSkill] = useState('');
  const [receiverSkill, setReceiverSkill] = useState(initialSkill || '');

  // Paid fields
  const [paidSkill, setPaidSkill] = useState(initialSkill || '');
  const [duration, setDuration] = useState(60); // 30, 60, 90

  // Common fields
  const [message, setMessage] = useState('');
  // 1 to 3 proposed slots (ISO or datetime-local strings)
  const defaultSlot = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
  const [slots, setSlots] = useState([defaultSlot]);

  // Determine eligible skills for current user (initiator)
  const mySwapSkills = (currentUser.offered || []).filter(
    (s) => s.mode === 'swap' || s.mode === 'both'
  );
  const myPaidSkills = (currentUser.offered || []).filter(
    (s) => s.mode === 'paid' || s.mode === 'both'
  );

  // Determine eligible skills for target user (receiver)
  const theirSwapSkills = (targetUser.offered || []).filter(
    (s) => s.mode === 'swap' || s.mode === 'both'
  );
  const theirPaidSkills = (targetUser.offered || []).filter(
    (s) => s.mode === 'paid' || s.mode === 'both'
  );

  // Determine selected tutor for paid sessions
  // Is targetUser the teacher or is currentUser the teacher?
  const isTargetTeacher = theirPaidSkills.length > 0;
  const teacherUser = isTargetTeacher ? targetUser : currentUser;
  const availablePaidSkills = isTargetTeacher ? theirPaidSkills : myPaidSkills;

  // Selected skill rate
  const selectedPaidSkillObj = availablePaidSkills.find(
    (s) => s.skill.toLowerCase() === (paidSkill || availablePaidSkills[0]?.skill)?.toLowerCase()
  );
  const hourlyRate = selectedPaidSkillObj ? selectedPaidSkillObj.hourlyRate : 50;
  const computedPrice = Math.round((hourlyRate * duration) / 60);

  const addSlot = () => {
    if (slots.length < 3) {
      const nextDay = new Date(Date.now() + (slots.length + 1) * 86400000)
        .toISOString()
        .slice(0, 16);
      setSlots([...slots, nextDay]);
    }
  };

  const removeSlot = (index) => {
    if (slots.length > 1) {
      setSlots(slots.filter((_, i) => i !== index));
    }
  };

  const updateSlot = (index, value) => {
    const updated = [...slots];
    updated[index] = value;
    setSlots(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate future slots
      const now = new Date();
      const parsedSlots = [];
      for (const s of slots) {
        if (!s) throw new Error('Please select all proposed time slots.');
        const d = new Date(s);
        if (isNaN(d.getTime())) throw new Error('Invalid date/time entered.');
        if (d <= now) throw new Error('All proposed slots must be in the future.');
        parsedSlots.push(d.toISOString());
      }

      if (type === 'swap') {
        const initSkill = initiatorSkill.trim();
        const recvSkill = (receiverSkill || theirSwapSkills[0]?.skill || '').trim();

        if (!initSkill && !recvSkill) {
          throw new Error('Please select at least one skill for the swap.');
        }

        await api.createRequest({
          type: 'swap',
          receiver: targetUser._id,
          skillTeachByInitiator: initSkill,
          skillTeachByReceiver: recvSkill,
          proposedSlots: parsedSlots,
          message: message.trim(),
        });
      } else {
        // Paid request
        const targetSkill = (paidSkill || availablePaidSkills[0]?.skill || '').trim();
        if (!targetSkill) {
          throw new Error('Please select a skill for the paid session.');
        }

        await api.createRequest({
          type: 'paid',
          receiver: targetUser._id,
          role: isTargetTeacher ? 'learner' : 'teacher',
          skill: targetSkill,
          durationMinutes: Number(duration),
          proposedSlots: parsedSlots,
          message: message.trim(),
        });
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h3>Book Session with {targetUser.name}</h3>
            <p className="modal-subtitle">Choose between peer skill-exchange or paid tutoring</p>
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

        <div className="type-toggle-container">
          <button
            type="button"
            className={`type-toggle-btn ${type === 'swap' ? 'active' : ''}`}
            onClick={() => setType('swap')}
          >
            <ArrowLeftRight size={16} />
            <span>Skill Swap</span>
          </button>
          <button
            type="button"
            className={`type-toggle-btn ${type === 'paid' ? 'active' : ''}`}
            onClick={() => setType('paid')}
          >
            <DollarSign size={16} />
            <span>Paid Tutoring</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {type === 'swap' ? (
            <div className="swap-fields-group">
              <div className="form-group">
                <label>Skill You Will Teach (Initiator)</label>
                <select
                  value={initiatorSkill}
                  onChange={(e) => setInitiatorSkill(e.target.value)}
                  className="form-select"
                >
                  <option value="">-- None (One-way: only learn from them) --</option>
                  {mySwapSkills.map((s) => (
                    <option key={s.skill} value={s.skill}>
                      {s.skill}
                    </option>
                  ))}
                </select>
                <span className="field-hint">Your swap-eligible skills</span>
              </div>

              <div className="form-group">
                <label>Skill {targetUser.name} Will Teach (Receiver)</label>
                <select
                  value={receiverSkill}
                  onChange={(e) => setReceiverSkill(e.target.value)}
                  className="form-select"
                >
                  <option value="">-- None (One-way: only teach them) --</option>
                  {theirSwapSkills.map((s) => (
                    <option key={s.skill} value={s.skill}>
                      {s.skill}
                    </option>
                  ))}
                </select>
                <span className="field-hint">{targetUser.name}&apos;s swap-eligible skills</span>
              </div>
            </div>
          ) : (
            <div className="paid-fields-group">
              <div className="form-group">
                <label>Select Tutoring Skill</label>
                <select
                  value={paidSkill}
                  onChange={(e) => setPaidSkill(e.target.value)}
                  className="form-select"
                >
                  {availablePaidSkills.map((s) => (
                    <option key={s.skill} value={s.skill}>
                      {s.skill} (₹{s.hourlyRate}/hr)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Session Duration</label>
                <div className="duration-options">
                  {[30, 60, 90].map((mins) => (
                    <button
                      type="button"
                      key={mins}
                      className={`duration-chip ${duration === mins ? 'selected' : ''}`}
                      onClick={() => setDuration(mins)}
                    >
                      <Clock size={14} />
                      <span>{mins} mins</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="price-preview-card">
                <div className="price-breakdown">
                  <span>Rate: ₹{hourlyRate}/hr × {duration} mins</span>
                  <span className="price-total">Price: ₹{computedPrice}</span>
                </div>
                <p className="price-notice">
                  * Computed securely on server. Simulated demo payment held until completion.
                </p>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="flex-label">
              <span>Proposed Future Time Slots ({slots.length}/3)</span>
              {slots.length < 3 && (
                <button
                  type="button"
                  onClick={addSlot}
                  className="btn-link"
                >
                  + Add another slot
                </button>
              )}
            </label>
            {slots.map((slot, idx) => (
              <div key={idx} className="slot-input-row">
                <Calendar size={16} className="slot-icon" />
                <input
                  type="datetime-local"
                  value={slot}
                  onChange={(e) => updateSlot(idx, e.target.value)}
                  className="form-input"
                  required
                />
                {slots.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSlot(idx)}
                    className="slot-remove-btn"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="form-group">
            <label>Message / Goals for the Session</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi! I'd like to practice..."
              maxLength={300}
              rows={3}
              className="form-textarea"
            />
            <span className="char-count">{message.length}/300</span>
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
              {loading ? 'Submitting...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
