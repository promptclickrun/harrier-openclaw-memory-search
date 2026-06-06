# Architecture

```
                 ┌──────────────────────────────────────────┐
                 │              OpenClaw agent                │
                 │                                            │
                 │   memory_search tool  /  memorySearch cfg  │
                 └───────────────┬────────────────────────────┘
                                 │  POST /api/embed
                                 │  (Ollama embedding API shape)
                                 ▼
                 ┌──────────────────────────────────────────┐
                 │        Harrier embedding server            │
                 │   server/harrier_server.py (this repo)     │
                 │                                            │
                 │   sentence-transformers + torch (MPS)      │
                 │   model: microsoft/harrier-oss-v1-0.6b     │
                 │   port: 18840                              │
                 └───────────────┬────────────────────────────┘
                                 │  1024-d normalized vectors
                                 ▼
                 ┌──────────────────────────────────────────┐
                 │        Searchable markdown memory          │
                 │   MEMORY.md, memory/YYYY-MM-DD.md, ...      │
                 │   chunked -> embedded -> ranked            │
                 └──────────────────────────────────────────┘
```

## Why this shape

OpenClaw's memory-search can use any **Ollama-compatible** embedding endpoint
(`provider: "ollama"`, a `baseUrl`, and a `model` name). Instead of running
Ollama, we run a ~200-line Python server that wraps a sentence-transformers
model and speaks just enough of the Ollama API:

| Endpoint            | Purpose                                  |
|---------------------|------------------------------------------|
| `POST /api/embed`   | batch embeddings (`{"embeddings":[...]}`) |
| `POST /api/embeddings` | single embedding (`{"embedding":[...]}`) |
| `GET /health`       | readiness + device + uptime              |
| `GET /api/tags`     | model discovery (Ollama list shape)      |
| `GET /api/version`  | version string                           |

## Retrieval flow

1. OpenClaw chunks your markdown memory files.
2. Each chunk is embedded once via `/api/embed` and cached.
3. At query time, the query string is embedded and compared (cosine) against
   the chunk vectors.
4. The full config adds **hybrid** scoring (vector + lexical), **MMR** for
   result diversity, and **temporal decay** so recent memory ranks higher.

Vectors are L2-normalized server-side, so a dot product equals cosine
similarity. That keeps the client ranking math trivial (see
`scripts/query_index.py`).

## What's "Harrier" here

`microsoft/harrier-oss-v1-0.6b` is a 0.6B-parameter embedding model distributed
in sentence-transformers / safetensors format (not GGUF). It produces 1024-d
embeddings. The name "harrier" is also what we advertise to OpenClaw as the
model id; the two are intentionally aligned for clarity.
