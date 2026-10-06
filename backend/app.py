"""
Flask application entry point
"""
import os
from app import create_app

# Create Flask application
app = create_app()

if __name__ == '__main__':
    # Run development server
    app.run(
        host='0.0.0.0',
        port=int(os.environ.get('PORT', 5000)),
        debug=app.config.get('DEBUG', False)
    )