from flask import Blueprint, request, current_app, send_from_directory, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models import Artist, Album
from app.services.file_service import FileUploadService
from app.utils.error_handlers import create_error_response, create_success_response
from app.utils.decorators import admin_required
import os
import uuid
import time
from werkzeug.utils import secure_filename

uploads_bp = Blueprint('uploads', __name__)

# ============================================================================
# STATIC FILE SERVING
# ============================================================================

@uploads_bp.route('/static/uploads/<path:filename>')
def uploaded_file(filename):
    """Serve uploaded files"""
    upload_folder = current_app.config['UPLOAD_FOLDER']
    return send_from_directory(upload_folder, filename)

@uploads_bp.route('/uploads/<path:filename>')
def serve_uploaded_file(filename):
    """Serve uploaded files - alternative endpoint"""
    upload_folder = current_app.config['UPLOAD_FOLDER']
    return send_from_directory(upload_folder, filename)

# ============================================================================
# SIMPLE FILE UPLOAD
# ============================================================================

@uploads_bp.route('/uploads', methods=['POST'])
@jwt_required()
def upload_file():
    """Simple file upload endpoint (requires login, any user can upload)"""
    
    # Check if file is in request
    if 'file' not in request.files:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='No file provided',
            status=400
        )
    
    file = request.files['file']
    
    # Check if file is selected
    if file.filename == '':
        return create_error_response(
            code='VALIDATION_ERROR',
            message='No file selected',
            status=400
        )
    
    # Check file extension
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.mp3', '.wav', '.ogg'}
    filename = file.filename.lower()
    file_ext = None
    
    for ext in allowed_extensions:
        if filename.endswith(ext):
            file_ext = ext
            break
    
    if not file_ext:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='Only .jpg, .png, .mp3, .wav, .ogg files are allowed',
            status=400
        )
    
    # Check file size (50MB max for audio)
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)  # Reset file pointer
    
    max_size = 50 * 1024 * 1024  # 50MB
    if file_size > max_size:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='File size exceeds 5MB limit',
            status=400
        )
    
    try:
        # Generate secure filename with UUID
        unique_filename = str(uuid.uuid4()) + file_ext
        
        # Ensure upload directory exists
        upload_folder = current_app.config['UPLOAD_FOLDER']
        os.makedirs(upload_folder, exist_ok=True)
        
        # Save file
        file_path = os.path.join(upload_folder, unique_filename)
        file.save(file_path)
        
        # Return success response
        return create_success_response({
            'url': f'/uploads/{unique_filename}',
            'filename': unique_filename,
            'original_filename': file.filename,
            'size': file_size
        })
        
    except Exception as e:
        current_app.logger.error(f'File upload error: {str(e)}')
        return create_error_response(
            code='UPLOAD_ERROR',
            message='Failed to upload file',
            status=500
        )

# ============================================================================
# ARTIST IMAGE UPLOAD
# ============================================================================

@uploads_bp.route('/artists/<int:artist_id>/image', methods=['POST'])
@admin_required
def upload_artist_image(artist_id):
    """Upload artist profile image (admin only)"""
    artist = Artist.query.get_or_404(artist_id)
    
    # Check if file is in request
    if 'image' not in request.files:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='No image file provided',
            status=400
        )
    
    file = request.files['image']
    
    # Process and save image
    result = FileUploadService.process_and_save_image(
        file, 
        'artists', 
        FileUploadService.ARTIST_IMAGE_SIZE
    )
    
    if not result['success']:
        return create_error_response(
            code='UPLOAD_ERROR',
            message=result['error'],
            status=400
        )
    
    try:
        # Delete old image if exists
        if artist.image_url:
            FileUploadService.delete_image(artist.image_url)
        
        # Update artist with new image URL
        artist.image_url = result['url']
        db.session.commit()
        
        return create_success_response({
            'message': 'Artist image uploaded successfully',
            'image_url': result['url'],
            'artist': artist.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        # Clean up uploaded file on database error
        FileUploadService.delete_image(result['url'])
        raise

@uploads_bp.route('/artists/<int:artist_id>/image', methods=['DELETE'])
@admin_required
def delete_artist_image(artist_id):
    """Delete artist profile image (admin only)"""
    artist = Artist.query.get_or_404(artist_id)
    
    if not artist.image_url:
        return create_error_response(
            code='NOT_FOUND',
            message='Artist has no image to delete',
            status=404
        )
    
    try:
        # Delete image file
        FileUploadService.delete_image(artist.image_url)
        
        # Update artist
        artist.image_url = None
        db.session.commit()
        
        return create_success_response({
            'message': 'Artist image deleted successfully',
            'artist': artist.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        raise

# ============================================================================
# ALBUM COVER UPLOAD
# ============================================================================

@uploads_bp.route('/albums/<int:album_id>/cover', methods=['POST'])
@admin_required
def upload_album_cover(album_id):
    """Upload album cover image (admin only)"""
    album = Album.query.get_or_404(album_id)
    
    # Check if file is in request
    if 'image' not in request.files:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='No image file provided',
            status=400
        )
    
    file = request.files['image']
    
    # Process and save image
    result = FileUploadService.process_and_save_image(
        file, 
        'albums', 
        FileUploadService.ALBUM_COVER_SIZE
    )
    
    if not result['success']:
        return create_error_response(
            code='UPLOAD_ERROR',
            message=result['error'],
            status=400
        )
    
    try:
        # Delete old cover if exists
        if album.cover_image:
            FileUploadService.delete_image(album.cover_image)
        
        # Update album with new cover URL
        album.cover_image = result['url']
        db.session.commit()
        
        return create_success_response({
            'message': 'Album cover uploaded successfully',
            'cover_image': result['url'],
            'album': album.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        # Clean up uploaded file on database error
        FileUploadService.delete_image(result['url'])
        raise

@uploads_bp.route('/albums/<int:album_id>/cover', methods=['DELETE'])
@admin_required
def delete_album_cover(album_id):
    """Delete album cover image (admin only)"""
    album = Album.query.get_or_404(album_id)
    
    if not album.cover_image:
        return create_error_response(
            code='NOT_FOUND',
            message='Album has no cover image to delete',
            status=404
        )
    
    try:
        # Delete image file
        FileUploadService.delete_image(album.cover_image)
        
        # Update album
        album.cover_image = None
        db.session.commit()
        
        return create_success_response({
            'message': 'Album cover deleted successfully',
            'album': album.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        raise

# ============================================================================
# SONG AUDIO UPLOAD
# ============================================================================

@uploads_bp.route('/songs/<int:song_id>/audio', methods=['POST'])
@admin_required
def upload_song_audio(song_id):
    """Upload song audio file (admin only)"""
    # Import Song model inside function to avoid circular imports if any
    from app.models.song import Song
    
    song = Song.query.get_or_404(song_id)
    
    # Check if file is in request
    if 'audio' not in request.files:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='No audio file provided',
            status=400
        )
    
    file = request.files['audio']
    
    # Check file
    if file.filename == '':
        return create_error_response(
            code='VALIDATION_ERROR',
            message='No file selected',
            status=400
        )
        
    # Validate extension manually since process_and_save_image is for images
    allowed_audio = {'.mp3', '.wav', '.ogg', '.m4a'}
    filename = file.filename.lower()
    valid_ext = False
    for ext in allowed_audio:
        if filename.endswith(ext):
            valid_ext = True
            break
            
    if not valid_ext:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='Invalid audio type. Allowed: mp3, wav, ogg, m4a',
            status=400
        )

    try:
        # Generate secure filename
        file_ext = os.path.splitext(filename)[1]
        unique_filename = f"song_{song_id}_{str(uuid.uuid4())[:8]}{file_ext}"
        
        # Ensure upload directory exists
        upload_folder = current_app.config['UPLOAD_FOLDER']
        os.makedirs(upload_folder, exist_ok=True)
        
        # Save file
        file_path = os.path.join(upload_folder, unique_filename)
        file.save(file_path)
        
        # Delete old file if exists
        if song.file_path:
             old_path = os.path.join(upload_folder, os.path.basename(song.file_path))
             if os.path.exists(old_path):
                 try:
                     os.remove(old_path)
                 except:
                     pass

        # Update song
        song.file_path = f'/uploads/{unique_filename}'
        db.session.commit()
        
        return create_success_response({
            'message': 'Song audio uploaded successfully',
            'file_url': song.file_path,
            'song': song.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Audio upload failed: {str(e)}")
        return create_error_response(
            code='UPLOAD_ERROR',
            message='Failed to upload audio file',
            status=500
        )

@uploads_bp.route('/songs/upload-integrated', methods=['POST'])
@admin_required
def integrated_song_upload():
    """Create song (and maybe artist/album) and upload audio in one request (admin only)"""
    from app.models.song import Song
    from app.models.artist import Artist
    from app.models.album import Album
    from app.models.genre import Genre
    from app.services.song_service import SongService
    from app.services.artist_service import ArtistService
    from app.services.album_service import AlbumService
    
    # Metadata is in request.form, file is in request.files
    title = request.form.get('title')
    album_id = request.form.get('album_id')
    new_album_title = request.form.get('new_album_title')
    artist_id = request.form.get('artist_id')
    new_artist_name = request.form.get('new_artist_name')
    genre_id = request.form.get('genre_id')
    new_genre_name = request.form.get('new_genre_name')
    track_number = request.form.get('track_number')
    duration = request.form.get('duration', 0)
    
    if not title:
        return create_error_response('VALIDATION_ERROR', 'Song title is required', status=400)
        
    if 'audio' not in request.files:
         return create_error_response('VALIDATION_ERROR', 'No audio file provided', status=400)
    
    file = request.files['audio']
    if file.filename == '':
        return create_error_response('VALIDATION_ERROR', 'No file selected', status=400)
        
    # Validate audio extension
    allowed_audio = {'.mp3', '.wav', '.ogg', '.m4a'}
    filename = file.filename.lower()
    file_ext = os.path.splitext(filename)[1]
    if file_ext not in allowed_audio:
        return create_error_response('VALIDATION_ERROR', 'Invalid audio type. Allowed: mp3, wav, ogg, m4a', status=400)

    try:
        # 1. Handle Artist
        final_artist_id = None
        if artist_id and artist_id != 'new' and artist_id != '':
            final_artist_id = int(artist_id)
        elif new_artist_name:
            # Check if exists
            artist = Artist.query.filter(Artist.name.ilike(new_artist_name)).first()
            if not artist:
                artist = Artist(name=new_artist_name)
                db.session.add(artist)
                db.session.flush()
            final_artist_id = artist.artist_id
        
        # 2. Handle Album
        final_album_id = None
        if album_id and album_id != 'new' and album_id != '':
            final_album_id = int(album_id)
        elif new_album_title:
            if not final_artist_id:
                return create_error_response('VALIDATION_ERROR', 'Artist is required to create a new album', status=400)
            
            # Check if album exists for this artist
            album = Album.query.filter(Album.title.ilike(new_album_title), Album.artist_id == final_artist_id).first()
            if not album:
                album = Album(title=new_album_title, artist_id=final_artist_id)
                db.session.add(album)
                db.session.flush()
            final_album_id = album.album_id
            
        if not final_album_id:
            return create_error_response('VALIDATION_ERROR', 'Album is required', status=400)

        # 3. Handle Genre
        final_genre_id = None
        if genre_id and genre_id != 'new' and genre_id != '':
            final_genre_id = int(genre_id)
        elif new_genre_name:
            genre = Genre.query.filter(Genre.name.ilike(new_genre_name)).first()
            if not genre:
                genre = Genre(name=new_genre_name)
                db.session.add(genre)
                db.session.flush()
            final_genre_id = genre.genre_id

        # 4. Save File
        unique_filename = f"song_{uuid.uuid4().hex[:12]}{file_ext}"
        upload_folder = current_app.config['UPLOAD_FOLDER']
        os.makedirs(upload_folder, exist_ok=True)
        file_path = os.path.join(upload_folder, unique_filename)
        file.save(file_path)
        
        # 5. Create Song
        song_data = {
            'title': title,
            'album_id': final_album_id,
            'genre_id': final_genre_id,
            'track_number': int(track_number) if track_number else 1,
            'duration': int(duration),
            'file_path': f'/uploads/{unique_filename}'
        }
        
        # Check track number uniqueness
        existing = Song.query.filter_by(album_id=song_data['album_id'], track_number=song_data['track_number']).first()
        if existing:
            # If exists, auto-increment track number or allow override? 
            # For now, just append as next track to resolve conflict automatically for simpler UX
            max_track = db.session.query(db.func.max(Song.track_number)).filter_by(album_id=song_data['album_id']).scalar() or 0
            song_data['track_number'] = max_track + 1

        song = SongService.create_song(song_data)
        
        return create_success_response({
            'message': 'Song created successfully',
            'song': song
        }, status=201)
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Integrated upload failed: {str(e)}")
        if 'file_path' in locals() and os.path.exists(file_path):
            try: os.remove(file_path)
            except: pass
        return create_error_response('UPLOAD_ERROR', str(e), status=500)

# ============================================================================
# IMAGE INFO ENDPOINT
# ============================================================================

@uploads_bp.route('/info', methods=['GET'])
def get_image_info():
    """Get information about uploaded images"""
    upload_dir = current_app.config['UPLOAD_FOLDER']
    
    if not os.path.exists(upload_dir):
        return jsonify({
            'success': True,
            'data': {
                'total_images': 0,
                'total_size_mb': 0,
                'images': []
            }
        })
    
    images = []
    total_size = 0
    
    for filename in os.listdir(upload_dir):
        filepath = os.path.join(upload_dir, filename)
        if os.path.isfile(filepath):
            size = os.path.getsize(filepath)
            total_size += size
            images.append({
                'filename': filename,
                'size_kb': round(size / 1024, 2),
                'url': f'/uploads/{filename}'
            })
    
    return jsonify({
        'success': True,
        'data': {
            'total_images': len(images),
            'total_size_mb': round(total_size / (1024 * 1024), 2),
            'images': images
        }
    })

# ============================================================================
# PROFILE PICTURE UPLOAD
# ============================================================================

@uploads_bp.route('/profile/image', methods=['POST'])
@jwt_required()
def upload_profile_image():
    """Upload user profile image"""
    from flask_jwt_extended import get_jwt_identity
    from app.models import User
    
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return create_error_response(
            code='RESOURCE_NOT_FOUND',
            message='User not found',
            status=404
        )
    
    if 'image' not in request.files:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='No image file provided',
            status=400
        )
    
    file = request.files['image']
    
    if file.filename == '':
        return create_error_response(
            code='VALIDATION_ERROR',
            message='No file selected',
            status=400
        )
    
    if not allowed_file(file.filename):
        return create_error_response(
            code='VALIDATION_ERROR',
            message='Invalid file type. Only PNG, JPG, JPEG, GIF allowed',
            status=400
        )
    
    try:
        # Delete old profile image if exists
        if user.profile_image:
            old_path = os.path.join(current_app.config['UPLOAD_FOLDER'], user.profile_image)
            if os.path.exists(old_path):
                os.remove(old_path)
        
        # Save new image
        filename = secure_filename(f'profile_{user_id}_{int(time.time())}_{file.filename}')
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Update user model
        user.profile_image = filename
        db.session.commit()
        
        return create_success_response({
            'image_url': f'/uploads/{filename}',
            'message': 'Profile image uploaded successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return create_error_response(
            code='UPLOAD_ERROR',
            message=str(e),
            status=500
        )

# ============================================================================
# PLAYLIST COVER UPLOAD
# ============================================================================

def allowed_file(filename):
    """Check if file extension is allowed"""
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@uploads_bp.route('/playlists/<int:playlist_id>/cover', methods=['POST'])
@jwt_required()
def upload_playlist_cover(playlist_id):
    """Upload playlist cover image"""
    from flask_jwt_extended import get_jwt_identity
    from app.models import Playlist
    
    user_id = get_jwt_identity()
    playlist = db.session.get(Playlist, playlist_id)
    
    if not playlist:
        return create_error_response(
            code='RESOURCE_NOT_FOUND',
            message='Playlist not found',
            status=404
        )
    
    # Check ownership
    if playlist.user_id != user_id:
        return create_error_response(
            code='AUTH_DENIED',
            message='Unauthorized access to playlist',
            status=403
        )
    
    if 'cover' not in request.files:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='No cover file provided',
            status=400
        )
    
    file = request.files['cover']
    
    # Process and save image using FileUploadService
    result = FileUploadService.process_and_save_image(
        file, 
        'playlists', 
        (500, 500)
    )
    
    if not result['success']:
        return create_error_response(
            code='UPLOAD_ERROR',
            message=result['error'],
            status=400
        )
    
    try:
        # Delete old cover if exists
        if playlist.cover_image:
            FileUploadService.delete_image(playlist.cover_image)
        
        # Update playlist model with full relative path from FileUploadService
        playlist.cover_image = result['url']
        db.session.commit()
        
        return create_success_response({
            'cover_url': result['url'],
            'message': 'Playlist cover uploaded successfully',
            'playlist_id': playlist_id
        })
        
    except Exception as e:
        db.session.rollback()
        return create_error_response(
            code='UPLOAD_ERROR',
            message=str(e),
            status=500
        )

@uploads_bp.route('/playlists/<int:playlist_id>/cover', methods=['DELETE'])
@jwt_required()
def delete_playlist_cover(playlist_id):
    """Delete playlist cover image"""
    from flask_jwt_extended import get_jwt_identity
    from app.models import Playlist
    
    user_id = get_jwt_identity()
    playlist = db.session.get(Playlist, playlist_id)
    
    if not playlist:
        return create_error_response(
            code='RESOURCE_NOT_FOUND',
            message='Playlist not found',
            status=404
        )
    
    # Check ownership
    if playlist.user_id != user_id:
        return create_error_response(
            code='AUTH_DENIED',
            message='Unauthorized access to playlist',
            status=403
        )
    
    # Use consistent field name 'cover_image'
    if not playlist.cover_image:
        return create_error_response(
            code='RESOURCE_NOT_FOUND',
            message='No cover image to delete',
            status=404
        )
    
    try:
        # Delete file using FileUploadService
        FileUploadService.delete_image(playlist.cover_image)
        
        # Update playlist model
        playlist.cover_image = None
        db.session.commit()
        
        return create_success_response({
            'message': 'Playlist cover deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return create_error_response(
            code='UPLOAD_ERROR',
            message=str(e),
            status=500
        )

@uploads_bp.route('/profile/image', methods=['DELETE'])
@jwt_required()
def delete_profile_image():
    """Delete user profile image"""
    from flask_jwt_extended import get_jwt_identity
    from app.models import User
    
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return create_error_response(
            code='RESOURCE_NOT_FOUND',
            message='User not found',
            status=404
        )
    
    if not user.profile_image:
        return create_error_response(
            code='RESOURCE_NOT_FOUND',
            message='No profile image to delete',
            status=404
        )
    
    try:
        # Delete file
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], user.profile_image)
        if os.path.exists(filepath):
            os.remove(filepath)
        
        # Update user model
        user.profile_image = None
        db.session.commit()
        
        return create_success_response({
            'message': 'Profile image deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500