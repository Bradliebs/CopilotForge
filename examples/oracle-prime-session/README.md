# Oracle Prime — Example Analysis Session

> This example shows a complete multi-turn Oracle Prime analysis session, demonstrating
> the adaptive reasoning pipeline, session state tracking, and evolution persistence.

## Scenario

A development team is deciding whether to adopt a microservices architecture for
their growing monolithic e-commerce platform.

---

## Turn 1: Initial Analysis

**User prompt:**
> Should we break our e-commerce monolith into microservices? We have 15 developers,
> 200k lines of code, and are experiencing scaling issues during sales events.

**Oracle Prime response:**

🔍 **REFRAME** — [DECISION] Whether to decompose a 200k-LOC e-commerce monolith into
microservices given a 15-person team and event-driven scaling pressure.

🔧 **TRANSPARENCY LOG**
- P1: [TRIGGERED] — "200k lines" sense-checked against industry base rates (median monolith ~150k LOC)
- P2: [TRIGGERED] — [RED TEAM] + [COUNTERFACTUAL] both relevant; convergence strengthens analysis
- P3: [BYPASSED: no cascading failure scenario]
- P4: [TRIGGERED] — Time horizon set to 18 months (migration + stabilization)
- P5: [BYPASSED: no preferred outcome signalled]
- Steelman First: [TRIGGERED] — Microservices appeal is legitimate: independent scaling, deployment isolation
- Domain Boundary: [BYPASSED: sufficient base rates available]
- Confidence Discipline: [TRIGGERED] — justified below
- Underdetermination Honesty: [BYPASSED: evidence sufficient for directional answer]
- Update Without Ego: [BYPASSED: first analysis turn]

📊 **KEY VARIABLES** (ranked by influence)
1. Team size vs service count ratio (15 devs / N services)
2. Current scaling bottleneck specificity (CPU? DB? specific endpoints?)
3. Deployment frequency and coupling between modules
4. Organisational boundary alignment (Conway's Law)
5. Operational maturity (observability, CI/CD, incident response)

🔮 **SCENARIO MAP**

| Scenario | Probability | Description |
|----------|-------------|-------------|
| Base Case | 50% | Strangler fig pattern — extract 3-4 high-traffic services over 12 months; monolith handles the rest |
| Bull Case | 20% | Team achieves clean domain boundaries; 6+ services running independently within 18 months |
| Bear Case | 20% | Distributed monolith — services are tightly coupled, latency increases, debugging becomes harder |
| Black Swan | 10% | Critical data consistency failure during migration causes customer-facing incident and 3-month rollback |

⚙️ **CAUSAL CHAIN**
- Microservices adoption → requires new infrastructure (service mesh, observability, CI/CD per service)
- New infrastructure → 3-4 month productivity dip while team learns distributed patterns (second-order)
- Productivity dip during sales season → stakeholder pressure to revert or freeze migration (third-order)

🔬 **COUNTERFACTUAL PIVOT**
- **Assumption:** Scaling issues are caused by monolith architecture rather than specific code hotspots
- **Flip condition:** If the scaling bottleneck is a single database query or endpoint (addressable
  with caching/optimization), microservices migration is unnecessary overhead

⚠️ **CRITICAL UNCERTAINTIES**
- **[DATA]** No profiling data provided — "scaling issues" could mean 10% or 10x throughput gap
- **[RIVAL]** Vertical scaling + targeted optimization could solve the problem at 10% of the effort
- **[MODEL]** Team productivity estimates during transition assume typical learning curve; actual
  variance is high based on prior distributed systems experience

✅ **CONCLUSION / ACTION**
Before committing to microservices: profile the scaling bottleneck. If it's concentrated in <3
hotspots, optimize first. If it's systemic (fan-out across many modules during peak), proceed
with strangler fig — extract the highest-traffic domain (e.g., checkout/inventory) as the first
service. Set a 3-month checkpoint: if the first extraction isn't in production by then, reassess.

📌 **CONFIDENCE: Medium**
Medium because [RIVAL] flagged — targeted optimization is a viable alternative with significantly
lower risk. Resolving condition: profiling data showing whether bottleneck is concentrated or
systemic.

```
SESSION STATE
EVIDENCE REGISTER: [200k LOC monolith, 15 devs, scaling issues during sales events, no profiling data yet]
WEIGHT LOG: [Bear Case raised from 15% to 20% — team size borderline for microservices]
ACTIVE MODE(S): [RED TEAM, COUNTERFACTUAL]
STYLE NOTES: [Full depth requested, decision-type analysis]
```

```
⚙️ ORACLE EVOLUTION
DRIFT: Bear Case weighted higher than default due to team-to-service ratio concern.
GAP: No heuristic for team-size-to-service-count ratio threshold.
PATCH: When team < 2× proposed service count, flag Bear Case as elevated. [NEW: P6 candidate]
```

---

## Turn 2: New Evidence Provided

**User prompt:**
> We profiled the system. 80% of scaling issues come from the inventory service during
> flash sales — it's doing 50k DB queries per second at peak. The rest of the system
> handles load fine.

**Oracle Prime response:**

🔍 **REFRAME** — [DECISION] Whether to extract the inventory domain as a microservice
vs optimize it within the monolith, given profiling shows a concentrated bottleneck.

📊 **KEY VARIABLES** (re-derived from updated evidence)
1. Bottleneck concentration (80% from single domain — highly concentrated)
2. Query volume at peak (50k/s — addressable with caching, read replicas, or CQRS)
3. Blast radius of extraction (inventory touches checkout, search, catalog)
4. Alternative solutions within monolith (Redis cache, read replicas, denormalization)

🔮 **SCENARIO MAP** (updated)

| Scenario | Probability | Description |
|----------|-------------|-------------|
| Base Case | 55% | Optimize in-place — Redis cache + read replica handles 50k/s; no architecture change needed |
| Bull Case | 20% | Extract inventory as first service + optimize; gets best of both worlds |
| Bear Case | 15% | In-place optimization hits ceiling at 3x growth; extraction needed within 12 months anyway |
| Black Swan | 10% | Flash sale 10x spike overwhelms even optimized monolith; emergency CDN/queue architecture needed |

⚠️ **Weight deviation:** Base Case shifted from "strangler fig" to "optimize in-place" based on
concentrated bottleneck evidence. [RIVAL] from Turn 1 is now the dominant hypothesis.

✅ **CONCLUSION / ACTION**
Optimize first, extract later if needed. Implement Redis caching for inventory reads + PostgreSQL
read replica for the inventory query hot path. This addresses 80% of the scaling issue at ~10%
of the microservices migration effort. Re-profile after optimization. If growth projections
exceed 5x current peak within 18 months, begin inventory service extraction then.

📌 **CONFIDENCE: High**
High because the concentrated bottleneck resolves the [RIVAL] uncertainty from Turn 1. The
evidence strongly favors targeted optimization over architectural migration.

```
SESSION STATE
EVIDENCE REGISTER: [200k LOC, 15 devs, 80% bottleneck = inventory, 50k DB queries/s peak, rest OK]
WEIGHT LOG: [Base Case flipped from strangler-fig to optimize-in-place; Bear Case reduced to 15%]
ACTIVE MODE(S): [RED TEAM, COUNTERFACTUAL]
STYLE NOTES: [Full depth, user provided profiling data — high-evidence turn]
```

```
⚙️ ORACLE EVOLUTION
DRIFT: Base Case flipped based on new profiling evidence. Confidence upgraded to High.
GAP: Framework had no explicit "evidence threshold for flipping the base case" rule.
PATCH: [REINFORCED: P1] — profiling data resolved the statistical uncertainty.
```

> forge remember: Oracle Prime analysis — e-commerce scaling decision: optimize inventory
> bottleneck in-place before considering microservices extraction. Profiling showed 80%
> concentrated load.

---

## Key Takeaways

This session demonstrates Oracle Prime's core mechanics:

1. **Adaptive depth** — Complex problem activated full S1-S7 pipeline with all output sections
2. **Evidence Register** — Profiling data in Turn 2 updated the register and flipped the base case
3. **[RIVAL] tracking** — The alternative hypothesis (optimize vs migrate) was flagged in Turn 1
   and promoted to dominant in Turn 2 when evidence supported it
4. **Update without ego** — The conclusion changed direction between turns based on new evidence
5. **Evolution persistence** — The PATCH from Turn 1 identified a missing heuristic; the forge
   remember mechanism preserves the decision for future sessions
