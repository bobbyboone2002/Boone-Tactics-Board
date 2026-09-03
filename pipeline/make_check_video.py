import json
import cv2
import os

FRAMES_DIR = "frames"
TRACKING_PATH = "tracking.json"
FPS = 20

with open(TRACKING_PATH) as f:
    tracking_data = json.load(f)

frame_files = sorted(os.listdir(FRAMES_DIR))
frames_by_index = {fe["frameIndex"]: fe for fe in tracking_data["frames"]}

first_frame = cv2.imread(f"{FRAMES_DIR}/{frame_files[0]}")
height, width = first_frame.shape[:2]

out = cv2.VideoWriter("final_check.mp4", cv2.VideoWriter_fourcc(*"mp4v"), FPS, (width, height))

for frame_idx, frame_file in enumerate(frame_files):
    frame = cv2.imread(f"{FRAMES_DIR}/{frame_file}")
    entry = frames_by_index.get(frame_idx)
    if entry:
        for d in entry["detections"]:
            x, y = int(d["pixelX"]), int(d["pixelY"])
            cv2.circle(frame, (x, y), 6, (0, 0, 255), -1)
            cv2.putText(frame, d["label"], (x + 8, y), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    out.write(frame)

out.release()
print("Saved final_check.mp4")
