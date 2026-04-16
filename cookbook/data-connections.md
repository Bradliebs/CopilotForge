<!-- cookbook/data-connections.md — CopilotForge Recipe -->
<!-- Paths: D/E | Canvas App + Copilot Agent / Power Automate + AI Builder -->

# Dataverse and SharePoint Data Connection Setup

> How to connect your canvas app or Power Automate flow to Dataverse tables and SharePoint lists.

## When to Use This

When building a canvas app (Path D) or a Power Automate flow (Path E) that reads from or writes to structured data. Dataverse is the recommended store for complex relational data; SharePoint lists are a quick option for simple tabular data in environments that already use SharePoint.

## Prerequisites

- A Power Platform environment (Dataverse is included in most plans)
- For SharePoint: a SharePoint site you have at least Contribute access to
- For Dataverse: Maker permissions in your environment
- Your app or flow open in Power Apps or Power Automate

## Steps

### Connecting a Canvas App to Dataverse

1. **Open your canvas app** in Power Apps Studio (https://make.powerapps.com → **Apps** → select app → **Edit**).
2. In the left panel, click the **Data** icon (cylinder shape) → **+ Add data**.
3. Search for **Microsoft Dataverse**.
4. Select the table you want (e.g., `Accounts`, `Contacts`, or a custom table).
5. Click **Connect**. The table name now appears under **Data sources**.
6. In your gallery or form, set the **Items** property to the table name:
   ```powerfx
   Items = Accounts
   ```
7. For filtered queries:
   ```powerfx
   Items = Filter(Accounts, 'Account Status' = 'Active')
   ```

### Connecting a Canvas App to SharePoint

1. Follow steps 1–2 above, but search for **SharePoint**.
2. Enter your SharePoint site URL (e.g., `https://contoso.sharepoint.com/sites/HR`).
3. Select the lists you want to connect — you can select multiple.
4. Click **Connect**. Each list appears as a data source.
5. Reference it in a gallery:
   ```powerfx
   Items = 'Leave Requests'
   ```
   *(Note: SharePoint list names with spaces need single quotes.)*

### Connecting a Power Automate Flow to Dataverse

1. **Open your flow** in Power Automate → **Edit**.
2. Click **+ New step** → search for **Microsoft Dataverse**.
3. Select the action:
   - **List rows** — query multiple records
   - **Get a row by ID** — fetch a single record
   - **Add a new row** — create a record
   - **Update a row** — modify an existing record
4. For **List rows**: set **Table name** → select your table → optionally set **Filter rows** using OData syntax:
   ```
   statecode eq 0 and contains(name, 'Contoso')
   ```
5. For **Add a new row**: set **Table name** and map your flow's dynamic content to the table's columns.

### Connecting a Power Automate Flow to SharePoint

1. In your flow, click **+ New step** → search for **SharePoint**.
2. Select **Get items** (query) or **Create item** (add row).
3. Set **Site Address** (paste your SharePoint site URL) and **List Name** (select from the dropdown).
4. For **Get items**, add an **ODATA Filter Query** if needed:
   ```
   Status eq 'Pending'
   ```

## Example

**Scenario:** A flow that reads open leave requests from Dataverse and posts a daily summary to Teams.

1. Trigger: **Recurrence** — every day at 8:00 AM.
2. Step: **Dataverse → List rows** — Table: `Leave Requests`, Filter: `statuscode eq 1` (Active status).
3. Step: **Apply to each** — iterate over `value` output.
4. Step: **Teams → Post a message** — format: `@{items('Apply_to_each')?['EmployeeName']} — @{items('Apply_to_each')?['StartDate']} to @{items('Apply_to_each')?['EndDate']}`.

## Common Pitfalls

- **Delegation limits for SharePoint** — SharePoint connections in canvas apps delegate only a subset of Power Fx functions. Avoid `Search()` on large lists; use `Filter()` with `StartsWith()` instead.
- **Missing environment in Dataverse connector** — the Dataverse connector defaults to the current environment. If you're building in one environment and deploying to another, use environment variables or solution-aware connections.
- **SharePoint list name typos** — list names are case-sensitive in the SharePoint connector for Power Automate. "Leave Requests" ≠ "leave requests".
- **Flow run user vs. service account** — by default, Dataverse actions run as the flow's connection owner. If you want records created as the end user, use an Instant flow triggered by the user, not a scheduled background flow.

## MS Learn Reference

[Use Dataverse as a data source](https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/data-platform-create-app) — Dataverse connection in canvas apps
