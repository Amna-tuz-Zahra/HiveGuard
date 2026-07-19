import { useRef } from 'react';
import { ArrowLeft, Upload, X, Microscope, CheckCircle, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function VisionScreen() {
  const {
    showScreen, scanFile, scanPreviewUrl,
    handleScanImage, removeScanImage, submitScan, isScanning,
  } = useApp();
  const fileInputRef = useRef(null);

  const onFileChange = (e) => {
    if (e.target.files?.[0]) handleScanImage(e.target.files[0]);
  };

  const onRemoveImage = (e) => {
    e.stopPropagation();
    removeScanImage();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) handleScanImage(e.dataTransfer.files[0]);
  };

  return (
    <div className="app-screen" key="vision">
      {/* Header */}
      <div className="screen-header">
        <button className="screen-header__back" onClick={() => showScreen('home')} aria-label="Go back">
          <ArrowLeft size={24} />
        </button>
        <div>
          <p className="screen-header__title">Disease Scanner</p>
          <p className="screen-header__subtitle">CNN image classification only</p>
        </div>
      </div>

      {/* Content */}
      <div className="screen-content">
        <p className="helper-text">
          Upload a clear, macro photo of a single bee to classify as{' '}
          <strong>Healthy</strong> or <strong>Infected</strong> (Varroa / DWV).
          This uses the EfficientNet-B4 vision model independently.
        </p>

        {/* Upload Zone */}
        {!scanFile && (
          <div
            className="upload-zone"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          >
            <Upload size={40} className="upload-zone__icon" />
            <p className="upload-zone__title">Tap to Select Photo</p>
            <p className="upload-zone__subtitle">or Drag & Drop Here</p>
            <input type="file" ref={fileInputRef} accept="image/*"
              onChange={onFileChange} className="visually-hidden" id="file-input" />
          </div>
        )}

        {/* Preview */}
        {scanFile && scanPreviewUrl && (
          <div className="image-preview-card">
            <img src={scanPreviewUrl} alt="Uploaded bee specimen"
              className="image-preview-card__img" />
            <div className="image-preview-card__info">
              <p className="image-preview-card__name">{scanFile.name}</p>
              <p className="image-preview-card__size">{(scanFile.size / 1024).toFixed(1)} KB</p>
              <div className="image-preview-card__status">
                <CheckCircle size={14} />
                <span>Ready for classification</span>
              </div>
            </div>
            <button className="image-preview-card__remove" onClick={onRemoveImage} aria-label="Remove image">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Scan Button */}
        <button
          className="btn btn--primary"
          onClick={submitScan}
          disabled={!scanFile || isScanning}
          style={{ opacity: (!scanFile || isScanning) ? 0.5 : 1 }}
          id="btn-scan"
        >
          {isScanning ? (
            <>
              <Loader2 size={20} className="spin" />
              Classifying...
            </>
          ) : (
            <>
              <Microscope size={20} />
              Classify Image
            </>
          )}
        </button>

        {/* Info */}
        <div className="info-card" style={{ marginTop: 16 }}>
          <p className="info-card__title">How is this different?</p>
          <div className="info-card__steps">
            <div className="info-card__step">
              <span className="info-card__step-num" style={{ background: 'var(--color-cyan)', color: '#1a5e5a' }}>!</span>
              <span>This uses <strong>only</strong> the CNN vision model. For full analysis with both models + A* + CSP + KB, use "Full Hive Analysis".</span>
            </div>
          </div>
        </div>
      </div>

      {scanFile && (
        <input type="file" ref={fileInputRef} accept="image/*"
          onChange={onFileChange} className="visually-hidden" />
      )}
    </div>
  );
}
