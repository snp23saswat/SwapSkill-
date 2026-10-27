import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { 
  User, 
  Sparkles, 
  Check, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Save, 
  BookOpen, 
  GraduationCap, 
  DollarSign, 
  Info 
} from 'lucide-react';

export function Profile() {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [availability, setAvailability] = useState(user?.availability || '');

  // Array of { skill: string, mode: 'swap' | 'paid' | 'both', hourlyRate: number | null }
  const [offered, setOffered] = useState(user?.offered || []);
  // Array of string skill keys
  const [wanted, setWanted] = useState(user?.wanted || []);

  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add skill inputs
  const [newTeachSkill, setNewTeachSkill] = useState('');
  const [newTeachMode, setNewTeachMode] = useState('swap');
  const [newTeachRate, setNewTeachRate] = useState(250);

  const [newLearnSkill, setNewLearnSkill] = useState('');

  // Fetch canonical skill catalog on mount
  useEffect(() => {
    async function loadCatalog() {
      try {
        const data = await api.getSkills();
        setCatalog(data.categories || []);
      } catch (err) {
        console.error('Failed to load skills catalog:', err);
      }
    }
    loadCatalog();
  }, []);

  // Update local state when user changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setAvailability(user.availability || '');
      setOffered(user.offered || []);
      setWanted(user.wanted || []);
    }
  }, [user]);

  // Handlers for "I can teach"
  const addOfferedSkill = (skillName, mode = 'swap', rate = 250) => {
    const trimmed = skillName.trim();
    if (!trimmed) return;

    if (offered.some((s) => s.skill.toLowerCase() === trimmed.toLowerCase())) {
      setError(`"${trimmed}" is already in your teaching list.`);
      return;
    }

    const newEntry = {
      skill: trimmed,
      mode,
      hourlyRate: mode === 'swap' ? null : Number(rate) || 250,
    };

    setOffered([...offered, newEntry]);
    setNewTeachSkill('');
    setError('');
  };

  const removeOfferedSkill = (index) => {
    setOffered(offered.filter((_, i) => i !== index));
  };

  const updateOfferedMode = (index, newMode) => {
    const updated = [...offered];
    const current = updated[index];
    current.mode = newMode;
    if (newMode === 'swap') {
      current.hourlyRate = null;
    } else if (!current.hourlyRate) {
      current.hourlyRate = 250;
    }
    setOffered(updated);
  };

  const updateOfferedRate = (index, rate) => {
    const updated = [...offered];
    updated[index].hourlyRate = Math.min(5000, Math.max(50, Number(rate) || 50));
    setOffered(updated);
  };

  // Handlers for "I want to learn"
  const addWantedSkill = (skillName) => {
    const trimmed = skillName.trim();
    if (!trimmed) return;

    if (wanted.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setError(`"${trimmed}" is already in your learning list.`);
      return;
    }

    setWanted([...wanted, trimmed]);
    setNewLearnSkill('');
    setError('');
  };

  const removeWantedSkill = (index) => {
    setWanted(wanted.filter((_, i) => i !== index));
  };

  // Profile Save
  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Gate validation:
    // User must have at least 1 taught skill,
    // AND (at least 1 wanted skill OR at least 1 paid/both taught skill)
    if (offered.length === 0) {
      setError('You must list at least one skill you can teach.');
      return;
    }

    const hasPaidTaught = offered.some((s) => s.mode === 'paid' || s.mode === 'both');
    if (wanted.length === 0 && !hasPaidTaught) {
      setError(
        'Add at least one skill you want to learn, or set at least one teaching skill to Paid or Both mode to participate as a tutor.'
      );
      return;
    }

    // Rate validation for paid/both
    for (const item of offered) {
      if ((item.mode === 'paid' || item.mode === 'both') && (!item.hourlyRate || item.hourlyRate < 50 || item.hourlyRate > 5000)) {
        setError(`Hourly rate for "${item.skill}" must be between ₹50 and ₹5,000.`);
        return;
      }
    }

    setSaving(true);

    try {
      const data = await api.updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        availability: availability.trim(),
        offered,
        wanted,
      });

      updateUser(data.user);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Flattened predefined skills list for datalists
  const allPredefinedSkills = catalog.flatMap((c) => c.skills);

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header-card">
          <div className="profile-title-row">
            <div>
              <h2>Edit Your Profile & Skills</h2>
              <p>Configure what you teach, how you charge, and what you want to learn</p>
            </div>
            <div className="profile-stat-badge">
              <span>{user?.sessionsCompleted || 0} Sessions Completed</span>
            </div>
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
            <Check size={18} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="profile-form">
          {/* Section 1: Basic Info */}
          <div className="form-section-card">
            <h3 className="section-title">
              <User size={18} />
              <span>Personal Information</span>
            </h3>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>General Availability</label>
                <input
                  type="text"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  placeholder="e.g. Weekday evenings, Saturday mornings"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Short Bio (max 300 characters)</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={300}
                rows={3}
                placeholder="Tell others about your background, college year, or what you enjoy sharing..."
                className="form-textarea"
              />
              <span className="char-count">{bio.length}/300</span>
            </div>
          </div>

          {/* Section 2: Skills I Can Teach */}
          <div className="form-section-card">
            <div className="section-title-with-badge">
              <h3 className="section-title">
                <GraduationCap size={18} />
                <span>Skills I Can Teach (At least 1 required)</span>
              </h3>
              <span className="badge-counter">{offered.length} skills listed</span>
            </div>

            <div className="skill-add-bar">
              <input
                type="text"
                list="teach-skills-list"
                value={newTeachSkill}
                onChange={(e) => setNewTeachSkill(e.target.value)}
                placeholder="Type or pick a skill (e.g. React, Guitar, Spanish)..."
                className="form-input"
              />
              <datalist id="teach-skills-list">
                {allPredefinedSkills.map((s) => (
                  <option key={s.key} value={s.label} />
                ))}
              </datalist>

              <select
                value={newTeachMode}
                onChange={(e) => setNewTeachMode(e.target.value)}
                className="form-select mode-select"
              >
                <option value="swap">Swap Only</option>
                <option value="paid">Paid Only</option>
                <option value="both">Both (Swap or Paid)</option>
              </select>

              {(newTeachMode === 'paid' || newTeachMode === 'both') && (
                <div className="rate-input-container">
                  <span className="currency-prefix">₹</span>
                  <input
                    type="number"
                    min={50}
                    max={5000}
                    step={50}
                    value={newTeachRate}
                    onChange={(e) => setNewTeachRate(e.target.value)}
                    placeholder="Rate/hr"
                    className="form-input rate-input"
                    title="Rate per hour (₹50 - ₹5,000)"
                  />
                  <span className="rate-suffix">/hr</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => addOfferedSkill(newTeachSkill, newTeachMode, newTeachRate)}
                className="btn-primary"
              >
                <Plus size={16} />
                <span>Add</span>
              </button>
            </div>

            {/* List of offered skills */}
            <div className="offered-skills-list">
              {offered.length === 0 ? (
                <p className="empty-hint">No skills added yet. Add at least one skill you can teach.</p>
              ) : (
                offered.map((item, index) => (
                  <div key={index} className="offered-skill-row">
                    <div className="skill-name-col">
                      <span className="skill-tag">{item.skill}</span>
                    </div>

                    <div className="skill-controls-col">
                      <select
                        value={item.mode}
                        onChange={(e) => updateOfferedMode(index, e.target.value)}
                        className="form-select-sm"
                      >
                        <option value="swap">Swap Only</option>
                        <option value="paid">Paid Only</option>
                        <option value="both">Both (Swap or Paid)</option>
                      </select>

                      {(item.mode === 'paid' || item.mode === 'both') && (
                        <div className="rate-input-container-sm">
                          <span className="currency-prefix">₹</span>
                          <input
                            type="number"
                            min={50}
                            max={5000}
                            step={50}
                            value={item.hourlyRate || 250}
                            onChange={(e) => updateOfferedRate(index, e.target.value)}
                            className="form-input-sm rate-input"
                          />
                          <span className="rate-suffix">/hr</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => removeOfferedSkill(index)}
                        className="btn-icon-danger"
                        title="Remove skill"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 3: Skills I Want to Learn */}
          <div className="form-section-card">
            <div className="section-title-with-badge">
              <h3 className="section-title">
                <BookOpen size={18} />
                <span>Skills I Want to Learn (May be empty if teaching for money)</span>
              </h3>
              <span className="badge-counter">{wanted.length} skills</span>
            </div>

            {/* Tutor only callout banner */}
            <div className="tutor-callout-banner">
              <Info size={18} />
              <div>
                <strong>Not looking to learn anything right now? Teach for money!</strong>
                <p>
                  You can leave this section empty and participate purely as a paid tutor.
                  Students searching for your skills will be able to book and pay you directly.
                </p>
              </div>
            </div>

            <div className="skill-add-bar">
              <input
                type="text"
                list="learn-skills-list"
                value={newLearnSkill}
                onChange={(e) => setNewLearnSkill(e.target.value)}
                placeholder="Type or pick a skill you want to learn..."
                className="form-input"
              />
              <datalist id="learn-skills-list">
                {allPredefinedSkills.map((s) => (
                  <option key={s.key} value={s.label} />
                ))}
              </datalist>

              <button
                type="button"
                onClick={() => addWantedSkill(newLearnSkill)}
                className="btn-primary"
              >
                <Plus size={16} />
                <span>Add Skill</span>
              </button>
            </div>

            {/* List of wanted skill tags */}
            <div className="wanted-skills-tags">
              {wanted.length === 0 ? (
                <p className="empty-hint">
                  No learning skills added. You are currently participating purely as a paid tutor.
                </p>
              ) : (
                wanted.map((skill, index) => (
                  <div key={index} className="wanted-skill-chip">
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeWantedSkill(index)}
                      className="chip-remove-btn"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="form-save-bar">
            <button
              type="submit"
              className="btn-primary-lg"
              disabled={saving}
            >
              <Save size={18} />
              <span>{saving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
