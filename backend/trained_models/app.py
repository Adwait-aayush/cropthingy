from flask import Flask, request, jsonify
from flasgger import Swagger
import numpy as np
import pickle

from tensorflow.keras.models import load_model

app = Flask(__name__)
Swagger(app)

# Load model + scaler
model = load_model("irrigation_model.keras")

with open("scaler.pkl", "rb") as f:
    scaler = pickle.load(f)

crop_map = {"rice":0, "wheat":1, "maize":2, "vegetables":3, "pulses":4}

@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict irrigation
    ---
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            temp:
              type: number
            humidity:
              type: number
            soil:
              type: number
            crop:
              type: string
    responses:
      200:
        description: Prediction result
    """
    data = request.json
    
    temp = data['temp']
    humidity = data['humidity']
    soil_raw = data['soil']   # from sensor (0–1023)
    crop = crop_map[data['crop']]
    
    # Convert soil same as training
    soil = 1 - (soil_raw / 1023)
    
    input_data = np.array([[temp, humidity, soil, crop]])
    input_scaled = scaler.transform(input_data)
    
    pred = model.predict(input_scaled)
    
    result = int(pred[0][0] > 0.5)
    
    return jsonify({"irrigation": result})

if __name__ == '__main__':
    app.run(debug=True)