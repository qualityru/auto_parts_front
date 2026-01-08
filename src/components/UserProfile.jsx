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
  TextField,
} from '@mui/material'
import {
  ArrowBack,
  Logout,
  AccountCircle,
  ShoppingCart,
  Paid,
  AccessTime,
  Favorite,
  ShoppingBag,
  History,
  Notifications,
  Settings,
  Edit,
  Save,
  Cancel,
  Key,
  MobileFriendly,
  Delete,
  Visibility,
  Replay,
  CancelPresentation
} from '@mui/icons-material'

function UserProfile() {
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)
  const [recentSearches, setRecentSearches] = useState([])
  const [favorites, setFavorites] = useState([])
  const [orderHistory, setOrderHistory] = useState([])
  const [notifications, setNotifications] = useState([])
  const [editingProfile, setEditingProfile] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    city: '',
  })

  // Загрузка данных пользователя
  useEffect(() => {
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

      const mockRecentSearches = [
        { id: 1, query: 'фильтр масляный', date: '2026-01-10', count: 5 },
        { id: 2, query: 'тормозные колодки', date: '2026-01-08', count: 3 },
        { id: 3, query: 'аккумулятор', date: '2026-01-05', count: 8 },
        { id: 4, query: 'амортизаторы', date: '2026-01-02', count: 2 },
      ]

      const mockFavorites = [
        {
          id: 1,
          productId: 'ABC123',
          name: 'Масляный фильтр Mann W 914/2',
          brand: 'Mann',
          image: 'https://via.placeholder.com/80x80/667eea/ffffff?text=M',
          price: 850,
          currency: '₽',
          addedDate: '2026-01-10',
        },
        {
          id: 2,
          productId: 'DEF456',
          name: 'Тормозные колодки Brembo P 85 049',
          brand: 'Brembo',
          image: 'https://via.placeholder.com/80x80/764ba2/ffffff?text=B',
          price: 3200,
          currency: '₽',
          addedDate: '2026-01-08',
        },
      ]

      const mockOrderHistory = [
        { id: 'ORD-2026-001', date: '2026-01-12', status: 'delivered', total: 12450, items: 3, deliveryDate: '2026-01-15' },
        { id: 'ORD-2026-002', date: '2026-01-05', status: 'processing', total: 8450, items: 2, deliveryDate: '2026-01-20' },
        { id: 'ORD-2025-045', date: '2025-12-20', status: 'delivered', total: 25600, items: 5, deliveryDate: '2025-12-23' },
      ]

      const mockNotifications = [
        { id: 1, type: 'price_drop', title: 'Снижение цены', message: 'Цена на Масляный фильтр Mann снизилась на 15%', date: '2026-01-12', read: false },
        { id: 2, type: 'delivery', title: 'Заказ отправлен', message: 'Заказ ORD-2026-002 отправлен в доставку', date: '2026-01-10', read: true },
        { id: 3, type: 'stock', title: 'Появился в наличии', message: 'Аккумулятор Bosch S4 005 появился в наличии', date: '2026-01-08', read: true },
      ]

      setUserData(mockUserData)
      setFormData({
        name: mockUserData.name,
        email: mockUserData.email,
        phone: mockUserData.phone,
        company: mockUserData.company,
        city: mockUserData.city,
      })
      setRecentSearches(mockRecentSearches)
      setFavorites(mockFavorites)
      setOrderHistory(mockOrderHistory)
      setNotifications(mockNotifications)
      setIsLoading(false)
    }, 800)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    navigate('/')
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'success.main'
      case 'processing':
        return 'warning.main'
      case 'pending':
        return 'info.main'
      case 'cancelled':
        return 'error.main'
      default:
        return 'text.secondary'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'delivered':
        return 'Доставлен'
      case 'processing':
        return 'В обработке'
      case 'pending':
        return 'Ожидает'
      case 'cancelled':
        return 'Отменен'
      default:
        return status
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
      {/* Header Controls */}
      <Stack direction="row" justifyContent="space-between" mb={2}>
        <IconButton onClick={() => navigate('/')}>
          <ArrowBack />
        </IconButton>
        <IconButton onClick={handleLogout}>
          <Logout />
        </IconButton>
      </Stack>

      {/* Profile Header */}
      <Stack direction="row" spacing={2} alignItems="center" mb={3}>
        <AccountCircle sx={{ fontSize: 50 }} />
        <Box>
          <Typography variant="h4">Личный кабинет</Typography>
          <Typography color="text.secondary">Управление профилем, заказами и настройками</Typography>
        </Box>
      </Stack>

      <Grid container spacing={3}>
        {/* Sidebar */}
        <Grid item xs={12} md={3}>
          <Stack spacing={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar src={userData.avatar} sx={{ width: 80, height: 80, mx: 'auto' }} />
                <Typography variant="h6" mt={1}>{userData.name}</Typography>
                <Typography variant="body2">{userData.email}</Typography>
                <Typography variant="body2">{userData.company}</Typography>
                <Typography variant="body2">
                  С {new Date(userData.registrationDate).toLocaleDateString('ru-RU')}
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Stack alignItems="center">
                      <ShoppingCart />
                      <Typography>{userData.stats.totalOrders}</Typography>
                      <Typography variant="caption">Всего заказов</Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={6}>
                    <Stack alignItems="center">
                      <Paid />
                      <Typography>{userData.stats.totalSpent.toLocaleString('ru-RU')}₽</Typography>
                      <Typography variant="caption">Всего потрачено</Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={6}>
                    <Stack alignItems="center">
                      <AccessTime />
                      <Typography>{userData.stats.activeOrders}</Typography>
                      <Typography variant="caption">Активные заказы</Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={6}>
                    <Stack alignItems="center">
                      <Favorite />
                      <Typography>{userData.stats.savedItems}</Typography>
                      <Typography variant="caption">Избранное</Typography>
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Tabs
              orientation="vertical"
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ borderRight: 1, borderColor: 'divider' }}
            >
              <Tab label="Профиль" />
              <Tab label="Мои заказы" />
              <Tab label="Избранное" />
              <Tab label="История поиска" />
              <Tab label="Уведомления" />
              <Tab label="Настройки" />
            </Tabs>
          </Stack>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={9}>
          {activeTab === 0 && (
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="h6">Информация профиля</Typography>
                  {!editingProfile ? (
                    <Button startIcon={<Edit />} onClick={() => setEditingProfile(true)}>Редактировать</Button>
                  ) : (
                    <Stack direction="row" spacing={1}>
                      <Button startIcon={<Save />} variant="contained" onClick={() => { setEditingProfile(false); alert('Сохранено') }}>Сохранить</Button>
                      <Button startIcon={<Cancel />} variant="outlined" onClick={() => setEditingProfile(false)}>Отмена</Button>
                    </Stack>
                  )}
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Stack spacing={2}>
                  <TextField
                    label="ФИО"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    disabled={!editingProfile}
                  />
                  <TextField
                    label="Email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    disabled={!editingProfile}
                  />
                  <TextField
                    label="Телефон"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!editingProfile}
                  />
                  <TextField
                    label="Компания"
                    value={formData.company}
                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                    disabled={!editingProfile}
                  />
                  <TextField
                    label="Город"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    disabled={!editingProfile}
                  />
                </Stack>
              </CardContent>
            </Card>
          )}

          {activeTab === 1 && (
            <Stack spacing={2}>
              {orderHistory.map(order => (
                <Card key={order.id}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography><strong>Заказ #{order.id}</strong></Typography>
                      <Chip label={getStatusText(order.status)} sx={{ color: getStatusColor(order.status) }} />
                    </Stack>
                    <Stack direction="row" spacing={2} mt={1}>
                      <Typography>{order.items} товаров</Typography>
                      <Typography>{order.total.toLocaleString('ru-RU')} ₽</Typography>
                      <Typography>Доставка: {new Date(order.deliveryDate).toLocaleDateString('ru-RU')}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} mt={1}>
                      <Button startIcon={<Visibility />} size="small">Детали</Button>
                      <Button startIcon={<Replay />} size="small">Повторить</Button>
                      {order.status === 'processing' && <Button startIcon={<CancelPresentation />} size="small" color="error">Отменить</Button>}
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
