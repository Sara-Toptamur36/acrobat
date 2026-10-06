import { useEffect, useState } from 'react'
import { usePlayer } from '../contexts/PlayerContext'

const Player = () => {
    const { currentSong, isPlaying, togglePlay, playNext, playPrev, volume, setVolume, audioRef, seek } = usePlayer()
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)

    useEffect(() => {
        const audio = audioRef.current
        const updateTime = () => setCurrentTime(audio.currentTime)
        const updateDuration = () => setDuration(audio.duration)

        audio.addEventListener('timeupdate', updateTime)
        audio.addEventListener('loadedmetadata', updateDuration)

        return () => {
            audio.removeEventListener('timeupdate', updateTime)
            audio.removeEventListener('loadedmetadata', updateDuration)
        }
    }, [audioRef])

    const formatTime = (time) => {
        if (!time) return '0:00'
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
    }

    const handleSeek = (e) => {
        const time = e.target.value
        seek(time)
        setCurrentTime(time)
    }

    if (!currentSong) return null

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 p-4 md:pl-72 z-40 animate-slide-up">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

                {/* Check: Song Info */}
                <div className="flex items-center gap-4 w-1/3">
                    <div className="w-14 h-14 rounded-lg bg-neutral-800 flex items-center justify-center overflow-hidden border border-white/10 shadow-lg relative group">
                        {currentSong.album?.cover_url ? (
                            <img src={currentSong.album.cover_url} alt="Cover" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-2xl animate-pulse-slow">🎵</span>
                        )}
                        <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center">
                            <button className="text-white hover:scale-110 transition-transform">↗</button>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-white truncate max-w-[150px] sm:max-w-xs cursor-pointer hover:underline decoration-yellow-500 underline-offset-4">
                            {currentSong.title}
                        </h4>
                        <p className="text-xs text-neutral-400 truncate max-w-[150px] sm:max-w-xs hover:text-white transition-colors cursor-pointer">
                            {currentSong.album?.artist?.name || 'Unknown Artist'}
                        </p>
                    </div>
                </div>

                {/* Check: Controls */}
                <div className="flex flex-col items-center gap-2 w-1/3">
                    <div className="flex items-center gap-6">
                        <button onClick={playPrev} className="text-neutral-400 hover:text-white transition-colors hover:scale-110 active:scale-95">
                            ⏮
                        </button>
                        <button
                            onClick={togglePlay}
                            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 hover:bg-yellow-500 transition-all shadow-lg shadow-white/10 active:scale-95"
                        >
                            {isPlaying ? '⏸' : '▶'}
                        </button>
                        <button onClick={playNext} className="text-neutral-400 hover:text-white transition-colors hover:scale-110 active:scale-95">
                            ⏭
                        </button>
                    </div>
                    <div className="flex items-center gap-2 w-full max-w-sm">
                        <span className="text-[10px] text-neutral-400 font-mono">{formatTime(currentTime)}</span>
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={currentTime}
                            onChange={handleSeek}
                            className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-yellow-500 hover:h-2 transition-all"
                        />
                        <span className="text-[10px] text-neutral-400 font-mono">{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Check: Volume */}
                <div className="flex items-center justify-end gap-3 w-1/3">
                    <button onClick={() => setVolume(volume === 0 ? 1 : 0)} className="text-neutral-400 hover:text-white">
                        {volume === 0 ? '🔇' : '🔊'}
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-24 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                    />
                </div>
            </div>
        </div>
    )
}

export default Player
