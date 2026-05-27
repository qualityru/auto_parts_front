import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Stack,
  Button,
  Divider,
  Avatar,
  Badge,
  useTheme,
  alpha,
  Alert,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import { formatPrice } from '../utils/formatters';
import { createOrder } from '../utils/api';

const CartDrawer = ({ 
  open, 
  onClose, 
  cartItems, 
  onRemoveItem, 
  onUpdateQuantity, 
  onClearCart, 
  getCartTotal,
  onNeedAuth,
  onOrderCreated
}) => {
  const theme = useTheme();
  const items = Array.isArray(cartItems) ? cartItems : [];
  const [checkoutError, setCheckoutError] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleCheckout = async () => {
    setCheckoutError('');
    setSuccessMessage('');
    if (!localStorage.getItem('authToken')) {
      setCheckoutError('Для оформления заказа войдите или зарегистрируйтесь.');
      onNeedAuth?.();
      return;
    }
    setIsSubmitting(true);
    try {
      const order = await createOrder();
      setSuccessMessage(`Заказ #${order.id} оформлен. Статус можно отслеживать в личном кабинете.`);
      onOrderCreated?.(order);
    } catch (error) {
      if (error.status === 400 && String(error.message || '').includes('Заполните')) {
        setCheckoutError(`${error.message}. Перейдите в личный кабинет и заполните контактные данные.`);
        return;
      }
      setCheckoutError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 400 }, border: 'none', boxShadow: -5 }
      }}
    >
      {/* HEADER */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography variant="h5" fontWeight="700">Корзина</Typography>
          <Badge 
            badgeContent={items.reduce((acc, item) => acc + Number(item.quantity || 0), 0)} 
            color="primary" 
            sx={{ '& .MuiBadge-badge': { fontWeight: 600 } }} 
          />
        </Stack>
        <IconButton onClick={onClose} sx={{ bgcolor: 'action.hover' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Divider />

      {/* CONTENT */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        {items.length === 0 ? (
          <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', opacity: 0.6 }}>
            <ShoppingBagOutlinedIcon sx={{ fontSize: 80, mb: 2 }} />
            <Typography variant="h6">Ваша корзина пуста</Typography>
            <Button onClick={onClose} sx={{ mt: 2 }}>Вернуться к покупкам</Button>
          </Stack>
        ) : (
          <Stack spacing={3}>
            {items.map((item) => (
              <Box 
                key={item.id}
                sx={{ 
                  display: 'flex', 
                  gap: 2,
                  transition: '0.3s',
                  '&:hover': { transform: 'translateX(-4px)' }
                }}
              >
                <Avatar
                  src={item.image || item.product_data?.images?.[0]}
                  variant="rounded"
                  sx={{ width: 80, height: 80, bgcolor: 'grey.100', borderRadius: 2 }}
                />
                
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="caption" color="primary" fontWeight="700">
                    {item.brand}
                  </Typography>
                  <Typography variant="body2" fontWeight="600" noWrap sx={{ maxWidth: 200 }}>
                    {item.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    Арт: {item.article}
                  </Typography>

                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    {/* Stepper Количество */}
                    <Stack 
                      direction="row" 
                      alignItems="center" 
                      sx={{ 
                        border: `1px solid ${theme.palette.divider}`, 
                        borderRadius: '20px',
                        px: 0.5
                      }}
                    >
                      <IconButton 
                        size="small" 
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <RemoveIcon fontSize="inherit" />
                      </IconButton>
                      <Typography variant="body2" sx={{ mx: 1, fontWeight: 600 }}>
                        {item.quantity}
                      </Typography>
                      <IconButton 
                        size="small"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        <AddIcon fontSize="inherit" />
                      </IconButton>
                    </Stack>
                    
                    <Typography variant="subtitle1" fontWeight="700">
                      {formatPrice(Number(item.price) * item.quantity)} ₽
                    </Typography>
                  </Stack>
                </Box>
                
                <IconButton 
                  color="error" 
                  size="small" 
                  onClick={() => onRemoveItem(item.id)}
                  sx={{ alignSelf: 'flex-start', mt: -1 }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      {/* FOOTER */}
      {items.length > 0 && (
        <Box sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper' }}>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">Итого:</Typography>
              <Typography variant="h5" fontWeight="800" color="primary">
                {formatPrice(getCartTotal())} ₽
              </Typography>
            </Stack>

            {checkoutError && <Alert severity="error">{checkoutError}</Alert>}
            {successMessage && <Alert severity="success">{successMessage}</Alert>}
            
            <Button
              variant="contained"
              fullWidth
              size="large"
              sx={{ 
                py: 1.5, 
                borderRadius: '12px', 
                fontSize: '1rem',
                fontWeight: 700,
                boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.3)}`
              }}
              onClick={handleCheckout}
              disabled={isSubmitting}
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Оформить заказ'}
            </Button>
            
            <Button
              variant="text"
              color="inherit"
              fullWidth
              startIcon={<DeleteOutlineIcon />}
              onClick={onClearCart}
              sx={{ opacity: 0.6, fontSize: '0.8rem' }}
            >
              Очистить всё
            </Button>
          </Stack>
        </Box>
      )}
    </Drawer>
  );
};

export default CartDrawer;
