from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import re
import cv2
import numpy as np
import json

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CLIPS_DIR = os.path.join(BASE_DIR, "clips")
os.makedirs(CLIPS_DIR, exist_ok=True)

TARGET_FPS = 20
BOX_SIZE = 30
MAX_JUMP_PIXELS = 80


def safe_name(name):
    return re.sub(r"[^a-zA-Z0-9_-]", "_", name)


def clip_dir(profile, clip):
    path = os.path.join(CLIPS_DIR, safe_name(profile), safe_name(clip))
    os.makedirs(path, exist_ok=True)
    os.makedirs(os.path.join(path, "frames"), exist_ok=True)
    return path


def get_params(source):
    profile = source.get("profile")
    clip = source.get("clip")
    if not profile or not clip:
        raise ValueError("profile and clip are required")
    return profile, clip


@app.route("/upload_video", methods=["POST"])
def upload_video():
    profile, clip = get_params(request.form)
    directory = clip_dir(profile, clip)

    file = request.files["video"]
    video_path = os.path.join(directory, "clip.mp4")
    file.save(video_path)

    frames_dir = os.path.join(directory, "frames")
    for f in os.listdir(frames_dir):
        os.remove(os.path.join(frames_dir, f))

    cap = cv2.VideoCapture(video_path)
    source_fps = cap.get(cv2.CAP_PROP_FPS)
    stride = max(1, round(source_fps / TARGET_FPS))

    frame_index = 0
    saved_index = 0
    while True:
        success, frame = cap.read()
        if not success:
            break
        if frame_index % stride == 0:
            cv2.imwrite(os.path.join(frames_dir, f"{saved_index:05d}.jpg"), frame)
            saved_index += 1
        frame_index += 1
    cap.release()

    return jsonify({"fps": TARGET_FPS, "frameCount": saved_index})


@app.route("/upload_calibration", methods=["POST"])
def upload_calibration():
    profile, clip = get_params(request.args)
    directory = clip_dir(profile, clip)

    calibration_data = request.json
    with open(os.path.join(directory, "calibration.json"), "w") as f:
        json.dump(calibration_data, f)

    return jsonify({"status": "ok"})


@app.route("/video/<profile>/<clip>")
def get_video(profile, clip):
    directory = clip_dir(profile, clip)
    return send_from_directory(directory, "clip.mp4")


@app.route("/frame/<profile>/<clip>/<int:frame_index>")
def get_frame(profile, clip, frame_index):
    directory = clip_dir(profile, clip)
    return send_from_directory(os.path.join(directory, "frames"), f"{frame_index:05d}.jpg")


@app.route("/clips")
def list_clips():
    profile = request.args.get("profile")
    if not profile:
        return jsonify([])
    profile_dir = os.path.join(CLIPS_DIR, safe_name(profile))
    if not os.path.exists(profile_dir):
        return jsonify([])
    return jsonify(sorted(os.listdir(profile_dir)))


def load_homography(directory, timestamp):
    with open(os.path.join(directory, "calibration.json")) as f:
        data = json.load(f)
    calibrations = sorted(data["calibrations"], key=lambda c: c["startTime"])
    matrix = calibrations[0]["matrix"]
    for cal in calibrations:
        if cal["startTime"] <= timestamp:
            matrix = cal["matrix"]
        else:
            break
    return np.array(matrix).reshape(3, 3)


def pixel_to_meters(inv_matrix, px, py):
    vec = np.array([px, py, 1.0])
    result = inv_matrix @ vec
    result = result / result[2]
    return float(result[0]), float(result[1])


def tracking_path(directory):
    return os.path.join(directory, "tracking.json")


def load_tracking(directory):
    path = tracking_path(directory)
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return {"frames": []}


def save_tracking(directory, data):
    with open(tracking_path(directory), "w") as f:
        json.dump(data, f)


@app.route("/tracking", methods=["GET"])
def get_tracking():
    profile, clip = get_params(request.args)
    directory = clip_dir(profile, clip)
    return jsonify(load_tracking(directory))


@app.route("/initial_track", methods=["POST"])
def initial_track():
    profile, clip = get_params(request.args)
    directory = clip_dir(profile, clip)
    frames_dir = os.path.join(directory, "frames")

    selections = request.json["selections"]

    frame_files = sorted(os.listdir(frames_dir))
    first_frame = cv2.imread(os.path.join(frames_dir, frame_files[0]))

    trackers, labels, active = [], [], []
    for sel in selections:
        x, y = sel["x"], sel["y"]
        bbox = (x - BOX_SIZE, y - BOX_SIZE, BOX_SIZE * 2, BOX_SIZE * 2)
        tracker = cv2.legacy.TrackerCSRT_create()
        tracker.init(first_frame, bbox)
        trackers.append(tracker)
        labels.append(sel["label"])
        active.append(True)

    tracking_data = {"frames": []}
    last_position = {}

    def record(frame_idx, boxes):
        detections = []
        for i, label in enumerate(labels):
            if not active[i]:
                continue
            x, y, w, h = boxes[i]
            cx, cy = x + w / 2, y + h

            if label in last_position:
                jump = np.hypot(cx - last_position[label][0], cy - last_position[label][1])
                if jump > MAX_JUMP_PIXELS:
                    active[i] = False
                    continue
            last_position[label] = (cx, cy)

            timestamp = frame_idx / TARGET_FPS
            inv = np.linalg.inv(load_homography(directory, timestamp))
            mx, my = pixel_to_meters(inv, cx, cy)

            detections.append({"label": label, "pixelX": cx, "pixelY": cy, "meterX": mx, "meterY": my})
        tracking_data["frames"].append({"frameIndex": frame_idx, "detections": detections})

    initial_boxes = [(s["x"] - BOX_SIZE, s["y"] - BOX_SIZE, BOX_SIZE * 2, BOX_SIZE * 2) for s in selections]
    record(0, initial_boxes)

    for frame_idx in range(1, len(frame_files)):
        frame = cv2.imread(os.path.join(frames_dir, frame_files[frame_idx]))
        boxes = []
        for i, tracker in enumerate(trackers):
            if not active[i]:
                boxes.append((0, 0, 0, 0))
                continue
            success, bbox = tracker.update(frame)
            if not success:
                active[i] = False
            boxes.append(bbox if success else (0, 0, 0, 0))
        record(frame_idx, boxes)

    save_tracking(directory, tracking_data)
    return jsonify(tracking_data)


@app.route("/correct_track", methods=["POST"])
def correct_track_endpoint():
    profile, clip = get_params(request.args)
    directory = clip_dir(profile, clip)
    frames_dir = os.path.join(directory, "frames")

    body = request.json
    label = body["label"]
    start_frame_idx = body["frameIndex"]
    click_x = body["x"]
    click_y = body["y"]

    frame_files = sorted(os.listdir(frames_dir))
    frame = cv2.imread(os.path.join(frames_dir, frame_files[start_frame_idx]))

    bbox = (click_x - BOX_SIZE, click_y - BOX_SIZE, BOX_SIZE * 2, BOX_SIZE * 2)
    tracker = cv2.legacy.TrackerCSRT_create()
    tracker.init(frame, bbox)

    tracking_data = load_tracking(directory)
    frames_by_index = {fe["frameIndex"]: fe for fe in tracking_data["frames"]}

    last_position = None

    for frame_idx in range(start_frame_idx, len(frame_files)):
        current_frame = cv2.imread(os.path.join(frames_dir, frame_files[frame_idx]))

        if frame_idx == start_frame_idx:
            box = bbox
        else:
            success, box = tracker.update(current_frame)
            if not success:
                break

        x, y, w, h = box
        cx, cy = x + w / 2, y + h

        if last_position:
            jump = np.hypot(cx - last_position[0], cy - last_position[1])
            if jump > MAX_JUMP_PIXELS:
                break
        last_position = (cx, cy)

        timestamp = frame_idx / TARGET_FPS
        inv = np.linalg.inv(load_homography(directory, timestamp))
        mx, my = pixel_to_meters(inv, cx, cy)

        if frame_idx not in frames_by_index:
            frames_by_index[frame_idx] = {"frameIndex": frame_idx, "detections": []}
            tracking_data["frames"].append(frames_by_index[frame_idx])

        frames_by_index[frame_idx]["detections"] = [
            d for d in frames_by_index[frame_idx]["detections"] if d["label"] != label
        ]
        frames_by_index[frame_idx]["detections"].append({
            "label": label, "pixelX": float(cx), "pixelY": float(cy), "meterX": mx, "meterY": my
        })

    tracking_data["frames"].sort(key=lambda fe: fe["frameIndex"])
    save_tracking(directory, tracking_data)

    return jsonify(tracking_data)


if __name__ == "__main__":
    app.run(port=5001, debug=True)
