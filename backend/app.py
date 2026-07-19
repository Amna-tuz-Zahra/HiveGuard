# HiveGuard Backend — FastAPI Server
# Exposes the 5-layer AI pipeline as REST API endpoints

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import json
import os

from state_data import get_state_names, get_state_encoded
from climate_rules import get_temp_range, validate_temperature
from sensor_fusion import get_sensors
from a_star_agent import HiveGuardAgent
from csp_solver import HiveGuardCSP
from knowledge_base import HiveGuardKB, build_kb_facts
from prescription import BeekeeperPrescription

# ========== App Setup ==========

app = FastAPI(
    title="HiveGuard AI Backend",
    description="AI-powered beehive health monitoring & colony collapse prediction",
    version="2.0.0",
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI systems at startup
sensors = get_sensors()
kb_system = HiveGuardKB()


# ========== Endpoints ==========

@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "vision_model": sensors.vision_ready,
        "tabular_model": sensors.tabular_ready,
    }


@app.get("/api/states")
def get_states():
    """Returns list of valid US states for the dropdown (Rule 1)."""
    return {"states": get_state_names()}


@app.get("/api/climate/{state}/{quarter}")
def get_climate_range(state: str, quarter: int):
    """
    Returns valid temperature range for a state+quarter (Rule 2).
    Used by frontend to set input constraints.
    """
    try:
        temp_range = get_temp_range(state, quarter)
        return temp_range
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/analyze")
async def run_full_analysis(
    state: str = Form(...),
    quarter: int = Form(...),
    temperature_f: float = Form(...),
    pesticide_proximity: bool = Form(...),
    fungicide_proximity: bool = Form(False),
    honey_supers: bool = Form(...),
    apiary_size: str = Form("commercial"),
    file: Optional[UploadFile] = File(None),
):
    """
    Full Hive Analysis — runs the complete 5-layer AI pipeline:
    1. Sensor Fusion (tabular risk + vision CNN fused together)
    2. A* Search (optimal intervention path)
    3. CSP Solver (schedule validation)
    4. Knowledge Base (forward chaining diagnosis)
    5. Beekeeper Prescription (action plan)

    Accepts multipart form data with optional bee image.
    When image is provided, BOTH models work together in sensor fusion.
    """
    # Validate state (Rule 1)
    valid_states = get_state_names()
    if state not in valid_states:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid state: '{state}'. Must be a valid US state.",
        )

    # Validate temperature (Rule 2)
    temp_validation = validate_temperature(state, quarter, temperature_f)
    temp_f = temp_validation["clamped_temp"]
    temp_c = (temp_f - 32) * 5 / 9

    # Get state encoding
    state_encoded = get_state_encoded(state)

    # Derive stress values from inputs
    stress_varroa = 30.0 if pesticide_proximity else 10.0
    stress_pesticides = 15.0 if pesticide_proximity else 2.0
    if fungicide_proximity:
        stress_pesticides += 10.0

    # Read image if provided
    image_bytes = None
    if file is not None and file.content_type and file.content_type.startswith("image/"):
        image_bytes = await file.read()
        if len(image_bytes) == 0:
            image_bytes = None

    # Tabular and Vision checks are now handled gracefully by the fallback heuristic system.

    # ===== STEP 1: Sensor Fusion (BOTH models fused) =====
    env_data = {
        "quarter": quarter,
        "stress_pesticides": stress_pesticides,
        "stress_varroa_mites": stress_varroa,
        "avg_temp_celsius": temp_c,
        "state_encoded": state_encoded,
    }
    fusion_result = sensors.generate_initial_state(env_data, image_bytes)
    initial_state = fusion_result["state"]

    # Add user inputs to state for A* constraints
    initial_state["Honey_Supers"] = honey_supers
    initial_state["Colony_Size"] = 8000  # default

    # ===== STEP 2: A* Search =====
    agent = HiveGuardAgent()
    a_star_result = agent.a_star_search(initial_state)

    # ===== STEP 3: CSP Solver =====
    csp_result = {"success": False, "schedule": None, "rejections": []}
    if a_star_result["success"]:
        csp = HiveGuardCSP(
            a_star_plan=a_star_result["optimal_path"],
            a_star_agent=agent,
            apiary_size=apiary_size,
        )
        csp_result = csp.solve()

    # ===== STEP 4: Knowledge Base =====
    proposed_treatment = None
    if a_star_result["optimal_path"]:
        for act in a_star_result["optimal_path"]:
            if act.startswith("Apply_"):
                proposed_treatment = act.replace("Apply_", "")
                break

    kb_facts = build_kb_facts(
        cnn_result=initial_state.get("CNN_Varroa", "N/A"),
        pesticide_proximity=pesticide_proximity,
        fungicide_proximity=fungicide_proximity,
        quarter=quarter,
        temp_f=temp_f,
        proposed_treatment=proposed_treatment,
        regional_risk=fusion_result["sensor_fusion"]["regional_risk"],
    )
    kb_result = kb_system.run_inference(kb_facts)

    # ===== STEP 5: Prescription =====
    rx = BeekeeperPrescription(kb_result, csp_result, a_star_result)
    prescription_result = rx.generate()

    # Build full response
    return {
        "temperature_warning": temp_validation.get("warning"),
        "sensor_fusion": fusion_result["sensor_fusion"],
        "a_star": a_star_result,
        "csp": csp_result,
        "knowledge_base": kb_result,
        "prescription": prescription_result,
    }


@app.post("/api/scan")
async def scan_bee_image(file: UploadFile = File(...)):
    """
    Standalone Disease Scan — classifies a bee image using EfficientNet-B4.
    Independent from the full analysis pipeline.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    # Vision checks are now handled gracefully by the fallback system.

    image_bytes = await file.read()

    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")

    result = sensors.scan_bee_image(image_bytes)
    return result


# ========== Entry Point ==========

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
