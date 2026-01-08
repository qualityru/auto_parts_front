import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Grid,
  Stack,
  Typography,
  Avatar,
  Button,
  Tabs,
  Tab,
  Card,
  CardContent,
  Divider,
  IconButton,
  CircularProgress,
  Chip,
  TextField, // Исправлено: импорт из material, а не из icons
} from '@mui/material'

import {
  ArrowBack,
  Logout,
  AccountCircle,
  ShoppingCart,
  Paid,
  Edit,
  Save,
  Cancel,
  Visibility,
  Replay,
} from '@mui/icons-material'

function UserProfile() {
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)
  
  // Состояния для данных (используются в соответствующих вкладках)
  const [orderHistory, setOrderHistory] = useState([])
  const [editingProfile, setEditingProfile] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    city: '',
  })

  useEffect(() => {
    // Имитация загрузки данных
    setTimeout(() => {
      const mockUserData = {
        id: 1,
        name: 'Иван Петров',
        email: 'ivan.petrov@example.com',
        phone: '+7 (999) 123-45-67',
        company: 'АвтоСервис "Мотор"',
        city: 'Москва',
        registrationDate: '2024-01-15',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user123',
        stats: { totalOrders: 24, totalSpent: 156800, activeOrders: 3, savedItems: 12 },
      }

      const mockOrderHistory = [
        { id: 'ORD-2026-001', date: '2026-01-12', status: 'delivered', total: 12450, items: 3, deliveryDate: '2026-01-15' },
        { id: 'ORD-2026-002', date: '2026-01-05', status: 'processing', total: 8450, items: 2, deliveryDate: '2026-01-20' },
        { id: 'ORD-2025-045', date: '2025-12-20', status: 'delivered', total: 25600, items: 5, deliveryDate: '2025-12-23' },
      ]

      setUserData(mockUserData)
      setFormData({
        name: mockUserData.name,
        email: mockUserData.email,
        phone: mockUserData.phone,
        company: mockUserData.company,
        city: mockUserData.city,
      })
      setOrderHistory(mockOrderHistory)
      setIsLoading(false)
    }, 800)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    navigate('/')
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'success.main'
      case 'processing': return 'warning.main'
      case 'cancelled': return 'error.main'
      default: return 'text.secondary'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'delivered': return 'Доставлен'
      case 'processing': return 'В обработке'
      case 'cancelled': return 'Отменен'
      default: return status
    }
  }

  if (isLoading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ mt: 10 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Загрузка данных...</Typography>
      </Stack>
    )
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Кнопки навигации */}
      <Stack direction="row" justifyContent="space-between" mb={2}>
        <IconButton onClick={() => navigate('/')}><ArrowBack /></IconButton>
        <IconButton onClick={handleLogout}><Logout /></IconButton>
      </Stack>

      {/* Заголовок профиля */}
      <Stack direction="row" spacing={2} alignItems="center" mb={3}>
        <AccountCircle sx={{ fontSize: 50, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4">Личный кабинет</Typography>
          <Typography color="text.secondary">Управление профилем и заказами</Typography>
        </Box>
      </Stack>

      <Grid container spacing={3}>
        {/* Боковая панель */}
        <Grid item xs={12} md={3}>
          <Stack spacing={2}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar src={userData.avatar} sx={{ width: 80, height: 80, mx: 'auto', mb: 1 }} />
                <Typography variant="h6">{userData.name}</Typography>
                <Typography variant="body2" color="text.secondary">{userData.email}</Typography>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Stack alignItems="center">
                      <ShoppingCart fontSize="small" color="action" />
                      <Typography variant="body2" fontWeight="bold">{userData.stats.totalOrders}</Typography>
                      <Typography variant="caption">Заказов</Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={6}>
                    <Stack alignItems="center">
                      <Paid fontSize="small" color="action" />
                      <Typography variant="body2" fontWeight="bold">{userData.stats.totalSpent.toLocaleString()}₽</Typography>
                      <Typography variant="caption">Сумма</Typography>
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Tabs
              orientation="vertical"
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ borderRight: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
            >
              <Tab label="Профиль" />
              <Tab label="Заказы" />
            </Tabs>
          </Stack>
        </Grid>

        {/* Основной контент */}
        <Grid item xs={12} md={9}>
          {activeTab === 0 && (
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Данные профиля</Typography>
                  {!editingProfile ? (
                    <Button startIcon={<Edit />} onClick={() => setEditingProfile(true)}>Изменить</Button>
                  ) : (
                    <Stack direction="row" spacing={1}>
                      <Button startIcon={<Save />} variant="contained" onClick={() => setEditingProfile(false)}>Сохранить</Button>
                      <Button startIcon={<Cancel />} variant="outlined" onClick={() => setEditingProfile(false)}>Отмена</Button>
                    </Stack>
                  )}
                </Stack>
                
                <Divider sx={{ mb: 3 }} />

                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="ФИО"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    disabled={!editingProfile}
                  />
                  <TextField
                    fullWidth
                    label="Email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    disabled={!editingProfile}
                  />
                  <TextField
                    fullWidth
                    label="Телефон"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!editingProfile}
                  />
                </Stack>
              </CardContent>
            </Card>
          )}

          {activeTab === 1 && (
            <Stack spacing={2}>
              {orderHistory.map(order => (
                <Card key={order.id} variant="outlined">
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" mb={1}>
                      <Typography fontWeight="bold">Заказ #{order.id}</Typography>
                      <Chip 
                        label={getStatusText(order.status)} 
                        size="small" 
                        sx={{ bgcolor: 'transparent', border: '1px solid', borderColor: getStatusColor(order.status), color: getStatusColor(order.status) }} 
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {order.items} товаров на сумму {order.total.toLocaleString()} ₽
                    </Typography>
                    <Divider sx={{ my: 1.5 }} />
                    <Stack direction="row" spacing={1}>
                      <Button startIcon={<Visibility />} size="small">Детали</Button>
                      <Button startIcon={<Replay />} size="small" variant="text">Повторить</Button>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Grid>
      </Grid>
    </Box>
  )
}

export default UserProfile