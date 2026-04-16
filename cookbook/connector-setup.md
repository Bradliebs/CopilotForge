<!-- cookbook/connector-setup.md — CopilotForge Recipe -->
<!-- Paths: B | Studio + Custom Connector -->

# Custom Connector Setup Walkthrough

> Step-by-step guide to building a custom connector in Power Platform that calls your REST API.

## When to Use This

When you have an external REST API that isn't available in the 1000+ built-in Power Platform connectors, and you want Copilot Studio or Power Automate to call it with proper authentication and typed request/response schemas.

## Prerequisites

- Power Platform environment (any plan that allows custom connectors)
- A REST API with a reachable HTTPS endpoint
- An OpenAPI 2.0 (Swagger) spec for your API, or the ability to define operations manually
- Permission to create connectors in your environment (Environment Maker role or higher)

## Steps

1. **Open Power Automate or Power Apps** at https://make.powerautomate.com — both surfaces share the same connector store.
2. **Navigate to Custom connectors** — in the left nav, click **More** → **Custom connectors** → **+ New custom connector** → **Create from blank** (or **Import an OpenAPI file** if you have a spec).
3. **Fill in General tab**:
   - **Connector name**: `Contoso Inventory API`
   - **Description**: one sentence about what the API does
   - **Base URL**: `https://api.contoso.com` (no trailing slash)
   - **Scheme**: HTTPS only — HTTP is blocked by Power Platform
4. **Configure Security tab** — choose your auth method (see `api-auth-guide.md` for details):
   - No auth → select **No authentication**
   - API key → select **API Key**, set parameter name and location (header/query)
   - OAuth 2.0 → select **OAuth 2.0**, fill in Client ID, Client Secret, Authorization URL, Token URL
5. **Add operations in Definition tab** — for each API endpoint:
   - Click **+ New action**
   - Set **Summary** (human-readable), **Operation ID** (camelCase, no spaces), **Verb** (GET/POST/etc.), **URL path** (e.g., `/inventory/{productId}`)
   - Add **Request** parameters — click **Import from sample** and paste a sample request body
   - Add **Response** — click **+ Add default response**, import a sample JSON response body
6. **Test the connector** — go to the **Test** tab, create a new connection using your credentials, then run a test call against a live endpoint.
7. **Save and close** — the connector now appears in the connector picker across Power Automate flows and Copilot Studio action nodes.
8. **Share the connector** (if others need it) — go to connector properties → **Share** → add users or share environment-wide.

## Example

**Scenario:** Connect to a weather API at `https://api.open-meteo.com`.

- Base URL: `https://api.open-meteo.com`
- Security: No authentication (public API)
- Operation ID: `getCurrentWeather`
- Verb: GET
- Path: `/v1/forecast`
- Query parameters: `latitude` (number, required), `longitude` (number, required), `current_weather` (boolean, default true)
- Sample response:
  ```json
  {
    "current_weather": {
      "temperature": 22.5,
      "windspeed": 14.3,
      "weathercode": 0
    }
  }
  ```

After setup, a Power Automate flow can call **getCurrentWeather** with lat/long and return the temperature to a Copilot Studio topic.

## Common Pitfalls

- **HTTP instead of HTTPS** — Power Platform blocks non-HTTPS connectors. Your API must have a valid TLS certificate.
- **Spaces in Operation IDs** — use camelCase (`getInventoryItem` not `get inventory item`). Spaces break flow bindings.
- **Missing response schema** — without a defined response schema, Power Automate can't suggest output fields in the flow editor. Always import a sample response.
- **Connector not showing in Copilot Studio** — ensure the connector is saved and you've refreshed the action picker. New connectors can take 1–2 minutes to propagate.

## MS Learn Reference

[Create a custom connector from scratch](https://learn.microsoft.com/en-us/connectors/custom-connectors/define-blank) — Custom connector authoring guide
