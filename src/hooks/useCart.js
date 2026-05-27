import { useCallback, useEffect, useState } from 'react';
import {
  addCartItem,
  clearCartApi,
  getCart,
  mergeCart,
  removeCartItem,
  updateCartItem,
} from '../utils/api';

const ensureGuestCartId = () => {
  let guestId = localStorage.getItem('guestCartId');
  if (!guestId) {
    guestId = (window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    localStorage.setItem('guestCartId', guestId);
  }
  return guestId;
};

const normalizeCart = (cart) => ({
  ...(cart || {}),
  items: Array.isArray(cart?.items) ? cart.items : [],
  total_amount: Number(cart?.total_amount || 0),
  total_quantity: Number(cart?.total_quantity || 0),
});

const getReturnType = (warehouse) => (
  warehouse.supplier_info?.original_data?.return_type?.name
  || warehouse.supplier_info?.original_data?.return_type
  || 'Возврат возможен'
);

export function useCart() {
  const [cart, setCart] = useState(() => normalizeCart({ items: [] }));
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [cartError, setCartError] = useState(null);

  const refreshCart = useCallback(async () => {
    ensureGuestCartId();
    setIsCartLoading(true);
    setCartError(null);
    try {
      const data = localStorage.getItem('authToken')
        ? await mergeCart()
        : await getCart();
      setCart(normalizeCart(data));
    } catch (error) {
      if (error.status === 401) {
        localStorage.removeItem('authToken');
        window.dispatchEvent(new Event('auth-changed'));
        try {
          const guestCart = await getCart();
          setCart(normalizeCart(guestCart));
          return;
        } catch (guestError) {
          setCartError(guestError.message);
          return;
        }
      }
      setCartError(error.message);
    } finally {
      setIsCartLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
    window.addEventListener('auth-changed', refreshCart);
    return () => window.removeEventListener('auth-changed', refreshCart);
  }, [refreshCart]);

  const addToCart = async (product, warehouse) => {
    ensureGuestCartId();
    const payload = {
      product_id: String(product.internalId || product.id || `${product.brand}-${product.article}`),
      warehouse_id: String(warehouse.id),
      brand: String(product.brand || 'NO BRAND'),
      name: String(product.name || 'Наименование не указано'),
      article: String(product.article || ''),
      image: product.images?.[0] || '',
      price: Number(warehouse.price || 0),
      currency: warehouse.currency || 'RUB',
      quantity: 1,
      warehouse_name: warehouse.name || warehouse.city || `Склад ${warehouse.id || ''}`,
      return_type: String(getReturnType(warehouse)),
      fail_percent: Number(warehouse.supplier_info?.original_data?.fail_percent || 0),
      product_data: product,
      warehouse_data: warehouse,
    };
    setCartError(null);
    const data = await addCartItem(payload);
    setCart(normalizeCart(data));
  };

  const removeFromCart = async (itemId) => {
    const data = await removeCartItem(itemId);
    setCart(normalizeCart(data));
  };

  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) return;
    const data = await updateCartItem(itemId, quantity);
    setCart(normalizeCart(data));
  };

  const clearCart = async () => {
    const data = await clearCartApi();
    setCart(normalizeCart(data));
  };

  const getCartCount = () => {
    const items = Array.isArray(cart.items) ? cart.items : [];
    return cart.total_quantity || items.reduce((count, item) => count + Number(item.quantity || 0), 0);
  };

  const getCartTotal = () => {
    const items = Array.isArray(cart.items) ? cart.items : [];
    return cart.total_amount || items.reduce((total, item) => total + (Number(item.price || 0) * Number(item.quantity || 0)), 0);
  };

  const isItemInCart = (productId, warehouseId) => {
    const items = Array.isArray(cart.items) ? cart.items : [];
    return items.some(item => 
      item.product_id === String(productId) && item.warehouse_id === String(warehouseId)
    );
  };

  return {
    cart: Array.isArray(cart.items) ? cart.items : [],
    cartData: cart,
    isCartLoading,
    cartError,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartCount,
    getCartTotal,
    isItemInCart,
    refreshCart,
    setCart,
  };
}
