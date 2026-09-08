# Astra Prompt Builder

You describe **what you want to do** → the app builds an optimized **GPT-6 Astra** prompt
(8 blocks: GOAL · CONTEXT · PRIORITY · AUTONOMY · TOOLS · OUTPUT · VERIFY · STOP).

Live demo: https://flowing-igloo-zapr.here.now/

## Why

GPT-6 Astra breaks old prompting habits: it already tests itself, reads what it needs,
and asks questions on its own. Bloated `AGENTS.md` files, "think step by step", and
"check your work" instructions now fight the model. This builder applies the
Astra prompting best practices (see [OpenAI docs](https://developers.openai.com/api/docs/guides/latest-model))
and generates a minimal prompt with only the blocks your task needs.

## Use

1. Describe what you want to do.
2. Pick workflow type (simple task, bug fix, decision-grade research, editorial writing,
   tool-using agent, multi-agent research, full 8-block agent, AGENTS.md audit).
3. Pick autonomy, writing style, and verification scope.
4. Click **Generate Astra prompt**, copy, paste into GPT Astra.
5. Run the 12-point pre-run checklist before executing.

Everything runs locally in a single static file — nothing is sent anywhere.

## Files

- `index.html` — the whole app (no build, no dependencies)

## Run locally

```bash
open index.html
# or
python3 -m http.server && open http://localhost:8000
```

## License

MIT — see [LICENSE](LICENSE).
