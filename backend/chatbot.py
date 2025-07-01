import ollama
import json
import os

class AIChat:
    def __init__(self):
        self.config = self.load_config()
        self.model = None
        self.initialize_model()

    def load_config(self):
        config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'config.json')
        if os.path.exists(config_path):
            with open(config_path, 'r') as f:
                return json.load(f)
        return {}

    def initialize_model(self):
        if self.config.get('ollama_api_key'):
            self.model = 'ollama'
        elif self.config.get('openai_api_key'):
            self.model = 'openai'
        elif self.config.get('model_path'):
            self.model = 'local'
        else:
            self.model = None

    def get_response(self, user_input):
        if not user_input:
            return "Please provide a message."
        if not self.model:
            return "AI model not configured. Please configure it in the AI Chat settings."

        system_prompt = self.config.get('system_prompt', '')
        file_paths = self.config.get('file_paths', [])
        file_contents = ""
        for file_path in file_paths:
            try:
                with open(file_path, 'r') as f:
                    file_contents += f.read() + "\n"
            except Exception as e:
                print(f"Error reading file {file_path}: {e}")

        full_prompt = f"{system_prompt}\n\n{file_contents}\n\nUser: {user_input}"

        if self.model == 'ollama':
            return self.get_ollama_response(full_prompt)
        elif self.model == 'openai':
            return self.get_openai_response(full_prompt)
        elif self.model == 'local':
            return self.get_local_response(full_prompt)
        else:
            return "Invalid AI model configuration."

    def get_ollama_response(self, user_input):
        try:
            # This is a placeholder for Ollama API interaction.
            # You would typically use a library like 'requests' to call the Ollama API.
            return f"Ollama response for: {user_input}"
        except Exception as e:
            return f"Error getting Ollama response: {e}"

    def get_openai_response(self, user_input):
        try:
            # This is a placeholder for OpenAI API interaction.
            # You would typically use the 'openai' library to call the OpenAI API.
            return f"OpenAI response for: {user_input}"
        except Exception as e:
            return f"Error getting OpenAI response: {e}"

    def get_local_response(self, user_input):
        try:
            # This is a placeholder for local model interaction.
            # You would need to implement the logic to load and run a local model.
            return f"Local model response for: {user_input}"
        except Exception as e:
            return f"Error getting local model response: {e}"

# Usunięto definicję ścieżki @app.route i funkcji chat() z tego pliku
