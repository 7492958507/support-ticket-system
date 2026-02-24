import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/tickets';

function TicketForm({ onTicketCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [classifyLoading, setClassifyLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleClassify = async () => {
    if (!description.trim()) return;

    setClassifyLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/classify/`, {
        description
      });
      const { suggested_category, suggested_priority } = response.data;
      setCategory(suggested_category || 'general');
      setPriority(suggested_priority || 'medium');
    } catch (err) {
      console.error('Classification error:', err);
      // Graceful failure - keep current values
    } finally {
      setClassifyLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post(API_BASE + '/', {
        title,
        description,
        category,
        priority
      });

      setSuccess('Ticket created successfully!');
      setTitle('');
      setDescription('');
      setCategory('general');
      setPriority('medium');

      setTimeout(() => {
        onTicketCreated();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Create Support Ticket</h2>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            id="title"
            type="text"
            maxLength="200"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief summary of your issue"
            required
          />
          <small>{title.length}/200</small>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of your problem"
            rows="6"
            required
          />
          <button
            type="button"
            onClick={handleClassify}
            disabled={classifyLoading || !description.trim()}
            className="classify-btn"
          >
            {classifyLoading ? 'Analyzing...' : 'Get AI Suggestions'}
          </button>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="billing">Billing</option>
              <option value="technical">Technical</option>
              <option value="account">Account</option>
              <option value="general">General</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !title.trim() || !description.trim()}
          className="submit-btn"
        >
          {loading ? 'Creating...' : 'Submit Ticket'}
        </button>
      </form>
    </div>
  );
}

export default TicketForm;
