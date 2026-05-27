import { useCallback, useEffect, useMemo, useState } from 'react';
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
  IconButton,
  LinearProgress,
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
  CheckCircle,
  Inventory2,
  LocalShipping,
  Logout,
  Paid,
  Person,
  ReceiptLong,
  Refresh,
  ShoppingCart,
  Visibility,
  WarningAmber,
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

const emptyProfile = {
  last_name: '',
  first_name: '',
  middle_name: '',
  phone: '',
  delivery_address: '',
};

const firstText = (...values) => values.find((value) => (
  typeof value === 'string' && value.trim()
))?.trim() || '';

const firstValue = (...values) => {
  const value = values.find((item) => item !== undefined && item !== null && String(item).trim());
  return value === undefined || value === null ? '' : String(value).trim();
};

const getSupplierName = (item) => {
  const warehouse = item?.warehouse_snapshot || {};
  const product = item?.product_snapshot || {};
  const supplierInfo = warehouse.supplier_info || product.supplier_info || {};
  const original = supplierInfo.original_data || warehouse.original_data || {};

  return firstText(
    item?.supplier_name,
    supplierInfo.name,
    supplierInfo.title,
    original.supplier_name,
    original.supplier,
    original.provider,
    warehouse.supplier_name,
    warehouse.supplier,
    warehouse.provider,
    product.supplier_name,
    product.supplier,
    item?.warehouse_name,
  ) || 'Поставщик не указан';
};

const getSupplierArticle = (item) => {
  const warehouse = item?.warehouse_snapshot || {};
  const product = item?.product_snapshot || {};
  const supplierInfo = warehouse.supplier_info || product.supplier_info || {};
  const original = supplierInfo.original_data || warehouse.original_data || {};

  return firstValue(
    item?.supplier_article,
    item?.supplier_code,
    original.supplier_article,
    original.article,
    original.ARTICLE,
    original.art,
    original.code,
    original.PIN,
    supplierInfo.article,
    supplierInfo.code,
    warehouse.supplier_article,
    warehouse.article,
    warehouse.code,
    product.supplier_article,
    product.article,
    item?.article,
  );
};

const getItemImage = (item) => {
  const product = item?.product_snapshot || {};
  const images = Array.isArray(product.images) ? product.images : [];
  return firstText(item?.image, product.image, images[0]);
};

function ProfileContent({ themeMode, setThemeMode }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [profileForm, setProfileForm] = useState(emptyProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileDirty, setProfileDirty] = useState(false);
  const [error, setError] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    refreshCart,
  } = useCart();

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || orders[0] || null,
    [orders, selectedOrderId],
  );

  const activeOrders = useMemo(
    () => orders.filter((order) => !['delivered', 'cancelled'].includes(order.status)),
    [orders],
  );

  const totalSpent = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0),
    [orders],
  );

  const profileChecks = useMemo(() => ([
    {
      label: 'ФИО',
      ok: Boolean(profileForm.last_name && profileForm.first_name),
      value: [profileForm.last_name, profileForm.first_name, profileForm.middle_name].filter(Boolean).join(' ') || 'не указано',
    },
    { label: 'Телефон', ok: Boolean(profileForm.phone), value: profileForm.phone || 'не указан' },
    { label: 'Адрес доставки', ok: Boolean(profileForm.delivery_address), value: profileForm.delivery_address || 'не указан' },
  ]), [profileForm]);

  const profileReadyCount = profileChecks.filter((item) => item.ok).length;
  const profileReady = profileReadyCount === profileChecks.length;
  const profileProgress = Math.round((profileReadyCount / profileChecks.length) * 100);

  const getStatusColor = useCallback((status) => {
    const map = {
      created: theme.palette.info.main,
      confirmed: theme.palette.primary.main,
      processing: theme.palette.warning.main,
      shipped: theme.palette.secondary.main,
      delivered: theme.palette.success.main,
      cancelled: theme.palette.error.main,
    };
    return map[status] || theme.palette.text.secondary;
  }, [theme]);

  const loadData = useCallback(async ({ silent = false, forceProfile = false } = {}) => {
    if (!silent) setIsLoading(true);
    setIsSyncing(true);
    setError('');
    try {
      const [ordersData, profileData] = await Promise.all([
        getOrders(),
        getShopProfile(),
      ]);
      const list = Array.isArray(ordersData) ? ordersData : [];
      setOrders(list);
      setSelectedOrderId((current) => (
        current && list.some((order) => order.id === current)
          ? current
          : list[0]?.id || null
      ));
      if (forceProfile || !profileDirty) {
        setProfileForm({
          last_name: profileData?.last_name || '',
          first_name: profileData?.first_name || '',
          middle_name: profileData?.middle_name || '',
          phone: profileData?.phone || '',
          delivery_address: profileData?.delivery_address || '',
        });
      }
      setLastSyncAt(new Date());
    } catch (err) {
      if (err.status === 401) {
        localStorage.removeItem('authToken');
        window.dispatchEvent(new Event('auth-changed'));
        navigate('/');
        return;
      }
      setError(err.message || 'Не удалось обновить данные кабинета');
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, [navigate, profileDirty]);

  useEffect(() => {
    loadData({ forceProfile: true });
  }, [loadData]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadData({ silent: true });
    }, 10000);

    const handleFocus = () => loadData({ silent: true });
    window.addEventListener('focus', handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadData]);

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
    setProfileDirty(true);
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
      setProfileDirty(false);
      setProfileMessage('Данные профиля сохранены.');
      await loadData({ silent: true, forceProfile: true });
    } catch (err) {
      setProfileMessage(err.message || 'Не удалось сохранить профиль.');
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleOrderCreated = async () => {
    await refreshCart();
    setActiveTab('orders');
    await loadData({ silent: true });
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
        onOrderCreated={handleOrderCreated}
      />

      <Container
        maxWidth={false}
        sx={{
          mt: { xs: 2, md: 3 },
          flex: 1,
          pb: 6,
          width: '100%',
          maxWidth: 1240,
          mx: 'auto',
          px: { xs: 2, md: 3 },
        }}
      >
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', md: 'center' }}
            spacing={1.5}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: 'background.paper' }}>
                <ArrowBack />
              </IconButton>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography variant="h5" fontWeight="900">
                    Личный кабинет
                  </Typography>
                  <Chip
                    size="small"
                    icon={profileReady ? <CheckCircle /> : <WarningAmber />}
                    label={profileReady ? 'готов к оформлению' : 'заполните профиль'}
                    color={profileReady ? 'success' : 'warning'}
                    variant="outlined"
                    sx={{ fontWeight: 800 }}
                  />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Контакты, доставка и контроль заказов обновляются автоматически
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              {lastSyncAt && (
                <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                  Обновлено: {lastSyncAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              )}
              <IconButton onClick={() => loadData({ silent: true })} disabled={isSyncing}>
                {isSyncing ? <CircularProgress size={20} /> : <Refresh />}
              </IconButton>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Logout />}
                onClick={handleLogout}
                sx={{ textTransform: 'none', fontWeight: 800 }}
              >
                Выйти
              </Button>
            </Stack>
          </Stack>

          {isSyncing && !isLoading && <LinearProgress sx={{ borderRadius: 999 }} />}
          {error && <Alert severity="error">{error}</Alert>}

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                lg: 'repeat(4, minmax(0, 1fr))',
              },
            }}
          >
            {[
              { label: 'Заказы', value: orders.length, icon: <ShoppingCart />, color: theme.palette.primary.main },
              { label: 'В работе', value: activeOrders.length, icon: <LocalShipping />, color: theme.palette.warning.main },
              { label: 'Сумма', value: `${totalSpent.toLocaleString()} ₽`, icon: <Paid />, color: theme.palette.success.main },
              { label: 'Профиль', value: `${profileProgress}%`, icon: profileReady ? <CheckCircle /> : <Person />, color: profileReady ? theme.palette.success.main : theme.palette.warning.main },
            ].map((item) => (
              <Paper
                key={item.label}
                elevation={0}
                sx={{
                  p: 1.75,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  minWidth: 0,
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ p: 1.1, borderRadius: 1.5, color: item.color, bgcolor: alpha(item.color, 0.1), display: 'flex' }}>
                    {item.icon}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight="800">
                      {item.label}
                    </Typography>
                    <Typography variant="h6" fontWeight="900" noWrap>
                      {item.value}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Box>

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', lg: '360px minmax(0, 1fr)' },
              alignItems: 'start',
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', width: '100%' }}>
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                    <Box>
                      <Typography variant="h6" fontWeight="900">Покупатель</Typography>
                      <Typography variant="body2" color="text.secondary">Данные для оформления заказа</Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={profileReady ? 'готово' : `${profileReadyCount}/3`}
                      color={profileReady ? 'success' : 'warning'}
                      sx={{ fontWeight: 800 }}
                    />
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={profileProgress}
                    color={profileReady ? 'success' : 'warning'}
                    sx={{ mt: 1.5, height: 8, borderRadius: 999 }}
                  />
                </Box>

                <Box sx={{ p: 2 }}>
                  {profileMessage && (
                    <Alert
                      severity={profileMessage.includes('сохран') ? 'success' : 'error'}
                      sx={{ mb: 2 }}
                    >
                      {profileMessage}
                    </Alert>
                  )}

                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr' } }}>
                      <TextField label="Фамилия" value={profileForm.last_name} onChange={handleProfileChange('last_name')} size="small" required />
                      <TextField label="Имя" value={profileForm.first_name} onChange={handleProfileChange('first_name')} size="small" required />
                      <TextField label="Отчество" value={profileForm.middle_name} onChange={handleProfileChange('middle_name')} size="small" />
                      <TextField label="Телефон" value={profileForm.phone} onChange={handleProfileChange('phone')} size="small" required />
                      <TextField
                        label="Адрес доставки"
                        value={profileForm.delivery_address}
                        onChange={handleProfileChange('delivery_address')}
                        size="small"
                        required
                        multiline
                        minRows={2}
                        sx={{ gridColumn: { xs: 'auto', sm: '1 / -1', lg: 'auto' } }}
                      />
                    </Box>

                    <Button
                      variant="contained"
                      onClick={handleProfileSave}
                      disabled={isProfileSaving || !profileDirty}
                      sx={{ height: 42, fontWeight: 900 }}
                    >
                      {isProfileSaving ? <CircularProgress color="inherit" size={22} /> : 'Сохранить профиль'}
                    </Button>
                  </Stack>
                </Box>
              </Paper>
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', width: '100%' }}>
                <Tabs
                  value={activeTab}
                  onChange={(_, value) => setActiveTab(value)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ px: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}
                >
                  <Tab icon={<ReceiptLong />} iconPosition="start" label="Заказы" value="orders" />
                  <Tab icon={<Inventory2 />} iconPosition="start" label="Детали заказа" value="details" disabled={!selectedOrder} />
                </Tabs>

                {isLoading ? (
                  <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 420 }}>
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }} color="text.secondary">Загружаем кабинет</Typography>
                  </Stack>
                ) : (
                  <Box sx={{ p: 2 }}>
                    {activeTab === 'orders' && (
                      <Box
                        sx={{
                          display: 'grid',
                          gap: 2,
                          gridTemplateColumns: { xs: '1fr', md: '280px minmax(0, 1fr)' },
                          alignItems: 'start',
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Stack spacing={1.25}>
                            {orders.length === 0 ? (
                              <Paper elevation={0} sx={{ p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 2, textAlign: 'center' }}>
                                <ReceiptLong sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                <Typography fontWeight="900">Заказов пока нет</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                  Добавьте запчасти в корзину и оформите заказ.
                                </Typography>
                                <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate('/')}>
                                  Перейти в каталог
                                </Button>
                              </Paper>
                            ) : orders.map((order) => {
                              const active = selectedOrder?.id === order.id;
                              const statusColor = getStatusColor(order.status);
                              return (
                                <Card
                                  key={order.id}
                                  variant="outlined"
                                  onClick={() => {
                                    setSelectedOrderId(order.id);
                                    setActiveTab('details');
                                  }}
                                  sx={{
                                    borderRadius: 2,
                                    cursor: 'pointer',
                                    borderColor: active ? 'primary.main' : 'divider',
                                    bgcolor: active ? alpha(theme.palette.primary.main, 0.04) : 'background.paper',
                                    transition: 'border-color 160ms ease, background-color 160ms ease',
                                  }}
                                >
                                  <CardContent sx={{ p: 1.75, '&:last-child': { pb: 1.75 } }}>
                                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                                      <Box>
                                        <Typography fontWeight="900">Заказ #{order.id}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {new Date(order.created_at).toLocaleString('ru-RU')}
                                        </Typography>
                                      </Box>
                                      <Chip
                                        size="small"
                                        label={orderStatusLabels[order.status] || order.status}
                                        sx={{ color: statusColor, bgcolor: alpha(statusColor, 0.1), fontWeight: 900 }}
                                      />
                                    </Stack>
                                    <Divider sx={{ my: 1.2 }} />
                                    <Stack direction="row" justifyContent="space-between">
                                      <Typography variant="body2" color="text.secondary">
                                        {(Array.isArray(order.items) ? order.items.length : 0)} позиций
                                      </Typography>
                                      <Typography fontWeight="900">
                                        {Number(order.total_amount || 0).toLocaleString()} ₽
                                      </Typography>
                                    </Stack>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </Stack>
                        </Box>

                        <Box sx={{ minWidth: 0 }}>
                          <OrderDetails
                            order={selectedOrder}
                            getStatusColor={getStatusColor}
                          />
                        </Box>
                      </Box>
                    )}

                    {activeTab === 'details' && (
                      <OrderDetails
                        order={selectedOrder}
                        getStatusColor={getStatusColor}
                        expanded
                      />
                    )}
                  </Box>
                )}
              </Paper>
            </Box>
          </Box>
        </Stack>
      </Container>

      <Footer />
    </Box>
  );
}

function OrderDetails({ order, getStatusColor, expanded = false }) {
  const theme = useTheme();

  if (!order) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: expanded ? 480 : 360, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
        <Visibility sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
        <Typography color="text.secondary">Выберите заказ из списка</Typography>
      </Stack>
    );
  }

  const statusColor = getStatusColor(order.status);
  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, minHeight: expanded ? 480 : 360 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
          <Box>
            <Typography variant="h6" fontWeight="900">Заказ #{order.id}</Typography>
            <Typography variant="body2" color="text.secondary">
              {new Date(order.created_at).toLocaleString('ru-RU')}
            </Typography>
          </Box>
          <Chip
            label={orderStatusLabels[order.status] || order.status}
            sx={{ alignSelf: 'flex-start', color: statusColor, bgcolor: alpha(statusColor, 0.1), fontWeight: 900 }}
          />
        </Stack>

        <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
          <TextField label="Получатель" value={order.customer_name || ''} size="small" InputProps={{ readOnly: true }} />
          <TextField label="Телефон" value={order.customer_phone || ''} size="small" InputProps={{ readOnly: true }} />
          <TextField
            label="Адрес доставки"
            value={order.delivery_address || ''}
            size="small"
            InputProps={{ readOnly: true }}
            sx={{ gridColumn: { xs: 'auto', sm: '1 / -1' } }}
          />
        </Box>

        <Divider />

        <Stack spacing={1.1}>
          {items.map((item) => {
            const image = getItemImage(item);
            const supplierName = getSupplierName(item);
            const supplierArticle = getSupplierArticle(item);

            return (
              <Stack
                key={item.id}
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                spacing={1.5}
                sx={{
                  p: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1.5,
                  bgcolor: 'background.paper',
                  boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.04)}`,
                  minWidth: 0,
                }}
              >
                <Stack direction="row" spacing={1.5} sx={{ minWidth: 0, flex: 1 }}>
                  <Box
                    sx={{
                      width: 72,
                      height: 72,
                      flexShrink: 0,
                      borderRadius: 1.25,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {image ? (
                      <Box
                        component="img"
                        src={image}
                        alt={item.name || item.article || 'Запчасть'}
                        sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 0.5 }}
                      />
                    ) : (
                      <Inventory2 sx={{ color: 'text.disabled' }} />
                    )}
                  </Box>

                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography fontWeight="900" sx={{ wordBreak: 'break-word' }}>
                        {item.brand} {item.article}
                      </Typography>
                      <Chip
                        size="small"
                        label={supplierName}
                        sx={{
                          height: 22,
                          maxWidth: '100%',
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          color: 'primary.main',
                          fontWeight: 800,
                          '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
                        }}
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, wordBreak: 'break-word' }}>
                      {item.name}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
                      <Typography variant="caption" color="text.secondary">
                        Артикул поставщика: <Box component="span" sx={{ color: 'text.primary', fontWeight: 800 }}>{supplierArticle || 'не указан'}</Box>
                      </Typography>
                      {item.warehouse_name && item.warehouse_name !== supplierName && (
                        <Typography variant="caption" color="text.secondary">
                          Склад: <Box component="span" sx={{ color: 'text.primary', fontWeight: 800 }}>{item.warehouse_name}</Box>
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                </Stack>

                <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, flexShrink: 0, minWidth: { sm: 110 } }}>
                  <Typography fontWeight="900">
                    {(Number(item.price || 0) * Number(item.quantity || 0)).toLocaleString()} ₽
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.quantity} x {Number(item.price || 0).toLocaleString()} ₽
                  </Typography>
                </Box>
              </Stack>
            );
          })}
        </Stack>

        <Stack direction="row" justifyContent="space-between" sx={{ pt: 1 }}>
          <Typography variant="h6" fontWeight="900">Итого</Typography>
          <Typography variant="h6" fontWeight="900" color="primary">
            {Number(order.total_amount || 0).toLocaleString()} ₽
          </Typography>
        </Stack>
      </Stack>
    </Paper>
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
