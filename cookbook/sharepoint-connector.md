<!-- cookbook/sharepoint-connector.md — CopilotForge Recipe -->
<!-- Paths: H | SharePoint + Teams Copilot -->

# SharePoint Connector Configuration for Copilot Studio

> How to add a SharePoint site as a knowledge source in Copilot Studio so your agent answers from your documents.

## When to Use This

When building a Copilot Studio agent (Path H) that should answer questions grounded in documents, pages, or lists stored in SharePoint. The SharePoint connector lets the agent retrieve and cite content from your sites instead of relying solely on its general knowledge.

## Prerequisites

- A Copilot Studio agent created at https://copilotstudio.microsoft.com
- A SharePoint Online site with content you want the agent to search (documents, pages, or lists)
- Site Collection Administrator or Owner permissions on the target SharePoint site
- Copilot Studio with generative answers enabled (requires a Microsoft Copilot Studio licence with generative AI features)

## Steps

1. **Open your agent** in Copilot Studio.
2. In the left nav, click **Knowledge**.
3. Click **+ Add knowledge**.
4. Select **SharePoint** from the list of knowledge source types.
5. In the **SharePoint URL** field, enter your site URL:
   ```
   https://contoso.sharepoint.com/sites/HRPolicies
   ```
   - Enter the site root URL, not a specific document or folder URL.
   - You can add multiple sites — click **+ Add another site** for each.
6. Click **Add**. Copilot Studio indexes the site content (this can take a few minutes for large sites).
7. **Verify indexing** — return to the Knowledge page; the site should show status **Ready** when indexing is complete.
8. **Test the knowledge** — open the **Test Chat** panel and ask a question about content in your documents.
   - Example: "What is the parental leave policy?" should return a response grounded in your SharePoint documents.
9. **Set the fallback behaviour** — in your agent's **Generative AI** settings, configure what the agent says when it cannot find an answer in the knowledge sources.
10. **Configure scope** (optional) — if you only want the agent to search a specific document library or folder, enter the sub-folder URL instead of the site root:
    ```
    https://contoso.sharepoint.com/sites/HRPolicies/Shared Documents/Policies
    ```

## Example

**Scenario:** An IT support agent that answers from a SharePoint wiki.

- Site URL: `https://contoso.sharepoint.com/sites/ITWiki`
- Content: Pages library with 80 how-to articles about VPN, password reset, and software installation.
- After connecting the knowledge source, users can ask "How do I reset my password?" and get a grounded answer with a link to the specific wiki page.

## Common Pitfalls

- **Permissions not propagated** — Copilot Studio accesses SharePoint as the signed-in agent creator during setup, but at runtime it uses the end user's permissions. Users who don't have access to the SharePoint site will get empty or refused answers.
- **Private sites not indexed** — if your SharePoint site is private and the agent service account hasn't been granted access, indexing fails silently. Check the **Knowledge** status page for error indicators.
- **Sub-site vs. site URL confusion** — classic SharePoint sub-sites have paths like `/sites/HR/Policies`. Enter the sub-site URL if that is the scope you want; do not enter a parent site expecting it to crawl sub-sites automatically.
- **Large sites take time to index** — SharePoint sites with thousands of documents can take 15–30 minutes to fully index. Don't test until the status shows **Ready**.
- **Stale content** — Copilot Studio re-indexes knowledge sources periodically (not in real-time). Recent document changes may not be reflected immediately.

## MS Learn Reference

[Add SharePoint as a knowledge source](https://learn.microsoft.com/en-us/microsoft-copilot-studio/knowledge-add-sharepoint) — SharePoint knowledge source configuration in Copilot Studio
