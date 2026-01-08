import { useState, useRef, useCallback } from 'react'
import {
  Box,
  Container,
  Typography,
  Stack,
  Grid,
  Chip,
} from '@mui/material'

import Header from './components/Header'
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

  const isItemInCart = useCallback(
    (productId, warehouseId) =>
      cartItems.some(
        i => i.productId === productId && i.warehouseId === warehouseId
      ),
    [cartItems]
  )

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

          const itemSupplier =
            item.supplier ||
            item.metadata?.original_data?.supplier ||
            'Неизвестный поставщик'

          const warehouses = item.warehouses.map(w => ({
            ...w,
            supplier: w.supplier || itemSupplier,
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
              supplier: itemSupplier,
              brand: item.brand,
              article: item.article,
              name: item.name,
              description: item.description,
              images: item.images || [],
              specifications: item.specifications || {},
              metadata: item.metadata || {},
              is_cross: item.metadata?.is_cross || false,
              warehouses,
            },
          ]
        })

        setSuppliers(prev => {
          const next = new Set(prev)
          if (item.supplier) next.add(item.supplier)
          item.warehouses.forEach(w => w.supplier && next.add(w.supplier))
          return next
        })
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
          supplier: warehouse.supplier || product.supplier,
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
    <Box minHeight="100vh" bgcolor="#f7f7f7">
      <Header 
        onAccountClick={() => setShowAccountModal(true)}
        onExampleSearch={(q) => {
          if (q === '') {
            setSearchQuery('')
            setProducts([])
            setError(null)
          } else {
            setSearchQuery(q)
            handleSearch(q)
          }
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={() => handleSearch()}
        cartItems={cartItems}
      />

      <Container maxWidth="xl" sx={{ mt: 4, pb: 4 }}>
        <Box mt={4}>
          {isLoading && products.length === 0 && <LoadingSpinner />}
          {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

          {products.length > 0 && (
            <>
              <Stack spacing={2} mb={3}>
                <Typography variant="h6">
                  Найдено товаров: {products.length}
                </Typography>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {[...suppliers].map(s => (
                    <Chip key={s} label={s} size="small" />
                  ))}
                </Stack>
              </Stack>

              <Grid container spacing={2}>
                {products
                  .sort((a, b) => a.is_cross - b.is_cross)
                  .map((product, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={product.internalId}>
                      <ProductCard
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
                    </Grid>
                  ))}
              </Grid>
            </>
          )}

          {!isLoading && products.length === 0 && !error && searchQuery === '' && (
            <EmptyState onExampleSearch={(q) => {
              setSearchQuery(q)
              handleSearch(q)
            }} />
          )}
        </Box>
      </Container>

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
    </Box>
  )
}

export default App