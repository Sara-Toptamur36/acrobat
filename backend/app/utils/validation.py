"""
Input validation utilities
"""
import re
from app.utils.error_handlers import create_error_response

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_pagination(page, limit, max_limit=100):
    """Validate pagination parameters"""
    errors = []
    
    try:
        page = int(page) if page else 1
        if page < 1:
            errors.append({'field': 'page', 'message': 'Page must be greater than 0'})
    except (ValueError, TypeError):
        errors.append({'field': 'page', 'message': 'Page must be a valid integer'})
        page = 1
    
    try:
        limit = int(limit) if limit else 20
        if limit < 1:
            errors.append({'field': 'limit', 'message': 'Limit must be greater than 0'})
        elif limit > max_limit:
            errors.append({'field': 'limit', 'message': f'Limit cannot exceed {max_limit}'})
    except (ValueError, TypeError):
        errors.append({'field': 'limit', 'message': 'Limit must be a valid integer'})
        limit = 20
    
    return page, limit, errors

def validate_required_fields(data, required_fields):
    """Validate required fields in request data"""
    errors = []
    
    for field in required_fields:
        if field not in data or not data[field] or (isinstance(data[field], str) and not data[field].strip()):
            errors.append({'field': field, 'message': f'{field} is required'})
    
    return errors

def validate_rating(rating):
    """Validate rating value"""
    if rating is None:
        return None, []
    
    try:
        rating = float(rating)
        if rating < 0.0 or rating > 10.0:
            return None, [{'field': 'rating', 'message': 'Rating must be between 0.0 and 10.0'}]
        return rating, []
    except (ValueError, TypeError):
        return None, [{'field': 'rating', 'message': 'Rating must be a valid number'}]

def validate_positive_integer(value, field_name):
    """Validate positive integer"""
    if value is None:
        return None, []
    
    try:
        value = int(value)
        if value <= 0:
            return None, [{'field': field_name, 'message': f'{field_name} must be greater than 0'}]
        return value, []
    except (ValueError, TypeError):
        return None, [{'field': field_name, 'message': f'{field_name} must be a valid positive integer'}]