import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Collapse,
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
  CheckOutlined,
  ChevronLeftOutlined,
  ChevronRightOutlined,
  CloseOutlined,
  LocalShippingOutlined,
  ShoppingCartOutlined,
} from '@mui/icons-material';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

const StyledCard = styled(Card)(({ theme }) => ({
  width: '100%',
  maxWidth: 380,
  height: 620,
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

const WarehouseZone = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  minHeight: 0,
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

const getPriceValue = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const normalized = value.trim().replace(/\s+/g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  const price = Number(normalized);
  return normalized && Number.isFinite(price) ? price : null;
};

const normalizeArticleForMatch = (value) => String(value ?? '')
  .trim()
  .toLocaleUpperCase('ru')
  .replace(/[\s-]+/g, '');

const isRequestedArticleWarehouse = (warehouse, searchQuery) => {
  const requestedArticle = normalizeArticleForMatch(searchQuery);
  if (!requestedArticle) return false;

  return [
    warehouse.sourceProduct?.article,
    warehouse.article,
    warehouse.supplier_article,
  ].some((article) => normalizeArticleForMatch(article) === requestedArticle);
};

function ProductCard({
  product,
  searchQuery,
  onAddToCart,
  isItemInCart,
  onOpenImageModal,
}) {
  const theme = useTheme();
  const [visibleWarehouseCount, setVisibleWarehouseCount] = useState(3);
  const [imageViewer, setImageViewer] = useState(null);
  const warehouseScrollRef = useRef(null);
  const warehousesLoadMoreRef = useRef(null);

  const warehouses = useMemo(
    () => (Array.isArray(product.warehouses) ? product.warehouses : []),
    [product.warehouses],
  );
  const sortedWarehouses = useMemo(() => [...warehouses].sort((left, right) => {
    // Сначала предложения по искомому (оригинальному) артикулу, затем заменители по цене.
    const exactMatchDifference = Number(isRequestedArticleWarehouse(right, searchQuery))
      - Number(isRequestedArticleWarehouse(left, searchQuery));
    if (exactMatchDifference) return exactMatchDifference;

    const leftPrice = getPriceValue(left.price);
    const rightPrice = getPriceValue(right.price);
    if (leftPrice === null && rightPrice === null) return 0;
    if (leftPrice === null) return 1;
    if (rightPrice === null) return -1;
    return leftPrice - rightPrice;
  }), [warehouses, searchQuery]);
  const displayedWarehouses = sortedWarehouses.slice(0, visibleWarehouseCount);
  const validPrices = sortedWarehouses
    .map((warehouse) => getPriceValue(warehouse.price))
    .filter((price) => price !== null);
  const minPrice = validPrices.length ? Math.min(...validPrices) : 0;

  useEffect(() => {
    setVisibleWarehouseCount((current) => Math.min(Math.max(3, current), sortedWarehouses.length));
  }, [sortedWarehouses.length]);

  useEffect(() => {
    const target = warehousesLoadMoreRef.current;
    const scrollRoot = warehouseScrollRef.current;
    if (!target || !scrollRoot || visibleWarehouseCount >= sortedWarehouses.length) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisibleWarehouseCount((current) => Math.min(current + 10, sortedWarehouses.length));
      }
    }, { root: scrollRoot, rootMargin: '0px 0px 120px' });
    observer.observe(target);
    return () => observer.disconnect();
  }, [visibleWarehouseCount, sortedWarehouses.length]);

  const formatPrice = (price) => new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);

  const openImageModal = (images, imageProduct, initialIndex = 0) => {
    const validImages = (images || []).filter((image) => typeof image === 'string' && image.trim());
    if (validImages.length === 0) return;
    if (typeof onOpenImageModal === 'function') {
      onOpenImageModal({
        product: imageProduct,
        images: validImages,
        initialIndex,
      });
      return;
    }
    setImageViewer({ product: imageProduct, images: validImages, index: initialIndex });
  };

  const showPreviousViewerImage = () => {
    setImageViewer((viewer) => viewer && ({
      ...viewer,
      index: (viewer.index - 1 + viewer.images.length) % viewer.images.length,
    }));
  };

  const showNextViewerImage = () => {
    setImageViewer((viewer) => viewer && ({
      ...viewer,
      index: (viewer.index + 1) % viewer.images.length,
    }));
  };

  return (
    <>
      <StyledCard>
        <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
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

          <WarehouseZone ref={warehouseScrollRef}>
            <Stack spacing={1}>
              {displayedWarehouses.map((warehouse, index) => {
                const cartProduct = warehouse.sourceProduct || product;
                const inCart = isItemInCart(cartProduct.internalId || cartProduct.id, warehouse.id);
                const hasQuantity = Number(warehouse.quantity) > 0 || warehouse.is_available === true;
                const returnInfo = getReturnInfo(warehouse);
                const multiplicityLabel = getMultiplicityInfo(warehouse);
                const sourceImages = (cartProduct.images || []).filter((image) => (
                  typeof image === 'string' && image.trim()
                ));

                return (
                  <Collapse
                    key={`${warehouse.id || 'warehouse'}-${index}`}
                    in
                    timeout={220}
                  >
                    <Box
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
                            minWidth: 0,
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

                      <Stack
                        spacing={0.35}
                        alignItems="flex-end"
                        justifyContent="flex-start"
                        flexShrink={0}
                        alignSelf="stretch"
                      >
                        {(cartProduct.brand || cartProduct.article) && (
                          <Stack alignItems="flex-end" spacing={0.1} sx={{ maxWidth: 145 }}>
                            {cartProduct.brand && (
                              <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: '100%', fontSize: 10, lineHeight: 1 }}>
                                {cartProduct.brand}
                              </Typography>
                            )}
                            {cartProduct.article && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ fontSize: 10, lineHeight: 1.1, textAlign: 'right', overflowWrap: 'anywhere' }}
                              >
                                Арт. {cartProduct.article}
                              </Typography>
                            )}
                          </Stack>
                        )}
                        <Stack direction="row" spacing={0.6} alignItems="flex-end">
                          {sourceImages.length > 0 && (
                            <Box
                              component="button"
                              type="button"
                              onClick={() => openImageModal(sourceImages, cartProduct)}
                              aria-label={`Открыть фотографии товара ${cartProduct.article || ''}`}
                              sx={{
                                position: 'relative', flexShrink: 0, p: 0, width: 38, height: 38,
                                border: '1px solid', borderColor: 'divider', borderRadius: 1.25,
                                overflow: 'hidden', cursor: 'zoom-in', background: 'background.paper',
                              }}
                            >
                              <Box component="img" src={sourceImages[0]} alt={cartProduct.name || cartProduct.article || 'Фото товара'} sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 0.25 }} />
                              {sourceImages.length > 1 && (
                                <Box sx={{ position: 'absolute', right: 1, bottom: 1, px: 0.35, borderRadius: 0.75, bgcolor: 'rgba(0, 0, 0, 0.65)', color: '#fff', fontSize: 9, fontWeight: 800 }}>
                                  {sourceImages.length}
                                </Box>
                              )}
                            </Box>
                          )}
                          <Stack spacing={0.25} alignItems="flex-end">
                            <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1 }}>
                              {formatPrice(warehouse.price)} ₽
                            </Typography>
                            <IconButton
                              size="small"
                              color={inCart ? 'success' : 'primary'}
                              disabled={!hasQuantity}
                              onClick={() => onAddToCart(cartProduct, warehouse)}
                              sx={{ borderRadius: 2, border: '1.5px solid', borderColor: inCart ? 'success.main' : theme.palette.primary.light }}
                            >
                              {inCart ? <CheckOutlined fontSize="small" /> : <ShoppingCartOutlined fontSize="small" />}
                            </IconButton>
                          </Stack>
                        </Stack>
                      </Stack>
                      </Stack>
                    </Box>
                  </Collapse>
                );
              })}
              {visibleWarehouseCount < sortedWarehouses.length && (
                <Box ref={warehousesLoadMoreRef} sx={{ height: 1 }} />
              )}
            </Stack>
          </WarehouseZone>
        </CardContent>
      </StyledCard>

      <Dialog
        open={Boolean(imageViewer)}
        onClose={() => setImageViewer(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
          <Typography variant="subtitle1" noWrap sx={{ maxWidth: '92%' }}>
            {imageViewer?.product?.brand || ''} {imageViewer?.product?.article || ''} {imageViewer?.product?.name ? `- ${imageViewer.product.name}` : ''}
          </Typography>
          <IconButton onClick={() => setImageViewer(null)} aria-label="Закрыть">
            <CloseOutlined />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1, pb: 2 }}>
          <Box sx={{ position: 'relative', minHeight: 520, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {imageViewer && (
              <Zoom>
                <img
                  src={imageViewer.images[imageViewer.index]}
                  alt={imageViewer.product?.name || imageViewer.product?.article || 'Фото товара'}
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

            {imageViewer?.images.length > 1 && (
              <>
                <IconButton
                  size="large"
                  onClick={showPreviousViewerImage}
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
                  onClick={showNextViewerImage}
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
                    {imageViewer.images.map((image, index) => (
                      <Box
                        key={`${image}-${index}`}
                        component="button"
                        onClick={() => setImageViewer((viewer) => ({ ...viewer, index }))}
                        aria-label={`Открыть фото ${index + 1}`}
                        sx={{
                          border: 0,
                          p: 0,
                          width: 56,
                          height: 56,
                          borderRadius: 1,
                          overflow: 'hidden',
                          opacity: imageViewer.index === index ? 1 : 0.65,
                          outline: imageViewer.index === index ? `2px solid ${theme.palette.primary.main}` : 'none',
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
