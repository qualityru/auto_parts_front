function AccountModal({ onClose }) {
  return (
    <div className="account-modal-overlay active" onClick={onClose}>
      <div className="account-modal" onClick={(e) => e.stopPropagation()}>
        <div className="account-modal-header">
          <div className="account-modal-icon">
            <i className="fas fa-user-circle"></i>
          </div>
          <div className="account-modal-title">Личный кабинет</div>
          <div className="account-modal-subtitle">Управление вашими заказами и настройками</div>
        </div>
        <div className="account-modal-body">
          <div className="coming-soon-badge">
            <i className="fas fa-tools"></i>
            В разработке
          </div>
          
          <div className="account-features">
            <div className="account-feature">
              <i className="fas fa-history"></i>
              <div className="account-feature-text">
                <div className="account-feature-title">История заказов</div>
                <div className="account-feature-desc">Просмотр всех ваших предыдущих заказов</div>
              </div>
            </div>
            <div className="account-feature">
              <i className="fas fa-heart"></i>
              <div className="account-feature-text">
                <div className="account-feature-title">Избранное</div>
                <div className="account-feature-desc">Сохраненные товары для быстрого доступа</div>
              </div>
            </div>
            <div className="account-feature">
              <i className="fas fa-cog"></i>
              <div className="account-feature-text">
                <div className="account-feature-title">Настройки профиля</div>
                <div className="account-feature-desc">Управление личными данными и настройками</div>
              </div>
            </div>
          </div>
        </div>
        <div className="account-modal-footer">
          <button className="account-close-btn" onClick={onClose}>
            Понятно
          </button>
        </div>
      </div>
    </div>
  )
}

export default AccountModal  // Добавьте эту строку