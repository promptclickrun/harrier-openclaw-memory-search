# Sentence Transformers × OpenClaw: local semantic memory search

Give your [OpenClaw](https://docs.openclaw.ai) agent a **local semantic
memory**: searchable, private, and stored as plain markdown.

Important shortcut: OpenClaw already supports Ollama as a native
`memorySearch` embedding provider. If you just want local embeddings, the
fastest supported path is usually to run Ollama, pull `nomic-embed-text`, set
`memorySearch.provider` to `"ollama"`, and rebuild your memory index.

This repo is for the sentence-transformers / safetensors path: it shows how to
wrap a local embedding model behind an Ollama-compatible HTTP API, then package
the OpenClaw config, launchd service, smoke tests, and demo corpus around it.
The included example model is Microsoft's `microsoft/harrier-oss-v1-0.6b`.

![Local agent memory architecture](docs/assets/agent-memory/local-agent-memory-architecture.png)

```
OpenClaw memory_search  ──►  ST/safetensors embedding server  ──►  markdown memory files
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

## If you just want local OpenClaw embeddings

Use OpenClaw's native Ollama support first. For most people, this is the boring
15-minute path:

```bash
ollama pull nomic-embed-text
# then set memorySearch.provider to "ollama" and rebuild the index
openclaw memory index --force
```

A minimal OpenClaw config looks like this:

```jsonc
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "provider": "ollama",
        "model": "nomic-embed-text"
      }
    }
  }
}
```

If Ollama is on another machine, set `memorySearch.remote.baseUrl` to that host,
for example `http://gpu-box.local:11434`. OpenClaw also supports custom provider
ids that use `api: "ollama"` when you want memory embeddings routed to a
dedicated Ollama endpoint.

![Native Ollama vs sentence-transformers bridge](docs/assets/agent-memory/native-ollama-vs-bridge.png)

## Why this repo still exists

Many useful embedding models are distributed as sentence-transformers /
safetensors packages rather than normal `ollama pull ...` models. This repo
turns that kind of local model into the Ollama-compatible embedding endpoint
that OpenClaw already knows how to call.

Use this repo if you want one of these specifically:

- **Sentence-transformers / safetensors embeddings.** Run local embedding
  models that are not available through normal Ollama model pulls while keeping
  OpenClaw configured through the Ollama memory-search adapter.
- **A concrete Harrier example.** The bundled config uses
  `microsoft/harrier-oss-v1-0.6b`, but the pattern is model-agnostic.
- **A minimal shim pattern.** Adapt the ~200-line server for another local
  embedding model with the same style of Python loading path.
- **Packaged validation and ops.** Reuse the launchd template, config examples,
  smoke tests, and mock corpus instead of assembling those pieces from scratch.
- **Plain markdown memory.** Keep long-term knowledge in `.md` files you can
  read, diff, and version, with semantic lookup layered on top.

## What's actually reusable here

Embeddings and cosine similarity are not new. Sentence-transformers has done
this for years, so if you're looking for a novel retrieval algorithm, this is
the wrong repo.

What is worth borrowing is the integration pattern:

- A minimal Ollama-API shim for sentence-transformers / safetensors embedding
  models that OpenClaw cannot pull through native Ollama.
- A keep-alive service template you can adapt to your own machine.
- A hybrid retrieval config with lexical matching, MMR, and temporal decay tuned
  for agent memory.
- A smoke-test path that proves the layer is healthy before you trust recall.

The useful artifact here is the wiring: local sentence-transformers model,
plain markdown memory, OpenClaw config, launchd service, and validation steps
packaged together.

## Embedding server quick start (macOS / Apple Silicon)

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

## Wire the embedding server into OpenClaw

For the native Ollama shortcut, use the config in the section above. For this
sentence-transformers shim, merge a `memorySearch` block into your agent config
(`agents.<name>` in `openclaw.json`). The default example model is Harrier, so
the minimal version uses `model: "harrier"`:

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
4. **Configure OpenClaw**: add the shim `memorySearch` block, restart the gateway.
5. **Run memory_search**: ask the agent to recall a concept; expected result
   shape is a ranked list of `{file, chunk, score, text}` entries, highest
   cosine similarity first.
6. **Demo recall locally** (no OpenClaw needed):
   `python3 scripts/query_index.py --query "inconsistent glaze firing validation job"`
   ranks the mock corpus and should surface the ceramic-kiln calibration notes
   above the unrelated garden/car distractor entries, showing concept recall
   rather than keyword match.

![Semantic recall demo results](docs/assets/agent-memory/semantic-recall-demo-results.png)

## Repository layout

```
README.md
pyproject.toml / requirements.txt
server/harrier_server.py        # Ollama-compatible ST/safetensors embedding server
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
