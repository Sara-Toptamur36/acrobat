import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { adminUsersApi } from '../../services/api'

const AdminUsers = () => {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers()
        }, 500) // Debounce search
        return () => clearTimeout(timer)
    }, [search])

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const params = {}
            if (search) params.search = search

            const response = await adminUsersApi.list(params)
            setUsers(response.data.data.users || [])
        } catch (error) {
            console.error(error)
            toast.error('Kullanıcı listesi yüklenemedi')
        } finally {
            setLoading(false)
        }
    }

    const startEditing = (user) => {
        toast('Düzenleme özelliği yakında...', { icon: '🚧' })
    }

    const handleDelete = async (userId) => {
        if (!window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return

        try {
            await adminUsersApi.delete(userId)
            toast.success('Kullanıcı silindi')
            fetchUsers()
        } catch (error) {
            console.error(error)
            toast.error('Kullanıcı silinemedi')
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter">Kullanıcı Yönetimi</h1>
                    <p className="text-neutral-400">Platform üyelerini görüntüle ve yönet.</p>
                </div>
                <input
                    type="text"
                    placeholder="Kullanıcı ara (isim veya email)..."
                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-yellow-500/50 w-64"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="bg-neutral-900/50 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left">
                    <thead className="bg-black/40 text-xs uppercase tracking-widest text-neutral-500 font-bold border-b border-white/5">
                        <tr>
                            <th className="p-6">Kullanıcı</th>
                            <th className="p-6">İstatistikler</th>
                            <th className="p-6">İletişim</th>
                            <th className="p-6">Durum</th>
                            <th className="p-6 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr><td colSpan="5" className="p-10 text-center text-neutral-500">Yükleniyor...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan="5" className="p-10 text-center text-neutral-500">Kullanıcı bulunamadı.</td></tr>
                        ) : (
                            users.map(user => (
                                <tr key={user.user_id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-white border border-white/5">
                                                {user.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">{user.username}</p>
                                                <p className="text-xs text-neutral-500">ID: {user.user_id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 text-sm text-neutral-400">
                                        <span className="mr-3">🎵 {user.playlist_count || 0} Liste</span>
                                        <span>✍️ {user.review_count || 0} Yorum</span>
                                    </td>
                                    <td className="p-6 text-sm text-neutral-400">
                                        {user.email}
                                    </td>
                                    <td className="p-6">
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold border ${user.is_admin ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                                            {user.is_admin ? 'Admin' : 'Üye'}
                                        </span>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-2">
                                            <button onClick={() => startEditing(user)} className="p-2 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors" title="Düzenle">✏️</button>
                                            {!user.is_admin && (
                                                <button onClick={() => handleDelete(user.user_id)} className="p-2 hover:bg-red-500/20 rounded-lg text-neutral-400 hover:text-red-500 transition-colors" title="Sil">🗑️</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default AdminUsers
