<!-- cookbook/action-setup.md — CopilotForge Recipe -->
<!-- Paths: C | Declarative Agent -->

# Adding Actions and Plugins to Declarative Agents

> How to connect a declarative agent to external APIs and tools via OpenAPI-based actions.

## When to Use This

When your declarative agent needs to do something beyond answering questions from documents — for example, submitting a form, querying a live database, or calling a business API. Actions extend the agent with callable tools backed by real endpoints.

## Prerequisites

- A working declarative agent with a valid `declarativeAgent.json` (see `manifest-guide.md`)
- An OpenAPI 3.0 spec for the API you want to call, or the ability to write one
- An HTTPS endpoint that Power Platform or Microsoft 365 can reach
- For secured APIs: an OAuth 2.0 app registration or API key

## Steps

1. **Create an OpenAPI spec file** (`api-spec.json` or `api-spec.yaml`) that describes your API:
   ```yaml
   openapi: "3.0.1"
   info:
     title: "Leave Management API"
     version: "1.0.0"
   servers:
     - url: "https://api.contoso.com"
   paths:
     /leave/request:
       post:
         operationId: submitLeaveRequest
         summary: Submit a leave request for the signed-in employee
         requestBody:
           required: true
           content:
             application/json:
               schema:
                 type: object
                 properties:
                   startDate: { type: string, format: date }
                   endDate: { type: string, format: date }
                   reason: { type: string }
         responses:
           "200":
             description: Request submitted successfully
   ```
2. **Create an AI plugin manifest** (`ai-plugin.json`):
   ```json
   {
     "schema_version": "v2.1",
     "name_for_human": "Leave Management",
     "name_for_model": "leaveManagement",
     "description_for_human": "Submit and check leave requests.",
     "description_for_model": "Use this plugin to submit leave requests on behalf of the signed-in employee. Call submitLeaveRequest when the user wants to request time off.",
     "api": {
       "type": "openapi",
       "url": "https://api.contoso.com/openapi.json"
     },
     "auth": {
       "type": "OAuthPluginVault",
       "reference_id": "${{OAUTH_CLIENT_REGISTRATION_ID}}"
     },
     "functions": [
       { "name": "submitLeaveRequest", "description": "Submits a time-off request for the employee." }
     ]
   }
   ```
3. **Add the plugin files to your `appPackage/` folder**:
   ```
   appPackage/
   ├── manifest.json
   ├── declarativeAgent.json
   ├── ai-plugin.json         ← new
   └── api-spec.yaml          ← new
   ```
4. **Reference the plugin in `declarativeAgent.json`**:
   ```json
   "actions": [
     {
       "id": "leaveAction",
       "file": "ai-plugin.json"
     }
   ]
   ```
5. **Update `manifest.json`** to declare the plugin under `composeExtensions` or `plugins` depending on your manifest version — Teams Toolkit does this automatically if you used it to scaffold.
6. **Repackage and sideload** — rezip `appPackage/` and upload again via Teams.
7. **Test** — in the Copilot chat, try a prompt like "Request 3 days off starting next Monday." The agent should call `submitLeaveRequest` and confirm the submission.

## Example

User prompt: "I need to take Monday and Tuesday off next week."

Agent reasoning: recognises a leave request intent, calls `submitLeaveRequest` with `startDate: 2025-02-10`, `endDate: 2025-02-11`, `reason: "Personal leave"`. API returns success. Agent responds: "Done — I've submitted your leave request for Feb 10–11."

## Common Pitfalls

- **`operationId` missing or has spaces** — every path in your OpenAPI spec needs a unique `operationId` in camelCase. The model uses this to select which function to call.
- **`description_for_model` too generic** — this is what the LLM reads to decide when to call your plugin. Write it like instructions: "Call this when the user wants to X. Do not call this for Y."
- **Auth reference ID not set** — if using OAuth, `${{OAUTH_CLIENT_REGISTRATION_ID}}` must match the environment variable in your `.env.dev` file that holds your OAuth app registration ID.
- **API not reachable from Microsoft's network** — if your API is on a private network, you need an API Management gateway or a Teams-accessible proxy. Localhost endpoints do not work in production.

## MS Learn Reference

[Add actions to declarative agents](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/declarative-agent-capabilities) — Actions and capabilities reference for declarative agents
