#!/usr/bin/env python3
"""
Harrier Embedding Server -- an Ollama-compatible API wrapper for a
sentence-transformers embedding model (default: microsoft/harrier-oss-v1-0.6b).

It exposes the small subset of the Ollama HTTP API that OpenClaw's
memory-search layer needs:

    POST /api/embed        (batch, Ollama "embeddings" response shape)
    POST /api/embeddings   (single, Ollama "embedding" response shape)
    GET  /health           (readiness + model load status)
    GET  /api/tags         (Ollama model list, so clients can discover "harrier")
    GET  /api/version      (version string)

Because OpenClaw can talk to any Ollama-compatible embedding endpoint, this
wrapper lets a local sentence-transformers model stand in for Ollama with no
external embedding service required.

Configuration is via environment variables (all optional):

    HARRIER_MODEL   HuggingFace model id      (default: microsoft/harrier-oss-v1-0.6b)
    HARRIER_PORT    listen port               (default: 18840)
    HARRIER_HOST    bind address              (default: 127.0.0.1)
    HARRIER_DEVICE  torch device              (default: auto -> mps/cuda/cpu)
    HARRIER_CACHE   model cache folder        (default: HF default cache)
    HARRIER_NAME    advertised model name     (default: harrier)
    HARRIER_TRUST_REMOTE_CODE  "1" to enable  (default: 0)

This wrapper intentionally avoids hard-coded local paths and machine-specific
assumptions. Configure deployment details with environment variables.

License: MIT (this wrapper). The embedding model is downloaded separately and
is subject to its own upstream license.
"""

import json
import os
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
from threading import Lock

# Keep tokenizer logging quiet; must be set before importing transformers.
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

MODEL_NAME = os.environ.get("HARRIER_MODEL", "microsoft/harrier-oss-v1-0.6b")
ADVERTISED_NAME = os.environ.get("HARRIER_NAME", "harrier")
PORT = int(os.environ.get("HARRIER_PORT", "18840"))
HOST = os.environ.get("HARRIER_HOST", "127.0.0.1")
CACHE_DIR = os.environ.get("HARRIER_CACHE") or None
TRUST_REMOTE_CODE = os.environ.get("HARRIER_TRUST_REMOTE_CODE", "0") == "1"

_model = None
_lock = Lock()
_start_time = time.time()


def _resolve_device():
    """Pick the best available torch device unless one is pinned via env."""
    pinned = os.environ.get("HARRIER_DEVICE")
    if pinned:
        return pinned
    try:
        import torch

        if torch.backends.mps.is_available():
            return "mps"  # Apple Silicon Metal
        if torch.cuda.is_available():
            return "cuda"
    except Exception:
        pass
    return "cpu"


DEVICE = _resolve_device()


def get_model():
    """Lazily load the embedding model once, thread-safely."""
    global _model
    if _model is None:
        with _lock:
            if _model is None:
                from sentence_transformers import SentenceTransformer

                print(f"[harrier] Loading {MODEL_NAME} on {DEVICE}...", flush=True)
                t0 = time.time()
                kwargs = {"device": DEVICE}
                if CACHE_DIR:
                    kwargs["cache_folder"] = CACHE_DIR
                if TRUST_REMOTE_CODE:
                    kwargs["trust_remote_code"] = True
                _model = SentenceTransformer(MODEL_NAME, **kwargs)
                print(f"[harrier] Model loaded in {time.time() - t0:.1f}s", flush=True)
    return _model


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):  # noqa: A003 - match BaseHTTPRequestHandler
        # Quiet by default; only log lines that look like errors.
        if args and "error" in str(args[0]).lower():
            super().log_message(fmt, *args)

    def _send_json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):  # noqa: N802 - http.server API
        if self.path == "/health":
            try:
                ok = get_model() is not None
            except Exception as e:  # pragma: no cover - exercised on bad model
                self._send_json(503, {
                    "status": "error",
                    "model": ADVERTISED_NAME,
                    "error": str(e),
                    "uptime_seconds": round(time.time() - _start_time, 1),
                })
                return
            self._send_json(200 if ok else 503, {
                "status": "ok" if ok else "degraded",
                "model": ADVERTISED_NAME,
                "model_loaded": ok,
                "device": DEVICE,
                "uptime_seconds": round(time.time() - _start_time, 1),
            })
        elif self.path in ("/", "/api/version"):
            self._send_json(200, {"version": "harrier-bridge-1.0"})
        elif self.path == "/api/tags":
            # Minimal Ollama model-list shape so clients can discover the model.
            self._send_json(200, {
                "models": [{
                    "name": ADVERTISED_NAME,
                    "model": ADVERTISED_NAME,
                    "size": 600_000_000,
                    "details": {
                        "family": "harrier",
                        "parameter_size": "0.6B",
                        "quantization_level": "fp32",
                    },
                }]
            })
        else:
            self._send_json(404, {"error": "not found"})

    def do_POST(self):  # noqa: N802 - http.server API
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len) if content_len else b""

        if self.path not in ("/api/embed", "/api/embeddings"):
            self._send_json(404, {"error": "not found"})
            return

        try:
            req = json.loads(body) if body else {}
            # Ollama accepts {"input": "text"} or {"input": [...]} or {"prompt": "text"}.
            texts = req.get("input", [])
            if isinstance(texts, str):
                texts = [texts]
            if not texts:
                prompt = req.get("prompt", "")
                if prompt:
                    texts = [prompt]
            if not texts:
                self._send_json(400, {"error": "no input text provided"})
                return

            model = get_model()
            embeddings = model.encode(texts, normalize_embeddings=True)

            try:
                emb_list = embeddings.tolist()
            except AttributeError:
                emb_list = [e.tolist() for e in embeddings]

            # /api/embeddings (legacy single) returns {"embedding": [...]}.
            # /api/embed (batch) returns {"embeddings": [[...], ...]}.
            if self.path == "/api/embeddings" and len(emb_list) == 1:
                self._send_json(200, {"model": ADVERTISED_NAME, "embedding": emb_list[0]})
            else:
                self._send_json(200, {"model": ADVERTISED_NAME, "embeddings": emb_list})
        except Exception as e:  # pragma: no cover - defensive
            print(f"[harrier] Error: {e}", flush=True)
            self._send_json(500, {"error": str(e)})


class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True


def main():
    get_model()  # pre-load so the first request is fast
    server = ThreadedHTTPServer((HOST, PORT), Handler)
    print(f"[harrier] Serving on http://{HOST}:{PORT}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("[harrier] Shutting down", flush=True)
        server.shutdown()


if __name__ == "__main__":
    main()
