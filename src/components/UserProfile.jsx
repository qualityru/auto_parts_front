import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  CssBaseline,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
  ArrowBack,
  Logout,
  LocalShipping,
  Paid,
  Person,
  ReceiptLong,
  Search,
  ShoppingCart,
  Visibility,
} from '@mui/icons-material';

import Footer from './Footer';
import Header from './Header';
import { useCart } from '../hooks/useCart';
import { getOrders, getShopProfile, updateShopProfile } from '../utils/api';

const orderStatusLabels = {
  created: 'Создан',
  confirmed: 'Подтвержден',
  processing: 'В обработке',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменен',
};

function ProfileContent({ themeMode, setThemeMode }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    last_name: '',
    first_name: '',
    middle_name: '',
    phone: '',
    delivery_address: '',
  });
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    refreshCart,
  } = useCart();

  const activeOrders = useMemo(
    () => orders.filter((order) => !['delivered', 'cancelled'].includes(order.status)),
    [orders],
  );

  const totalSpent = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0),
    [orders],
  );

  const lastOrder = orders[0] || null;
  const selectedOrder = orders.find((order) => order.id === selectedOrderId) || lastOrder;
  const profileFullName = [
    profileForm.last_name,
    profileForm.first_name,
    profileForm.middle_name,
  ].filter(Boolean).join(' ') || 'Покупатель';
  const profileReady = Boolean(
    profileForm.last_name
    && profileForm.first_name
    && profileForm.phone
    && profileForm.delivery_address
  );

  useEffect(() => {
    async function loadOrders() {
      setIsLoading(true);
      setError('');
      try {
        const [ordersData, profileData] = await Promise.all([
          getOrders(),
          getShopProfile(),
        ]);
        setProfileForm({
          last_name: profileData?.last_name || '',
          first_name: profileData?.first_name || '',
          middle_name: profileData?.middle_name || '',
          phone: profileData?.phone || '',
          delivery_address: profileData?.delivery_address || '',
        });
        const data = ordersData;
        const list = Array.isArray(data) ? data : [];
        setOrders(list);
        setSelectedOrderId(list[0]?.id || null);
      } catch (err) {
        if (err.status === 401) {
          localStorage.removeItem('authToken');
          window.dispatchEvent(new Event('auth-changed'));
          navigate('/');
          return;
        }
        setError(err.message || 'Не удалось загрузить заказы');
      } finally {
        setIsLoading(false);
      }
    }

    loadOrders();
  }, [navigate]);

  const handleSearch = (query) => {
    const value = String(query || searchQuery || '').trim();
    if (!value) return;
    navigate(`/search?article=${encodeURIComponent(value)}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    window.dispatchEvent(new Event('auth-changed'));
    navigate('/');
  };

  const handleProfileChange = (field) => (event) => {
    setProfileMessage('');
    setProfileForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleProfileSave = async () => {
    setProfileMessage('');
    setIsProfileSaving(true);
    try {
      const saved = await updateShopProfile(profileForm);
      setProfileForm({
        last_name: saved?.last_name || '',
        first_name: saved?.first_name || '',
        middle_name: saved?.middle_name || '',
        phone: saved?.phone || '',
        delivery_address: saved?.delivery_address || '',
      });
      setProfileMessage('Данные профиля сохранены.');
    } catch (err) {
      setProfileMessage(err.message || 'Не удалось сохранить профиль.');
    } finally {
      setIsProfileSaving(false);
    }
  };

  const getStatusColor = (status) => {
    const map = {
      created: theme.palette.info.main,
      confirmed: theme.palette.primary.main,
      processing: theme.palette.warning.main,
      shipped: theme.palette.secondary.main,
      delivered: theme.palette.success.main,
      cancelled: theme.palette.error.main,
    };
    return map[status] || theme.palette.text.secondary;
  };

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearch}
        onHome={() => navigate('/')}
        themeMode={themeMode}
        onToggleTheme={() => setThemeMode((mode) => (mode === 'light' ? 'dark' : 'light'))}
        cartItems={cart}
        onRemoveItem={removeFromCart}
        onUpdateQuantity={updateQuantity}
        onClearCart={clearCart}
        getCartTotal={getCartTotal}
        onOrderCreated={refreshCart}
      />

      <Container maxWidth="xl" sx={{ mt: 3, flex: 1, pb: 6 }}>
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'center' }}
            spacing={1.5}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: 'background.paper' }}>
                <ArrowBack />
              </IconButton>
              <Box>
                <Typography variant="h5" fontWeight="800">
                  Личный кабинет
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Заказы, доставка и контактные данные
                </Typography>
              </Box>
            </Stack>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Logout />}
              onClick={handleLogout}
              sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, textTransform: 'none', fontWeight: 700 }}
            >
              Выйти
            </Button>
          </Stack>

          <Grid container spacing={2}>
            {[
              { label: 'Всего заказов', value: orders.length, icon: <ShoppingCart />, color: theme.palette.primary.main },
              { label: 'Активные', value: activeOrders.length, icon: <LocalShipping />, color: theme.palette.warning.main },
              { label: 'Сумма заказов', value: `${totalSpent.toLocaleString()} ₽`, icon: <Paid />, color: theme.palette.success.main },
            ].map((item) => (
              <Grid item xs={12} md={4} key={item.label}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ p: 1.1, borderRadius: 1.5, color: item.color, bgcolor: alpha(item.color, 0.1), display: 'flex' }}>
                      {item.icon}
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight="700">
                        {item.label}
                      </Typography>
                      <Typography variant="h6" fontWeight="800">
                        {item.value}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Paper
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: 'background.paper',
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, value) => setActiveTab(value)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ px: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}
            >
              <Tab icon={<ReceiptLong />} iconPosition="start" label="Заказы" value="orders" />
              <Tab icon={<Person />} iconPosition="start" label="Профиль" value="profile" />
              <Tab icon={<Search />} iconPosition="start" label="Поиск деталей" value="search" />
            </Tabs>

            <Box sx={{ p: { xs: 2, md: 2.5 } }}>
              {isLoading ? (
                <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 260 }}>
                  <CircularProgress />
                  <Typography sx={{ mt: 2 }} color="text.secondary">
                    Загружаем заказы
                  </Typography>
                </Stack>
              ) : (
                <>
                  {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                  {activeTab === 'orders' && (
                    <Grid container spacing={2.5}>
                      <Grid item xs={12} md={5}>
                        <Stack spacing={1.5}>
                          {orders.length === 0 ? (
                            <Paper
                              elevation={0}
                              sx={{ p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 2, textAlign: 'center' }}
                            >
                              <Typography fontWeight="700">Заказов пока нет</Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                Найдите запчасть по артикулу и оформите первый заказ.
                              </Typography>
                              <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate('/')}>
                                Перейти к поиску
                              </Button>
                            </Paper>
                          ) : (
                            orders.map((order) => {
                              const active = selectedOrder?.id === order.id;
                              const statusColor = getStatusColor(order.status);
                              return (
                                <Card
                                  key={order.id}
                                  variant="outlined"
                                  onClick={() => setSelectedOrderId(order.id)}
                                  sx={{
                                    borderRadius: 2,
                                    cursor: 'pointer',
                                    borderColor: active ? 'primary.main' : 'divider',
                                    bgcolor: active ? alpha(theme.palette.primary.main, 0.04) : 'background.paper',
                                  }}
                                >
                                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                    <Stack direction="row" justifyContent="space-between" spacing={1.5}>
                                      <Box>
                                        <Typography fontWeight="800">Заказ #{order.id}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {new Date(order.created_at).toLocaleDateString('ru-RU')}
                                        </Typography>
                                      </Box>
                                      <Chip
                                        size="small"
                                        label={orderStatusLabels[order.status] || order.status}
                                        sx={{ color: statusColor, bgcolor: alpha(statusColor, 0.1), fontWeight: 800 }}
                                      />
                                    </Stack>
                                    <Divider sx={{ my: 1.25 }} />
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                      <Typography variant="body2" color="text.secondary">
                                        {(Array.isArray(order.items) ? order.items.length : 0)} поз.
                                      </Typography>
                                      <Typography fontWeight="800">
                                        {Number(order.total_amount || 0).toLocaleString()} ₽
                                      </Typography>
                                    </Stack>
                                  </CardContent>
                                </Card>
                              );
                            })
                          )}
                        </Stack>
                      </Grid>

                      <Grid item xs={12} md={7}>
                        <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, minHeight: 360 }}>
                          {selectedOrder ? (
                            <Stack spacing={2}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                                <Box>
                                  <Typography variant="h6" fontWeight="800">Заказ #{selectedOrder.id}</Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {new Date(selectedOrder.created_at).toLocaleString('ru-RU')}
                                  </Typography>
                                </Box>
                                <Chip
                                  icon={<Visibility />}
                                  label={orderStatusLabels[selectedOrder.status] || selectedOrder.status}
                                  sx={{
                                    color: getStatusColor(selectedOrder.status),
                                    bgcolor: alpha(getStatusColor(selectedOrder.status), 0.1),
                                    fontWeight: 800,
                                  }}
                                />
                              </Stack>

                              <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                                <TextField label="Получатель" value={selectedOrder.customer_name || ''} size="small" InputProps={{ readOnly: true }} />
                                <TextField label="Телефон" value={selectedOrder.customer_phone || ''} size="small" InputProps={{ readOnly: true }} />
                                <TextField
                                  label="Адрес доставки"
                                  value={selectedOrder.delivery_address || ''}
                                  size="small"
                                  InputProps={{ readOnly: true }}
                                  sx={{ gridColumn: { xs: 'auto', sm: '1 / -1' } }}
                                />
                              </Box>

                              {selectedOrder.comment && (
                                <Alert severity="info">{selectedOrder.comment}</Alert>
                              )}

                              <Divider />
                              <Stack spacing={1.2}>
                                {(Array.isArray(selectedOrder.items) ? selectedOrder.items : []).map((item) => (
                                  <Stack
                                    key={item.id}
                                    direction={{ xs: 'column', sm: 'row' }}
                                    justifyContent="space-between"
                                    spacing={1}
                                    sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
                                  >
                                    <Box>
                                      <Typography fontWeight="800">{item.brand} {item.article}</Typography>
                                      <Typography variant="body2" color="text.secondary">{item.name}</Typography>
                                      {item.warehouse_name && (
                                        <Typography variant="caption" color="text.secondary">{item.warehouse_name}</Typography>
                                      )}
                                    </Box>
                                    <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                                      <Typography fontWeight="800">
                                        {(Number(item.price || 0) * Number(item.quantity || 0)).toLocaleString()} ₽
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {item.quantity} x {Number(item.price || 0).toLocaleString()} ₽
                                      </Typography>
                                    </Box>
                                  </Stack>
                                ))}
                              </Stack>

                              <Stack direction="row" justifyContent="space-between" sx={{ pt: 1 }}>
                                <Typography variant="h6" fontWeight="800">Итого</Typography>
                                <Typography variant="h6" fontWeight="900" color="primary">
                                  {Number(selectedOrder.total_amount || 0).toLocaleString()} ₽
                                </Typography>
                              </Stack>
                            </Stack>
                          ) : (
                            <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 320 }}>
                              <ReceiptLong sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
                              <Typography color="text.secondary">Выберите заказ из списка</Typography>
                            </Stack>
                          )}
                        </Paper>
                      </Grid>
                    </Grid>
                  )}

                  {activeTab === 'profile' && (
                    <Grid container spacing={2.5}>
                      <Grid item xs={12} md={7}>
                        <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1} mb={2}>
                            <Box>
                              <Typography variant="h6" fontWeight="800">Контактные данные</Typography>
                              <Typography variant="body2" color="text.secondary">
                                Эти данные используются при оформлении заказа из корзины.
                              </Typography>
                            </Box>
                            <Chip
                              label={profileReady ? 'Готово к заказу' : 'Нужно заполнить'}
                              color={profileReady ? 'success' : 'warning'}
                              variant="outlined"
                              sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, fontWeight: 800 }}
                            />
                          </Stack>
                          {profileMessage && (
                            <Alert
                              severity={profileMessage.includes('сохран') ? 'success' : 'error'}
                              sx={{ mb: 2 }}
                            >
                              {profileMessage}
                            </Alert>
                          )}
                          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                            <TextField
                              label="Фамилия"
                              value={profileForm.last_name}
                              onChange={handleProfileChange('last_name')}
                              size="small"
                              required
                            />
                            <TextField
                              label="Имя"
                              value={profileForm.first_name}
                              onChange={handleProfileChange('first_name')}
                              size="small"
                              required
                            />
                            <TextField
                              label="Отчество"
                              value={profileForm.middle_name}
                              onChange={handleProfileChange('middle_name')}
                              size="small"
                            />
                            <TextField
                              label="Телефон"
                              value={profileForm.phone}
                              onChange={handleProfileChange('phone')}
                              size="small"
                              required
                            />
                            <TextField
                              label="Адрес доставки"
                              value={profileForm.delivery_address}
                              onChange={handleProfileChange('delivery_address')}
                              size="small"
                              required
                              sx={{ gridColumn: { xs: 'auto', sm: '1 / -1' } }}
                            />
                          </Box>
                          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
                            <Button
                              variant="contained"
                              onClick={handleProfileSave}
                              disabled={isProfileSaving}
                              sx={{ minWidth: 160 }}
                            >
                              {isProfileSaving ? <CircularProgress color="inherit" size={22} /> : 'Сохранить'}
                            </Button>
                          </Stack>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={5}>
                        <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                          <Typography variant="h6" fontWeight="800" mb={1}>Проверка перед заказом</Typography>
                          <Stack spacing={1.2}>
                            {[
                              { label: 'ФИО', ok: Boolean(profileForm.last_name && profileForm.first_name), value: profileFullName },
                              { label: 'Телефон', ok: Boolean(profileForm.phone), value: profileForm.phone || 'не указан' },
                              { label: 'Адрес доставки', ok: Boolean(profileForm.delivery_address), value: profileForm.delivery_address || 'не указан' },
                            ].map((item) => (
                              <Box key={item.label} sx={{ p: 1.4, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                                <Stack direction="row" justifyContent="space-between" spacing={1}>
                                  <Typography variant="body2" fontWeight="800">{item.label}</Typography>
                                  <Chip size="small" label={item.ok ? 'ок' : 'нет'} color={item.ok ? 'success' : 'warning'} />
                                </Stack>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                  {item.value}
                                </Typography>
                              </Box>
                            ))}
                            <Divider />
                            <Typography variant="body2" color="text.secondary">
                              Если все пункты заполнены, заказ можно оформить из корзины без дополнительных полей.
                            </Typography>
                          </Stack>
                        </Paper>
                        <Paper elevation={0} sx={{ mt: 2, p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                          <Typography variant="h6" fontWeight="800" mb={1}>Активные заказы</Typography>
                          <Stack spacing={1}>
                            {activeOrders.length > 0 ? activeOrders.map((order) => (
                              <Stack key={order.id} direction="row" justifyContent="space-between">
                                <Typography variant="body2">Заказ #{order.id}</Typography>
                                <Typography variant="body2" fontWeight="700" color="primary">
                                  {orderStatusLabels[order.status] || order.status}
                                </Typography>
                              </Stack>
                            )) : (
                              <Typography variant="body2" color="text.secondary">Активных заказов нет</Typography>
                            )}
                          </Stack>
                        </Paper>
                      </Grid>
                    </Grid>
                  )}

                  {activeTab === 'search' && (
                    <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                      <Typography variant="h6" fontWeight="800" mb={2}>Поиск запчастей</Typography>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                        <TextField
                          value={searchQuery}
                          onChange={(event) => setSearchQuery(event.target.value)}
                          label="Артикул, VIN или госномер"
                          size="small"
                          fullWidth
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') handleSearch();
                          }}
                        />
                        <Button variant="contained" startIcon={<Search />} onClick={() => handleSearch()} sx={{ minWidth: 140 }}>
                          Найти
                        </Button>
                      </Stack>
                    </Paper>
                  )}
                </>
              )}
            </Box>
          </Paper>
        </Stack>
      </Container>

      <Footer />
    </Box>
  );
}

function UserProfile() {
  const [themeMode, setThemeMode] = useState('light');
  const theme = useMemo(() => createTheme({
    palette: {
      mode: themeMode,
      primary: { main: '#005387' },
      background: { default: themeMode === 'light' ? '#f4f7f9' : '#0a1016' },
    },
    typography: { fontFamily: '"Inter", sans-serif' },
    shape: { borderRadius: 12 },
  }), [themeMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ProfileContent themeMode={themeMode} setThemeMode={setThemeMode} />
    </ThemeProvider>
  );
}

export default UserProfile;
