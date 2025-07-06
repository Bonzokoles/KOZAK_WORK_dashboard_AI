"""
🚀 KOZAK Function Calling Tools
Advanced AI function library for Cloudflare Workers AI
"""

import os
import json
import subprocess
import requests
import psutil
import platform
import datetime
import math
import re
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)


class KOZAKTools:
    """Registry wszystkich dostępnych narzędzi AI"""
    
    def __init__(self, weather_api_key: str = None):
        self.weather_api_key = weather_api_key
        self.tools_registry = self._build_tools_registry()
    
    def _build_tools_registry(self) -> Dict[str, Dict]:
        """Buduje rejestr wszystkich dostępnych narzędzi"""
        return {
            "get_weather": {
                "name": "get_weather",
                "description": "Pobiera aktualne informacje o pogodzie dla podanej lokalizacji",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {
                            "type": "string",
                            "description": "Nazwa miasta lub lokalizacji (np. 'Warsaw, Poland')"
                        }
                    },
                    "required": ["location"]
                },
                "function": self.get_weather
            },
            "get_system_info": {
                "name": "get_system_info", 
                "description": "Zwraca informacje o systemie - CPU, RAM, dyski, OS",
                "parameters": {
                    "type": "object",
                    "properties": {},
                    "required": []
                },
                "function": self.get_system_info
            },
            "list_files": {
                "name": "list_files",
                "description": "Listuje pliki i foldery w podanej ścieżce",
                "parameters": {
                    "type": "object", 
                    "properties": {
                        "path": {
                            "type": "string",
                            "description": "Ścieżka do folderu (np. 'C:\\Users' lub '/home')"
                        }
                    },
                    "required": ["path"]
                },
                "function": self.list_files
            },
            "read_file": {
                "name": "read_file",
                "description": "Czyta zawartość pliku tekstowego",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "path": {
                            "type": "string", 
                            "description": "Ścieżka do pliku do odczytania"
                        },
                        "lines": {
                            "type": "number",
                            "description": "Maksymalna liczba linii do odczytania (domyślnie 100)"
                        }
                    },
                    "required": ["path"]
                },
                "function": self.read_file
            },
            "write_file": {
                "name": "write_file",
                "description": "Zapisuje tekst do pliku",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "path": {
                            "type": "string",
                            "description": "Ścieżka gdzie zapisać plik"
                        },
                        "content": {
                            "type": "string", 
                            "description": "Zawartość do zapisania"
                        },
                        "mode": {
                            "type": "string",
                            "description": "Tryb zapisu: 'write' (nadpisz) lub 'append' (dopisz)",
                            "enum": ["write", "append"]
                        }
                    },
                    "required": ["path", "content"]
                },
                "function": self.write_file
            },            "execute_command": {
                "name": "execute_command",
                "description": "Wykonuje komendę systemową (UWAGA: tylko bezpieczne komendy)",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "command": {
                            "type": "string",
                            "description": "Komenda do wykonania (np. 'dir', 'ls -la', 'ping google.com')"
                        },
                        "timeout": {
                            "type": "number", 
                            "description": "Timeout w sekundach (domyślnie 10)"
                        }
                    },
                    "required": ["command"]
                },
                "function": self.execute_command
            },
            "calculate": {
                "name": "calculate",
                "description": "Wykonuje obliczenia matematyczne",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "expression": {
                            "type": "string",
                            "description": "Wyrażenie matematyczne do obliczenia (np. '2+2', 'sqrt(16)', 'sin(3.14/2)')"
                        }
                    },
                    "required": ["expression"]
                },
                "function": self.calculate
            },
            "get_current_time": {
                "name": "get_current_time",
                "description": "Zwraca aktualną datę i czas", 
                "parameters": {
                    "type": "object",
                    "properties": {
                        "timezone": {
                            "type": "string",
                            "description": "Strefa czasowa (np. 'Europe/Warsaw', 'UTC')"
                        },
                        "format": {
                            "type": "string",
                            "description": "Format daty (np. '%Y-%m-%d %H:%M:%S')"
                        }
                    },
                    "required": []
                },
                "function": self.get_current_time
            },
            "search_web": {
                "name": "search_web",
                "description": "Wyszukuje informacje w internecie",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Zapytanie do wyszukania"
                        },
                        "num_results": {
                            "type": "number",
                            "description": "Liczba wyników (domyślnie 3)"
                        }
                    },
                    "required": ["query"]
                },
                "function": self.search_web
            },
            "get_process_list": {
                "name": "get_process_list",
                "description": "Zwraca listę uruchomionych procesów systemowych",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "filter_name": {
                            "type": "string", 
                            "description": "Filtruj procesy po nazwie (opcjonalne)"
                        },
                        "limit": {
                            "type": "number",
                            "description": "Maksymalna liczba procesów (domyślnie 20)"
                        }
                    },
                    "required": []
                },
                "function": self.get_process_list
            }
        }
    
    def get_available_tools(self) -> List[Dict]:
        """Zwraca listę dostępnych narzędzi dla modelu AI"""
        return [
            {
                "name": tool["name"],
                "description": tool["description"], 
                "parameters": tool["parameters"]
            }
            for tool in self.tools_registry.values()
        ]
    
    def execute_tool(self, tool_name: str, arguments: Dict) -> Dict[str, Any]:
        """Wykonuje narzędzie z podanymi argumentami"""
        if tool_name not in self.tools_registry:
            return {
                "success": False,
                "error": f"Nieznane narzędzie: {tool_name}"
            }
        
        try:
            tool = self.tools_registry[tool_name]
            result = tool["function"](**arguments)
            
            logger.info(f"Tool executed: {tool_name} with args: {arguments}")
            
            return {
                "success": True,
                "tool_name": tool_name,
                "result": result
            }
            
        except Exception as e:
            error_msg = f"Błąd wykonania narzędzia {tool_name}: {str(e)}"
            logger.error(error_msg)
            return {
                "success": False, 
                "error": error_msg
            }
    
    # ============================================
    # IMPLEMENTACJE NARZĘDZI
    # ============================================
    
    def get_weather(self, location: str) -> Dict[str, Any]:
        """Pobiera informacje o pogodzie"""
        if not self.weather_api_key:
            return {
                "error": "Brak klucza API do pogody",
                "location": location
            }
        
        try:
            url = f"http://api.openweathermap.org/data/2.5/weather"
            params = {
                "q": location,
                "appid": self.weather_api_key,
                "units": "metric",
                "lang": "pl"
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            return {
                "location": data["name"],
                "country": data["sys"]["country"], 
                "temperature": data["main"]["temp"],
                "feels_like": data["main"]["feels_like"],
                "humidity": data["main"]["humidity"],
                "pressure": data["main"]["pressure"],
                "description": data["weather"][0]["description"],
                "wind_speed": data["wind"]["speed"],
                "visibility": data.get("visibility", 0) / 1000  # km
            }
            
        except Exception as e:
            return {"error": f"Błąd pobierania pogody: {str(e)}"}
    
    def get_system_info(self) -> Dict[str, Any]:
        """Zwraca informacje o systemie"""
        try:
            # CPU info
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            cpu_freq = psutil.cpu_freq()
            
            # Memory info  
            memory = psutil.virtual_memory()
            
            # Disk info
            disk = psutil.disk_usage('/')
            
            # System info
            boot_time = datetime.datetime.fromtimestamp(psutil.boot_time())
            
            return {
                "os": platform.system(),
                "os_version": platform.release(),
                "cpu": {
                    "usage_percent": cpu_percent,
                    "cores": cpu_count,
                    "frequency_mhz": cpu_freq.current if cpu_freq else None
                },
                "memory": {
                    "total_gb": round(memory.total / (1024**3), 2),
                    "used_gb": round(memory.used / (1024**3), 2), 
                    "available_gb": round(memory.available / (1024**3), 2),
                    "usage_percent": memory.percent
                },
                "disk": {
                    "total_gb": round(disk.total / (1024**3), 2),
                    "used_gb": round(disk.used / (1024**3), 2),
                    "free_gb": round(disk.free / (1024**3), 2),
                    "usage_percent": round((disk.used / disk.total) * 100, 1)
                },
                "boot_time": boot_time.strftime("%Y-%m-%d %H:%M:%S")
            }
            
        except Exception as e:
            return {"error": f"Błąd pobierania info o systemie: {str(e)}"}
    
    def list_files(self, path: str) -> Dict[str, Any]:
        """Listuje pliki w podanej ścieżce"""
        try:
            if not os.path.exists(path):
                return {"error": f"Ścieżka nie istnieje: {path}"}
                
            if not os.path.isdir(path):
                return {"error": f"To nie jest folder: {path}"}
            
            items = []
            for item in os.listdir(path):
                item_path = os.path.join(path, item)
                try:
                    stat = os.stat(item_path)
                    is_dir = os.path.isdir(item_path)
                    
                    items.append({
                        "name": item,
                        "type": "directory" if is_dir else "file",
                        "size_bytes": stat.st_size if not is_dir else None,
                        "modified": datetime.datetime.fromtimestamp(
                            stat.st_mtime
                        ).strftime("%Y-%m-%d %H:%M:%S")
                    })
                except (OSError, IOError):
                    # Skip items we can't access
                    continue
            
            return {
                "path": path,
                "items": sorted(items, key=lambda x: (x["type"], x["name"].lower())),
                "total_items": len(items)
            }
            
        except Exception as e:
            return {"error": f"Błąd listowania plików: {str(e)}"}
    
    def read_file(self, path: str, lines: int = 100) -> Dict[str, Any]:
        """Czyta zawartość pliku"""
        try:
            if not os.path.exists(path):
                return {"error": f"Plik nie istnieje: {path}"}
                
            if not os.path.isfile(path):
                return {"error": f"To nie jest plik: {path}"}
            
            # Check file size (max 1MB)
            file_size = os.path.getsize(path)
            if file_size > 1024 * 1024:
                return {"error": f"Plik za duży ({file_size} bytes). Max 1MB."}
            
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                file_lines = f.readlines()
            
            # Limit lines
            if lines and lines > 0:
                file_lines = file_lines[:lines]
            
            content = ''.join(file_lines)
            
            return {
                "path": path,
                "content": content,
                "lines_read": len(file_lines),
                "file_size_bytes": file_size,
                "encoding": "utf-8"
            }
            
        except Exception as e:
            return {"error": f"Błąd odczytu pliku: {str(e)}"}
    
    def write_file(self, path: str, content: str, mode: str = "write") -> Dict[str, Any]:
        """Zapisuje zawartość do pliku"""
        try:
            # Security check - no system paths
            forbidden_paths = ['/etc', '/sys', '/proc', 'C:\\Windows', 'C:\\System32']
            if any(forbidden in path for forbidden in forbidden_paths):
                return {"error": "Dostęp do ścieżek systemowych zabroniony"}
            
            write_mode = "w" if mode == "write" else "a"
            
            with open(path, write_mode, encoding='utf-8') as f:
                f.write(content)
            
            file_size = os.path.getsize(path)
            
            return {
                "path": path,
                "bytes_written": len(content.encode('utf-8')),
                "file_size_bytes": file_size,
                "mode": mode,
                "success": True
            }
            
        except Exception as e:
            return {"error": f"Błąd zapisu pliku: {str(e)}"}
    
    def execute_command(self, command: str, timeout: int = 10) -> Dict[str, Any]:
        """Wykonuje komendę systemową (BEZPIECZNIE)"""
        try:
            # Security whitelist
            safe_commands = [
                'dir', 'ls', 'pwd', 'whoami', 'date', 'time', 'echo',
                'ping', 'ipconfig', 'ifconfig', 'netstat', 'ps',
                'top', 'df', 'du', 'free', 'uptime', 'uname'
            ]
            
            cmd_base = command.split()[0].lower()
            if not any(safe_cmd in cmd_base for safe_cmd in safe_commands):
                return {"error": f"Komenda '{cmd_base}' nie jest dozwolona"}
            
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            
            return {
                "command": command,
                "return_code": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "success": result.returncode == 0
            }
            
        except subprocess.TimeoutExpired:
            return {"error": f"Komenda przekroczyła timeout ({timeout}s)"}
        except Exception as e:
            return {"error": f"Błąd wykonania komendy: {str(e)}"}
    
    def calculate(self, expression: str) -> Dict[str, Any]:
        """Wykonuje bezpieczne obliczenia matematyczne"""
        try:
            # Remove spaces and validate
            expr = expression.replace(" ", "")
            
            # Security - only allow safe math operations
            safe_chars = set("0123456789+-*/().sincostaqrtloge")
            if not all(c.lower() in safe_chars for c in expr):
                return {"error": "Wyrażenie zawiera niedozwolone znaki"}
            
            # Replace functions
            expr = expr.replace("sqrt", "math.sqrt")
            expr = expr.replace("sin", "math.sin") 
            expr = expr.replace("cos", "math.cos")
            expr = expr.replace("tan", "math.tan")
            expr = expr.replace("log", "math.log")
            expr = expr.replace("e", "math.e")
            
            # Safe evaluation
            result = eval(expr, {"__builtins__": {}, "math": math})
            
            return {
                "expression": expression,
                "result": result,
                "result_type": type(result).__name__
            }
            
        except Exception as e:
            return {"error": f"Błąd obliczeń: {str(e)}"}
    
    def get_current_time(self, timezone: str = None, format: str = None) -> Dict[str, Any]:
        """Zwraca aktualny czas"""
        try:
            now = datetime.datetime.now()
            
            if not format:
                format = "%Y-%m-%d %H:%M:%S"
            
            return {
                "current_time": now.strftime(format),
                "timestamp": now.timestamp(), 
                "timezone": timezone or "local",
                "weekday": now.strftime("%A"),
                "iso_format": now.isoformat()
            }
            
        except Exception as e:
            return {"error": f"Błąd pobierania czasu: {str(e)}"}
    
    def search_web(self, query: str, num_results: int = 3) -> Dict[str, Any]:
        """Wyszukuje w internecie (mock implementation)"""
        # Mock implementation - w prawdziwej aplikacji użyj API jak Bing, Google Custom Search
        return {
            "query": query,
            "results": [
                {
                    "title": f"Wynik wyszukiwania dla: {query}",
                    "url": "https://example.com/search",
                    "snippet": f"To jest przykładowy wynik wyszukiwania dla zapytania '{query}'. "
                             "W prawdziwej implementacji tutaj byłyby rzeczywiste wyniki."
                }
            ],
            "total_results": 1,
            "note": "To jest mock implementation. Dodaj prawdziwe API wyszukiwania."
        }
    
    def get_process_list(self, filter_name: str = None, limit: int = 20) -> Dict[str, Any]:
        """Zwraca listę procesów systemowych"""
        try:
            processes = []
            
            for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
                try:
                    proc_info = proc.info
                    
                    if filter_name and filter_name.lower() not in proc_info['name'].lower():
                        continue
                    
                    processes.append({
                        "pid": proc_info['pid'],
                        "name": proc_info['name'],
                        "cpu_percent": proc_info['cpu_percent'],
                        "memory_percent": round(proc_info['memory_percent'], 2)
                    })
                    
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
            
            # Sort by CPU usage
            processes.sort(key=lambda x: x['cpu_percent'] or 0, reverse=True)
            
            if limit:
                processes = processes[:limit]
            
            return {
                "processes": processes,
                "total_found": len(processes),
                "filter": filter_name
            }
            
        except Exception as e:
            return {"error": f"Błąd pobierania procesów: {str(e)}"}
