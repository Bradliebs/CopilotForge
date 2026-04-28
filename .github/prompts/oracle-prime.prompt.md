---
description: "Invoke Oracle Prime for deep analysis — structured reasoning with scenario modeling, counterfactual stress testing, and confidence-rated conclusions"
---

# Oracle Prime Analysis

## Inputs

* ${input:question}: (Required) The question, decision, or problem to analyze.
* ${input:context}: (Optional) Known constraints, data points, or context. Separate items with semicolons.
* ${input:horizon}: (Optional, defaults to 12 months) Time horizon for predictions and scenarios.

## Requirements

1. Classify the question complexity as Simple, Medium, or Complex.
2. Activate the appropriate reasoning stages based on complexity tier:
   - Simple → S1 (Problem Decomposition) only
   - Medium → S1 + S2 (Hypothesis Mapping) + S5 (Scenario Envelope)
   - Complex → Full S1–S7 pipeline with all output sections
3. Auto-select algorithm modes based on question type (max 2).
4. For Complex tier, include all required output sections: Reframe, Transparency Log, Key Variables, Scenario Map, Causal Chain, Counterfactual Pivot, Critical Uncertainties, Conclusion, Confidence.
5. Append the Evolution Block at the end of every response.
6. If a conclusion is worth preserving, suggest: `forge remember: [conclusion summary]`

---

Load and follow `.github/skills/oracle-prime/SKILL.md` as the core reasoning protocol. Analyze the provided question with full analytical rigor.
