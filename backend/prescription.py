# HiveGuard Backend — Beekeeper Prescription (Step 10)
# Translates all AI outputs into a clean, plain-English action plan


class BeekeeperPrescription:
    """Translates complex AI outputs into farmer-readable prescription."""

    def __init__(self, kb_result: dict, csp_result: dict, a_star_result: dict):
        self.kb = kb_result
        self.csp = csp_result
        self.a_star = a_star_result

    def generate(self) -> dict:
        """
        Generate the final prescription.
        
        Returns:
            {
                "diagnosis_items": [{fact, value}],
                "action_plan": [{step, action, description}],
                "warnings": [{item, reason}],
                "prognosis": str,
                "risk_level": str,
            }
        """
        # Section 1: Diagnosis — only deduced (new) facts
        diagnosis_items = []
        for fact, value in self.kb.get("deduced_facts", {}).items():
            # Skip internal action flags
            if fact.startswith("Action ") or fact == "Cancel Chemical Treatment":
                continue
            diagnosis_items.append({
                "fact": fact,
                "value": value,
                "severity": self._fact_severity(fact, value),
            })

        # Section 2: Action Plan — from A* steps + CSP schedule
        action_plan = []
        step_num = 1

        # Primary survival steps from A*
        for step in self.a_star.get("steps", []):
            action_plan.append({
                "step": step_num,
                "action": step["label"],
                "description": step["rationale"],
                "cost": step["expected_cost"],
                "efficacy": step.get("efficacy", "N/A"),
                "category": "survival",
            })
            step_num += 1

        # Secondary operation from CSP
        if self.csp.get("success") and self.csp.get("schedule"):
            schedule = self.csp["schedule"]

            if schedule.get("operation") and schedule["operation"] != "None":
                action_plan.append({
                    "step": step_num,
                    "action": schedule["operation_label"],
                    "description": "Secondary operation validated by CSP within stress and financial budgets.",
                    "cost": 0,
                    "efficacy": "N/A",
                    "category": "operation",
                })
                step_num += 1

            if schedule.get("diagnostic"):
                action_plan.append({
                    "step": step_num,
                    "action": schedule["diagnostic_label"],
                    "description": "Recommended diagnostic tool for follow-up monitoring.",
                    "cost": 0,
                    "efficacy": "N/A",
                    "category": "diagnostic",
                })
                step_num += 1

        # KB-derived additional actions
        kb_facts = self.kb.get("final_facts", {})
        if kb_facts.get("Action Feed Pollen") == "True":
            action_plan.append({
                "step": step_num,
                "action": "Supplemental Pollen Feed",
                "description": "Rebuild vitellogenin (immune protein) in depleted fat bodies to restore detoxification capacity.",
                "cost": 0,
                "efficacy": "N/A",
                "category": "nutrition",
            })
            step_num += 1

        # Section 3: Warnings — from CSP rejections + KB vetoes
        warnings = []
        for rej in self.csp.get("rejections", []):
            warnings.append({
                "item": rej["item"],
                "reason": rej["reason"],
                "source": "CSP Validator",
            })

        for veto in self.kb.get("vetoed_treatments", []):
            warnings.append({
                "item": veto,
                "reason": "Knowledge Base biological safety override.",
                "source": "Knowledge Base",
            })

        # Prognosis
        risk = self.kb.get("risk_level", "Unknown")
        if risk == "Critical":
            prognosis = (
                "CRITICAL — Immediate intervention required. Execution of this protocol "
                "transitions the apiary from critical to manageable risk. Follow all steps precisely."
            )
        elif self.kb.get("colony_state") == "Healthy":
            prognosis = (
                "STABLE — No critical threats detected. Continue routine monitoring "
                "and follow seasonal best practices."
            )
        else:
            prognosis = (
                "MODERATE — Action needed but not emergency. Follow the intervention plan "
                "within the recommended timeframe."
            )

        return {
            "diagnosis_items": diagnosis_items,
            "action_plan": action_plan,
            "warnings": warnings,
            "prognosis": prognosis,
            "risk_level": risk,
        }

    def _fact_severity(self, fact: str, value: str) -> str:
        """Determine severity level of a deduced fact for UI coloring."""
        critical_facts = {
            "Risk Level": "Critical",
            "Lethal Synergy": "True",
            "Miticide Toxicity": "Acute",
            "Detoxification Failure": "True",
            "Winter Fat Body Depletion": "True",
        }
        if fact in critical_facts and value == critical_facts[fact]:
            return "critical"

        warning_facts = ["Mite Load", "Virus Load", "Physiological Stress", "Immune Status"]
        if fact in warning_facts and value in ("High", "Compromised"):
            return "warning"

        if value in ("True", "High", "Critical", "Acute", "Compromised"):
            return "warning"

        return "info"
