import { useState, useEffect } from 'react'
import '../styles/UserProfile.css'
import { useNavigate } from 'react-router-dom'

function UserProfile() {
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')
  const [recentSearches, setRecentSearches] = useState([])
  const [favorites, setFavorites] = useState([])
  const [orderHistory, setOrderHistory] = useState([])
  const [notifications, setNotifications] = useState([])
  const [editingProfile, setEditingProfile] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    city: ''
  })

  // Загрузка данных пользователя
  useEffect(() => {
    // В реальном приложении здесь был бы запрос к API
    const loadUserData = () => {
      setTimeout(() => {
        const mockUserData = {
          id: 1,
          name: 'Иван Петров',
          email: 'ivan.petrov@example.com',
          phone: '+7 (999) 123-45-67',
          company: 'АвтоСервис "Мотор"',
          city: 'Москва',
          registrationDate: '2024-01-15',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user123',
          stats: {
            totalOrders: 24,
            totalSpent: 156800,
            activeOrders: 3,
            savedItems: 12
          }
        }
        
        const mockRecentSearches = [
          { id: 1, query: 'фильтр масляный', date: '2026-01-10', count: 5 },
          { id: 2, query: 'тормозные колодки', date: '2026-01-08', count: 3 },
          { id: 3, query: 'аккумулятор', date: '2026-01-05', count: 8 },
          { id: 4, query: 'амортизаторы', date: '2026-01-02', count: 2 }
        ]
        
        const mockFavorites = [
          {
            id: 1,
            productId: 'ABC123',
            name: 'Масляный фильтр Mann W 914/2',
            brand: 'Mann',
            image: 'https://via.placeholder.com/80x80/667eea/ffffff?text=M',
            price: 850,
            currency: '₽',
            addedDate: '2026-01-10'
          },
          {
            id: 2,
            productId: 'DEF456',
            name: 'Тормозные колодки Brembo P 85 049',
            brand: 'Brembo',
            image: 'https://via.placeholder.com/80x80/764ba2/ffffff?text=B',
            price: 3200,
            currency: '₽',
            addedDate: '2026-01-08'
          }
        ]
        
        const mockOrderHistory = [
          {
            id: 'ORD-2026-001',
            date: '2026-01-12',
            status: 'delivered',
            total: 12450,
            items: 3,
            deliveryDate: '2026-01-15'
          },
          {
            id: 'ORD-2026-002',
            date: '2026-01-05',
            status: 'processing',
            total: 8450,
            items: 2,
            deliveryDate: '2026-01-20'
          },
          {
            id: 'ORD-2025-045',
            date: '2025-12-20',
            status: 'delivered',
            total: 25600,
            items: 5,
            deliveryDate: '2025-12-23'
          }
        ]
        
        const mockNotifications = [
          {
            id: 1,
            type: 'price_drop',
            title: 'Снижение цены',
            message: 'Цена на Масляный фильтр Mann снизилась на 15%',
            date: '2026-01-12',
            read: false
          },
          {
            id: 2,
            type: 'delivery',
            title: 'Заказ отправлен',
            message: 'Заказ ORD-2026-002 отправлен в доставку',
            date: '2026-01-10',
            read: true
          },
          {
            id: 3,
            type: 'stock',
            title: 'Появился в наличии',
            message: 'Аккумулятор Bosch S4 005 появился в наличии',
            date: '2026-01-08',
            read: true
          }
        ]
        
        setUserData(mockUserData)
        setFormData({
          name: mockUserData.name,
          email: mockUserData.email,
          phone: mockUserData.phone,
          company: mockUserData.company,
          city: mockUserData.city
        })
        setRecentSearches(mockRecentSearches)
        setFavorites(mockFavorites)
        setOrderHistory(mockOrderHistory)
        setNotifications(mockNotifications)
        setIsLoading(false)
      }, 800)
    }
    
    loadUserData()
  }, [])

  const handleLogout = () => {
    // В реальном приложении здесь был бы запрос к API для выхода
    localStorage.removeItem('authToken')
    navigate('/')
  }

  const handleSaveProfile = () => {
    // В реальном приложении здесь был бы запрос к API
    setUserData(prev => ({
      ...prev,
      ...formData
    }))
    setEditingProfile(false)
    alert('Профиль успешно обновлен!')
  }

  const handleDeleteSearch = (id) => {
    setRecentSearches(prev => prev.filter(search => search.id !== id))
  }

  const handleClearAllSearches = () => {
    setRecentSearches([])
  }

  const handleRemoveFavorite = (id) => {
    setFavorites(prev => prev.filter(item => item.id !== id))
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })))
  }

  const handleDeleteNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'delivered': return 'var(--success)'
      case 'processing': return 'var(--warning)'
      case 'pending': return 'var(--info)'
      case 'cancelled': return 'var(--danger)'
      default: return 'var(--gray-500)'
    }
  }

  const getStatusText = (status) => {
    switch(status) {
      case 'delivered': return 'Доставлен'
      case 'processing': return 'В обработке'
      case 'pending': return 'Ожидает'
      case 'cancelled': return 'Отменен'
      default: return status
    }
  }

  if (isLoading) {
    return (
      <div className="user-profile-loading">
        <div className="spinner"></div>
        <p>Загрузка данных...</p>
      </div>
    )
  }

  return (
    <div className="user-profile">
      <div className="header-controls">
        <button 
          className="header-btn back-btn" 
          onClick={() => navigate('/')}
          title="Вернуться на главную"
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <button 
          className="header-btn logout-btn" 
          onClick={handleLogout}
          title="Выйти"
        >
          <i className="fas fa-sign-out-alt"></i>
        </button>
      </div>

      <header className="profile-header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <i className="fas fa-user-cog"></i>
              <h1>Личный кабинет</h1>
            </div>
            <p className="subtitle">Управление профилем, заказами и настройками</p>
          </div>
        </div>
      </header>

      <div className="container">
        <div className="profile-main-content">
          <div className="profile-sidebar">
            <div className="profile-card">
              <div className="profile-avatar">
                <img src={userData.avatar} alt="Аватар" />
                <button className="avatar-edit-btn">
                  <i className="fas fa-camera"></i>
                </button>
              </div>
              <div className="profile-info">
                <h2>{userData.name}</h2>
                <p className="profile-email">{userData.email}</p>
                <p className="profile-company">{userData.company}</p>
                <p className="profile-date">
                  <i className="fas fa-calendar-alt"></i>
                  С {new Date(userData.registrationDate).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </div>

            <div className="stats-card">
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-icon">
                    <i className="fas fa-shopping-cart"></i>
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{userData.stats.totalOrders}</div>
                    <div className="stat-label">Всего заказов</div>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon">
                    <i className="fas fa-ruble-sign"></i>
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">
                      {userData.stats.totalSpent.toLocaleString('ru-RU')}₽
                    </div>
                    <div className="stat-label">Всего потрачено</div>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon">
                    <i className="fas fa-clock"></i>
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{userData.stats.activeOrders}</div>
                    <div className="stat-label">Активные заказы</div>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon">
                    <i className="fas fa-heart"></i>
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{userData.stats.savedItems}</div>
                    <div className="stat-label">Избранное</div>
                  </div>
                </div>
              </div>
            </div>

            <nav className="profile-nav">
              <button 
                className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <i className="fas fa-user"></i>
                <span>Профиль</span>
              </button>
              <button 
                className={`nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                <i className="fas fa-shopping-bag"></i>
                <span>Мои заказы</span>
              </button>
              <button 
                className={`nav-btn ${activeTab === 'favorites' ? 'active' : ''}`}
                onClick={() => setActiveTab('favorites')}
              >
                <i className="fas fa-heart"></i>
                <span>Избранное</span>
              </button>
              <button 
                className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                <i className="fas fa-history"></i>
                <span>История поиска</span>
              </button>
              <button 
                className={`nav-btn ${activeTab === 'notifications' ? 'active' : ''}`}
                onClick={() => setActiveTab('notifications')}
              >
                <i className="fas fa-bell"></i>
                <span>Уведомления</span>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="notification-badge">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
              <button 
                className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                <i className="fas fa-cog"></i>
                <span>Настройки</span>
              </button>
            </nav>
          </div>

          <div className="profile-content">
            {activeTab === 'profile' && (
              <div className="tab-content">
                <div className="tab-header">
                  <h3><i className="fas fa-user-circle"></i> Информация профиля</h3>
                  {!editingProfile ? (
                    <button 
                      className="edit-profile-btn"
                      onClick={() => setEditingProfile(true)}
                    >
                      <i className="fas fa-edit"></i> Редактировать
                    </button>
                  ) : (
                    <div className="edit-actions">
                      <button 
                        className="save-btn"
                        onClick={handleSaveProfile}
                      >
                        <i className="fas fa-save"></i> Сохранить
                      </button>
                      <button 
                        className="cancel-btn"
                        onClick={() => {
                          setEditingProfile(false)
                          setFormData({
                            name: userData.name,
                            email: userData.email,
                            phone: userData.phone,
                            company: userData.company,
                            city: userData.city
                          })
                        }}
                      >
                        <i className="fas fa-times"></i> Отмена
                      </button>
                    </div>
                  )}
                </div>

                <div className="profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label><i className="fas fa-user"></i> ФИО</label>
                      {editingProfile ? (
                        <input 
                          type="text" 
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="Введите ваше имя"
                        />
                      ) : (
                        <div className="form-value">{userData.name}</div>
                      )}
                    </div>
                    <div className="form-group">
                      <label><i className="fas fa-envelope"></i> Email</label>
                      {editingProfile ? (
                        <input 
                          type="email" 
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="Введите ваш email"
                        />
                      ) : (
                        <div className="form-value">{userData.email}</div>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label><i className="fas fa-phone"></i> Телефон</label>
                      {editingProfile ? (
                        <input 
                          type="tel" 
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          placeholder="Введите ваш телефон"
                        />
                      ) : (
                        <div className="form-value">{userData.phone}</div>
                      )}
                    </div>
                    <div className="form-group">
                      <label><i className="fas fa-building"></i> Компания</label>
                      {editingProfile ? (
                        <input 
                          type="text" 
                          value={formData.company}
                          onChange={(e) => setFormData({...formData, company: e.target.value})}
                          placeholder="Введите название компании"
                        />
                      ) : (
                        <div className="form-value">{userData.company}</div>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label><i className="fas fa-city"></i> Город</label>
                    {editingProfile ? (
                      <input 
                        type="text" 
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        placeholder="Введите ваш город"
                      />
                    ) : (
                      <div className="form-value">{userData.city}</div>
                    )}
                  </div>
                </div>

                <div className="security-section">
                  <h4><i className="fas fa-shield-alt"></i> Безопасность</h4>
                  <div className="security-actions">
                    <button className="security-btn">
                      <i className="fas fa-key"></i> Сменить пароль
                    </button>
                    <button className="security-btn">
                      <i className="fas fa-mobile-alt"></i> Двухфакторная аутентификация
                    </button>
                    <button className="security-btn danger">
                      <i className="fas fa-trash-alt"></i> Удалить аккаунт
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="tab-content">
                <div className="tab-header">
                  <h3><i className="fas fa-shopping-bag"></i> История заказов</h3>
                  <div className="filter-controls">
                    <select className="filter-select">
                      <option>Все заказы</option>
                      <option>Активные</option>
                      <option>Завершенные</option>
                      <option>Отмененные</option>
                    </select>
                    <select className="filter-select">
                      <option>Сначала новые</option>
                      <option>Сначала старые</option>
                      <option>По сумме (убыв.)</option>
                      <option>По сумме (возр.)</option>
                    </select>
                  </div>
                </div>

                <div className="orders-list">
                  {orderHistory.map(order => (
                    <div key={order.id} className="order-card">
                      <div className="order-header">
                        <div className="order-id">
                          <strong>Заказ #{order.id}</strong>
                          <span className="order-date">
                            {new Date(order.date).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                        <div 
                          className="order-status"
                          style={{ color: getStatusColor(order.status) }}
                        >
                          <i className="fas fa-circle"></i>
                          {getStatusText(order.status)}
                        </div>
                      </div>
                      
                      <div className="order-details">
                        <div className="order-info">
                          <div className="info-item">
                            <i className="fas fa-box"></i>
                            <span>{order.items} товаров</span>
                          </div>
                          <div className="info-item">
                            <i className="fas fa-ruble-sign"></i>
                            <span>{order.total.toLocaleString('ru-RU')} ₽</span>
                          </div>
                          <div className="info-item">
                            <i className="fas fa-truck"></i>
                            <span>Доставка: {new Date(order.deliveryDate).toLocaleDateString('ru-RU')}</span>
                          </div>
                        </div>
                        
                        <div className="order-actions">
                          <button className="order-action-btn">
                            <i className="fas fa-eye"></i> Детали
                          </button>
                          <button className="order-action-btn">
                            <i className="fas fa-redo"></i> Повторить
                          </button>
                          {order.status === 'processing' && (
                            <button className="order-action-btn cancel">
                              <i className="fas fa-times"></i> Отменить
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'favorites' && (
              <div className="tab-content">
                <div className="tab-header">
                  <h3><i className="fas fa-heart"></i> Избранные товары</h3>
                  <div className="favorites-count">
                    {favorites.length} товаров
                  </div>
                </div>

                <div className="favorites-grid">
                  {favorites.length > 0 ? (
                    favorites.map(item => (
                      <div key={item.id} className="favorite-card">
                        <div className="favorite-image">
                          <img src={item.image} alt={item.name} />
                        </div>
                        <div className="favorite-info">
                          <div className="favorite-brand">{item.brand}</div>
                          <h4 className="favorite-name">{item.name}</h4>
                          <div className="favorite-article">Артикул: {item.productId}</div>
                          <div className="favorite-added">
                            Добавлено: {new Date(item.addedDate).toLocaleDateString('ru-RU')}
                          </div>
                        </div>
                        <div className="favorite-actions">
                          <div className="favorite-price">
                            {item.price.toLocaleString('ru-RU')} {item.currency}
                          </div>
                          <div className="action-buttons">
                            <button className="action-btn buy">
                              <i className="fas fa-cart-plus"></i> Купить
                            </button>
                            <button 
                              className="action-btn remove"
                              onClick={() => handleRemoveFavorite(item.id)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-favorites">
                      <i className="fas fa-heart-broken"></i>
                      <h4>Нет избранных товаров</h4>
                      <p>Добавляйте товары в избранное, чтобы не потерять их</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="tab-content">
                <div className="tab-header">
                  <h3><i className="fas fa-history"></i> История поиска</h3>
                  {recentSearches.length > 0 && (
                    <button 
                      className="clear-history-btn"
                      onClick={handleClearAllSearches}
                    >
                      <i className="fas fa-trash"></i> Очистить всё
                    </button>
                  )}
                </div>

                <div className="search-history">
                  {recentSearches.length > 0 ? (
                    recentSearches.map(search => (
                      <div key={search.id} className="search-history-item">
                        <div className="search-info">
                          <div className="search-query">
                            <i className="fas fa-search"></i>
                            <span>{search.query}</span>
                          </div>
                          <div className="search-meta">
                            <span className="search-date">
                              {new Date(search.date).toLocaleDateString('ru-RU')}
                            </span>
                            <span className="search-count">
                              Найдено: {search.count} товаров
                            </span>
                          </div>
                        </div>
                        <div className="search-actions">
                          <button 
                            className="search-again-btn"
                            onClick={() => navigate(`/?search=${encodeURIComponent(search.query)}`)}
                          >
                            <i className="fas fa-redo"></i> Повторить
                          </button>
                          <button 
                            className="delete-search-btn"
                            onClick={() => handleDeleteSearch(search.id)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-history">
                      <i className="fas fa-search"></i>
                      <h4>История поиска пуста</h4>
                      <p>Здесь будут отображаться ваши последние поисковые запросы</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="tab-content">
                <div className="tab-header">
                  <h3><i className="fas fa-bell"></i> Уведомления</h3>
                  {notifications.filter(n => !n.read).length > 0 && (
                    <button 
                      className="mark-all-read-btn"
                      onClick={handleMarkAllAsRead}
                    >
                      <i className="fas fa-check-double"></i> Прочитать все
                    </button>
                  )}
                </div>

                <div className="notifications-list">
                  {notifications.length > 0 ? (
                    notifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                      >
                        <div className="notification-icon">
                          <i className={`fas fa-${
                            notification.type === 'price_drop' ? 'tag' :
                            notification.type === 'delivery' ? 'truck' :
                            notification.type === 'stock' ? 'box' : 'bell'
                          }`}></i>
                        </div>
                        <div className="notification-content">
                          <div className="notification-header">
                            <h4>{notification.title}</h4>
                            <span className="notification-time">
                              {new Date(notification.date).toLocaleDateString('ru-RU')}
                            </span>
                          </div>
                          <p>{notification.message}</p>
                        </div>
                        <div className="notification-actions">
                          {!notification.read && (
                            <span className="unread-dot"></span>
                          )}
                          <button 
                            className="delete-notification-btn"
                            onClick={() => handleDeleteNotification(notification.id)}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-notifications">
                      <i className="fas fa-bell-slash"></i>
                      <h4>Нет уведомлений</h4>
                      <p>Здесь будут появляться важные уведомления</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="tab-content">
                <div className="tab-header">
                  <h3><i className="fas fa-cog"></i> Настройки</h3>
                </div>

                <div className="settings-sections">
                  <div className="settings-section">
                    <h4><i className="fas fa-bell"></i> Настройки уведомлений</h4>
                    <div className="settings-options">
                      <label className="settings-option">
                        <input type="checkbox" defaultChecked />
                        <span>Уведомления о снижении цен</span>
                      </label>
                      <label className="settings-option">
                        <input type="checkbox" defaultChecked />
                        <span>Уведомления о поступлении товара</span>
                      </label>
                      <label className="settings-option">
                        <input type="checkbox" defaultChecked />
                        <span>Статусы заказов</span>
                      </label>
                      <label className="settings-option">
                        <input type="checkbox" />
                        <span>Рекомендации и новости</span>
                      </label>
                    </div>
                  </div>

                  <div className="settings-section">
                    <h4><i className="fas fa-eye"></i> Настройки отображения</h4>
                    <div className="settings-options">
                      <label className="settings-option">
                        <span>Тема оформления</span>
                        <select className="theme-select">
                          <option>Светлая</option>
                          <option>Темная</option>
                          <option>Автоматически</option>
                        </select>
                      </label>
                      <label className="settings-option">
                        <span>Валюта отображения</span>
                        <select className="currency-select">
                          <option>Рубли (₽)</option>
                          <option>Доллары ($)</option>
                          <option>Евро (€)</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  <div className="settings-section">
                    <h4><i className="fas fa-database"></i> Данные приложения</h4>
                    <div className="data-actions">
                      <button className="data-btn">
                        <i className="fas fa-download"></i> Экспорт данных
                      </button>
                      <button className="data-btn">
                        <i className="fas fa-sync-alt"></i> Синхронизация
                      </button>
                      <button className="data-btn danger">
                        <i className="fas fa-trash"></i> Очистить кэш
                      </button>
                    </div>
                  </div>

                  <div className="settings-section">
                    <h4><i className="fas fa-shield-alt"></i> Конфиденциальность</h4>
                    <div className="privacy-options">
                      <label className="privacy-option">
                        <input type="checkbox" defaultChecked />
                        <span>Показывать мой профиль поставщикам</span>
                      </label>
                      <label className="privacy-option">
                        <input type="checkbox" />
                        <span>Разрешить персонализированные предложения</span>
                      </label>
                      <label className="privacy-option">
                        <input type="checkbox" defaultChecked />
                        <span>Сохранять историю поиска</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer>
        <div className="container">
          <p>AutoParts Pro © 2026 | Личный кабинет</p>
          <p style={{ marginTop: '8px', opacity: 0.7, fontSize: '0.8rem' }}>
            Версия 2.1.0 • Последнее обновление: 10.01.2026
          </p>
        </div>
      </footer>
    </div>
  )
}

export default UserProfile