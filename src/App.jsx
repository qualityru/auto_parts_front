import { useState } from 'react'
import './styles/App.css'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import ProductCard from './components/ProductCard'
import LoadingSpinner from './components/LoadingSpinner'
import ErrorMessage from './components/ErrorMessage'
import EmptyState from './components/EmptyState'
import CartModal from './components/CartModal'
import AccountModal from './components/AccountModal'
import ImageModal from './components/ImageModal'
import { searchProducts } from './utils/api'

function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [showCartModal, setShowCartModal] = useState(false)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [imageModalData, setImageModalData] = useState(null)
  const [cartItems, setCartItems] = useState([])
  const [expandedWarehouses, setExpandedWarehouses] = useState({})

  // Простая функция для проверки наличия товара в корзине
  const isItemInCart = (productId, warehouseId) => {
    return cartItems.some(item => 
      item.productId === productId && item.warehouseId === warehouseId
    )
  }

  const handleSearch = async (query = null) => {
    const searchTerm = query || searchQuery.trim()
    
    if (!searchTerm) {
      setError('Введите артикул для поиска')
      return
    }
    
    setIsLoading(true)
    setError(null)
    setProducts([])
    setSuppliers([])
    
    try {
      const data = await searchProducts(searchTerm)
      
      if (data.status !== 'success') {
        throw new Error(data.message || 'Ошибка при получении данных')
      }
      
      setProducts(data.results || [])
      setSuppliers(data.suppliers || [])
      setSearchQuery(searchTerm)
    } catch (err) {
      setError(`Ошибка при поиске: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExampleSearch = (query) => {
    setSearchQuery(query)
    handleSearch(query)
  }

  const handleAddToCart = (product, warehouse) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => 
        item.productId === product.id && item.warehouseId === warehouse.id
      )
      
      if (existingIndex > -1) {
        const newItems = [...prev]
        newItems[existingIndex].quantity += 1
        return newItems
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
          productData: product,
          warehouseData: warehouse
        }]
      }
    })
  }

  const handleRemoveFromCart = (productId, warehouseId) => {
    setCartItems(prev => prev.filter(item => 
      !(item.productId === productId && item.warehouseId === warehouseId)
    ))
  }

  const handleClearCart = () => {
    setCartItems([])
  }

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0)
  }

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const handleOpenImageModal = (productIndex) => {
    const product = products[productIndex]
    if (product?.images?.length > 0) {
      setImageModalData({
        images: product.images,
        productInfo: product
      })
    }
  }

  const toggleWarehouses = (productId) => {
    setExpandedWarehouses(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }))
  }

  return (
    <div className="app">
      <div className="header-controls">
        <button 
          className="header-btn account-btn" 
          onClick={() => setShowAccountModal(true)}
          title="Личный кабинет"
        >
          <i className="fas fa-user"></i>
        </button>
        <button 
          className="header-btn cart-btn" 
          onClick={() => setShowCartModal(true)}
          title="Корзина"
        >
          <i className="fas fa-shopping-cart"></i>
          <span className="cart-count">{getCartCount()}</span>
        </button>
      </div>

      <Header onExampleSearch={handleExampleSearch} />
      
      <div className="container">
        <SearchBar 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearch={handleSearch}
        />
        
        <div className="main-content">
          {isLoading && <LoadingSpinner />}
          
          {error && (
            <ErrorMessage 
              message={error} 
              onClose={() => setError(null)}
            />
          )}
          
          {!isLoading && products.length > 0 && (
            <div className="results-section">
              <div className="results-header">
                <div className="results-info">
                  <h2>Найдено товаров: {products.length}</h2>
                  <p>Поисковый запрос: "{searchQuery}"</p>
                </div>
                <div className="suppliers-container">
                  {suppliers.map((supplier, index) => (
                    <div key={index} className="supplier-badge">
                      {supplier}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="products-grid">
                {products.map((product, index) => (
                  <ProductCard
                    key={product.id || index}
                    product={product}
                    index={index}
                    isExpanded={expandedWarehouses[product.id]}
                    onToggleWarehouses={() => toggleWarehouses(product.id)}
                    onAddToCart={handleAddToCart}
                    onOpenImageModal={() => handleOpenImageModal(index)}
                    isItemInCart={isItemInCart}
                  />
                ))}
              </div>
            </div>
          )}
          
          {!isLoading && products.length === 0 && !error && (
            <EmptyState onExampleSearch={handleExampleSearch} />
          )}
        </div>
      </div>

      {showCartModal && (
        <CartModal
          cartItems={cartItems}
          onClose={() => setShowCartModal(false)}
          onRemoveItem={handleRemoveFromCart}
          onClearCart={handleClearCart}
          getCartTotal={getCartTotal}
        />
      )}

      {showAccountModal && (
        <AccountModal onClose={() => setShowAccountModal(false)} />
      )}

      {imageModalData && (
        <ImageModal
          images={imageModalData.images}
          productInfo={imageModalData.productInfo}
          onClose={() => setImageModalData(null)}
        />
      )}

      <footer>
        <div className="container">
          <p>AutoParts Pro © 2026 | Поиск автозапчастей</p>
          <p style={{ marginTop: '8px', opacity: 0.7, fontSize: '0.8rem' }}>
            4 друга, 0 багов (ну почти)
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App