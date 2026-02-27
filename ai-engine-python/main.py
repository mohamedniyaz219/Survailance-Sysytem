import cv2
import time
import threading
import requests
import queue
from ultralytics import YOLO

# --- CONFIGURATION ---
MODEL_PATH = "weights/CrowdYOLO26.pt" 
NODE_BASE_URL = "http://localhost:3000/api/v1"
API_KEY = "internal-secret-key" # Protect internal routes
CONFIDENCE_THRESHOLD = 0.5
PROCESS_EVERY_N_FRAMES = 5  # Process 1 out of 5 frames (Saves CPU)
DEFAULT_CAMERA_AREA_SQM = 50

# High Priority: Immediate Action
CRITICAL_CLASSES = [1, 2, 3, 4, 12] # Weapon, Fire, Fight, Panic, Suspicious Package
# Medium Priority: Warning
WARNING_CLASSES = [5, 7, 10] # Crowd, Running, Unusual Hand Gesture

class_names = {
    0: 'person', 1: 'weapon', 2: 'fire', 3: 'fight', 4: 'panic', 
    5: 'crowd', 6: 'Jumping', 7: 'Running-Behavior', 8: 'Sitting', 
    9: 'Standing', 10: 'Unusual Hand Gesture', 11: 'Walking', 
    12: 'suspicious package'
}

# Global Alert Cooldown Tracker {camera_id_class_id: timestamp}
alert_history = {}
ALERT_COOLDOWN = 10 # Seconds

def fetch_cameras():
    """Ask Node.js for the list of active cameras"""
    try:
        # You need to create this route in Node.js (see Step 2 below)
        url = f"{NODE_BASE_URL}/internal/cameras" 
        resp = requests.get(url, headers={"x-internal-key": API_KEY})
        if resp.status_code == 200:
            return resp.json() # Expecting [{"id": 1, "rtsp_url": "...", "tenant_code": "..."}]
    except Exception as e:
        print(f"❌ Failed to fetch cameras: {e}")
    return []

def send_alert(camera_id, tenant_code, class_name, conf, people_count=None, area_sqm=DEFAULT_CAMERA_AREA_SQM):
    """Send JSON payload to Node.js"""
    global alert_history
    
    # Unique key for cooldown (e.g., "1_weapon")
    alert_key = f"{camera_id}_{class_name}"
    current_time = time.time()
    
    if alert_key in alert_history and (current_time - alert_history[alert_key] < ALERT_COOLDOWN):
        return # Skip (Cooldown active)

    print(f"🚨 [Cam {camera_id}] ALERT: {class_name} ({conf:.2f})")
    
    try:
        payload = {
            "camera_id": camera_id,
            "type": class_name,
            "confidence": float(conf),
            "timestamp": current_time
        }
        if people_count is not None:
            payload["people_count"] = int(max(0, people_count))
            payload["area_sqm"] = float(area_sqm)
        # Send to backend
        requests.post(
            f"{NODE_BASE_URL}/ai/detect", 
            json=payload, 
            headers={'x-business-code': tenant_code}
        )
        alert_history[alert_key] = current_time
    except Exception as e:
        print(f"⚠️ Alert failed: {e}")

def process_stream(camera_info, model):
    """The Worker Function running in a separate thread"""
    rtsp_url = camera_info.get('rtsp_url')
    camera_id = camera_info.get('id')
    tenant_code = camera_info.get('business_code') # To know which tenant owns this cam

    print(f"🎥 Connecting to Cam {camera_id}...")
    cap = cv2.VideoCapture(rtsp_url)
    
    frame_count = 0

    while cap.isOpened():
        success, frame = cap.read()
        if not success:
            print(f"⚠️ Cam {camera_id} signal lost. Reconnecting in 5s...")
            time.sleep(5)
            cap = cv2.VideoCapture(rtsp_url) # Reconnect logic
            continue

        frame_count += 1
        # Skip frames to save resources
        if frame_count % PROCESS_EVERY_N_FRAMES != 0:
            continue

        # --- INFERENCE ---
        # verbose=False prevents console spam
        results = model(frame, verbose=False) 

        for r in results:
            boxes = r.boxes
            person_count = 0
            best_by_class = {}

            for box in boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])

                if conf < CONFIDENCE_THRESHOLD:
                    continue

                if cls_id == 0:
                    person_count += 1

                # Check Priority
                if cls_id in CRITICAL_CLASSES or cls_id in WARNING_CLASSES:
                    detected_name = class_names.get(cls_id, "Unknown")
                    if detected_name not in best_by_class or conf > best_by_class[detected_name]:
                        best_by_class[detected_name] = conf

            for detected_name, best_conf in best_by_class.items():
                send_alert(
                    camera_id,
                    tenant_code,
                    detected_name,
                    best_conf,
                    people_count=person_count,
                    area_sqm=DEFAULT_CAMERA_AREA_SQM
                )

    cap.release()
    print(f"🛑 Cam {camera_id} thread stopped.")

def main():
    print("🚀 Sentinel AI Engine Starting...")
    
    # 1. Load Model (Once, shared across threads)
    try:
        print(f"⚖️ Loading Weights: {MODEL_PATH}")
        model = YOLO(MODEL_PATH)
    except Exception as e:
        print(f"❌ Critical: Could not load model. {e}")
        return

    # 2. Get Cameras from Backend
    cameras = fetch_cameras()
    if not cameras:
        print("⚠️ No active cameras found in database.")
        # Optional: Add retry loop here
    
    # 3. Spawn Threads
    threads = []
    for cam in cameras:
        t = threading.Thread(target=process_stream, args=(cam, model))
        t.daemon = True # Kills thread if main program stops
        t.start()
        threads.append(t)
        print(f"✅ Started thread for Camera {cam['id']}")

    # 4. Keep Main Thread Alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Shutting down...")

if __name__ == '__main__':
    main()