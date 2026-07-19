import { useEffect, useRef } from 'react';
import {
  ArrowLeft, Thermometer, AlertTriangle, CheckCircle, MapPin,
  Brain, Loader2, Droplets, Box, Building2, Upload, X, Camera
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function TabularScreen() {
  const {
    showScreen, formData, updateFormData, usStates,
    climateRange, fetchClimateRange,
    submitAnalysis, isAnalyzing,
    analysisFile, analysisPreviewUrl, handleAnalysisImage, removeAnalysisImage,
  } = useApp();

  const fileInputRef = useRef(null);

  // Fetch climate range when state+quarter changes
  useEffect(() => {
    if (formData.state && formData.quarter) {
      fetchClimateRange(formData.state, formData.quarter);
    }
  }, [formData.state, formData.quarter, fetchClimateRange]);

  const isFormValid =
    formData.state &&
    formData.quarter &&
    formData.temperature_f !== '' &&
    formData.pesticide_proximity !== null &&
    formData.fungicide_proximity !== null &&
    formData.honey_supers !== null;

  const onFileChange = (e) => {
    if (e.target.files?.[0]) handleAnalysisImage(e.target.files[0]);
  };

  const onRemoveImage = (e) => {
    e.stopPropagation();
    removeAnalysisImage();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="app-screen" key="tabular">
      {/* Header */}
      <div className="screen-header">
        <button className="screen-header__back" onClick={() => showScreen('home')} aria-label="Go back">
          <ArrowLeft size={24} />
        </button>
        <div>
          <p className="screen-header__title">Full Hive Analysis</p>
          <p className="screen-header__subtitle">Environment + Image → 5-Layer AI</p>
        </div>
      </div>

      {/* Form */}
      <div className="screen-content">

        {/* US State (Rule 1) */}
        <label className="form-label">
          <MapPin size={14} style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} />
          US State
        </label>
        <div className="select-wrapper">
          <select
            className="select-field"
            value={formData.state}
            onChange={(e) => updateFormData('state', e.target.value)}
            id="state-select"
          >
            <option value="">Select state...</option>
            {usStates.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Quarter */}
        <label className="form-label">Season / Quarter</label>
        <div className="season-selector">
          {[1, 2, 3, 4].map(q => (
            <button
              key={q}
              className={`season-btn ${formData.quarter === q ? 'season-btn--active' : ''}`}
              onClick={() => updateFormData('quarter', q)}
            >
              Q{q}
            </button>
          ))}
        </div>

        {/* Temperature (Rule 2) */}
        <label className="form-label">
          <Thermometer size={14} style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} />
          Ambient Temperature (°F)
        </label>
        {climateRange && (
          <p className="form-hint">
            Valid: {climateRange.min_f}°F – {climateRange.max_f}°F ({climateRange.quarter_label})
          </p>
        )}
        <div className="input-wrapper">
          <input
            className="input-field"
            type="number"
            placeholder={climateRange ? `${climateRange.min_f} – ${climateRange.max_f}` : 'e.g. 80'}
            value={formData.temperature_f}
            onChange={(e) => updateFormData('temperature_f', e.target.value)}
            min={climateRange?.min_f}
            max={climateRange?.max_f}
            id="temp-input"
          />
          <span className="input-icon"><Thermometer size={20} /></span>
        </div>

        {/* Pesticide Proximity */}
        <label className="form-label">
          <Droplets size={14} style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} />
          Pesticide Proximity (3mi)
        </label>
        <div className="radio-group">
          <label className={`radio-option ${formData.pesticide_proximity === true ? 'radio-option--selected-yes' : ''}`}>
            <input type="radio" name="pesticide" checked={formData.pesticide_proximity === true}
              onChange={() => updateFormData('pesticide_proximity', true)} />
            <span className="radio-option__text">Yes</span>
            <AlertTriangle size={16} className="radio-option__icon text-honey" />
          </label>
          <label className={`radio-option ${formData.pesticide_proximity === false ? 'radio-option--selected-no' : ''}`}>
            <input type="radio" name="pesticide" checked={formData.pesticide_proximity === false}
              onChange={() => updateFormData('pesticide_proximity', false)} />
            <span className="radio-option__text">No</span>
            <CheckCircle size={16} className="radio-option__icon text-cyan" />
          </label>
        </div>

        {/* Fungicide Proximity */}
        <label className="form-label">
          <Droplets size={14} style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} />
          Fungicide Proximity (3mi)
        </label>
        <div className="radio-group">
          <label className={`radio-option ${formData.fungicide_proximity === true ? 'radio-option--selected-yes' : ''}`}>
            <input type="radio" name="fungicide" checked={formData.fungicide_proximity === true}
              onChange={() => updateFormData('fungicide_proximity', true)} />
            <span className="radio-option__text">Yes</span>
            <AlertTriangle size={16} className="radio-option__icon text-honey" />
          </label>
          <label className={`radio-option ${formData.fungicide_proximity === false ? 'radio-option--selected-no' : ''}`}>
            <input type="radio" name="fungicide" checked={formData.fungicide_proximity === false}
              onChange={() => updateFormData('fungicide_proximity', false)} />
            <span className="radio-option__text">No</span>
            <CheckCircle size={16} className="radio-option__icon text-cyan" />
          </label>
        </div>

        {/* Honey Supers (Rule 3) */}
        <label className="form-label">
          <Box size={14} style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} />
          Honey Supers Installed?
        </label>
        <div className="radio-group">
          <label className={`radio-option ${formData.honey_supers === true ? 'radio-option--selected-yes' : ''}`}>
            <input type="radio" name="supers" checked={formData.honey_supers === true}
              onChange={() => updateFormData('honey_supers', true)} />
            <span className="radio-option__text">Yes</span>
          </label>
          <label className={`radio-option ${formData.honey_supers === false ? 'radio-option--selected-no' : ''}`}>
            <input type="radio" name="supers" checked={formData.honey_supers === false}
              onChange={() => updateFormData('honey_supers', false)} />
            <span className="radio-option__text">No</span>
          </label>
        </div>

        {/* Apiary Size (Rule 4) */}
        <label className="form-label">
          <Building2 size={14} style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} />
          Apiary Size
        </label>
        <div className="select-wrapper">
          <select
            className="select-field"
            value={formData.apiary_size}
            onChange={(e) => updateFormData('apiary_size', e.target.value)}
            id="apiary-select"
          >
            <option value="hobbyist">Hobbyist (1-10 hives)</option>
            <option value="commercial">Commercial (50+ hives)</option>
          </select>
        </div>

        {/* Bee Image Upload — for Sensor Fusion (both models) */}
        <label className="form-label">
          <Camera size={14} style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} />
          Bee Specimen Photo (optional)
        </label>
        <p className="form-hint" style={{ marginTop: 0, marginBottom: 8 }}>
          Upload a photo to activate CNN vision model alongside tabular AI
        </p>

        {!analysisFile ? (
          <div
            className="upload-zone upload-zone--compact"
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          >
            <Upload size={24} className="upload-zone__icon" />
            <p className="upload-zone__title">Add Bee Photo</p>
            <p className="upload-zone__subtitle">Enables dual-model sensor fusion</p>
            <input type="file" ref={fileInputRef} accept="image/*"
              onChange={onFileChange} className="visually-hidden" />
          </div>
        ) : (
          <div className="image-preview-card">
            <img src={analysisPreviewUrl} alt="Bee specimen"
              className="image-preview-card__img" />
            <div className="image-preview-card__info">
              <p className="image-preview-card__name">{analysisFile.name}</p>
              <p className="image-preview-card__size">{(analysisFile.size / 1024).toFixed(1)} KB</p>
              <div className="image-preview-card__status">
                <CheckCircle size={14} />
                <span>CNN + TabPFN fusion active</span>
              </div>
            </div>
            <button className="image-preview-card__remove" onClick={onRemoveImage} aria-label="Remove">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Submit */}
        <button
          className="btn btn--primary"
          onClick={submitAnalysis}
          disabled={!isFormValid || isAnalyzing}
          id="btn-run-analysis"
          style={{ marginTop: 12, opacity: (!isFormValid || isAnalyzing) ? 0.5 : 1 }}
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={20} className="spin" />
              Running 5-Layer AI Pipeline...
            </>
          ) : (
            <>
              <Brain size={20} />
              Run Full AI Analysis
            </>
          )}
        </button>
      </div>
    </div>
  );
}
