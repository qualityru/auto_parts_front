import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Stack,
  Box,
  InputBase,
  IconButton,
  Badge,
  Avatar,
  Button,
  useScrollTrigger,
  alpha,
  useTheme,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import DirectionsCarFilledIcon from '@mui/icons-material/DirectionsCarFilled';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';

// Импорт корзины и модалки аккаунта
import CartDrawer from './CartModal';
import AccountModal from './AccountModal';

// Ультрасовременный контейнер поиска с эффектом фокусировки
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: '16px',
  backgroundColor: alpha(theme.palette.common.white, 0.1),
  border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
  display: 'flex',
  alignItems: 'center',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  width: '100%',
  maxWidth: '500px',
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    border: `1px solid ${alpha(theme.palette.common.white, 0.25)}`,
  },
  '&:focus-within': {
    backgroundColor: alpha(theme.palette.common.white, 0.2),
    boxShadow: `0 8px 32px 0 ${alpha(theme.palette.common.black, 0.2)}`,
    maxWidth: '600px',
    borderColor: alpha(theme.palette.common.white, 0.5),
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: alpha(theme.palette.common.white, 0.7),
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1.2, 1, 1.2, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    fontSize: '0.95rem',
    '&::placeholder': {
      color: alpha(theme.palette.common.white, 0.6),
      opacity: 1,
    },
  },
}));

function Header({ 
  searchQuery, 
  setSearchQuery, 
  onSearch,
  cartItems = [],
  onRemoveItem,
  onUpdateQuantity,
  onClearCart,
  getCartTotal,
  themeMode,
  onToggleTheme 
}) {
  const navigate = useNavigate();
  const theme = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Проверка авторизации
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setIsLoggedIn(!!token);
  }, []);

  // Слушаем изменения авторизации (для обновления при логине)
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('authToken');
      setIsLoggedIn(!!token);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const trigger = useScrollTrigger({ disableHysteresis: true, threshold: 20 });

  const handleSearch = () => {
    if (searchQuery?.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleAccountModalClose = () => {
    setIsAccountModalOpen(false);
    // После логина обновляем статус
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsLoggedIn(true);
    }
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={trigger ? 8 : 0}
        sx={{
          background: trigger 
            ? (theme.palette.mode === 'light' ? 'rgba(25, 118, 210, 0.9)' : 'rgba(10, 25, 41, 0.9)')
            : 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          backdropFilter: 'blur(12px)',
          transition: 'all 0.3s ease-in-out',
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ height: trigger ? 70 : 85, transition: '0.3s' }}>
            
            {/* LOGO */}
            <Stack 
              direction="row" 
              spacing={1.5} 
              alignItems="center" 
              onClick={() => { navigate('/'); setSearchQuery(''); }}
              sx={{ cursor: 'pointer', minWidth: 'fit-content', mr: 2 }}
            >
              <Box sx={{ 
                p: 1, 
                bgcolor: alpha('#fff', 0.2), 
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <DirectionsCarFilledIcon sx={{ fontSize: 28, color: '#fff' }} />
              </Box>
              <Typography
                variant="h5"
                sx={{ fontWeight: 900, letterSpacing: '-1px', display: { xs: 'none', md: 'block' }, cursor: 'pointer' }}
                onClick={() => { navigate('/'); setSearchQuery(''); }}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { navigate('/'); setSearchQuery(''); } }}
              >
                BOGTAR
              </Typography>
            </Stack>

            {/* SEARCH BAR */}
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', px: 2 }}>
              <Search>
                <SearchIconWrapper>
                  <SearchIcon />
                </SearchIconWrapper>
                <StyledInputBase
                  placeholder="Введите госномер или VIN или артикул детали..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                {searchQuery?.length > 0 && (
                  <IconButton 
                    size="small" 
                    onClick={handleSearch}
                    sx={{ 
                      mr: 1, 
                      bgcolor: alpha('#fff', 0.1),
                      color: '#fff',
                      '&:hover': { bgcolor: alpha('#fff', 0.25) }
                    }}
                  >
                    <ArrowForwardIcon fontSize="small" />
                  </IconButton>
                )}
              </Search>
            </Box>

            {/* ACTIONS */}
            <Stack direction="row" spacing={{ xs: 0.5, sm: 2 }} alignItems="center">
              <Tooltip title="Сменить тему">
                <IconButton color="inherit" onClick={onToggleTheme} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                  {themeMode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
                </IconButton>
              </Tooltip>

              <IconButton color="inherit" onClick={() => setIsCartOpen(true)}>
                <Badge 
                  badgeContent={cartItems.reduce((acc, i) => acc + i.quantity, 0)} 
                  color="error"
                  sx={{ '& .MuiBadge-badge': { fontWeight: 700 } }}
                >
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>

              {isLoggedIn ? (
                <IconButton 
                  onClick={() => navigate('/profile')} 
                  sx={{ 
                    p: 0.5, 
                    border: `2px solid ${alpha('#fff', 0.3)}`,
                    transition: '0.2s',
                    '&:hover': { transform: 'scale(1.05)' }
                  }}
                >
                  <Avatar sx={{ width: 32, height: 32, bgcolor: '#90caf9', color: '#0d47a1' }}>
                    <AccountCircleIcon fontSize="small" />
                  </Avatar>
                </IconButton>
              ) : (
                <>
                  <Button
                    variant="contained"
                    onClick={() => setIsAccountModalOpen(true)}
                    startIcon={<AccountCircleIcon />}
                    sx={{
                      display: { xs: 'none', md: 'flex' },
                      bgcolor: alpha('#fff', 0.15),
                      backdropFilter: 'blur(4px)',
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 700,
                      px: 3,
                      border: `1px solid ${alpha('#fff', 0.1)}`,
                      '&:hover': { 
                        bgcolor: alpha('#fff', 0.25),
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    Войти
                  </Button>
                  <IconButton 
                    sx={{ display: { xs: 'flex', md: 'none' }, color: 'white' }} 
                    onClick={() => setIsAccountModalOpen(true)}
                  >
                    <AccountCircleIcon />
                  </IconButton>
                </>
              )}
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      <CartDrawer
        open={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRemoveItem={onRemoveItem}
        onUpdateQuantity={onUpdateQuantity}
        onClearCart={onClearCart}
        getCartTotal={getCartTotal}
      />

      {isAccountModalOpen && (
        <AccountModal
          onClose={handleAccountModalClose}
        />
      )}
    </>
  );
}

export default Header;