"""
This script serves as the entry point for launching the JIMBO DaShBoArD
application.

It performs the following key functions:
1.  Configures the system path to allow for seamless module imports from the
    'backend' directory.
2.  Imports the main Flask application instance from the backend server.
3.  Starts the Flask development server.
4.  Automatically opens the application in a new web browser tab for
    immediate access.

This modular structure ensures that the application is easy to start and that
the backend logic remains decoupled from the script that launches it.
"""

import sys
import webbrowser
from pathlib import Path
from threading import Timer

# --- Constants ---
HOST = "127.0.0.1"
PORT = 5080
DEBUG_MODE = True
APP_URL = f"http://{HOST}:{PORT}"


def setup_paths():
    """
    Add the backend directory to the Python path for module imports.

    This is a common pattern for simple project structures. For larger
    applications, consider using package installation
    (e.g., 'pip install -e .').
    """
    backend_path = Path(__file__).parent / "backend"
    if str(backend_path) not in sys.path:
        sys.path.append(str(backend_path))


def open_browser():
    """Opens the application in a new browser tab."""
    print(f"Opening browser to {APP_URL}...")
    webbrowser.open_new_tab(APP_URL)


def main():
    """
    Main function to run the JIMBO DaShBoArD application.
    """
    setup_paths()

    try:
        from server import app
    except ImportError as e:
        print(f"Error: Failed to import Flask app from 'server.py'. {e}")
        print("Please ensure the following:")
        print("1. 'backend/server.py' exists with the Flask 'app' instance.")
        print("2. Dependencies from 'backend/requirements.txt' are installed.")
        sys.exit(1)

    if DEBUG_MODE:
        print("WARNING: Running in DEBUG MODE.")
        print("Do not use in a production environment.")

    print("Starting JIMBO DaShBoArD...")

    # Use a timer to open the browser after the server has a moment to start.
    Timer(1, open_browser).start()

    try:
        app.run(host=HOST, port=PORT, debug=DEBUG_MODE)
    except OSError as e:
        print(f"Error: Failed to start the server. {e}")
        print(f"Please check if another application is using port {PORT}.")
        sys.exit(1)
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
