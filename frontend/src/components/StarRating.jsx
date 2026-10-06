import { useState } from 'react'

const StarRating = ({
  rating = 0,
  onRatingChange,
  readonly = false,
  size = 'md',
  showValue = true
}) => {
  const [hoverRating, setHoverRating] = useState(0)

  const maxRating = 10
  const stars = 5
  const starsArray = Array.from({ length: stars }, (_, i) => i + 1)

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  const getStarFill = (starIndex) => {
    const currentRating = hoverRating || rating
    const starValue = (starIndex * maxRating) / stars
    const prevStarValue = ((starIndex - 1) * maxRating) / stars

    if (currentRating >= starValue) {
      return 'full'
    } else if (currentRating > prevStarValue) {
      return 'partial'
    }
    return 'empty'
  }

  const handleStarClick = (starIndex) => {
    if (readonly || !onRatingChange) return

    const newRating = (starIndex * maxRating) / stars
    onRatingChange(newRating)
  }

  const handleStarHover = (starIndex) => {
    if (readonly) return

    const newRating = (starIndex * maxRating) / stars
    setHoverRating(newRating)
  }

  const handleMouseLeave = () => {
    if (readonly) return
    setHoverRating(0)
  }

  return (
    <div className="flex items-center space-x-1">
      <div
        className="flex items-center space-x-0.5"
        onMouseLeave={handleMouseLeave}
      >
        {starsArray.map((starIndex) => {
          const fill = getStarFill(starIndex)

          return (
            <button
              key={starIndex}
              type="button"
              disabled={readonly}
              className={`
                ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
                transition-transform duration-150
                ${!readonly ? 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded' : ''}
                ${sizeClasses[size]}
              `}
              onClick={() => handleStarClick(starIndex)}
              onMouseEnter={() => handleStarHover(starIndex)}
            >
              <span
                className={`
                  ${fill === 'full'
                    ? 'text-yellow-400'
                    : fill === 'partial'
                      ? 'text-yellow-300'
                      : 'text-gray-300'
                  }
                  transition-colors duration-150
                `}
              >
                ⭐
              </span>
            </button>
          )
        })}
      </div>

      {showValue && (
        <span className="text-sm text-gray-600 ml-2">
          {rating !== null && rating !== undefined ? `${rating.toFixed(1)}/10` : 'No rating'}
        </span>
      )}
    </div>
  )
}

export default StarRating
