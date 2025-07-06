from flask import Blueprint, jsonify
import psutil
import GPUtil
import platform
import tempfile
import shutil
import os

system_bp = Blueprint('system', __name__)

@system_bp.route("/api/system/resources", methods=["GET"])
def system_resources():
    try:
        cpu_percent = psutil.cpu_percent(interval=0.5)
        memory_percent = psutil.virtual_memory().percent
        disk_path = os.path.splitdrive(os.getcwd())[0] + os.sep
        disk_percent = psutil.disk_usage(disk_path).percent

        gpus = GPUtil.getGPUs()
        gpu_usage = gpus[0].load * 100 if gpus else 0
        gpu_memory_percent = gpus[0].memoryUtil * 100 if gpus else 0

        data = {
            "cpu_percent": cpu_percent,
            "memory_percent": memory_percent,
            "disk_percent": disk_percent,
            "gpu_usage": gpu_usage,
            "gpu_memory_percent": gpu_memory_percent,
            "timestamp": psutil.boot_time(),
        }
        return jsonify({"success": True, "data": data, "error": None})
    except Exception as e:
        print(f"Error fetching system resources: {e}")
        return jsonify({
            "success": False,
            "data": None,
            "error": "Could not fetch system resources"
        }), 500

@system_bp.route("/api/system/cleanup", methods=["POST"])
def cleanup_system():
    try:
        temp_dir = tempfile.gettempdir()
        for filename in os.listdir(temp_dir):
            file_path = os.path.join(temp_dir, filename)
            try:
                if os.path.isfile(file_path) or os.path.islink(file_path):
                    os.unlink(file_path)
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)
            except Exception as e:
                print(f"Failed to delete {file_path}. Reason: {e}")
        return jsonify({"message": "System cleanup successful"})
    except Exception as e:
        print(f"Error during system cleanup: {e}")
        return jsonify({"error": "Could not perform system cleanup"}), 500

@system_bp.route("/api/system/processes", methods=["GET"])
def system_processes():
    try:
        processes = []
        proc_attrs = [
            "pid", "name", "username", "cpu_percent", "memory_percent"
        ]
        for proc in psutil.process_iter(proc_attrs):
            processes.append(proc.info)
        # Sort by cpu_percent by default
        processes = sorted(
            processes, key=lambda p: p["cpu_percent"], reverse=True
        )[:10]
        return jsonify({"success": True, "data": processes, "error": None})
    except Exception as e:
        print(f"Error getting system processes: {e}")
        return jsonify({
            "success": False,
            "data": None,
            "error": "Could not get system processes"
        }), 500

@system_bp.route("/api/system/info", methods=["GET"])
def system_info():
    try:
        data = {
            "hostname": platform.uname().node,
            "os": platform.uname().system,
            "uptime": psutil.boot_time(),
        }
        return jsonify({"success": True, "data": data, "error": None})
    except Exception as e:
        print(f"Error getting system info: {e}")
        return jsonify({
            "success": False,
            "data": None,
            "error": "Could not get system info"
        }), 500
