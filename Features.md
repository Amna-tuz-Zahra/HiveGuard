# HiveGuard Mobile App: Internal UI/UX Feature Specification

This document details the screens, user flows, and features that live *inside* the central mobile emulator of the HiveGuard web platform. The interface is designed to seamlessly fuse user inputs with the dual-stream AI backend (Tabular V3 and CNN T6), ultimately displaying the A* and CSP generated intervention plans.

## 🎨 Internal App Color Logic
To maintain continuity with the main web background:
*   **Backgrounds & Cards:** `#FFF7C5` (Pale Yellow) for cards; white (`#FFFFFF`) for the main app background to keep it clean.
*   **Primary Buttons & Highlights:** `#F4AE52` (Warm Honey/Orange).
*   **Headers, Text & Icons:** `#4F252E` (Dark Brown/Burgundy) for high legibility.
*   **Safe/Success Indicators:** `#C1EBE9` (Soft Cyan) for "Low Risk" or "Healthy" states.

---

## 📱 Screen 1: The Hive Dashboard (Home)
*The landing screen when the app initializes inside the phone frame.*

*   **Header:** "HiveGuard" logo and a minimalist user profile icon.
*   **Current Status Card:** A quick snapshot of the last known hive state (e.g., "Last Inspected: 2 days ago | Status: Pending Update").
*   **Quick Action Buttons (2 main modules):**
    1.  `[Update Hive Profile]` (Routes to Screen 2 - Tabular Data)
    2.  `[Scan Bee Photo]` (Routes to Screen 3 - CNN Vision Data)
*   **Bottom Navigation Bar:** Home | Scan | Action Plans | Settings

---

## 📱 Screen 2: Hive Profile Form (Tabular AI Input)
*This screen collects the contextual data required for the V3 Stacking Ensemble (Stream 1).*

*   **Form Field 1: Season / Quarter**
    *   *UI:* Segmented control button (Q1 | Q2 | Q3 | Q4).
*   **Form Field 2: Ambient Temperature**
    *   *UI:* A slider or numeric input (e.g., "Current Temp: 80°F"). *Note: Crucial for the CSP Formic Acid constraint.*
*   **Form Field 3: Pesticide Proximity**
    *   *UI:* Toggle Switch (Yes/No) - "Are there active agricultural sprays within a 3-mile radius?"
*   **Form Field 4: Current Observations**
    *   *UI:* Multi-select checkboxes (e.g., "Rapid weight loss", "Low foraging activity", "High drone count").
*   **Action Button:** `[Save & Analyze Context]`
    *   *Function:* Submits data to the backend, returning a baseline Regional Risk Score (Low, Medium, Severe).

---

## 📱 Screen 3: Visual Anomaly Scanner (CNN AI Input)
*This screen handles the T6 Vision Model (Stream 2) using a strict file-upload mechanism.*

*   **Header:** "Upload Bee Specimen"
*   **Helper Text:** "Upload a clear, macro photo of a single bee to scan for Varroa mites, Deformed Wing Virus (DWV), or K-Wing."
*   **The Upload Zone:** 
    *   *UI:* A large, dashed-border rectangle in the center of the screen colored `#F4AE52` with 20% opacity. 
    *   *Elements inside:* A camera icon and text saying "Tap to Select File or Drag Photo Here".
    *   *Functionality:* Opens the native device file picker / image gallery.
*   **Image Preview Card:** Once a file is selected, the uploaded image is displayed as a square thumbnail with a "Remove" (X) button.
*   **Action Button:** `[Run AI Scan]`
    *   *Loading State:* Button changes to "Processing Neural Network..." with a small spinning hex animation.

---

## 📱 Screen 4: AI Health Report & Action Plan (The Results)
*This is the "Showcase" screen. It combines the ML predictions, the Knowledge Base reasoning, and the A* Search Agent's output into a readable format for the beekeeper.*

### Section A: The Combined Risk Gauge
*   **UI:** A large circular dial or semi-circle gauge.
*   **Output:** Shows the final fused state. 
    *   *Examples:* "Low Risk" (Color: `#C1EBE9`), "Hidden Danger" (Color: `#F4AE52`), or "CRITICAL SYNERGY" (Color: `#4F252E`).

### Section B: Diagnostic Reasoning (Knowledge Base Output)
*   *UI:* A collapsible accordion or a shaded card titled "Why am I seeing this?"
*   *Output:* Displays the logic from **Step 9**. 
    *   *Example Text:* "🧠 **AI Diagnosis:** The image uploaded shows Deformed Wing Virus (DWV). Combined with your report of nearby pesticide spraying, the hive is facing a **Lethal Synergy**. Mites have depleted the bees' fat bodies, destroying their ability to detoxify the pesticides."

### Section C: Intervention Path (A* Agent + CSP Output)
*   *UI:* A vertical step-by-step timeline or checklist. 
*   *Output:* Displays the sequence of actions calculated in **Steps 7 & 8**. Each step includes the estimated cost/effort.
    *   **Step 1:** 🛑 CANCEL planned chemical treatments. (Constraint enforced)
    *   **Step 2:** 🚚 RELOCATE hive immediately. (Effort: High - 95)
    *   **Step 3:** 🍯 PROVIDE supplemental pollen feed. (Effort: Low - 10)
    *   **Step 4:** 📷 USE Edge Camera again in 7 days to monitor. (Effort: Low - 2)

*   **Action Button:** `[Mark Plan as Complete]` (Saves state and returns to Home).

---

## ⚙️ Technical Note for Frontend Developer
*   **File Upload Handling:** Ensure the file input (`<input type="file" accept="image/*">`) validates image dimensions. If the user uploads a massive 4K image, the frontend should ideally compress it or the backend must resize it to `160x280 pixels` before feeding it to the PyTorch `.onnx` model as defined in the T6 handoff.
*   **State Management:** The app needs to hold the inputs from Screen 2 (Tabular) in memory so they can be sent *together* with the image from Screen 3 to trigger the final A* path generation for Screen 4.