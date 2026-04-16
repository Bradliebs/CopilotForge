<!-- cookbook/data-model.md — CopilotForge Recipe -->
<!-- Paths: G | Power BI Report / Semantic Model -->

# Semantic Model — Star Schema Design Guide

> How to design a star schema semantic model in Power BI for performant, maintainable reports.

## When to Use This

When building a Power BI semantic model (formerly called a dataset) for a report with more than one or two tables. A well-designed star schema prevents ambiguous relationships, dramatically speeds up DAX measures, and makes the model easy to extend later.

## Prerequisites

- Power BI Desktop installed
- Your raw data sources loaded into Power Query (see `report-setup.md`)
- A clear understanding of what business questions the report must answer (these drive the fact table design)

## Steps

### Step 1 — Identify Your Fact Table

The fact table holds measurable events or transactions. Each row is one event.

Common examples:
- Sales: one row per order line
- Leave requests: one row per request
- Support tickets: one row per ticket
- Page views: one row per visit

The fact table should contain:
- **Foreign keys** — IDs that reference dimension tables (e.g., `CustomerID`, `ProductID`, `DateKey`)
- **Measures** — numeric values to aggregate (e.g., `Amount`, `Quantity`, `DurationDays`)
- **No descriptive attributes** — names, labels, categories belong in dimension tables, not the fact table

### Step 2 — Identify Your Dimension Tables

Dimension tables hold descriptive context for the facts. Each row is one entity.

Common dimensions:
| Dimension | Example columns |
|---|---|
| Date | DateKey, Date, Year, Quarter, Month, MonthName, WeekDay, IsWeekend |
| Employee | EmployeeID, Name, Department, Location, Manager |
| Product | ProductID, Name, Category, SubCategory, Price |
| Customer | CustomerID, Name, Region, Segment |
| Status | StatusID, StatusName, StatusGroup |

### Step 3 — Build the Date Dimension (Always Required)

```dax
// In Power Query: create a new blank query and paste this M code
let
    StartDate = #date(2020, 1, 1),
    EndDate = #date(2030, 12, 31),
    DayCount = Duration.Days(EndDate - StartDate) + 1,
    Dates = List.Dates(StartDate, DayCount, #duration(1, 0, 0, 0)),
    Table = Table.FromList(Dates, Splitter.SplitByNothing(), {"Date"}),
    AddYear = Table.AddColumn(Table, "Year", each Date.Year([Date]), Int64.Type),
    AddMonth = Table.AddColumn(AddYear, "Month", each Date.Month([Date]), Int64.Type),
    AddMonthName = Table.AddColumn(AddMonth, "MonthName", each Date.ToText([Date], "MMM"), type text),
    AddQuarter = Table.AddColumn(AddMonthName, "Quarter", each "Q" & Text.From(Date.QuarterOfYear([Date])), type text),
    AddDateKey = Table.AddColumn(AddQuarter, "DateKey", each Date.Year([Date]) * 10000 + Date.Month([Date]) * 100 + Date.Day([Date]), Int64.Type)
in
    AddDateKey
```

Mark this table as a **Date Table**: right-click the table in Model view → **Mark as date table** → select the `Date` column.

### Step 4 — Create Relationships

In **Model view** in Power BI Desktop:

1. Drag the foreign key from the fact table to the primary key in the dimension table.
2. Set every relationship as:
   - **Cardinality**: Many-to-one (fact → dimension)
   - **Cross-filter direction**: Single (from dimension to fact, not bidirectional)
3. Exception: use bidirectional only when you have a role-playing dimension or a bridge table, and only when you understand the performance impact.

Verify your schema looks like a star:
```
Dim_Date ─────┐
Dim_Employee ─┼─── Fact_LeaveRequests
Dim_Status ───┘
```

### Step 5 — Write Core Measures

Create all measures in the fact table (not in dimension tables). Organise them in a dedicated **Measures** table if there are many.

```dax
Total Requests = COUNTROWS(Fact_LeaveRequests)

Approved Requests = CALCULATE([Total Requests], Dim_Status[StatusName] = "Approved")

Approval Rate % = DIVIDE([Approved Requests], [Total Requests], 0)

Avg Leave Duration = AVERAGE(Fact_LeaveRequests[LeaveDays])

Requests MTD = TOTALMTD([Total Requests], Dim_Date[Date])
```

## Example

**Leave Request Semantic Model**

Fact table: `Fact_LeaveRequests`
- `RequestID` (key)
- `EmployeeID` (FK → Dim_Employee)
- `DateKey` (FK → Dim_Date, linked to StartDate)
- `StatusID` (FK → Dim_Status)
- `LeaveDays` (measure)

Dimensions:
- `Dim_Employee`: EmployeeID, Name, Department, Location
- `Dim_Date`: DateKey, Date, Year, Quarter, Month, MonthName
- `Dim_Status`: StatusID, StatusName (Pending/Approved/Rejected)

## Common Pitfalls

- **Keeping descriptive columns in the fact table** — columns like `DepartmentName` or `StatusLabel` in the fact table duplicate data and bloat the model. Move them to dimension tables.
- **Bidirectional relationships on everything** — bidirectional cross-filtering causes ambiguous paths and slow queries. Use single-direction relationships by default.
- **No Date dimension, using date columns directly** — time intelligence measures (MTD, YTD, prior period) require a proper marked Date table. Using a date column directly in the fact table breaks these calculations.
- **Many-to-many relationships without a bridge table** — many-to-many relationships (e.g., employees with multiple skills) need a bridge table. Creating a direct M:M relationship without understanding the implications produces incorrect aggregations.

## MS Learn Reference

[Understand star schema and its importance for Power BI](https://learn.microsoft.com/en-us/power-bi/guidance/star-schema) — Star schema design guidance for Power BI semantic models
