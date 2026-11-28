# The assistant ("مُحكَم")

A chat page at `#assistant` and a panel other pages can open. It has two layers:

1. **Offline brain** (default, no key, nothing sent): intent detection and slot filling over a tool registry, plus BM25
   retrieval over a hand-written knowledge base (`data/assistant-kb.js`, 116 entries).
2. **Model mode**: the same tools driven by a language model, reached through one endpoint (`worker/`) or with a
   user's own key. The agent loop runs in the browser; every state-changing tool call is shown and confirmed first.

## Files

| File | Role |
|---|---|
| `mod-assistant.js`, `mod-assistant.css` | Interface: page, panel, settings, privacy screen |
| `data/assistant-core.js` | Arabic matching, retrieval, statistics, tool registry, offline brain, model client |
| `data/assistant-kb.js` | Knowledge base and crisis text |
| `data/assistant-prompt.js` | Model instructions and the second-pass check instructions (copy of the server's) |
| `data/assistant-config.js` | One line: the server address for all visitors (empty = offline only) |
| `../worker/` | Cloudflare Worker, its tests and an Arabic deployment guide |

## Provider order and why

Default order on the server is **Gemini (if a key is set) → Workers AI → nothing else**; Claude is used only when the
owner writes `claude` into `PROVIDER_ORDER`. Reasoning: Workers AI is the zero-setup floor, since it needs only the
Cloudflare account the owner is creating anyway, has no key to leak and has a free daily allocation (10,000 Neurons a
day per Cloudflare's pricing page), but that allocation is small and the Arabic of open models is uneven. A Gemini key
is also free to obtain and its Arabic and tool calling are generally stronger, so when the owner adds one it goes
first, with Workers AI as the fallback when Gemini's free limits (which have been cut repeatedly and are now shown
only in AI Studio) run out. Claude is the strongest option but is paid per token, so it never runs by default or as a
silent fallback: a zero-budget owner must opt in. On-device models were rejected as a default: Chrome's built-in
Prompt API is desktop-only with heavy hardware requirements and its documented languages do not include Arabic, and
WebLLM/transformers.js need WebGPU, a flagship phone GPU and a download of hundreds of megabytes; both could be a
later desktop opt-in but would also need CSP changes.

What was verified by web search on 2026-11-27 and what was not:

- Verified (search results quoting vendor pages): Workers AI free allocation of 10,000 Neurons/day, resetting 00:00 UTC,
  with requests failing past it on the free plan; a July 2026 change moved some models to the paid plan; the Workers AI
  catalogue marks models that support function calling; Chrome's Prompt API is available on desktop Chrome only (not
  Android), needs about 22 GB free disk and more than 4 GB VRAM or 16 GB RAM, and lists English, Spanish, Japanese,
  German and French; Anthropic's API accepts browser calls only with the `anthropic-dangerous-direct-browser-access`
  header.
- Not verified (vendor documentation hosts were unreachable from the build sandbox): which Workers AI models are still
  on the free plan and support tools, and their Arabic quality; the exact current Gemini model id and free limits
  (reports range from 20 to 1,500 requests/day); whether Gemini's free tier uses prompts for product improvement;
  Workers and KV free-plan request limits; that Gemini's API accepts direct browser calls.
- Claude model ids, prices and request rules were taken from Anthropic's current API reference, not from memory.

## Tools

`get_state`, `create_project`*, `set_project_field`*, `add_variable`*, `recommend_test`, `sample_size`, `open_section`,
`search_theories`, `search_kb`, `add_reading`*, `draft_abc`*, `draft_5ps`* (* = changes stored data, needs a tap).
Each has a name, an Arabic description, a JSON schema, a `preview` for the confirmation card and a `run` handler.
Arguments are validated against the schema before anything runs, in both modes.

## Safety rules enforced in code (not only in the prompt)

- Crisis wording is detected on the device and on the server; the reply is fixed text with the helplines and the
  message is not sent to a model.
- Registered children's and guardians' names are replaced with codes before sending and restored on screen; the server
  strips name-like fields, emails and phone numbers again.
- Model answers pass a local reference check (DOI and author-year patterns) and, when enabled, a second-pass review by
  a separate prompt before display.
- A privacy screen must be accepted before the first model request. Offline mode needs none.

## Hooks for hub.js / index.html

- Launcher on every page: `loadMod('assistant', function () { window.HubAssistant.open({ context: { project: id, label: 'page name' } }); })`.
- `#assistant/ask/<url-encoded text>` opens the page and asks the question.
- `window.HubAuth.idToken()` (if it exists) is used as the Firebase ID token.
- Model mode needs the server's host added to `connect-src` in `index.html` (see `worker/README.md`).
