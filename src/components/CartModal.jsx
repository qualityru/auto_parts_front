import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  Typography,
  Stack,
  Button,
  Divider,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import WarehouseIcon from '@mui/icons-material/Store' // Можно заменить иконкой склада
import { formatPrice } from '../utils/formatters'

function CartModal({ cartItems, onClose, onRemoveItem, onClearCart, getCartTotal }) {
  const handleRemoveItem = (productId, warehouseId) => {
    onRemoveItem?.(productId, warehouseId)
  }

  const handleClearCart = () => {
    if (window.confirm('Вы уверены, что хотите очистить корзину?')) {
      onClearCart?.()
    }
  }

  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
      {/* HEADER */}
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
        <Typography variant="h6">Корзина</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* BODY */}
      <DialogContent dividers>
        {cartItems.length === 0 ? (
          <Box textAlign="center" py={4}>
            <ShoppingCartIcon sx={{ fontSize: 48, color: 'grey.500' }} />
            <Typography variant="h6" mt={1}>Корзина пуста</Typography>
            <Typography variant="body2" color="text.secondary">Добавьте товары из каталога</Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {cartItems.map((item) => (
              <Box key={`${item.productId}-${item.warehouseId}`} display="flex" gap={2} alignItems="flex-start">
                {/* IMAGE */}
                <Box flexShrink={0} width={80} height={80} display="flex" alignItems="center" justifyContent="center" bgcolor="grey.100" borderRadius={1} overflow="hidden">
                  {item.image ? (
                    <Box component="img" src={item.image} alt={item.name} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <Box display="flex" alignItems="center" justifyContent="center" width="100%" height="100%">
                      <ShoppingCartIcon sx={{ fontSize: 36, color: 'grey.400' }} />
                    </Box>
                  )}
                </Box>

                {/* INFO */}
                <Box flexGrow={1}>
                  <Typography variant="subtitle2">{item.brand || ''}</Typography>
                  <Typography variant="body1">{item.name || ''}</Typography>
                  <Typography variant="body2" color="text.secondary">Артикул: {item.article || '—'}</Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5} mt={0.5}>
                    <WarehouseIcon fontSize="small" />
                    <Typography variant="body2">{item.warehouseName || '—'}</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mt={1}>
                    <Typography variant="body2">
                      {formatPrice(item.price * item.quantity)} ₽ × {item.quantity}
                    </Typography>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleRemoveItem(item.productId, item.warehouseId)}
                    >
                      Удалить
                    </Button>
                  </Stack>
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>

      {/* FOOTER */}
      {cartItems.length > 0 && (
        <DialogActions sx={{ flexDirection: 'column', alignItems: 'stretch', gap: 1, p: 2 }}>
          <Divider />
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1">Общая сумма:</Typography>
            <Typography variant="h6">{formatPrice(getCartTotal())} ₽</Typography>
          </Stack>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleClearCart}
          >
            Очистить корзину
          </Button>
        </DialogActions>
      )}
    </Dialog>
  )
}

export default CartModal
