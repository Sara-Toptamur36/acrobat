import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { artistsApi, uploadApi } from '../services/api'
import Modal from './Modal'

const CreateArtistForm = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    image_url: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setSelectedFile(file)
    
    // Create preview URL
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploadLoading(true)
    try {
      const url = await uploadApi.uploadFile(selectedFile)
      setFormData(prev => ({ ...prev, image_url: url }))
      toast.success('Image uploaded successfully')
    } catch (error) {
      toast.error('Failed to upload image')
      console.error('Upload error:', error)
    } finally {
      setUploadLoading(false)
    }
  }

  const clearImage = () => {
    setSelectedFile(null)
    setPreviewUrl('')
    setFormData(prev => ({ ...prev, image_url: '' }))
  }

  const validate = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Artist name is required'
    }
    
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      const payload = {
        name: formData.name.trim(),
        bio: formData.bio.trim() || undefined,
        image_url: formData.image_url || undefined
      }
      
      const response = await artistsApi.create(payload)
      toast.success('Artist created successfully')
      
      // Reset form
      setFormData({ name: '', bio: '', image_url: '' })
      setErrors({})
      setSelectedFile(null)
      setPreviewUrl('')
      
      // Call success callback
      if (onSuccess) {
        onSuccess(response.data.data)
      }
      
      onClose()
    } catch (error) {
      if (error.response?.data?.details) {
        // Handle field-specific errors
        const fieldErrors = {}
        error.response.data.details.forEach(detail => {
          fieldErrors[detail.field] = detail.message
        })
        setErrors(fieldErrors)
      } else if (error.response?.status === 409) {
        setErrors({ name: 'An artist with this name already exists' })
      } else {
        toast.error('Failed to create artist')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ name: '', bio: '', image_url: '' })
    setErrors({})
    setSelectedFile(null)
    setPreviewUrl('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Artist">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Artist Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`input ${errors.name ? 'border-red-500' : ''}`}
            placeholder="Enter artist name"
            disabled={loading}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Biography (optional)
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={4}
            className={`input ${errors.bio ? 'border-red-500' : ''}`}
            placeholder="Enter artist biography..."
            disabled={loading}
          />
          {errors.bio && (
            <p className="mt-1 text-sm text-red-600">{errors.bio}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Artist Image (optional)
          </label>
          
          {/* File Input */}
          <div className="mb-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={loading || uploadLoading}
            />
            <p className="mt-1 text-xs text-gray-500">
              PNG, JPG up to 5MB
            </p>
          </div>

          {/* Preview and Upload */}
          {selectedFile && (
            <div className="mb-3">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-lg border"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 mb-2">{selectedFile.name}</p>
                  <div className="flex space-x-2">
                    {!formData.image_url && (
                      <button
                        type="button"
                        onClick={handleUpload}
                        disabled={uploadLoading}
                        className="btn btn-primary btn-sm"
                      >
                        {uploadLoading ? 'Uploading...' : 'Upload'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={clearImage}
                      className="btn btn-secondary btn-sm"
                      disabled={uploadLoading}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upload Success */}
          {formData.image_url && (
            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-green-700">Image uploaded successfully</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button 
            type="button"
            onClick={handleClose}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Artist'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default CreateArtistForm
