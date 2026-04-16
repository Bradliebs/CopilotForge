<!-- cookbook/report-setup.md — CopilotForge Recipe -->
<!-- Paths: G | Power BI Report / Semantic Model -->

# Power BI Report Creation Walkthrough

> Step-by-step guide to building and publishing a Power BI report from a data source.

## When to Use This

When you need to turn structured data into a shareable, interactive report. This walkthrough covers connecting to data, building visuals, and publishing to the Power BI service so stakeholders can view it in a browser or Teams.

## Prerequisites

- Power BI Desktop installed (free, from https://powerbi.microsoft.com/desktop/)
- A Power BI Pro or Premium Per User licence to publish and share reports
- A data source: Excel file, SharePoint list, Dataverse table, SQL database, or any other supported source
- Optional: a Power BI workspace in the Power BI service (https://app.powerbi.com)

## Steps

1. **Open Power BI Desktop** → click **Get data** on the Home ribbon.
2. **Choose your data source**:
   - **Excel** → navigate to your `.xlsx` file → select the sheet or table → **Load**
   - **SharePoint Online list** → enter your SharePoint site URL → authenticate → select lists → **Load**
   - **Dataverse** → select **Dataverse** → enter your environment URL (format: `https://yourorg.crm.dynamics.com`) → sign in → select tables → **Load**
   - **SQL Server** → enter server name and database → select tables or write a query → **Load**
3. **Transform data if needed** — click **Transform data** to open Power Query Editor:
   - Remove columns you don't need.
   - Rename columns to user-friendly names.
   - Filter out test or inactive rows.
   - Join tables using **Merge queries** if you have related tables.
   - Click **Close & Apply** when done.
4. **Build the data model** — in the **Model** view (diagram icon on the left):
   - Check that relationships between tables are correctly detected.
   - Drag and drop columns to create relationships if missing.
   - Set relationship cardinality (many-to-one is most common).
5. **Create measures** — in the **Data** view, click **New measure** for calculated values:
   ```dax
   Total Revenue = SUM(Sales[Amount])
   Revenue YTD = TOTALYTD([Total Revenue], Dates[Date])
   Approval Rate = DIVIDE(COUNTROWS(FILTER(Requests, Requests[Status] = "Approved")), COUNTROWS(Requests))
   ```
6. **Build report visuals** — switch to **Report** view:
   - Click a visual type from the **Visualizations** panel (bar chart, line chart, card, table, map, etc.)
   - Drag fields from the **Data** panel onto the visual's field wells (Axis, Values, Legend, etc.)
   - Add **Slicers** to let users filter by date, region, department, etc.
   - Use **Cards** for key metrics (total revenue, open requests, approval rate).
7. **Format visuals** — click each visual and use the **Format** pane to set colours, titles, data labels, and fonts.
8. **Add report pages** — click **+** at the bottom to add pages (e.g., Summary, Detail, Trend).
9. **Publish to the Power BI service**:
   - Click **File** → **Publish** → **Publish to Power BI**.
   - Select your workspace → click **Select**.
   - After publishing, click the link to open the report in the browser.
10. **Share the report** — in the Power BI service, click **Share** → enter email addresses → set permissions (view only or edit).

## Example

**Scenario:** A leave request dashboard for the HR team.

Data source: Dataverse `Leave Requests` table with columns: `EmployeeName`, `Department`, `Status`, `StartDate`, `LeaveDays`.

Visuals:
- **Card** — Total requests this month (measure: `COUNTROWS(FILTER('Leave Requests', MONTH('Leave Requests'[StartDate]) = MONTH(TODAY())))`)
- **Donut chart** — Requests by Status (Pending / Approved / Rejected)
- **Bar chart** — Requests by Department
- **Table** — Employee name, Start date, Days, Status (filtered to Pending)
- **Slicer** — Month (from a Dates table connected to StartDate)

## Common Pitfalls

- **Loading data without transforming** — importing raw data with system columns, blank rows, or oddly formatted dates creates messy visuals. Always open Power Query and clean the data first.
- **Publishing to "My workspace"** — reports in My Workspace cannot be shared with others. Always publish to a shared workspace.
- **No date table** — time intelligence DAX functions (TOTALYTD, DATEADD, SAMEPERIODLASTYEAR) require a dedicated Dates table with continuous dates and a relationship to your fact table. Mark it as a Date Table in Power BI Desktop.
- **Report opens fine in Desktop but breaks in service** — usually caused by a data gateway not being configured. On-premises data sources (SQL Server, Excel on a local drive) need an on-premises data gateway installed and configured to refresh in the service.

## MS Learn Reference

[Create a report in Power BI Desktop](https://learn.microsoft.com/en-us/power-bi/fundamentals/desktop-getting-started) — End-to-end Power BI report building guide
