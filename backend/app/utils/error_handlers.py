"""
Centralized error handling
"""
from flask import jsonify, request
from werkzeug.exceptions import HTTPException
from sqlalchemy.exc import IntegrityError
from flask_jwt_extended.exceptions import JWTExtendedException
import traceback
from datetime import datetime, UTC

def register_error_handlers(app):
    """Register error handlers with Flask app"""
    
    @app.errorhandler(400)
    def bad_request(error):
        return create_error_response(
            code='VALIDATION_ERROR',
            message='Invalid input data provided',
            status=400
        )
    
    @app.errorhandler(401)
    def unauthorized(error):
        return create_error_response(
            code='AUTH_REQUIRED',
            message='Authentication required',
            status=401
        )
    
    @app.errorhandler(403)
    def forbidden(error):
        return create_error_response(
            code='INSUFFICIENT_PERMISSIONS',
            message='Insufficient privileges for this operation',
            status=403
        )
    
    @app.errorhandler(404)
    def not_found(error):
        return create_error_response(
            code='RESOURCE_NOT_FOUND',
            message='Requested resource not found',
            status=404
        )
    
    @app.errorhandler(409)
    def conflict(error):
        return create_error_response(
            code='CONFLICT',
            message='Resource conflict occurred',
            status=409
        )
    
    @app.errorhandler(500)
    def internal_error(error):
        return create_error_response(
            code='INTERNAL_SERVER_ERROR',
            message='An unexpected error occurred',
            status=500
        )
    
    @app.errorhandler(IntegrityError)
    def handle_integrity_error(error):
        """Handle database integrity errors"""
        error_msg = str(error.orig)
        
        if 'Duplicate entry' in error_msg:
            if 'users.username' in error_msg:
                return create_error_response(
                    code='DUPLICATE_VALUE',
                    message='Username already exists',
                    status=409
                )
            elif 'users.email' in error_msg:
                return create_error_response(
                    code='DUPLICATE_VALUE',
                    message='Email already exists',
                    status=409
                )
            else:
                return create_error_response(
                    code='DUPLICATE_VALUE',
                    message='Duplicate value provided',
                    status=409
                )
        
        elif 'foreign key constraint' in error_msg.lower():
            return create_error_response(
                code='FOREIGN_KEY_CONSTRAINT',
                message='Referenced resource does not exist',
                status=409
            )
        
        elif 'cannot delete' in error_msg.lower():
            return create_error_response(
                code='FOREIGN_KEY_CONSTRAINT',
                message='Cannot delete resource with existing references',
                status=409
            )
        
        else:
            return create_error_response(
                code='INTEGRITY_VIOLATION',
                message='Data integrity constraint violated',
                status=409
            )
    
    @app.errorhandler(JWTExtendedException)
    def handle_jwt_exceptions(error):
        """Handle JWT-related errors"""
        error_type = type(error).__name__
        
        if 'ExpiredSignature' in error_type:
            return create_error_response(
                code='TOKEN_EXPIRED',
                message='Access token has expired',
                status=401
            )
        elif 'InvalidToken' in error_type:
            return create_error_response(
                code='INVALID_TOKEN',
                message='Invalid access token',
                status=401
            )
        elif 'NoAuthorization' in error_type:
            return create_error_response(
                code='AUTH_REQUIRED',
                message='Authorization header required',
                status=401
            )
        else:
            return create_error_response(
                code='AUTH_ERROR',
                message='Authentication error occurred',
                status=401
            )
    
    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        """Handle unexpected errors"""
        if app.debug:
            # In debug mode, show the full traceback
            traceback.print_exc()
        
        # Temporary debug: return traceback in response
        return create_error_response(
            code='INTERNAL_SERVER_ERROR',
            message=f'An unexpected error occurred: {str(error)}',
            status=500,
            details=traceback.format_exc()
        )

def create_error_response(code, message, status=400, details=None):
    """Create standardized error response"""
    error_data = {
        'error': {
            'code': code,
            'message': message,
            'timestamp': datetime.now(UTC).isoformat().replace('+00:00', 'Z'),
            'path': request.path if request else None
        }
    }
    
    if details:
        error_data['error']['details'] = details
    
    return jsonify(error_data), status

def create_success_response(data, status=200):
    """Create standardized success response"""
    response_data = {
        'success': True,
        'data': data,
        'meta': {
            'timestamp': datetime.now(UTC).isoformat().replace('+00:00', 'Z'),
            'path': request.path if request else None
        }
    }
    
    return jsonify(response_data), status