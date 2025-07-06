import requests
import logging
import json
from typing import Dict, Any, List, Optional
from .tools import KOZAKTools

logger = logging.getLogger(__name__)


class CloudflareAI:
    def __init__(self, account_id: str, api_token: str, weather_api_key: str = None):
        self.account_id = account_id
        self.api_token = api_token
        base_url = "https://api.cloudflare.com/client/v4/accounts"
        self.base_url = f"{base_url}/{account_id}/ai/run"
        self.headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        }
        
        # Initialize KOZAK Tools
        self.tools = KOZAKTools(weather_api_key=weather_api_key)
        
        # Function calling model
        self.function_calling_model = "@hf/nousresearch/hermes-2-pro-mistral-7b"

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

    def generate_with_tools(
        self,
        messages: List[Dict[str, str]],
        tools: Optional[List[str]] = None,
        max_tokens: int = 512,
        temperature: float = 0.7,
        max_tool_rounds: int = 3
    ) -> Dict[str, Any]:
        """
        Generuje odpowiedź z możliwością używania narzędzi (function calling)
        
        Args:
            messages: Lista wiadomości w formacie [{"role": "user/assistant", "content": "..."}]
            tools: Lista nazw narzędzi do udostępnienia (None = wszystkie)
            max_tokens: Maksymalna liczba tokenów
            temperature: Temperatura generowania
            max_tool_rounds: Maksymalna liczba rund używania narzędzi
        """
        
        # Przygotuj dostępne narzędzia
        available_tools = self.tools.get_available_tools()
        if tools:
            available_tools = [t for t in available_tools if t["name"] in tools]
        
        conversation_history = messages.copy()
        tool_calls_made = []
        
        for round_num in range(max_tool_rounds):
            try:
                logger.info(f"Function calling round {round_num + 1}")
                
                # Wywołaj model z dostępnymi narzędziami
                url = f"{self.base_url}/{self.function_calling_model}"
                
                payload = {
                    "messages": conversation_history,
                    "tools": available_tools,
                    "max_tokens": max_tokens,
                    "temperature": temperature
                }
                
                response = requests.post(
                    url, headers=self.headers, json=payload, timeout=30
                )
                response.raise_for_status()
                result = response.json()
                
                if not result.get("success"):
                    return {
                        "success": False,
                        "error": result.get("errors", ["Unknown error"])
                    }
                
                ai_response = result["result"]["response"]
                tool_calls = result["result"].get("tool_calls", [])
                
                # Dodaj odpowiedź AI do historii
                conversation_history.append({
                    "role": "assistant", 
                    "content": ai_response
                })
                
                # Jeśli nie ma tool calls, zwróć finalną odpowiedź
                if not tool_calls:
                    return {
                        "success": True,
                        "response": ai_response,
                        "conversation_history": conversation_history,
                        "tool_calls_made": tool_calls_made,
                        "rounds": round_num + 1,
                        "model": self.function_calling_model
                    }
                
                # Wykonaj wszystkie tool calls
                tool_results = []
                for tool_call in tool_calls:
                    tool_name = tool_call.get("name")
                    tool_args = tool_call.get("arguments", {})
                    
                    logger.info(f"Executing tool: {tool_name} with args: {tool_args}")
                    
                    # Wykonaj narzędzie
                    tool_result = self.tools.execute_tool(tool_name, tool_args)
                    tool_results.append({
                        "tool_call": tool_call,
                        "result": tool_result
                    })
                    
                    tool_calls_made.append({
                        "round": round_num + 1,
                        "tool_name": tool_name,
                        "arguments": tool_args,
                        "result": tool_result
                    })
                
                # Dodaj wyniki narzędzi do konwersacji
                tools_summary = self._format_tool_results(tool_results)
                conversation_history.append({
                    "role": "user",
                    "content": f"Wyniki narzędzi: {tools_summary}"
                })
                
            except requests.exceptions.Timeout:
                return {
                    "success": False,
                    "error": "Request timeout podczas function calling"
                }
            except Exception as e:
                logger.error(f"Function calling error: {str(e)}")
                return {
                    "success": False,
                    "error": f"Błąd function calling: {str(e)}"
                }
        
        # Jeśli osiągnięto max rounds
        return {
            "success": False,
            "error": f"Osiągnięto maksimum rund narzędzi ({max_tool_rounds})",
            "tool_calls_made": tool_calls_made
        }
    
    def _format_tool_results(self, tool_results: List[Dict]) -> str:
        """Formatuje wyniki narzędzi dla modelu AI"""
        formatted = []
        
        for tr in tool_results:
            tool_call = tr["tool_call"]
            result = tr["result"]
            
            if result.get("success"):
                formatted.append(
                    f"{tool_call['name']}: {json.dumps(result['result'], ensure_ascii=False)}"
                )
            else:
                formatted.append(
                    f"{tool_call['name']}: BŁĄD - {result.get('error', 'Unknown error')}"
                )
        
        return " | ".join(formatted)

    def get_available_tools_info(self) -> Dict[str, Any]:
        """Zwraca informacje o dostępnych narzędziach"""
        tools = self.tools.get_available_tools()
        return {
            "success": True,
            "tools": tools,
            "total_tools": len(tools),
            "model": self.function_calling_model
        }
