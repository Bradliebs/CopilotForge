<!-- cookbook/flow-patterns.md — CopilotForge Recipe -->
<!-- Paths: E | Power Automate + AI Builder -->

# Common Power Automate Flow Patterns

> A reference of the flow patterns most frequently needed for business process automation.

## When to Use This

When building Power Automate flows (Path E) and you need a reliable template for approval workflows, data sync, scheduled tasks, or AI-enhanced processing. Each pattern here is production-tested and safe to adapt without redesigning from scratch.

## Prerequisites

- Access to Power Automate at https://make.powerautomate.com
- Connections created for any services the pattern requires (SharePoint, Teams, Dataverse, Outlook, etc.)
- For AI Builder patterns: an environment with AI Builder credits

## Steps

### Pattern 1 — Approval Workflow

**Use for:** manager sign-off on leave requests, expense claims, purchase orders.

1. Trigger: **SharePoint → When an item is created** (or Dataverse → When a row is added)
2. Action: **Approvals → Start and wait for an approval**
   - Type: **Approve/Reject - First to respond**
   - Title: `Approval needed: @{triggerOutputs()?['body/Title']}`
   - Assigned to: your manager's email or a dynamic user lookup
3. Condition: `outputs('Start_and_wait_for_an_approval')?['body/outcome']` equals `Approve`
   - **Yes branch**: SharePoint → **Update item** (set Status to "Approved") → Teams → **Post a message** to notify requester
   - **No branch**: SharePoint → **Update item** (set Status to "Rejected") → Outlook → **Send an email** with rejection reason
4. Set a **timeout** on the approval step (e.g., 7 days) and handle the timed-out branch.

### Pattern 2 — Scheduled Data Sync

**Use for:** nightly sync from an external API to Dataverse, weekly report generation.

1. Trigger: **Recurrence** — set interval and time zone explicitly (e.g., every day at 02:00 UTC)
2. Action: **HTTP** → call external API → capture response body
3. Action: **Parse JSON** → paste schema from sample response
4. Action: **Apply to each** → iterate parsed items
5. Inside loop: **Dataverse → Upsert a row** — use a unique external key to avoid duplicates

### Pattern 3 — Error Handling with Try/Catch

**Use for:** any flow that calls external services and must handle failures gracefully.

1. Add all primary actions to a **Scope** named "Try".
2. Add a second **Scope** named "Catch" — configure its **Run After** setting to run on **has failed** and **has timed out** (not on success).
3. Inside "Catch": **Send an email** or **Post to Teams** with `result('Try')` to log the error details.
4. Inside "Catch": optionally add a **Terminate** action with status **Failed** and error message from `result('Try')[0]['error']['message']`.

### Pattern 4 — AI Builder Document Processing

**Use for:** invoice extraction, form processing, receipt scanning.

1. Trigger: **SharePoint → When a file is created** in a document library (e.g., `/Invoices/Inbox`)
2. Action: **AI Builder → Extract information from invoices** (or use a custom model)
3. Action: parse outputs — access fields like `InvoiceId`, `VendorName`, `TotalAmount` from the AI Builder step
4. Action: **Dataverse → Add a new row** — store extracted fields in an `Invoices` table
5. Action: **SharePoint → Move file** — move processed file to `/Invoices/Processed`

## Example

**Scenario:** Auto-approve leave requests under 3 days; escalate longer ones.

```
Trigger: Dataverse → When a row is added (Leave Requests table)
Condition: LeaveDays <= 3
  Yes: Dataverse → Update row (Status = "Auto-Approved")
       Teams → Post message "Your 2-day request was auto-approved"
  No:  Approvals → Start and wait for an approval
         Assigned to: Employee's manager (lookup from Dataverse Users table)
       Condition: outcome = Approve
         Yes: Dataverse → Update row (Status = "Approved")
         No:  Dataverse → Update row (Status = "Rejected")
```

## Common Pitfalls

- **No run-after configuration on error scopes** — by default, a step only runs after success. You must explicitly set "Catch" scope to run after failure/timeout, or errors will be silently swallowed.
- **Hard-coded email addresses** — flows with hard-coded approver emails break when people leave. Use a lookup from Dataverse or a dynamic group instead.
- **Apply to each concurrency** — by default, Apply to each runs sequentially. For large datasets, enable concurrency (up to 50 parallel) but only if your target connector supports parallel writes safely.
- **Time zone omitted on Recurrence trigger** — Power Automate defaults to UTC. If your business requires 9 AM local time, explicitly set the time zone; UTC-offset assumptions break during daylight saving transitions.

## MS Learn Reference

[Power Automate flow types and triggers](https://learn.microsoft.com/en-us/power-automate/flow-types) — Overview of flow types and patterns
