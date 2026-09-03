import json
import cv2
import numpy as np
import os

REVIEW_QUEUE_PATH = "review_queue.json"
TRACKING_PATH = "tracking.json"
IGNORED_PATH = "ignored_regions.json"
FPS = 20
SUGGEST_RADIUS = 150

with open(REVIEW_QUEUE_PATH) as f:
    tracklets = json.load(f)

with open(TRACKING_PATH) as f:
    tracking_data = json.load(f)

ignored_regions = []
if os.path.exists(IGNORED_PATH):
    with open(IGNORED_PATH) as f:
        ignored_regions = json.load(f)

# Find each label's last known position and last frame it appeared
last_seen = {}
for frame_entry in tracking_data["frames"]:
    for d in frame_entry["detections"]:
        last_seen[d["label"]] = {
            "frame": frame_entry["frameIndex"],
            "x": d["pixelX"],
            "y": d["pixelY"]
        }

def suggest_label(tracklet_start_frame, first_x, first_y):
    best_label = None
    best_distance = SUGGEST_RADIUS
    for label, info in last_seen.items():
        if info["frame"] >= tracklet_start_frame:
            continue
        dist = np.hypot(first_x - info["x"], first_y - info["y"])
        if dist < best_distance:
            best_distance = dist
            best_label = label
    return best_label

assignments = []

for t in tracklets:
    crop = cv2.imread(t["cropPath"])
    if crop is None:
        continue

    start_time = t["startFrame"] / FPS
    end_time = t["endFrame"] / FPS
    first_point = t["points"][0]

    suggestion = suggest_label(t["startFrame"], first_point["x"], first_point["y"])

    display = cv2.resize(crop, (300, 300), interpolation=cv2.INTER_NEAREST)
    cv2.imshow("Tracklet review — press any key when ready to answer in terminal", display)
    cv2.waitKey(1)

    print(f"\nTracklet {t['trackletId']}: {start_time:.1f}s to {end_time:.1f}s")
    if suggestion:
        print(f"Suggested: {suggestion} (nearest lost player)")

    prompt = f"Enter label to assign (blank = accept suggestion '{suggestion}', or type 'ignore'): " if suggestion \
        else "Enter label to assign, or type 'ignore': "

    response = input(prompt).strip()

    if response == "" and suggestion:
        response = suggestion

    if response.lower() == "ignore":
        avg_x = np.mean([p["x"] for p in t["points"]])
        avg_y = np.mean([p["y"] for p in t["points"]])
        ignored_regions.append({"x": float(avg_x), "y": float(avg_y)})
        print(f"Marked tracklet {t['trackletId']} as ignored")
    elif response:
        assignments.append({"trackletId": t["trackletId"], "label": response})
        print(f"Assigned tracklet {t['trackletId']} to {response}")

cv2.destroyAllWindows()

with open("tracklet_assignments.json", "w") as f:
    json.dump(assignments, f, indent=2)

with open(IGNORED_PATH, "w") as f:
    json.dump(ignored_regions, f, indent=2)

print(f"\nDone. {len(assignments)} assignments saved to tracklet_assignments.json")
print(f"{len(ignored_regions)} total ignored regions saved to {IGNORED_PATH}")
