import os
import webbrowser
import sys

# Add the backend directory to the Python path
# This allows importing modules from the backend folder
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
if backend_path not in sys.path:
    sys.path.append(backend_path)

try:
    # Import the Flask app instance from the server module
    from backend.server import app
except ImportError as e:
    print(f"Error importing Flask app: {e}")
    print("Please ensure the backend directory and server.py file exist in U:\\JIMBODASH\\backend.")
    print("Also, make sure you have installed the dependencies using 'pip install -r backend/requirements.txt'.")
    sys.exit(1) # Exit if the app cannot be imported


if __name__ == '__main__':
    print("Starting JIMBO DaShBoArD...")
    # Define the URL
    app_url = 'http://127.0.0.1:5000' # Use 127.0.0.1 for local access

    # Open browser automatically
    # Use a small delay to give the server a moment to start
    print(f"Opening browser to {app_url}...")
    webbrowser.open_new_tab(app_url)


    # Run the Flask development server
    # debug=True enables auto-reloading on code changes
    try:
        app.run(debug=True, port=5000, host='127.0.0.1')
    except Exception as e:
        print(f"Error running Flask server: {e}")
        print("Please check if port 5000 is already in use.")
