import json
import cv2
import numpy as np
import os

FRAMES_DIR = "frames"
CALIBRATION_PATH = "FULvsCHE-20260824_calibration.json"
BOX_SIZE = 30

with open("selections.json") as f:
    selections = json.load(f)

with open(CALIBRATION_PATH) as f:
    cal_data = json.load(f)
matrix = np.array(cal_data["calibrations"][0]["matrix"]).reshape(3, 3)
inv_matrix = np.linalg.inv(matrix)

def pixel_to_meters(px, py):
    vec = np.array([px, py, 1.0])
    result = inv_matrix @ vec
    result = result / result[2]
    return float(result[0]), float(result[1])

frame_files = sorted(os.listdir(FRAMES_DIR))
first_frame = cv2.imread(f"{FRAMES_DIR}/{frame_files[0]}")

trackers, labels, active = [], [], []

for sel in selections:
    x, y = sel["x"], sel["y"]
    bbox = (x - BOX_SIZE, y - BOX_SIZE, BOX_SIZE * 2, BOX_SIZE * 2)
    tracker = cv2.legacy.TrackerCSRT_create()
    tracker.init(first_frame, bbox)
    trackers.append(tracker)
    labels.append(sel["label"])
    active.append(True)

output_frames = []

last_position = {}  # add this line above the function, near your other globals

def record_frame(frame_idx, boxes):
    detections = []
    for i, label in enumerate(labels):
        if not active[i]:
            continue
        x, y, w, h = boxes[i]
        cx, cy = x + w / 2, y + h / 2

        if label in last_position:
            jump = np.hypot(cx - last_position[label][0], cy - last_position[label][1])
            if jump > 80:
                print(f"  '{label}' jumped {jump:.0f}px at frame {frame_idx} — stopping")
                active[i] = False
                continue
        last_position[label] = (cx, cy)

        mx, my = pixel_to_meters(cx, cy)
        detections.append({"label": label, "pixelX": cx, "pixelY": cy, "meterX": mx, "meterY": my})
    output_frames.append({"frameIndex": frame_idx, "detections": detections})

initial_boxes = [(s["x"] - BOX_SIZE, s["y"] - BOX_SIZE, BOX_SIZE*2, BOX_SIZE*2) for s in selections]
record_frame(0, initial_boxes)

for frame_idx in range(1, len(frame_files)):
    frame = cv2.imread(f"{FRAMES_DIR}/{frame_files[frame_idx]}")
    boxes = []
    for i, tracker in enumerate(trackers):
        if not active[i]:
            boxes.append((0, 0, 0, 0))
            continue
        success, bbox = tracker.update(frame)
        if not success:
            active[i] = False
        boxes.append(bbox if success else (0, 0, 0, 0))
    record_frame(frame_idx, boxes)
    if frame_idx % 100 == 0:
        print(f"Frame {frame_idx}/{len(frame_files)} — {sum(active)} still tracked")

# Save an annotated video so you can actually SEE whether tracking stayed correct
out_writer = cv2.VideoWriter(
    "tracking_check.mp4",
    cv2.VideoWriter_fourcc(*"mp4v"),
    10,
    (first_frame.shape[1], first_frame.shape[0])
)

for i, frame_file in enumerate(frame_files):
    frame = cv2.imread(f"{FRAMES_DIR}/{frame_file}")
    detections = output_frames[i]["detections"]
    for d in detections:
        x, y = int(d["pixelX"]), int(d["pixelY"])
        cv2.circle(frame, (x, y), 6, (0, 0, 255), -1)
        cv2.putText(frame, d["label"], (x + 8, y), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    out_writer.write(frame)

out_writer.release()
print("Saved tracking_check.mp4 — watch it to verify tracking stayed correct.")

with open("tracking.json", "w") as f:
    json.dump({"frames": output_frames}, f, indent=2)

print("Done.")
for i, label in enumerate(labels):
    print(f"  {label}: {'tracked to end' if active[i] else 'lost partway through'}")
    