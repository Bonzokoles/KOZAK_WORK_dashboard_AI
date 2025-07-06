from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
import requests  # Added missing import
from chatbot import AIChat
from weather_integration import get_weather, get_random_movie_quote
from dotenv import load_dotenv
import psutil
import GPUtil
import tempfile
import shutil
import json
import speedtest
import platform
import subprocess
from typing import Dict, Optional
from functools import wraps
from components.ai_tools.cloudflare_ai import CloudflareAI
import logging

from backend.routes.chat import chat_bp

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(
    __name__,
    template_folder="../frontend/templates",
    static_folder="../frontend/static",
)
CORS(app)

# Register blueprints
app.register_blueprint(chat_bp)


# Standard API response wrapper
def api_response(
    success: bool = True,
    data: Optional[Dict] = None,
    error: Optional[str] = None,
    status_code: int = 200,
) -> tuple:
    """Standardized API response format"""
    response = {"success": success, "data": data, "error": error}
    return jsonify(response), status_code


# Error handler decorator
def handle_errors(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            app.logger.error(f"Error in {f.__name__}: {str(e)}")
            return api_response(success=False, error=str(e), status_code=500)

    return wrapper


# Initialize services with proper error handling
try:
    ai_chat_instance = AIChat()
except Exception as e:
    app.logger.error(f"Error initializing AI Chat: {str(e)}")
    ai_chat_instance = None

# Initialize Cloudflare AI
cloudflare_ai = None
try:
    cf_account_id = "7f490d58a478c6baccb0ae01ea1d87c3"
    cf_api_token = "vzoluC5JXcbpevLVp5Z2nGm7k4qELJ8CBFnWMkkK"

    cloudflare_ai = CloudflareAI(cf_account_id, cf_api_token)

    # Test połączenia
    test_result = cloudflare_ai.test_connection()
    if test_result["success"]:
        logger.info("✅ Cloudflare Workers AI initialized successfully")
        logger.info(f"Test response: {test_result.get('response', '')}")
    else:
        logger.warning(
            "⚠️ Cloudflare Workers AI test failed: "
            f"{test_result.get('message')}"
        )

except Exception as e:
    logger.error(f"❌ Failed to initialize Cloudflare AI: {e}")
    cloudflare_ai = None


@app.route("/")
def index():
    return render_template("dashboard.html")


@app.route("/api/chat", methods=["POST"])
@handle_errors
def chat():
    if not ai_chat_instance:
        return api_response(
            success=False,
            error="AI Chat service not initialized",
            status_code=503,
        )

    data = request.json
    user_message = data.get("message", "")
    if not user_message:
        return api_response(
            success=False, error="Message is required", status_code=400
        )

    response = ai_chat_instance.get_response(user_message)
    return api_response(data={"response": response})


@app.route("/api/weather", methods=["GET"])
@app.route("/api/weather/<city>", methods=["GET"])
@handle_errors
def weather(city=None):
    target_city = city or request.args.get("city", "Warsaw")
    weather_data = get_weather(target_city)
    return jsonify(weather_data)


@app.route("/api/weather/quote", methods=["GET"])
@app.route("/api/weather/quote/<condition>", methods=["GET"])
@handle_errors
def weather_quote(condition=None):
    quote_data = get_random_movie_quote(condition)
    return api_response(data={"quote": quote_data})


@app.route("/api/system/resources", methods=["GET"])
@handle_errors
def system_resources():
    cpu_percent = psutil.cpu_percent(interval=0.5)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage(os.path.splitdrive(os.getcwd())[0] + "\\")

    gpus = GPUtil.getGPUs()
    gpu_usage = gpus[0].load * 100 if gpus else 0
    gpu_memory_percent = gpus[0].memoryUtil * 100 if gpus else 0

    data = {
        "cpu_percent": cpu_percent,
        "memory_percent": memory.percent,
        "memory_used": memory.used,
        "memory_total": memory.total,
        "disk_percent": disk.percent,
        "disk_used": disk.used,
        "disk_total": disk.total,
        "gpu_usage": gpu_usage,
        "gpu_memory_percent": gpu_memory_percent,
        "timestamp": psutil.boot_time(),
    }

    return api_response(data=data)


@app.route("/api/system/cleanup", methods=["POST"])
@handle_errors
def cleanup_system():
    cleaned_files = 0
    errors = []
    temp_dir = tempfile.gettempdir()

    for filename in os.listdir(temp_dir):
        file_path = os.path.join(temp_dir, filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
                cleaned_files += 1
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)
                cleaned_files += 1
        except Exception as e:
            errors.append(f"Failed to delete {file_path}: {str(e)}")

    data = {
        "cleaned_files": cleaned_files,
        "errors": errors if errors else None,
        "message": f"Cleaned {cleaned_files} files/folders",
    }

    return api_response(data=data)


@app.route("/api/config/ai", methods=["POST"])
@handle_errors
def save_ai_config():
    config_data = request.json
    if not config_data:
        return api_response(
            success=False,
            error="No configuration data provided",
            status_code=400,
        )

    config_path = os.path.join(
        os.path.dirname(__file__), "..", "config", "config.json"
    )
    os.makedirs(os.path.dirname(config_path), exist_ok=True)

    with open(config_path, "w") as f:
        json.dump(config_data, f, indent=4)

    return api_response(data={"message": "Configuration saved successfully"})


@app.route("/api/network/stats", methods=["GET"])
@handle_errors
def network_stats():
    s = speedtest.Speedtest()
    s.get_best_server()

    download_speed = s.download() / 1024 / 1024  # Convert to Mbps
    upload_speed = s.upload() / 1024 / 1024  # Convert to Mbps
    ping_time = s.results.ping

    data = {
        "download": download_speed,
        "upload": upload_speed,
        "ping": ping_time,
    }

    return api_response(data=data)


@app.route("/api/system/processes", methods=["GET"])
@handle_errors
def system_processes():
    processes = []
    proc_iter = psutil.process_iter(
        ["pid", "name", "username", "cpu_percent", "memory_percent"]
    )
    for proc in proc_iter:
        try:
            pinfo = proc.info
            pinfo["cpu_percent"] = round(pinfo["cpu_percent"], 1)
            pinfo["memory_percent"] = round(pinfo["memory_percent"], 1)
            processes.append(pinfo)
        except (
            psutil.NoSuchProcess,
            psutil.AccessDenied,
            psutil.ZombieProcess,
        ):
            continue

    # Sort by CPU usage and get top 10
    processes = sorted(
        processes, key=lambda p: p["cpu_percent"], reverse=True
    )[:10]
    return api_response(data=processes)


@app.route("/api/system/info", methods=["GET"])
@handle_errors
def system_info():
    uname = platform.uname()
    data = {
        "hostname": uname.node,
        "os": f"{uname.system} {uname.release}",
        "version": uname.version,
        "machine": uname.machine,
        "processor": uname.processor,
        "uptime": psutil.boot_time(),
    }
    return api_response(data=data)


@app.route("/api/ai/list_models", methods=["GET"])
@handle_errors
def list_ai_models():
    if ai_chat_instance:
        test_result = ai_chat_instance.test_connection()
        if test_result["ollama"]:
            return api_response(data={"models": test_result["models"]})
        else:
            return api_response(
                success=False, error=test_result["error"], status_code=503
            )
    else:
        return api_response(
            success=False,
            error="AI Chat service not initialized",
            status_code=503,
        )


@app.route("/api/ai/install_model", methods=["POST"])
@handle_errors
def install_ai_model():
    data = request.json
    model_name = data.get("model_name")
    if not model_name:
        return api_response(
            success=False, error="Model name not provided", status_code=400
        )

    try:
        # Try to install via Ollama
        command = ["ollama", "pull", model_name]
        subprocess.run(
            command, capture_output=True, text=True, check=True
        )
        return api_response(
            data={"message": f"Model {model_name} installed successfully"}
        )
    except subprocess.CalledProcessError as e:
        return api_response(
            success=False,
            error=f"Failed to install model: {e.stderr}",
            status_code=500,
        )


def get_ai_tools_config():
    config_path = os.path.join(
        os.path.dirname(__file__), "..", "config", "ai_tools.json"
    )
    if os.path.exists(config_path):
        with open(config_path, "r") as f:
            return json.load(f)
    return {}


def save_ai_tools_config(tools):
    config_path = os.path.join(
        os.path.dirname(__file__), "..", "config", "ai_tools.json"
    )
    os.makedirs(os.path.dirname(config_path), exist_ok=True)
    with open(config_path, "w") as f:
        json.dump(tools, f, indent=4)


@app.route("/api/ai_tools", methods=["GET"])
@handle_errors
def list_ai_tools():
    tools = get_ai_tools_config()
    return api_response(data={"tools": tools})


@app.route("/api/ai_tools", methods=["POST"])
@handle_errors
def add_ai_tool():
    new_tool = request.json
    tools = get_ai_tools_config()
    tool_id = str(len(tools))
    tools[tool_id] = new_tool
    save_ai_tools_config(tools)
    return api_response(
        data={"message": "AI tool added successfully", "id": tool_id},
        status_code=201,
    )


@app.route("/api/ai_tools/<tool_id>", methods=["PUT"])
@handle_errors
def update_ai_tool(tool_id):
    updated_tool = request.json
    tools = get_ai_tools_config()
    if tool_id not in tools:
        return api_response(
            success=False, error="Tool not found", status_code=404
        )
    tools[tool_id] = updated_tool
    save_ai_tools_config(tools)
    return api_response(data={"message": "AI tool updated successfully"})


@app.route("/api/ai_tools/<tool_id>", methods=["DELETE"])
@handle_errors
def delete_ai_tool(tool_id):
    tools = get_ai_tools_config()
    if tool_id not in tools:
        return api_response(
            success=False, error="Tool not found", status_code=404
        )
    del tools[tool_id]
    save_ai_tools_config(tools)
    return api_response(data={"message": "AI tool deleted successfully"})


@app.route("/api/joke", methods=["GET"])
@handle_errors
def get_joke():
    headers = {"Accept": "application/json"}
    response = requests.get("https://icanhazdadjoke.com/", headers=headers)
    response.raise_for_status()
    joke_data = response.json()
    return api_response(data={"joke": joke_data["joke"]})


# Add proper error handlers
@app.errorhandler(404)
def not_found_error(error):
    return api_response(
        success=False, error="Resource not found", status_code=404
    )


@app.errorhandler(500)
def internal_error(error):
    return api_response(
        success=False, error="Internal server error", status_code=500
    )


if __name__ == "__main__":
    # This block is for direct execution of the server, for debugging.
    # The main application entry point is run.py
    print("Starting Flask server for debugging...")
    app.run(debug=True, port=5000, host="127.0.0.1")


# ================================
# CLOUDFLARE WORKERS AI ENDPOINTS
# ================================

@app.route('/api/cloudflare-ai', methods=['POST'])
def cloudflare_ai_endpoint():
    """Endpoint dla Cloudflare Workers AI"""
    if not cloudflare_ai:
        return jsonify({
            "success": False,
            "error": "Cloudflare Workers AI nie jest skonfigurowane"
        }), 503

    try:
        data = request.get_json()
        prompt = data.get('prompt', '').strip()
        model = data.get('model', '@cf/meta/llama-3.1-8b-instruct')
        max_tokens = data.get('max_tokens', 512)
        temperature = data.get('temperature', 0.7)

        if not prompt:
            return jsonify({
                "success": False,
                "error": "Prompt jest wymagany"
            }), 400

        logger.info(f"Cloudflare AI request: {prompt[:100]}...")
        result = cloudflare_ai.generate_text(
            prompt=prompt,
            model=model,
            max_tokens=max_tokens,
            temperature=temperature
        )

        return jsonify(result)

    except Exception as e:
        logger.error(f"Cloudflare AI endpoint error: {e}")
        return jsonify({
            "success": False,
            "error": "Błąd wewnętrzny serwera"
        }), 500


@app.route('/api/cloudflare-ai/models', methods=['GET'])
def cloudflare_models():
    """Lista dostępnych modeli Cloudflare Workers AI"""
    if not cloudflare_ai:
        return jsonify({
            "success": False,
            "error": "Cloudflare Workers AI nie jest skonfigurowane"
        }), 503

    try:
        result = cloudflare_ai.list_available_models()
        return jsonify(result)
    except Exception as e:
        logger.error(f"Cloudflare models endpoint error: {e}")
        return jsonify({
            "success": False,
            "error": "Błąd wewnętrzny serwera"
        }), 500


@app.route('/api/cloudflare-ai/test', methods=['GET'])
def cloudflare_test():
    """Test połączenia z Cloudflare Workers AI"""
    if not cloudflare_ai:
        return jsonify({
            "success": False,
            "message": "Cloudflare Workers AI nie jest skonfigurowane"
        }), 503

    try:
        result = cloudflare_ai.test_connection()
        return jsonify(result)
    except Exception as e:
        logger.error(f"Cloudflare test endpoint error: {e}")
        return jsonify({
            "success": False,
            "message": f"Błąd testu: {str(e)}"
        }), 500
