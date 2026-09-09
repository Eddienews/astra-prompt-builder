import fs from 'node:fs';
import { buildPrompt, DEFAULT_BRIEF } from '../lib/prompt-engine.ts';

const source = JSON.parse(
  fs.readFileSync(new URL('./fixtures/examples.json', import.meta.url), 'utf8'),
);

const cases = source.cases.map(({ id, input }) => {
  const settings = { ...DEFAULT_BRIEF, ...input };
  const result = buildPrompt(settings);
  return {
    id,
    settings,
    result: {
      category: result.category,
      deliverable: result.resolution.deliverable,
      artifact: result.resolution.artifact,
      language: result.resolution.language,
      evidence: result.resolution.evidence,
      capabilities: result.resolution.capabilities,
      delegation: result.resolution.delegate,
      blocks: result.sections.length,
      words: result.prompt.split(/\s+/u).length,
      prompt: result.prompt,
    },
  };
});

const file = new URL('./fixtures/revised-examples.json', import.meta.url);
fs.writeFileSync(
  file,
  JSON.stringify(
    {
      source: source.kind,
      downstreamModelPerformanceMeasured: false,
      cases,
    },
    null,
    2,
  ) + '\n',
);

for (const example of cases) {
  console.log(
    `${example.id}: ${example.result.category} / ${example.result.deliverable}; ${example.result.words} words`,
  );
}
console.log(
  `Saved ${cases.length} synthetic examples. This validates generator behavior, not downstream model performance.`,
);
