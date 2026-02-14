import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
  styled,
  useTheme,
} from '@mui/material';
import {
  AssignmentReturnOutlined,
  BusinessCenterOutlined,
  CheckOutlined,
  ChevronLeftOutlined,
  ChevronRightOutlined,
  CloseOutlined,
  ImageNotSupportedOutlined,
  LocalShippingOutlined,
  ShoppingCartOutlined,
  ZoomInOutlined,
} from '@mui/icons-material';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

const StyledCard = styled(Card)(({ theme }) => ({
  width: '100%',
  maxWidth: 380,
  minHeight: 620,
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 20,
  border: `1px solid ${theme.palette.divider}`,
  background: theme.palette.mode === 'light'
    ? 'linear-gradient(180deg, #ffffff 0%, #f9fbff 100%)'
    : 'linear-gradient(180deg, #121b26 0%, #0f1722 100%)',
  boxShadow: theme.palette.mode === 'light'
    ? '0 10px 30px rgba(19, 39, 69, 0.08)'
    : '0 10px 30px rgba(0, 0, 0, 0.35)',
  transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.palette.mode === 'light'
      ? '0 18px 36px rgba(19, 39, 69, 0.16)'
      : '0 18px 38px rgba(0, 0, 0, 0.45)',
    borderColor: theme.palette.primary.main,
  },
}));

const GalleryContainer = styled(Box)(({ theme }) => ({
  height: 210,
  width: '100%',
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'zoom-in',
  backgroundColor: '#fff',
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    padding: 14,
  },
}));

const WarehouseZone = styled(Box)(({ theme }) => ({
  maxHeight: 218,
  overflowY: 'auto',
  paddingRight: 4,
  '&::-webkit-scrollbar': { width: 5 },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: theme.palette.action.selected,
    borderRadius: 12,
  },
}));

const parseDateValue = (value) => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const date = new Date(`${raw}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (/^\d{2}\.\d{2}\.\d{4}/.test(raw)) {
    const [day, month, year] = raw.slice(0, 10).split('.');
    const date = new Date(`${year}-${month}-${day}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (/^\d{14}$/.test(raw)) {
    const year = raw.slice(0, 4);
    const month = raw.slice(4, 6);
    const day = raw.slice(6, 8);
    const date = new Date(`${year}-${month}-${day}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
};

const formatDateShort = (value) => {
  const date = parseDateValue(value);
  if (!date) return null;
  return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit' }).format(date);
};

const getDeliveryLabel = (warehouse) => {
  const deliveryDays = Number(warehouse.delivery_days);
  if (!Number.isNaN(deliveryDays) && deliveryDays > 0) return `${deliveryDays} дн.`;

  const start = formatDateShort(warehouse.delivery_date_start);
  const end = formatDateShort(warehouse.delivery_date_end);

  if (start && end && start !== end) return `${start}-${end}`;
  if (start || end) return start || end;
  return 'уточнить';
};

const getReturnInfo = (warehouse) => {
  const original = warehouse.supplier_info?.original_data || {};
  const returnType = original.return_type || {};
  const returnTypeName = String(returnType.name || '').toLowerCase();
  const returnTypeId = String(returnType.id || '');
  const armtekDays = Number(original.RETDAYS);
  const backDays = Number(original.back_days);
  const backPercent = Number(original.back_percent);

  if (returnTypeId === '3' || returnTypeName.includes('невозмож')) {
    return { label: 'без возврата', isPositive: false };
  }
  if (returnTypeId && returnTypeId !== '3') {
    return { label: 'возможен', isPositive: true };
  }
  if (returnTypeName.includes('возмож')) {
    return { label: 'возможен', isPositive: true };
  }
  if (!Number.isNaN(armtekDays) && armtekDays > 0) {
    return { label: `${armtekDays} дн.`, isPositive: true };
  }
  if (!Number.isNaN(backDays) && backDays > 0) {
    return { label: `${backDays} дн.`, isPositive: true };
  }
  if (backPercent === -1) {
    return { label: 'без возврата', isPositive: false };
  }

  return { label: 'уточнить', isPositive: false };
};

const getWarehouseTitle = (warehouse) => (
  warehouse.name
  || warehouse.supplier_info?.name
  || warehouse.city
  || `Склад ${warehouse.id || ''}`
);

const getMultiplicityInfo = (warehouse) => {
  const original = warehouse.supplier_info?.original_data || {};
  const multSale = Number(original.mult_sale);
  const minBm = Number(original.MINBM);
  const value = !Number.isNaN(multSale) && multSale > 1
    ? multSale
    : (!Number.isNaN(minBm) && minBm > 1 ? minBm : null);
  const measure = String(original.measure?.name || '').trim();

  if (!value) return null;
  return `кратно ${value}${measure ? ` ${measure}` : ''}`;
};

function ProductCard({
  product,
  onAddToCart,
  isItemInCart,
  onOpenImageModal,
}) {
  const theme = useTheme();
  const [showAll, setShowAll] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const warehouses = useMemo(
    () => (Array.isArray(product.warehouses) ? product.warehouses : []),
    [product.warehouses],
  );
  const displayedWarehouses = showAll ? warehouses : warehouses.slice(0, 3);
  const validImages = useMemo(
    () => (product.images || []).filter((img) => typeof img === 'string' && img.trim() !== ''),
    [product.images],
  );

  const minPrice = warehouses.length > 0
    ? Math.min(...warehouses.map((w) => Number(w.price) || 0))
    : 0;

  const isCross = product.is_cross === true
    || product.metadata?.is_cross === true
    || product.metadata?.original_data?.is_cross === 1;

  const formatPrice = (price) => new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);

  useEffect(() => {
    if (validImages.length === 0) {
      setCurrentImageIndex(0);
      return;
    }
    if (currentImageIndex > validImages.length - 1) {
      setCurrentImageIndex(validImages.length - 1);
    }
  }, [validImages, currentImageIndex]);

  const openImageModal = () => {
    if (validImages.length === 0) return;
    if (typeof onOpenImageModal === 'function') {
      onOpenImageModal({
        product,
        images: validImages,
        initialIndex: currentImageIndex,
      });
      return;
    }
    setIsImageModalOpen(true);
  };

  const showPrevImage = (event) => {
    if (event) event.stopPropagation();
    if (validImages.length < 2) return;
    setCurrentImageIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  const showNextImage = (event) => {
    if (event) event.stopPropagation();
    if (validImages.length < 2) return;
    setCurrentImageIndex((prev) => (prev + 1) % validImages.length);
  };

  return (
    <>
      <StyledCard>
        <GalleryContainer onClick={openImageModal}>
          {validImages.length > 0 ? (
            <>
              <img src={validImages[currentImageIndex]} alt={product.name} />
              {validImages.length > 1 && (
                <>
                  <IconButton
                    size="small"
                    onClick={showPrevImage}
                    aria-label="Предыдущее фото"
                    sx={{
                      position: 'absolute',
                      left: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      bgcolor: 'rgba(8, 16, 28, 0.56)',
                      color: '#fff',
                      '&:hover': { bgcolor: 'rgba(8, 16, 28, 0.72)' },
                    }}
                  >
                    <ChevronLeftOutlined fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={showNextImage}
                    aria-label="Следующее фото"
                    sx={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      bgcolor: 'rgba(8, 16, 28, 0.56)',
                      color: '#fff',
                      '&:hover': { bgcolor: 'rgba(8, 16, 28, 0.72)' },
                    }}
                  >
                    <ChevronRightOutlined fontSize="small" />
                  </IconButton>
                </>
              )}
              <Box
                sx={{
                  position: 'absolute',
                  left: 10,
                  top: 10,
                  px: 1,
                  py: 0.4,
                  borderRadius: 2,
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#fff',
                  bgcolor: 'rgba(8, 16, 28, 0.62)',
                }}
              >
                {currentImageIndex + 1}/{validImages.length}
              </Box>
              <IconButton
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  openImageModal();
                }}
                aria-label="Увеличить фото"
                sx={{
                  position: 'absolute',
                  right: 10,
                  bottom: 10,
                  bgcolor: 'rgba(8, 16, 28, 0.56)',
                  color: '#fff',
                  '&:hover': { bgcolor: 'rgba(8, 16, 28, 0.72)' },
                }}
              >
                <ZoomInOutlined fontSize="small" />
              </IconButton>
            </>
          ) : (
            <Stack color="text.secondary" alignItems="center" spacing={1}>
              <ImageNotSupportedOutlined fontSize="large" />
              <Typography variant="caption">Фото скоро загрузится</Typography>
            </Stack>
          )}
        </GalleryContainer>

        <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.2 }}>
            <Chip
              icon={<BusinessCenterOutlined sx={{ fontSize: 14 }} />}
              label={product.supplier || 'Поставщик'}
              size="small"
              variant="filled"
              sx={{
                height: 24,
                fontSize: 11,
                borderRadius: 1.5,
                bgcolor: theme.palette.mode === 'light' ? '#e9f3ff' : '#1f3042',
              }}
            />
            <Chip
              label={isCross ? 'АНАЛОГ' : 'ОРИГИНАЛ'}
              size="small"
              sx={{
                height: 24,
                borderRadius: 1.5,
                fontSize: 11,
                fontWeight: 800,
                color: isCross ? '#9a5200' : '#0e5f40',
                bgcolor: isCross ? '#ffe7ca' : '#dff5ea',
              }}
            />
          </Stack>

          <Typography
            variant="overline"
            sx={{
              fontWeight: 800,
              color: 'primary.main',
              lineHeight: 1.2,
              letterSpacing: '.06em',
            }}
          >
            {product.brand || 'NO BRAND'} · {product.article || '---'}
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              lineHeight: 1.2,
              minHeight: '2.4em',
              mb: 1.2,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {product.name || 'Наименование не указано'}
          </Typography>

          <Box
            sx={{
              p: 1.4,
              mb: 1.2,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              background: theme.palette.mode === 'light'
                ? 'linear-gradient(135deg, #f8fbff, #eef5ff)'
                : 'linear-gradient(135deg, #18273a, #122033)',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  Цена от
                </Typography>
                <Stack direction="row" alignItems="baseline" spacing={0.4}>
                  <Typography variant="h5" sx={{ fontWeight: 900 }}>{formatPrice(minPrice)}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>₽</Typography>
                </Stack>
              </Box>
              <Chip
                size="small"
                label={`${warehouses.length} склад${warehouses.length === 1 ? '' : 'а'}`}
                sx={{
                  borderRadius: 1.5,
                  bgcolor: theme.palette.mode === 'light' ? '#fff' : '#25354a',
                  border: '1px solid',
                  borderColor: 'divider',
                  fontWeight: 700,
                }}
              />
            </Stack>
          </Box>

          <Divider sx={{ mb: 1.2 }} />

          <WarehouseZone>
            <Stack spacing={1}>
              {displayedWarehouses.map((warehouse) => {
                const inCart = isItemInCart(product.internalId || product.id, warehouse.id);
                const hasQuantity = Number(warehouse.quantity) > 0 || warehouse.is_available === true;
                const returnInfo = getReturnInfo(warehouse);
                const multiplicityLabel = getMultiplicityInfo(warehouse);

                return (
                  <Box
                    key={warehouse.id}
                    sx={{
                      p: 1.2,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: theme.palette.mode === 'light' ? '#fff' : '#162334',
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            display: 'block',
                            mb: 0.3,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {getWarehouseTitle(warehouse)}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            color: hasQuantity ? 'success.main' : 'error.main',
                          }}
                        >
                          {hasQuantity ? `В наличии: ${warehouse.quantity || 0}` : 'Нет в наличии'}
                        </Typography>

                        <Stack direction="row" spacing={1.5} sx={{ mt: 0.4 }}>
                          <Stack direction="row" spacing={0.4} alignItems="center">
                            <LocalShippingOutlined sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {getDeliveryLabel(warehouse)}
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={0.4} alignItems="center">
                            <AssignmentReturnOutlined
                              sx={{ fontSize: 14, color: returnInfo.isPositive ? 'info.main' : 'text.disabled' }}
                            />
                            <Typography variant="caption" color={returnInfo.isPositive ? 'info.main' : 'text.disabled'}>
                              {returnInfo.label}
                            </Typography>
                          </Stack>
                        </Stack>
                        {multiplicityLabel && (
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.3, color: 'text.secondary' }}>
                            {multiplicityLabel}
                          </Typography>
                        )}
                      </Box>

                      <Stack direction="row" spacing={0.8} alignItems="center">
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                          {formatPrice(warehouse.price)} ₽
                        </Typography>
                        <IconButton
                          size="small"
                          color={inCart ? 'success' : 'primary'}
                          disabled={!hasQuantity}
                          onClick={() => onAddToCart(product, warehouse)}
                          sx={{
                            borderRadius: 2,
                            border: '1.5px solid',
                            borderColor: inCart ? 'success.main' : theme.palette.primary.light,
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

          <Box sx={{ mt: 'auto', pt: 1.2 }}>
            {warehouses.length > 3 && (
              <Button
                fullWidth
                variant="outlined"
                size="small"
                onClick={() => setShowAll(!showAll)}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                }}
              >
                {showAll ? 'Свернуть склады' : `Показать все склады (+${warehouses.length - 3})`}
              </Button>
            )}
          </Box>
        </CardContent>
      </StyledCard>

      <Dialog
        open={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
          <Typography variant="subtitle1" noWrap sx={{ maxWidth: '92%' }}>
            {product.brand || ''} {product.article || ''} {product.name ? `- ${product.name}` : ''}
          </Typography>
          <IconButton onClick={() => setIsImageModalOpen(false)} aria-label="Закрыть">
            <CloseOutlined />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1, pb: 2 }}>
          <Box sx={{ position: 'relative', minHeight: 520, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {validImages.length > 0 && (
              <Zoom>
                <img
                  src={validImages[currentImageIndex]}
                  alt={product.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '72vh',
                    objectFit: 'contain',
                    borderRadius: 8,
                    cursor: 'zoom-in',
                  }}
                />
              </Zoom>
            )}

            {validImages.length > 1 && (
              <>
                <IconButton
                  size="large"
                  onClick={showPrevImage}
                  aria-label="Предыдущее фото"
                  sx={{
                    position: 'absolute',
                    left: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(0,0,0,0.45)',
                    color: '#fff',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.65)' },
                  }}
                >
                  <ChevronLeftOutlined />
                </IconButton>
                <IconButton
                  size="large"
                  onClick={showNextImage}
                  aria-label="Следующее фото"
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(0,0,0,0.45)',
                    color: '#fff',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.65)' },
                  }}
                >
                  <ChevronRightOutlined />
                </IconButton>
                <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                  <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap sx={{ py: 1 }}>
                    {validImages.map((image, index) => (
                      <Box
                        key={`${image}-${index}`}
                        component="button"
                        onClick={() => setCurrentImageIndex(index)}
                        aria-label={`Открыть фото ${index + 1}`}
                        sx={{
                          border: 0,
                          p: 0,
                          width: 56,
                          height: 56,
                          borderRadius: 1,
                          overflow: 'hidden',
                          opacity: currentImageIndex === index ? 1 : 0.65,
                          outline: currentImageIndex === index ? `2px solid ${theme.palette.primary.main}` : 'none',
                          cursor: 'pointer',
                          background: 'transparent',
                        }}
                      >
                        <Box
                          component="img"
                          src={image}
                          alt={`thumbnail-${index + 1}`}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ProductCard;
