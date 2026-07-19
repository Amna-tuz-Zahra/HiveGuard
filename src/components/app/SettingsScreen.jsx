import { Moon, Sun, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import HoneycombLogo from '../HoneycombLogo';

export default function SettingsScreen() {
  const { darkMode, toggleDarkMode, resetState } = useApp();

  return (
    <div className="app-screen" key="settings">
      {/* Header */}
      <div className="screen-header">
        <p className="screen-header__title" style={{ fontSize: '20px' }}>Settings</p>
      </div>

      {/* Content */}
      <div className="screen-content">
        {/* Appearance */}
        <div className="settings-group">
          <p className="settings-group__title">Appearance</p>
          <div className="settings-item">
            <div className="settings-item__left">
              <div className="settings-item__icon settings-item__icon--honey">
                {darkMode ? <Moon size={18} /> : <Sun size={18} />}
              </div>
              <div>
                <p className="settings-item__label">Dark Mode</p>
                <p className="settings-item__desc">
                  {darkMode ? 'Currently using dark theme' : 'Currently using light theme'}
                </p>
              </div>
            </div>
            <button
              className={`toggle-switch ${darkMode ? 'toggle-switch--active' : ''}`}
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
              id="settings-dark-mode"
            >
              <span className="toggle-switch__knob" />
            </button>
          </div>
        </div>


        {/* Data */}
        <div className="settings-group">
          <p className="settings-group__title">Data</p>
          <button className="btn btn--danger" onClick={resetState} id="btn-reset-data">
            <Trash2 size={18} />
            Reset All Data
          </button>
        </div>
      </div>
    </div>
  );
}
