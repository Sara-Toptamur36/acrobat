import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

const ImageUpload = ({ onUpload, currentImage, onDelete, accept = 'image/*', maxSizeMB = 5, autoUpload = true, onFileSelect }) => {
    const [preview, setPreview] = useState(currentImage || null)
    const [uploading, setUploading] = useState(false)
    const [dragActive, setDragActive] = useState(false)

    // Update preview when currentImage changes externally
    useEffect(() => {
        setPreview(currentImage)
    }, [currentImage])

    const validateFile = (file) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Lütfen sadece resim dosyası yükleyin')
            return false
        }

        const maxSize = maxSizeMB * 1024 * 1024
        if (file.size > maxSize) {
            toast.error(`Dosya boyutu ${maxSizeMB}MB'dan küçük olmalıdır`)
            return false
        }

        return true
    }

    const handleFile = async (file) => {
        if (!validateFile(file)) return

        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setPreview(reader.result)
        }
        reader.readAsDataURL(file)

        if (onFileSelect) onFileSelect(file)

        if (!autoUpload) return

        setUploading(true)
        try {
            // Upload
            await onUpload(file)
            toast.success('Resim başarıyla yüklendi')
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Resim yüklenemedi')
            setPreview(currentImage)
            throw error // Re-throw so parent can handle
        } finally {
            setUploading(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0])
        }
    }

    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0])
        }
    }

    const handleDeleteClick = async () => {
        if (!window.confirm('Bu resmi silmek istediğinize emin misiniz?')) return

        setUploading(true)
        try {
            await onDelete()
            setPreview(null)
            toast.success('Resim başarıyla silindi')
        } catch (error) {
            console.error('Delete error:', error)
            toast.error('Resim silinemedi')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="space-y-4">
            {/* Preview */}
            {preview && (
                <div className="relative group">
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-2xl border border-white/10"
                    />
                    {onDelete && (
                        <button
                            onClick={handleDeleteClick}
                            disabled={uploading}
                            className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                        >
                            Sil
                        </button>
                    )}
                </div>
            )}

            {/* Upload Area */}
            <div
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${dragActive
                    ? 'border-acrobat-primary bg-acrobat-primary/10'
                    : 'border-white/20 hover:border-white/40'
                    } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    accept={accept}
                    onChange={handleChange}
                    disabled={uploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="space-y-3">
                    <div className="text-5xl">📸</div>
                    <div>
                        <p className="text-white font-bold">
                            {uploading ? 'Yükleniyor...' : 'Resim yüklemek için tıklayın veya sürükleyin'}
                        </p>
                        <p className="text-xs text-acrobat-text-muted mt-2">
                            PNG, JPG, GIF - Maksimum {maxSizeMB}MB
                        </p>
                    </div>
                </div>

                {uploading && (
                    <div className="mt-4">
                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                            <div className="bg-acrobat-primary h-full animate-pulse" style={{ width: '100%' }}></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ImageUpload
