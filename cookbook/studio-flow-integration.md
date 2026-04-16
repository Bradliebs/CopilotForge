<!-- cookbook/studio-flow-integration.md — CopilotForge Recipe -->
<!-- Paths: A/B | Copilot Studio Agent / Studio + Custom Connector -->

# Connecting Copilot Studio to Power Automate

> How to call a Power Automate flow from inside a Copilot Studio topic to execute business logic.

## When to Use This

When your Copilot Studio agent needs to do something beyond answering questions — for example, creating a record, sending an email, querying a live system, or running a multi-step business process. Power Automate flows are the bridge between conversational intents and real actions.

## Prerequisites

- A Copilot Studio agent with at least one topic (see `topics-guide.md`)
- A Power Automate flow with the trigger **"Run a flow from Copilot"**
- Both the agent and the flow in the same Power Platform environment
- Maker permissions on both the agent and the flow

## Steps

### Part 1 — Create the Flow

1. Go to https://make.powerautomate.com → **+ New flow** → **Instant cloud flow**.
2. For the trigger, search and select **"Run a flow from Copilot"** (this is the Copilot Studio-compatible trigger).
3. Click **+ Add an input** to define what data the topic will pass into the flow:
   - **Text** input: e.g., `employeeEmail` with description "The email of the requesting employee"
   - **Number** input: e.g., `requestedDays`
   - You can add multiple inputs.
4. Add your business logic actions (Dataverse, SharePoint, email, etc.).
5. Click **+ New step** → **Copilot** → **Return value(s) to Power Virtual Agents** (this is the output step — still labelled "Power Virtual Agents" in the UI but works with Copilot Studio).
6. Click **+ Add an output** to define what the flow returns to the topic:
   - **Text** output: e.g., `confirmationNumber`
   - **Boolean** output: e.g., `approvalRequired`
7. Map each output to a dynamic value from earlier flow steps.
8. **Save** the flow and note its name.

### Part 2 — Call the Flow from a Topic

1. Open your agent in Copilot Studio → go to **Topics** → open the topic where you want to call the flow.
2. At the point in the conversation where you want to execute the action, click **+** → **Call an action**.
3. In the action picker, select your flow by name. (If the flow doesn't appear, ensure it uses the "Run a flow from Copilot" trigger and is saved in the same environment.)
4. **Map topic variables to flow inputs**:
   - For each flow input, select a variable from the topic conversation (e.g., map `employeeEmail` to `System.User.PrincipalName`).
5. **Map flow outputs to topic variables**:
   - After the action node, the flow outputs are available as variables. Rename them if needed.
6. Add a **Message** node after the action that uses the output variable:
   - Example: "Your request has been submitted. Confirmation number: {Topic.confirmationNumber}"
7. **Test** in the Test Chat panel — step through the conversation to the action node and verify the flow runs and returns values.

## Example

**Scenario:** A leave request bot that creates a Dataverse record and returns a confirmation ID.

Flow inputs:
- `requesterEmail` (Text)
- `leaveDays` (Number)
- `startDate` (Text)

Flow actions:
1. Dataverse → **Add a new row** — table: Leave Requests, map inputs to columns
2. Return values → `confirmationId` (Text, from the Dataverse row ID)

Topic conversation:
1. Question: "How many days would you like to take off?" → store in `Topic.LeaveDays`
2. Question: "What is your start date?" → store in `Topic.StartDate`
3. Action: Call "Submit Leave Request" flow → pass `Topic.LeaveDays`, `Topic.StartDate`, `System.User.PrincipalName`
4. Message: "Done! Your confirmation number is {Topic.ConfirmationId}"

## Common Pitfalls

- **Wrong trigger on the flow** — the flow must use "Run a flow from Copilot" as its trigger, not a scheduled or HTTP trigger. Flows with other triggers will not appear in the Copilot Studio action picker.
- **Environment mismatch** — the flow and the agent must be in the same Power Platform environment. Flows in different environments are invisible to the agent.
- **Missing return values step** — if you forget the "Return value(s) to Power Virtual Agents" step, the flow runs but no data comes back to the topic. The action node will appear to succeed but all output variables will be empty.
- **Flow not turned On** — a flow that is in Draft or Off state does not appear in the agent's action picker. Turn the flow On before testing in Copilot Studio.

## MS Learn Reference

[Use Power Automate flows in Microsoft Copilot Studio](https://learn.microsoft.com/en-us/microsoft-copilot-studio/advanced-flow) — Flow integration guide for Copilot Studio topics
