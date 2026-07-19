import { Home, Microscope, Camera, Settings } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'tabular', label: 'Analyze', icon: Microscope },
  { id: 'vision', label: 'Scan', icon: Camera },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function BottomNav() {
  const { currentScreen, showScreen } = useApp();

  return (
    <div className="bottom-nav">
      {navItems.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={`nav-btn ${currentScreen === id ? 'nav-btn--active' : ''}`}
          onClick={() => showScreen(id)}
          aria-label={label}
          id={`nav-${id}`}
        >
          <Icon size={22} />
          <span className="nav-btn__label">{label}</span>
        </button>
      ))}
    </div>
  );
}
