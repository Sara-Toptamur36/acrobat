"""
Integration tests for foreign key cascade behaviors
Tests the complete cascade chain when songs are deleted
"""
import pytest
from decimal import Decimal

from app import db
from app.models import User, Artist, Album, Song, Genre, Playlist, PlaylistSong, RatingComment
from tests.conftest import (
    create_test_user, create_test_artist, create_test_album, 
    create_test_song, create_test_genre, create_test_playlist
)


class TestCascadeIntegration:
    """Integration tests for cascade delete behaviors"""

    @pytest.mark.integration
    def test_song_deletion_cascades_to_dependent_records(self, app, db_session):
        """
        Integration test: Song deletion should cascade to playlist_songs and ratings_comments
        
        Test scenario:
        1. Create artist -> album -> song hierarchy
        2. Create playlist and add song to it
        3. Create rating for the song
        4. Delete the song
        5. Verify playlist_songs and ratings_comments are automatically cleaned up
        """
        with app.app_context():
            # Step 1: Create the complete hierarchy
            artist = create_test_artist(db_session, name='Test Artist')
            album = create_test_album(db_session, 
                artist_id=artist.artist_id, 
                title='Test Album'
            )
            genre = create_test_genre(db_session, name='Test Genre')
            song = create_test_song(db_session,
                album_id=album.album_id,
                genre_id=genre.genre_id,
                title='Test Song'
            )
            
            # Step 2: Create playlist and add song
            user = create_test_user(db_session, 
                username='testuser', 
                email='test@example.com'
            )
            playlist = create_test_playlist(db_session,
                user_id=user.user_id,
                name='Test Playlist'
            )
            
            # Add song to playlist
            playlist_song = PlaylistSong(
                playlist_id=playlist.playlist_id,
                song_id=song.song_id,
                position=1
            )
            db_session.add(playlist_song)
            
            # Step 3: Create rating for the song
            rating = RatingComment(
                user_id=user.user_id,
                song_id=song.song_id,
                rating=Decimal('8.5'),
                comment='Great song!'
            )
            db_session.add(rating)
            db_session.commit()
            
            # Verify initial state
            assert db_session.query(Song).filter_by(song_id=song.song_id).count() == 1
            assert db_session.query(PlaylistSong).filter_by(song_id=song.song_id).count() == 1
            assert db_session.query(RatingComment).filter_by(song_id=song.song_id).count() == 1
            assert db_session.query(Playlist).filter_by(playlist_id=playlist.playlist_id).count() == 1
            
            # Record counts before deletion
            initial_playlist_songs_count = db_session.query(PlaylistSong).count()
            initial_ratings_count = db_session.query(RatingComment).count()
            initial_playlists_count = db_session.query(Playlist).count()
            initial_albums_count = db_session.query(Album).count()
            initial_artists_count = db_session.query(Artist).count()
            
            # Step 4: Delete the song
            db_session.delete(song)
            db_session.commit()
            
            # Step 5: Verify cascades worked correctly
            
            # Song should be deleted
            assert db_session.query(Song).filter_by(song_id=song.song_id).count() == 0, \
                "Song should be deleted"
            
            # playlist_songs should be cascaded (deleted)
            assert db_session.query(PlaylistSong).filter_by(song_id=song.song_id).count() == 0, \
                "PlaylistSong entries should be cascaded when song is deleted"
            
            # ratings_comments should be cascaded (deleted)
            assert db_session.query(RatingComment).filter_by(song_id=song.song_id).count() == 0, \
                "RatingComment entries should be cascaded when song is deleted"
            
            # Verify total counts decreased correctly
            final_playlist_songs_count = db_session.query(PlaylistSong).count()
            final_ratings_count = db_session.query(RatingComment).count()
            
            assert final_playlist_songs_count == initial_playlist_songs_count - 1, \
                "PlaylistSongs count should decrease by 1"
            assert final_ratings_count == initial_ratings_count - 1, \
                "Ratings count should decrease by 1"
            
            # Verify parent records still exist (no over-cascading)
            assert db_session.query(Playlist).filter_by(playlist_id=playlist.playlist_id).count() == 1, \
                "Playlist should still exist"
            assert db_session.query(Album).filter_by(album_id=album.album_id).count() == 1, \
                "Album should still exist"
            assert db_session.query(Artist).filter_by(artist_id=artist.artist_id).count() == 1, \
                "Artist should still exist"
            assert db_session.query(User).filter_by(user_id=user.user_id).count() == 1, \
                "User should still exist"
            
            # Verify counts of parent records unchanged
            final_playlists_count = db_session.query(Playlist).count()
            final_albums_count = db_session.query(Album).count()
            final_artists_count = db_session.query(Artist).count()
            
            assert final_playlists_count == initial_playlists_count, \
                "Playlists count should remain unchanged"
            assert final_albums_count == initial_albums_count, \
                "Albums count should remain unchanged"
            assert final_artists_count == initial_artists_count, \
                "Artists count should remain unchanged"

    @pytest.mark.integration
    def test_multiple_songs_cascade_behavior(self, app, db_session):
        """
        Integration test: Multiple songs in same playlist/ratings scenario
        
        Verify that deleting one song doesn't affect other songs' relationships
        """
        with app.app_context():
            # Create test data
            artist = create_test_artist(db_session)
            album = create_test_album(db_session, artist_id=artist.artist_id)
            genre = create_test_genre(db_session)
            
            # Create two songs
            song1 = create_test_song(db_session,
                album_id=album.album_id,
                genre_id=genre.genre_id,
                title='Song 1',
                track_number=1
            )
            song2 = create_test_song(db_session,
                album_id=album.album_id,
                genre_id=genre.genre_id,
                title='Song 2',
                track_number=2
            )
            
            # Create user and playlist
            user = create_test_user(db_session)
            playlist = create_test_playlist(db_session, user_id=user.user_id)
            
            # Add both songs to playlist
            playlist_song1 = PlaylistSong(
                playlist_id=playlist.playlist_id,
                song_id=song1.song_id,
                position=1
            )
            playlist_song2 = PlaylistSong(
                playlist_id=playlist.playlist_id,
                song_id=song2.song_id,
                position=2
            )
            db_session.add_all([playlist_song1, playlist_song2])
            
            # Add ratings for both songs
            rating1 = RatingComment(
                user_id=user.user_id,
                song_id=song1.song_id,
                rating=Decimal('8.0'),
                comment='Good song'
            )
            rating2 = RatingComment(
                user_id=user.user_id,
                song_id=song2.song_id,
                rating=Decimal('9.0'),
                comment='Great song'
            )
            db_session.add_all([rating1, rating2])
            db_session.commit()
            
            # Verify initial state
            assert db_session.query(PlaylistSong).filter_by(playlist_id=playlist.playlist_id).count() == 2
            assert db_session.query(RatingComment).filter_by(user_id=user.user_id).count() == 2
            
            # Delete first song
            db_session.delete(song1)
            db_session.commit()
            
            # Verify only song1's relationships are deleted
            assert db_session.query(Song).filter_by(song_id=song1.song_id).count() == 0, \
                "Song1 should be deleted"
            assert db_session.query(Song).filter_by(song_id=song2.song_id).count() == 1, \
                "Song2 should still exist"
            
            # Verify playlist_songs cascade
            assert db_session.query(PlaylistSong).filter_by(song_id=song1.song_id).count() == 0, \
                "Song1's playlist entry should be cascaded"
            assert db_session.query(PlaylistSong).filter_by(song_id=song2.song_id).count() == 1, \
                "Song2's playlist entry should remain"
            
            # Verify ratings cascade
            assert db_session.query(RatingComment).filter_by(song_id=song1.song_id).count() == 0, \
                "Song1's rating should be cascaded"
            assert db_session.query(RatingComment).filter_by(song_id=song2.song_id).count() == 1, \
                "Song2's rating should remain"
            
            # Verify playlist still exists and has correct count
            remaining_playlist_songs = db_session.query(PlaylistSong).filter_by(
                playlist_id=playlist.playlist_id
            ).all()
            assert len(remaining_playlist_songs) == 1, \
                "Playlist should have 1 remaining song"
            assert remaining_playlist_songs[0].song_id == song2.song_id, \
                "Remaining song should be song2"

    @pytest.mark.integration
    def test_album_deletion_cascades_through_songs(self, app, db_session):
        """
        Integration test: Album deletion should cascade through songs to dependent records
        
        Test the complete cascade chain: album -> songs -> playlist_songs & ratings_comments
        """
        with app.app_context():
            # Create test hierarchy
            artist = create_test_artist(db_session)
            album = create_test_album(db_session, artist_id=artist.artist_id)
            genre = create_test_genre(db_session)
            
            # Create multiple songs in the album
            songs = []
            for i in range(3):
                song = create_test_song(db_session,
                    album_id=album.album_id,
                    genre_id=genre.genre_id,
                    title=f'Song {i+1}',
                    track_number=i+1
                )
                songs.append(song)
            
            # Create user, playlist, and relationships
            user = create_test_user(db_session)
            playlist = create_test_playlist(db_session, user_id=user.user_id)
            
            # Add all songs to playlist and create ratings
            for i, song in enumerate(songs):
                playlist_song = PlaylistSong(
                    playlist_id=playlist.playlist_id,
                    song_id=song.song_id,
                    position=i+1
                )
                db_session.add(playlist_song)
                
                rating = RatingComment(
                    user_id=user.user_id,
                    song_id=song.song_id,
                    rating=Decimal(f'{7 + i}.5'),
                    comment=f'Comment for song {i+1}'
                )
                db_session.add(rating)
            
            db_session.commit()
            
            # Verify initial state
            assert db_session.query(Album).filter_by(album_id=album.album_id).count() == 1
            assert db_session.query(Song).filter_by(album_id=album.album_id).count() == 3
            assert db_session.query(PlaylistSong).filter_by(playlist_id=playlist.playlist_id).count() == 3
            assert db_session.query(RatingComment).filter_by(user_id=user.user_id).count() == 3
            
            # Record song IDs for verification
            song_ids = [song.song_id for song in songs]
            
            # Delete the album (should cascade to songs, then to playlist_songs and ratings)
            db_session.delete(album)
            db_session.commit()
            
            # Verify complete cascade
            assert db_session.query(Album).filter_by(album_id=album.album_id).count() == 0, \
                "Album should be deleted"
            
            # All songs should be cascaded
            for song_id in song_ids:
                assert db_session.query(Song).filter_by(song_id=song_id).count() == 0, \
                    f"Song {song_id} should be cascaded"
            
            # All playlist_songs should be cascaded
            for song_id in song_ids:
                assert db_session.query(PlaylistSong).filter_by(song_id=song_id).count() == 0, \
                    f"PlaylistSong for song {song_id} should be cascaded"
            
            # All ratings should be cascaded
            for song_id in song_ids:
                assert db_session.query(RatingComment).filter_by(song_id=song_id).count() == 0, \
                    f"Rating for song {song_id} should be cascaded"
            
            # Verify playlist still exists but is empty
            assert db_session.query(Playlist).filter_by(playlist_id=playlist.playlist_id).count() == 1, \
                "Playlist should still exist"
            assert db_session.query(PlaylistSong).filter_by(playlist_id=playlist.playlist_id).count() == 0, \
                "Playlist should be empty after cascade"
            
            # Verify user and artist still exist
            assert db_session.query(User).filter_by(user_id=user.user_id).count() == 1, \
                "User should still exist"
            assert db_session.query(Artist).filter_by(artist_id=artist.artist_id).count() == 1, \
                "Artist should still exist"

    @pytest.mark.integration
    def test_cascade_with_triggers_integration(self, app, db_session):
        """
        Integration test: Verify cascade behavior works correctly with database triggers
        
        Test that album statistics triggers work correctly even during cascade operations
        """
        with app.app_context():
            # Create test data
            artist = create_test_artist(db_session)
            album = create_test_album(db_session, artist_id=artist.artist_id)
            genre = create_test_genre(db_session)
            
            # Create songs
            song1 = create_test_song(db_session,
                album_id=album.album_id,
                genre_id=genre.genre_id,
                title='Song 1',
                duration=180,
                track_number=1
            )
            song2 = create_test_song(db_session,
                album_id=album.album_id,
                genre_id=genre.genre_id,
                title='Song 2',
                duration=240,
                track_number=2
            )
            
            db_session.commit()
            db_session.refresh(album)
            
            # Verify triggers updated album stats
            assert album.song_count == 2, "Album should have 2 songs"
            assert album.total_duration == 420, "Album duration should be 420 seconds"
            
            # Create playlist and rating relationships
            user = create_test_user(db_session)
            playlist = create_test_playlist(db_session, user_id=user.user_id)
            
            playlist_song = PlaylistSong(
                playlist_id=playlist.playlist_id,
                song_id=song1.song_id,
                position=1
            )
            db_session.add(playlist_song)
            
            rating = RatingComment(
                user_id=user.user_id,
                song_id=song1.song_id,
                rating=Decimal('8.5')
            )
            db_session.add(rating)
            db_session.commit()
            
            # Delete one song and verify triggers still work
            db_session.delete(song1)
            db_session.commit()
            db_session.refresh(album)
            
            # Verify album stats updated correctly after cascade
            assert album.song_count == 1, "Album should have 1 song after cascade"
            assert album.total_duration == 240, "Album duration should be 240 seconds after cascade"
            
            # Verify cascade worked
            assert db_session.query(PlaylistSong).filter_by(song_id=song1.song_id).count() == 0, \
                "PlaylistSong should be cascaded"
            assert db_session.query(RatingComment).filter_by(song_id=song1.song_id).count() == 0, \
                "Rating should be cascaded"
            
            # Verify remaining song still exists
            assert db_session.query(Song).filter_by(song_id=song2.song_id).count() == 1, \
                "Song2 should still exist"