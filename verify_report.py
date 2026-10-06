import json
from app import create_app
from app.services.report_service import ReportService

app = create_app()
with app.app_context():
    users, pagination = ReportService.get_most_active_users(page=1, limit=5)
    print("USERS DATA:")
    print(json.dumps(users, indent=2))
    print("\nPAGINATION:")
    print(json.dumps(pagination, indent=2))
