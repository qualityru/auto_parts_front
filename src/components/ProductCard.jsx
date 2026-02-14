import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Chip,
  Divider,
  Stack,
  styled,
  Button,
  useTheme,
} from '@mui/material';
import {
  ShoppingCartOutlined,
  CheckOutlined,
  ImageNotSupportedOutlined,
  LocalShippingOutlined,
  AssignmentReturnOutlined,
  BusinessCenterOutlined, // Иконка для поставщика
} from '@mui/icons-material';

// --- СТИЛИЗАЦИЯ (СТРОГАЯ ГЕОМЕТРИЯ) ---

const StyledCard = styled(Card)(({ theme }) => ({
  width: 360,
  height: 600,
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 16,
  boxShadow: theme.shadows[1],
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
}));

const GalleryContainer = styled(Box)(({ theme }) => ({
  height: 180,
  width: '100%',
  backgroundColor: theme.palette.action.hover,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  position: 'relative',
  '& img': { width: '100%', height: '100%', objectFit: 'contain' },
}));

const WarehouseZone = styled(Box)(({ theme }) => ({
  height: 190,
  overflowY: 'auto',
  marginTop: 12,
  paddingRight: 4,
  '&::-webkit-scrollbar': { width: 4 },
  '&::-webkit-scrollbar-thumb': { backgroundColor: theme.palette.action.selected, borderRadius: 10 },
}));

function ProductCard({
  product,
  onAddToCart,
  isItemInCart,
  onOpenImageModal,
}) {
  const [showAll, setShowAll] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const theme = useTheme();

  const images = product.images || [];
  const validImages = images.filter((img) => img && img.trim() !== '');
  const displayedWarehouses = showAll ? product.warehouses : product.warehouses.slice(0, 3);

  const minPrice = product.warehouses?.length > 0
    ? Math.min(...product.warehouses.map((w) => w.price || 0))
    : 0;

  const isCross = product.is_cross === true || 
                  product.metadata?.is_cross === true || 
                  product.metadata?.original_data?.is_cross === 1;

  const formatPrice = (price) => new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price || 0);

  const getReturnInfo = (warehouse) => {
    const info = warehouse.supplier_info?.original_data;
    if (!info || info.return_type?.id === '3') return { text: 'без возврата', days: null };
    return {
      text: info.back_days ? 'возврат' : 'без возврата',
      days: info.back_days || null,
    };
  };

  return (
    <StyledCard>
      {/* 1. ГАЛЕРЕЯ */}
      <GalleryContainer onClick={onOpenImageModal}>
        {validImages.length > 0 ? (
          <img src={validImages[currentImageIndex]} alt={product.name} />
        ) : (
          <Stack color="text.disabled" alignItems="center">
            <ImageNotSupportedOutlined fontSize="large" />
            <Typography variant="caption">Нет фото</Typography>
          </Stack>
        )}
      </GalleryContainer>

      <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        
        {/* 2. ТЭГИ: Поставщик, Тип и Артикул */}
        <Box sx={{ height: 50 }}> {/* Фикс. высота для блока тэгов */}
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
            {product.supplier && (
              <Chip 
                icon={<BusinessCenterOutlined style={{ fontSize: 12 }} />}
                label={product.supplier} 
                size="small" 
                variant="outlined"
                sx={{ fontSize: '10px', height: 20, bgcolor: theme.palette.mode === 'light' ? '#f1f5f9' : theme.palette.action.selected }} 
              />
            )}
            <Chip 
              label={isCross ? 'АНАЛОГ' : 'ОРИГИНАЛ'} 
              color={isCross ? 'warning' : 'success'} 
              size="small" 
              sx={{ fontWeight: 800, fontSize: '10px', height: 20 }} 
            />
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Арт: <b>{product.article}</b>
          </Typography>
        </Box>

        {/* 3. БРЕНД И НАЗВАНИЕ */}
        <Box sx={{ mt: 1.5, height: 65 }}>
          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 800, textTransform: 'uppercase' }}>
            {product.brand || 'No Brand'}
          </Typography>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              fontWeight: 600, lineHeight: 1.2, height: '2.4em', 
              overflow: 'hidden', display: '-webkit-box', 
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' 
            }}
          >
            {product.name || 'Наименование не указано'}
          </Typography>
        </Box>

        {/* 4. ЦЕНА */}
        <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mt: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>{formatPrice(minPrice)}</Typography>
          <Typography variant="body2">₽</Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
          Предложений: {product.warehouses.length}
        </Typography>

        <Divider sx={{ borderColor: 'divider', my: 1 }} />

        {/* 5. СКЛАДЫ (Срок доставки и Возврат внутри) */}
        <WarehouseZone>
          <Stack spacing={1.5}>
            {displayedWarehouses.map((w) => {
              const inCart = isItemInCart(product.internalId || product.id, w.id);
              const returnInfo = getReturnInfo(w);
              const isAvailable = w.quantity > 0;

              return (
                <Box key={w.id} sx={{ pr: 0.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: isAvailable ? 'success.main' : 'error.main', display: 'block' }}>
                        {isAvailable ? `В наличии: ${w.quantity}` : 'Нет в наличии'}
                      </Typography>
                      
                      <Stack direction="row" spacing={1.5}>
                        {/* СРОК ДОСТАВКИ */}
                        <Stack direction="row" alignItems="center" spacing={0.3} sx={{ color: 'text.secondary', fontSize: '11px' }}>
                          <LocalShippingOutlined sx={{ fontSize: 13 }} />
                          <span>{w.delivery_days || 0} дн.</span>
                        </Stack>
                        {/* ВОЗВРАТ */}
                        <Stack direction="row" alignItems="center" spacing={0.3} sx={{ color: returnInfo.days ? 'info.main' : 'text.disabled', fontSize: '11px' }}>
                          <AssignmentReturnOutlined sx={{ fontSize: 13 }} />
                          <span>{returnInfo.days ? `${returnInfo.days} дн.` : returnInfo.text}</span>
                        </Stack>
                      </Stack>
                    </Box>

                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{formatPrice(w.price)}</Typography>
                      <IconButton
                        size="small"
                        color={inCart ? "success" : "primary"}
                        disabled={!isAvailable}
                        onClick={() => onAddToCart(product, w)}
                        sx={{ 
                          border: '1.5px solid', 
                          borderRadius: 2,
                          borderColor: inCart ? 'success.main' : theme.palette.primary.light
                        }}
                      >
                        {inCart ? <CheckOutlined fontSize="small" /> : <ShoppingCartOutlined fontSize="small" />}
                      </IconButton>
                    </Stack>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </WarehouseZone>

        {/* 6. КНОПКА ЕЩЁ (Фиксированный низ) */}
        <Box sx={{ mt: 'auto', pt: 1 }}>
          {product.warehouses.length > 3 && (
            <Button 
              fullWidth 
              variant="contained" 
              disableElevation
              size="small" 
              onClick={() => setShowAll(!showAll)}
              sx={{ 
                bgcolor: theme.palette.mode === 'light' ? '#f1f5f9' : theme.palette.action.selected,
                color: theme.palette.text.primary,
                textTransform: 'none',
                fontWeight: 700,
                '&:hover': { bgcolor: theme.palette.action.hover }
              }}
            >
              {showAll ? 'Свернуть склады' : `Все склады (+${product.warehouses.length - 3})`}
            </Button>
          )}
        </Box>
      </CardContent>
    </StyledCard>
  );
}

export default ProductCard;
