# Harrier × OpenClaw: local semantic memory search

Stand up a **local-first semantic memory-search layer** for an
[OpenClaw](https://docs.openclaw.ai) agent, backed by a small embedding model
served over an Ollama-compatible HTTP API. No external embedding service, no
data leaving the machine, and your agent's memory stays in plain searchable
markdown files.

```
OpenClaw memory_search  ──►  Harrier embedding server  ──►  markdown memory files
   (memorySearch cfg)         (this repo, port 18840)        (MEMORY.md, memory/*.md)
```

## What this is

- A ~200-line Python **embedding server** (`server/harrier_server.py`) that
  wraps `microsoft/harrier-oss-v1-0.6b` (sentence-transformers / safetensors,
  **not GGUF**) and exposes the Ollama embedding API (`/api/embed`,
  `/api/embeddings`, `/health`, `/api/tags`).
- The **OpenClaw config** that points `memorySearch` at it
  (`examples/openclaw-config.*`).
- A **launchd template** to keep it running on macOS.
- A **mock memory corpus** and **query demo** that show semantic concept recall.
- A **smoke script** and **pytest** suite that confirm the vector output shape.

## Why it's useful

OpenClaw can use any Ollama-compatible embedding endpoint for memory search.
Rather than installing Ollama, this repo runs one tiny server that turns a local
sentence-transformers model into that endpoint. The result:

- **Local-first**: embeddings computed on your Mac's GPU (MPS), nothing sent to
  a hosted embedding API.
- **Markdown-native**: your agent's long-term memory stays as readable,
  diffable `.md` files instead of an opaque vector store.
- **Repeatable ops**: one launchd service, one config block, one smoke test.

## Showcase angle (honest version)

Embeddings and semantic search are **not novel** — sentence-transformers has
done cosine similarity over text for years. The valuable, reusable part here is
the **practical OpenClaw integration and the repeatable operational pattern**:

- a minimal Ollama-API shim so OpenClaw "just works" with a local model,
- a keep-alive service template,
- a hybrid + temporal-decay retrieval config tuned for agent memory,
- a smoke test so you know the layer is healthy before you trust recall.

In other words: the wiring and the ops are the product, not the math.

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
