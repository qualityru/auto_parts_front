import React from 'react';
import { formatPrice } from '../utils/formatters';

function WarehouseList({ product, warehouses, isExpanded, onToggleWarehouses, onAddToCart, isItemInCart }) {
  const visibleWarehouses = isExpanded ? warehouses : warehouses.slice(0, 2);

  return (
    <div className="warehouses-section">
      <div className="warehouses-title">
        <i className="fas fa-warehouse"></i>
        <span>Наличие на складах ({warehouses.length})</span>
      </div>
      <div className="warehouses-list">
        {visibleWarehouses.map((warehouse, idx) => {
          const isInCart = isItemInCart(product.id, warehouse.id);
          
          return (
            <div key={idx} className="warehouse-card">
              <div className="warehouse-info">
                <h4>
                  {warehouse.name || 'Основной склад'}
                  {warehouse.supplier_info?.original_data?.fail_percent && (
                    <div className="warehouse-fail-percent">
                      <i className="fas fa-exclamation-triangle"></i>
                      <span>{warehouse.supplier_info.original_data.fail_percent}%</span>
                    </div>
                  )}
                </h4>
                <div className="warehouse-details">
                  <div className="detail-item">
                    <i className="fas fa-box"></i>
                    <span>{warehouse.quantity || 0} шт.</span>
                  </div>
                  {warehouse.delivery_days && (
                    <div className="detail-item">
                      <i className="fas fa-clock"></i>
                      <span>{warehouse.delivery_days} дн.</span>
                    </div>
                  )}
                </div>
                {warehouse.delivery_date_start && (
                  <div className="delivery-info">
                    <i className="fas fa-calendar-alt"></i>
                    <span>{warehouse.delivery_date_start}</span>
                  </div>
                )}
                {warehouse.supplier_info?.original_data?.return_type?.name && (
                  <div className="return-type">
                    <i className="fas fa-undo"></i>
                    <span>{warehouse.supplier_info.original_data.return_type.name}</span>
                  </div>
                )}
              </div>
              <div className="warehouse-price">
                <div className="warehouse-price-row">
                  <div className="price">{formatPrice(warehouse.price || 0)}</div>
                  <div className="currency">{warehouse.currency || 'RUB'}</div>
                  <button
                    className={`small-cart-btn ${isInCart ? 'added' : ''}`}
                    onClick={() => onAddToCart(product, warehouse)}
                    title="Добавить в корзину"
                    disabled={isInCart}
                  >
                    <i className={isInCart ? 'fas fa-check' : 'fas fa-cart-plus'}></i>
                  </button>
                </div>
                <div className="quantity">{warehouse.quantity || 0} шт.</div>
              </div>
            </div>
          );
        })}
        
        {warehouses.length > 2 && (
          <div className="more-warehouses-btn">
            <button className="more-btn" onClick={onToggleWarehouses}>
              <i className={`fas fa-${isExpanded ? 'chevron-up' : 'ellipsis-h'}`}></i>
              <span>
                {isExpanded ? 'Скрыть' : `Показать ещё ${warehouses.length - 2} складов`}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default WarehouseList;