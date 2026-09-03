import json
import cv2
import numpy as np
import os

FRAMES_DIR = "frames"
CALIBRATION_PATH = "FULvsCHE-20260824_calibration.json"
TRACKING_PATH = "tracking.json"
REVIEW_QUEUE_PATH = "review_queue.json"
ASSIGNMENTS_PATH = "tracklet_assignments.json"

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

with open(REVIEW_QUEUE_PATH) as f:
    review_queue = json.load(f)

with open(ASSIGNMENTS_PATH) as f:
    assignments = json.load(f)

tracklets_by_id = {t["trackletId"]: t for t in review_queue}
frame_files = sorted(os.listdir(FRAMES_DIR))
frames_by_index = {fe["frameIndex"]: fe for fe in tracking_data["frames"]}

for assignment in assignments:
    tracklet = tracklets_by_id.get(assignment["trackletId"])
    if not tracklet:
        continue

    label = assignment["label"]
    start_point = tracklet["points"][0]
    start_frame_idx = start_point["frameIndex"]
    x1, y1, x2, y2 = start_point["x1"], start_point["y1"], start_point["x2"], start_point["y2"]
    bbox = (x1, y1, x2 - x1, y2 - y1)

    first_frame_img = cv2.imread(f"{FRAMES_DIR}/{frame_files[start_frame_idx]}")
    tracker = cv2.legacy.TrackerCSRT_create()
    tracker.init(first_frame_img, bbox)

    print(f"Tracking '{label}' forward from frame {start_frame_idx}...")

    last_position = None

    for frame_idx in range(start_frame_idx, len(frame_files)):
        frame = cv2.imread(f"{FRAMES_DIR}/{frame_files[frame_idx]}")

        if frame_idx == start_frame_idx:
            box = bbox
        else:
            success, box = tracker.update(frame)
            if not success:
                print(f"  '{label}' lost at frame {frame_idx}")
                break

        x, y, w, h = box
        cx, cy = x + w / 2, y + h

        if last_position:
            jump = np.hypot(cx - last_position[0], cy - last_position[1])
            if jump > 80:
                print(f"  '{label}' jumped {jump:.0f}px at frame {frame_idx} — stopping")
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
            "label": label,
            "pixelX": float(cx),
            "pixelY": float(cy),
            "meterX": meter_x,
            "meterY": meter_y
        })

tracking_data["frames"].sort(key=lambda fe: fe["frameIndex"])

with open(TRACKING_PATH, "w") as f:
    json.dump(tracking_data, f, indent=2)

print(f"Merged {len(assignments)} confirmed tracklets into {TRACKING_PATH}")
