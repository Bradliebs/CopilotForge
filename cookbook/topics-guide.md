<!-- cookbook/topics-guide.md — CopilotForge Recipe -->
<!-- Paths: A/B/H | Copilot Studio Agent / Studio + Custom Connector / SharePoint + Teams Copilot -->

# Topic Design Patterns for Copilot Studio

> How to structure conversation topics in Copilot Studio for predictable, maintainable agent behaviour.

## When to Use This

When your Copilot Studio agent handles multiple intents and you need a consistent way to structure topics so they don't
collide, loop, or fall through to the system fallback. Applies whether you're connecting to custom connectors (Path B) or SharePoint knowledge (Path H).

## Prerequisites

- An active Copilot Studio environment at https://copilotstudio.microsoft.com
- At least one published or draft agent to experiment on
- Basic familiarity with the Topics canvas (trigger phrases, nodes, conditions)

## Steps

1. **Open your agent** in Copilot Studio and navigate to **Topics** in the left nav.
2. **Create a new topic** — click **+ New topic** → **From blank**.
3. **Add trigger phrases** — enter 3–5 natural language variations that a user would type to reach this topic.
   - Good: "check my order", "where is my order", "order status"
   - Bad: single-word triggers like "order" (too broad, will steal intent from related topics)
4. **Set the topic description** — one sentence explaining what this topic resolves. Copilot Studio uses this for intent routing when phrases overlap.
5. **Build the conversation nodes**:
   - Use **Message** nodes for plain responses.
   - Use **Question** nodes when you need user input — set an entity (Number, Text, etc.) and store the answer in a variable.
   - Use **Condition** nodes to branch based on variable values.
   - Use **Action** nodes to call a Power Automate flow or HTTP action.
6. **End every path** explicitly — use **End conversation** or **Transfer to agent** nodes. Never leave a path open; it causes unexpected fallthrough.
7. **Add a fallback branch** in any Question node — handle the case where the user's answer doesn't match your entity type.
8. **Test with the Test Chat panel** — click **Test your agent** (top right), then type one of your trigger phrases.
9. **Check topic analytics** — after publishing, go to **Analytics** → **Topic usage** to see which topics fire and which are abandoned.

## Example

**Scenario:** An HR agent needs a "Request time off" topic.

Trigger phrases:
- "I want to take time off"
- "request vacation"
- "book a day off"
- "PTO request"

Node flow:
1. Message: "I can help with that. How many days are you requesting?"
2. Question (Number entity) → store in `var_days`
3. Condition: `var_days` > 10 → Message: "Requests over 10 days need manager approval. I'll route you to HR."
4. Condition: `var_days` ≤ 10 → Action node → call "Submit PTO Request" Power Automate flow → pass `var_days`
5. Message: "Done! Your request for {var_days} days has been submitted."
6. End conversation

## Common Pitfalls

- **Single-word trigger phrases** — overly short triggers match too many things. Always use phrases of 3+ words.
- **Open-ended paths** — forgetting an **End conversation** node causes the agent to loop back to the greeting topic unexpectedly.
- **Variable name collisions** — if two topics both use `var_result`, the second topic overwrites the first. Prefix variables with the topic name: `pto_days`, `pto_start_date`.
- **Too many topics in one agent** — aim for fewer than 50 active topics per agent. Beyond that, consider splitting into child agents connected via a parent orchestrator topic.

## MS Learn Reference

[Create and edit topics](https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-create-edit-topics) — Copilot Studio topic authoring reference
