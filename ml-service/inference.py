"""
AI Surveillance System - Inference Service
Runs the detection loop using YOLO models for fire and weapon detection
"""

import cv2
from ultralytics import YOLO
import time
import requests

# Load models
fire_model = YOLO('weights/fire.pt')
weapon_model = YOLO('weights/weapon.pt')

def process_frame(frame):
    """
    Process a single frame for fire and weapon detection
    """
    # Fire detection
    fire_results = fire_model(frame)
    
    # Weapon detection
    weapon_results = weapon_model(frame)
    
    return {
        'fire_detected': len(fire_results[0].boxes) > 0,
        'weapon_detected': len(weapon_results[0].boxes) > 0,
        'fire_boxes': fire_results[0].boxes,
        'weapon_boxes': weapon_results[0].boxes
    }

def send_alert(detection_data):
    """
    Send detection alert to backend service
    """
    try:
        response = requests.post(
            'http://localhost:3000/api/alerts',
            json=detection_data
        )
        return response.status_code == 200
    except Exception as e:
        print(f"Error sending alert: {e}")
        return False

if __name__ == "__main__":
    print("AI Surveillance System - Starting inference service...")
    # Add your video stream processing logic here
