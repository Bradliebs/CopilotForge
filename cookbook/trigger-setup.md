<!-- cookbook/trigger-setup.md — CopilotForge Recipe -->
<!-- Paths: E | Power Automate + AI Builder -->

# Flow Trigger Types and Configuration

> How to choose and configure the right Power Automate trigger for your automation scenario.

## When to Use This

When starting a new Power Automate flow and deciding which trigger to use. The wrong trigger causes flows to fire at the wrong time, miss events, or run too frequently. This guide maps business scenarios to trigger types with configuration details.

## Prerequisites

- Access to Power Automate at https://make.powerautomate.com
- The data source or service that will fire the trigger (SharePoint site, Dataverse table, calendar, etc.)
- Connections created for that service

## Steps

### Trigger Type 1 — Automated (Event-driven)

Fires when something happens in a connected service. No schedule, no manual start.

**When to use:** React to a new record, a file upload, an email arrival, or a Teams message.

**How to configure:**

1. Click **+ New flow** → **Automated cloud flow**.
2. Search for your trigger, e.g., **SharePoint — When an item is created or modified**.
3. Fill in connection details:
   - **Site Address**: paste your SharePoint site URL
   - **List Name**: select from the dropdown
4. The flow fires whenever an item is added or changed in that list.

**Common automated triggers:**
| Service | Trigger | Fires when... |
|---|---|---|
| SharePoint | When an item is created | New list item added |
| Dataverse | When a row is added | New table record |
| Outlook | When a new email arrives | Email matching a filter |
| Teams | When a message is posted | Message in a channel |
| OneDrive | When a file is created | File uploaded to a folder |

### Trigger Type 2 — Scheduled (Recurrence)

Fires on a fixed schedule regardless of data changes.

**When to use:** Nightly reports, weekly summaries, daily data syncs.

1. Click **+ New flow** → **Scheduled cloud flow**.
2. Set **Starting** (first run time), **Repeat every** (interval and unit).
3. For precise business hours timing, click **Show advanced options** and set **At these hours** and **At these minutes**.

**Best practice:** Always set **Time zone** explicitly — do not rely on UTC defaults.

```
Repeat every: 1 Day
At these hours: 8
At these minutes: 0
Time zone: (UTC-05:00) Eastern Time (US & Canada)
```

### Trigger Type 3 — Instant (Manual)

Fires when a user clicks a button in Power Apps, Teams, or the Power Automate mobile app, or when another flow calls it via HTTP.

**When to use:** User-initiated actions (submit a form, approve inline, run a report on demand).

1. Click **+ New flow** → **Instant cloud flow**.
2. Choose how users will trigger it:
   - **Power Apps** — embed the flow as an action in a canvas app
   - **Manually trigger a flow** — adds a "Run" button in Power Automate
   - **When an HTTP request is received** — expose as a webhook URL (for programmatic calls)
3. For HTTP triggers, click the trigger step after saving to get the generated POST URL.

### Trigger Type 4 — Business Process Flow

Fires at specific stages of a Dataverse business process flow (e.g., when a sales opportunity moves to "Proposal" stage).

**When to use:** CRM-style workflows that follow a defined stage progression.

1. Use the trigger **Common Data Service → When a flow step is run from a business process flow**.
2. Select the process and step name.

## Example

**Scenario:** Auto-send a welcome email when a new contact is added to Dataverse.

- Trigger type: **Automated**
- Trigger: **Dataverse → When a row is added**
  - Table: `Contacts`
  - Scope: Organization
- Step 1: **Condition** — `Email` is not blank
- Step 2 (Yes branch): **Outlook → Send an email**
  - To: `@{triggerOutputs()?['body/emailaddress1']}`
  - Subject: `Welcome to Contoso, @{triggerOutputs()?['body/firstname']}!`
  - Body: paste your welcome message template

## Common Pitfalls

- **Automated trigger fires on every update** — "When an item is created **or modified**" fires on every save, including your flow's own writes. Add a condition to check which field changed, or switch to "When an item is **created**" only.
- **Scheduled flow firing at wrong time** — Power Automate stores recurrence in UTC internally. If you set "8 AM" without specifying a time zone, it means 8 AM UTC (3 AM Eastern). Always set the time zone.
- **HTTP trigger URL expires after publish** — the HTTP webhook URL changes each time you turn the flow off and on or save a new version. Update any clients that call that URL after re-enabling.
- **Instant flow not appearing in Power Apps** — a flow must be saved and turned **On** before it appears in the Power Apps action picker. Also, the connection owner must be the same user who builds the app, or the flow must be shared explicitly.

## MS Learn Reference

[Get started with triggers](https://learn.microsoft.com/en-us/power-automate/triggers-introduction) — Power Automate trigger types and configuration
