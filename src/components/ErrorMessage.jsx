function ErrorMessage({ message, onClose }) {
  return (
    <div className="error-message active">
      <div className="error-content">
        <i className="fas fa-exclamation-triangle"></i>
        <div className="error-text">
          <div className="error-title">Произошла ошибка</div>
          <div>{message}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '8px' }}>
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
}

export default ErrorMessage