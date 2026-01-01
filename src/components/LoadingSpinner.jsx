function LoadingSpinner() {
  return (
    <div className="loading active">
      <div className="spinner"></div>
      <p style={{ color: 'var(--gray-600)', fontSize: '1.1rem', marginTop: '20px' }}>
        Ищем запчасти в каталогах поставщиков...
      </p>
    </div>
  );
}

export default LoadingSpinner