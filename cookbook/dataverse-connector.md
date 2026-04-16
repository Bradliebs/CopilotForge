<!-- cookbook/dataverse-connector.md — CopilotForge Recipe -->
<!-- Paths: D/I | Canvas App + Copilot Agent / Power Pages + AI Plugin -->

# Dataverse Table Setup and Connector Configuration

> How to create a Dataverse table and connect it to a canvas app or Power Pages portal.

## When to Use This

When you need a structured data store for your canvas app (Path D) or Power Pages site (Path I). Dataverse provides relational tables with built-in security, auditing, and connector support — it's the recommended data store for anything beyond a simple list.

## Prerequisites

- Power Platform environment with Dataverse enabled (included in Power Apps plans; use https://admin.powerplatform.microsoft.com to verify)
- Environment Maker or System Customizer role in the target environment
- For Power Pages (Path I): a published Power Pages site in the same environment

## Steps

### Part 1 — Create a Dataverse Table

1. Go to https://make.powerapps.com and select your target environment.
2. In the left nav, click **Tables** → **+ New table** → **Add columns and data**.
3. Give your table a **Display name** (e.g., `Project Request`) — the schema name is auto-generated (e.g., `contoso_projectrequest`).
4. Add columns by clicking **+** in the table editor:
   - Choose a **Data type** for each column (Text, Choice, Number, Date and time, Lookup, etc.)
   - For **Lookup** columns: select the related table and the column to display
   - Mark columns **Required** if they must always have a value
5. Click **Save and exit** to create the table.
6. To add a **Choice** column (dropdown): create it as type **Choice**, then define options (e.g., `Pending`, `Approved`, `Rejected`).

### Part 2 — Set Table Permissions (for Power Pages / Path I)

Power Pages requires explicit table permissions before a portal user can read or write Dataverse data.

1. Go to https://make.powerpages.microsoft.com → select your site → **Set up**.
2. Click **Table permissions** → **+ New**.
3. Set:
   - **Name**: `Project Request — Read/Write`
   - **Table**: select `Project Request`
   - **Access type**: **Global** (all records), **Contact** (records owned by the signed-in contact), or **Account** (records owned by the user's account)
   - **Privileges**: check **Read**, **Write**, **Create** as needed
4. Assign the permission to a **Web role** (e.g., `Authenticated Users`).
5. Save. Portal users in that web role can now interact with the table.

### Part 3 — Connect to a Canvas App (Path D)

1. Open your canvas app in Power Apps Studio.
2. Click the **Data** panel → **+ Add data** → search **Microsoft Dataverse**.
3. Select your table → **Connect**.
4. Use in a gallery:
   ```powerfx
   Items = Filter('Project Requests', Status = "Pending")
   ```
5. Use in a form (to create or edit records):
   - Insert a **Form** control → set **Data source** to your table.
   - The form auto-generates fields for all table columns.

## Example

**Scenario:** A "Project Request" table for a Power Pages intake form.

Columns:
| Display Name | Type | Required |
|---|---|---|
| Project Name | Text | Yes |
| Requestor | Lookup → Contact | Yes |
| Priority | Choice (High/Medium/Low) | Yes |
| Description | Multiline Text | No |
| Status | Choice (Pending/Approved/Rejected) | Yes (default: Pending) |

Table permission for portal users: Access type = **Contact** (users can only see their own requests), Privileges = Read, Create.

## Common Pitfalls

- **Schema name confusion** — the schema name (e.g., `contoso_projectrequest`) is set at creation time and cannot be changed. The display name can be changed. Use the display name in Power Apps formulas — the connector translates it automatically.
- **Missing table permissions in Power Pages** — if portal users get a blank page or a permissions error, the table permission hasn't been assigned to their web role. This is the most common Power Pages data issue.
- **Lookup column pointing to wrong table** — double-check the related table when creating a Lookup column. Once saved, you cannot change what table a Lookup points to; you'd need to delete and recreate the column.
- **Solution layer isolation** — if you're working in a managed solution for ALM (Application Lifecycle Management), create all tables inside the solution from the start. Tables created outside a solution cannot be added to it later without workarounds.

## MS Learn Reference

[Create and edit tables using Power Apps](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/create-edit-entities-portal) — Dataverse table creation reference
