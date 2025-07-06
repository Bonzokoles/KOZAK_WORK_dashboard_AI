"""
🚀 KOZAK Dashboard Configuration Updater
Updates server environment and configuration
"""

import os
from dotenv import load_dotenv, set_key

def update_environment():
    """Add missing environment variables"""
    
    env_path = '.env'
    
    # Load existing .env
    load_dotenv(env_path)
    
    # Required environment variables
    required_vars = {
        'CLOUDFLARE_ACCOUNT_ID': 'your_cloudflare_account_id',
        'CLOUDFLARE_API_TOKEN': 'your_cloudflare_api_token', 
        'WEATHER_API_KEY': 'your_openweather_api_key',
        'FLASK_ENV': 'development',
        'FLASK_DEBUG': 'True'
    }
    
    updated = False
    
    for var_name, default_value in required_vars.items():
        if not os.getenv(var_name):
            set_key(env_path, var_name, default_value)
            print(f"[+] Added {var_name} to .env")
            updated = True
        else:
            print(f"[OK] {var_name} already exists")
    
    if updated:
        print("\n[UPDATE] Environment variables updated!")
        print("[INFO] Please edit .env file with your actual API keys:")
        print("  - Cloudflare Account ID and API Token")
        print("  - OpenWeatherMap API Key (free at openweathermap.org)")
    else:
        print("\n[OK] All environment variables are set!")

if __name__ == "__main__":
    update_environment()
