import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Box, Container, Typography, Stack, Grid, CssBaseline, Divider,
  List, ListItem, ListItemText, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Breadcrumbs, Link, Card,
  CardContent, Accordion, AccordionSummary, AccordionDetails,
  Button, Skeleton, Fade, CircularProgress
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import SearchIcon from '@mui/icons-material/Search';

// Swiper & Zoom
import { Swiper, SwiperSlide } from 'swiper/react';
import Zoom from 'react-medium-image-zoom';
import 'swiper/css';
import 'react-medium-image-zoom/dist/styles.css';

import Header from './components/Header';
import ProductCard from './components/ProductCard';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import MainBody from './components/MainBody';
import Footer from './components/Footer';

import { getCarsByVin, getPartsByCarId, searchProductsStream, getEntitiesByCode } from './utils/api';

const renderSafeText = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return value.name || value.id || '---';
  return String(value);
};

// --- ИСПРАВЛЕННЫЙ КОМПОНЕНТ С ЗУМОМ ВНУТРИ ---
const SmartImage = ({ src }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
  }, [src]);

  return (
    <Box sx={{ 
      position: 'relative', 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      minHeight: 300 
    }}>
      {!isLoaded && (
        <Box sx={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={40} thickness={4} />
          <Typography variant="caption" color="text.secondary">Загрузка...</Typography>
        </Box>
      )}

      <Fade in={isLoaded} timeout={800}>
        <div style={{ width: '100%', height: '100%', display: isLoaded ? 'flex' : 'none', justifyContent: 'center' }}>
          {/* Zoom теперь привязан напрямую к картинке */}
          <Zoom>
            <img
              src={src}
              alt="схема"
              onLoad={() => setIsLoaded(true)}
              style={{ 
                maxWidth: '100%', 
                maxHeight: '60vh', 
                objectFit: 'contain',
                borderRadius: '8px',
                cursor: 'zoom-in'
              }}
            />
          </Zoom>
        </div>
      </Fade>
    </Box>
  );
};

const structurePartsData = (partsList) => {
  if (!Array.isArray(partsList)) return {};
  const tree = {};
  partsList.forEach((part, index) => {
    const l1 = part.groups?.find(g => g.level === 1) || { id: 'l1-0', name: 'Общее' };
    const l2 = part.groups?.find(g => g.level === 2) || { id: 'l2-0', name: 'Разное' };
    const l1Id = String(l1.id);
    const l2Id = String(l2.id);
    if (!tree[l1Id]) tree[l1Id] = { name: renderSafeText(l1.name), subGroups: {} };
    if (!tree[l1Id].subGroups[l2Id]) tree[l1Id].subGroups[l2Id] = { name: renderSafeText(l2.name), parts: [] };
    tree[l1Id].subGroups[l2Id].parts.push({
      ...part,
      code: renderSafeText(part.code),
      name: renderSafeText(part.name),
      key: `part-${index}-${part.code}`
    });
  });
  return tree;
};

function App() {
  const [themeMode, setThemeMode] = useState('light');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [products, setProducts] = useState([]); 
  const [cars, setCars] = useState([]); 
  const [carParts, setCarParts] = useState(null); 
  const [selectedSubGroup, setSelectedSubGroup] = useState(null);
  const [selectedCarInfo, setSelectedCarInfo] = useState(null);
  const [activePart, setActivePart] = useState(null);

  const activeStream = useRef(null);

  const theme = useMemo(() => createTheme({
    palette: { 
      mode: themeMode,
      primary: { main: '#005387' }, 
      background: { default: themeMode === 'light' ? '#f4f7f9' : '#0a1016' }
    },
    typography: { fontFamily: '"Inter", sans-serif' },
    shape: { borderRadius: 12 }
  }), [themeMode]);

  const resetToHome = () => {
    setCarParts(null);
    setSelectedCarInfo(null);
    setActivePart(null);
    setProducts([]);
    setCars([]);
    setSearchQuery('');
    if (activeStream.current) activeStream.current.abort();
  };

  const handleUniversalSearch = async (query) => {
    const term = query?.trim() || searchQuery.trim();
    if (!term) return;
    if (activeStream.current) activeStream.current.abort();
    setIsLoading(true);
    setError(null);
    setSearchQuery(term);
    const isVin = /^[A-HJ-NPR-Z0-9]{17}$/i.test(term);
    if (isVin) {
      resetToHome();
      setIsLoading(true);
      try {
        const res = await getCarsByVin(term);
        const list = res.list || (Array.isArray(res) ? res : []);
        setCars(list);
        if (list.length === 0) setError("Автомобиль не найден");
      } catch (err) { setError(err.message); } finally { setIsLoading(false); }
    } else {
      setCars([]);
      setProducts([]);
      const stream = searchProductsStream(term, {
        onItem: (item) => {
          setProducts(prev => {
            const groupKey = `${renderSafeText(item.brand)}-${renderSafeText(item.article)}`.toLowerCase().replace(/\s+/g, '');
            if (prev.find(p => p.groupKey === groupKey)) return prev;
            return [...prev, { ...item, internalId: groupKey, groupKey, warehouses: item.warehouses || [], images: item.images || [] }];
          });
        },
        onDone: () => setIsLoading(false),
        onError: (err) => { setError(err.message); setIsLoading(false); }
      });
      activeStream.current = stream;
      await stream.start();
    }
  };

  const handleArticleSelect = async (part) => {
    setActivePart({ ...part, isImageLoading: true });
    try {
      const entities = await getEntitiesByCode(part.code);
      const detail = entities?.list?.find(item => 
        Array.isArray(item.groups) && item.groups.length > 0
      ) || entities?.list?.[0];

      if (detail) {
        setActivePart(prev => ({
          ...prev,
          images: detail.images || [],
          brand: renderSafeText(detail.brand),
          fullName: renderSafeText(detail.originalName) || part.name,
          isImageLoading: false
        }));
      } else {
        setActivePart(prev => ({ ...prev, isImageLoading: false }));
      }
    } catch (err) { 
      console.warn(err); 
      setActivePart(prev => ({ ...prev, isImageLoading: false }));
    }
  };

  const handleSelectCar = async (car) => {
    setIsLoading(true);
    setCars([]);
    setSelectedCarInfo({ 
      id: car.id, 
      brand: renderSafeText(car.brand), 
      model: renderSafeText(car.model),
      full: car 
    });
    try {
      const data = await getPartsByCarId(car.id);
      if (data?.list) setCarParts(structurePartsData(data.list));
    } catch (err) { setError(err.message); } finally { setIsLoading(false); }
  };

  const goToPrices = (code) => {
    setCarParts(null); 
    handleUniversalSearch(code);
  };

  const backToCatalog = async () => {
    if (selectedCarInfo) {
      setProducts([]);
      setIsLoading(true);
      try {
        const data = await getPartsByCarId(selectedCarInfo.id);
        if (data?.list) setCarParts(structurePartsData(data.list));
      } catch (err) { setError(err.message); } finally { setIsLoading(false); }
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box display="flex" flexDirection="column" minHeight="100vh">
        <Header 
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          onSearch={() => handleUniversalSearch()} themeMode={themeMode}
          onToggleTheme={() => setThemeMode(t => t === 'light' ? 'dark' : 'light')}
        />

        <Container maxWidth="xl" sx={{ mt: 3, flex: 1, pb: 6 }}>
          {(selectedCarInfo || products.length > 0 || carParts) && (
            <Breadcrumbs sx={{ mb: 2, bgcolor: 'background.paper', p: '8px 16px', borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <Link component="button" variant="body2" onClick={resetToHome} underline="hover" color="inherit">Главная</Link>
              {selectedCarInfo && (
                <Link component="button" variant="body2" onClick={backToCatalog} underline="hover" color={carParts ? "primary" : "inherit"} sx={{ fontWeight: carParts ? 700 : 400 }}>
                  {selectedCarInfo.brand} {selectedCarInfo.model}
                </Link>
              )}
              {products.length > 0 && !carParts && (
                <Typography variant="body2" color="primary" sx={{ fontWeight: 700 }}>Цены: {searchQuery}</Typography>
              )}
            </Breadcrumbs>
          )}

          {error && <ErrorMessage message={String(error)} onClose={() => setError(null)} />}

          {isLoading && products.length === 0 ? (
            <LoadingSpinner />
          ) : carParts ? (
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Stack spacing={0.5} sx={{ maxHeight: '75vh', overflowY: 'auto' }}>
                  {Object.entries(carParts).map(([id, group]) => (
                    <Accordion key={id} disableGutters elevation={0} sx={{ bgcolor: 'transparent', borderBottom: '1px solid #eee' }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.8rem' }}>{renderSafeText(group.name)}</Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: 0 }}>
                        <List dense disablePadding>
                          {Object.entries(group.subGroups).map(([sid, sub]) => (
                            <ListItem button key={sid} 
                              onClick={() => {
                                setSelectedSubGroup(sub);
                                if (sub.parts?.length > 0) handleArticleSelect(sub.parts[0]);
                              }} 
                              selected={selectedSubGroup?.name === sub.name}
                              sx={{ py: 0.5, pl: 4 }}
                            >
                              <ListItemText primary={renderSafeText(sub.name)} primaryTypographyProps={{ fontSize: '0.75rem' }} />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, height: '75vh', display: 'flex', flexDirection: 'column', borderRadius: 4, bgcolor: '#fff' }}>
                  {activePart ? (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{renderSafeText(activePart.code)} — {renderSafeText(activePart.name)}</Typography>
                        <Button size="small" variant="contained" startIcon={<SearchIcon />} onClick={() => goToPrices(activePart.code)} sx={{ borderRadius: 2 }}>Найти цены</Button>
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                        {activePart.isImageLoading ? (
                          <CircularProgress />
                        ) : activePart.images?.length > 0 ? (
                          <SmartImage src={activePart.images[0]} />
                        ) : (
                          <Stack alignItems="center" spacing={1} sx={{ opacity: 0.2 }}>
                            <PhotoCameraIcon sx={{ fontSize: 80 }} />
                            <Typography>Изображение отсутствует</Typography>
                          </Stack>
                        )}
                      </Box>
                    </>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Typography color="text.secondary">Выберите узел для просмотра</Typography></Box>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} md={3}>
                {selectedSubGroup && (
                  <TableContainer component={Paper} variant="outlined" sx={{ height: '75vh', borderRadius: 3 }}>
                    <Table stickyHeader size="small">
                      <TableHead><TableRow><TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>OEM / Название</TableCell></TableRow></TableHead>
                      <TableBody>
                        {selectedSubGroup.parts.map((part) => (
                          <TableRow key={part.key} hover onClick={() => handleArticleSelect(part)} selected={activePart?.code === part.code} sx={{ cursor: 'pointer' }}>
                            <TableCell>
                              <Typography sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.75rem' }}>{renderSafeText(part.code)}</Typography>
                              <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{renderSafeText(part.name)}</Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Grid>
            </Grid>
          ) : cars.length > 0 ? (
            <Grid container spacing={2}>
              {cars.map((car) => (
                <Grid item xs={12} sm={4} key={car.id}><Card variant="outlined" sx={{ cursor: 'pointer', borderRadius: 4, '&:hover': { borderColor: 'primary.main' } }} onClick={() => handleSelectCar(car)}><CardContent><Typography fontWeight={800} color="primary">{renderSafeText(car.brand)} {renderSafeText(car.model)}</Typography><Typography variant="body2" color="text.secondary">{renderSafeText(car.year)} • {renderSafeText(car.engine_code)}</Typography></CardContent></Card></Grid>
              ))}
            </Grid>
          ) : products.length > 0 ? (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>Предложения для: {searchQuery}</Typography>
              <Grid container spacing={2}>
                {products.map(p => (<Grid item xs={12} sm={6} md={4} lg={3} key={p.internalId}><ProductCard product={p} onAddToCart={() => {}} isItemInCart={() => false} /></Grid>))}
              </Grid>
            </Box>
          ) : (
            <MainBody onExampleSearch={(q) => handleUniversalSearch(q)} />
          )}
        </Container>
        <Footer />
      </Box>
    </ThemeProvider>
  );
}

export default App;