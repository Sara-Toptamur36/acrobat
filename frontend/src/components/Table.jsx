const Table = ({ columns, data, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-acrobat-surface/40 rounded-xl p-8 border border-white/5 mx-[-1px]">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/5 rounded w-full mb-8"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-8 h-8 bg-white/5 rounded"></div>
              <div className="h-4 bg-white/5 rounded flex-1"></div>
              <div className="h-4 bg-white/5 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-acrobat-surface/20 rounded-xl p-16 text-center border border-white/5">
        <div className="text-6xl mb-6 grayscale opacity-20">📋</div>
        <p className="text-acrobat-text-muted font-bold">Nothing to show here yet.</p>
      </div>
    )
  }

  return (
    <div className="table-container border border-white/5">
      <div className="overflow-x-auto">
        <table className="table-modern">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={column.className || ''}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={row.id || row.artist_id || row.album_id || row.song_id || index}
                className="group"
              >
                {columns.map((column) => (
                  <td key={column.key} className={column.className || ''}>
                    {column.render ? column.render(row[column.key], row, index) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Table
