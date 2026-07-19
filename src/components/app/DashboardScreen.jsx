import { Activity, Microscope, Camera, User, AlertTriangle, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import HoneycombLogo from '../HoneycombLogo';

export default function DashboardScreen() {
  const { showScreen, analysisHistory, backendOnline, viewHistoryItem } = useApp();

  return (
    <div className="app-screen" key="home">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header__brand">
          <span className="dashboard-header__icon">
            <HoneycombLogo size={28} color="#F4AE52" />
          </span>
          <span className="dashboard-header__title">HiveGuard</span>
        </div>
        <div className="dashboard-header__avatar">
          <User size={18} />
        </div>
      </div>

      {/* Content */}
      <div className="screen-content">
        <p className="welcome-text">Welcome back, Beekeeper</p>

        {/* Backend Status */}
        <div className={`backend-status ${backendOnline ? 'backend-status--online' : 'backend-status--offline'}`}>
          {backendOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span>{backendOnline ? 'AI Backend Connected' : 'Backend Offline — Start server on port 8000'}</span>
        </div>

        {/* Analysis History */}
        {analysisHistory.length > 0 ? (
          <div className="history-section">
            <div className="status-card__header" style={{ marginBottom: 12 }}>
              <Activity size={20} className="status-card__header-icon" />
              <span className="status-card__header-title">Recent Analyses</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {analysisHistory.map(item => (
                <div key={item.id} className="status-card" style={{ cursor: 'pointer' }} onClick={() => viewHistoryItem(item)}>
                  <div className="status-card__body">
                    <div>
                      <p className="status-card__label">Analyzed</p>
                      <p className="status-card__value" style={{ fontSize: 13 }}>{item.timestamp}</p>
                      <p className="status-card__label" style={{ marginTop: 4 }}>{item.state}</p>
                    </div>
                    <span className={`status-badge ${
                      item.risk === 'Critical' ? 'status-badge--critical' : 'status-badge--awaiting'
                    }`}>
                      {item.risk === 'Critical' ? (
                        <><AlertTriangle size={12} style={{ marginRight: 4 }} />{item.risk}</>
                      ) : (
                        <><CheckCircle size={12} style={{ marginRight: 4 }} />{item.risk}</>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="status-card">
            <div className="status-card__header">
              <Activity size={20} className="status-card__header-icon" />
              <span className="status-card__header-title">Hive Status</span>
            </div>
            <div className="status-card__body">
              <div>
                <p className="status-card__label">Last Inspected</p>
                <p className="status-card__value">No analyses yet</p>
              </div>
              <span className="status-badge status-badge--awaiting">Awaiting</span>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <p className="section-title" style={{ marginTop: 20 }}>Choose Analysis Mode</p>

        <button
          className="btn btn--primary"
          onClick={() => showScreen('tabular')}
          id="btn-full-analysis"
        >
          <Microscope size={22} />
          Full Hive Analysis
        </button>

        <button
          className="btn btn--secondary"
          onClick={() => showScreen('vision')}
          id="btn-scan-disease"
        >
          <Camera size={22} className="text-honey" />
          Standalone Disease Scan
        </button>

        {/* Info card */}
        <div className="info-card" style={{ marginTop: 16 }}>
          <p className="info-card__title">5-Layer AI Pipeline</p>
          <div className="info-card__steps">
            <div className="info-card__step">
              <span className="info-card__step-num">1</span>
              <span>Sensor Fusion (classification model and stacking model)</span>
            </div>
            <div className="info-card__step">
              <span className="info-card__step-num">2</span>
              <span>A* Search (optimal intervention path)</span>
            </div>
            <div className="info-card__step">
              <span className="info-card__step-num">3</span>
              <span>CSP Solver (budget validation)</span>
            </div>
            <div className="info-card__step">
              <span className="info-card__step-num">4</span>
              <span>Knowledge Base (12 bio rules)</span>
            </div>
            <div className="info-card__step">
              <span className="info-card__step-num">5</span>
              <span>Beekeeper Prescription</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
