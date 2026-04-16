<!-- cookbook/pcf-manifest.md — CopilotForge Recipe -->
<!-- Paths: F | PCF Code Component -->

# PCF Control Manifest.xml Reference

> Complete field-by-field reference for the `ControlManifest.Input.xml` file that defines a PCF code component.

## When to Use This

When scaffolding or editing a PCF (Power Apps Component Framework) code component and you need to understand what every field in `ControlManifest.Input.xml` does, what values are valid, and how they affect runtime behaviour.

## Prerequisites

- Power Platform CLI installed: `npm install -g pac` (then verify with `pac --version`)
- A PCF project scaffolded: `pac pcf init --namespace Contoso --name MyControl --template field`
- Basic familiarity with XML

## Steps

1. **Scaffold a new PCF project** (if starting from scratch):
   ```bash
   mkdir MyControl && cd MyControl
   pac pcf init --namespace Contoso --name MyControl --template field
   npm install
   ```
   This creates `MyControl/ControlManifest.Input.xml` with a starter manifest.

2. **Open `ControlManifest.Input.xml`** — here is an annotated full example:
   ```xml
   <?xml version="1.0" encoding="utf-8" ?>
   <manifest>
     <control namespace="Contoso"
              constructor="MyControl"
              version="1.0.0"
              display-name-key="MyControl_Display_Key"
              description-key="MyControl_Desc_Key"
              control-type="standard">
       <!--
         namespace: matches --namespace from pac pcf init. Used as the JS class namespace.
         constructor: the exported TypeScript class name (must match your index.ts export).
         version: semantic version. Increment on every publish to force the platform to re-fetch the bundle.
         control-type: "standard" for field controls, "dataset" for gallery/list controls.
       -->

       <property name="sampleProperty"
                 display-name-key="Property_Display_Key"
                 description-key="Property_Desc_Key"
                 of-type="SingleLine.Text"
                 usage="bound"
                 required="true" />
       <!--
         name: camelCase identifier. Referenced in IInputs/IOutputs TypeScript interfaces.
         of-type: the data type. Common values:
           SingleLine.Text, Multiple, Whole.None, Currency, DateAndTime.DateOnly,
           TwoOptions (boolean), OptionSet, Lookup.Simple.
         usage:
           "bound" — the property is a data field from a record (can read AND write).
           "input" — read-only input from the form context.
         required: whether the property must be configured when the control is added to a form.
       -->

       <resources>
         <code path="index.ts" order="1" />
         <css path="css/MyControl.css" order="1" />
         <!--
           List every file your component needs. The platform bundles these.
           Remove the css entry if you have no stylesheet.
           Add <img> entries for any images: <img path="images/icon.png" />
         -->
       </resources>

       <feature-usage>
         <uses-feature name="Device.captureAudio" required="true" />
         <!--
           Declare any device features your component uses.
           Common features: Device.captureAudio, Device.captureImage, Device.captureVideo,
           Device.getBarcodeValue, Device.getCurrentPosition, Device.pickFile.
           Remove this block entirely if you don't use device features.
         -->
       </feature-usage>
     </control>
   </manifest>
   ```

3. **Edit fields for your component**:
   - Change `namespace` and `constructor` to match your project.
   - Add a `<property>` entry for each input/output your component exposes.
   - Set `of-type` based on the Dataverse column type the control will bind to.
   - Remove `<feature-usage>` if your component doesn't use device APIs.

4. **Regenerate TypeScript interfaces** after editing the manifest:
   ```bash
   npm run refreshTypes
   ```
   This updates `generated/ManifestTypes.d.ts` with `IInputs` and `IOutputs` interfaces that match your new properties.

5. **Build and test locally**:
   ```bash
   npm run build
   npm start watch
   ```
   Open `http://localhost:8181` to test the component in the test harness.

## Example

A colour picker component that binds to a text field (hex colour code):

```xml
<control namespace="Contoso" constructor="ColourPicker" version="1.0.0"
         display-name-key="ColourPicker_Name" description-key="ColourPicker_Desc"
         control-type="standard">
  <property name="colourValue"
            display-name-key="ColourValue_Name"
            description-key="ColourValue_Desc"
            of-type="SingleLine.Text"
            usage="bound"
            required="true" />
  <resources>
    <code path="index.ts" order="1" />
    <css path="css/ColourPicker.css" order="1" />
  </resources>
</control>
```

In `index.ts`, `context.parameters.colourValue.raw` gives you the current hex string, and calling `this._notifyOutputChanged()` + returning the new value from `getOutputs()` writes it back to the bound field.

## Common Pitfalls

- **`constructor` name mismatch** — the `constructor` attribute must exactly match the TypeScript class name exported from `index.ts`. A mismatch causes the component to silently fail to load.
- **Version not incremented** — Power Apps caches component bundles aggressively. If you publish an update without incrementing `version`, users may see the old component. Always bump the patch version on every publish.
- **`of-type` for lookups** — Lookup fields use `Lookup.Simple` (single-record lookup) not `Lookup`. Using the wrong type generates TypeScript compile errors.
- **Missing file in `<resources>`** — every file your component imports must be listed. Importing a CSS file in TypeScript without declaring it in `<resources>` causes a runtime error in the platform (though it works in the test harness).

## MS Learn Reference

[Manifest file reference for PCF](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/) — Complete manifest schema documentation
