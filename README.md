# Astra Prompt Studio

Astra Prompt Studio turns a plain-language goal into a structured prompt for GPT-6 Astra. The interface is available in English and Portuguese, runs entirely in the browser, and does not send the user's task to an external API.

**Live app:** https://astra-prompt-studio.eddienews.chatgpt.site/

## Features

- Adaptive prompt generation from the user's goal
- English and Portuguese interface
- Task-aware guidance for implementation, research, writing, and agent workflows
- Explicit autonomy, tool, evidence, output, and stop conditions
- Instruction-source audit guidance for `AGENTS.md`, skills, and configuration files
- Evidence-gated completion for implementation and workflow tasks
- Copy-ready output with no account, API key, or server-side storage

## How it works

The generator assembles only the sections that are useful for the selected task:

1. Goal and expected outcome
2. Context and relevant constraints
3. Instruction priority
4. Autonomy and authorization
5. Tool and evidence expectations
6. Output contract
7. Verification
8. Completion and stop conditions

The project draws on the [OpenAI latest-model guide](https://developers.openai.com/api/docs/guides/latest-model) and clearly labels experimental field guidance that is not official OpenAI documentation.

## Privacy

Prompt generation is deterministic and local to the browser. The app does not call an AI model, store prompts, or require an API key.

## Run locally

Requirements:

- Node.js 22.13 or newer
- npm

Install and start:

```bash
npm ci
npm run dev
```

Open http://127.0.0.1:3000 in your browser.

## Validate changes

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

For browser checks, install Chromium once, run the development server in one terminal, and run the UI suite in another:

```bash
npx playwright install chromium
npm run dev
# In a second terminal:
npm run test:ui
```

See [VALIDATION.md](VALIDATION.md) for the validation notes used during development.

## Deploying with OpenAI Sites

The repository includes `.openai/hosting.example.json`. Copy it to `.openai/hosting.json` and replace the placeholder with the project configuration created for your own Sites project. The real hosting file is ignored so a deployment identifier is never published accidentally.

## Project structure

- `app/` - application layout, page, and global styles
- `lib/prompt-engine.ts` - prompt generation logic
- `lib/ui-copy.ts` - English and Portuguese interface copy
- `components/` - reusable interface components
- `tests/` - prompt and interface checks

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Security reports should follow [SECURITY.md](SECURITY.md).

## Disclaimer

Astra Prompt Studio is an independent open-source project and is not affiliated with or endorsed by OpenAI. Product names and trademarks belong to their respective owners.

## License

MIT License. See [LICENSE](LICENSE).
