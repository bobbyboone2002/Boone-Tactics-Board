import cv2
import os
import json

VIDEO_PATH = "goal_clip.mp4"
FRAMES_DIR = "frames"

os.makedirs(FRAMES_DIR, exist_ok=True)

cap = cv2.VideoCapture(VIDEO_PATH)
source_fps = cap.get(cv2.CAP_PROP_FPS)
target_fps = 20
stride = max(1, round(source_fps / target_fps))
print(f"Source fps: {source_fps}. Keeping every {stride} frame(s).")

frame_index = 0
saved_index = 0
while True:
    success, frame = cap.read()
    if not success:
        break
    if frame_index % stride == 0:
        cv2.imwrite(f"{FRAMES_DIR}/{saved_index:05d}.jpg", frame)
        saved_index += 1
    frame_index += 1
cap.release()
print(f"Extracted {saved_index} frames to {FRAMES_DIR}/")

first_frame = cv2.imread(f"{FRAMES_DIR}/00000.jpg")
selections = []

def on_click(event, x, y, flags, param):
    if event == cv2.EVENT_LBUTTONDOWN:
        label = input("Label this point (e.g. home_7, away_10, ball): ")
        selections.append({"label": label, "x": x, "y": y})
        cv2.circle(first_frame, (x, y), 5, (0, 0, 255), -1)
        cv2.imshow("Click each player and the ball", first_frame)

cv2.imshow("Click each player and the ball", first_frame)
cv2.setMouseCallback("Click each player and the ball", on_click)
print("Click each player/ball on the image. Press 'q' in the image window when done.")
while True:
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break
cv2.destroyAllWindows()

with open("selections.json", "w") as f:
    json.dump(selections, f, indent=2)

print(f"Saved {len(selections)} selections to selections.json")
