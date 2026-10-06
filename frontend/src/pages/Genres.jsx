import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import { routeHelpers } from '../router/routes'

const Genres = () => {
    const [genres, setGenres] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchGenres()
    }, [])

    const fetchGenres = async () => {
        setLoading(true)
        try {
            const response = await api.get('/genres')
            setGenres(response.data.data.genres || [])
        } catch (error) {
            toast.error('Türler yüklenemedi')
        } finally {
            setLoading(false)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-acrobat-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    )

    const colors = [
        'from-pink-500 to-rose-600',
        'from-purple-500 to-indigo-600',
        'from-blue-500 to-cyan-600',
        'from-emerald-500 to-teal-600',
        'from-amber-500 to-orange-600',
        'from-red-500 to-orange-600',
    ]

    return (
        <div className="space-y-8 animate-fade-in p-2">
            <header>
                <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Türler 🎸</h1>
                <p className="text-acrobat-text-muted font-medium">Ruh haline göre müzik keşfet.</p>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {genres.map((genre, idx) => (
                    <Link
                        key={genre.genre_id}
                        to={`/app/songs?genre_id=${genre.genre_id}`}
                        className={`p-6 rounded-3xl bg-gradient-to-br ${colors[idx % colors.length]} border border-white/5 hover:scale-105 transition-transform group relative overflow-hidden h-40 flex flex-col justify-end`}
                    >
                        <div className="absolute top-4 right-4 text-4xl opacity-20 group-hover:opacity-40 transition-opacity">🎹</div>
                        <h3 className="text-2xl font-black text-white relative z-10">{genre.name}</h3>
                    </Link>
                ))}

                {genres.length === 0 && (
                    <div className="col-span-full py-20 text-center opacity-30">
                        <p className="text-4xl">🌫️</p>
                        <p className="font-bold">Henüz hiç tür tanımlanmadı.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Genres
