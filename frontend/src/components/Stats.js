import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/tickets';

function Stats({ refreshKey }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE}/stats/`);
      setStats(response.data);
    } catch (err) {
      setError('Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="stats-container loading">Loading statistics...</div>;
  }

  if (error) {
    return <div className="stats-container"><div className="alert alert-error">{error}</div></div>;
  }

  if (!stats) {
    return <div className="stats-container"><div className="empty-state">No data available.</div></div>;
  }

  return (
    <div className="stats-container">
      <h2>Statistics Dashboard</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total_tickets}</div>
          <div className="stat-label">Total Tickets</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.open_tickets}</div>
          <div className="stat-label">Open Tickets</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.avg_tickets_per_day}</div>
          <div className="stat-label">Avg Tickets/Day</div>
        </div>
      </div>

      <div className="breakdown-section">
        <h3>Priority Breakdown</h3>
        <div className="breakdown-grid">
          {Object.entries(stats.priority_breakdown).map(([key, value]) => (
            <div key={key} className="breakdown-item">
              <div className={`breakdown-label priority-${key}`}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </div>
              <div className="breakdown-value">{value}</div>
              <div className="breakdown-bar">
                <div
                  className={`bar-fill priority-${key}`}
                  style={{
                    width: stats.total_tickets > 0
                      ? `${(value / stats.total_tickets) * 100}%`
                      : '0%'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="breakdown-section">
        <h3>Category Breakdown</h3>
        <div className="breakdown-grid">
          {Object.entries(stats.category_breakdown).map(([key, value]) => (
            <div key={key} className="breakdown-item">
              <div className={`breakdown-label category-${key}`}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </div>
              <div className="breakdown-value">{value}</div>
              <div className="breakdown-bar">
                <div
                  className={`bar-fill category-${key}`}
                  style={{
                    width: stats.total_tickets > 0
                      ? `${(value / stats.total_tickets) * 100}%`
                      : '0%'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={fetchStats} className="refresh-btn">
        Refresh Statistics
      </button>
    </div>
  );
}

export default Stats;
