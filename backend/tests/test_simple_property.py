"""
Simple property test to verify test infrastructure works without triggers
"""
import pytest
from hypothesis import given, strategies as st, settings, HealthCheck
from tests.conftest import db_test_session, create_test_user, create_test_artist

class TestSimpleProperties:
    """Simple property tests without database triggers"""

    @pytest.mark.property
    @settings(suppress_health_check=[HealthCheck.function_scoped_fixture], max_examples=3)
    @given(
        username=st.text(min_size=3, max_size=20).filter(lambda x: x.strip() and x.isalnum()),
        email_prefix=st.text(min_size=3, max_size=10).filter(lambda x: x.strip() and x.isalnum())
    )
    def test_user_creation_property(self, app, username, email_prefix):
        """
        Simple property test: User creation should work with valid data
        """
        with db_test_session(app) as db_session:
            # Create user with unique data
            email = f"{email_prefix}@example.com"
            user = create_test_user(db_session, username=username, email=email)
            
            # Verify user was created
            assert user.user_id is not None
            assert user.username == username
            assert user.email == email
            assert user.role == 'user'  # default role

    @pytest.mark.property
    @settings(suppress_health_check=[HealthCheck.function_scoped_fixture], max_examples=3)
    @given(
        artist_name=st.text(min_size=1, max_size=50).filter(lambda x: x.strip())
    )
    def test_artist_creation_property(self, app, artist_name):
        """
        Simple property test: Artist creation should work with valid data
        """
        with db_test_session(app) as db_session:
            # Create artist
            artist = create_test_artist(db_session, name=artist_name.strip())
            
            # Verify artist was created
            assert artist.artist_id is not None
            assert artist.name == artist_name.strip()
            assert artist.album_count == 0  # default value