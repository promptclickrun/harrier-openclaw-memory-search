import { Icon } from "./components/Icon";
import { CodeBlock } from "./components/CodeBlock";
import {
  REPO_URL,
  PORT,
  features,
  endpoints,
  setupSteps,
  minimalConfig,
  nativeOllamaConfig,
  hybridConfig,
  smokeTranscript,
  recallResults,
} from "./data/content";

function Nav() {
  const links = [
    { href: "#fork", label: "Which path" },
    { href: "#architecture", label: "Architecture" },
    { href: "#setup", label: "Setup" },
    { href: "#features", label: "Features" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5 sm:px-8">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-md bg-ink text-emerald">
            <Icon name="search" className="size-4" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">
            Harrier<span className="text-ink-faint"> × OpenClaw</span>
          </span>
        </a>
        <div className="ml-auto hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-ink-soft transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </div>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-2 rounded-lg border border-hairline-strong px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink/30 md:ml-0"
        >
          <Icon name="github" className="size-4" />
          <span className="hidden sm:inline">GitHub</span>
        </a>
      </nav>
    </header>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald/30 bg-emerald/8 px-3 py-1 text-[12px] font-medium text-emerald-deep">
      <span className="size-1.5 rounded-full bg-emerald" />
      {children}
    </span>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden border-b border-hairline">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-60 [mask-image:radial-gradient(ellipse_at_top,black,transparent_72%)]" />
      <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-20 sm:px-8 sm:pt-28">
        <Pill>Local semantic memory for OpenClaw agents</Pill>
        <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl">
          Private semantic recall,
          <br />
          stored as plain{" "}
          <span className="text-emerald-deep">markdown</span>.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
          A ~200-line sentence-transformers / safetensors embedding server that
          speaks the Ollama API on port {PORT}. Point OpenClaw&apos;s{" "}
          <code className="rounded bg-canvas-soft px-1.5 py-0.5 font-mono text-[13px] text-ink ring-1 ring-hairline-strong">
            memorySearch
          </code>{" "}
          at it and your agent recalls concepts, not keywords.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <a
            href="#setup"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald px-5 py-3 text-sm font-semibold text-[#06281b] shadow-[0_12px_36px_-12px_rgba(62,207,142,0.7)] transition-transform hover:scale-[1.02] hover:bg-emerald-deep"
          >
            Get started
            <Icon name="arrow" className="size-4" />
          </a>
          <a
            href="#fork"
            className="inline-flex items-center gap-2 rounded-lg border border-hairline-strong px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink/30"
          >
            Native Ollama vs Harrier
          </a>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {[
            { k: "1024-d", v: "normalized vectors" },
            { k: `:${PORT}`, v: "Ollama-compatible API" },
            { k: "100%", v: "local & private" },
          ].map((s) => (
            <div
              key={s.v}
              className="rounded-xl border border-hairline bg-canvas-soft px-5 py-4"
            >
              <div className="font-mono text-2xl font-semibold tracking-tight text-ink">
                {s.k}
              </div>
              <div className="mt-1 text-sm text-ink-faint">{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Fork() {
  const cards = [
    {
      tag: "Start here",
      accent: false,
      title: "Native Ollama path",
      blurb:
        "If you just want local embeddings, OpenClaw supports Ollama natively. The boring 15-minute path.",
      bullets: [
        "ollama pull nomic-embed-text",
        'set provider to "ollama"',
        "openclaw memory index --force",
      ],
      config: nativeOllamaConfig,
      label: "openclaw.json",
    },
    {
      tag: "This repo",
      accent: true,
      title: "Harrier sentence-transformers shim",
      blurb:
        "For models distributed as sentence-transformers / safetensors that Ollama cannot pull. Wrap them behind the same API.",
      bullets: [
        "wrap microsoft/harrier-oss-v1-0.6b",
        "Ollama-compatible HTTP server",
        "launchd, smoke tests, demo corpus",
      ],
      config: minimalConfig,
      label: "openclaw.json",
    },
  ];
  return (
    <section id="fork" className="border-b border-hairline bg-canvas-soft">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <SectionHead
          eyebrow="Fork in the road"
          title="Which path do you actually need?"
          sub="OpenClaw already supports Ollama as a native memorySearch provider. Use the shim only when your embedding model is not a normal Ollama pull."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {cards.map((c) => (
            <div
              key={c.title}
              className={[
                "flex flex-col rounded-2xl border bg-white p-6 sm:p-8",
                c.accent
                  ? "border-emerald/40 emerald-glow"
                  : "border-hairline",
              ].join(" ")}
            >
              <span
                className={[
                  "inline-flex w-fit items-center rounded-full px-3 py-1 text-[12px] font-semibold",
                  c.accent
                    ? "bg-emerald/12 text-emerald-deep"
                    : "bg-canvas-soft text-ink-faint ring-1 ring-hairline-strong",
                ].join(" ")}
              >
                {c.tag}
              </span>
              <h3 className="mt-4 text-xl font-semibold tracking-tight text-ink">
                {c.title}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
                {c.blurb}
              </p>
              <ul className="mt-5 space-y-2.5">
                {c.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2.5 text-sm text-ink-soft"
                  >
                    <Icon
                      name="check"
                      className={[
                        "mt-0.5 size-4 shrink-0",
                        c.accent ? "text-emerald-deep" : "text-ink-faint",
                      ].join(" ")}
                    />
                    <span className="font-mono text-[13px]">{b}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <CodeBlock code={c.config} label={c.label} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionHead({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="max-w-2xl">
      <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-emerald-deep">
        {eyebrow}
      </div>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        {title}
      </h2>
      {sub && <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">{sub}</p>}
    </div>
  );
}

function FlowNode({
  title,
  sub,
  mono,
}: {
  title: string;
  sub: string;
  mono?: string;
}) {
  return (
    <div className="w-full rounded-xl border border-hairline bg-white px-5 py-4 text-center shadow-[0_10px_30px_-22px_rgba(0,0,0,0.4)]">
      <div className="text-sm font-semibold text-ink">{title}</div>
      <div className="mt-1 text-[13px] text-ink-faint">{sub}</div>
      {mono && (
        <div className="mt-2 font-mono text-[11px] text-emerald-deep">{mono}</div>
      )}
    </div>
  );
}

function Connector() {
  return (
    <div className="flex items-center justify-center py-1 text-ink-faint lg:rotate-0">
      <Icon name="arrow" className="size-5 rotate-90 lg:rotate-0" />
    </div>
  );
}

function Architecture() {
  return (
    <section id="architecture" className="border-b border-hairline">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <SectionHead
          eyebrow="Architecture"
          title="Three boxes, one Ollama-shaped seam"
          sub="OpenClaw talks to any Ollama-compatible endpoint. The Harrier server stands in for Ollama, wrapping a local safetensors model over your markdown memory."
        />

        <div className="mt-12 grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
          <FlowNode
            title="OpenClaw agent"
            sub="memory_search tool · memorySearch cfg"
            mono="POST /api/embed"
          />
          <Connector />
          <FlowNode
            title="Harrier server"
            sub="sentence-transformers + torch (MPS)"
            mono={`:${PORT} · 0.6b safetensors`}
          />
          <Connector />
          <FlowNode
            title="Markdown memory"
            sub="MEMORY.md · memory/*.md"
            mono="chunk → embed → rank"
          />
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-hairline bg-canvas-soft p-6 sm:p-7">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Icon name="layers" className="size-4 text-emerald-deep" />
              Ollama-compatible surface
            </div>
            <div className="mt-5 overflow-hidden rounded-xl border border-hairline">
              <table className="w-full text-left text-sm">
                <thead className="bg-white text-[12px] uppercase tracking-wide text-ink-faint">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Method</th>
                    <th className="px-4 py-2.5 font-medium">Endpoint</th>
                    <th className="px-4 py-2.5 font-medium">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline bg-white">
                  {endpoints.map((e) => (
                    <tr key={e.path}>
                      <td className="px-4 py-2.5">
                        <span className="rounded bg-emerald/10 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-deep">
                          {e.method}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[12.5px] text-ink">
                        {e.path}
                      </td>
                      <td className="px-4 py-2.5 text-ink-soft">{e.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-hairline bg-canvas-soft p-6 sm:p-7">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Icon name="arrow" className="size-4 text-emerald-deep" />
              Retrieval flow
            </div>
            <ol className="mt-5 space-y-4">
              {[
                "OpenClaw chunks your markdown memory files.",
                "Each chunk is embedded once via /api/embed and cached.",
                "The query is embedded and compared by cosine similarity.",
                "Hybrid scoring adds lexical match, MMR, and temporal decay.",
              ].map((t, i) => (
                <li key={t} className="flex gap-3.5">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink font-mono text-[11px] font-semibold text-emerald">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-ink-soft">
                    {t}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-5 rounded-lg bg-white p-3 text-[13px] leading-relaxed text-ink-faint ring-1 ring-hairline">
              Vectors are L2-normalized server-side, so a dot product equals
              cosine similarity. Client ranking math stays trivial.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Setup() {
  return (
    <section id="setup" className="border-b border-hairline bg-canvas-soft">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <SectionHead
          eyebrow="Setup & validation"
          title="Run, prove, recall"
          sub="macOS / Apple Silicon quick start. Each step is a single command; the smoke test proves the layer is healthy before you trust recall."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <ol className="space-y-3">
            {setupSteps.map((s) => (
              <li
                key={s.step}
                className="group rounded-xl border border-hairline bg-white p-5 transition-colors hover:border-emerald/40"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[12px] font-semibold text-emerald-deep">
                    {s.step}
                  </span>
                  <span className="text-sm font-semibold text-ink">
                    {s.title}
                  </span>
                  <span className="ml-auto text-[12px] text-ink-faint">
                    {s.note}
                  </span>
                </div>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-terminal px-3.5 py-2.5 font-mono text-[12px] text-emerald">
                  <code>$ {s.command}</code>
                </pre>
              </li>
            ))}
          </ol>

          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-black/5 bg-terminal p-1 shadow-[0_24px_70px_-40px_rgba(0,0,0,0.6)]">
              <div className="flex items-center gap-2 px-3 py-2.5">
                <span className="size-2.5 rounded-full bg-[#ff5f57]" />
                <span className="size-2.5 rounded-full bg-[#febc2e]" />
                <span className="size-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-2 inline-flex items-center gap-1.5 font-mono text-[11px] text-white/40">
                  <Icon name="terminal" className="size-3.5" />
                  smoke_test.sh
                </span>
              </div>
              <pre className="overflow-x-auto px-4 pb-4 pt-1 font-mono text-[12px] leading-relaxed">
                {smokeTranscript.map((line, i) => (
                  <div
                    key={i}
                    className={
                      line.kind === "cmd"
                        ? "text-emerald"
                        : line.kind === "ok"
                          ? "text-white/85"
                          : line.kind === "pass"
                            ? "mt-1 font-semibold text-emerald"
                            : "text-white/45"
                    }
                  >
                    {line.kind === "cmd" ? `$ ${line.text}` : line.text}
                  </div>
                ))}
              </pre>
            </div>

            <RecallCard />
          </div>
        </div>
      </div>
    </section>
  );
}

function RecallCard() {
  return (
    <div className="rounded-xl border border-hairline bg-white p-5">
      <div className="flex items-center gap-2">
        <Icon name="search" className="size-4 text-emerald-deep" />
        <span className="text-sm font-semibold text-ink">Semantic recall</span>
        <span className="ml-auto font-mono text-[11px] text-ink-faint">
          query_index.py
        </span>
      </div>
      <div className="mt-3 rounded-lg bg-canvas-soft px-3 py-2 font-mono text-[12px] text-ink ring-1 ring-hairline">
        ? &quot;inconsistent glaze firing validation job&quot;
      </div>
      <div className="mt-4 space-y-2.5">
        {recallResults.map((r) => (
          <div
            key={r.file}
            className={[
              "rounded-lg border p-3",
              r.match
                ? "border-emerald/35 bg-emerald/5"
                : "border-hairline bg-canvas-soft opacity-75",
            ].join(" ")}
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-ink-faint">
                {r.file}
              </span>
              <span
                className={[
                  "ml-auto rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold",
                  r.match
                    ? "bg-emerald/15 text-emerald-deep"
                    : "bg-ink/5 text-ink-faint",
                ].join(" ")}
              >
                {r.score.toFixed(3)}
              </span>
            </div>
            <p className="mt-1.5 text-[13px] leading-snug text-ink-soft">
              {r.text}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-ink-faint">
        Concept recall: the kiln-calibration notes outrank the garden distractor
        even with zero shared keywords.
      </p>
    </div>
  );
}

function Features() {
  return (
    <section id="features" className="border-b border-hairline">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <SectionHead
          eyebrow="What you get"
          title="The wiring, packaged"
          sub="Embeddings and cosine similarity are not new. The reusable artifact here is the integration pattern, validated end to end."
        />
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group bg-white p-6 transition-colors hover:bg-canvas-soft sm:p-7"
            >
              <span className="grid size-10 place-items-center rounded-lg bg-ink text-emerald transition-transform group-hover:scale-105">
                <Icon name={f.icon} className="size-5" />
              </span>
              <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-ink">
                {f.title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
                {f.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-ink">
              Hybrid retrieval config
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
              The full configuration adds vector + lexical scoring, MMR for
              diversity, and temporal decay so recent memory ranks higher. Drop
              it under{" "}
              <code className="rounded bg-canvas-soft px-1.5 py-0.5 font-mono text-[13px] text-ink ring-1 ring-hairline-strong">
                agents.&lt;name&gt;
              </code>
              .
            </p>
            <ul className="mt-5 space-y-2.5">
              {[
                "vectorWeight 0.7 · textWeight 0.3",
                "MMR lambda 0.7 for result diversity",
                "temporal decay · 30-day half-life",
              ].map((b) => (
                <li
                  key={b}
                  className="flex items-center gap-2.5 text-sm text-ink-soft"
                >
                  <Icon
                    name="check"
                    className="size-4 shrink-0 text-emerald-deep"
                  />
                  <span className="font-mono text-[13px]">{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <CodeBlock code={hybridConfig} label="openclaw-config.full.jsonc" />
        </div>
      </div>
    </section>
  );
}

function Deploy() {
  const deployCmd = `# from repo root
cd site
npm ci
npm run build            # outputs site/dist (base = /harrier-openclaw-memory-search/)
npm run preview          # optional local check

# Deploy: push to main and let the bundled GitHub Pages
# workflow (.github/workflows/deploy-pages.yml) publish site/dist,
# or upload site/dist with the gh-pages tool of your choice.`;
  return (
    <section className="border-b border-hairline bg-ink text-white">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-emerald">
              Ship it
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              GitHub Pages ready
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-white/65">
              The Vite base path already matches the project repo. Build the
              static bundle and publish{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[13px] text-emerald">
                site/dist
              </code>{" "}
              with the included workflow. No extra architecture decisions
              required.
            </p>
          </div>
          <CodeBlock code={deployCmd} label="deploy" lang="bash" />
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-12 sm:flex-row sm:items-center sm:px-8">
        <div className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-md bg-ink text-emerald">
            <Icon name="search" className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-ink">
            Harrier × OpenClaw
          </span>
        </div>
        <p className="text-[13px] text-ink-faint sm:max-w-md">
          MIT-licensed integration pattern. Visual language inspired by modern
          developer-tool design; not affiliated with or endorsed by any third
          party.
        </p>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-hairline-strong px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink/30 sm:ml-auto"
        >
          <Icon name="github" className="size-4" />
          View source
        </a>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <main>
        <Hero />
        <Fork />
        <Architecture />
        <Setup />
        <Features />
        <Deploy />
      </main>
      <Footer />
    </div>
  );
}
