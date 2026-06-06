# Setup: other platforms

The server is plain Python + sentence-transformers, so it runs anywhere PyTorch
runs. Only the acceleration backend differs.

## Linux + NVIDIA (CUDA)

```bash
# Install the CUDA build of torch per https://pytorch.org/get-started/locally/
pip install torch --index-url https://download.pytorch.org/whl/cu121
pip install sentence-transformers numpy
HARRIER_DEVICE=cuda python3 server/harrier_server.py
```

Device auto-detection already prefers CUDA when available, so `HARRIER_DEVICE`
is optional.

## Linux / Windows CPU-only

```bash
pip install -r requirements.txt
HARRIER_DEVICE=cpu python3 server/harrier_server.py
```

CPU works for small/occasional workloads. A 0.6B embedding model on CPU is
noticeably slower per batch but fine for a personal memory index.

## Keeping it running off macOS

There is no launchd outside macOS. Equivalent options:

- **systemd (Linux)**: a unit with `Restart=always` running
  `python3 server/harrier_server.py`, with `Environment=HARRIER_PORT=18840`.
- **Windows**: Task Scheduler "at logon" task, or NSSM to run it as a service.
- **Docker**: any base image with Python + torch; expose the port and set the
  `HARRIER_*` env vars. (No Dockerfile is shipped here to keep the repo minimal;
  the server is a single file.)

## Model notes

The model is `sentence-transformers` / safetensors format, **not GGUF**. It is
loaded by sentence-transformers directly, not by Ollama or llama.cpp. The
"Ollama compatibility" in this repo is only the HTTP API shape, so OpenClaw can
talk to it as if it were Ollama.
