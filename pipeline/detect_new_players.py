import cv2
import json
import os
import numpy as np
from ultralytics import YOLO

FRAMES_DIR = "frames"
TRACKING_PATH = "tracking.json"
IGNORED_PATH = "ignored_regions.json"
CALIBRATION_PATH = "FULvsCHE-20260824_calibration.json"
CROPS_DIR = "review_crops"
SAMPLE_EVERY = 3
MATCH_RADIUS = 80
CLUSTER_RADIUS = 100
CLUSTER_GAP_TOLERANCE = SAMPLE_EVERY * 5
PITCH_MARGIN = 5

os.makedirs(CROPS_DIR, exist_ok=True)

with open(TRACKING_PATH) as f:
    tracking_data = json.load(f)

with open(CALIBRATION_PATH) as f:
    cal_data = json.load(f)
homography = np.array(cal_data["calibrations"][0]["matrix"]).reshape(3, 3)
inv_homography = np.linalg.inv(homography)

def is_on_pitch(px, py):
    vec = np.array([px, py, 1.0])
    result = inv_homography @ vec
    result = result / result[2]
    meter_x, meter_y = result[0], result[1]
    return -PITCH_MARGIN <= meter_x <= 103 + PITCH_MARGIN and -PITCH_MARGIN <= meter_y <= 67 + PITCH_MARGIN

frame_files = sorted(os.listdir(FRAMES_DIR))

tracked_positions_by_frame = {}
for frame_entry in tracking_data["frames"]:
    idx = frame_entry["frameIndex"]
    tracked_positions_by_frame[idx] = [(d["pixelX"], d["pixelY"]) for d in frame_entry["detections"]]

ignored_regions = []
if os.path.exists(IGNORED_PATH):
    with open(IGNORED_PATH) as f:
        ignored_regions = json.load(f)

model = YOLO("yolov8s.pt")

open_tracklets = []
closed_tracklets = []
next_tracklet_id = 1

def near_any(point, points_list, radius):
    for px, py in points_list:
        if np.hypot(point[0] - px, point[1] - py) < radius:
            return True
    return False

for frame_idx in range(0, len(frame_files), SAMPLE_EVERY):
    frame = cv2.imread(f"{FRAMES_DIR}/{frame_files[frame_idx]}")
    results = model(frame, classes=[0], conf=0.2, imgsz=1280, verbose=False)
    boxes = results[0].boxes.xyxy.cpu().numpy()

    tracked_here = tracked_positions_by_frame.get(frame_idx, [])

    unmatched = []
    for box in boxes:
        x1, y1, x2, y2 = map(float, box)
        cx, cy = (x1 + x2) / 2, (y1 + y2) / 2
        foot_x, foot_y = cx, y2

        if not is_on_pitch(foot_x, foot_y):
            continue
        if near_any((cx, cy), tracked_here, MATCH_RADIUS):
            continue
        if near_any((cx, cy), [(r["x"], r["y"]) for r in ignored_regions], MATCH_RADIUS):
            continue

        unmatched.append((cx, cy, x1, y1, x2, y2))

    used_tracklets = set()
    for cx, cy, x1, y1, x2, y2 in unmatched:
        matched_tracklet = None
        for t in open_tracklets:
            if t["id"] in used_tracklets:
                continue
            last_x, last_y = t["points"][-1][1], t["points"][-1][2]
            if np.hypot(cx - last_x, cy - last_y) < CLUSTER_RADIUS:
                matched_tracklet = t
                break

        if matched_tracklet:
            matched_tracklet["points"].append((frame_idx, cx, cy, x1, y1, x2, y2))
            matched_tracklet["last_frame"] = frame_idx
            used_tracklets.add(matched_tracklet["id"])
        else:
            new_tracklet = {
                "id": next_tracklet_id,
                "points": [(frame_idx, cx, cy, x1, y1, x2, y2)],
                "last_frame": frame_idx
            }
            open_tracklets.append(new_tracklet)
            used_tracklets.add(next_tracklet_id)
            next_tracklet_id += 1

    still_open = []
    for t in open_tracklets:
        if frame_idx - t["last_frame"] > CLUSTER_GAP_TOLERANCE:
            closed_tracklets.append(t)
        else:
            still_open.append(t)
    open_tracklets = still_open

    if frame_idx % 50 == 0:
        print(f"Frame {frame_idx}/{len(frame_files)} — {len(open_tracklets)} open, {len(closed_tracklets)} closed")

closed_tracklets.extend(open_tracklets)

real_tracklets = [t for t in closed_tracklets if len(t["points"]) >= 3]
print(f"Found {len(real_tracklets)} candidate tracklets after filtering noise")

review_items = []
for t in real_tracklets:
    mid_point = t["points"][len(t["points"]) // 2]
    frame_idx, cx, cy, x1, y1, x2, y2 = mid_point
    frame = cv2.imread(f"{FRAMES_DIR}/{frame_files[frame_idx]}")
    pad = 20
    crop = frame[max(0, int(y1) - pad):int(y2) + pad, max(0, int(x1) - pad):int(x2) + pad]
    crop_path = f"{CROPS_DIR}/tracklet_{t['id']}.jpg"
    cv2.imwrite(crop_path, crop)

    review_items.append({
        "trackletId": t["id"],
        "startFrame": t["points"][0][0],
        "endFrame": t["points"][-1][0],
        "cropPath": crop_path,
        "points": [
            {"frameIndex": p[0], "x": float(p[1]), "y": float(p[2]), "x1": float(p[3]), "y1": float(p[4]), "x2": float(p[5]), "y2": float(p[6])}
            for p in t["points"]
        ]
    })

with open("review_queue.json", "w") as f:
    json.dump(review_items, f, indent=2)

print(f"Saved {len(review_items)} tracklets to review_queue.json and crops to {CROPS_DIR}/")
