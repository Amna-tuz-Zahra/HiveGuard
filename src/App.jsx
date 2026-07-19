import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import BackgroundTexture from './components/BackgroundTexture';
import FloatingElements from './components/FloatingElements';
import PhoneFrame from './components/PhoneFrame';
import BottomNav from './components/app/BottomNav';
import DashboardScreen from './components/app/DashboardScreen';
import TabularScreen from './components/app/TabularScreen';
import VisionScreen from './components/app/VisionScreen';
import ScanResultScreen from './components/app/ScanResultScreen';
import ResultsScreen from './components/app/ResultsScreen';
import SettingsScreen from './components/app/SettingsScreen';

function ScreenRouter() {
  const { currentScreen } = useApp();

  switch (currentScreen) {
    case 'home':
      return <DashboardScreen />;
    case 'tabular':
      return <TabularScreen />;
    case 'vision':
      return <VisionScreen />;
    case 'scanResult':
      return <ScanResultScreen />;
    case 'results':
      return <ResultsScreen />;
    case 'settings':
      return <SettingsScreen />;
    default:
      return <DashboardScreen />;
  }
}

function AppContent() {
  return (
    <>
      <Navbar />
      <main className="main-layout">
        <BackgroundTexture />
        <FloatingElements />
        <PhoneFrame>
          <ScreenRouter />
          <BottomNav />
        </PhoneFrame>
      </main>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
