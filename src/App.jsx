import { useState, useRef, useCallback } from 'react'
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

import { searchProductsStream } from './utils/api'

function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState(new Set())

  const [cartItems, setCartItems] = useState([])
  const [showCartModal, setShowCartModal] = useState(false)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [imageModalData, setImageModalData] = useState(null)

  const activeStream = useRef(null)

  const isItemInCart = useCallback((productId, warehouseId) => {
    return cartItems.some(
      i => i.productId === productId && i.warehouseId === warehouseId
    )
  }, [cartItems])

  const handleSearch = async (query = null) => {
    const term = query || searchQuery.trim()
    if (!term) {
      setError('Введите артикул')
      return
    }

    if (activeStream.current) activeStream.current.abort()

    setIsLoading(true)
    setError(null)
    setProducts([])
    setSuppliers(new Set())
    setSearchQuery(term)

    const stream = searchProductsStream(term, {
      onItem: (item) => {
        setProducts(prev => {
          const groupKey = `${item.brand}-${item.article}`
            .toLowerCase()
            .replace(/\s+/g, '')

          const idx = prev.findIndex(p => p.groupKey === groupKey)

          const warehouses = item.warehouses.map(w => ({
            ...w,
            supplier: item.supplier,
          }))

          if (idx > -1) {
            const updated = [...prev]
            updated[idx] = {
              ...updated[idx],
              warehouses: [...updated[idx].warehouses, ...warehouses],
              images: updated[idx].images || item.images || [],
              name: updated[idx].name || item.name,
              description: updated[idx].description || item.description,
            }
            return updated
          }

          return [
            ...prev,
            {
              id: item.id,
              internalId: groupKey,
              groupKey,
              supplier: item.supplier,
              brand: item.brand,
              article: item.article,
              name: item.name,
              description: item.description,
              images: item.images || [],
              specifications: item.specifications || {},
              metadata: item.metadata || {},
              is_cross: item.is_cross,
              warehouses,
            },
          ]
        })

        setSuppliers(prev => new Set(prev).add(item.supplier))
      },

      onImages: ({ article, images }) => {
        setProducts(prev =>
          prev.map(p =>
            p.article.toLowerCase() === article.toLowerCase()
              ? { ...p, images: Array.from(new Set([...(p.images || []), ...images])) }
              : p
          )
        )
      },

      onError: (err) => {
        setError(`Ошибка поиска: ${err.error || err}`)
        setIsLoading(false)
      },

      onDone: () => setIsLoading(false),
      onEnd: () => setIsLoading(false),
    })

    activeStream.current = stream
    await stream.start()
  }

  const handleAddToCart = (product, warehouse) => {
    setCartItems(prev => {
      const warehouseId = warehouse.id

      const idx = prev.findIndex(
        i => i.productId === product.internalId && i.warehouseId === warehouseId
      )

      if (idx > -1) {
        const copy = [...prev]
        copy[idx].quantity += 1
        return copy
      }

      return [
        ...prev,
        {
          productId: product.internalId,
          warehouseId,
          brand: product.brand,
          article: product.article,
          name: product.name,
          image: product.images?.[0] || '',
          price: warehouse.price,
          currency: warehouse.currency,
          quantity: 1,
          warehouseName: warehouse.name,
          supplier: warehouse.supplier,
        },
      ]
    })
  }

  const handleRemoveFromCart = (productId, warehouseId) => {
    setCartItems(prev =>
      prev.filter(i => !(i.productId === productId && i.warehouseId === warehouseId))
    )
  }

  return (
    <div className="app">
      <div className="header-controls">
        <button className="header-btn account-btn" onClick={() => setShowAccountModal(true)}>
          <i className="fas fa-user" />
        </button>
        <button className="header-btn cart-btn" onClick={() => setShowCartModal(true)}>
          <i className="fas fa-shopping-cart" />
          {cartItems.length > 0 && <span className="cart-count">{cartItems.length}</span>}
        </button>
      </div>

      <Header onExampleSearch={(q) => { setSearchQuery(q); handleSearch(q) }} />

      <div className="container">
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearch={handleSearch}
        />

        <div className="main-content">
          {isLoading && products.length === 0 && <LoadingSpinner />}
          {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

          {products.length > 0 && (
            <div className="results-section">
              <div className="results-header">
                <h2>Найдено товаров: {products.length}</h2>
                <div className="suppliers-container">
                  {[...suppliers].map(s => (
                    <div key={s} className="supplier-badge">{s}</div>
                  ))}
                </div>
              </div>

              <div className="products-grid">
                {products
                  .sort((a, b) => a.is_cross - b.is_cross)
                  .map((product, index) => (
                    <ProductCard
                      key={product.internalId}
                      product={product}
                      index={index}
                      onAddToCart={handleAddToCart}
                      isItemInCart={isItemInCart}
                      onOpenImageModal={() =>
                        setImageModalData({
                          images: product.images,
                          productInfo: product,
                        })
                      }
                    />
                  ))}
              </div>
            </div>
          )}

          {!isLoading && products.length === 0 && !error && (
            <EmptyState onExampleSearch={(q) => { setSearchQuery(q); handleSearch(q) }} />
          )}
        </div>
      </div>

      {showCartModal && (
        <CartModal
          cartItems={cartItems}
          onClose={() => setShowCartModal(false)}
          onRemoveItem={handleRemoveFromCart}
          onClearCart={() => setCartItems([])}
          getCartTotal={() =>
            cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
          }
        />
      )}

      {showAccountModal && <AccountModal onClose={() => setShowAccountModal(false)} />}
      {imageModalData && (
        <ImageModal
          images={imageModalData.images}
          productInfo={imageModalData.productInfo}
          onClose={() => setImageModalData(null)}
        />
      )}
    </div>
  )
}

export default App
