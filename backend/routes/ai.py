from flask import Blueprint, jsonify, request
import subprocess
import os
import shutil
import json
ai_bp = Blueprint('ai', __name__)

def get_ai_tools_config():
    config_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "config", "ai_tools.json"
    )
    if os.path.exists(config_path):
        with open(config_path, "r") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return {"version": "1.0.0", "tools": {}}
    return {"version": "1.0.0", "tools": {}}


def save_ai_tools_config(config):
    config_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "config", "ai_tools.json"
    )
    os.makedirs(os.path.dirname(config_path), exist_ok=True)
    with open(config_path, "w") as f:
        json.dump(config, f, indent=4)


@ai_bp.route("/api/ai/list_models", methods=["GET"])
def list_ai_models():
    try:
        # Placeholder for listing Ollama models
        # In a real scenario, you'd run 'ollama list' and parse its output
        ollama_models = ["llama2", "mistral", "codellama"]

        # Placeholder for listing local models from a directory
        # You would define a configurable path for local models
        local_models_path = os.path.join(
            os.path.dirname(__file__), "..", "..", "models"
        )
        local_models = []
        if os.path.exists(local_models_path):
            for f in os.listdir(local_models_path):
                if f.endswith((".bin", ".gguf")):
                    local_models.append(f)

        all_models = sorted(list(set(ollama_models + local_models)))
        return jsonify({"models": all_models})
    except Exception as e:
        print(f"Error listing AI models: {e}")
        return jsonify({"error": "Could not list AI models"}), 500


@ai_bp.route("/api/ai/install_model", methods=["POST"])
def install_ai_model():
    try:
        data = request.json
        model_name = data.get("model_name")
        if not model_name:
            return jsonify({
                "success": False, "error": "Model name not provided"
            }), 400

        # Check if it's an Ollama model or a local path
        is_path = any(c in model_name for c in ["/", "\\", "."])
        if is_path:  # Simple check for path/file
            # Assume it's a local path, copy to the models directory
            # NOTE: This is a simplified example.
            source_path = model_name
            destination_dir = os.path.join(
                os.path.dirname(__file__), "..", "..", "models"
            )
            os.makedirs(destination_dir, exist_ok=True)
            destination_path = os.path.join(
                destination_dir, os.path.basename(source_path)
            )
            shutil.copy(source_path, destination_path)
            return jsonify(
                {
                    "success": True,
                    "message": f"Local model {model_name} installed."
                }
            )
        else:
            # Assume it's an Ollama model, run ollama pull
            command = ["ollama", "pull", model_name]
            process = subprocess.run(
                command, capture_output=True, text=True, check=True
            )
            return jsonify({
                "success": True, "message": process.stdout.strip()
            })
    except subprocess.CalledProcessError as e:
        print(f"Error installing Ollama model: {e.stderr}")
        return jsonify({"success": False, "error": e.stderr.strip()}), 500
    except Exception as e:
        print(f"Error installing AI model: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@ai_bp.route("/api/ai_tools", methods=["GET"])
def list_ai_tools():
    try:
        config = get_ai_tools_config()
        return jsonify(config)
    except Exception as e:
        print(f"Error listing AI tools: {e}")
        return jsonify({"error": "Could not list AI tools"}), 500


@ai_bp.route("/api/ai_tools", methods=["POST"])
def add_ai_tool():
    try:
        new_tool_data = request.json
        config = get_ai_tools_config()

        # Generate a simple unique ID from the name
        tool_name = new_tool_data.get("name", "").lower().replace(" ", "_")
        tool_id = tool_name
        i = 1
        while tool_id in config["tools"]:
            tool_id = f"{tool_name}_{i}"
            i += 1

        config["tools"][tool_id] = new_tool_data
        save_ai_tools_config(config)
        return (
            jsonify(
                {
                    "success": True,
                    "message": "AI tool added successfully",
                    "tool_id": tool_id,
                }
            ),
            201,
        )
    except Exception as e:
        print(f"Error adding AI tool: {e}")
        return jsonify({
            "success": False, "error": "Could not add AI tool"
        }), 500


@ai_bp.route("/api/ai_tools/<string:tool_id>", methods=["PUT"])
def update_ai_tool(tool_id):
    try:
        updated_tool = request.json
        config = get_ai_tools_config()
        if tool_id not in config["tools"]:
            return jsonify({"success": False, "error": "Tool not found"}), 404
        config["tools"][tool_id] = updated_tool
        save_ai_tools_config(config)
        return jsonify({
            "success": True, "message": "AI tool updated successfully"
        })
    except Exception as e:
        print(f"Error updating AI tool: {e}")
        return jsonify({
            "success": False, "error": "Could not update AI tool"
        }), 500


@ai_bp.route("/api/ai_tools/<string:tool_id>", methods=["DELETE"])
def delete_ai_tool(tool_id):
    try:
        config = get_ai_tools_config()
        if tool_id not in config["tools"]:
            return jsonify({"success": False, "error": "Tool not found"}), 404
        del config["tools"][tool_id]
        save_ai_tools_config(config)
        return jsonify({
            "success": True, "message": "AI tool deleted successfully"
        })
    except Exception as e:
        print(f"Error deleting AI tool: {e}")
        return jsonify({
            "success": False, "error": "Could not delete AI tool"
        }), 500


