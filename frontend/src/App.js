import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TicketForm from './components/TicketForm';
import TicketList from './components/TicketList';
import Stats from './components/Stats';
import './App.css';

function App() {
  const [activeView, setActiveView] = useState('list');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTicketCreated = () => {
    setRefreshKey(prev => prev + 1);
    setActiveView('list');
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Support Ticket System</h1>
        <nav className="nav-buttons">
          <button
            className={`nav-btn ${activeView === 'list' ? 'active' : ''}`}
            onClick={() => setActiveView('list')}
          >
            Tickets
          </button>
          <button
            className={`nav-btn ${activeView === 'create' ? 'active' : ''}`}
            onClick={() => setActiveView('create')}
          >
            Create Ticket
          </button>
          <button
            className={`nav-btn ${activeView === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveView('stats')}
          >
            Statistics
          </button>
        </nav>
      </header>

      <main className="app-main">
        {activeView === 'create' && (
          <TicketForm onTicketCreated={handleTicketCreated} />
        )}
        {activeView === 'list' && (
          <TicketList refreshKey={refreshKey} />
        )}
        {activeView === 'stats' && (
          <Stats refreshKey={refreshKey} />
        )}
      </main>
    </div>
  );
}

export default App;
