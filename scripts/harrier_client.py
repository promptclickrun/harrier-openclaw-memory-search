#!/usr/bin/env python3
"""
harrier_client.py -- tiny stdlib HTTP client for the Harrier embedding server.

No third-party HTTP dependency: uses urllib so scripts stay dependency-light.
"""

import json
import urllib.request

DEFAULT_ENDPOINT = "http://127.0.0.1:18840"


def embed_texts(texts, endpoint=DEFAULT_ENDPOINT, model="harrier", timeout=120):
    """Return a list of embedding vectors for `texts` via /api/embed."""
    if isinstance(texts, str):
        texts = [texts]
    payload = json.dumps({"model": model, "input": texts}).encode()
    req = urllib.request.Request(
        f"{endpoint.rstrip('/')}/api/embed",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        data = json.loads(resp.read())
    if "embeddings" in data:
        return data["embeddings"]
    if "embedding" in data:
        return [data["embedding"]]
    raise ValueError(f"Unexpected response shape: {list(data)}")
