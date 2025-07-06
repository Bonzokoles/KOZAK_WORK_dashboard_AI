import ollama
import json
import os
import requests
from typing import Optional, Dict, Any


class AIChat:
    def __init__(self):
        self.config = self.load_config()
        self.model = None
        self.ollama_url = "http://localhost:11434"
        self.polish_model = "bielik:7b"  # Polish model
        self.code_model = "codellama:7b"  # Code model
        self.initialize_model()

    def load_config(self) -> Dict[str, Any]:
        """Load configuration from config.json"""
        config_path = os.path.join(
            os.path.dirname(__file__), "..", "config", "config.json"
        )
        if os.path.exists(config_path):
            try:
                with open(config_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError) as e:
                print(f"Error loading config: {e}")
                return {}
        return {}

    def initialize_model(self):
        """Initialize the AI model based on configuration"""
        if self.config.get("ollama_api_key"):
            self.model = "ollama"
        elif self.config.get("openai_api_key"):
            self.model = "openai"
        elif self.config.get("model_path"):
            self.model = "local"
        else:
            self.model = "ollama"  # Default to ollama

    def get_response(self, user_input: str) -> str:
        """Get AI response for user input"""
        if not user_input or not user_input.strip():
            return "Proszę podać wiadomość."

        user_input = user_input.strip()

        # Detect language and use appropriate model
        if self.is_polish_input(user_input):
            return self.get_polish_response(user_input)
        else:
            return self.get_standard_response(user_input)

    def is_polish_input(self, text: str) -> bool:
        """Detect if text is in Polish"""
        polish_chars = set("ąćęłńóśźżĄĆĘŁŃÓŚŹŻ")
        polish_words = [
            "jak",
            "co",
            "gdzie",
            "kiedy",
            "dlaczego",
            "czy",
            "jest",
            "się",
            "na",
            "do",
            "w",
            "z",
            "i",
            "a",
            "ale",
            "że",
            "to",
            "nie",
            "tak",
            "bardzo",
            "może",
            "można",
            "będzie",
            "było",
            "mam",
            "masz",
            "ma",
        ]

        text_lower = text.lower()

        # Check for Polish characters
        has_polish_chars = any(char in polish_chars for char in text)

        # Check for Polish words
        words = text_lower.split()
        polish_word_count = sum(1 for word in words if word in polish_words)
        has_polish_words = polish_word_count > 0

        return has_polish_chars or has_polish_words

    def get_polish_response(self, user_input: str) -> str:
        """Get response using Polish model"""
        try:
            # Try to use Polish model first
            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": self.polish_model,
                    "prompt": f"Odpowiedz po polsku na pytanie: {user_input}",
                    "stream": False,
                    "options": {"temperature": 0.7, "top_p": 0.9, "max_tokens": 512},
                },
                timeout=30,
            )

            if response.status_code == 200:
                result = response.json()
                return result.get("response", "Brak odpowiedzi z modelu.")
            else:
                # Fallback to standard model with Polish prompt
                return self.get_standard_response(f"Odpowiedz po polsku: {user_input}")

        except requests.exceptions.ConnectionError:
            return (
                "Błąd: Ollama server nie odpowiada. Sprawdź czy działa na porcie 11434."
            )
        except requests.exceptions.Timeout:
            return "Błąd: Timeout - model zbyt długo generuje odpowiedź."
        except Exception as e:
            print(f"Error in Polish response: {e}")
            return f"Błąd polskiego modelu: {e}"

    def get_standard_response(self, user_input: str) -> str:
        """Get standard response for English or fallback"""
        system_prompt = self.config.get(
            "system_prompt", "You are a helpful AI assistant."
        )
        file_paths = self.config.get("file_paths", [])
        file_contents = ""

        # Read file contents if specified
        for file_path in file_paths:
            try:
                if os.path.exists(file_path):
                    with open(file_path, "r", encoding="utf-8") as f:
                        file_contents += f"\\n--- File: {file_path} ---\\n"
                        file_contents += f.read() + "\\n"
            except Exception as e:
                print(f"Error reading file {file_path}: {e}")

        full_prompt = f"{system_prompt}\\n\\n{file_contents}\\n\\nUser: {user_input}"

        if self.model == "ollama":
            return self.get_ollama_response(full_prompt)
        elif self.model == "openai":
            return self.get_openai_response(full_prompt)
        elif self.model == "local":
            return self.get_local_response(full_prompt)
        else:
            return (
                "AI model not configured. Please configure it in the AI Chat settings."
            )

    def get_ollama_response(self, user_input: str) -> str:
        """Get response from Ollama"""
        try:
            model_to_use = self.config.get("ollama_model", "llama3.2:latest")

            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": model_to_use,
                    "prompt": user_input,
                    "stream": False,
                    "options": {"temperature": 0.7, "top_p": 0.9},
                },
                timeout=30,
            )

            if response.status_code == 200:
                result = response.json()
                return result.get("response", "No response from model.")
            else:
                return f"Ollama API error: {response.status_code}"

        except requests.exceptions.ConnectionError:
            return "Error: Ollama server not responding. Check if it's running on port 11434."
        except requests.exceptions.Timeout:
            return "Error: Request timeout - model taking too long to respond."
        except Exception as e:
            print(f"Error in Ollama response: {e}")
            return f"Error getting Ollama response: {e}"

    def cleanup_code(self, code_text: str) -> str:
        """Clean up and format code using a code model"""
        try:
            prompt = f"""Clean up and format this code, fix any obvious issues, add proper comments:

{code_text}

Return only the cleaned code:"""

            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": self.code_model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.1,  # Low temperature for consistency
                        "top_p": 0.8,
                    },
                },
                timeout=45,
            )

            if response.status_code == 200:
                result = response.json()
                return result.get("response", "Nie udało się uporządkować kodu.")
            else:
                return f"Błąd czyszczenia kodu: {response.status_code}"

        except Exception as e:
            print(f"Error in cleanup_code: {e}")
            return f"Błąd funkcji cleanup_code: {e}"

    def get_openai_response(self, user_input: str) -> str:
        """Get response from OpenAI API (placeholder)"""
        try:
            # This would require the openai library and proper API key handling
            return "OpenAI integration not implemented yet. Please use Ollama or local model."
        except Exception as e:
            return f"Error getting OpenAI response: {e}"

    def get_local_response(self, user_input: str) -> str:
        """Get response from local model (placeholder)"""
        try:
            # This would require local model loading and inference
            return "Local model integration not implemented yet. Please use Ollama."
        except Exception as e:
            return f"Error getting local model response: {e}"

    def test_connection(self) -> Dict[str, Any]:
        """Test connection to AI services"""
        results = {"ollama": False, "models": [], "error": None}

        try:
            # Test Ollama connection
            response = requests.get(f"{self.ollama_url}/api/tags", timeout=5)
            if response.status_code == 200:
                results["ollama"] = True
                data = response.json()
                results["models"] = [model["name"] for model in data.get("models", [])]
            else:
                results["error"] = f"Ollama API returned status {response.status_code}"

        except requests.exceptions.ConnectionError:
            results["error"] = "Cannot connect to Ollama server"
        except Exception as e:
            results["error"] = str(e)

        return results
