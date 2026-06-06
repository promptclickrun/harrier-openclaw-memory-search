# Setup: macOS / Apple Silicon (primary target)

This is the reference platform. The embedding model runs on the Metal (MPS)
backend, which is fast enough for interactive memory search on an M-series Mac.

## 1. Prerequisites

- macOS on Apple Silicon (M1 or newer)
- Python 3.9+ (`python3 --version`)
- ~2 GB free disk for the model weights

## 2. Install dependencies

```bash
cd harrier-openclaw-memory-search
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

The default `torch` wheel on macOS includes MPS support; no extra index URL is
needed.

## 3. Start the server

```bash
scripts/run_server.sh
# or, with explicit settings:
HARRIER_PORT=18840 HARRIER_DEVICE=mps python3 server/harrier_server.py
```

First start downloads `microsoft/harrier-oss-v1-0.6b` from HuggingFace and
loads it onto MPS (a few seconds on warm cache). You should see:

```
[harrier] Loading microsoft/harrier-oss-v1-0.6b on mps...
[harrier] Model loaded in 3.6s
[harrier] Serving on http://127.0.0.1:18840
```

## 4. Verify

```bash
scripts/smoke_test.sh
```

Expect `PASS: server healthy, 1024-d embeddings, batch shape correct`.

## 5. Keep it running (launchd)

```bash
cp launchd/com.example.harrier.plist ~/Library/LaunchAgents/
# edit the copy: replace __PYTHON__ and __REPO__ with absolute paths
launchctl load ~/Library/LaunchAgents/com.example.harrier.plist
```

`KeepAlive` relaunches the server after crashes and at login. To stop:

```bash
launchctl unload ~/Library/LaunchAgents/com.example.harrier.plist
```

## Troubleshooting

- **MPS not available**: pin CPU with `HARRIER_DEVICE=cpu` (slower but works).
- **Port already in use**: another process owns 18840. Set `HARRIER_PORT` and
  update your OpenClaw `baseUrl` to match.
- **Slow first request**: the model pre-loads at startup, but the very first
  encode warms Metal shaders. Subsequent calls are fast.
