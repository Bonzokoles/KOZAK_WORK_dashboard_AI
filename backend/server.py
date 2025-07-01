from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
from chatbot import AIChat
from weather_integration import WeatherAPI
from dotenv import load_dotenv
import psutil
import GPUtil
import tempfile
import shutil
import json
import speedtest
import ping3
import platform
import subprocess

# Load environment variables
load_dotenv()

app = Flask(__name__,
    template_folder='../frontend/templates',
    static_folder='../frontend/static'
)
CORS(app)

# Initialize AI Chat and Weather API (consider initializing once if possible)
# Initialize only if needed, or handle potential errors if Ollama/API key are missing
ai_chat_instance = AIChat()
weather_api_instance = WeatherAPI(os.getenv('WEATHER_API_KEY'))


@app.route('/')
def index():
    return render_template('dashboard.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message', '')
    response = ai_chat_instance.get_response(user_message)
    return jsonify({'response': response})

@app.route('/api/weather', methods=['GET'])
def weather():
    # Default city, you might want to make this dynamic
    city = request.args.get('city', 'Warsaw')
    weather_data = weather_api_instance.get_weather(city)
    return jsonify(weather_data)

@app.route('/api/system/resources', methods=['GET'])
def system_resources():
    try:
        cpu_percent = psutil.cpu_percent(interval=0.5)
        memory_percent = psutil.virtual_memory().percent
        disk_percent = psutil.disk_usage(os.path.splitdrive(os.getcwd())[0] + '\\').percent
        
        gpus = GPUtil.getGPUs()
        gpu_usage = gpus[0].load * 100 if gpus else 0
        gpu_memory_percent = gpus[0].memoryUtil * 100 if gpus else 0

        return jsonify({
            'cpu_percent': cpu_percent,
            'memory_percent': memory_percent,
            'disk_percent': disk_percent,
            'gpu_usage': gpu_usage,
            'gpu_memory_percent': gpu_memory_percent,
            'timestamp': psutil.boot_time()
        })
    except Exception as e:
        print(f"Error fetching system resources: {e}")
        return jsonify({'error': 'Could not fetch system resources'}), 500

@app.route('/api/system/cleanup', methods=['POST'])
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
                print(f'Failed to delete {file_path}. Reason: {e}')
        return jsonify({'message': 'System cleanup successful'})
    except Exception as e:
        print(f"Error during system cleanup: {e}")
        return jsonify({'error': 'Could not perform system cleanup'}), 500

@app.route('/api/config/ai', methods=['POST'])
def save_ai_config():
    try:
        config_data = request.json
        config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'config.json')
        
        # Create the directory if it doesn't exist
        os.makedirs(os.path.dirname(config_path), exist_ok=True)

        with open(config_path, 'w') as f:
            json.dump(config_data, f, indent=4)
            
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error saving AI config: {e}")
        return jsonify({'success': False}), 500

@app.route('/api/network/stats', methods=['GET'])
def network_stats():
    try:
        s = speedtest.Speedtest()
        s.get_best_server()
        s.download()
        s.upload()
        res = s.results.dict()
        return jsonify({
            'download': res['download'] / 1024 / 1024,  # Mbps
            'upload': res['upload'] / 1024 / 1024,  # Mbps
            'ping': res['ping']
        })
    except Exception as e:
        print(f"Error getting network stats: {e}")
        return jsonify({'error': 'Could not get network stats'}), 500

@app.route('/api/system/processes', methods=['GET'])
def system_processes():
    try:
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'username', 'cpu_percent', 'memory_percent']):
            processes.append(proc.info)
        # Sort by cpu_percent by default
        processes = sorted(processes, key=lambda p: p['cpu_percent'], reverse=True)[:10]
        return jsonify(processes)
    except Exception as e:
        print(f"Error getting system processes: {e}")
        return jsonify({'error': 'Could not get system processes'}), 500

@app.route('/api/system/info', methods=['GET'])
def system_info():
    try:
        return jsonify({
            'hostname': platform.uname().node,
            'os': platform.uname().system,
            'uptime': psutil.boot_time()
        })
    except Exception as e:
        print(f"Error getting system info: {e}")
        return jsonify({'error': 'Could not get system info'}), 500

@app.route('/api/ai/list_models', methods=['GET'])
def list_ai_models():
    try:
        # Placeholder for listing Ollama models
        # In a real scenario, you'd run 'ollama list' and parse its output
        ollama_models = ["llama2", "mistral", "codellama"]
        
        # Placeholder for listing local models from a directory
        # You would define a configurable path for local models
        local_models_path = os.path.join(os.path.dirname(__file__), '..', 'models')
        local_models = []
        if os.path.exists(local_models_path):
            for f in os.listdir(local_models_path):
                if f.endswith(('.bin', '.gguf')):
                    local_models.append(f)

        return jsonify({'models': sorted(list(set(ollama_models + local_models)))}))
    except Exception as e:
        print(f"Error listing AI models: {e}")
        return jsonify({'error': 'Could not list AI models'}), 500

@app.route('/api/ai/install_model', methods=['POST'])
def install_ai_model():
    try:
        data = request.json
        model_name = data.get('model_name')
        if not model_name:
            return jsonify({'success': False, 'error': 'Model name not provided'}), 400

        # Check if it's an Ollama model or a local path
        if '/' in model_name or '\\' in model_name or '.' in model_name: # Simple check for path/file
            # Assume it's a local path, copy the file to the models directory
            # This is a simplified example, proper file handling and security is needed
            source_path = model_name
            destination_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
            os.makedirs(destination_dir, exist_ok=True)
            destination_path = os.path.join(destination_dir, os.path.basename(source_path))
            shutil.copy(source_path, destination_path)
            return jsonify({'success': True, 'message': f'Local model {model_name} installed.'})
        else:
            # Assume it's an Ollama model, run ollama pull
            command = ["ollama", "pull", model_name]
            process = subprocess.run(command, capture_output=True, text=True, check=True)
            return jsonify({'success': True, 'message': process.stdout.strip()})
    except subprocess.CalledProcessError as e:
        print(f"Error installing Ollama model: {e.stderr}")
        return jsonify({'success': False, 'error': e.stderr.strip()}), 500
    except Exception as e:
        print(f"Error installing AI model: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


def get_ai_tools_config():
    config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'ai_tools.json')
    if os.path.exists(config_path):
        with open(config_path, 'r') as f:
            return json.load(f)
    return []

def save_ai_tools_config(tools):
    config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'ai_tools.json')
    os.makedirs(os.path.dirname(config_path), exist_ok=True)
    with open(config_path, 'w') as f:
        json.dump(tools, f, indent=4)

@app.route('/api/ai_tools', methods=['GET'])
def list_ai_tools():
    try:
        tools = get_ai_tools_config()
        return jsonify(tools)
    except Exception as e:
        print(f"Error listing AI tools: {e}")
        return jsonify({'error': 'Could not list AI tools'}), 500

@app.route('/api/ai_tools', methods=['POST'])
def add_ai_tool():
    try:
        new_tool = request.json
        tools = get_ai_tools_config()
        tools.append(new_tool)
        save_ai_tools_config(tools)
        return jsonify({'success': True, 'message': 'AI tool added successfully'}), 201
    except Exception as e:
        print(f"Error adding AI tool: {e}")
        return jsonify({'success': False, 'error': 'Could not add AI tool'}), 500

@app.route('/api/ai_tools/<int:tool_id>', methods=['PUT'])
def update_ai_tool(tool_id):
    try:
        updated_tool = request.json
        tools = get_ai_tools_config()
        if tool_id < 0 or tool_id >= len(tools):
            return jsonify({'success': False, 'error': 'Tool not found'}), 404
        tools[tool_id] = updated_tool
        save_ai_tools_config(tools)
        return jsonify({'success': True, 'message': 'AI tool updated successfully'})
    except Exception as e:
        print(f"Error updating AI tool: {e}")
        return jsonify({'success': False, 'error': 'Could not update AI tool'}), 500

@app.route('/api/ai_tools/<int:tool_id>', methods=['DELETE'])
def delete_ai_tool(tool_id):
    try:
        tools = get_ai_tools_config()
        if tool_id < 0 or tool_id >= len(tools):
            return jsonify({'success': False, 'error': 'Tool not found'}), 404
        del tools[tool_id]
        save_ai_tools_config(tools)
        return jsonify({'success': True, 'message': 'AI tool deleted successfully'})
    except Exception as e:
        print(f"Error deleting AI tool: {e}")
        return jsonify({'success': False, 'error': 'Could not delete AI tool'}), 500

@app.route('/api/joke', methods=['GET'])
def get_joke():
    try:
        headers = {'Accept': 'application/json'}
        response = requests.get('https://icanhazdadjoke.com/', headers=headers)
        response.raise_for_status()  # Raise an exception for bad status codes
        joke_data = response.json()
        return jsonify({'joke': joke_data['joke']})
    except requests.exceptions.RequestException as e:
        print(f"Error fetching joke: {e}")
        return jsonify({'error': 'Could not fetch joke'}), 500


if __name__ == '__main__':
    print("Starting Flask server...")
    app.run(debug=True, port=5000, host='127.0.0.1')