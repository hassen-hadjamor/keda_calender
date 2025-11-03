import React from 'react';
import { Package, Database, Layers } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ deployments, namespaceInfo }) => {
  return (
    <aside className="keda-sidebar" data-testid="keda-sidebar">
      <div className="sidebar-section">
        <div className="section-header">
          <Database className="section-icon" />
          <h3 className="section-title">Namespace</h3>
        </div>
        {namespaceInfo && (
          <div className="namespace-card" data-testid="namespace-card">
            <div className="namespace-badge">
              <span className="badge-dot"></span>
              {namespaceInfo.name}
            </div>
            <div className="namespace-stats">
              <div className="stat-item">
                <span className="stat-count">{namespaceInfo.total_scaled_objects}</span>
                <span className="stat-name">Scaled Objects</span>
              </div>
              <div className="stat-item">
                <span className="stat-count">{namespaceInfo.total_deployments}</span>
                <span className="stat-name">Deployments</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="sidebar-section">
        <div className="section-header">
          <Package className="section-icon" />
          <h3 className="section-title">Deployments</h3>
        </div>
        <div className="deployments-list" data-testid="deployments-list">
          {deployments.length === 0 ? (
            <div className="empty-state">
              <Layers className="empty-icon" />
              <p className="empty-text">No deployments</p>
              <p className="empty-subtext">Create an event to add deployments</p>
            </div>
          ) : (
            deployments.map((deployment) => (
              <div key={deployment.id} className="deployment-item" data-testid={`deployment-${deployment.name}`}>
                <div className="deployment-icon">
                  <Layers size={16} />
                </div>
                <div className="deployment-info">
                  <p className="deployment-name">{deployment.name}</p>
                  <p className="deployment-meta">
                    <span className="replica-badge">{deployment.current_replicas}</span>
                    replicas
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="sidebar-section trigger-legend">
        <div className="section-header">
          <div className="legend-icon">ℹ️</div>
          <h3 className="section-title">Trigger Types</h3>
        </div>
        <div className="legend-list">
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#3b82f6' }}></span>
            <span className="legend-label">Cron</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#10b981' }}></span>
            <span className="legend-label">Message Queue</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#f59e0b' }}></span>
            <span className="legend-label">Kafka</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#8b5cf6' }}></span>
            <span className="legend-label">HTTP</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#ef4444' }}></span>
            <span className="legend-label">Prometheus</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#6b7280' }}></span>
            <span className="legend-label">Custom</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
