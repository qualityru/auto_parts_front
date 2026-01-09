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
  alpha
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import { formatPrice } from '../utils/formatters';

const CartDrawer = ({ 
  open, 
  onClose, 
  cartItems, 
  onRemoveItem, 
  onUpdateQuantity, 
  onClearCart, 
  getCartTotal 
}) => {
  const theme = useTheme();

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
            badgeContent={cartItems.length} 
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
        {cartItems.length === 0 ? (
          <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', opacity: 0.6 }}>
            <ShoppingBagOutlinedIcon sx={{ fontSize: 80, mb: 2 }} />
            <Typography variant="h6">Ваша корзина пуста</Typography>
            <Button onClick={onClose} sx={{ mt: 2 }}>Вернуться к покупкам</Button>
          </Stack>
        ) : (
          <Stack spacing={3}>
            {cartItems.map((item) => (
              <Box 
                key={`${item.productId}-${item.warehouseId}`}
                sx={{ 
                  display: 'flex', 
                  gap: 2,
                  transition: '0.3s',
                  '&:hover': { transform: 'translateX(-4px)' }
                }}
              >
                <Avatar
                  src={item.image}
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
                        onClick={() => onUpdateQuantity(item.productId, item.warehouseId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <RemoveIcon fontSize="inherit" />
                      </IconButton>
                      <Typography variant="body2" sx={{ mx: 1, fontWeight: 600 }}>
                        {item.quantity}
                      </Typography>
                      <IconButton 
                        size="small"
                        onClick={() => onUpdateQuantity(item.productId, item.warehouseId, item.quantity + 1)}
                      >
                        <AddIcon fontSize="inherit" />
                      </IconButton>
                    </Stack>
                    
                    <Typography variant="subtitle1" fontWeight="700">
                      {formatPrice(item.price * item.quantity)} ₽
                    </Typography>
                  </Stack>
                </Box>
                
                <IconButton 
                  color="error" 
                  size="small" 
                  onClick={() => onRemoveItem(item.productId, item.warehouseId)}
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
      {cartItems.length > 0 && (
        <Box sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper' }}>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">Итого:</Typography>
              <Typography variant="h5" fontWeight="800" color="primary">
                {formatPrice(getCartTotal())} ₽
              </Typography>
            </Stack>
            
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
              onClick={() => alert('Переход к оформлению...')}
            >
              Оформить заказ
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