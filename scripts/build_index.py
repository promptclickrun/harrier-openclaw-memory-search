#!/usr/bin/env python3
"""
build_index.py -- build a semantic search index over markdown memory files.

This is a *standalone* demonstration index. OpenClaw's built-in memory-search
maintains its own index; this script exists so the repo can show the same
embedding pattern end-to-end without depending on OpenClaw implementation details.

It calls the running Harrier server (Ollama-compatible /api/embed) rather than
loading the model in-process, so you only need one place that owns the GPU.

Usage:
    python3 scripts/build_index.py --corpus examples/memory-corpus --out .index

Output (in --out):
    embeddings.npy   float32 matrix [n_chunks, dims]
    chunks.json      list of {file, chunk_idx, text}
    manifest.json    {files, chunks, dims, model, endpoint}
"""

import argparse
import json
import os
from pathlib import Path

import numpy as np

from harrier_client import embed_texts, DEFAULT_ENDPOINT


def chunk_markdown(text: str, max_chars: int = 4000):
    """Split a markdown document into chunks on level-2 headers."""
    sections = text.split("\n## ")
    chunks = []
    for i, section in enumerate(sections):
        if len(section.strip()) < 20:
            continue
        chunk_text = ("## " + section) if i > 0 else section
        chunks.append((i, chunk_text[:max_chars]))
    return chunks


def build(corpus_dir: str, out_dir: str, endpoint: str):
    corpus = Path(corpus_dir)
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)

    md_files = sorted(corpus.rglob("*.md"))
    chunks = []
    for f in md_files:
        text = f.read_text(errors="ignore")
        for idx, chunk_text in chunk_markdown(text):
            chunks.append({
                "file": str(f.relative_to(corpus)),
                "chunk_idx": idx,
                "text": chunk_text,
            })

    if not chunks:
        raise SystemExit(f"No markdown chunks found under {corpus_dir}")

    print(f"Indexing {len(chunks)} chunks from {len(md_files)} files via {endpoint} ...")
    embeddings = np.array(embed_texts([c["text"] for c in chunks], endpoint), dtype=np.float32)

    np.save(str(out / "embeddings.npy"), embeddings)
    (out / "chunks.json").write_text(json.dumps(chunks, indent=2))
    (out / "manifest.json").write_text(json.dumps({
        "files": len(md_files),
        "chunks": len(chunks),
        "dims": int(embeddings.shape[1]),
        "endpoint": endpoint,
    }, indent=2))
    print(f"Index built: {len(chunks)} chunks, {embeddings.shape[1]}d -> {out}")


if __name__ == "__main__":
    here = Path(__file__).resolve().parent.parent
    ap = argparse.ArgumentParser()
    ap.add_argument("--corpus", default=str(here / "examples" / "memory-corpus"))
    ap.add_argument("--out", default=str(here / ".index"))
    ap.add_argument("--endpoint", default=os.environ.get("HARRIER_ENDPOINT", DEFAULT_ENDPOINT))
    args = ap.parse_args()
    build(args.corpus, args.out, args.endpoint)
