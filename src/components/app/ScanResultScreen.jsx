import { ShieldCheck, ShieldAlert, Camera, Home } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function ScanResultScreen() {
  const { scanResult, showScreen, scanPreviewUrl, resetState } = useApp();

  if (!scanResult) {
    return (
      <div className="app-screen" key="scanResult">
        <div className="screen-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>No scan results available.</p>
        </div>
      </div>
    );
  }

  const isInfected = scanResult.result === 'Infected';
  const isNA = scanResult.result === 'N/A';

  return (
    <div className="app-screen" key="scanResult">
      <div className="screen-content">
        {/* Result Header */}
        <div className={`scan-result-hero ${isInfected ? 'scan-result-hero--infected' : 'scan-result-hero--healthy'}`}>
          {scanPreviewUrl && (
            <img src={scanPreviewUrl} alt="Scanned bee"
              className="scan-result-hero__img" />
          )}
          <div className="scan-result-hero__badge-area">
            <div className={`scan-result-badge ${isInfected ? 'scan-result-badge--infected' : 'scan-result-badge--healthy'}`}>
              {isInfected ? <ShieldAlert size={28} /> : <ShieldCheck size={28} />}
              <span className="scan-result-badge__text">
                {isNA ? 'Model Unavailable' : scanResult.result}
              </span>
            </div>
            {scanResult.confidence > 0 && (
              <p className="scan-result-hero__confidence">
                {(scanResult.confidence * 100).toFixed(1)}% confidence
              </p>
            )}
          </div>
        </div>

        {/* Disease Info */}
        <div className="scan-result-info">
          <p className="scan-result-info__disease">{scanResult.disease}</p>
          <p className="scan-result-info__desc">{scanResult.description}</p>
        </div>

        {/* Actions */}
        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <button className="btn btn--secondary" onClick={() => showScreen('vision')} id="btn-scan-another">
            <Camera size={20} />
            Scan Another
          </button>
          <button className="btn btn--primary" onClick={resetState} style={{ marginTop: 8 }}
            id="btn-go-home">
            <Home size={20} />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
