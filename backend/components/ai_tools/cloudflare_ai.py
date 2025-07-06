import requests
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)


class CloudflareAI:
    def __init__(self, account_id: str, api_token: str):
        self.account_id = account_id
        self.api_token = api_token
        base_url = "https://api.cloudflare.com/client/v4/accounts"
        self.base_url = f"{base_url}/{account_id}/ai/run"
        self.headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        }

    def generate_text(
        self,
        prompt: str,
        model: str = "@cf/meta/llama-3.1-8b-instruct",
        max_tokens: int = 512,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """Generuje tekst używając Cloudflare Workers AI"""

        url = f"{self.base_url}/{model}"

        payload = {
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "max_tokens": max_tokens,
            "temperature": temperature
        }

        try:
            logger.info(f"Cloudflare AI request to {model}: {prompt[:50]}...")
            response = requests.post(
                url, headers=self.headers, json=payload, timeout=30
            )
            response.raise_for_status()

            result = response.json()

            if result.get("success"):
                response_text = result["result"]["response"]
                logger.info(
                    f"Cloudflare AI response: {response_text[:100]}..."
                )
                return {
                    "success": True,
                    "response": response_text,
                    "model": model,
                    "usage": result.get("result", {}).get("usage", {}),
                    "provider": "cloudflare"
                }
            else:
                error_msg = result.get("errors", ["Unknown error"])
                logger.error(f"Cloudflare AI API error: {error_msg}")
                return {
                    "success": False,
                    "error": error_msg
                }

        except requests.exceptions.Timeout:
            logger.error("Cloudflare AI request timeout")
            return {
                "success": False,
                "error": "Request timeout - spróbuj ponownie"
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"Cloudflare AI request failed: {str(e)}")
            return {
                "success": False,
                "error": f"Błąd połączenia: {str(e)}"
            }
        except Exception as e:
            logger.error(f"Cloudflare AI unexpected error: {str(e)}")
            return {
                "success": False,
                "error": f"Nieoczekiwany błąd: {str(e)}"
            }

    def list_available_models(self) -> Dict[str, Any]:
        """Lista dostępnych modeli Cloudflare Workers AI"""
        return {
            "success": True,
            "models": [
                {
                    "id": "@cf/meta/llama-3.1-8b-instruct",
                    "name": "Llama 3.1 8B Instruct",
                    "description": "Zaawansowany model językowy Meta"
                },
                {
                    "id": "@cf/meta/llama-3.2-11b-vision-instruct",
                    "name": "Llama 3.2 11B Vision",
                    "description": "Model z obsługą obrazów"
                },
                {
                    "id": "@cf/mistral/mistral-7b-instruct-v0.1",
                    "name": "Mistral 7B Instruct",
                    "description": "Wydajny model Mistral AI"
                },
                {
                    "id": "@cf/microsoft/phi-2",
                    "name": "Microsoft Phi-2",
                    "description": "Kompaktowy model Microsoft"
                }
            ]
        }

    def test_connection(self) -> Dict[str, Any]:
        """Test połączenia z Cloudflare Workers AI"""
        try:
            response = self.generate_text(
                "Test connection. Odpowiedz krótko 'OK'."
            )
            if response.get("success"):
                return {
                    "success": True,
                    "message": "Połączenie z Cloudflare Workers AI "
                               "działa poprawnie",
                    "response": response.get("response", "")
                }
            else:
                return {
                    "success": False,
                    "message": "Błąd połączenia z Cloudflare Workers AI",
                    "error": response.get("error")
                }
        except Exception as e:
            return {
                "success": False,
                "message": f"Test połączenia nieudany: {str(e)}"
            }
