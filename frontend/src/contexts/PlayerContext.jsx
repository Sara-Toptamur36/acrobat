import { createContext, useContext, useState, useRef, useEffect } from 'react'
import { uploadApi } from '../services/api'

const PlayerContext = createContext()

export const usePlayer = () => useContext(PlayerContext)

export const PlayerProvider = ({ children }) => {
    const [currentSong, setCurrentSong] = useState(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [volume, setVolume] = useState(1)
    const [queue, setQueue] = useState([])
    const [currentIndex, setCurrentIndex] = useState(-1)
    const [isShuffle, setIsShuffle] = useState(false)

    const [history, setHistory] = useState([])

    // Audio Ref
    const audioRef = useRef(new Audio())

    useEffect(() => {
        const audio = audioRef.current

        const handleEnded = () => {
            playNext()
        }

        audio.addEventListener('ended', handleEnded)
        return () => audio.removeEventListener('ended', handleEnded)
    }, [queue, currentIndex, isShuffle])

    const toggleShuffle = () => setIsShuffle(!isShuffle)

    const playSong = (song, songList = null) => {
        if (!song) return;

        if (songList && Array.isArray(songList) && songList.length > 0) {
            setQueue(songList);
            const idx = songList.findIndex(s => s.song_id == song.song_id);
            setCurrentIndex(idx !== -1 ? idx : 0);
            // New playlist started, clear history
            setHistory([]);
        } else {
            // Playing same list or single song
            if (currentSong) {
                setHistory(prev => [...prev, currentIndex])
            }
            // If just switching songs in current queue
            if (queue.length > 0) {
                const idx = queue.findIndex(s => s.song_id == song.song_id);
                setCurrentIndex(idx !== -1 ? idx : 0);
            } else {
                setQueue([song]);
                setCurrentIndex(0);
                setHistory([]);
            }
        }

        setCurrentSong(song);
        setIsPlaying(true);

        if (song.file_path) {
            const url = uploadApi.fileUrl(song.file_path);
            if (audioRef.current.src !== url) {
                audioRef.current.src = url;
            }
            audioRef.current.volume = volume;
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Playback failed:", error);
                });
            }
        }
    }

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current.pause()
        } else {
            audioRef.current.play()
        }
        setIsPlaying(!isPlaying)
    }

    const playNext = () => {
        if (queue.length === 0) return

        // Save current to history before moving
        setHistory(prev => [...prev, currentIndex])

        let nextIndex
        if (isShuffle) {
            // Random index that isn't the current one (if possible)
            if (queue.length > 1) {
                do {
                    nextIndex = Math.floor(Math.random() * queue.length)
                } while (nextIndex === currentIndex)
            } else {
                nextIndex = 0
            }
        } else {
            if (currentIndex >= queue.length - 1) {
                setIsPlaying(false)
                return
            }
            nextIndex = currentIndex + 1
        }

        setCurrentIndex(nextIndex)
        // Direct update of current song without calling playSong to avoid history loop double-add issues
        // Actually, playSong handles the audio logic, so we call it but we need to be careful about history?
        // Let's refine playSong to NOT add to history if we do it here? 
        // Or simpler: playSong calculates index. Let's make playSong simpler.
        // We already updated currentIndex.

        const nextSong = queue[nextIndex]
        setCurrentSong(nextSong)
        setIsPlaying(true)

        if (nextSong.file_path) {
            const url = uploadApi.fileUrl(nextSong.file_path);
            audioRef.current.src = url;
            audioRef.current.volume = volume;
            audioRef.current.play().catch(e => console.error(e));
        }
    }

    const playPrev = () => {
        if (queue.length === 0) return

        // If we have history, pop from it
        if (history.length > 0) {
            const prevIndex = history[history.length - 1]
            setHistory(prev => prev.slice(0, -1)) // Pop

            setCurrentIndex(prevIndex)
            const prevSong = queue[prevIndex]
            setCurrentSong(prevSong)
            setIsPlaying(true)

            if (prevSong.file_path) {
                const url = uploadApi.fileUrl(prevSong.file_path);
                audioRef.current.src = url;
                audioRef.current.volume = volume;
                audioRef.current.play().catch(e => console.error(e));
            }
            return
        }

        // Fallback if no history (e.g. at start), sequential logic
        if (currentIndex > 0) {
            const prevIndex = currentIndex - 1
            setCurrentIndex(prevIndex)
            const prevSong = queue[prevIndex]
            setCurrentSong(prevSong)
            setIsPlaying(true)

            if (prevSong.file_path) {
                const url = uploadApi.fileUrl(prevSong.file_path);
                audioRef.current.src = url;
                audioRef.current.volume = volume;
                audioRef.current.play().catch(e => console.error(e));
            }
        } else {
            // Restart current song
            audioRef.current.currentTime = 0
        }
    }

    const handleVolumeChange = (val) => {
        setVolume(val)
        audioRef.current.volume = val
    }

    const seek = (time) => {
        audioRef.current.currentTime = time
    }

    return (
        <PlayerContext.Provider value={{
            currentSong,
            isPlaying,
            playSong,
            togglePlay,
            playNext,
            playPrev,
            volume,
            setVolume: handleVolumeChange,
            audioRef,
            seek,
            isShuffle,
            toggleShuffle,
            setIsShuffle // Exporting this to allow explicit setting
        }}>
            {children}
        </PlayerContext.Provider>
    )
}
