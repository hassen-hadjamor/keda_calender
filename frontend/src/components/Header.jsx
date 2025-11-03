import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Activity, Server } from 'lucide-react';
import './Header.css';

const Header = ({ namespaceInfo, onRefresh }) => {
  return (
    <header className="keda-header" data-testid="keda-header">
      <div className="header-content">
        <div className="header-left">
          <div className="logo-section">
            <div className="logo-icon">
              <Server className="icon" />
            </div>
            <div>
              <h1 className="app-title" data-testid="app-title">KEDA Control Center</h1>
              <p className="app-subtitle">Kubernetes Event-Driven Autoscaling</p>
            </div>
          </div>
        </div>
        
        <div className="header-right">
          {namespaceInfo && (
            <div className="stats-row">
              <div className="stat-card" data-testid="total-events-stat">
                <Activity className="stat-icon" />
                <div>
                  <p className="stat-value">{namespaceInfo.total_events}</p>
                  <p className="stat-label">Total Events</p>
                </div>
              </div>
              <div className="stat-card" data-testid="active-events-stat">
                <div className="pulse-indicator"></div>
                <div>
                  <p className="stat-value">{namespaceInfo.active_events}</p>
                  <p className="stat-label">Active</p>
                </div>
              </div>
            </div>
          )}
          
          <Button 
            onClick={onRefresh} 
            className="refresh-btn"
            variant="outline"
            data-testid="refresh-button"
          >
            <RefreshCw className="btn-icon" />
            Refresh
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
