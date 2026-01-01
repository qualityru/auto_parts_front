import { formatPrice } from '../utils/formatters'

function CartModal({ cartItems, onClose, onRemoveItem, onClearCart, getCartTotal }) {
  
  const handleRemoveItem = (productId, warehouseId) => {
    if (onRemoveItem) {
      onRemoveItem(productId, warehouseId)
    }
  }

  const handleClearCart = () => {
    if (window.confirm('Вы уверены, что хотите очистить корзину?')) {
      if (onClearCart) {
        onClearCart()
      }
    }
  }

  return (
    <div className="cart-modal-overlay active" onClick={onClose}>
      <div className="cart-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cart-modal-header">
          <div className="cart-modal-title">Корзина</div>
          <button className="cart-close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="cart-modal-body">
          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <i className="fas fa-shopping-cart"></i>
              <h3>Корзина пуста</h3>
              <p>Добавьте товары из каталога</p>
            </div>
          ) : (
            <div className="cart-items-list">
              {cartItems.map((item, index) => (
                <div key={index} className="cart-item">
                  <div className="cart-item-image">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <i className="fas fa-box" style={{ color: 'var(--gray-400)', fontSize: '2rem' }}></i>
                    )}
                  </div>
                  <div className="cart-item-info">
                    <div className="cart-item-brand">{item.brand || ''}</div>
                    <div className="cart-item-name">{item.name || ''}</div>
                    <div className="cart-item-article">Артикул: {item.article || '—'}</div>
                    <div className="cart-item-warehouse">
                      <i className="fas fa-warehouse"></i>
                      <span>{item.warehouseName || '—'}</span>
                    </div>
                    <div className="cart-item-price">
                      <div className="cart-item-price-value">
                        {formatPrice(item.price * item.quantity)} ₽ × {item.quantity}
                      </div>
                      <button 
                        className="remove-from-cart-btn" 
                        onClick={() => handleRemoveItem(item.productId, item.warehouseId)}
                      >
                        <i className="fas fa-trash"></i>
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {cartItems.length > 0 && (
          <div className="cart-modal-footer">
            <div className="cart-total">
              <div className="cart-total-label">Общая сумма:</div>
              <div className="cart-total-value">{formatPrice(getCartTotal())} ₽</div>
            </div>
            <button className="clear-cart-btn" onClick={handleClearCart}>
              <i className="fas fa-trash"></i>
              Очистить корзину
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CartModal