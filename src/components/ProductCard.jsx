import { useState, useMemo } from 'react'

function ProductCard({ 
  product, 
  index, 
  onAddToCart, 
  onOpenImageModal, 
  isItemInCart 
}) {
  const [currentImageIndex] = useState(0)
  const [showAllWarehouses, setShowAllWarehouses] = useState(false)

  // Инициализируем через useMemo, чтобы ссылка была стабильной между рендерами
  const warehouses = useMemo(() => product.warehouses || [], [product.warehouses])
  const images = useMemo(() => product.images || [], [product.images])
  
  const isCross = product.is_cross || false
  
  // Теперь зависимость [warehouses] будет меняться только тогда, 
  // когда реально изменится массив в пропсах
  const minPrice = useMemo(() => {
    if (warehouses.length === 0) return 0
    return Math.min(...warehouses.map(w => w.price))
  }, [warehouses])

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(price)
  }

  const validImages = images.filter(img => img && img.trim() !== '')
  const visibleWarehouses = showAllWarehouses ? warehouses : warehouses.slice(0, 3)

  const handleImageError = (e) => {
    e.target.onerror = null
    e.target.src = 'https://via.placeholder.com/300x200?text=Нет+фото'
  }

  return (
    <div className="product-card" style={{ animationDelay: `${index * 0.05}s` }}>
      <div className="image-gallery" onClick={() => validImages.length > 0 && onOpenImageModal()}>
        {validImages.length > 0 ? (
          <div className="gallery-container">
            <img 
              src={validImages[currentImageIndex]} 
              alt={product.name}
              onError={handleImageError}
              loading="lazy"
            />
            {validImages.length > 1 && (
              <div className="image-count">
                <i className="fas fa-images"></i> {validImages.length}
              </div>
            )}
          </div>
        ) : (
          <div className="no-image">
            <i className="fas fa-camera-slash"></i>
            <span>Нет фото</span>
          </div>
        )}
      </div>
      
      <div className="product-content">
        <div className="product-header">
          <div className="product-brand">{product.brand}</div>
          <h3 className="product-title">{product.name}</h3>
          <div className="product-article">
            <span>Артикул: <strong>{product.article}</strong></span>
            {isCross && <span className="cross-badge">Аналог</span>}
          </div>
        </div>
        
        <div className="price-actions">
          <div className="price-info">
            <span className="price-label">Лучшая цена:</span>
            <span className="min-price-value">{formatPrice(minPrice)}</span>
          </div>
        </div>
        
        {warehouses.length > 0 && (
          <div className="warehouses-section">
            <div className="warehouses-title">
              <i className="fas fa-warehouse"></i>
              <span>Предложения ({warehouses.length})</span>
            </div>
            <div className="warehouses-list">
              {visibleWarehouses.map((warehouse, idx) => {
                const whId = warehouse.id || `${warehouse.supplier}-${warehouse.name}-${warehouse.price}`
                const inCart = isItemInCart(product.internalId, whId)
                
                return (
                  <div key={idx} className="warehouse-card">
                    <div className="warehouse-info">
                      <div className="wh-main-line">
                        <span className="wh-name">{warehouse.name || 'Склад'}</span>
                        <span className="wh-supplier-tag">{warehouse.supplier}</span>
                      </div>
                      <div className="warehouse-details">
                        <span className={`detail-item ${warehouse.quantity > 5 ? 'in-stock' : 'low-stock'}`}>
                          <i className="fas fa-box"></i> {warehouse.quantity} шт.
                        </span>
                        {warehouse.delivery_days !== undefined && (
                          <span className="detail-item">
                            <i className="fas fa-clock"></i> {warehouse.delivery_days} дн.
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="warehouse-price-block">
                      <span className="wh-price">{formatPrice(warehouse.price)}</span>
                      <button
                        className={`small-cart-btn ${inCart ? 'added' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(product, warehouse);
                        }}
                        disabled={inCart}
                      >
                        <i className={inCart ? 'fas fa-check' : 'fas fa-cart-plus'}></i>
                      </button>
                    </div>
                  </div>
                )
              })}
              
              {warehouses.length > 3 && (
                <button 
                  className="more-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAllWarehouses(!showAllWarehouses);
                  }}
                >
                  <i className={`fas fa-chevron-${showAllWarehouses ? 'up' : 'down'}`}></i>
                  {showAllWarehouses ? 'Скрыть' : `Показать еще ${warehouses.length - 3}`}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductCard