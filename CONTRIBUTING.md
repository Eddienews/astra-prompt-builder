# Contributing

Thank you for helping improve Astra Prompt Studio.

## Development

1. Fork the repository and create a focused branch.
2. Install dependencies with `npm ci`.
3. Make the smallest change that fully solves the issue.
4. Keep interface copy synchronized in English and Portuguese.
5. Run the validation commands before submitting a pull request:

```bash
npm test
npm run test:ui
npm run typecheck
npm run lint
npm run build
```

## Prompt guidance changes

When changing prompt behavior:

- Prefer official OpenAI documentation for model and API claims.
- Link the source in the pull request.
- Label community or experimental guidance clearly.
- Add or update a meaningful prompt-engine test.
- Keep generated prompts direct, testable, and free of hidden assumptions.

## Pull requests

Describe the user-visible problem, the resulting behavior, and the checks you ran. Keep unrelated changes in separate pull requests.

By contributing, you agree that your contribution is licensed under the MIT License.
