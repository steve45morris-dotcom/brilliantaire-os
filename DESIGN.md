# Workspace Design Index

This file acts as the primary design router for all AI agents in this workspace.

## Master Design Source
All UI development must reference the `awesome-design-md` collection:
`Path: /Users/alexanderanthony/Projects/awesome-design-md/design-md/`

## Routing Instructions
1. **Identify Brand:** Determine which website or brand style the user is requesting (e.g., Claude, Linear, Vercel).
2. **Select System:** Navigate to the corresponding folder in the path above.
3. **Read Specs:** Open the `README.md` in that folder.
4. **Fetch Details:** If the local `README.md` only contains a link, use `web_fetch` to retrieve the full `DESIGN.md` specs from the [getdesign.md](https://getdesign.md) URL provided.
5. **Apply Tokens:** Use the extracted colors, typography, and component rules to build the UI.

## Collection Map
The collection includes specs for:
- **AI Tools:** Claude, Cohere, ElevenLabs, Mistral AI, Ollama, etc.
- **Dev Platforms:** Cursor, Linear, Supabase, Vercel, Stripe, etc.
- **Enterprise:** Apple, IBM, NVIDIA, SpaceX, etc.
- **Automotive:** BMW, Ferrari, Lamborghini, Tesla, etc.

---
*Mandate enforced via .antigravityrules and CLAUDE.md*
