from flask import Flask, request, jsonify, send_from_directory, Response
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

PLAYER_FEET_OFFSET = 40  # pixels, downward — adjust based on how far off your clicks tend to be

TARGET_FPS = 20

def safe_name(name):
    return re.sub(r"[^a-zA-Z0-9_-]", "_", name)


def existing_clip_dir(profile, clip):
    return os.path.join(CLIPS_DIR, safe_name(profile), safe_name(clip))


def clip_dir(profile, clip):
    path = os.path.join(CLIPS_DIR, safe_name(profile), safe_name(clip))
    os.makedirs(path, exist_ok=True)
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

    cap = cv2.VideoCapture(video_path)
    source_fps = cap.get(cv2.CAP_PROP_FPS)
    total_source_frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)
    cap.release()

    duration_seconds = total_source_frames / source_fps if source_fps else 0
    frame_count = int(duration_seconds * TARGET_FPS)

    video_info = {
        "fps": TARGET_FPS,
        "sourceFps": source_fps,
        "frameCount": frame_count,
        "durationSeconds": duration_seconds
    }
    with open(os.path.join(directory, "video_info.json"), "w") as f:
        json.dump(video_info, f)

    return jsonify(video_info)


@app.route("/video_info")
def get_video_info():
    profile, clip = get_params(request.args)
    directory = existing_clip_dir(profile, clip)
    path = os.path.join(directory, "video_info.json")
    if not os.path.exists(path):
        return jsonify({"error": "No video uploaded for this clip yet"}), 404
    with open(path) as f:
        return jsonify(json.load(f))


@app.route("/upload_calibration", methods=["POST"])
def upload_calibration():
    profile, clip = get_params(request.args)
    directory = clip_dir(profile, clip)
    calibration_data = request.json
    with open(os.path.join(directory, "calibration.json"), "w") as f:
        json.dump(calibration_data, f)
    return jsonify({"status": "ok"})


@app.route("/calibrations")
def get_calibrations():
    profile, clip = get_params(request.args)
    directory = existing_clip_dir(profile, clip)
    path = os.path.join(directory, "calibration.json")
    if not os.path.exists(path):
        return jsonify({"calibrations": []})
    with open(path) as f:
        return jsonify(json.load(f))


@app.route("/clear_clip_data", methods=["POST"])
def clear_clip_data():
    profile, clip = get_params(request.args)
    directory = existing_clip_dir(profile, clip)
    for filename in ["calibration.json", "keyframes.json"]:
        path = os.path.join(directory, filename)
        if os.path.exists(path):
            os.remove(path)
    return jsonify({"status": "cleared"})


@app.route("/video/<profile>/<clip>")
def get_video(profile, clip):
    directory = existing_clip_dir(profile, clip)
    return send_from_directory(directory, "clip.mp4")


@app.route("/frame/<profile>/<clip>/<int:frame_index>")
def get_frame(profile, clip, frame_index):
    directory = existing_clip_dir(profile, clip)
    video_path = os.path.join(directory, "clip.mp4")
    info_path = os.path.join(directory, "video_info.json")

    with open(info_path) as f:
        info = json.load(f)

    timestamp = frame_index / info["fps"]
    source_frame_index = round(timestamp * info["sourceFps"])

    cap = cv2.VideoCapture(video_path)
    cap.set(cv2.CAP_PROP_POS_FRAMES, source_frame_index)
    success, frame = cap.read()
    cap.release()

    if not success:
        return jsonify({"error": "Could not read frame"}), 404

    success, buffer = cv2.imencode(".jpg", frame)
    return Response(buffer.tobytes(), mimetype="image/jpeg")


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


def keyframes_path(directory):
    return os.path.join(directory, "keyframes.json")


def load_keyframes(directory):
    path = keyframes_path(directory)
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return {}


def save_keyframes(directory, data):
    with open(keyframes_path(directory), "w") as f:
        json.dump(data, f)


@app.route("/keyframes", methods=["GET"])
def get_keyframes():
    profile, clip = get_params(request.args)
    directory = existing_clip_dir(profile, clip)
    return jsonify(load_keyframes(directory))


@app.route("/mark_keyframe", methods=["POST"])
def mark_keyframe():
    profile, clip = get_params(request.args)
    directory = clip_dir(profile, clip)

    body = request.json
    label = body["label"]
    timestamp = float(body["timestamp"])
    px = float(body["x"])
    py = float(body["y"])

    if label != "ball":
        py = py + PLAYER_FEET_OFFSET

    inv = np.linalg.inv(load_homography(directory, timestamp))
    meter_x, meter_y = pixel_to_meters(inv, px, py)

    keyframes = load_keyframes(directory)
    label_marks = keyframes.get(label, [])
    label_marks = [m for m in label_marks if abs(m["timestamp"] - timestamp) > 0.001]
    label_marks.append({"timestamp": timestamp, "meterX": meter_x, "meterY": meter_y, "pixelX": px, "pixelY": py})
    label_marks.sort(key=lambda m: m["timestamp"])
    keyframes[label] = label_marks
    save_keyframes(directory, keyframes)

    return jsonify(keyframes)


@app.route("/delete_keyframe", methods=["POST"])
def delete_keyframe():
    profile, clip = get_params(request.args)
    directory = clip_dir(profile, clip)

    body = request.json
    label = body["label"]
    timestamp = float(body["timestamp"])

    keyframes = load_keyframes(directory)
    label_marks = keyframes.get(label, [])
    keyframes[label] = [m for m in label_marks if abs(m["timestamp"] - timestamp) > 0.001]
    save_keyframes(directory, keyframes)

    return jsonify(keyframes)


@app.route("/recompute_keyframes", methods=["POST"])
def recompute_keyframes():
    profile, clip = get_params(request.args)
    directory = clip_dir(profile, clip)
    keyframes = load_keyframes(directory)

    for label, marks in keyframes.items():
        for mark in marks:
            inv = np.linalg.inv(load_homography(directory, mark["timestamp"]))
            meter_x, meter_y = pixel_to_meters(inv, mark["pixelX"], mark["pixelY"])
            mark["meterX"] = meter_x
            mark["meterY"] = meter_y

    save_keyframes(directory, keyframes)
    return jsonify(keyframes)


if __name__ == "__main__":
    app.run(port=5001, debug=True)
    