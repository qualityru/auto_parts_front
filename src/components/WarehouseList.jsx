import {
  Box,
  Stack,
  Typography,
  Button,
  IconButton,
  Chip,
  Divider,
} from '@mui/material'

import WarehouseIcon from '@mui/icons-material/Warehouse'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import ScheduleIcon from '@mui/icons-material/Schedule'
import EventIcon from '@mui/icons-material/Event'
import UndoIcon from '@mui/icons-material/Undo'
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart'
import CheckIcon from '@mui/icons-material/Check'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'

import { formatPrice } from '../utils/formatters'

function WarehouseList({
  product,
  warehouses,
  isExpanded,
  onToggleWarehouses,
  onAddToCart,
  isItemInCart,
}) {
  const visibleWarehouses = isExpanded
    ? warehouses
    : warehouses.slice(0, 2)

  return (
    <Box>
      {/* TITLE */}
      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
        <WarehouseIcon color="action" />
        <Typography variant="subtitle1" fontWeight={600}>
          Наличие на складах ({warehouses.length})
        </Typography>
      </Stack>

      <Stack spacing={1.5}>
        {visibleWarehouses.map((warehouse, idx) => {
          const isInCart = isItemInCart(product.id, warehouse.id)

          return (
            <Box
              key={idx}
              sx={{
                p: 1.5,
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
              >
                {/* LEFT */}
                <Stack spacing={0.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle2">
                      {warehouse.name || 'Основной склад'}
                    </Typography>

                    {warehouse.supplier_info?.original_data?.fail_percent && (
                      <Chip
                        size="small"
                        color="warning"
                        icon={<WarningAmberIcon />}
                        label={`${warehouse.supplier_info.original_data.fail_percent}%`}
                      />
                    )}
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Inventory2Icon fontSize="small" />
                      <Typography variant="caption">
                        {warehouse.quantity || 0} шт.
                      </Typography>
                    </Stack>

                    {warehouse.delivery_days && (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <ScheduleIcon fontSize="small" />
                        <Typography variant="caption">
                          {warehouse.delivery_days} дн.
                        </Typography>
                      </Stack>
                    )}
                  </Stack>

                  {warehouse.delivery_date_start && (
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <EventIcon fontSize="small" />
                      <Typography variant="caption">
                        {warehouse.delivery_date_start}
                      </Typography>
                    </Stack>
                  )}

                  {warehouse.supplier_info?.original_data?.return_type?.name && (
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <UndoIcon fontSize="small" />
                      <Typography variant="caption">
                        {warehouse.supplier_info.original_data.return_type.name}
                      </Typography>
                    </Stack>
                  )}
                </Stack>

                {/* RIGHT */}
                <Stack alignItems="flex-end" spacing={0.5}>
                  <Stack direction="row" spacing={0.5} alignItems="baseline">
                    <Typography variant="subtitle1" fontWeight={600}>
                      {formatPrice(warehouse.price || 0)}
                    </Typography>
                    <Typography variant="caption">
                      {warehouse.currency || 'RUB'}
                    </Typography>

                    <IconButton
                      size="small"
                      color={isInCart ? 'success' : 'primary'}
                      disabled={isInCart}
                      onClick={() => onAddToCart(product, warehouse)}
                    >
                      {isInCart ? <CheckIcon /> : <AddShoppingCartIcon />}
                    </IconButton>
                  </Stack>

                  <Typography variant="caption" color="text.secondary">
                    {warehouse.quantity || 0} шт.
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          )
        })}

        {/* TOGGLE */}
        {warehouses.length > 2 && (
          <>
            <Divider />
            <Button
              size="small"
              startIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={onToggleWarehouses}
            >
              {isExpanded
                ? 'Скрыть'
                : `Показать ещё ${warehouses.length - 2} складов`}
            </Button>
          </>
        )}
      </Stack>
    </Box>
  )
}

export default WarehouseList
