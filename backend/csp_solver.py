# HiveGuard Backend — CSP Solver (Step 8)
# Validates the A* survival plan and schedules secondary operations
# within stress and financial budget constraints

class HiveGuardCSP:
    """
    Constraint Satisfaction Problem solver.
    Given the A* survival plan, determines what else the beekeeper can
    safely do today — a secondary operation and a diagnostic tool —
    without exceeding stress or financial budgets.
    """

    def __init__(self, a_star_plan: list, a_star_agent, apiary_size: str = "commercial"):
        self.variables = ["V1_Survival_Plan", "V2_Operation", "V3_Diagnostic"]

        self.domains = {
            "V1_Survival_Plan": [a_star_plan],
            "V2_Operation": ["Harvest_Honey", "Supplemental_Feeding", "None"],
            "V3_Diagnostic": ["Full_Alcohol_Wash", "CNN_Camera"],
        }

        # Stress costs (colony impact units)
        self.costs = {
            "Apply_Oxalic_Extended_OAE": 35, "Relocate_Hive": 95,
            "Apply_Formic_Pro": 45, "Apply_Thymol": 40, "Apply_Amitraz": 45,
            "Apply_Oxalic_Vapor": 30, "Apply_HopGuard_3": 40,
            "Liquid_Syrup_Feeding": 10,
            "Harvest_Honey": 20, "Supplemental_Feeding": 10, "None": 0,
            "Full_Alcohol_Wash": 55, "CNN_Camera": 2,
        }

        # Financial costs (USD)
        self.financial_costs = {
            "Apply_Oxalic_Extended_OAE": 25, "Relocate_Hive": 1500,
            "Apply_Formic_Pro": 50, "Apply_Thymol": 40, "Apply_Amitraz": 45,
            "Apply_Oxalic_Vapor": 15, "Apply_HopGuard_3": 35,
            "Liquid_Syrup_Feeding": 10,
            "Harvest_Honey": 80, "Supplemental_Feeding": 30, "None": 0,
            "Full_Alcohol_Wash": 15, "CNN_Camera": 0,
        }

        # Calculate base costs from A* plan
        self.base_stress = sum(
            a_star_agent.actions.get(act, {}).get("cost", 0)
            / a_star_agent.actions.get(act, {}).get("prob", 1.0)
            for act in a_star_plan
        )
        self.base_money = sum(
            self.financial_costs.get(act, 0) for act in a_star_plan
        )

        # Budget limits — Rule 4: Apiary Size affects financial budget
        self.max_stress_budget = 140
        if apiary_size == "hobbyist":
            self.max_financial_budget = 500
        else:
            self.max_financial_budget = 1600

        self.rejection_log = {}

    def is_consistent(self, assignment: dict, var: str, val) -> bool:
        """Check if assigning val to var is consistent with constraints."""
        v1_plan = assignment.get("V1_Survival_Plan", val if var == "V1_Survival_Plan" else [])
        v2 = assignment.get("V2_Operation", val if var == "V2_Operation" else None)
        v3 = assignment.get("V3_Diagnostic", val if var == "V3_Diagnostic" else None)

        # Constraint: Cannot harvest honey while relocating
        if "Relocate_Hive" in v1_plan and v2 == "Harvest_Honey":
            self.rejection_log["Harvest_Honey"] = (
                "Physical and spatial hazard. Relocating a hive while extracting heavy "
                "honey supers forces complete spatial disorientation for foragers and "
                "risks structural collapse of comb during transport."
            )
            return False

        # Constraint: Cannot feed while using fumigants
        if any(f in v1_plan for f in ["Apply_Formic_Pro", "Apply_Thymol"]) and v2 == "Supplemental_Feeding":
            self.rejection_log["Supplemental_Feeding"] = (
                "Fumigant fumes drive bees downward away from top-feeders, "
                "leading to starvation. Cannot combine feeding with fumigation."
            )
            return False

        # Budget checks
        current_stress = self.base_stress
        current_money = self.base_money

        if v2:
            current_stress += self.costs.get(v2, 0)
            current_money += self.financial_costs.get(v2, 0)
        if v3:
            current_stress += self.costs.get(v3, 0)
            current_money += self.financial_costs.get(v3, 0)

        if current_stress > self.max_stress_budget:
            if var == "V3_Diagnostic" and val == "Full_Alcohol_Wash":
                self.rejection_log["Full_Alcohol_Wash"] = (
                    f"A manual alcohol wash costs 55 stress points. Combined with "
                    f"the A* survival plan ({self.base_stress:.1f}), the total load "
                    f"({current_stress:.1f}) exceeds the weakened colony's survival "
                    f"threshold (Limit: {self.max_stress_budget})."
                )
            elif var == "V2_Operation" and isinstance(val, str):
                self.rejection_log[val] = (
                    f"Adding this operation pushes total stress ({current_stress:.1f}) "
                    f"over the colony survival limit ({self.max_stress_budget})."
                )
            return False

        if current_money > self.max_financial_budget:
            if isinstance(val, str):
                self.rejection_log[val] = (
                    f"Financial constraint violated. Adding this action "
                    f"(${self.financial_costs.get(val, 0)}) pushes the daily operation cost "
                    f"(${current_money}) over the max budget of ${self.max_financial_budget}."
                )
            else:
                # val is a list (survival plan) — budget already exceeded by base plan
                self.rejection_log["Base_Plan"] = (
                    f"The A* survival plan itself costs ${self.base_money}, "
                    f"which exceeds the budget of ${self.max_financial_budget}."
                )
            return False

        return True

    def backtrack(self, assignment: dict = None) -> dict:
        """Recursive backtracking search to find valid assignment."""
        if assignment is None:
            assignment = {}

        if len(assignment) == len(self.variables):
            return assignment

        unassigned = [v for v in self.variables if v not in assignment]
        current_var = unassigned[0]

        for value in self.domains[current_var]:
            if self.is_consistent(assignment, current_var, value):
                assignment[current_var] = value
                result = self.backtrack(assignment)
                if result:
                    return result
                del assignment[current_var]

        return None

    def solve(self) -> dict:
        """
        Run CSP solver and return structured result.
        
        Returns:
            {
                "success": bool,
                "schedule": {survival_plan, operation, diagnostic},
                "stress_score": float,
                "stress_limit": int,
                "financial_cost": int,
                "financial_limit": int,
                "rejections": [{item, reason}],
            }
        """
        valid_schedule = self.backtrack()

        if valid_schedule is None:
            return {
                "success": False,
                "schedule": None,
                "stress_score": self.base_stress,
                "stress_limit": self.max_stress_budget,
                "financial_cost": self.base_money,
                "financial_limit": self.max_financial_budget,
                "rejections": [
                    {"item": k, "reason": v}
                    for k, v in self.rejection_log.items()
                ],
                "error": "No valid schedule exists within constraints.",
            }

        # Calculate final totals
        total_stress = (
            self.base_stress
            + self.costs.get(valid_schedule["V2_Operation"], 0)
            + self.costs.get(valid_schedule["V3_Diagnostic"], 0)
        )
        total_money = (
            self.base_money
            + self.financial_costs.get(valid_schedule["V2_Operation"], 0)
            + self.financial_costs.get(valid_schedule["V3_Diagnostic"], 0)
        )

        return {
            "success": True,
            "schedule": {
                "survival_plan": valid_schedule["V1_Survival_Plan"],
                "operation": valid_schedule["V2_Operation"],
                "operation_label": valid_schedule["V2_Operation"].replace("_", " "),
                "diagnostic": valid_schedule["V3_Diagnostic"],
                "diagnostic_label": valid_schedule["V3_Diagnostic"].replace("_", " "),
            },
            "stress_score": round(total_stress, 1),
            "stress_limit": self.max_stress_budget,
            "financial_cost": round(total_money),
            "financial_limit": self.max_financial_budget,
            "rejections": [
                {"item": k.replace("_", " "), "reason": v}
                for k, v in self.rejection_log.items()
            ],
        }
