"""
Test configuration and fixtures for property-based testing
"""
import pytest
import os
import subprocess
import re
import shutil
from pathlib import Path
from decimal import Decimal
from datetime import datetime
from contextlib import contextmanager
from uuid import uuid4
from hypothesis import strategies as st
from hypothesis import settings, Verbosity
from flask_jwt_extended import create_access_token
from sqlalchemy import text, event

from app import create_app, db
from app.models import User, Artist, Album, Song, Genre, Playlist, PlaylistSong, RatingComment

# Configure Hypothesis for more thorough testing
settings.register_profile("default", max_examples=100, verbosity=Verbosity.normal)
settings.register_profile("ci", max_examples=1000, verbosity=Verbosity.verbose)
settings.register_profile("dev", max_examples=10, verbosity=Verbosity.normal)

# Use CI profile if in CI environment, otherwise use default
profile = "ci" if os.getenv("CI") else "default"
settings.load_profile(profile)

@pytest.fixture(scope='session')
def app():
    """Create application for testing"""
    app = create_app('testing')
    
    with app.app_context():
        # Remove any existing sessions to avoid conflicts
        db.session.remove()
        
        # Use SQLAlchemy's built-in drop/create (safer than manual DDL)
        db.drop_all()
        db.create_all()
        print("Created all tables")
        
        # Get absolute path to SQL files from conftest.py location
        # conftest.py is at backend/tests/conftest.py
        # We need to go up 2 levels to reach project root, then into db/
        conftest_path = Path(__file__).resolve()
        project_root = conftest_path.parents[2]  # Go up 3 levels: conftest.py -> tests -> backend -> project_root
        db_dir = project_root / 'db'
        print(f"SQL db_dir: {db_dir}")
        
        # Load SQL files for triggers, views, and procedures via subprocess
        try:
            # Find mysql.exe executable
            mysql_exe = shutil.which("mysql")
            if not mysql_exe:
                # Try common Windows MySQL installation paths
                default_paths = [
                    r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
                    r"C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysql.exe",
                    r"C:\ProgramData\MySQL\MySQL Server 8.0\bin\mysql.exe"
                ]
                
                for path in default_paths:
                    if Path(path).exists():
                        mysql_exe = path
                        break
                
                if not mysql_exe:
                    pytest.fail(f"mysql.exe not found. Tried paths: {', '.join(['shutil.which(mysql)'] + default_paths)}")
            
            print(f"Using mysql.exe: {mysql_exe}")
            
            # Get database connection info from config
            db_url = app.config['SQLALCHEMY_DATABASE_URI']
            # Parse MySQL URL: mysql+pymysql://user:password@host:port/database
            import re
            match = re.match(r'mysql\+pymysql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', db_url)
            if match:
                user, password, host, port, database = match.groups()
                print(f"Using test database: {database}")
                
                # Load SQL files in order: schema, triggers, procedures, views
                sql_files = ['triggers.sql', 'procedures.sql', 'views.sql']
                
                # Check if all required SQL files exist first (fail-fast)
                missing_files = []
                for sql_file in sql_files:
                    sql_path = db_dir / sql_file
                    if not sql_path.exists():
                        missing_files.append(str(sql_path))
                
                if missing_files:
                    pytest.fail(f"Required SQL files not found: {', '.join(missing_files)}")
                
                # Load each SQL file
                for sql_file in sql_files:
                    sql_path = db_dir / sql_file
                    
                    # Use mysql.exe with subprocess to handle DELIMITER statements
                    cmd = [
                        mysql_exe,
                        "-u", user,
                        "-h", host,
                        "-P", str(port),
                        f"--password={password}",
                        "--protocol=tcp",
                        "--default-character-set=utf8mb4",
                        f"--execute=source {str(sql_path).replace(chr(92), '/')}",
                        database
                    ]
                    
                    # Set up environment
                    env = os.environ.copy()
                    
                    try:
                        result = subprocess.run(
                            cmd,
                            text=True,
                            check=True,
                            capture_output=True,
                            timeout=30,
                            env=env
                        )
                        
                        print(f"Successfully loaded {sql_file}")
                    except subprocess.CalledProcessError as e:
                        print(f"Failed to load {sql_file}")
                        print(f"stdout: {e.stdout}")
                        print(f"stderr: {e.stderr}")
                        pytest.fail(f"Failed to load {sql_file}: {e.stderr}")
            else:
                pytest.fail(f"Could not parse database URL: {db_url}")
                
        except Exception as e:
            pytest.fail(f"Could not load SQL files: {e}")
        
        yield app


@contextmanager
def db_test_session(app):
    """Context manager for database session with transaction rollback"""
    with app.app_context():
        # Use a simple approach - just ensure we clean up after each test
        try:
            yield db.session
        finally:
            # Clean up any uncommitted changes
            db.session.rollback()
            db.session.remove()

@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()

@pytest.fixture
def db_session(app):
    """Create database session with nested transaction (SAVEPOINT) isolation"""
    with app.app_context():
        connection = db.engine.connect()
        trans = connection.begin()
        
        # MySQL lock beklemelerini kısalt (donma olmasın)
        connection.execute(text("SET SESSION innodb_lock_wait_timeout=2"))
        connection.execute(text("SET SESSION lock_wait_timeout=2"))
        connection.execute(text("SET SESSION wait_timeout=10"))
        
        # Session'ı bu connection'a bağla
        db.session.configure(bind=connection)
        
        # SAVEPOINT başlat
        db.session.begin_nested()
        
        # Nested transaction biterse otomatik yeni SAVEPOINT aç
        @event.listens_for(db.session, "after_transaction_end")
        def restart_savepoint(session, transaction):
            if transaction.nested and transaction._parent is not None and not transaction._parent.nested:
                session.begin_nested()
        
        try:
            yield db.session
        finally:
            db.session.rollback()
            db.session.remove()
            trans.rollback()
            connection.close()

@pytest.fixture
def auth_headers(app):
    """Create authenticated user and return auth headers"""
    with app.app_context():
        # Create test user with unique identifiers to avoid duplicates
        unique_suffix = uuid4().hex[:8]
        username = f"testuser_{unique_suffix}"
        email = f"test_{unique_suffix}@example.com"
        
        user = User(username=username, email=email, role='user')
        user.set_password('password123')
        db.session.add(user)
        db.session.commit()
        
        # Create access token - JWT identity must be string
        token = create_access_token(identity=str(user.user_id))
        
        # Store user_id for cleanup
        user_id = user.user_id
        
        headers = {'Authorization': f'Bearer {token}'}
        
        yield headers
        
        # Cleanup: Remove the user after test
        try:
            user_to_delete = db.session.get(User, user_id)
            if user_to_delete:
                db.session.delete(user_to_delete)
                db.session.commit()
        except Exception:
            db.session.rollback()

@pytest.fixture
def admin_headers(app):
    """Create admin user and return auth headers"""
    with app.app_context():
        # Create admin user with unique identifiers to avoid duplicates
        unique_suffix = uuid4().hex[:8]
        username = f"admin_{unique_suffix}"
        email = f"admin_{unique_suffix}@example.com"
        
        admin = User(username=username, email=email, role='admin')
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
        
        # Create access token - JWT identity must be string
        token = create_access_token(identity=str(admin.user_id))
        
        # Store user_id for cleanup
        user_id = admin.user_id
        
        headers = {'Authorization': f'Bearer {token}'}
        
        yield headers
        
        # Cleanup: Remove the admin after test
        try:
            admin_to_delete = db.session.get(User, user_id)
            if admin_to_delete:
                db.session.delete(admin_to_delete)
                db.session.commit()
        except Exception:
            db.session.rollback()

@pytest.fixture
def db_session_commit(app):
    """Create database session with real commits for trigger testing"""
    with app.app_context():
        try:
            # Clean up any existing data before starting
            db.session.rollback()  # Clear any pending transactions
            
            # Disable foreign key checks during cleanup
            db.session.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
            
            # Truncate tables in order (children first, then parents)
            tables_to_truncate = [
                'ratings_comments',
                'playlist_songs', 
                'playlists',
                'songs',
                'albums', 
                'artists',
                'genres',
                'users'
            ]
            
            for table in tables_to_truncate:
                db.session.execute(text(f"TRUNCATE TABLE {table}"))
            
            # Re-enable foreign key checks
            db.session.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
            db.session.commit()
            
            yield db.session
        finally:
            try:
                # Clean up tables in reverse dependency order
                db.session.rollback()  # Clear any pending transactions
                
                # Disable foreign key checks during cleanup
                db.session.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
                
                # Truncate tables in order (children first, then parents)
                tables_to_truncate = [
                    'ratings_comments',
                    'playlist_songs', 
                    'playlists',
                    'songs',
                    'albums', 
                    'artists',
                    'genres',
                    'users'
                ]
                
                for table in tables_to_truncate:
                    db.session.execute(text(f"TRUNCATE TABLE {table}"))
                
                # Re-enable foreign key checks
                db.session.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
                db.session.commit()
            except Exception as e:
                print(f"Warning: Cleanup failed: {e}")
                db.session.rollback()
            finally:
                db.session.remove()

# Hypothesis strategies for generating test data
@st.composite
def user_strategy(draw):
    """Generate valid user data"""
    username = draw(st.text(min_size=3, max_size=50, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'))))
    email = draw(st.emails())
    role = draw(st.sampled_from(['user', 'admin']))
    return {
        'username': username,
        'email': email,
        'role': role
    }

@st.composite
def artist_strategy(draw):
    """Generate valid artist data"""
    name = draw(st.text(min_size=1, max_size=255).filter(lambda x: x.strip()))
    bio = draw(st.one_of(st.none(), st.text(max_size=1000)))
    return {
        'name': name.strip(),
        'bio': bio
    }

@st.composite
def genre_strategy(draw):
    """Generate valid genre data"""
    name = draw(st.text(min_size=1, max_size=100).filter(lambda x: x.strip()))
    description = draw(st.one_of(st.none(), st.text(max_size=500)))
    return {
        'name': name.strip(),
        'description': description
    }

@st.composite
def album_strategy(draw, artist_id=None):
    """Generate valid album data"""
    title = draw(st.text(min_size=1, max_size=255).filter(lambda x: x.strip()))
    release_year = draw(st.one_of(st.none(), st.integers(min_value=1900, max_value=2030)))
    return {
        'title': title.strip(),
        'release_year': release_year,
        'artist_id': artist_id or draw(st.integers(min_value=1, max_value=1000))
    }

@st.composite
def song_strategy(draw, album_id=None, genre_id=None):
    """Generate valid song data"""
    title = draw(st.text(min_size=1, max_size=255).filter(lambda x: x.strip()))
    duration = draw(st.integers(min_value=1, max_value=3600))  # 1 second to 1 hour
    track_number = draw(st.integers(min_value=1, max_value=100))
    return {
        'title': title.strip(),
        'duration': duration,
        'track_number': track_number,
        'album_id': album_id or draw(st.integers(min_value=1, max_value=1000)),
        'genre_id': genre_id or draw(st.integers(min_value=1, max_value=100))
    }

@st.composite
def rating_strategy(draw):
    """Generate valid rating data"""
    rating = draw(st.one_of(
        st.none(),
        st.floats(min_value=0.0, max_value=10.0, allow_nan=False, allow_infinity=False)
    ))
    comment = draw(st.one_of(st.none(), st.text(max_size=1000)))
    
    # Ensure at least one of rating or comment is provided
    if rating is None and (comment is None or not comment.strip()):
        rating = draw(st.floats(min_value=0.0, max_value=10.0, allow_nan=False, allow_infinity=False))
    
    return {
        'rating': rating,
        'comment': comment.strip() if comment else None
    }

@st.composite
def playlist_strategy(draw, user_id=None):
    """Generate valid playlist data"""
    name = draw(st.text(min_size=1, max_size=255).filter(lambda x: x.strip()))
    return {
        'name': name.strip(),
        'user_id': user_id or draw(st.integers(min_value=1, max_value=1000))
    }

@pytest.fixture
def sample_data(app):
    """Create sample data for tests that need it"""
    with app.app_context():
        # Create test data with real commits (not using db_session fixture)
        import uuid
        unique_suffix = str(uuid.uuid4())[:8]
        
        # Create user
        user = User(username=f'sample_user_{unique_suffix}', email=f'sample_{unique_suffix}@example.com', role='user')
        user.password_hash = "test-hash"
        db.session.add(user)
        
        # Create artist
        artist = Artist(name=f'Sample Artist {unique_suffix}', bio='Test bio')
        db.session.add(artist)
        
        # Create genre
        genre = Genre(name=f'Sample Genre {unique_suffix}', description='Test description')
        db.session.add(genre)
        
        # Flush to get IDs
        db.session.flush()
        
        # Create album
        album = Album(title=f'Sample Album {unique_suffix}', artist_id=artist.artist_id, release_year=2024)
        db.session.add(album)
        
        # Flush to get album ID
        db.session.flush()
        
        # Create song
        import random
        song = Song(
            title=f'Sample Song {unique_suffix}',
            album_id=album.album_id,
            genre_id=genre.genre_id,
            duration=180,
            track_number=random.randint(1, 999)
        )
        db.session.add(song)
        
        # Commit all changes
        db.session.commit()
        
        # Store IDs for cleanup
        data = {
            'user_id': user.user_id,
            'artist_id': artist.artist_id,
            'genre_id': genre.genre_id,
            'album_id': album.album_id,
            'song_id': song.song_id
        }
        
        yield data
        
        # Cleanup: Remove all created data
        try:
            # Delete in reverse order of dependencies
            song_to_delete = db.session.get(Song, data['song_id'])
            if song_to_delete:
                db.session.delete(song_to_delete)
            
            album_to_delete = db.session.get(Album, data['album_id'])
            if album_to_delete:
                db.session.delete(album_to_delete)
            
            genre_to_delete = db.session.get(Genre, data['genre_id'])
            if genre_to_delete:
                db.session.delete(genre_to_delete)
            
            artist_to_delete = db.session.get(Artist, data['artist_id'])
            if artist_to_delete:
                db.session.delete(artist_to_delete)
            
            user_to_delete = db.session.get(User, data['user_id'])
            if user_to_delete:
                db.session.delete(user_to_delete)
            
            db.session.commit()
        except Exception:
            db.session.rollback()

# Helper functions for creating test data
def create_test_user(db_session, **kwargs):
    """Create a test user with optional overrides"""
    import uuid
    unique_suffix = str(uuid.uuid4())[:8]
    defaults = {
        'username': f'testuser_{unique_suffix}',
        'email': f'test_{unique_suffix}@example.com',
        'role': 'user'
    }
    defaults.update(kwargs)
    
    user = User(**defaults)
    # Bypass bcrypt in tests for performance - use simple test hash
    user.password_hash = "test-hash"
    db_session.add(user)
    db_session.flush()
    return user

def create_test_artist(db_session, **kwargs):
    """Create a test artist with optional overrides"""
    import uuid
    unique_suffix = str(uuid.uuid4())[:8]
    defaults = {
        'name': f'Test Artist {unique_suffix}',
        'bio': 'Test bio'
    }
    defaults.update(kwargs)
    
    artist = Artist(**defaults)
    db_session.add(artist)
    db_session.flush()
    return artist

def create_test_genre(db_session, **kwargs):
    """Create a test genre with optional overrides"""
    import uuid
    unique_suffix = str(uuid.uuid4())[:8]
    defaults = {
        'name': f'Test Genre {unique_suffix}',
        'description': 'Test description'
    }
    defaults.update(kwargs)
    
    genre = Genre(**defaults)
    db_session.add(genre)
    db_session.flush()
    return genre

def create_test_album(db_session, artist_id=None, **kwargs):
    """Create a test album with optional overrides"""
    if artist_id is None:
        artist = create_test_artist(db_session)
        artist_id = artist.artist_id
    
    import uuid
    unique_suffix = str(uuid.uuid4())[:8]
    defaults = {
        'title': f'Test Album {unique_suffix}',
        'artist_id': artist_id,
        'release_year': 2024
    }
    defaults.update(kwargs)
    
    album = Album(**defaults)
    db_session.add(album)
    db_session.flush()
    return album

def create_test_song(db_session, album_id=None, genre_id=None, **kwargs):
    """Create a test song with optional overrides"""
    if album_id is None:
        album = create_test_album(db_session)
        album_id = album.album_id
    
    if genre_id is None:
        genre = create_test_genre(db_session)
        genre_id = genre.genre_id
    
    import uuid
    import random
    unique_suffix = str(uuid.uuid4())[:8]
    defaults = {
        'title': f'Test Song {unique_suffix}',
        'album_id': album_id,
        'genre_id': genre_id,
        'duration': 180,
        'track_number': random.randint(1, 999)
    }
    defaults.update(kwargs)
    
    song = Song(**defaults)
    db_session.add(song)
    db_session.flush()
    return song

def create_test_playlist(db_session, user_id=None, **kwargs):
    """Create a test playlist with optional overrides"""
    if user_id is None:
        user = create_test_user(db_session)
        user_id = user.user_id
    
    import uuid
    unique_suffix = str(uuid.uuid4())[:8]
    defaults = {
        'name': f'Test Playlist {unique_suffix}',
        'user_id': user_id
    }
    defaults.update(kwargs)
    
    playlist = Playlist(**defaults)
    db_session.add(playlist)
    db_session.flush()
    return playlist

def create_test_rating(db_session, user_id=None, song_id=None, **kwargs):
    """Create a test rating with optional overrides"""
    if user_id is None:
        user = create_test_user(db_session)
        user_id = user.user_id
    
    if song_id is None:
        song = create_test_song(db_session)
        song_id = song.song_id
    
    defaults = {
        'user_id': user_id,
        'song_id': song_id,
        'rating': Decimal('8.5'),
        'comment': 'Test comment'
    }
    defaults.update(kwargs)
    
    rating = RatingComment(**defaults)
    db_session.add(rating)
    db_session.flush()
    return rating