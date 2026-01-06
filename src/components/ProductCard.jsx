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

  const minPrice =
    product.metadata?.min_price ??
    (product.warehouses?.length
      ? Math.min(...product.warehouses.map(w => w.price))
      : 0)

  const isCross = product.metadata?.is_cross === true

  const formatPrice = (price) =>
    new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price)

  return (
    <div
      className="product-card ultra-compact"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* IMAGE */}
      <div
        className="image-gallery ultra-compact"
        onClick={onOpenImageModal}
      >
        {product.images?.length ? (
          <img src={product.images[0]} alt={product.name} />
        ) : (
          <div className="no-image">Нет фото</div>
        )}
      </div>

      <div className="product-content ultra-compact">
        {/* TOP LINE */}
        <div className="product-topline">
          {product.supplier && (
            <span className="meta supplier">{product.supplier}</span>
          )}

          <span className={`meta ${isCross ? 'cross' : 'orig'}`}>
            {isCross ? 'АНАЛОГ' : 'ОРИГИНАЛ'}
          </span>

          <span className="meta article">{product.article}</span>
        </div>

        {/* BRAND */}
        {product.brand && (
          <div className="brand-badge">
            {product.brand}
          </div>
        )}

        {/* TITLE */}
        <h3 className="product-title ultra-compact">
          {product.name || 'Без названия'}
        </h3>

        {/* PRICE */}
        <div className="price-row ultra-compact">
          <span className="price">{formatPrice(minPrice)}</span>
          <span className="currency">₽</span>
        </div>

        {/* WAREHOUSES */}
        <div className="warehouses ultra-compact">
          {warehouses.map(w => {
            const inCart = isItemInCart(product.internalId, w.id)
            const info = w.supplier_info || {}

            return (
              <div key={w.id} className="warehouse-row">
                <div className="warehouse-left">
                  <span className={w.quantity > 0 ? 'ok' : 'warn'}>
                    {w.quantity > 0 ? `В наличии: ${w.quantity}` : 'Нет'}
                  </span>

                  {w.delivery_days && (
                    <span>{w.delivery_days} дн</span>
                  )}

                  {typeof info.back_days === 'number' ? (
                    <span className="return">
                      возврат {info.back_days} дн
                    </span>
                  ) : (
                    <span className="no-return">без возврата</span>
                  )}
                </div>

                <div className="warehouse-right">
                  <span className="wh-price">
                    {formatPrice(w.price)}
                  </span>

                  <button
                    className={`cart-btn ${inCart ? 'added' : ''}`}
                    disabled={!w.is_available}
                    onClick={() => onAddToCart(product, w)}
                  >
                    <i className={inCart ? 'fas fa-check' : 'fas fa-cart-plus'} />
                  </button>
                </div>
              </div>
            )
          })}

          {product.warehouses.length > 3 && (
            <button
              className="more-compact"
              onClick={() => setShowAll(v => !v)}
            >
              {showAll ? 'Скрыть' : 'Ещё'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductCard
