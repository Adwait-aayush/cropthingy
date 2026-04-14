# Trained Models Folder

This folder contains the trained irrigation model, scaler, API app, and notebook used for training/testing.

## Files

- `app.py`: Flask API for irrigation prediction.
- `irrigation_model.keras`: Trained Keras model.
- `scaler.pkl`: Feature scaler used during training.
- `model.ipynb`: Training and evaluation notebook.
- `dataset/`: Training dataset files.
- `req.txt`: Python packages needed for this folder.

## Setup

1. Open terminal in this folder:

   ```powershell
   cd backend/trained_models
   ```

2. Install dependencies:

   ```powershell
   pip install -r req.txt
   ```

## Run API

```powershell
python app.py
```

The API starts on:

- `http://127.0.0.1:5000`
- Swagger docs: `http://127.0.0.1:5000/apidocs/`

## Test Prediction Endpoint

Use this PowerShell command in a second terminal:

```powershell
$body = @{
  temp = 30
  humidity = 60
  soil = 450
  crop = "wheat"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:5000/predict" -ContentType "application/json" -Body $body
```

Expected response format:

```json
{"irrigation": 0}
```
or
```json
{"irrigation": 1}
```

## Input Notes

- `soil` should be raw sensor value in range `0-1023`.
- `crop` must be one of: `rice`, `wheat`, `maize`, `vegetables`, `pulses`.

## Troubleshooting

- If model load fails, ensure `irrigation_model.keras` and `scaler.pkl` are in this folder.
- If crop key error occurs, check spelling/case of crop name.
- If package errors occur, run `pip install -r req.txt` again.
