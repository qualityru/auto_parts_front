import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  IconButton,
  Chip,
  Divider,
  Stack,
  styled,
} from '@mui/material';
import {
  ShoppingCartOutlined,
  CheckOutlined,
  ImageNotSupportedOutlined,
  LocalShippingOutlined,
  AssignmentReturnOutlined,
} from '@mui/icons-material';

// Стиль для контейнера картинок (фиксированная высота, скролл слайдов)
const GalleryContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: '180px',
  backgroundColor: '#f5f7fa',
  overflow: 'hidden',
  cursor: 'pointer',
  borderRadius: '8px 8px 0 0',
}));

const SlideContainer = styled(Box)(({ currentindex }) => ({
  display: 'flex',
  height: '100%',
  transition: 'transform 0.3s ease-out',
  transform: `translateX(-${currentindex * 100}%)`,
}));

const Slide = styled(Box)({
  minWidth: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& img': {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
  },
});

const IndicatorBox = styled(Box)({
  position: 'absolute',
  bottom: '8px',
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  gap: '4px',
});

const Dot = styled(Box)(({ active }) => ({
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  backgroundColor: active ? '#1976d2' : '#ccc',
  transition: 'all 0.2s ease',
}));

function ProductCard({
  product,
  index,
  onAddToCart,
  isItemInCart,
  onOpenImageModal,
}) {
  const [showAll, setShowAll] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = product.images || [];
  const validImages = images.filter((img) => img && img.trim() !== '');
  const warehouses = showAll ? product.warehouses : product.warehouses.slice(0, 3);

  const minPrice = product.warehouses?.length > 0
    ? Math.min(...product.warehouses.map((w) => w.price || 0))
    : 0;

  const isCross = product.is_cross === true ||
    product.metadata?.is_cross === true ||
    product.metadata?.original_data?.is_cross === 1;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price || 0);
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('/static/')) return imageUrl;
    return imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  };

  const getPlaceholderImage = () => 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyMCIgdmlld0JveD0iMCAwIDQwMCAyMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIyMjAiIGZpbGw9IiNGNUY3RkEiLz48cGF0aCBkPSJNMjAwIDcwQzIzMS4zNiA3MCAyNTYgNTkuMzYgMjU2IDQ1QzI1NiAzMC42NCAyMzEuMzYgMjAgMjAwIDIwQzE2OC42NCAyMCAxNDQgMzAuNjQgMTQ0IDQ1QzE0NCA1OS4zNiAxNjguNjQgNzAgMjAwIDcwWiIgZmlsbD0iI0RDRUZGQyIvPjxwYXRoIGQ9Ik01MCAxNjBDMjguMzYgMTYwIDggMTQ3LjY0IDggMTMwQzggMTEyLjM2IDI4LjMzIDEwMCA1MCAxMDBMNzAgMTAwTDEwMCA0MEwyMDAgNDBMMjcwIDEwMEwzMTAgMTAwTDM1MCAxMDBDMzcxLjY0IDEwMCAzOTIgMTEyLjM2IDM5MiAxMzBDMzkyIDE0Ny42NCAzNzEuNjQgMTYwIDM1MCAxNjBINDBaIiBmaWxsPSIjRUNFRkZGIi8+PC9zdmc+';

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = getPlaceholderImage();
  };

  const getReturnInfo = (warehouse) => {
    const info = warehouse.supplier_info?.original_data;
    if (!info || info.return_type?.id === '3') return { text: 'без возврата', days: null };
    const returnType = info.return_type?.name || '';
    const hasReturn = returnType.includes('Возврат возможен');
    return {
      text: hasReturn ? 'возврат' : 'без возврата',
      days: info.back_days || null,
    };
  };

  return (
    <Card 
      sx={{ 
        maxWidth: 320, 
        minWidth: 280,
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        transition: 'transform 0.2s',
        '&:hover': { transform: 'translateY(-4px)' }
      }}
    >
      {/* ГАЛЕРЕЯ */}
      <GalleryContainer onClick={onOpenImageModal}>
        {validImages.length > 0 ? (
          <>
            <SlideContainer currentindex={currentImageIndex}>
              {validImages.map((src, idx) => (
                <Slide key={idx}>
                  <img src={getImageUrl(src)} alt={product.name} onError={handleImageError} loading="lazy" />
                </Slide>
              ))}
            </SlideContainer>
            {validImages.length > 1 && (
              <IndicatorBox>
                {validImages.map((_, idx) => (
                  <Dot 
                    key={idx} 
                    active={idx === currentImageIndex} 
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }} 
                  />
                ))}
              </IndicatorBox>
            )}
          </>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
            <ImageNotSupportedOutlined />
            <Typography variant="caption">Нет фото</Typography>
          </Box>
        )}
      </GalleryContainer>

      <CardContent sx={{ p: 2 }}>
        {/* ТЭГИ И АРТИКУЛ */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, flexWrap: 'wrap', gap: '4px' }}>
          {product.supplier && (
            <Chip label={product.supplier} size="small" sx={{ fontSize: '10px', height: '20px' }} />
          )}
          <Chip 
            label={isCross ? 'АНАЛОГ' : 'ОРИГИНАЛ'} 
            color={isCross ? 'warning' : 'success'} 
            size="small" 
            variant="outlined"
            sx={{ fontSize: '10px', height: '20px', fontWeight: 'bold' }} 
          />
          <Typography variant="caption" sx={{ color: 'text.secondary', ml: 'auto' }}>
            {product.article}
          </Typography>
        </Stack>

        {/* БРЕНД И НАЗВАНИЕ */}
        {product.brand && (
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', textTransform: 'uppercase' }}>
            {product.brand}
          </Typography>
        )}
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontWeight: 600, 
            lineHeight: 1.2, 
            height: '2.4em', 
            overflow: 'hidden', 
            display: '-webkit-box', 
            WebkitLineClamp: 2, 
            WebkitBoxOrient: 'vertical',
            mb: 1
          }}
          title={product.name}
        >
          {product.name || 'Без названия'}
        </Typography>

        {/* ГЛАВНАЯ ЦЕНА */}
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="baseline" spacing={0.5}>
            <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>
              {formatPrice(minPrice)}
            </Typography>
            <Typography variant="body2" component="span">₽</Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            от {product.warehouses.length} склада(ов)
          </Typography>
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* СПИСОК СКЛАДОВ */}
        <Stack spacing={1}>
          {warehouses.map((w) => {
            const inCart = isItemInCart(product.internalId || product.id, w.id);
            const returnInfo = getReturnInfo(w);
            const quantity = w.quantity || 0;
            const isAvailable = w.is_available !== false && quantity > 0;

            return (
              <Box key={w.id || w.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" display="block" sx={{ color: isAvailable ? 'success.main' : 'error.main', fontWeight: 600 }}>
                    {isAvailable ? `В наличии: ${quantity}` : 'Нет в наличии'}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ color: 'text.secondary', fontSize: '11px' }}>
                    {w.delivery_days && (
                      <Stack direction="row" alignItems="center" spacing={0.2}>
                        <LocalShippingOutlined sx={{ fontSize: 12 }} />
                        <span>{w.delivery_days} дн</span>
                      </Stack>
                    )}
                    <Stack direction="row" alignItems="center" spacing={0.2} sx={{ color: returnInfo.days ? 'info.main' : 'text.disabled' }}>
                      <AssignmentReturnOutlined sx={{ fontSize: 12 }} />
                      <span>{returnInfo.days ? `${returnInfo.days} дн` : returnInfo.text}</span>
                    </Stack>
                  </Stack>
                </Box>

                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {formatPrice(w.price)}
                  </Typography>
                  <IconButton
                    size="small"
                    color={inCart ? "success" : "primary"}
                    disabled={!isAvailable}
                    onClick={() => isAvailable && onAddToCart(product, w)}
                    sx={{ 
                      border: '1px solid',
                      borderColor: inCart ? 'success.main' : 'primary.main',
                      borderRadius: '8px',
                      '&.Mui-disabled': { border: '1px solid #eee' }
                    }}
                  >
                    {inCart ? <CheckOutlined fontSize="small" /> : <ShoppingCartOutlined fontSize="small" />}
                  </IconButton>
                </Stack>
              </Box>
            );
          })}
        </Stack>

        {product.warehouses.length > 3 && (
          <Button 
            fullWidth 
            size="small" 
            variant="text" 
            onClick={() => setShowAll(v => !v)}
            sx={{ mt: 1, fontSize: '11px', textTransform: 'none' }}
          >
            {showAll ? 'Скрыть' : `Ещё ${product.warehouses.length - 3} складов`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default ProductCard;