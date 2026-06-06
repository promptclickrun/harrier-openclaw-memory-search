# Harrier × OpenClaw: local semantic memory search

Give your [OpenClaw](https://docs.openclaw.ai) agent a **local semantic
memory**: searchable, private, and stored as plain markdown. This repo runs a
small embedding model behind an Ollama-compatible HTTP API so your agent can
recall context without sending anything off-machine.

```
OpenClaw memory_search  ──►  Harrier embedding server  ──►  markdown memory files
   (memorySearch cfg)         (this repo, port 18840)        (MEMORY.md, memory/*.md)
```

## What this is

- A ~200-line Python **embedding server** (`server/harrier_server.py`) wrapping
  `microsoft/harrier-oss-v1-0.6b` (sentence-transformers / safetensors, **not
  GGUF**) behind the Ollama embedding API (`/api/embed`, `/api/embeddings`,
  `/health`, `/api/tags`).
- The **OpenClaw config** that points `memorySearch` at it
  (`examples/openclaw-config.*`).
- A **launchd template** to keep it running on macOS.
- A **mock memory corpus** and **query demo** that show semantic concept recall.
- A **smoke script** and **pytest** suite that confirm the vector output shape.

## Why it's useful

OpenClaw already knows how to talk to any Ollama-compatible embedding endpoint
for memory search. So instead of installing full Ollama, you can run one small
server that turns a local sentence-transformers model into that endpoint. That's
the whole trick.

What you get out of it:

- **Your data stays local.** Embeddings are computed on your Mac's GPU (MPS),
  and nothing leaves the machine.
- **Memory stays readable.** Your agent's long-term knowledge lives in `.md`
  files you can read, diff, and version instead of an opaque vector store.
- **The ops are boring on purpose.** One launchd service, one config block, one
  smoke test. If it breaks, you'll know.

## What's actually reusable here

Embeddings and cosine similarity are not new. Sentence-transformers has done
this for years, so if you're looking for a novel retrieval algorithm, this is
the wrong repo.

What is worth borrowing is the integration pattern:

- A minimal Ollama-API shim so OpenClaw's `memory_search` works with any local
  model out of the box.
- A keep-alive service template you can adapt to your own machine.
- A hybrid retrieval config with lexical matching, MMR, and temporal decay tuned
  for agent memory.
- A smoke-test path that proves the layer is healthy before you trust recall.

The useful artifact here is the wiring: local model, plain markdown memory,
OpenClaw config, launchd service, and validation steps packaged together.

## Quick start (macOS / Apple Silicon)

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 1. start the embedding server
scripts/run_server.sh

# 2. verify it returns vectors
scripts/smoke_test.sh
#    -> PASS: server healthy, 1024-d embeddings, batch shape correct

# 3. build a demo index over the mock memory corpus and query it
python3 scripts/build_index.py
python3 scripts/query_index.py --query "the brittle vinyl disc digitization job"
```

Full platform notes: [`docs/setup-macos.md`](docs/setup-macos.md) and
[`docs/setup-other-platforms.md`](docs/setup-other-platforms.md).
Architecture: [`docs/architecture.md`](docs/architecture.md).

## Wire it into OpenClaw

Merge a `memorySearch` block into your agent config (`agents.<name>` in
`openclaw.json`). Minimal version:

```json
{
  "memorySearch": {
    "enabled": true,
    "provider": "ollama",
    "model": "harrier",
    "remote": { "baseUrl": "http://127.0.0.1:18840" },
    "cache": { "enabled": true }
  }
}
```

The full hybrid configuration (vector + lexical, MMR, temporal decay) is in
[`examples/openclaw-config.full.jsonc`](examples/openclaw-config.full.jsonc).
After editing config, restart your OpenClaw gateway per your normal procedure so
it picks up the new `memorySearch` settings, then call the `memory_search` tool.

## Validation steps

1. **Start the server**: `scripts/run_server.sh` (logs `Serving on ...:18840`).
2. **Hit the endpoint**:
   ```bash
   curl -s http://127.0.0.1:18840/api/embeddings \
     -d '{"model":"harrier","prompt":"hello world"}' | head -c 120
   ```
   Expected shape: `{"model":"harrier","embedding":[0.0094, -0.0628, ...]}` —
   a 1024-element float array.
3. **Smoke test**: `scripts/smoke_test.sh` (asserts health + vector shape).
4. **Configure OpenClaw**: add the `memorySearch` block, restart the gateway.
5. **Run memory_search**: ask the agent to recall a concept; expected result
   shape is a ranked list of `{file, chunk, score, text}` entries, highest
   cosine similarity first.
6. **Demo recall locally** (no OpenClaw needed):
   `python3 scripts/query_index.py --query "inconsistent glaze firing validation job"`
   ranks the mock corpus and should surface the ceramic-kiln calibration notes
   above the unrelated garden/car distractor entries, showing concept recall
   rather than keyword match.

## Repository layout

```
README.md
pyproject.toml / requirements.txt
server/harrier_server.py        # Ollama-compatible embedding server
scripts/
  run_server.sh                 # launcher
  smoke_test.sh                 # health + vector-shape check
  harrier_client.py             # stdlib HTTP client
  build_index.py                # demo: embed a markdown corpus
  query_index.py                # demo: semantic query over the index
examples/
  openclaw-config.minimal.json  # minimal memorySearch block
  openclaw-config.full.jsonc    # hybrid + temporal-decay config
  memory-corpus/                # harmless mock memory (no PII)
docs/
  setup-macos.md  setup-other-platforms.md  architecture.md
launchd/com.example.harrier.plist
tests/test_smoke.py
```

## Provenance & licensing

The server is a small Ollama-compatible wrapper around a local sentence-transformers
embedding model. Configuration uses `HARRIER_*` environment variables so the
same pattern can run on different machines without hard-coded paths. This
repository's code is MIT-licensed (see `LICENSE`). The embedding model
`microsoft/harrier-oss-v1-0.6b` is downloaded separately from HuggingFace and is
governed by its own upstream license. **No secrets, credentials, or sensitive
source data is included**; the example corpus is fictional.

## Notes

- Do not commit secrets, model caches, generated indexes, or deployment-specific data.
- The model cache and any generated `.index/` are git-ignored.
- Apple Silicon (MPS) is the primary target; CUDA and CPU are supported.
