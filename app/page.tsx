'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { flushSync } from 'react-dom';
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  CheckCheck,
  ChevronDown,
  Code2,
  Copy,
  FileText,
  FlaskConical,
  Layers3,
  Orbit,
  Plus,
  ScanText,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  WandSparkles,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  buildPrompt,
  answerLanguageLabel,
  normalizeBrief,
  resolveBrief,
  BriefError,
  PromptConflictError,
  BRIEF_SCHEMA,
  CATEGORIES,
  DEFAULT_BRIEF,
  DELIVERABLES,
  EXAMPLES,
  type Brief,
  type PromptResult,
} from '@/lib/prompt-engine';
import { translateUi, type UiLanguage } from '@/lib/ui-copy';

export default function Home() {
  const [uiLanguage, setUiLanguage] = useState<UiLanguage>('en');
  const tr = (value: string) => translateUi(uiLanguage, value);
  const resultCount = (blocks: number, words: number) =>
    uiLanguage === 'pt'
      ? `${blocks} blocos · ${words} palavras`
      : `${blocks} blocks · ${words} words`;
  const [brief, setBrief] = useState<Brief>({ ...DEFAULT_BRIEF });
  const [result, setResult] = useState<PromptResult | null>(null);
  const [prompt, setPrompt] = useState('');
  const [generatedBrief, setGeneratedBrief] = useState('');
  const [error, setError] = useState('');
  const [errorField, setErrorField] = useState<keyof Brief>('goal');
  const copyRequest = useRef(0);
  const preview = useMemo(() => {
    try {
      return resolveBrief(normalizeBrief(brief));
    } catch {
      return null;
    }
  }, [brief]);
  const [notice, setNotice] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [tab, setTab] = useState('prompt');
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const goalRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const dirty = !!result && generatedBrief !== JSON.stringify(brief);
  const edited = !!result && prompt !== result.prompt;
  function update<K extends keyof Brief>(key: K, value: Brief[K]) {
    copyRequest.current++;
    setBrief((b) => ({ ...b, [key]: value }));
    setError('');
    setNotice('');
  }
  function generate() {
    try {
      const next = buildPrompt(brief);
      copyRequest.current++;
      setResult(next);
      setPrompt(next.prompt);
      setGeneratedBrief(JSON.stringify(brief));
      setError('');
      setNotice(tr('Your prompt is ready.'));
      setTab('prompt');
      if (window.innerWidth < 900)
        resultRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
    } catch (e) {
      const field =
        e instanceof BriefError
          ? e.field
          : e instanceof PromptConflictError
            ? e.issues[0].field
            : 'goal';
      setErrorField(field);
      setError(e instanceof Error ? e.message : tr('Please check your brief.'));
      const control = document.getElementById(field);
      const disclosure = control?.closest('details');
      if (disclosure) disclosure.open = true;
      control?.focus();
    }
  }
  function example(index: number) {
    const { goal, category, context, success } = EXAMPLES[index];
    copyRequest.current++;
    setBrief({ ...DEFAULT_BRIEF, goal, category, context, success });
    setError('');
    setNotice(tr('Example loaded. You can edit it before generating.'));
    goalRef.current?.focus();
  }
  async function copy() {
    const request = ++copyRequest.current;
    try {
      await navigator.clipboard.writeText(prompt);
      if (request === copyRequest.current)
        setNotice(tr('Prompt copied to clipboard.'));
    } catch {
      if (request !== copyRequest.current) return;
      setTab('prompt');
      requestAnimationFrame(() => {
        promptRef.current?.focus();
        promptRef.current?.select();
      });
      setNotice(
        tr(
          'Clipboard access is unavailable. The prompt is selected: press Ctrl+C or ⌘C to copy.',
        ),
      );
    }
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([prompt], { type: 'text/plain;charset=utf-8' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'astra-prompt.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(tr('Prompt downloaded.'));
  }
  useEffect(() => {
    type Registry = {
      registerTool: (
        tool: {
          name: string;
          title: string;
          description: string;
          inputSchema: object;
          annotations: object;
          execute: (input: unknown) => unknown;
        },
        options: { signal: AbortSignal },
      ) => void | Promise<void>;
    };
    const context = (document as Document & { modelContext?: Registry })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      Promise.resolve(
        context.registerTool(
          {
            name: 'generate_astra_prompt',
            title: 'Generate an Astra prompt',
            description:
              'Build a task-specific English prompt and replace the visible brief and prompt editor. The prompt is generated locally; this does not run the task or call a model. Returns the complete generated prompt.',
            inputSchema: BRIEF_SCHEMA,
            annotations: { readOnlyHint: false, untrustedContentHint: true },
            execute(input: unknown) {
              const nextBrief = normalizeBrief(input);
              const next = buildPrompt(nextBrief);
              flushSync(() => {
                copyRequest.current++;
                setBrief(nextBrief);
                setResult(next);
                setPrompt(next.prompt);
                setGeneratedBrief(JSON.stringify(nextBrief));
                setError('');
                setNotice('Your prompt is ready.');
                setTab('prompt');
              });
              return {
                category: next.category,
                deliverable: next.resolution.deliverable,
                language: next.resolution.language,
                structure: next.expanded ? 'expanded' : 'compact',
                prompt: next.prompt,
                tips: next.tips,
                warnings: next.warnings,
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {
        /* Optional browser integration; normal controls remain available. */
      });
    } catch {
      /* This browser does not support registration. */
    }
    return () => lifecycle.abort();
  }, []);
  const wordCount = prompt.trim() ? prompt.trim().split(/\s+/).length : 0;
  return (
    <div className="studio" lang={uiLanguage}>
      <a href="#brief" className="skip-link">
        {tr('Skip to prompt builder')}
      </a>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Astra Prompt Studio home">
          <span className="brand-mark">
            <Orbit size={25} />
          </span>
          <span>
            astra<span className="brand-divider">/</span>
            <span className="brand-sub">prompt studio</span>
          </span>
        </Link>
        <div className="header-right">
          <span className="model-badge">
            <span className="status-dot" />
            {tr('Built for GPT-6 Astra')}
          </span>
          <fieldset
            className="language-switch"
            aria-label={tr('Interface language')}
          >
            <span className="language-label">EN/PT</span>
            <button
              type="button"
              className={uiLanguage === 'en' ? 'active' : ''}
              aria-pressed={uiLanguage === 'en'}
              aria-label={
                uiLanguage === 'pt'
                  ? 'Mudar a interface para inglês'
                  : 'Switch interface to English'
              }
              onClick={() => setUiLanguage('en')}
            >
              EN
            </button>
            <button
              type="button"
              className={uiLanguage === 'pt' ? 'active' : ''}
              aria-pressed={uiLanguage === 'pt'}
              aria-label={
                uiLanguage === 'en'
                  ? 'Switch interface to Portuguese'
                  : 'Mudar a interface para português'
              }
              onClick={() => setUiLanguage('pt')}
            >
              PT
            </button>
          </fieldset>
          <button
            className="guide-link"
            onClick={() => setShowGuide((v) => !v)}
            aria-expanded={showGuide}
            aria-controls="guide"
          >
            {tr('How it works')} <ArrowUpRight size={16} />
          </button>
        </div>
      </header>
      <main>
        <section className="page-heading">
          <div>
            <div className="eyebrow">
              <span className="tiny-line" />
              {tr('FROM INTENT TO INSTRUCTION')}
            </div>
            <h1>
              {tr('Give your idea a ')}
              <span>{tr('clear direction.')}</span>
            </h1>
            <p>
              {tr(
                'Describe what you want to do. Build a prompt that tells Astra what success looks like.',
              )}
            </p>
          </div>
          <div className="heading-note">
            <ShieldCheck size={19} />
            <span>
              {tr('No API key needed.')}
              <br />
              <strong>{tr('Your brief stays in this tab.')}</strong>
            </span>
          </div>
        </section>
        {showGuide && (
          <section id="guide" className="guide-panel">
            <div className="guide-title">
              <h2>{tr('A brief in. A ready-to-use prompt out.')}</h2>
              <button
                aria-label={tr('Close guide')}
                onClick={() => setShowGuide(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="guide-grid">
              <div>
                <span>01</span>
                <h3>{tr('Describe the outcome')}</h3>
                <p>
                  {tr(
                    'Start with your goal. Add context and a definition of done when they matter.',
                  )}
                </p>
              </div>
              <div>
                <span>02</span>
                <h3>{tr('Shape the instructions')}</h3>
                <p>
                  {tr(
                    'Local rules detect a likely deliverable and apply your restrictions. Correct the category or deliverable when needed; detection is a heuristic.',
                  )}
                </p>
              </div>
              <div>
                <span>03</span>
                <h3>{tr('Use it with Astra')}</h3>
                <p>
                  {tr(
                    'Review, edit and copy the prompt into your GPT-6 Astra session. This app builds prompts; it does not call a model or run your project.',
                  )}
                </p>
              </div>
            </div>
            <p className="source-note">
              <strong>{tr('Astra API setup:')}</strong>{' '}
              {tr(
                'Use gpt-6-astra with the Responses API for tool calling. Choose reasoning effort from low to max; none and minimal are unsupported. Remove temperature, top_p, top_logprobs and logprobs.',
              )}
              <br />
              <strong>{tr('Experimental notes:')}</strong>{' '}
              {tr(
                'The supplied completion-gate and stop-hook recipes are treated as architecture ideas, not guaranteed model behavior or required OpenAI configuration.',
              )}
            </p>
            <p className="source-note">
              {tr('Based on the')}{' '}
              <a
                href="https://developers.openai.com/api/docs/guides/latest-model"
                target="_blank"
                rel="noreferrer"
              >
                {tr('official OpenAI model guide')} <ArrowUpRight size={13} />
              </a>{' '}
              {tr(
                'and the supplied Rahul / @sairahul1 masterclass and Astra engineering notes. Guidance reviewed September 9, 2026. The instruction scaffold stays in English; the requested answer language follows your brief or language setting. Templates are starting points, not a guarantee of model performance. Independent tool; not affiliated with OpenAI.',
              )}
            </p>
          </section>
        )}
        <div className="workspace">
          <section className="brief-panel" id="brief">
            <div className="panel-heading">
              <div className="panel-title">
                <span className="step-number">01</span>
                <h2>{tr('Your brief')}</h2>
              </div>
              <span className="panel-meta">
                {tr('A little context goes a long way')}
              </span>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                generate();
              }}
            >
              <fieldset className="category-field">
                <legend>{tr('What are you working on?')}</legend>
                <div className="category-options">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      className={
                        'category ' +
                        (brief.category === c.value ? 'selected' : '')
                      }
                      aria-pressed={brief.category === c.value}
                      onClick={() => update('category', c.value)}
                    >
                      {c.value === 'auto' && <Sparkles size={14} />}{' '}
                      {tr(c.label)}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="field goal-field">
                <div className="label-row">
                  <label htmlFor="goal">
                    {tr('What do you want Astra to do?')}{' '}
                    <span className="required-mark">*</span>
                  </label>
                  <span>{brief.goal.length.toLocaleString()}/6,000</span>
                </div>
                <textarea
                  ref={goalRef}
                  id="goal"
                  value={brief.goal}
                  onChange={(e) => update('goal', e.target.value)}
                  placeholder={tr(
                    'e.g. Build a webapp that helps freelancers estimate project costs and create a clear quote…',
                  )}
                  rows={5}
                  aria-invalid={
                    brief.goal.length > 6000 ||
                    (!!error && errorField === 'goal')
                  }
                  aria-describedby={
                    error && errorField === 'goal' ? 'brief-error' : 'goal-hint'
                  }
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      e.preventDefault();
                      generate();
                    }
                  }}
                />
                <p className="field-hint" id="goal-hint">
                  {tr(
                    'Describe the result you need. Write naturally, in any language.',
                  )}
                </p>
              </div>
              <div className="example-row">
                <span>{tr('Try an idea')}</span>
                {EXAMPLES.map((e, i) => (
                  <button
                    type="button"
                    onClick={() => example(i)}
                    key={tr(e.label)}
                  >
                    {i === 0 ? (
                      <Code2 size={14} />
                    ) : i === 1 ? (
                      <FlaskConical size={14} />
                    ) : (
                      <FileText size={14} />
                    )}{' '}
                    {tr(e.label)}
                    <ArrowUpRight size={12} />
                  </button>
                ))}
              </div>
              <div className="field context-field">
                <div className="label-row">
                  <label htmlFor="context">
                    {tr('Useful context')}{' '}
                    <span className="optional">{tr('optional')}</span>
                  </label>
                  <span>{brief.context.length.toLocaleString()}/12,000</span>
                </div>
                <textarea
                  id="context"
                  value={brief.context}
                  onChange={(e) => update('context', e.target.value)}
                  rows={3}
                  aria-invalid={
                    brief.context.length > 12000 ||
                    (!!error && errorField === 'context')
                  }
                  placeholder={tr(
                    'Who is this for? What facts, constraints or background should Astra know?',
                  )}
                />
              </div>
              <details className="details-box">
                <summary>
                  <span>
                    <Plus size={16} /> {tr('Requirements & definition of done')}
                  </span>
                  <ChevronDown size={16} />
                </summary>
                <div className="details-content">
                  <div className="field">
                    <div className="label-row">
                      <label htmlFor="requirements">{tr('Requirements')}</label>
                      <span>
                        {brief.requirements.length.toLocaleString()}/6,000
                      </span>
                    </div>
                    <textarea
                      id="requirements"
                      rows={3}
                      aria-invalid={
                        brief.requirements.length > 6000 ||
                        (!!error && errorField === 'requirements')
                      }
                      value={brief.requirements}
                      onChange={(e) => update('requirements', e.target.value)}
                      placeholder={tr(
                        'Must-haves, limits, tone, audience or things to avoid…',
                      )}
                    />
                  </div>
                  <div className="field">
                    <div className="label-row">
                      <label htmlFor="success">
                        {tr('What does done look like?')}
                      </label>
                      <span>{brief.success.length.toLocaleString()}/3,000</span>
                    </div>
                    <textarea
                      id="success"
                      rows={2}
                      aria-invalid={
                        brief.success.length > 3000 ||
                        (!!error && errorField === 'success')
                      }
                      value={brief.success}
                      onChange={(e) => update('success', e.target.value)}
                      placeholder={tr(
                        'e.g. The mobile form works, totals are correct, and the quote can be copied.',
                      )}
                    />
                  </div>
                </div>
              </details>
              <div className="settings-title">
                <SlidersHorizontal size={16} />
                <h3>{tr('Make it fit')}</h3>
              </div>
              <div className="settings-grid">
                <div className="field">
                  <label htmlFor="depth">{tr('Prompt structure')}</label>
                  <select
                    id="depth"
                    value={brief.depth}
                    onChange={(e) =>
                      update('depth', e.target.value as Brief['depth'])
                    }
                  >
                    <option value="auto">
                      {tr('Adaptive · smallest useful structure')}
                    </option>
                    <option value="compact">
                      {tr('Compact · merged sections')}
                    </option>
                    <option value="expanded">
                      {tr('Expanded · explicit sections')}
                    </option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="autonomy">{tr('Astra’s autonomy')}</label>
                  <select
                    id="autonomy"
                    value={brief.autonomy}
                    onChange={(e) =>
                      update('autonomy', e.target.value as Brief['autonomy'])
                    }
                  >
                    <option value="balanced">{tr('Balanced')}</option>
                    <option value="proactive">{tr('Take initiative')}</option>
                    <option value="guided">{tr('Clarify first')}</option>
                  </select>
                </div>
              </div>
              <div className="field deliverable-control">
                <label htmlFor="deliverable">
                  {tr('Requested deliverable')}
                </label>
                <select
                  id="deliverable"
                  value={brief.deliverable}
                  onChange={(e) =>
                    update(
                      'deliverable',
                      e.target.value as Brief['deliverable'],
                    )
                  }
                >
                  {DELIVERABLES.map((d) => (
                    <option key={d.value} value={d.value}>
                      {tr(d.label)}
                    </option>
                  ))}
                </select>
                {preview && (
                  <p className="resolved-hint">
                    {brief.deliverable === 'auto'
                      ? tr('Detected')
                      : tr('Selected')}
                    : <strong>{tr(preview.artifact)}</strong> ·{' '}
                    {uiLanguage === 'pt'
                      ? preview.languageSource === 'default'
                        ? 'Seguir briefing / inglês padrão'
                        : preview.language === 'pt'
                          ? 'Resposta em português'
                          : 'Resposta em inglês'
                      : answerLanguageLabel(preview)}
                    . {tr('Detection uses local rules.')}
                  </p>
                )}
              </div>
              {!!preview?.issues.length && (
                <aside
                  className="conflict-panel"
                  aria-label={
                    uiLanguage === 'pt'
                      ? 'Conflitos reconhecidos'
                      : 'Recognized conflicts'
                  }
                >
                  <strong>{tr('Review these settings')}</strong>
                  <ul>
                    {preview.issues.map((issue) => (
                      <li key={issue.code}>
                        <a href={'#' + issue.field}>{issue.message}</a>
                      </li>
                    ))}
                  </ul>
                  <p>
                    {tr(
                      'Only recognized patterns are checked. Review the complete prompt.',
                    )}
                  </p>
                </aside>
              )}
              <details className="details-box advanced">
                <summary>
                  <span>
                    <SlidersHorizontal size={15} />{' '}
                    {tr('Output & available tools')}
                  </span>
                  <ChevronDown size={16} />
                </summary>
                <div className="details-content">
                  <div className="settings-grid">
                    <div className="field">
                      <label htmlFor="format">{tr('Response format')}</label>
                      <select
                        id="format"
                        value={brief.format}
                        onChange={(e) =>
                          update('format', e.target.value as Brief['format'])
                        }
                      >
                        <option value="auto">{tr('Match the task')}</option>
                        <option value="prose">{tr('Plain paragraphs')}</option>
                        <option value="steps">{tr('Numbered steps')}</option>
                        <option value="table">{tr('Comparison table')}</option>
                        <option value="json">JSON</option>
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="length">{tr('Response length')}</label>
                      <select
                        id="length"
                        value={brief.length}
                        onChange={(e) =>
                          update('length', e.target.value as Brief['length'])
                        }
                      >
                        <option value="concise">{tr('Concise')}</option>
                        <option value="balanced">{tr('Balanced')}</option>
                        <option value="detailed">{tr('Detailed')}</option>
                      </select>
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="tools">
                      {tr('Tools available in your Astra session')}
                    </label>
                    <select
                      id="tools"
                      value={brief.tools}
                      onChange={(e) =>
                        update('tools', e.target.value as Brief['tools'])
                      }
                    >
                      <option value="unknown">
                        {tr('Unknown · discover in target session')}
                      </option>
                      <option value="none">{tr('No tools available')}</option>
                      <option value="research">
                        {tr('Web search declared available')}
                      </option>
                      <option value="workspace">
                        {tr('Workspace declared available')}
                      </option>
                      <option value="agents">
                        {tr('Subagents declared available')}
                      </option>
                    </select>
                    <p className="field-hint">
                      {tr(
                        'These are unverified availability hints, not permissions. Other capabilities stay unknown.',
                      )}
                    </p>
                  </div>
                  <div className="settings-grid">
                    <div className="field">
                      <label htmlFor="browsing">{tr('Browsing')}</label>
                      <select
                        id="browsing"
                        value={brief.browsing}
                        onChange={(e) =>
                          update(
                            'browsing',
                            e.target.value as Brief['browsing'],
                          )
                        }
                      >
                        <option value="auto">
                          {tr('Follow declaration / brief')}
                        </option>
                        <option value="available">
                          {tr('Declared available')}
                        </option>
                        <option value="unavailable">{tr('Unavailable')}</option>
                        <option value="forbidden">{tr('Forbidden')}</option>
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="delegation">{tr('Delegation')}</label>
                      <select
                        id="delegation"
                        value={brief.delegation}
                        onChange={(e) =>
                          update(
                            'delegation',
                            e.target.value as Brief['delegation'],
                          )
                        }
                      >
                        <option value="auto">
                          {tr('Adaptive · only if useful')}
                        </option>
                        <option value="conditional">
                          {tr('Allow when useful & available')}
                        </option>
                        <option value="disabled">
                          {tr('Disabled · work directly')}
                        </option>
                      </select>
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="language">{tr('Answer language')}</label>
                    <select
                      id="language"
                      value={brief.language}
                      onChange={(e) =>
                        update('language', e.target.value as Brief['language'])
                      }
                    >
                      <option value="auto">
                        {tr('Follow brief · English default')}
                      </option>
                      <option value="en">{tr('English')}</option>
                      <option value="pt">{tr('Portuguese')}</option>
                    </select>
                    <p className="field-hint">
                      {tr(
                        'The scaffold stays in English. Your original text is preserved without translation.',
                      )}
                    </p>
                  </div>
                </div>
              </details>
              {error && (
                <p role="alert" id="brief-error" className="form-error">
                  {error}
                </p>
              )}
              <Button type="submit" className="generate-button">
                <WandSparkles size={18} />
                {result ? tr('Regenerate prompt') : tr('Generate prompt')}
                <ArrowRight size={18} />
              </Button>
              <div className="generate-foot">
                <span>
                  <ShieldCheck size={13} />
                  {tr('Processed in your browser')}
                </span>
                <span>⌘ / Ctrl + Enter</span>
              </div>
            </form>
          </section>
          <section
            className={'output-panel ' + (result ? 'has-result' : '')}
            ref={resultRef}
            aria-label={tr('Your Astra prompt')}
          >
            <div className="panel-heading">
              <div className="panel-title">
                <span className="step-number">02</span>
                <h2>{tr('Your Astra prompt')}</h2>
              </div>
              <span className={'output-status ' + (result ? 'ready' : '')}>
                {result ? (
                  <>
                    <span className="status-dot" />
                    {dirty
                      ? tr('Brief changed')
                      : edited
                        ? tr('Edited')
                        : tr('Ready to use')}
                  </>
                ) : (
                  <>
                    <span className="status-dot" />
                    {tr('Waiting for your idea')}
                  </>
                )}
              </span>
            </div>
            {!result ? (
              <div className="empty-output">
                <div className="empty-mark">
                  <Orbit size={40} strokeWidth={1.25} />
                  <span className="orbit-dot" />
                </div>
                <h3>
                  {tr('Good work starts')}
                  <br />
                  {tr('with clear instructions.')}
                </h3>
                <p>
                  {tr('Your prompt will appear here,')}
                  <br />
                  {tr('structured around the task you have in mind.')}
                </p>
                <div className="blueprint">
                  <div>
                    <span>01</span>
                    <span>{tr('Your outcome')}</span>
                    <Check size={14} />
                  </div>
                  <div>
                    <span>02</span>
                    <span>{tr('The context that matters')}</span>
                    <Check size={14} />
                  </div>
                  <div>
                    <span>03</span>
                    <span>{tr('Room to take initiative')}</span>
                    <Check size={14} />
                  </div>
                  <div>
                    <span>04</span>
                    <span>{tr('A clear finish line')}</span>
                    <Check size={14} />
                  </div>
                </div>
                <span className="empty-caption">
                  <Sparkles size={13} />
                  {tr('Only the structure your task needs')}
                </span>
              </div>
            ) : (
              <div className="result-body">
                <div className="result-info">
                  <span>
                    {tr(
                      CATEGORIES.find((c) => c.value === result.category)
                        ?.label ?? '',
                    )}
                  </span>
                  <span>
                    {result.expanded ? tr('Expanded') : tr('Compact')}
                  </span>
                  <span>{tr(result.resolution.artifact)}</span>
                  <span>
                    {uiLanguage === 'pt'
                      ? result.resolution.languageSource === 'default'
                        ? 'Seguir briefing / inglês padrão'
                        : result.resolution.language === 'pt'
                          ? 'Resposta em português'
                          : 'Resposta em inglês'
                      : answerLanguageLabel(result.resolution)}
                  </span>
                  <span>{resultCount(result.sections.length, wordCount)}</span>
                </div>
                {dirty && (
                  <p className="stale-notice">
                    {tr(
                      'Your brief has changed. Regenerate to apply the new settings.',
                    )}
                  </p>
                )}
                <Tabs
                  value={tab}
                  onValueChange={(v) => setTab(String(v))}
                  className="output-tabs"
                >
                  <TabsList
                    aria-label={
                      uiLanguage === 'pt'
                        ? 'Visualizações do prompt'
                        : 'Prompt views'
                    }
                  >
                    <TabsTrigger value="prompt">
                      <ScanText size={15} />
                      {tr('Prompt')}
                    </TabsTrigger>
                    <TabsTrigger value="structure">
                      <Layers3 size={15} />
                      {tr('Why this structure')}
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="prompt">
                    <div className="editor-label">
                      <span>{tr('READY TO COPY')}</span>
                      <span>{tr('Click the text to edit')}</span>
                    </div>
                    <textarea
                      className="prompt-editor"
                      aria-label={tr('Edit generated prompt')}
                      value={prompt}
                      onChange={(e) => {
                        copyRequest.current++;
                        setPrompt(e.target.value);
                        setNotice('');
                      }}
                      ref={promptRef}
                      spellCheck={false}
                    />
                  </TabsContent>
                  <TabsContent value="structure">
                    <div className="structure-list">
                      {result.sections.map((s, i) => (
                        <div key={s.title}>
                          <span className="structure-number">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <div>
                            <h3>{s.title}</h3>
                            <p>{s.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="structure-note">
                      {tr(
                        'This describes the generated template. Your manual edits may change its structure.',
                      )}
                    </p>
                  </TabsContent>
                </Tabs>
                {!!result.tips.length && (
                  <details className="tips">
                    <summary>
                      <Sparkles size={14} />
                      {uiLanguage === 'pt'
                        ? result.tips.length +
                          ' formas de deixar isso mais específico'
                        : result.tips.length +
                          ' ways to make this more specific'}
                      <ChevronDown size={14} />
                    </summary>
                    <ul>
                      {result.tips.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </details>
                )}
                <div className="result-actions">
                  <Button
                    type="button"
                    onClick={copy}
                    disabled={!prompt.trim() || dirty}
                    className="copy-button"
                  >
                    {notice === tr('Prompt copied to clipboard.') ? (
                      <CheckCheck size={16} />
                    ) : (
                      <Copy size={16} />
                    )}
                    {tr('Copy prompt')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={download}
                    disabled={!prompt.trim() || dirty}
                    className="download-button"
                  >
                    <ArrowDownToLine size={16} />
                    {tr('Download .txt')}
                  </Button>
                </div>
                <p className="use-note">
                  {tr(
                    'Paste into your GPT-6 Astra session and review before running.',
                  )}
                </p>
              </div>
            )}
            <div className="output-footer">
              <Bot size={16} />
              <span>{tr('A prompt builder. Your project runs in Astra.')}</span>
            </div>
          </section>
        </div>
        <output className="status-region" aria-live="polite">
          {notice && (
            <>
              <Check size={15} />
              {notice}
            </>
          )}
        </output>
        <footer className="site-footer">
          <span>{tr('Made for a clearer starting point.')}</span>
          <a
            href="https://developers.openai.com/api/docs/guides/latest-model"
            target="_blank"
            rel="noreferrer"
          >
            {tr('Based on OpenAI prompting guidance')}{' '}
            <ArrowUpRight size={14} />
          </a>
          <span>{tr('Independent tool · Local rules')}</span>
        </footer>
      </main>
    </div>
  );
}
