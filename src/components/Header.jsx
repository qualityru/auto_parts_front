import React, { useState, useEffect } from 'react'
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
  TextField,
  InputAdornment,
} from '@mui/material'
import { styled } from '@mui/material/styles'
import SearchIcon from '@mui/icons-material/Search'
import DirectionsCarFilledIcon from '@mui/icons-material/DirectionsCarFilled'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import { useNavigate } from 'react-router-dom'

// Стилизованный контейнер для поиска
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: '12px',
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
  transition: 'all 0.3s ease',
}))

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}))

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '30ch',
      '&:focus': { width: '40ch' },
    },
  },
}))

function Header({ 
  onAccountClick, 
  onExampleSearch,
  searchQuery: externalSearchQuery,
  onSearch,
  setSearchQuery: externalSetSearchQuery,
  cartItems = [] 
}) {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [localSearchQuery, setLocalSearchQuery] = useState('')
  
  // Используем внешний или локальный стейт для поиска
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : localSearchQuery
  const setSearchQuery = externalSetSearchQuery || setLocalSearchQuery

  // Проверка авторизации при загрузке
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    setIsLoggedIn(!!token)
  }, [])

  // Эффект уменьшения шапки при скролле
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
  })

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleSearch = () => {
    if (onSearch) {
      onSearch()
    } else if (onExampleSearch && searchQuery.trim()) {
      onExampleSearch(searchQuery.trim())
    }
  }

  const handleLogoClick = () => {
    navigate('/')
    setSearchQuery('')
    if (onExampleSearch) {
      onExampleSearch('')
    }
  }

  return (
    <AppBar
      position="sticky"
      elevation={trigger ? 4 : 0}
      sx={{
        background: trigger 
          ? 'rgba(25, 118, 210, 0.8)' 
          : 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease-in-out',
        py: trigger ? 0.5 : 1,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* LOGO */}
          <Stack 
            direction="row" 
            alignItems="center" 
            spacing={1} 
            sx={{ cursor: 'pointer' }}
            onClick={handleLogoClick}
          >
            <DirectionsCarFilledIcon sx={{ fontSize: 32, display: { xs: 'none', md: 'flex' } }} />
            <Typography
              variant="h5"
              noWrap
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              bogtar<Box component="span" sx={{ color: '#90caf9' }}>:)</Box>
            </Typography>
          </Stack>

          {/* SEARCH BAR (Middle) - Desktop */}
          <Search sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Поиск по артикулу (например, W9142)..."
              inputProps={{ 'aria-label': 'search' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </Search>

          {/* SEARCH BAR (Middle) - Mobile */}
          <Box sx={{ 
            flexGrow: 1, 
            display: { xs: 'flex', sm: 'none' },
            justifyContent: 'center',
            mx: 1
          }}>
            <TextField
              fullWidth
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Поиск артикула..."
              variant="outlined"
              autoComplete="off"
              sx={{ 
                bgcolor: alpha('#fff', 0.15),
                borderRadius: '8px',
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { border: 'none' },
                  '&:hover fieldset': { border: 'none' },
                },
                '& .MuiInputBase-input': {
                  color: 'white',
                  py: 0.5,
                  px: 1,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'white' }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={handleSearch}
                      sx={{ color: 'white' }}
                    >
                      <SearchIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box sx={{ flexGrow: { xs: 0, sm: 0 } }} />

          {/* ACTIONS */}
          <Stack direction="row" spacing={1} alignItems="center">
            {/* Корзина */}
            <IconButton 
              color="inherit" 
              onClick={() => navigate('/cart')}
              sx={{ 
                display: { xs: 'inline-flex', md: 'inline-flex' },
                position: 'relative'
              }}
            >
              <Badge 
                badgeContent={cartItems.length} 
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.7rem',
                    height: '18px',
                    minWidth: '18px',
                  }
                }}
              >
                <ShoppingCartIcon />
              </Badge>
            </IconButton>

            {/* Уведомления */}
            <IconButton color="inherit" sx={{ display: { xs: 'none', md: 'inline-flex' } }}>
              <Badge badgeContent={4} color="error">
                <NotificationsNoneIcon />
              </Badge>
            </IconButton>

            {/* Аккаунт */}
            {isLoggedIn ? (
              <IconButton 
                onClick={() => navigate('/profile')} 
                sx={{ p: 0.5, border: '2px solid rgba(255,255,255,0.3)' }}
              >
                <Avatar 
                  sx={{ width: 35, height: 35, bgcolor: '#90caf9', color: '#0d47a1' }}
                >
                  <AccountCircleIcon />
                </Avatar>
              </IconButton>
            ) : (
              <Button
                variant="contained"
                disableElevation
                startIcon={<AccountCircleIcon />}
                onClick={onAccountClick}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                }}
              >
                Войти
              </Button>
            )}
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  )
}

export default Header