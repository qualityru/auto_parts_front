import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Stack,
  Grid,
  Chip,
  CssBaseline,
} from '@mui/material'
import { createTheme, ThemeProvider } from '@mui/material/styles'

import Header from './components/Header'
import ProductCard from './components/ProductCard'
import LoadingSpinner from './components/LoadingSpinner'
import ErrorMessage from './components/ErrorMessage'
import EmptyState from './components/EmptyState'
import AccountModal from './components/AccountModal'
import ImageModal from './components/ImageModal'
import MainBody from './components/MainBody'
import Footer from './components/Footer'

import { searchProductsStream } from './utils/api'

function App() {
  const [themeMode, setThemeMode] = useState('light')

  useEffect(() => {
    const stored = localStorage.getItem('themeMode')
    if (stored === 'light' || stored === 'dark') setThemeMode(stored)
  }, [])

  const toggleTheme = () => {
    setThemeMode(prev => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('themeMode', next)
      return next
    })
  }

  const theme = useMemo(() => createTheme({
    palette: {
      mode: themeMode,
      ...(themeMode === 'light'
        ? { background: { default: '#f7f7f7' } }
        : { background: { default: '#0f1720' } }),
      primary: { main: '#1976d2' },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiAppBar: { defaultProps: { enableColorOnDark: true } },
    },
  }), [themeMode])

  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState(new Set())
  const [cartItems, setCartItems] = useState([])
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [imageModalData, setImageModalData] = useState(null)

  const activeStream = useRef(null)

  // --- ЛОГИКА КОРЗИНЫ (ПОЛНОСТЬЮ СОХРАНЕНА) ---
  const getCartTotal = useCallback(() => {
    return cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
  }, [cartItems])

  const handleAddToCart = (product, warehouse) => {
    setCartItems(prev => {
      const idx = prev.findIndex(i => i.productId === product.internalId && i.warehouseId === warehouse.id)
      if (idx > -1) {
        const copy = [...prev]
        copy[idx].quantity += 1
        return copy
      }
      return [...prev, {
        productId: product.internalId,
        warehouseId: warehouse.id,
        brand: product.brand,
        article: product.article,
        name: product.name,
        image: product.images?.[0] || '',
        price: warehouse.price,
        currency: warehouse.currency,
        quantity: 1,
        warehouseName: warehouse.name,
        supplier: warehouse.supplier || product.supplier,
      }]
    })
  }

  const handleRemoveFromCart = (productId, warehouseId) => {
    setCartItems(prev => prev.filter(i => !(i.productId === productId && i.warehouseId === warehouseId)))
  }

  const handleUpdateQuantity = (productId, warehouseId, newQuantity) => {
    if (newQuantity < 1) return
    setCartItems(prev => prev.map(item => 
      (item.productId === productId && item.warehouseId === warehouseId) ? { ...item, quantity: newQuantity } : item
    ))
  }

  const handleClearCart = () => {
    if (window.confirm('Вы уверены, что хотите очистить корзину?')) setCartItems([])
  }

  const isItemInCart = useCallback((productId, warehouseId) =>
    cartItems.some(i => i.productId === productId && i.warehouseId === warehouseId),
    [cartItems]
  )

  // --- ПОИСК (ПОЛНОСТЬЮ СОХРАНЕН) ---
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
          const groupKey = `${item.brand}-${item.article}`.toLowerCase().replace(/\s+/g, '')
          const idx = prev.findIndex(p => p.groupKey === groupKey)
          const itemSupplier = item.supplier || item.metadata?.original_data?.supplier || 'Неизвестный поставщик'
          const warehouses = item.warehouses.map(w => ({ ...w, supplier: w.supplier || itemSupplier }))

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

          return [...prev, {
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
          }]
        })

        setSuppliers(prev => {
          const next = new Set(prev)
          if (item.supplier) next.add(item.supplier)
          item.warehouses.forEach(w => w.supplier && next.add(w.supplier))
          return next
        })
      },
      onImages: ({ article, images }) => {
        setProducts(prev => prev.map(p => p.article.toLowerCase() === article.toLowerCase()
          ? { ...p, images: Array.from(new Set([...(p.images || []), ...images])) } : p
        ))
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box display="flex" flexDirection="column" minHeight="100vh" sx={{ bgcolor: 'background.default' }}>
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
          onRemoveItem={handleRemoveFromCart}
          onUpdateQuantity={handleUpdateQuantity}
          onClearCart={handleClearCart}
          getCartTotal={getCartTotal}
          themeMode={themeMode}
          onToggleTheme={toggleTheme}
        />

        <Container maxWidth="xl" sx={{ mt: 4, pb: 4, flex: 1 }}>
          <Box mt={4}>
            {/* 1. Если ничего не искали - MainBody */}
            {!isLoading && products.length === 0 && !error && searchQuery === '' && (
              <MainBody onExampleSearch={(q) => {
                setSearchQuery(q)
                handleSearch(q)
              }} />
            )}

            {/* 2. Загрузка */}
            {isLoading && products.length === 0 && (
              <Box display="flex" justifyContent="center" py={10}>
                <LoadingSpinner />
              </Box>
            )}

            {/* 3. Ошибка */}
            {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

            {/* 4. Результаты (С центрированием) */}
            {products.length > 0 && (
              <>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" mb={3} spacing={2}>
                  <Box textAlign={{ xs: 'center', sm: 'left' }}>
                    <Typography variant="h5" fontWeight="700">Результаты поиска</Typography>
                    <Typography variant="body2" color="text.secondary">Найдено позиций: {products.length}</Typography>
                  </Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
                    {[...suppliers].map(s => (
                      <Chip key={s} label={s} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </Stack>

                <Grid container spacing={3} justifyContent="center">
                  {products
                    .sort((a, b) => a.is_cross - b.is_cross)
                    .map((product, index) => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={product.internalId} sx={{ display: 'flex', justifyContent: 'center' }}>
                        <ProductCard
                          product={product}
                          index={index}
                          onAddToCart={handleAddToCart}
                          isItemInCart={isItemInCart}
                          onOpenImageModal={() => setImageModalData({ images: product.images, productInfo: product })}
                        />
                      </Grid>
                    ))}
                </Grid>
              </>
            )}

            {/* 5. Пусто после поиска */}
            {!isLoading && products.length === 0 && !error && searchQuery !== '' && (
              <EmptyState onExampleSearch={(q) => {
                setSearchQuery(q)
                handleSearch(q)
              }} />
            )}
          </Box>
        </Container>

        <Footer />

        {showAccountModal && <AccountModal onClose={() => setShowAccountModal(false)} />}
        {imageModalData && (
          <ImageModal
            images={imageModalData.images}
            productInfo={imageModalData.productInfo}
            onClose={() => setImageModalData(null)}
          />
        )}
      </Box>
    </ThemeProvider>
  )
}

export default App