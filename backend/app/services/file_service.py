"""
File upload service for handling image uploads
"""
import os
import uuid
from PIL import Image
from werkzeug.utils import secure_filename
from flask import current_app

class FileUploadService:
    """Service for handling file uploads with image processing"""
    
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
    
    # Image size configurations
    ARTIST_IMAGE_SIZE = (400, 400)  # Square for artist profile
    ALBUM_COVER_SIZE = (500, 500)   # Square for album cover
    
    @staticmethod
    def allowed_file(filename):
        """Check if file extension is allowed"""
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in FileUploadService.ALLOWED_EXTENSIONS
    
    @staticmethod
    def validate_file(file):
        """Validate uploaded file"""
        errors = []
        
        if not file:
            errors.append("No file provided")
            return errors
            
        if file.filename == '':
            errors.append("No file selected")
            return errors
            
        if not FileUploadService.allowed_file(file.filename):
            errors.append(f"File type not allowed. Allowed types: {', '.join(FileUploadService.ALLOWED_EXTENSIONS)}")
            
        # Check file size (this is approximate, actual size check happens during processing)
        file.seek(0, 2)  # Seek to end
        size = file.tell()
        file.seek(0)     # Reset to beginning
        
        if size > FileUploadService.MAX_FILE_SIZE:
            errors.append(f"File too large. Maximum size: {FileUploadService.MAX_FILE_SIZE // (1024*1024)}MB")
            
        return errors
    
    @staticmethod
    def generate_filename(original_filename, prefix=""):
        """Generate unique filename"""
        ext = original_filename.rsplit('.', 1)[1].lower()
        unique_id = str(uuid.uuid4())
        if prefix:
            return f"{prefix}_{unique_id}.{ext}"
        return f"{unique_id}.{ext}"
    
    @staticmethod
    def ensure_upload_dir(upload_type):
        """Ensure upload directory exists"""
        upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], upload_type)
        os.makedirs(upload_dir, exist_ok=True)
        return upload_dir
    
    @staticmethod
    def process_and_save_image(file, upload_type, target_size=None):
        """
        Process and save uploaded image
        
        Args:
            file: Uploaded file object
            upload_type: 'artists' or 'albums'
            target_size: Tuple (width, height) for resizing
            
        Returns:
            dict: {'success': bool, 'filename': str, 'url': str, 'error': str}
        """
        try:
            # Validate file
            validation_errors = FileUploadService.validate_file(file)
            if validation_errors:
                return {
                    'success': False,
                    'error': '; '.join(validation_errors)
                }
            
            # Ensure upload directory exists
            upload_dir = FileUploadService.ensure_upload_dir(upload_type)
            
            # Generate unique filename
            filename = FileUploadService.generate_filename(
                file.filename, 
                prefix=upload_type.rstrip('s')  # 'artist' or 'album'
            )
            
            # Full file path
            filepath = os.path.join(upload_dir, filename)
            
            # Open and process image
            image = Image.open(file.stream)
            
            # Convert to RGB if necessary (for JPEG compatibility)
            if image.mode in ('RGBA', 'LA', 'P'):
                # Create white background for transparent images
                background = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'P':
                    image = image.convert('RGBA')
                background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
                image = background
            elif image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize if target size specified
            if target_size:
                # Resize maintaining aspect ratio, then crop to exact size
                image.thumbnail(target_size, Image.Resampling.LANCZOS)
                
                # Create new image with target size and paste resized image centered
                new_image = Image.new('RGB', target_size, (255, 255, 255))
                paste_x = (target_size[0] - image.width) // 2
                paste_y = (target_size[1] - image.height) // 2
                new_image.paste(image, (paste_x, paste_y))
                image = new_image
            
            # Save processed image
            image.save(filepath, 'JPEG', quality=85, optimize=True)
            
            # Generate URL path (relative to static folder)
            url_path = f"/static/uploads/{upload_type}/{filename}"
            
            return {
                'success': True,
                'filename': filename,
                'url': url_path,
                'size': os.path.getsize(filepath)
            }
            
        except Exception as e:
            current_app.logger.error(f"Error processing image: {str(e)}")
            return {
                'success': False,
                'error': f"Error processing image: {str(e)}"
            }
    
    @staticmethod
    def delete_image(image_url):
        """Delete image file from filesystem"""
        try:
            if not image_url or not image_url.startswith('/static/uploads/'):
                return False
                
            # Convert URL to file path
            relative_path = image_url.replace('/static/uploads/', '')
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], relative_path)
            
            if os.path.exists(filepath):
                os.remove(filepath)
                return True
                
        except Exception as e:
            current_app.logger.error(f"Error deleting image: {str(e)}")
            
        return False
    
    @staticmethod
    def get_image_info(image_url):
        """Get information about uploaded image"""
        try:
            if not image_url or not image_url.startswith('/static/uploads/'):
                return None
                
            relative_path = image_url.replace('/static/uploads/', '')
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], relative_path)
            
            if os.path.exists(filepath):
                stat = os.stat(filepath)
                return {
                    'exists': True,
                    'size': stat.st_size,
                    'modified': stat.st_mtime
                }
                
        except Exception as e:
            current_app.logger.error(f"Error getting image info: {str(e)}")
            
        return {'exists': False}