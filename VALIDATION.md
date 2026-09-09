# Validation

Astra Prompt Studio is validated at three levels: prompt generation, browser behavior, and production compilation.

## Automated checks

Run the core checks with Node.js 22.13 or newer:

```bash
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm audit --audit-level=high
```

The current open-source release passes:

- 25 prompt-engine test groups
- TypeScript type checking
- Linting for the application, prompt engine, and tests
- Production build
- Dependency audit with zero known vulnerabilities

## Browser checks

Install the Playwright Chromium browser once:

```bash
npx playwright install chromium
```

Start the app in one terminal and run the browser suite in another:

```bash
npm run dev
npm run test:ui
```

The browser suite contains 7 passing tests covering:

- Empty and oversized input validation
- Prompt generation, regeneration, editing, copying, and download
- Stale-output protection after settings change
- Clipboard failure handling
- English and Portuguese interface switching
- Deliverable and answer-language conflict handling
- Literal rendering of hostile markup
- No external requests during prompt generation
- No local or session storage of the brief
- Mobile width and enlarged-text layout
- Optional WebMCP registration behavior

## Regression fixtures

`tests/fixtures/examples.json` contains synthetic public inputs. `tests/fixtures/revised-examples.json` records the current generated outputs. Regenerate the revised fixture with:

```bash
npm run test:examples
```

Fixtures support review but do not replace assertions in the automated tests.

## Scope and limits

The app generates prompts locally and does not call GPT-6 Astra, so these checks validate the generator and interface rather than downstream model performance.

Task classification uses bounded English and Portuguese phrase matching. Mixed-language, highly nested, or domain-specific instructions may require the visible category and deliverable controls.

Experimental guidance from community material is labeled as experimental. Official product and API claims should be checked against the current [OpenAI latest-model guide](https://developers.openai.com/api/docs/guides/latest-model).
