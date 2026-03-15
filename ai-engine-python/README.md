# AI Engine – Python YOLO Inference

## Overview

This component polls active cameras, runs YOLO (Ultralytics) inference, and posts detections to `server/src/controllers/alertSystemController.js` via `POST /api/v1/ai/detect`. The inference pipeline lives in `src`, and the pretrained weights are in `weights/CrowdYOLO26.pt`.

## Status

- Uses Ultralytics/YOLOv8-style logic with helper modules such as `backend_connector.py`, `inference_pipeline.py`, and `tracker.py`.
- The main entrypoint is `main.py`, which loads configuration and continuously posts detection batches to the API.

## Prerequisites

- Python 3.11+ and pip.
- Network access to the backend API (`/api/v1/ai/detect`).

## Setup steps

1. Create and activate a virtual environment inside `ai-engine-python`:
   ```bash
   cd ai-engine-python
   python3 -m venv .venv
   source .venv/bin/activate
   ```
2. Upgrade pip and install dependencies:
   ```bash
   python -m pip install --upgrade pip
   python -m pip install -r requirements.txt
   ```
3. Ensure the YOLO weights are present at `weights/CrowdYOLO26.pt` (git tracked).

## Running the engine

Launch the inference loop:

```bash
python -u main.py
```

Use `PYTHONPATH=src` or similar if you customize module imports. The engine reads cameras and other metadata from the backend, so it requires API credentials or a valid session depending on how `backend_connector.py` is configured.

## Notes

- If the backend API requires extra headers or auth, update `src/backend_connector.py` before running.
- The `training/` directory hosts dataset helpers and custom training scripts; it is not required for inference but useful if retraining weights.