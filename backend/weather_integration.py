import random
import time
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime
import asyncio
import aiohttp
import requests
from functools import lru_cache

logger = logging.getLogger(__name__)

@dataclass
class WeatherData:
    city: str
    country: str
    temperature: float
    feels_like: float
    humidity: int
    pressure: int
    wind_speed: float
    wind_direction: int
    condition: str
    description: str
    icon: str
    visibility: int
    uv_index: float
    sunrise: int
    sunset: int
    timestamp: float

@dataclass
class MovieQuote:
    quote: str
    movie: str
    character: str
    year: int
    weather_condition: str

class WeatherMovieQuotes:
    """Movie quotes collection organized by weather conditions"""
    def __init__(self):
        self.quotes = {
            "sunny": [
                MovieQuote(
                    "Frankly, my dear, I don't give a damn!",
                    "Gone with the Wind",
                    "Rhett Butler",
                    1939,
                    "sunny",
                ),
                # ... (other sunny quotes)
            ],
            "cloudy": [
                MovieQuote(
                    "I'm gonna make him an offer he can't refuse.",
                    "The Godfather",
                    "Don Vito Corleone",
                    1972,
                    "cloudy",
                ),
                # ... (other cloudy quotes)
            ],
            "rainy": [
                MovieQuote(
                    "Singing in the rain, just singing in the rain!",
                    "Singin' in the Rain",
                    "Don Lockwood",
                    1952,
                    "rainy",
                ),
                # ... (other rainy quotes)
            ],
            "stormy": [
                MovieQuote(
                    "I am your father.",
                    "Star Wars: Empire Strikes Back",
                    "Darth Vader",
                    1980,
                    "stormy",
                ),
                # ... (other stormy quotes)
            ],
            "snowy": [
                MovieQuote(
                    "The cold never bothered me anyway.",
                    "Frozen",
                    "Elsa",
                    2013,
                    "snowy",
                ),
                # ... (other snowy quotes)
            ],
            "foggy": [
                MovieQuote(
                    "Elementary, my dear Watson.",
                    "Sherlock Holmes",
                    "Sherlock Holmes",
                    1939,
                    "foggy",
                ),
                # ... (other foggy quotes)
            ],
        }

    def get_random_quote(self, weather_condition: Optional[str] = None) -> MovieQuote:
        """Get random movie quote for weather condition"""
        condition_quotes = self.quotes.get(weather_condition, self.quotes["sunny"]) if weather_condition else [
            quote for quotes in self.quotes.values() for quote in quotes
        ]
        return random.choice(condition_quotes)

    def get_all_quotes(self) -> List[MovieQuote]:
        """Get all quotes as flat list"""
        return [quote for quotes in self.quotes.values() for quote in quotes]

class WeatherAPI:
    """Enhanced weather service with graphics and movie quotes"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('WEATHER_API_KEY')
        if not self.api_key:
            raise ValueError("OpenWeatherMap API key is required")
            
        self.base_url = "http://api.openweathermap.org/data/2.5"
        self.cache = {}
        self.cache_duration = 300  # 5 minutes
        self.movie_quotes = WeatherMovieQuotes()

        # Weather condition mapping for graphics
        self.weather_graphics = {
            "clear": {
                "icon": "☀️",
                "color": "#FFD700",
                "gradient": ["#FFD700", "#FFA500"],
                "animation": "pulse",
                "condition": "sunny",
            },
            "clouds": {
                "icon": "☁️",
                "color": "#87CEEB",
                "gradient": ["#87CEEB", "#778899"],
                "animation": "float",
                "condition": "cloudy",
            },
            "rain": {
                "icon": "🌧️",
                "color": "#4682B4",
                "gradient": ["#4682B4", "#191970"],
                "animation": "rain",
                "condition": "rainy",
            },
            "drizzle": {
                "icon": "🌦️",
                "color": "#6495ED",
                "gradient": ["#6495ED", "#4169E1"],
                "animation": "drizzle",
                "condition": "rainy",
            },
            "thunderstorm": {
                "icon": "⛈️",
                "color": "#483D8B",
                "gradient": ["#483D8B", "#2F4F4F"],
                "animation": "thunder",
                "condition": "stormy",
            },
            "snow": {
                "icon": "❄️",
                "color": "#F0F8FF",
                "gradient": ["#F0F8FF", "#E6E6FA"],
                "animation": "snow",
                "condition": "snowy",
            },
            "mist": {
                "icon": "🌫️",
                "color": "#D3D3D3",
                "gradient": ["#D3D3D3", "#A9A9A9"],
                "animation": "fog",
                "condition": "foggy",
            },
            "fog": {
                "icon": "🌫️",
                "color": "#D3D3D3",
                "gradient": ["#D3D3D3", "#A9A9A9"],
                "animation": "fog",
                "condition": "foggy",
            },
        }

    def get_weather_condition(self, weather_main: str) -> str:
        """Map OpenWeather condition to our graphics system"""
        return weather_main.lower()

    def get_weather_graphics(self, condition: str) -> Dict:
        """Get graphics data for weather condition"""
        return self.weather_graphics.get(condition, self.weather_graphics["clear"])

    @lru_cache(maxsize=32)
    async def get_weather_data_async(self, city: str) -> Dict:
        """Get weather data with movie quotes and graphics (async)"""
        try:
            # Check cache first
            cache_key = f"{city}_{int(time.time() / self.cache_duration)}"
            if cache_key in self.cache:
                logger.info(f"🚀 Weather data for {city} loaded from cache")
                return self.cache[cache_key]

            # Make API request
            url = f"{self.base_url}/weather"
            params = {
                "q": city,
                "appid": self.api_key,
                "units": "metric",
                "lang": "pl"
            }

            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()

                        # Parse weather data
                        weather_data = WeatherData(
                            city=data["name"],
                            country=data["sys"]["country"],
                            temperature=data["main"]["temp"],
                            feels_like=data["main"]["feels_like"],
                            humidity=data["main"]["humidity"],
                            pressure=data["main"]["pressure"],
                            wind_speed=data["wind"]["speed"],
                            wind_direction=data["wind"].get("deg", 0),
                            condition=data["weather"][0]["main"],
                            description=data["weather"][0]["description"],
                            icon=data["weather"][0]["icon"],
                            visibility=data.get("visibility", 0),
                            uv_index=0,  # Requires additional API call
                            sunrise=data["sys"]["sunrise"],
                            sunset=data["sys"]["sunset"],
                            timestamp=time.time(),
                        )

                        # Get graphics and quote
                        condition = self.get_weather_condition(weather_data.condition)
                        graphics = self.get_weather_graphics(condition)
                        quote = self.movie_quotes.get_random_quote(graphics["condition"])

                        # Build response
                        result = {
                            "success": True,
                            "weather": {
                                "city": weather_data.city,
                                "country": weather_data.country,
                                "temperature": round(weather_data.temperature, 1),
                                "feels_like": round(weather_data.feels_like, 1),
                                "humidity": weather_data.humidity,
                                "pressure": weather_data.pressure,
                                "wind_speed": weather_data.wind_speed,
                                "wind_direction": weather_data.wind_direction,
                                "condition": weather_data.condition,
                                "description": weather_data.description.title(),
                                "visibility": weather_data.visibility,
                                "sunrise": datetime.fromtimestamp(weather_data.sunrise).strftime("%H:%M"),
                                "sunset": datetime.fromtimestamp(weather_data.sunset).strftime("%H:%M"),
                                "timestamp": weather_data.timestamp,
                            },
                            "graphics": {
                                "icon": graphics["icon"],
                                "color": graphics["color"],
                                "gradient": graphics["gradient"],
                                "animation": graphics["animation"],
                                "condition": graphics["condition"],
                            },
                            "movie_quote": {
                                "quote": quote.quote,
                                "movie": quote.movie,
                                "character": quote.character,
                                "year": quote.year,
                            },
                        }

                        # Cache the result
                        self.cache[cache_key] = result
                        logger.info(f"✅ Weather data for {city} fetched successfully")

                        return result
                    else:
                        error_data = await response.text()
                        raise Exception(f"API Error {response.status}: {error_data}")

        except Exception as e:
            logger.error(f"❌ Weather API error: {e}")
            return self.get_fallback_weather(city, str(e))

    def get_weather_data_sync(self, city: str) -> Dict:
        """Synchronous wrapper for weather data"""
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        return loop.run_until_complete(self.get_weather_data_async(city))

    def get_fallback_weather(self, city: str, error: str) -> Dict:
        """Fallback weather data when API fails"""
        fallback_quote = self.movie_quotes.get_random_quote("sunny")

        return {
            "success": False,
            "error": error,
            "weather": {
                "city": city,
                "country": "Unknown",
                "temperature": 20.0,
                "feels_like": 20.0,
                "humidity": 50,
                "pressure": 1013,
                "wind_speed": 5.0,
                "wind_direction": 180,
                "condition": "Unknown",
                "description": "Brak danych pogodowych",
                "visibility": 10000,
                "sunrise": "06:00",
                "sunset": "18:00",
                "timestamp": time.time(),
            },
            "graphics": {
                "icon": "🌍",
                "color": "#00ffff",
                "gradient": ["#00ffff", "#0088ff"],
                "animation": "pulse",
                "condition": "unknown",
            },
            "movie_quote": {
                "quote": fallback_quote.quote,
                "movie": fallback_quote.movie,
                "character": fallback_quote.character,
                "year": fallback_quote.year,
            },
        }

# Global weather service instance
_weather_api = None

def init_weather_api(api_key: str) -> None:
    """Initialize the global weather service instance"""
    global _weather_api
    _weather_api = WeatherAPI(api_key)

def get_weather(city: str) -> Dict:
    """Main function for Flask integration"""
    global _weather_api
    if not _weather_api:
        raise RuntimeError("Weather API not initialized. Call init_weather_api first.")
    return _weather_api.get_weather_data_sync(city)

async def get_weather_async(city: str) -> Dict:
    """Async function for FastAPI integration"""
    global _weather_api
    if not _weather_api:
        raise RuntimeError("Weather API not initialized. Call init_weather_api first.")
    return await _weather_api.get_weather_data_async(city)

def get_random_movie_quote(condition: Optional[str] = None) -> Dict:
    """Get random movie quote for specific weather condition"""
    global _weather_api
    if not _weather_api:
        raise RuntimeError("Weather API not initialized. Call init_weather_api first.")
        
    quote = _weather_api.movie_quotes.get_random_quote(condition)
    return {
        "quote": quote.quote,
        "movie": quote.movie,
        "character": quote.character,
        "year": quote.year,
        "weather_condition": quote.weather_condition,
    }