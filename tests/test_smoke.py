"""
test_smoke.py -- pytest smoke test for the Harrier embedding endpoint.

Skips automatically if no server is reachable, so CI without a GPU/model does
not fail. Run a server first (scripts/run_server.sh) to exercise it:

    pytest -q

Override the endpoint with HARRIER_ENDPOINT.
"""

import json
import os
import sys
import urllib.error
import urllib.request

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

ENDPOINT = os.environ.get("HARRIER_ENDPOINT", "http://127.0.0.1:18840")


def _server_up():
    try:
        with urllib.request.urlopen(f"{ENDPOINT}/health", timeout=3) as r:
            return json.loads(r.read()).get("status") == "ok"
    except (urllib.error.URLError, OSError, ValueError):
        return False


requires_server = pytest.mark.skipif(
    not _server_up(), reason=f"Harrier server not reachable at {ENDPOINT}"
)


@requires_server
def test_health_ok():
    with urllib.request.urlopen(f"{ENDPOINT}/health", timeout=5) as r:
        body = json.loads(r.read())
    assert body["status"] == "ok"
    assert body["model_loaded"] is True


@requires_server
def test_single_embedding_shape():
    from harrier_client import embed_texts

    vecs = embed_texts(["the quick brown fox"], ENDPOINT)
    assert len(vecs) == 1
    assert len(vecs[0]) > 0
    assert all(isinstance(x, float) for x in vecs[0][:5])


@requires_server
def test_batch_embedding_shape_consistent():
    from harrier_client import embed_texts

    vecs = embed_texts(["alpha", "beta", "gamma"], ENDPOINT)
    assert len(vecs) == 3
    dims = {len(v) for v in vecs}
    assert len(dims) == 1  # all vectors same dimensionality


@requires_server
def test_semantic_ranking():
    """A relevant query should outrank an unrelated sentence."""
    import numpy as np
    from harrier_client import embed_texts

    corpus = [
        "ceramic kiln temperature probe calibration and variance report",
        "drip irrigation timer for the tomato garden",
    ]
    cvecs = np.array(embed_texts(corpus, ENDPOINT))
    qvec = np.array(embed_texts(["inconsistent glaze firing validation job"], ENDPOINT))
    scores = cvecs @ qvec.T
    assert scores[0] > scores[1]  # calibration entry wins
