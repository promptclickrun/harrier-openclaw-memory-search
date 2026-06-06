#!/usr/bin/env python3
"""
query_index.py -- semantic query against an index built by build_index.py.

Usage:
    python3 scripts/query_index.py --query "who handled the vinyl restoration job"
"""

import argparse
import json
import os
from pathlib import Path

import numpy as np

from harrier_client import embed_texts, DEFAULT_ENDPOINT


def query(query_text: str, index_dir: str, endpoint: str, top_k: int = 5):
    index_path = Path(index_dir)
    embeddings = np.load(str(index_path / "embeddings.npy"))
    chunks = json.loads((index_path / "chunks.json").read_text())

    q = np.array(embed_texts([query_text], endpoint), dtype=np.float32)
    # Vectors are L2-normalized by the server, so dot product == cosine similarity.
    scores = np.dot(embeddings, q.T).flatten()
    top = np.argsort(scores)[::-1][:top_k]
    return [{**chunks[i], "score": round(float(scores[i]), 4)} for i in top]


if __name__ == "__main__":
    here = Path(__file__).resolve().parent.parent
    ap = argparse.ArgumentParser()
    ap.add_argument("--query", required=True)
    ap.add_argument("--top-k", type=int, default=5)
    ap.add_argument("--index-dir", default=str(here / ".index"))
    ap.add_argument("--endpoint", default=os.environ.get("HARRIER_ENDPOINT", DEFAULT_ENDPOINT))
    ap.add_argument("--json", action="store_true", help="emit raw JSON results")
    args = ap.parse_args()

    results = query(args.query, args.index_dir, args.endpoint, args.top_k)
    if args.json:
        print(json.dumps(results, indent=2))
    else:
        for r in results:
            print(f"[{r['score']:.3f}] {r.get('file', 'unknown')} (chunk {r.get('chunk_idx', '?')})")
            print(f"  {r['text'][:200].strip()}...")
            print()
