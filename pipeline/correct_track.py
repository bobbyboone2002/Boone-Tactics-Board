import json
import cv2
import numpy as np
import os
import sys

FRAMES_DIR = "frames"
CALIBRATION_PATH = "FULvsCHE-20260824_calibration.json"
TRACKING_PATH = "tracking.json"
BOX_SIZE = 30
MAX_JUMP_PIXELS = 80

if len(sys.argv) != 3:
    print("Usage: python3 correct_track.py <label> <frame_index>")
    sys.exit(1)

label = sys.argv[1]
start_frame_idx = int(sys.argv[2])

with open(CALIBRATION_PATH) as f:
    cal_data = json.load(f)
matrix = np.array(cal_data["calibrations"][0]["matrix"]).reshape(3, 3)
inv_matrix = np.linalg.inv(matrix)

def pixel_to_meters(px, py):
    vec = np.array([px, py, 1.0])
    result = inv_matrix @ vec
    result = result / result[2]
    return float(result[0]), float(result[1])

with open(TRACKING_PATH) as f:
    tracking_data = json.load(f)

frame_files = sorted(os.listdir(FRAMES_DIR))
frame = cv2.imread(f"{FRAMES_DIR}/{frame_files[start_frame_idx]}")

clicked = {}

def on_click(event, x, y, flags, param):
    if event == cv2.EVENT_LBUTTONDOWN:
        clicked["x"], clicked["y"] = x, y
        cv2.destroyAllWindows()

cv2.imshow(f"Click the correct position for {label}", frame)
cv2.setMouseCallback(f"Click the correct position for {label}", on_click)
cv2.waitKey(0)

if "x" not in clicked:
    print("No click registered, exiting.")
    sys.exit(1)

bbox = (clicked["x"] - BOX_SIZE, clicked["y"] - BOX_SIZE, BOX_SIZE * 2, BOX_SIZE * 2)
tracker = cv2.legacy.TrackerCSRT_create()
tracker.init(frame, bbox)

frames_by_index = {fe["frameIndex"]: fe for fe in tracking_data["frames"]}
last_position = None

for frame_idx in range(start_frame_idx, len(frame_files)):
    current_frame = cv2.imread(f"{FRAMES_DIR}/{frame_files[frame_idx]}")

    if frame_idx == start_frame_idx:
        box = bbox
    else:
        success, box = tracker.update(current_frame)
        if not success:
            print(f"Lost at frame {frame_idx}")
            break

    x, y, w, h = box
    cx, cy = x + w / 2, y + h

    if last_position:
        jump = np.hypot(cx - last_position[0], cy - last_position[1])
        if jump > MAX_JUMP_PIXELS:
            print(f"Jumped {jump:.0f}px at frame {frame_idx} — stopping")
            break
    last_position = (cx, cy)

    meter_x, meter_y = pixel_to_meters(cx, cy)

    if frame_idx not in frames_by_index:
        frames_by_index[frame_idx] = {"frameIndex": frame_idx, "detections": []}
        tracking_data["frames"].append(frames_by_index[frame_idx])

    frames_by_index[frame_idx]["detections"] = [
        d for d in frames_by_index[frame_idx]["detections"] if d["label"] != label
    ]
    frames_by_index[frame_idx]["detections"].append({
        "label": label, "pixelX": float(cx), "pixelY": float(cy),
        "meterX": meter_x, "meterY": meter_y
    })

tracking_data["frames"].sort(key=lambda fe: fe["frameIndex"])

with open(TRACKING_PATH, "w") as f:
    json.dump(tracking_data, f, indent=2)

print(f"Corrected '{label}' starting from frame {start_frame_idx}")
