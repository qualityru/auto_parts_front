import { useState, useEffect } from 'react';

export function useCart() {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cartItems');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, warehouse) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => 
        item.productId === product.id && item.warehouseId === warehouse.id
      );
      
      if (existingIndex > -1) {
        const newCart = [...prev];
        newCart[existingIndex].quantity += 1;
        return newCart;
      } else {
        return [...prev, {
          productId: product.id,
          warehouseId: warehouse.id,
          brand: product.brand,
          name: product.name,
          article: product.article,
          image: product.images?.[0] || '',
          price: warehouse.price,
          currency: warehouse.currency,
          quantity: 1,
          warehouseName: warehouse.name,
          returnType: warehouse.supplier_info?.original_data?.return_type?.name || 'Возврат возможен',
          failPercent: warehouse.supplier_info?.original_data?.fail_percent || 0,
          productData: product,
          warehouseData: warehouse
        }];
      }
    });
  };

  const removeFromCart = (productId, warehouseId) => {
    setCart(prev => prev.filter(item => 
      !(item.productId === productId && item.warehouseId === warehouseId)
    ));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const isItemInCart = (productId, warehouseId) => {
    return cart.some(item => 
      item.productId === productId && item.warehouseId === warehouseId
    );
  };

  return {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    getCartCount,
    getCartTotal,
    isItemInCart
  };
}