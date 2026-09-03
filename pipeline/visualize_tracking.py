import json
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import os

with open("tracking.json") as f:
    data = json.load(f)

frames = data["frames"]

output_dir = "tracking_preview_frames"
os.makedirs(output_dir, exist_ok=True)

PITCH_LENGTH = 103
PITCH_WIDTH = 67

for i, frame in enumerate(frames):
    fig, ax = plt.subplots(figsize=(10.3, 6.7))
    ax.set_xlim(-5, PITCH_LENGTH + 5)
    ax.set_ylim(-5, PITCH_WIDTH + 5)
    ax.set_facecolor("green")

    pitch_rect = patches.Rectangle((0, 0), PITCH_LENGTH, PITCH_WIDTH, linewidth=2, edgecolor="white", facecolor="none")
    ax.add_patch(pitch_rect)

    for detection in frame["detections"]:
        ax.plot(detection["meterX"], detection["meterY"], "o", color="red", markersize=8)
        ax.text(detection["meterX"], detection["meterY"] + 1.5, str(detection["trackerId"]), color="white", fontsize=8, ha="center")

    ax.set_title(f"t = {frame['timestamp']:.1f}s  —  {len(frame['detections'])} detected")
    ax.invert_yaxis()  # matches typical broadcast top-down orientation

    plt.savefig(f"{output_dir}/frame_{i:04d}.png")
    plt.close(fig)

print(f"Saved {len(frames)} preview images to {output_dir}/")
