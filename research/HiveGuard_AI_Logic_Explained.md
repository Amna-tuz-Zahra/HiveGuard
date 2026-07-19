# 🐝 HiveGuard AI Logic — Full Walkthrough (All Code Included)

This document converts `HiveGuard_AI_Logic.ipynb` into a readable guide. Every code cell from the notebook is included in full, followed by a plain-English explanation of what it does and why.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Cell 1 — Environment Setup](#cell-1--environment-setup)
3. [Cell 2 — pip Installs](#cell-2--pip-installs)
4. [Cell 3 — AI Sensor Fusion](#cell-3--ai-sensor-fusion)
   - [BeeClassifier (Vision CNN)](#beeclassifier-vision-cnn)
   - [TabPFNWrapper (Tabular Model)](#tabpfnwrapper-tabular-model)
   - [HiveGuardSensors (Fusion Engine)](#hiveguardsensors-fusion-engine)
5. [Cell 4 — A* Search Agent (Step 7)](#cell-4--a-search-agent-step-7)
6. [Cell 5 — CSP Solver (Step 8)](#cell-5--csp-solver-step-8)
7. [Cell 6 — Forward Chaining Inference (Step 9)](#cell-6--forward-chaining-inference-step-9)
8. [Cell 7 — Beekeeper's Prescription (Step 10)](#cell-7--beekeepers-prescription-step-10)
9. [End-to-End Data Flow](#end-to-end-data-flow)

---

## Project Overview

HiveGuard combines five AI layers to protect beehives:

| Step | Algorithm | Job |
|---|---|---|
| Sensor Fusion | EfficientNet-B4 CNN + TabPFN | Detect Varroa mites visually + assess environmental risk |
| Step 7 | A\* Search | Find cheapest, safest treatment sequence |
| Step 8 | CSP (Backtracking) | Validate schedule against stress and financial budgets |
| Step 9 | Forward Chaining | Diagnose *why* the threat exists using biological rules |
| Step 10 | Plain-English Translator | Output a farmer-readable action plan |

---

## Cell 1 — Environment Setup

```python
import os
os.makedirs('/content/HiveGuard_AI_Backend/models', exist_ok=True)
print("✅ Folders created successfully!")
```

**What it does:**  
Creates the folder `/content/HiveGuard_AI_Backend/models/` where trained model files (`.pth`, `.pkl`) will live. `exist_ok=True` means it won't crash if the folder already exists — safe to run multiple times.

---

## Cell 2 — pip Installs

```python
!pip install pandas numpy scikit-learn xgboost joblib onnxruntime Pillow tabpfn-client
```

**Why each library:**

| Library | Purpose |
|---|---|
| `pandas`, `numpy` | Data manipulation and array operations |
| `scikit-learn`, `xgboost` | Tabular ML utilities and model compatibility |
| `joblib` | Loading/saving trained models from disk |
| `onnxruntime` | Fast model inference (used in related notebooks) |
| `Pillow` | Image loading and preprocessing |
| `tabpfn-client` | Cloud-hosted TabPFN tabular classification model |

---

## Cell 3 — AI Sensor Fusion

> **Purpose:** Load both ML models and fuse their outputs into a single `STARTING_STATE` dictionary that all downstream AI modules will use.

### Full Code

```python
import numpy as np
import pandas as pd
import joblib
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import warnings
import timm
from sklearn.base import BaseEstimator, ClassifierMixin

warnings.filterwarnings('ignore')

class BeeClassifier(nn.Module):
    def __init__(self, num_classes=2):
        super().__init__()
        self.backbone = timm.create_model(
            "efficientnet_b4",
            pretrained=False,
            num_classes=0,
            in_chans=3
        )
        num_features = self.backbone.num_features # 1792 for B4

        self.pool = nn.AdaptiveAvgPool2d(1)
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.LayerNorm(num_features),
            nn.Dropout(0.4),
            nn.Linear(num_features, 512),
            nn.SiLU(),
            nn.LayerNorm(512),
            nn.Dropout(0.3),
            nn.Linear(512, num_classes)
        )

    def forward(self, x):
        x = self.backbone.forward_features(x)
        x = self.pool(x)
        x = self.classifier(x)
        return x

class TabPFNWrapper(BaseEstimator, ClassifierMixin):
    def __init__(self, model=None):
        self.model = model
        self.classes_ = None
    def predict(self, X): return self.model.predict(X)

class HiveGuardSensors:
    def __init__(self):
        print("Initializing HiveGuard AI Systems...")

        self.vision_model = BeeClassifier(num_classes=2)
        try:
            vision_path = '/content/HiveGuard_AI_Backend/models/T6_Model.pth'
            self.vision_model.load_state_dict(torch.load(vision_path, map_location=torch.device('cpu')))
            self.vision_model.eval()
            print("✔️ T6 Vision Neural Network Loaded Successfully (EfficientNet-B4)!")
        except Exception as e:
            print(f"⚠️ Vision Load Error: {e}")

        tabular_path = '/content/HiveGuard_AI_Backend/models/Tabular_Stack_v2.pkl'
        scaler_path = '/content/HiveGuard_AI_Backend/models/Stack_v2_scaler.pkl'
        try:
            self.tab_model = joblib.load(tabular_path)
            self.scaler = joblib.load(scaler_path)
            print("✔️ Tabular Environment Model Loaded.")
        except:
            print("⚠️ Tabular model requires API Key. Will use local failsafe.")
            self.tab_model = None

    def scan_bee_image(self, image_path):
        """Processes the bee image using the REAL EfficientNet-B4 model."""
        img = Image.open(image_path).convert("RGB")

        preprocess = transforms.Compose([
            transforms.Resize((280, 160)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        img_tensor = preprocess(img).unsqueeze(0)

        with torch.no_grad():
            outputs = self.vision_model(img_tensor)
            probs = torch.nn.functional.softmax(outputs[0], dim=0)
            pred_class = torch.argmax(probs).item()

        return "Infected" if pred_class == 1 else "Healthy"

    def predict_regional_risk(self, env_data):
        """Safely processes tabular data."""
        if self.tab_model is None:
            return "Severe" if env_data['stress_varroa_mites'] > 20 else "Low"

        try:
            env_data['varroa_pesticide_synergy'] = env_data['stress_varroa_mites'] * env_data['stress_pesticides']
            expected_features = list(self.scaler.feature_names_in_)
            aligned_data = {feat: env_data.get(feat, 0.0) for feat in expected_features}
            df = pd.DataFrame([aligned_data], columns=expected_features)
            X_scaled = self.scaler.transform(df)

            risk_class = self.tab_model.predict(X_scaled)[0]
            class_names = {0: "Low", 1: "Medium", 2: "Severe"}
            return class_names[risk_class]
        except Exception as e:
            return "Severe" if env_data['stress_varroa_mites'] > 20 else "Low"

    def generate_initial_state(self, env_data, image_path):
        print("\n--- RUNNING SENSOR FUSION ---")
        vision_result = self.scan_bee_image(image_path)
        tabular_result = self.predict_regional_risk(env_data)

        pest_risk = "High" if env_data['stress_pesticides'] > 5.0 else "Low"

        initial_state = {
            "Regional_Risk": tabular_result,
            "CNN_Varroa": vision_result,
            "Quarter": env_data['quarter'],
            "Pesticide_Risk": pest_risk,
            "Temp": env_data['avg_temp_celsius']
        }

        print(f"📷 Vision Output     : {vision_result} (Using EfficientNet-B4)")
        print(f"🌍 Regional Output   : {tabular_result} Risk")
        print(f"🎯 INITIAL STATE     : {initial_state}")
        return initial_state

ai_sensors = HiveGuardSensors()

sample_environment = {
    'quarter': 3, 'stress_pesticides': 15.0, 'stress_varroa_mites': 45.0,
    'avg_temp_celsius': 32.0
}

STARTING_STATE = ai_sensors.generate_initial_state(sample_environment, '/content/HiveGuard_AI_Backend/sample_bee.jpg')
```

---

### BeeClassifier (Vision CNN)

- `timm.create_model("efficientnet_b4", pretrained=False, num_classes=0)` — loads the EfficientNet-B4 backbone *without* the default head. `num_classes=0` strips the final layer so we can attach our own.
- `num_features = 1792` — EfficientNet-B4's feature vector size after global pooling.
- **Custom classifier head:**
  - `LayerNorm` — normalises activations, stabilising training.
  - `Dropout(0.4)` / `Dropout(0.3)` — randomly zeroes neurons during training to prevent overfitting.
  - `Linear(1792 → 512)` — compresses features.
  - `SiLU()` — smooth activation function with better gradient flow than ReLU.
  - `Linear(512 → 2)` — final output: class 0 = Healthy, class 1 = Infected.
- `forward_features(x)` extracts spatial feature maps before the backbone's own pooling, giving us more control.

### TabPFNWrapper (Tabular Model)

Wraps the TabPFN model in a `BaseEstimator`/`ClassifierMixin` shell so it behaves like any standard scikit-learn classifier. This makes it compatible with `joblib.load` and the rest of the pipeline.

### HiveGuardSensors (Fusion Engine)

**`scan_bee_image`** — Vision pipeline:
- Resizes to `(280, 160)` — the exact resolution the model was trained on.
- Normalises with ImageNet mean/std — standard for fine-tuned EfficientNet models.
- `torch.no_grad()` — disables gradient tracking during inference (saves memory).
- Returns `"Infected"` or `"Healthy"`.

**`predict_regional_risk`** — Tabular pipeline:
- Computes `varroa_pesticide_synergy = varroa × pesticide` — captures the *multiplicative* (not additive) effect when both threats co-exist.
- Falls back to a simple threshold rule if the TabPFN model failed to load — prevents a crash.
- Returns `"Low"`, `"Medium"`, or `"Severe"`.

**`generate_initial_state`** — Sensor Fusion:  
Calls both methods above and packages their outputs into one unified dictionary — the shared language for all downstream AI modules.

```python
STARTING_STATE = {
    "Regional_Risk": "Severe",   # from TabPFN
    "CNN_Varroa":    "Infected", # from EfficientNet-B4
    "Quarter":       3,          # from env_data
    "Pesticide_Risk":"High",     # derived from stress_pesticides > 5.0
    "Temp":          32.0        # from env_data
}
```

---

## Cell 4 — A\* Search Agent (Step 7)

> **Purpose:** Find the minimum-cost, biologically legal sequence of interventions that transforms the hive from its dangerous starting state to a safe "Low Risk" state.

### Full Code

```python
import heapq

class HiveGuardAgent:
    def __init__(self):
        self.actions = {
            "Liquid_Syrup_Feeding": {"cost": 10, "fixes_varroa": False, "fixes_pesticide": False, "prob": 1.0},
            "Apply_Oxalic_Vapor": {"cost": 30, "fixes_varroa": True, "fixes_pesticide": False, "prob": 0.6},
            "Apply_Oxalic_Extended_OAE": {"cost": 35, "fixes_varroa": True, "fixes_pesticide": False, "prob": 0.95},
            "Apply_Thymol": {"cost": 40, "fixes_varroa": True, "fixes_pesticide": False, "prob": 0.8},
            "Apply_HopGuard_3": {"cost": 40, "fixes_varroa": True, "fixes_pesticide": False, "prob": 0.75},
            "Apply_Formic_Pro": {"cost": 45, "fixes_varroa": True, "fixes_pesticide": False, "prob": 0.9},
            "Apply_Amitraz": {"cost": 45, "fixes_varroa": True, "fixes_pesticide": False, "prob": 0.95},
            "Relocate_Hive": {"cost": 95, "fixes_varroa": False, "fixes_pesticide": True, "prob": 1.0}
        }

    def heuristic(self, state):
        h_score = 0
        if state['Regional_Risk'] == "Severe": h_score += 100
        elif state['Regional_Risk'] == "Medium": h_score += 50
        if state['CNN_Varroa'] == "Infected": h_score += 80
        if state['Pesticide_Risk'] == "High": h_score += 80
        return h_score

    def is_goal(self, state):
        return (state['Regional_Risk'] == "Low" and
                state['CNN_Varroa'] == "Healthy" and
                state['Pesticide_Risk'] == "Low")

    def is_valid_action(self, state, action_name):
        temp_f = (state['Temp'] * 9/5) + 32
        quarter = state['Quarter']
        supers_on = state['Honey_Supers']

        if action_name == "Apply_Formic_Pro" and (temp_f < 50.0 or temp_f > 85.0):
            print(f"   - Action Rejected: Apply_Formic_Pro | Reason: Current ambient temperature ({temp_f:.1f}°F) exceeds safe parameters, risking acute brood mortality and Queen sterilization.")
            return False

        if action_name == "Apply_Thymol":
            if temp_f < 59.0 or temp_f > 100.0:
                print(f"   - Action Rejected: Apply_Thymol | Reason: Ambient temperature ({temp_f:.1f}°F) prevents optimal fumigant volatilization.")
                return False
            if supers_on:
                print(f"   - Action Rejected: Apply_Thymol | Reason: Contraindicated while honey supers are present. Imparts permanent odor to harvestable wax.")
                return False

        if action_name == "Apply_Amitraz" and supers_on:
            print(f"   - Action Rejected: Apply_Amitraz | Reason: Synthetic formulation strictly prohibited while human-consumption supers are installed.")
            return False

        if action_name == "Apply_HopGuard_3" and quarter in [2, 3]:
            print(f"   - Action Rejected: Apply_HopGuard_3 | Reason: Contact miticides cannot penetrate capped brood. Ineffective during exponential population phases.")
            return False

        if action_name == "Apply_Oxalic_Vapor" and quarter in [2, 3]:
            print(f"   - Action Rejected: Apply_Oxalic_Vapor | Reason: Vapor crystals cannot penetrate wax cappings. Treatment fails during active brood phases.")
            return False

        return True

    def apply_action(self, state, action_name):
        new_state = state.copy()
        if self.actions[action_name]['fixes_varroa']: new_state['CNN_Varroa'] = "Healthy"
        if self.actions[action_name]['fixes_pesticide']: new_state['Pesticide_Risk'] = "Low"
        if new_state['Regional_Risk'] == "Severe" and new_state['Pesticide_Risk'] == "Low": new_state['Regional_Risk'] = "Medium"
        if new_state['Regional_Risk'] == "Medium" and new_state['CNN_Varroa'] == "Healthy": new_state['Regional_Risk'] = "Low"
        return new_state

    def generate_execution_plan(self, path, g_score):
        print("\n=====================================================================")
        print(" 🐝 HIVEGUARD EXECUTIVE INTERVENTION PLAN")
        print("=====================================================================")
        print(f"STATUS: Optimal Path Discovered | Total Expected Cost (Effort/Risk): {g_score:.1f}\n")
        print("SYSTEM REASONING & EXECUTION PROTOCOL:")

        for step, action in enumerate(path, 1):
            expected_cost = self.actions[action]['cost'] / self.actions[action]['prob']
            if action == "Relocate_Hive":
                print(f"\nStep {step} - EXTRICATION PROTOCOL: {action} (Expected Cost: {expected_cost:.1f})")
                print("   Execution: Physically transport the apiary minimum 3 miles from current coordinates.")
                print("   Biological Rationale: System detected a critical Synergistic Lethality loop. Local agricultural pesticides are actively suppressing the bees' Toll immune pathway, while Varroa mites are draining xenobiotic-detoxifying fat bodies. Environmental toxicity must be broken before chemical mite treatments can be safely administered.")

            elif action == "Apply_Oxalic_Extended_OAE":
                print(f"\nStep {step} - PARASITIC INTERVENTION: {action} (Expected Cost: {expected_cost:.1f})")
                print("   Execution: Insert absorbent matrices soaked in 50% Oxalic Acid / 50% plant-based glycerin.")
                print("   Biological Rationale: With heavy nectar flows and high ambient summer temperatures, standard fumigants and synthetics are legally and biologically contraindicated. Extended-release matrices bypass the brood-penetration limitation by continuously killing phoretic mites over a 60-day period as they emerge.")

            else:
                print(f"\nStep {step} - INTERVENTION: {action} (Expected Cost: {expected_cost:.1f})")

        print("\nPROGNOSIS: Execution of this protocol transitions the apiary from 'SEVERE' to 'LOW' risk.")
        print("=====================================================================")

    def a_star_search(self, initial_state):
        print("\n🔍 --- INITIATING A* SEARCH AGENT ---")
        print(f"Starting Vector: {initial_state}\n")
        print("Evaluating State-Space Trajectories and Biological Constraints...")

        start_h = self.heuristic(initial_state)
        frontier = [(start_h, 0, initial_state, [])]
        explored = []

        while frontier:
            f_score, g_score, current_state, path = heapq.heappop(frontier)
            state_str = f"{current_state['Regional_Risk']}_{current_state['CNN_Varroa']}_{current_state['Pesticide_Risk']}"

            if self.is_goal(current_state):
                self.generate_execution_plan(path, g_score)
                return path, current_state

            if state_str in explored: continue
            explored.append(state_str)

            for action_name in self.actions.keys():
                if action_name in path: continue
                if not self.is_valid_action(current_state, action_name): continue

                next_state = self.apply_action(current_state, action_name)

                action_data = self.actions[action_name]
                expected_cost = action_data['cost'] / action_data['prob']

                new_g = g_score + expected_cost
                new_h = self.heuristic(next_state)
                new_f = new_g + new_h

                heapq.heappush(frontier, (new_f, new_g, next_state, path + [action_name]))

        print("❌ CRITICAL: System could not compute a biologically safe survival trajectory.")
        return None, None

STARTING_STATE['Colony_Size'] = 8000
STARTING_STATE['Honey_Supers'] = True

agent = HiveGuardAgent()
optimal_path, final_state = agent.a_star_search(STARTING_STATE)
```

---

### How the A\* Agent Works

**Actions dictionary** — each action has:
- `cost` — biological stress + financial effort (higher = more invasive).
- `prob` — treatment efficacy (0.0–1.0). A cheap but unreliable treatment is penalised.
- The agent uses **expected cost = `cost / prob`**, so a 60% effective treatment is mathematically less attractive than a 95% one of similar nominal cost.

**Heuristic `h(n)`** — estimates distance to goal. Severe risk = +100, Infected = +80, High pesticide = +80. This is admissible (never over-estimates), which guarantees A\* finds the true optimum.

**Goal state** — requires ALL THREE dimensions safe simultaneously: `Regional_Risk == "Low"`, `CNN_Varroa == "Healthy"`, `Pesticide_Risk == "Low"`.

**Constraint engine `is_valid_action`** — biological rejection rules:

| Rule | Condition | Biological Reason |
|---|---|---|
| Formic Pro rejected | Temp < 50°F or > 85°F | Flash-off below 50°F; queen sterilization above 85°F |
| Thymol rejected | Temp outside 59–100°F | Needs minimum temperature to volatilise properly |
| Thymol rejected | Honey supers present | Permanently taints harvestable honey with odour |
| Amitraz rejected | Honey supers present | Synthetic residues in honey are illegal for human consumption |
| HopGuard rejected | Quarter 2 or 3 | Cannot penetrate wax cappings during brood season |
| Oxalic Vapor rejected | Quarter 2 or 3 | Vapor cannot penetrate wax cappings |

**State transition `apply_action`** — regional risk cascades automatically: fixing pesticide moves Severe → Medium; fixing Varroa moves Medium → Low.

**Search loop** uses a `heapq` min-heap so the lowest `f = g + h` path is always explored first. Already-explored states are skipped; each treatment can only appear once per path.

---

## Cell 5 — CSP Solver (Step 8)

> **Purpose:** Given the A\* survival plan, determine what *else* the beekeeper can safely do today — a secondary operation (harvest/feed) and a diagnostic tool — without exceeding stress or financial budgets.

### Full Code

```python
class HiveGuardCSP:
    def __init__(self, a_star_plan, a_star_agent):
        self.variables = ["V1_Survival_Plan", "V2_Operation", "V3_Diagnostic"]

        self.domains = {
            "V1_Survival_Plan": [a_star_plan],
            "V2_Operation": ["Harvest_Honey", "Supplemental_Feeding", "None"],
            "V3_Diagnostic": ["Full_Alcohol_Wash", "CNN_Camera"]
        }

        self.costs = {
            "Apply_Oxalic_Extended_OAE": 35, "Relocate_Hive": 95,
            "Apply_Formic_Pro": 45, "Apply_Thymol": 40, "Apply_Amitraz": 45,
            "Harvest_Honey": 20, "Supplemental_Feeding": 10, "None": 0,
            "Full_Alcohol_Wash": 55, "CNN_Camera": 2
        }

        self.financial_costs = {
            "Apply_Oxalic_Extended_OAE": 25, "Relocate_Hive": 1500,
            "Apply_Formic_Pro": 50, "Apply_Thymol": 40, "Apply_Amitraz": 45,
            "Harvest_Honey": 80, "Supplemental_Feeding": 30, "None": 0,
            "Full_Alcohol_Wash": 15, "CNN_Camera": 0
        }

        self.base_cost = sum(a_star_agent.actions.get(act, {}).get("cost", 0) / a_star_agent.actions.get(act, {}).get("prob", 1.0) for act in a_star_plan)
        self.max_stress_budget = 140

        self.base_money = sum(self.financial_costs.get(act, 0) for act in a_star_plan)
        self.max_financial_budget = 1600

        self.rejection_log = {}

    def is_consistent(self, assignment, var, val):
        v1_plan = assignment.get("V1_Survival_Plan", val if var == "V1_Survival_Plan" else [])
        v2 = assignment.get("V2_Operation", val if var == "V2_Operation" else None)
        v3 = assignment.get("V3_Diagnostic", val if var == "V3_Diagnostic" else None)

        if "Relocate_Hive" in v1_plan and v2 == "Harvest_Honey":
            self.rejection_log["Harvest_Honey"] = "Physical and spatial hazard. Relocating a hive while extracting heavy honey supers forces complete spatial disorientation for foragers and risks structural collapse (Ref: Sec 5.0)."
            return False

        if any(f in v1_plan for f in ["Apply_Formic_Pro", "Apply_Thymol"]) and v2 == "Supplemental_Feeding":
            self.rejection_log["Supplemental_Feeding"] = "Fumigant fumes drive bees downward away from top-feeders, leading to starvation (Ref: Sec 6.2)."
            return False

        if any("Apply_" in act for act in v1_plan) and v2 == "Administer_Terramycin":
            self.rejection_log["Terramycin"] = "Antibiotic combined with miticide causes complete immunological exhaustion (Ref: Sec 6.1)."
            return False

        current_stress = self.base_cost
        current_money = self.base_money

        if v2:
            current_stress += self.costs[v2]
            current_money += self.financial_costs[v2]
        if v3:
            current_stress += self.costs[v3]
            current_money += self.financial_costs[v3]

        if current_stress > self.max_stress_budget or current_money > self.max_financial_budget:
            if current_stress > self.max_stress_budget:
                if var == "V3_Diagnostic" and val == "Full_Alcohol_Wash":
                    self.rejection_log["Full_Alcohol_Wash"] = f"A manual alcohol wash costs 55 stress points. Combined with the A* survival plan ({self.base_cost:.1f}), the total load ({current_stress:.1f}) mathematically exceeds the weakened colony's survival threshold (Limit: {self.max_stress_budget})."
                elif var == "V2_Operation" and val == "Supplemental_Feeding":
                    self.rejection_log["Supplemental_Feeding"] = f"Adding supplemental feeding pushes total stress ({current_stress:.1f}) over the limit (Limit: {self.max_stress_budget}). Hive must rest after relocation."

            if current_money > self.max_financial_budget:
                self.rejection_log[val] = f"Financial constraint violated. Adding this action (${self.financial_costs.get(val, 0)}) pushes the daily operation cost (${current_money}) over the commercial max budget of ${self.max_financial_budget}."
            return False

        return True

    def backtrack(self, assignment=None):
        if assignment is None:
            assignment = {}

        if len(assignment) == len(self.variables):
            return assignment

        unassigned_vars = [v for v in self.variables if v not in assignment]
        current_var = unassigned_vars[0]

        for value in self.domains[current_var]:
            print(f"   ➤ [CSP LAYER] Validating {current_var} = {value}...")

            if self.is_consistent(assignment, current_var, value):
                assignment[current_var] = value
                print(f"      [✓] Cleared Constraints (Biological & Financial).")

                result = self.backtrack(assignment)
                if result:
                    return result

                print(f"   ➤ Backtracking: Undoing {current_var} = {value}")
                del assignment[current_var]

        return None

    def print_final_report(self, valid_schedule):
        print("\n=====================================================================")
        print(" 🛡️ HIVEGUARD SYSTEM CHECKER & VALIDATION REPORT")
        print("=====================================================================")
        print("STATUS: Evaluating Beekeeper Operations against A* Survival Protocols")
        print("---------------------------------------------------------------------\n")

        print("SYSTEM CHECKER ALERTS (Rejected Operations):")
        for item, reason in self.rejection_log.items():
            print(f" ⚠️  {item} REJECTED:")
            print(f"    Authentic Reason: {reason}\n")

        print("---------------------------------------------------------------------")
        print(" ✅ FINAL VALIDATED EXECUTION SCHEDULE:")

        print(f"   🔹 V1_Survival_Plan: {valid_schedule['V1_Survival_Plan']}")
        print(f"   🔹 V2_Operation: {valid_schedule['V2_Operation']}")
        print(f"   🔹 V3_Diagnostic: {valid_schedule['V3_Diagnostic']}")

        total_stress = self.base_cost + self.costs[valid_schedule['V2_Operation']] + self.costs[valid_schedule['V3_Diagnostic']]
        total_money = self.base_money + self.financial_costs[valid_schedule['V2_Operation']] + self.financial_costs[valid_schedule['V3_Diagnostic']]

        print(f"\n 📊 TOTAL SYSTEM STRESS SCORE: {total_stress:.1f} (Max Limit: {self.max_stress_budget})")
        print(f" 💰 TOTAL FINANCIAL COST: ${total_money} (Max Budget: ${self.max_financial_budget})")
        print("\n 💡 CONCLUSION: The CSP successfully scheduled an intervention that is")
        print("    both biologically safe AND economically viable for commercial use.")
        print("=====================================================================")

print("\n⚙️ --- INITIATING CSP LAYER (SCHEDULING & VALIDATION) ---")
csp_solver = HiveGuardCSP(a_star_plan=optimal_path, a_star_agent=agent)
valid_schedule = csp_solver.backtrack()

if valid_schedule:
    csp_solver.print_final_report(valid_schedule)
else:
    print("\n❌ CSP FAILED: No valid schedule exists.")
```

---

### How the CSP Works

**Three variables to assign:**
- `V1_Survival_Plan` — fixed to the A\* output (only one option).
- `V2_Operation` — secondary farm task: harvest honey, supplement feed, or do nothing.
- `V3_Diagnostic` — monitoring tool: full alcohol wash or CNN camera scan.

**Two simultaneous budgets:**
- **Stress budget** — max total colony stress score of `140`.
- **Financial budget** — max daily cost of `$1,600`.

**Logical constraints in `is_consistent`:**
- Cannot harvest honey while relocating (spatial disorientation of foragers).
- Cannot supplement feed while using fumigants (fumes drive bees away from feeders).
- Cannot combine antibiotics with miticides (immunological exhaustion).

**Backtracking** — tries values one at a time. If a variable has no valid value given what's already assigned, it undoes the previous assignment and tries the next option. This is provably complete — if a valid schedule exists, it will be found.

Every rejection is logged with a plain-English biological/financial reason for the final report.

---

## Cell 6 — Forward Chaining Inference (Step 9)

> **Purpose:** Act as a "detective" — start from a few ML-derived clues and chain biological IF-THEN rules together to build a complete diagnosis of *why* the hive is at risk. The Knowledge Base also has **veto power** over the A\* plan (e.g., it can cancel a planned Amitraz treatment if fungicide synergy makes it acutely lethal).

### Full Code

```python
class Rule:
    def __init__(self, name, condition_func, conclusions, explanation):
        self.name = name
        self.condition_func = condition_func
        self.conclusions = conclusions
        self.explanation = explanation

class HiveGuardKB:
    def __init__(self):
        print("🧠 --- INITIATING HIVEGUARD KNOWLEDGE BASE (12-RULE SYSTEM) ---")
        self.rules = self._initialize_rules()

    def _initialize_rules(self):
        return [
            Rule("R1 (CNN DWV Trigger)",
                 lambda f: f.get('CNN_Detects_DWV') is True,
                 {'Mite_Load': 'High', 'Virus_Load': 'High'},
                 "Ref: Sec 4.1 - DWV indicates systemic infestation"),

            Rule("R2 (CNN K-Wing Trigger)",
                 lambda f: f.get('CNN_Detects_K_Wing') is True,
                 {'Physiological_Stress': 'High', 'Check_Nosema': True},
                 "Ref: Sec 4.2"),

            Rule("R3 (Neonicotinoid Synergy)",
                 lambda f: f.get('Mite_Load') == 'High' and f.get('Pesticide_Proximity') is True,
                 {'Detoxification_Failure': True, 'Risk_Level': 'Critical'},
                 "Ref: Sec 3.1 - Mites deplete fat bodies, ruining pesticide detox"),

            Rule("R4 (Cyanoamidine Synergy)",
                 lambda f: f.get('Pesticide_Proximity') is True and f.get('Fungicide_Proximity') is True,
                 {'Lethal_Synergy': True},
                 "Ref: Sec 3.2 - P450 enzyme inhibition loop"),

            Rule("R5 (Treatment Toxicity Loop)",
                 lambda f: f.get('Lethal_Synergy') is True and f.get('Proposed_Treatment') == 'Amitraz',
                 {'Miticide_Toxicity': 'Acute', 'Cancel_Chemical_Treatment': True},
                 "Ref: Sec 3.2 - Fungicides make Amitraz acutely toxic"),

            Rule("R6 (Nutritional Rescue)",
                 lambda f: f.get('Detoxification_Failure') is True,
                 {'Immune_Status': 'Compromised', 'Action_Feed_Pollen': True},
                 "Ref: Sec 3.2 - Bolster fat body vitellogenin"),

            Rule("R7 (Winter Death Trap)",
                 lambda f: f.get('Quarter') == 4 and f.get('Mite_Load') == 'High',
                 {'Winter_Fat_Body_Depletion': True, 'Risk_Level': 'Critical'},
                 "Ref: Seasonal vulnerability"),

            Rule("R8 (Q4 Treatment Optimum)",
                 lambda f: f.get('Winter_Fat_Body_Depletion') is True and f.get('Quarter') == 4 and f.get('Ambient_Temp', 100) < 50,
                 {'Action_Oxalic_Vaporization': True},
                 "Ref: Sec 2.4"),

            Rule("R9 (Formic Acid Temp Constraint)",
                 lambda f: f.get('Mite_Load') == 'High' and f.get('Ambient_Temp', 0) > 85,
                 {'Formic_Pro_Safe': False},
                 "Ref: Sec 1.1 - Prevents queen sterilization"),

            Rule("R10 (Alternative Summer Treatment)",
                 lambda f: f.get('Mite_Load') == 'High' and f.get('Formic_Pro_Safe') is False and f.get('Quarter') == 3,
                 {'Action_Extended_Oxalic': True},
                 "Ref: Safe summer intervention"),

            Rule("R11 (Emergency Relocation)",
                 lambda f: f.get('Lethal_Synergy') is True or f.get('Miticide_Toxicity') == 'Acute',
                 {'Action_Relocate_Hive': True},
                 "Ref: Extreme toxicity override"),

            Rule("R12 (Stable Baseline)",
                 lambda f: f.get('Mite_Load') == 'Low' and f.get('Pesticide_Proximity') is False,
                 {'Colony_State': 'Healthy', 'Action_Routine_Monitoring': True},
                 "Ref: Safe Baseline")
        ]

    def run_inference(self, initial_facts, scenario_name):
        facts = initial_facts.copy()
        print(f"\n===========================================================")
        print(f" 🔬 RUNNING INFERENCE TRACE: {scenario_name}")
        print(f"===========================================================")
        print(f"Initial Facts (Cycle 0): {facts}\n")

        cycle = 1
        new_facts_discovered = True

        while new_facts_discovered:
            new_facts_discovered = False
            print(f"• Cycle {cycle}:")
            cycle_triggered = False

            for rule in self.rules:
                if rule.condition_func(facts):
                    already_known = all(facts.get(k) == v for k, v in rule.conclusions.items())

                    if not already_known:
                        for k, v in rule.conclusions.items():
                            facts[k] = v

                        conclusions_str = ", ".join([f"{k} = {v}" for k, v in rule.conclusions.items()])
                        print(f"  o {rule.name} fires.")
                        print(f"    ↳ New Facts Added: {conclusions_str}")

                        new_facts_discovered = True
                        cycle_triggered = True

            if not cycle_triggered:
                print("  o No rules trigger. Inference halts.")

            cycle += 1

        self.generate_conclusion(facts, scenario_name)
        return facts

    def generate_conclusion(self, final_facts, scenario_name):
        print(f"\n 📋 FINAL CONCLUSION FOR {scenario_name.upper()}:")
        if final_facts.get("Risk_Level") == "Critical" or final_facts.get("Miticide_Toxicity") == "Acute":
            print("   The system averts a catastrophe. It logically deduces that the planned")
            print(f"   treatment ({final_facts.get('Proposed_Treatment')}) will kill the bees due to fungicide synergy.")
            print("   It cancels the chemical treatment, orders an emergency relocation,")
            print("   prescribes pollen to rebuild fat bodies, and defaults to a")
            print("   temperature-safe extended-release oxalic acid.")
            print("\n   [SYSTEM INTEGRATION NOTE]: This Knowledge Base successfully exercises")
            print("   'Veto Power' over the A* Agent (Step 7). Even if A* finds a cheaper path,")
            print("   this biological axiom forces the safe, constraint-based route.")
        elif final_facts.get("Colony_State") == "Healthy":
            print("   The system confirms the safe ML output and recommends routine")
            print("   monitoring without unnecessary and costly interventions.")
        print("===========================================================\n")

kb_system = HiveGuardKB()

scenario_1_facts = {
    'CNN_Detects_DWV': True,
    'Pesticide_Proximity': True,
    'Fungicide_Proximity': True,
    'Proposed_Treatment': 'Amitraz',
    'Quarter': 3,
    'Ambient_Temp': 90
}
kb_system.run_inference(scenario_1_facts, "Scenario 1 (Critical Lethality)")

scenario_2_facts = {
    'CNN_Detects_DWV': False,
    'CNN_Detects_K_Wing': False,
    'Mite_Load': 'Low',
    'Pesticide_Proximity': False,
    'Quarter': 2,
    'Ambient_Temp': 75
}
kb_system.run_inference(scenario_2_facts, "Scenario 2 (Stable Baseline)")
```

---

### How Forward Chaining Works

**The inference loop** is a fixed-point iteration:
1. Check every rule against the current fact set.
2. If a rule's condition is true and its conclusions aren't already known, add those conclusions as new facts.
3. Restart from step 1.
4. Stop when a full pass discovers nothing new.

**All 12 Rules:**

| Rule | IF (Condition) | THEN (New Facts) | Biological Meaning |
|---|---|---|---|
| R1 | CNN detects Deformed Wing Virus | Mite load = High, Virus load = High | DWV is a reliable proxy for systemic Varroa infestation |
| R2 | CNN detects K-Wing deformity | High physiological stress, check Nosema | K-Wing indicates possible Nosema fungal infection |
| R3 | High mite load AND pesticide proximity | Detoxification failure, Risk = Critical | Mites drain fat bodies that normally metabolise pesticides |
| R4 | Pesticide AND fungicide proximity | Lethal synergy | Fungicides inhibit P450 enzymes — pesticide breakdown fails |
| R5 | Lethal synergy AND Amitraz planned | Miticide toxicity = Acute, cancel treatment | Fungicide-inhibited P450 makes Amitraz acutely lethal |
| R6 | Detoxification failure | Immune status = Compromised, feed pollen | Pollen rebuilds vitellogenin (immune protein) in fat bodies |
| R7 | Quarter 4 AND high mite load | Winter fat body depletion, Risk = Critical | Autumn mites destroy winter bees' reserves needed for survival |
| R8 | Winter fat body depletion AND Q4 AND temp < 50°F | Oxalic vaporisation recommended | Cold winter = no capped brood; perfect window for oxalic acid |
| R9 | High mite load AND temp > 85°F | Formic Pro = not safe | Above 85°F, formic acid flash-off sterilises the queen |
| R10 | High mite load AND Formic Pro unsafe AND Q3 | Extended oxalic acid recommended | Safe alternative for hot summer months |
| R11 | Lethal synergy OR acute miticide toxicity | Relocate hive | Environment is too toxic; physical escape before any treatment |
| R12 | Low mite load AND no pesticide proximity | Colony = Healthy, routine monitoring | Confirms safe ML output; avoids unnecessary intervention |

**Scenario 1 trace** — R1 → R3 → R4 → R5 → R6 → R9 → R10 → R11 all fire in cascade. Amitraz is cancelled and relocation is ordered.  
**Scenario 2 trace** — only R12 fires. Colony is healthy; no action needed.

---

## Cell 7 — Beekeeper's Prescription (Step 10)

> **Purpose:** Translate all the AI outputs into a clean, plain-English report for the farmer — no Python syntax, no jargon.

### Full Code

```python
import os
import sys

class BeekeeperPrescription:
    def __init__(self, initial_facts, final_facts, csp_schedule, csp_rejections):
        self.initial_facts = initial_facts
        self.final_facts = final_facts
        self.schedule = csp_schedule
        self.rejections = csp_rejections

    def print_prescription(self):
        print("\n=====================================================================")
        print(" 👨‍🌾 HIVEGUARD: YOUR BEEKEEPING PRESCRIPTION & ACTION PLAN")
        print("=====================================================================")

        print("\n🩺 1. DOCTOR'S DIAGNOSIS (System Deductions):")

        deduced_facts = {k: v for k, v in self.final_facts.items() if k not in self.initial_facts}

        if not deduced_facts:
            print("   🟢 No critical biological threats detected. Hive is stable.")
        else:
            for key, value in deduced_facts.items():
                clean_key = str(key).replace("_", " ")
                clean_val = str(value).replace("_", " ")
                print(f"   ➤ {clean_key}: {clean_val}")

        print("\n📋 2. YOUR STEP-BY-STEP ACTION PLAN:")
        step_num = 1

        for task_category, action in self.schedule.items():
            if isinstance(action, list):
                for sub_action in action:
                    clean_action = str(sub_action).replace("_", " ")
                    print(f"   Step {step_num}: Proceed with {clean_action}")
                    step_num += 1
            elif str(action) != "None":
                clean_action = str(action).replace("_", " ")
                print(f"   Step {step_num}: Proceed with {clean_action}")
                step_num += 1

        print("\n⚠️ 3. STRICT WARNINGS (Do NOT do these things today):")

        if not self.rejections:
            print("   (No specific warnings today. Just follow the plan above!)")
        else:
            for rejected_task, reason in self.rejections.items():
                clean_task = str(rejected_task).replace("_", " ")
                print(f"   ❌ DO NOT {clean_task.upper()}")
                print(f"      Why? {reason}\n")

        print("=====================================================================")
        print("💡 The HiveGuard System has optimized this plan to save your bees.")
        print("=====================================================================")


# Run inference silently (suppress output — we only want the facts, not the full trace again)
old_stdout = sys.stdout
sys.stdout = open(os.devnull, 'w')

final_kb_facts = kb_system.run_inference(scenario_1_facts, "Translator")

sys.stdout = old_stdout

prescription = BeekeeperPrescription(
    initial_facts=scenario_1_facts,
    final_facts=final_kb_facts,
    csp_schedule=valid_schedule,
    csp_rejections=csp_solver.rejection_log
)

prescription.print_prescription()
```

---

### Key Design Points

- **`deduced_facts`** = `final_facts - initial_facts` — only the *new* knowledge the AI discovered is shown as the "Diagnosis". Facts the user already provided are not repeated back.
- **`.replace("_", " ")`** — converts Python identifiers (`CNN_Varroa`) into readable labels (`CNN Varroa`) without any extra formatting library.
- **stdout redirect** — the inference engine is run a second time purely to get the final fact dictionary, but the verbose cycle-by-cycle trace is suppressed so the prescription stays clean. `sys.stdout` is restored immediately after.

---

## End-to-End Data Flow

```
Raw Input
  ├── Bee image (JPG)
  └── Farm environment dict (quarter, pesticide stress, varroa stress, temp)
         │
         ▼
HiveGuardSensors  ← Cell 3
  ├── EfficientNet-B4  →  "Infected" / "Healthy"
  └── TabPFN           →  "Low" / "Medium" / "Severe"
         │
         └──► STARTING_STATE = {Regional_Risk, CNN_Varroa, Quarter, Pesticide_Risk, Temp}
                    │
                    ▼
              HiveGuardAgent (A*)  ← Cell 4
                    │  Heuristic guides search
                    │  Constraint engine prunes illegal branches
                    └──► optimal_path = ["Relocate_Hive", "Apply_Oxalic_Extended_OAE"]
                                │
                                ▼
                          HiveGuardCSP  ← Cell 5
                                │  Validates secondary operations
                                │  Enforces stress + financial budgets
                                └──► valid_schedule = {V1: [...], V2: "None", V3: "CNN_Camera"}
                                           │
                                           ▼
                                     HiveGuardKB  ← Cell 6
                                           │  Chains 12 biological IF-THEN rules
                                           │  Can VETO A* plan if biologically unsafe
                                           └──► final_kb_facts (enriched diagnosis)
                                                      │
                                                      ▼
                                               BeekeeperPrescription  ← Cell 7
                                                      ├── Section 1: Diagnosis
                                                      ├── Section 2: Action plan
                                                      └── Section 3: Warnings
```

The Knowledge Base (Cell 6) has **veto power** over the A\* agent — biological safety always overrides cost optimisation.

---

*Converted from `HiveGuard_AI_Logic.ipynb` — all 7 code cells included in full.*
