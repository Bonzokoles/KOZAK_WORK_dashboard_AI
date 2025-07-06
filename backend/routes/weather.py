from flask import Blueprint, jsonify
from ..weather_integration import get_weather, get_random_movie_quote

weather_bp = Blueprint('weather', __name__)

@weather_bp.route("/api/weather/<city>", methods=["GET"])
def weather_endpoint(city):
    """
    Get weather data with movie quotes and graphics
    """
    try:
        weather_data = get_weather(city)
        return jsonify(weather_data)
    except Exception as e:
        return (
            jsonify(
                {
                    "success": False,
                    "error": f"Błąd pobierania danych pogodowych: {str(e)}",
                }
            ),
            500,
        )

@weather_bp.route("/api/weather/quote/<condition>", methods=["GET"])
def movie_quote_endpoint(condition):
    """
    Get random movie quote for weather condition
    """
    try:
        quote_data = get_random_movie_quote(condition)
        return jsonify({"success": True, "quote": quote_data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@weather_bp.route("/api/weather/quote", methods=["GET"])
def random_quote_endpoint():
    """
    Get completely random movie quote
    """
    try:
        quote_data = get_random_movie_quote()
        return jsonify({"success": True, "quote": quote_data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
