import { useState } from 'react'

function ProductCard({
  product,
  index,
  onAddToCart,
  isItemInCart,
  onOpenImageModal,
}) {
  const [showAll, setShowAll] = useState(false)

  const warehouses = showAll
    ? product.warehouses
    : product.warehouses.slice(0, 3)

  const minPrice = Math.min(...product.warehouses.map(w => w.price))

  return (
    <div className="product-card" style={{ animationDelay: `${index * 0.1}s` }}>
      {/* Images */}
      <div className="image-gallery" onClick={onOpenImageModal}>
        {product.images?.length ? (
          <img src={product.images[0]} alt={product.name} />
        ) : (
          <div className="no-image">
            <i className="fas fa-image" />
            Нет фото
          </div>
        )}
      </div>

      <div className="product-content">
        <span className="product-brand">{product.brand}</span>

        <h3 className="product-title">{product.name || 'Без названия'}</h3>

        <div className="product-article">
          <span className="article-badge">{product.article}</span>
          {product.is_cross && <span className="cross-badge">АНАЛОГ</span>}
        </div>

        <div className="price-actions">
          <div className="price-info">
            <div className="best-price-container">
              <span className="min-price">{minPrice.toFixed(2)}</span>
              <span className="currency">RUB</span>
            </div>
            <span className="price-label">лучшая цена</span>
          </div>
        </div>

        <div className="warehouses-section">
          <div className="warehouses-title">
            <i className="fas fa-warehouse" />
            Склады
          </div>

          <div className="warehouses-list">
            {warehouses.map(w => {
              const inCart = isItemInCart(product.internalId, w.id)

              return (
                <div key={w.id} className="warehouse-card">
                  <div className="warehouse-info">
                    <h4>
                      {w.name}
                      <span className="wh-supplier-tag">{w.supplier}</span>
                    </h4>

                    <div className="warehouse-details">
                      <div className="detail-item">
                        <i className="fas fa-boxes" />
                        {w.quantity > 0 ? (
                          <span className="in-stock">В наличии: {w.quantity}</span>
                        ) : (
                          <span className="low-stock">Нет в наличии</span>
                        )}
                      </div>

                      {w.delivery_days && (
                        <div className="detail-item">
                          <i className="fas fa-truck" />
                          {w.delivery_days} дн.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="warehouse-price">
                    <div className="warehouse-price-row">
                      <span className="price">{w.price.toFixed(2)}</span>
                      <span className="currency">{w.currency}</span>
                    </div>

                    <button
                      className={`small-cart-btn ${inCart ? 'added' : ''}`}
                      disabled={!w.is_available}
                      onClick={() => onAddToCart(product, w)}
                    >
                      <i className="fas fa-cart-plus" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {product.warehouses.length > 3 && (
            <div className="more-warehouses-btn">
              <button className="more-btn" onClick={() => setShowAll(v => !v)}>
                {showAll ? 'Скрыть' : 'Показать все'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductCard
