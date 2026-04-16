<!-- cookbook/powerfx-patterns.md — CopilotForge Recipe -->
<!-- Paths: D | Canvas App + Copilot Agent -->

# Common Power Fx Formula Patterns

> A reference of the Power Fx formulas most frequently needed when building canvas apps.

## When to Use This

When building a canvas app in Power Apps and you need to filter data, update records, navigate screens, or handle user input. Power Fx is the formula language used in all canvas app controls — this guide covers the patterns that come up in nearly every app.

## Prerequisites

- A canvas app open in Power Apps Studio at https://make.powerapps.com
- At least one data source connected (Dataverse table, SharePoint list, or collection)
- Basic understanding of how to select a control and edit its formula bar

## Steps

### Pattern 1 — Filter a Gallery

Select your Gallery control, click the **Items** property in the formula bar, and use:

```powerfx
Filter(
    Employees,
    Department = Dropdown1.Selected.Value,
    StartsWith(LastName, SearchBox1.Text)
)
```

- `Employees` is your Dataverse table or SharePoint list name.
- `Dropdown1.Selected.Value` is the value selected in a Dropdown control.
- `SearchBox1.Text` is text typed in a TextInput control.

### Pattern 2 — Patch (Create or Update) a Record

On a Button's **OnSelect** property:

```powerfx
Patch(
    Employees,
    Defaults(Employees),
    {
        FirstName: FirstNameInput.Text,
        LastName: LastNameInput.Text,
        Department: DeptDropdown.Selected.Value,
        StartDate: DatePicker1.SelectedDate
    }
);
Notify("Employee saved!", NotificationType.Success);
Navigate(EmployeeListScreen, ScreenTransition.Slide)
```

Use `LookUp(Employees, ID = Gallery1.Selected.ID)` instead of `Defaults(Employees)` to update an existing record.

### Pattern 3 — Navigate Between Screens

```powerfx
Navigate(DetailScreen, ScreenTransition.Cover)
```

Pass context to the next screen (e.g., the selected record):

```powerfx
Navigate(DetailScreen, ScreenTransition.Cover, { selectedEmployee: Gallery1.Selected })
```

Access it on `DetailScreen` using `employeeParam` — first set the screen's `OnVisible`:

```powerfx
UpdateContext({ localEmployee: Param("selectedEmployee") })
```

Or simply reference `Gallery1.Selected` directly from the detail screen (both screens are in the same app session).

### Pattern 4 — Collect and ClearCollect

Build a local in-memory collection (useful for offline or multi-select scenarios):

```powerfx
ClearCollect(
    colCart,
    Filter(Products, IsSelected = true)
)
```

Add a single item:

```powerfx
Collect(colCart, { ProductID: 42, Name: "Widget", Qty: 1 })
```

### Pattern 5 — IfError and IsBlank Guards

Wrap data operations to handle empty inputs gracefully:

```powerfx
If(
    IsBlank(FirstNameInput.Text),
    Notify("First name is required", NotificationType.Error),
    Patch(Employees, Defaults(Employees), { FirstName: FirstNameInput.Text })
)
```

## Example

**Scenario:** A leave request form that saves to a SharePoint list.

```powerfx
// SubmitButton OnSelect
If(
    IsBlank(StartDatePicker.SelectedDate) || IsBlank(EndDatePicker.SelectedDate),
    Notify("Please select both dates", NotificationType.Error),
    IfError(
        Patch(
            LeaveRequests,
            Defaults(LeaveRequests),
            {
                Title: User().FullName & " — Leave Request",
                StartDate: StartDatePicker.SelectedDate,
                EndDate: EndDatePicker.SelectedDate,
                Status: "Pending"
            }
        ),
        Notify("Save failed: " & FirstError.Message, NotificationType.Error),
        Notify("Leave request submitted!", NotificationType.Success);
        Navigate(HomeScreen, ScreenTransition.Fade)
    )
)
```

## Common Pitfalls

- **Case sensitivity in column names** — Power Fx column names must match your data source's field names exactly. A column named `FirstName` in Dataverse is referenced as `FirstName`, not `firstname`.
- **Delegation warnings** — a yellow triangle on Filter or Sort means the operation runs locally on the first 500 records, not server-side. Use delegatable functions (`StartsWith`, `=`, `<`, `>`) instead of non-delegatable ones (`Search`, `Left`, `Mid`) for large tables.
- **Semicolons vs commas** — Power Fx uses semicolons to chain statements in some locales (e.g., European locales). If your environment uses semicolons, `Navigate(...); Notify(...)` becomes `Navigate(...); Notify(...)` — same syntax, just be aware it varies.
- **Patch does not refresh the gallery** — after a Patch, call `Refresh(YourTable)` if the gallery doesn't update automatically.

## MS Learn Reference

[Power Fx formula reference for Power Apps](https://learn.microsoft.com/en-us/power-platform/power-fx/formula-reference-canvas-apps) — Complete Power Fx function reference
