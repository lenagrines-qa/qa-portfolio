/**
 * Custom Playwright reporter — builds ONE readable Test Summary Report.
 *
 * Playwright calls a reporter's methods while tests run:
 *   onBegin   → once, before the first test (we keep the config and the test tree)
 *   onTestEnd → after every test (we grab its screenshot)
 *   onEnd     → once, after the last test (we write the HTML file)
 *
 * The result is a single self-contained file, test-report/index.html:
 * summary, metrics, environment, coverage by area, every test with its
 * screenshot, defects, and a release recommendation. Screenshots are
 * embedded as base64, so the file opens anywhere without extra folders.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';

// Options passed from playwright.config.ts.
type Options = {
  outputFile?: string;
  title?: string;
};

type Status = 'passed' | 'failed' | 'flaky' | 'skipped';

// One table row per test, built from the final attempt of that test.
type Row = {
  area: string; // describe title without tags, e.g. "TC-03 Contact and resume"
  title: string; // test title
  project: string; // desktop-chrome / mobile-chrome / login / api
  tags: string[]; // e.g. ["@smoke"]
  status: Status;
  durationMs: number;
  error?: string;
  screenshot?: string; // data:image/png;base64,...
};

class SummaryReporter implements Reporter {
  private config!: FullConfig;
  private suite!: Suite;
  // test id → screenshot of its last attempt (as a data URL)
  private screenshots = new Map<string, string>();

  constructor(private options: Options = {}) {}

  onBegin(config: FullConfig, suite: Suite): void {
    this.config = config;
    this.suite = suite;
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    // `screenshot: 'on'` in the config attaches a PNG to every test that
    // opened a page. Read it now: the file is on disk at this moment.
    const shot = result.attachments.find((a) => a.name === 'screenshot' && a.path);
    if (shot?.path && fs.existsSync(shot.path)) {
      const base64 = fs.readFileSync(shot.path).toString('base64');
      this.screenshots.set(test.id, `data:image/png;base64,${base64}`);
    }
  }

  // This reporter writes a file, not terminal output, so the `list`
  // reporter keeps printing results as usual.
  printsToStdio(): boolean {
    return false;
  }

  onEnd(result: FullResult): void {
    const rows = this.suite.allTests().map((test) => this.toRow(test));
    const html = this.render(rows, result);

    const configDir = this.config.configFile
      ? path.dirname(this.config.configFile)
      : process.cwd();
    const file = path.resolve(configDir, this.options.outputFile ?? 'test-report/index.html');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, html);
    console.log(`\n  Test summary report: ${path.relative(process.cwd(), file)}\n`);
  }

  /** Turns a Playwright test into a plain row for the report. */
  private toRow(test: TestCase): Row {
    // titlePath = ['', project, file, ...describe titles, test title]
    const [, project, , ...rest] = test.titlePath();
    const last = test.results[test.results.length - 1];

    const outcome = test.outcome();
    const status: Status =
      outcome === 'expected' ? 'passed'
      : outcome === 'flaky' ? 'flaky'
      : outcome === 'skipped' ? 'skipped'
      : 'failed';

    return {
      area: rest.slice(0, -1).join(' › ').replace(/@\w+/g, '').trim(),
      title: test.title,
      project,
      tags: test.tags,
      status,
      durationMs: last?.duration ?? 0,
      // Error text without terminal color codes.
      error: last?.error?.message?.replace(/\u001b\[[0-9;]*m/g, ''),
      screenshot: this.screenshots.get(test.id),
    };
  }

  /** Builds the whole HTML page. */
  private render(rows: Row[], result: FullResult): string {
    const count = (s: Status) => rows.filter((r) => r.status === s).length;
    const total = rows.length;
    const passed = count('passed');
    const failed = count('failed');
    const flaky = count('flaky');
    const skipped = count('skipped');
    const executed = total - skipped;
    const passRate = executed ? Math.round((passed / executed) * 100) : 0;

    // Overall verdict drives the colour, the summary text, and the recommendation.
    const verdict =
      failed > 0 ? { label: 'FAILED', css: 'bad' }
      : flaky > 0 ? { label: 'PASSED WITH WARNINGS', css: 'warn' }
      : { label: 'PASSED', css: 'good' };

    // Areas sorted by test case id: ["TC-01 Home page", "TC-02 Navigation", ...].
    const areas = unique(rows.map((r) => r.area)).sort((a, b) =>
      a.localeCompare(b, 'en', { numeric: true }),
    );
    const areaNames = areas.map((a) => a.replace(/^TC-\S+\s*/, ''));

    // Only projects that actually ran tests in this run.
    const projects = this.config.projects.filter((p) => rows.some((r) => r.project === p.name));
    const projectNames = projects.map((p) => p.name);

    const summary = this.summaryText({ total, failed, flaky, areaNames, projectNames });
    const recommendation =
      failed > 0
        ? 'Not ready for release. Fix the failed tests or the defects they found, then rerun the suite.'
        : flaky > 0
          ? 'Ready for release, with a follow-up: investigate the flaky tests so they do not hide real bugs.'
          : 'Ready for release. All checks passed, no defects found.';

    // Time zone is shown because CI servers run in UTC, not the reader's zone.
    const started = result.startTime.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });
    const platform = { darwin: 'macOS', linux: 'Linux', win32: 'Windows' }[process.platform as string]
      ?? process.platform;
    const runner = process.env.GITHUB_ACTIONS ? 'GitHub Actions' : process.env.CI ? 'CI' : 'Local machine';

    const title = this.options.title ?? 'Test Summary Report';

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Test Summary Report · ${esc(title)}</title>
<style>${STYLES}</style>
</head>
<body>
<main>
  <header class="hero">
    <div>
      <p class="eyebrow">Test Summary Report</p>
      <h1>${esc(title)}</h1>
      <p class="meta">${esc(started)} · ${seconds(result.duration)} · ${esc(runner)}</p>
    </div>
    <div class="verdict ${verdict.css}">${verdict.label}</div>
  </header>

  <section class="card">
    <h2>Summary</h2>
    <p class="summary">${summary}</p>
    <p class="recommendation ${verdict.css}"><strong>Recommendation:</strong> ${esc(recommendation)}</p>
  </section>

  <section class="metrics">
    ${metric('Total', total)}
    ${metric('Passed', passed, 'good')}
    ${metric('Failed', failed, failed ? 'bad' : '')}
    ${metric('Flaky', flaky, flaky ? 'warn' : '')}
    ${metric('Skipped', skipped)}
    ${metric('Pass rate', `${passRate}%`, passRate === 100 ? 'good' : 'warn')}
  </section>

  <div class="two-col">
    <section class="card">
      <h2>Scope</h2>
      <table>
        <thead><tr><th>Configuration</th><th>Application</th><th>Device</th></tr></thead>
        <tbody>
          ${projects
            .map((p) => {
              // A project without a viewport (the API one) never opens a browser.
              const vp = p.use.viewport;
              const device = vp
                ? `${p.use.isMobile ? 'Mobile' : 'Desktop'}, ${vp.width}×${vp.height}`
                : 'No browser (HTTP only)';
              return `<tr><td><code>${esc(p.name)}</code></td><td>${esc(appName(p.use.baseURL))}</td><td>${esc(device)}</td></tr>`;
            })
            .join('')}
        </tbody>
      </table>
    </section>
    <section class="card">
      <h2>Environment</h2>
      <table>
        <tbody>
          <tr><th>Tool</th><td>Playwright ${esc(this.config.version)} + TypeScript</td></tr>
          <tr><th>Browser engine</th><td>${esc(unique(projects.map((p) => p.use.defaultBrowserType ?? p.use.browserName ?? 'chromium')).join(', '))}</td></tr>
          <tr><th>Node.js</th><td>${esc(process.version)}</td></tr>
          <tr><th>OS</th><td>${esc(`${platform} (${os.arch()})`)}</td></tr>
          <tr><th>Run on</th><td>${esc(runner)}</td></tr>
        </tbody>
      </table>
    </section>
  </div>

  <section class="card">
    <h2>Coverage by area</h2>
    <table>
      <thead><tr><th>Area</th><th class="num">Tests</th><th class="num">Passed</th><th class="num">Failed</th><th>Status</th></tr></thead>
      <tbody>
        ${areas
          .map((area) => {
            const inArea = rows.filter((r) => r.area === area);
            const ok = inArea.filter((r) => r.status === 'passed').length;
            const bad = inArea.filter((r) => r.status === 'failed').length;
            const st: Status = bad ? 'failed' : inArea.some((r) => r.status === 'flaky') ? 'flaky' : 'passed';
            return `<tr><td>${esc(area)}</td><td class="num">${inArea.length}</td><td class="num">${ok}</td><td class="num">${bad}</td><td>${pill(st)}</td></tr>`;
          })
          .join('')}
      </tbody>
    </table>
  </section>

  <section class="card">
    <h2>Defects</h2>
    ${
      failed + flaky === 0
        ? '<p class="empty">No defects found in this run.</p>'
        : `<ul class="defects">${rows
            .filter((r) => r.status === 'failed' || r.status === 'flaky')
            .map(
              (r) => `<li>${pill(r.status)} <strong>${esc(r.area)} › ${esc(r.title)}</strong> <code>${esc(r.project)}</code>${
                r.error ? `<pre>${esc(firstLines(r.error, 6))}</pre>` : ''
              }</li>`,
            )
            .join('')}</ul>`
    }
  </section>

  <section class="card">
    <h2>Test results</h2>
    <p class="hint">Click a screenshot to enlarge it.</p>
    ${areas
      .map(
        (area) => `<h3>${esc(area)}</h3>
        <div class="tests">${rows
          .filter((r) => r.area === area)
          .map(
            (r) => `<article class="test ${r.status}">
              <div class="test-head">
                ${pill(r.status)}
                <span class="test-title">${esc(r.title)}</span>
              </div>
              <div class="test-meta">
                <code>${esc(r.project)}</code>
                ${r.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}
                <span>${seconds(r.durationMs)}</span>
              </div>
              ${r.error ? `<pre class="error">${esc(firstLines(r.error, 10))}</pre>` : ''}
              ${
                r.screenshot
                  ? `<img class="shot" src="${r.screenshot}" alt="Screenshot: ${esc(r.title)}" loading="lazy" />`
                  : '<p class="no-shot">HTTP check, no page to screenshot</p>'
              }
            </article>`,
          )
          .join('')}</div>`,
      )
      .join('')}
  </section>

  <footer>Generated by Playwright · reporters/summary-reporter.ts</footer>
</main>

<div class="lightbox" id="lightbox" hidden><img alt="" /></div>
<script>
  // Click a screenshot → show it full size; click anywhere → close.
  const box = document.getElementById('lightbox');
  document.querySelectorAll('img.shot').forEach((img) =>
    img.addEventListener('click', () => {
      box.querySelector('img').src = img.src;
      box.hidden = false;
    }),
  );
  box.addEventListener('click', () => (box.hidden = true));
</script>
</body>
</html>`;
  }

  /** One paragraph in plain English that a manager can read in 10 seconds. */
  private summaryText(d: {
    total: number;
    failed: number;
    flaky: number;
    areaNames: string[];
    projectNames: string[];
  }): string {
    const areas = d.areaNames.map(esc).join(', ');
    const configs = d.projectNames.map((n) => `<code>${esc(n)}</code>`).join(', ');
    const scope = `${d.total} automated tests covered ${d.areaNames.length} areas (${areas}) on ${d.projectNames.length} configuration${d.projectNames.length === 1 ? '' : 's'} (${configs}).`;

    if (d.failed > 0) {
      return `${scope} <strong>${d.failed} of ${d.total} tests failed.</strong> Details and error messages are listed under Defects.`;
    }
    if (d.flaky > 0) {
      return `${scope} All tests passed in the end, but <strong>${d.flaky} passed only on retry</strong> (flaky) and need investigation.`;
    }
    return `${scope} <strong>All tests passed on the first attempt.</strong> No defects were found.`;
  }
}

// ---------- small helpers ----------

/** Escapes text for safe use inside HTML. */
function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function seconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)} s`;
}

/** "http://127.0.0.1:4174" → "Portfolio site (local server)"; other URLs → host name. */
function appName(baseURL?: string): string {
  if (!baseURL) return '—';
  const host = new URL(baseURL).hostname;
  return host === '127.0.0.1' || host === 'localhost' ? 'Portfolio site (local server)' : host;
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function firstLines(text: string, n: number): string {
  return text.split('\n').slice(0, n).join('\n');
}

function metric(label: string, value: number | string, css = ''): string {
  return `<div class="metric ${css}"><span class="value">${value}</span><span class="label">${label}</span></div>`;
}

function pill(status: Status): string {
  const text = { passed: 'Passed', failed: 'Failed', flaky: 'Flaky', skipped: 'Skipped' }[status];
  return `<span class="pill ${status}">${text}</span>`;
}

const STYLES = `
  :root {
    --bg: #f5f7fb; --card: #ffffff; --text: #1d2433; --muted: #667085; --line: #e4e7ec;
    --good: #12b76a; --good-bg: #ecfdf3; --bad: #f04438; --bad-bg: #fef3f2;
    --warn: #f79009; --warn-bg: #fffaeb; --accent: #3b5bdb;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text);
    font: 15px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  main { max-width: 1100px; margin: 0 auto; padding: 32px 20px 48px; }
  h1 { margin: 4px 0 6px; font-size: 30px; line-height: 1.2; }
  h2 { margin: 0 0 14px; font-size: 18px; }
  h3 { margin: 26px 0 12px; font-size: 15px; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
  code { font: 13px ui-monospace, SFMono-Regular, Menlo, monospace; background: #f2f4f7; padding: 1px 6px; border-radius: 6px; }

  .hero { display: flex; justify-content: space-between; align-items: center; gap: 20px;
    background: linear-gradient(135deg, #1d2433, #2c3a5a); color: #fff; border-radius: 16px; padding: 28px 32px; margin-bottom: 20px; }
  .eyebrow { margin: 0; font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: #a5b4fc; }
  .meta { margin: 0; color: #cbd5e1; }
  .verdict { font-weight: 700; font-size: 16px; padding: 10px 18px; border-radius: 999px; white-space: nowrap; }
  .verdict.good { background: var(--good); } .verdict.bad { background: var(--bad); } .verdict.warn { background: var(--warn); }

  .card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 22px 24px; margin-bottom: 20px; }
  .summary { margin: 0 0 14px; font-size: 16px; }
  .recommendation { margin: 0; padding: 12px 16px; border-radius: 10px; }
  .recommendation.good { background: var(--good-bg); } .recommendation.bad { background: var(--bad-bg); } .recommendation.warn { background: var(--warn-bg); }

  .metrics { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin-bottom: 20px; }
  .metric { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 16px; text-align: center; }
  .metric .value { display: block; font-size: 28px; font-weight: 700; }
  .metric .label { color: var(--muted); font-size: 13px; }
  .metric.good .value { color: var(--good); } .metric.bad .value { color: var(--bad); } .metric.warn .value { color: var(--warn); }

  .two-col { display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 9px 10px; border-bottom: 1px solid var(--line); vertical-align: top; }
  thead th { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }
  tbody th { color: var(--muted); font-weight: 500; width: 40%; }
  tr:last-child td, tr:last-child th { border-bottom: 0; }
  .num { text-align: right; }

  .pill { display: inline-block; font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 999px; }
  .pill.passed { color: #027a48; background: var(--good-bg); } .pill.failed { color: #b42318; background: var(--bad-bg); }
  .pill.flaky { color: #b54708; background: var(--warn-bg); } .pill.skipped { color: var(--muted); background: #f2f4f7; }

  .empty { margin: 0; color: var(--good); font-weight: 600; }
  .defects { margin: 0; padding-left: 18px; } .defects li { margin-bottom: 12px; }
  .hint { margin: -6px 0 0; color: var(--muted); font-size: 13px; }

  .tests { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
  .test { border: 1px solid var(--line); border-left: 4px solid var(--good); border-radius: 12px; padding: 14px; background: #fcfcfd; }
  .test.failed { border-left-color: var(--bad); } .test.flaky { border-left-color: var(--warn); } .test.skipped { border-left-color: var(--muted); }
  .test-head { display: flex; gap: 10px; align-items: flex-start; }
  .test-title { font-weight: 600; }
  .test-meta { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 8px 0 10px; color: var(--muted); font-size: 13px; }
  .tag { color: var(--accent); background: #eef2ff; padding: 1px 8px; border-radius: 999px; font-size: 12px; }
  .shot { width: 100%; border-radius: 8px; border: 1px solid var(--line); cursor: zoom-in; display: block; }
  .no-shot { margin: 0; padding: 18px; text-align: center; color: var(--muted); font-size: 13px; background: #f2f4f7; border-radius: 8px; }
  pre { white-space: pre-wrap; font: 12px/1.5 ui-monospace, Menlo, monospace; background: var(--bad-bg); color: #7a271a; padding: 10px; border-radius: 8px; overflow: auto; }

  .lightbox { position: fixed; inset: 0; background: rgba(15, 23, 42, .85); display: flex; align-items: center; justify-content: center; padding: 24px; cursor: zoom-out; }
  .lightbox[hidden] { display: none; }
  .lightbox img { max-width: 100%; max-height: 100%; border-radius: 8px; }
  footer { text-align: center; color: var(--muted); font-size: 12px; margin-top: 8px; }

  @media (max-width: 800px) {
    .metrics { grid-template-columns: repeat(3, 1fr); }
    .two-col { grid-template-columns: 1fr; }
    .hero { flex-direction: column; align-items: flex-start; }
  }
`;

export default SummaryReporter;
