import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Wallet as WalletIcon, 
  TrendingUp, 
  Clock, 
  CreditCard, 
  ShieldCheck, 
  AlertCircle,
  FileText 
} from 'lucide-react';

export function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWallet = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getWallet();
      setWallet(data);
    } catch (err) {
      setError(err.message || 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="wallet-page">
      <div className="page-header">
        <div className="page-header-content">
          <h2>Earnings & Escrow Wallet</h2>
          <p>Track your tutoring revenue, held escrow deposits, and student spending</p>
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
          <p>Calculating earnings and escrow ledger...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="wallet-stats-grid">
            <div className="stat-card earned-card">
              <div className="stat-icon-wrapper">
                <TrendingUp size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Total Earned & Released</span>
                <h3 className="stat-value">₹{wallet?.earned || 0}</h3>
                <span className="stat-subtext">Completed tutoring sessions</span>
              </div>
            </div>

            <div className="stat-card pending-card">
              <div className="stat-icon-wrapper">
                <Clock size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Pending in Escrow</span>
                <h3 className="stat-value">₹{wallet?.pendingHeld || 0}</h3>
                <span className="stat-subtext">Held until session completion</span>
              </div>
            </div>

            <div className="stat-card spent-card">
              <div className="stat-icon-wrapper">
                <CreditCard size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Total Spent on Tutors</span>
                <h3 className="stat-value">₹{wallet?.spent || 0}</h3>
                <span className="stat-subtext">Escrow + Completed tutoring</span>
              </div>
            </div>
          </div>

          {/* Escrow guarantee banner */}
          <div className="escrow-info-banner">
            <ShieldCheck size={20} />
            <div>
              <strong>SkillSwap Peer Escrow Guarantee</strong>
              <p>
                Student payments are held safely until the scheduled session concludes.
                If cancelled prior to the session, funds are immediately marked refunded.
                (Note: Simulated demo mode for academic project).
              </p>
            </div>
          </div>

          {/* Ledger / History Table */}
          <div className="wallet-history-card">
            <div className="history-header">
              <FileText size={18} />
              <h3>Transaction & Session History</h3>
            </div>

            {wallet?.history?.length === 0 ? (
              <div className="empty-history">
                <p>No paid tutoring transactions found yet. Book a session or teach students to view ledger entries.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Skill</th>
                      <th>Role</th>
                      <th>Participant</th>
                      <th>Duration</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Reference ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wallet?.history?.map((item) => (
                      <tr key={item._id}>
                        <td>{formatDate(item.date)}</td>
                        <td>
                          <span className="skill-chip-sm highlight">{item.skill}</span>
                        </td>
                        <td>
                          <span className={`role-badge ${item.role}`}>
                            {item.role === 'teacher' ? 'Tutor' : 'Student'}
                          </span>
                        </td>
                        <td>{item.counterpart || 'N/A'}</td>
                        <td>{item.durationMinutes} mins</td>
                        <td className="amount-cell">
                          <strong>₹{item.price}</strong>
                        </td>
                        <td>
                          <span className={`payment-pill ${item.paymentStatus}`}>
                            {item.paymentStatus.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <code className="payment-ref">{item.paymentRef || '—'}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
