export const REPO_URL =
  "https://github.com/promptclickrun/harrier-openclaw-memory-search";

export const PORT = "18840";

export type Feature = {
  title: string;
  body: string;
  icon: string;
};

export const features: Feature[] = [
  {
    title: "Local & private",
    body: "Embeddings are computed on your machine. No memory text, query, or vector ever leaves the host.",
    icon: "shield",
  },
  {
    title: "Markdown source of truth",
    body: "Long-term knowledge lives in plain .md files you can read, diff, and version. Semantic lookup layers on top.",
    icon: "doc",
  },
  {
    title: "Safetensors model",
    body: "Wrap sentence-transformers / safetensors models (e.g. microsoft/harrier-oss-v1-0.6b) that Ollama cannot pull natively.",
    icon: "chip",
  },
  {
    title: "launchd service",
    body: "A keep-alive macOS launchd template keeps the embedding server warm so recall is instant.",
    icon: "bolt",
  },
  {
    title: "Smoke tests",
    body: "A smoke script and pytest suite assert health plus 1024-d vector shape before you trust recall.",
    icon: "check",
  },
  {
    title: "Hybrid retrieval config",
    body: "Vector + lexical scoring, MMR diversity, and temporal decay so recent memory ranks higher.",
    icon: "layers",
  },
];

export type Endpoint = {
  method: string;
  path: string;
  purpose: string;
};

export const endpoints: Endpoint[] = [
  { method: "POST", path: "/api/embed", purpose: "batch embeddings" },
  { method: "POST", path: "/api/embeddings", purpose: "single embedding" },
  { method: "GET", path: "/health", purpose: "readiness + device + uptime" },
  { method: "GET", path: "/api/tags", purpose: "model discovery" },
  { method: "GET", path: "/api/version", purpose: "version string" },
];

export type SetupStep = {
  step: string;
  title: string;
  command: string;
  note: string;
};

export const setupSteps: SetupStep[] = [
  {
    step: "01",
    title: "Run the server",
    command: "scripts/run_server.sh",
    note: "Logs `Serving on …:18840`.",
  },
  {
    step: "02",
    title: "Smoke test",
    command: "scripts/smoke_test.sh",
    note: "Asserts health + vector shape.",
  },
  {
    step: "03",
    title: "Build the index",
    command: "python3 scripts/build_index.py",
    note: "Embeds the mock markdown corpus.",
  },
  {
    step: "04",
    title: "Query memory",
    command:
      'python3 scripts/query_index.py --query "the brittle vinyl disc digitization job"',
    note: "Ranks the corpus by concept, not keywords.",
  },
];

export const minimalConfig = `{
  "memorySearch": {
    "enabled": true,
    "provider": "ollama",
    "model": "harrier",
    "remote": { "baseUrl": "http://127.0.0.1:18840" },
    "cache": { "enabled": true }
  }
}`;

export const nativeOllamaConfig = `{
  "memorySearch": {
    "provider": "ollama",
    "model": "nomic-embed-text"
  }
}`;

export const hybridConfig = `{
  "memorySearch": {
    "provider": "ollama",
    "model": "harrier",
    "remote": { "baseUrl": "http://127.0.0.1:18840" },
    "query": {
      "hybrid": {
        "enabled": true,
        "vectorWeight": 0.7,
        "textWeight": 0.3,
        "mmr": { "enabled": true, "lambda": 0.7 },
        "temporalDecay": { "enabled": true, "halfLifeDays": 30 }
      }
    }
  }
}`;

export const smokeTranscript = [
  { kind: "cmd", text: "scripts/smoke_test.sh" },
  { kind: "out", text: "==> Harrier smoke test against http://127.0.0.1:18840" },
  { kind: "out", text: "--> GET /health" },
  { kind: "ok", text: '    {"status": "ok", "device": "mps", "uptime": 41.2}' },
  { kind: "out", text: "--> POST /api/embeddings (single)" },
  { kind: "ok", text: "    embedding dims: 1024" },
  { kind: "out", text: "--> POST /api/embed (batch of 2)" },
  { kind: "ok", text: "    vectors: 2, dims: 1024" },
  {
    kind: "pass",
    text: "==> PASS: server healthy, 1024-d embeddings, batch shape correct",
  },
];

export type RecallResult = {
  file: string;
  score: number;
  text: string;
  match: boolean;
};

export const recallResults: RecallResult[] = [
  {
    file: "memory/2026-02-20.md",
    score: 0.871,
    text: "Kiln calibration: glaze firing came out inconsistent at cone 6; re-ran the soak schedule and validated with test tiles.",
    match: true,
  },
  {
    file: "memory/2026-02-03.md",
    score: 0.804,
    text: "Logged the ceramic batch QA pass — surface defects traced to uneven thermocouple placement.",
    match: true,
  },
  {
    file: "MEMORY.md",
    score: 0.412,
    text: "Garden beds need mulch before the spring frost; ordered three yards of compost.",
    match: false,
  },
];
