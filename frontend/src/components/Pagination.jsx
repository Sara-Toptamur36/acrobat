const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems = 0,
  itemsPerPage = 20
}) => {
  if (totalPages <= 1) return null

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div className="flex items-center justify-between px-4 py-4 mt-4">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="btn btn-secondary btn-sm"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="btn btn-secondary btn-sm ml-3"
        >
          Next
        </button>
      </div>

      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-acrobat-text-muted">
            Showing <span className="text-white font-bold">{startItem}</span> to{' '}
            <span className="text-white font-bold">{endItem}</span> of{' '}
            <span className="text-white font-bold">{totalItems}</span>
          </p>
        </div>

        <div>
          <nav className="inline-flex -space-x-px gap-1" aria-label="Pagination">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-full text-acrobat-text-muted hover:text-white hover:bg-white/10 disabled:opacity-30"
            >
              ❮
            </button>

            {getPageNumbers().map((page, index) => (
              page === '...' ? (
                <span
                  key={index}
                  className="w-8 h-8 flex items-center justify-center text-acrobat-text-muted"
                >
                  ...
                </span>
              ) : (
                <button
                  key={index}
                  onClick={() => onPageChange(page)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-all ${currentPage === page
                      ? 'bg-white text-black'
                      : 'text-acrobat-text-muted hover:text-white hover:bg-white/10'
                    }`}
                >
                  {page}
                </button>
              )
            ))}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-full text-acrobat-text-muted hover:text-white hover:bg-white/10 disabled:opacity-30"
            >
              ❯
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}

export default Pagination
