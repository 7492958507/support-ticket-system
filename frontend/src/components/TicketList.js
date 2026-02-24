import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/tickets';

function TicketList({ refreshKey }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  // Editing
  const [editingId, setEditingId] = useState(null);
  const [editStatus, setEditStatus] = useState('');

  useEffect(() => {
    fetchTickets();
  }, [refreshKey, category, priority, status, search]);

  const fetchTickets = async () => {
    setLoading(true);
    setError('');
    try {
      let url = API_BASE + '/?ordering=-created_at';
      if (category) url += `&category=${category}`;
      if (priority) url += `&priority=${priority}`;
      if (status) url += `&status=${status}`;
      if (search) url += `&search=${search}`;

      const response = await axios.get(url);
      setTickets(response.data.results || response.data);
    } catch (err) {
      setError('Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await axios.patch(`${API_BASE}${ticketId}/`, { status: newStatus });
      fetchTickets();
      setEditingId(null);
    } catch (err) {
      setError('Failed to update ticket');
    }
  };

  const truncate = (text, limit = 100) => {
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="list-container">
      <h2>Support Tickets</h2>

      <div className="filters">
        <input
          type="text"
          placeholder="Search tickets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          <option value="billing">Billing</option>
          <option value="technical">Technical</option>
          <option value="account">Account</option>
          <option value="general">General</option>
        </select>

        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="empty-state">No tickets found.</div>
      ) : (
        <div className="tickets-table">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="ticket-row">
              <div className="ticket-content">
                <h3>{ticket.title}</h3>
                <p className="description">{truncate(ticket.description)}</p>
                <div className="ticket-meta">
                  <span className={`badge category-${ticket.category}`}>
                    {ticket.category}
                  </span>
                  <span className={`badge priority-${ticket.priority}`}>
                    {ticket.priority}
                  </span>
                  <span className="timestamp">{formatDate(ticket.created_at)}</span>
                </div>
              </div>

              <div className="ticket-status">
                {editingId === ticket.id ? (
                  <select
                    value={editStatus}
                    onChange={(e) => {
                      handleStatusChange(ticket.id, e.target.value);
                    }}
                    className="status-select"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                ) : (
                  <>
                    <span className={`status status-${ticket.status}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <button
                      onClick={() => {
                        setEditingId(ticket.id);
                        setEditStatus(ticket.status);
                      }}
                      className="edit-btn"
                    >
                      Change
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TicketList;
