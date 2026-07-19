import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://localhost:8000/api';

// Embedded US states — always available even if backend is down
const EMBEDDED_US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada",
  "New Hampshire","New Jersey","New Mexico","New York","North Carolina",
  "North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island",
  "South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont",
  "Virginia","Washington","West Virginia","Wisconsin","Wyoming"
];

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('hiveguard-dark-mode');
    return saved === 'true';
  });

  // Form data for full analysis
  const [formData, setFormData] = useState({
    state: '',
    quarter: null,
    temperature_f: '',
    pesticide_proximity: null,
    fungicide_proximity: null,
    honey_supers: null,
    apiary_size: 'commercial',
  });

  // Climate range for selected state+quarter
  const [climateRange, setClimateRange] = useState(null);

  // US States list (embedded fallback + try backend)
  const [usStates] = useState(EMBEDDED_US_STATES);

  // File upload for FULL analysis (both models fuse together)
  const [analysisFile, setAnalysisFile] = useState(null);
  const [analysisPreviewUrl, setAnalysisPreviewUrl] = useState(null);

  // File upload for STANDALONE scan
  const [scanFile, setScanFile] = useState(null);
  const [scanPreviewUrl, setScanPreviewUrl] = useState(null);

  // Results
  const [analysisResult, setAnalysisResult] = useState(null);
  const [scanResult, setScanResult] = useState(null);

  // Loading states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const [analysisStep, setAnalysisStep] = useState(0);

  // History of analyses
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [lastAnalysis, setLastAnalysis] = useState(null);

  // Backend status
  const [backendOnline, setBackendOnline] = useState(false);

  // Sync dark mode to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('hiveguard-dark-mode', darkMode.toString());
  }, [darkMode]);

  // Check backend health on mount
  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then(r => r.json())
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  const showScreen = useCallback((screenId) => {
    setCurrentScreen(screenId);
  }, []);

  const updateFormData = useCallback((key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  // Fetch climate range when state+quarter changes (Rule 2)
  const fetchClimateRange = useCallback(async (state, quarter) => {
    if (!state || !quarter) {
      setClimateRange(null);
      return;
    }
    try {
      const r = await fetch(`${API_BASE}/climate/${encodeURIComponent(state)}/${quarter}`);
      if (r.ok) {
        const data = await r.json();
        setClimateRange(data);
      }
    } catch {
      setClimateRange(null);
    }
  }, []);

  // Analysis image handlers (for full analysis with sensor fusion)
  const handleAnalysisImage = useCallback((file) => {
    if (file) {
      setAnalysisFile(file);
      setAnalysisPreviewUrl(URL.createObjectURL(file));
    }
  }, []);

  const removeAnalysisImage = useCallback(() => {
    if (analysisPreviewUrl) URL.revokeObjectURL(analysisPreviewUrl);
    setAnalysisFile(null);
    setAnalysisPreviewUrl(null);
  }, [analysisPreviewUrl]);

  // Scan image handlers (for standalone disease scan)
  const handleScanImage = useCallback((file) => {
    if (file) {
      setScanFile(file);
      setScanPreviewUrl(URL.createObjectURL(file));
    }
  }, []);

  const removeScanImage = useCallback(() => {
    if (scanPreviewUrl) URL.revokeObjectURL(scanPreviewUrl);
    setScanFile(null);
    setScanPreviewUrl(null);
  }, [scanPreviewUrl]);

  // Submit full analysis — multipart form with optional image
  // BOTH models (CNN + TabPFN) fuse together when image is provided
  const submitAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setAnalysisStep(0);
    setAnalysisResult(null);

    try {
      const fd = new FormData();
      fd.append('state', formData.state);
      fd.append('quarter', formData.quarter.toString());
      fd.append('temperature_f', formData.temperature_f.toString());
      fd.append('pesticide_proximity', formData.pesticide_proximity === true ? 'true' : 'false');
      fd.append('fungicide_proximity', formData.fungicide_proximity === true ? 'true' : 'false');
      fd.append('honey_supers', formData.honey_supers === true ? 'true' : 'false');
      fd.append('apiary_size', formData.apiary_size);
      if (analysisFile) {
        fd.append('file', analysisFile);
      }

      const r = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        body: fd,
      });

      if (!r.ok) {
        if (r.status === 503) {
           alert("Model is not connected. Please ensure the backend has the AI models loaded.");
           setIsAnalyzing(false);
           return;
        }
        const err = await r.json();
        throw new Error(err.detail || 'Analysis failed');
      }

      const data = await r.json();
      setAnalysisResult(data);
      
      const newAnalysis = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        risk: data.prescription?.risk_level || 'Unknown',
        state: formData.state,
        report: data
      };
      
      setLastAnalysis(newAnalysis);
      setAnalysisHistory(prev => [newAnalysis, ...prev]);
      
      setCurrentScreen('results');

      // Animate steps with delays
      for (let step = 1; step <= 5; step++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setAnalysisStep(step);
      }
    } catch (err) {
      alert(`Analysis error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [formData, analysisFile]);

  // Submit standalone disease scan (CNN only)
  const submitScan = useCallback(async () => {
    if (!scanFile) return;
    setIsScanning(true);
    setScanResult(null);

    try {
      const fd = new FormData();
      fd.append('file', scanFile);

      const r = await fetch(`${API_BASE}/scan`, {
        method: 'POST',
        body: fd,
      });

      if (!r.ok) {
        if (r.status === 503) {
          setScanResult({
            result: 'N/A',
            confidence: 0,
            disease: 'Model Not Connected',
            description: 'The vision model is not connected or loaded on the backend. Please check the server.'
          });
          setCurrentScreen('scanResult');
          return;
        }
        const err = await r.json();
        throw new Error(err.detail || 'Scan failed');
      }

      const data = await r.json();
      setScanResult(data);
      setCurrentScreen('scanResult');
    } catch (err) {
      alert(`Scan error: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  }, [scanFile]);

  const resetState = useCallback(() => {
    setFormData({
      state: '',
      quarter: null,
      temperature_f: '',
      pesticide_proximity: null,
      fungicide_proximity: null,
      honey_supers: null,
      apiary_size: 'commercial',
    });
    if (analysisPreviewUrl) URL.revokeObjectURL(analysisPreviewUrl);
    if (scanPreviewUrl) URL.revokeObjectURL(scanPreviewUrl);
    setAnalysisFile(null);
    setAnalysisPreviewUrl(null);
    setScanFile(null);
    setScanPreviewUrl(null);
    setAnalysisResult(null);
    setScanResult(null);
    setLastAnalysis(null);
    setClimateRange(null);
    setAnalysisStep(0);
    setCurrentScreen('home');
  }, [analysisPreviewUrl, scanPreviewUrl]);

  const viewHistoryItem = useCallback((historyItem) => {
    setAnalysisResult(historyItem.report);
    setAnalysisStep(5);
    setCurrentScreen('results');
  }, []);

  const value = {
    currentScreen, darkMode, formData, climateRange, usStates,
    analysisFile, analysisPreviewUrl,
    scanFile, scanPreviewUrl,
    analysisResult, scanResult,
    isAnalyzing, isScanning, analysisStep, lastAnalysis, analysisHistory, backendOnline,
    showScreen, toggleDarkMode, updateFormData, fetchClimateRange,
    handleAnalysisImage, removeAnalysisImage,
    handleScanImage, removeScanImage,
    submitAnalysis, submitScan, resetState, viewHistoryItem,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
