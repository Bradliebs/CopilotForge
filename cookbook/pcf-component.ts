// cookbook/pcf-component.ts — CopilotForge Recipe
// Path F: PCF Code Component skeleton
// Compilable TypeScript skeleton using ComponentFramework interfaces
// Replace MyControl with your component name throughout
//
// SETUP:
//   pac pcf init --namespace Contoso --name MyControl --template field
//   npm install
//   Copy this file content into index.ts (or rename this file to index.ts)
//   npm run build          — compile and bundle
//   npm start watch        — launch test harness at http://localhost:8181
//
// This file intentionally has no external imports beyond ComponentFramework,
// which is injected by the PCF build toolchain. No npm packages needed.

import { IInputs, IOutputs } from "./generated/ManifestTypes";

export class MyControl implements ComponentFramework.StandardControl<IInputs, IOutputs> {
  // DOM container provided by the platform — render your UI inside this element
  private _container: HTMLDivElement;

  // Call this when the component wants to write a new output value back to the bound field
  private _notifyOutputChanged: () => void;

  // Current context snapshot — updated on every updateView call
  private _context: ComponentFramework.Context<IInputs>;

  // Track the current output value so getOutputs() can return it
  private _currentValue: string;

  /**
   * init — called once when the component is first loaded on the form.
   * Set up DOM, event listeners, and initial state here.
   * Do NOT call _notifyOutputChanged() inside init.
   */
  public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary,
    container: HTMLDivElement
  ): void {
    this._container = container;
    this._notifyOutputChanged = notifyOutputChanged;
    this._context = context;

    // Read the initial bound field value
    // Replace "sampleProperty" with the property name from your manifest
    this._currentValue = context.parameters.sampleProperty.raw ?? "";

    // Build the component UI
    const wrapper = document.createElement("div");
    wrapper.className = "my-control-wrapper";

    const input = document.createElement("input");
    input.type = "text";
    input.value = this._currentValue;
    input.style.cssText = "width:100%;padding:4px 8px;box-sizing:border-box;";

    // When the user types, capture the value and notify the platform
    input.addEventListener("input", (event: Event) => {
      const target = event.target as HTMLInputElement;
      this._currentValue = target.value;
      this._notifyOutputChanged();
    });

    wrapper.appendChild(input);
    this._container.appendChild(wrapper);
  }

  /**
   * updateView — called whenever input property values change on the form.
   * Sync your UI to the new values provided in context.parameters.
   * Do NOT recreate the entire DOM here — update only what changed.
   */
  public updateView(context: ComponentFramework.Context<IInputs>): void {
    this._context = context;

    // Sync the input element if the bound field value changed externally
    const newValue = context.parameters.sampleProperty.raw ?? "";
    if (newValue !== this._currentValue) {
      this._currentValue = newValue;
      const input = this._container.querySelector("input");
      if (input) {
        (input as HTMLInputElement).value = newValue;
      }
    }

    // Handle disabled state — respect form read-only mode
    const isDisabled =
      context.mode.isControlDisabled || context.parameters.sampleProperty.security?.editable === false;
    const input = this._container.querySelector("input");
    if (input) {
      (input as HTMLInputElement).disabled = isDisabled;
    }
  }

  /**
   * getOutputs — called by the platform after _notifyOutputChanged() fires.
   * Return the current values of all bound (output) properties.
   * Only include properties marked as "bound" or "input/output" in the manifest.
   */
  public getOutputs(): IOutputs {
    return {
      // Replace "sampleProperty" with the property name from your manifest
      sampleProperty: this._currentValue,
    };
  }

  /**
   * destroy — called when the component is removed from the form.
   * Remove event listeners, cancel pending timers, and release resources.
   * The platform disposes the container DOM automatically.
   */
  public destroy(): void {
    const input = this._container.querySelector("input");
    if (input) {
      // Clone and replace to strip all event listeners without tracking them individually
      const clean = input.cloneNode(true);
      input.parentNode?.replaceChild(clean, input);
    }
  }
}
