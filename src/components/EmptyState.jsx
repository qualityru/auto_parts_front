function EmptyState({ onExampleSearch }) {
  return (
    <div className="empty-state">
      <i className="fas fa-search"></i>
      <h3>Запчасти не найдены</h3>
      <p>Попробуйте изменить поисковый запрос или проверьте правильность артикула</p>
      <div className="example-search">
        <button className="example-btn" onClick={() => onExampleSearch('OC90')}>
          OC90
        </button>
        <button className="example-btn" onClick={() => onExampleSearch('FILTER')}>
          FILTER
        </button>
        <button className="example-btn" onClick={() => onExampleSearch('01218N3')}>
          01218N3
        </button>
      </div>
    </div>
  )
}

export default EmptyState  // Добавьте эту строку