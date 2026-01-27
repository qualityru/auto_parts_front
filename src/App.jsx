import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Box, Container, Typography, Stack, Grid, CssBaseline, Divider,
  List, ListItem, ListItemText, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Breadcrumbs, Link, Card,
  CardContent, Accordion, AccordionSummary, AccordionDetails,
  Button, Fade, CircularProgress, IconButton, Tooltip
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import SearchIcon from '@mui/icons-material/Search';
import { YMInitializer } from 'react-yandex-metrika';
import ym from 'react-yandex-metrika';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

import Header from './components/Header';
import ProductCard from './components/ProductCard';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import MainBody from './components/MainBody';
import Footer from './components/Footer';

// Импорт API
import { 
  getCarsByVin, 
  getPartsByCarId, 
  searchProductsStream, 
  getEntitiesByCode, 
  getCarsByNumber, 
  getCarCatalog,
  getUnitDetails // Новая ручка
} from './utils/api';

const renderSafeText = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return value.name || value.id || '---';
  return String(value);
};

// --- КОМПОНЕНТ ДЛЯ ПЛАВНОЙ ЗАГРУЗКИ КАРТИНКИ ---
const SmartImage = ({ src }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => { setIsLoaded(false); }, [src]);

  return (
    <Box sx={{ 
      position: 'relative', width: '100%', height: '100%', 
      display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 
    }}>
      {!isLoaded && (
        <Box sx={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={40} thickness={4} />
          <Typography variant="caption" color="text.secondary">Загрузка изображения...</Typography>
        </Box>
      )}
      <Fade in={isLoaded} timeout={800}>
        <div style={{ width: '100%', height: '100%', display: isLoaded ? 'flex' : 'none', justifyContent: 'center' }}>
          <Zoom>
            <img
              src={src}
              alt="деталь"
              onLoad={() => setIsLoaded(true)}
              style={{ 
                maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain',
                borderRadius: '8px', cursor: 'zoom-in'
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
  const [laximoData, setLaximoData] = useState(null); 
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

  // Эффект для автоматической подгрузки деталей Laximo при смене узла
  useEffect(() => {
    if (selectedSubGroup && laximoData?.catalog) {
      loadUnitDetails(selectedSubGroup);
    }
  }, [selectedSubGroup?.id]);

  const loadUnitDetails = async (unit) => {
    try {
      const data = await getUnitDetails(laximoData.catalog, unit.id, unit.ssd || laximoData.ssd);
      setSelectedSubGroup(prev => ({ ...prev, details: data.details || [] }));
    } catch (err) {
      console.error("Ошибка загрузки деталей узла", err);
    }
  };

  const resetToHome = () => {
    setCarParts(null);
    setLaximoData(null);
    setSelectedCarInfo(null);
    setActivePart(null);
    setSelectedSubGroup(null);
    setProducts([]);
    setCars([]);
    setSearchQuery('');
    if (activeStream.current) activeStream.current.abort();
    ym('hit', '/');
  };

  const handleUniversalSearch = async (query) => {
    const term = query?.trim() || searchQuery.trim();
    if (!term) return;
    if (activeStream.current) activeStream.current.abort();
    setIsLoading(true);
    setError(null);
    setSearchQuery(term);
    setLaximoData(null);
    ym('reachGoal', 'SEARCH_INIT', { query: term });

    const isVin = /^[A-HJ-NPR-Z0-9]{17}$/i.test(term);
    const isPlate = /^[A-ZА-Я]{1}\d{3}[A-ZА-Я]{2}\d{2,3}$/i.test(term.replace(/\s+/g, ''));

    try {
      if (isVin || isPlate) {
        resetToHome();
        setIsLoading(true);
        setSearchQuery(term);
        const res = isVin ? await getCarsByVin(term) : await getCarsByNumber(term);
        const list = Array.isArray(res) ? res : (res.list || []);
        setCars(list);
        if (list.length === 0) setError("Автомобиль не найден");
        setIsLoading(false);
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
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleSelectCar = async (car) => {
    setIsLoading(true);
    setCars([]);
    setSelectedCarInfo({ 
      id: car.vehicleid || car.id, 
      brand: renderSafeText(car.brand), 
      model: renderSafeText(car.name || car.model), 
      full: car 
    });
    try {
      if (car.catalog && car.ssd) {
        const data = await getCarCatalog(car.catalog, car.vehicleid || car.id, car.ssd);
        setLaximoData(data);
        if (data.categories?.[0]?.units?.[0]) {
            setSelectedSubGroup(data.categories[0].units[0]);
        }
      } else {
        const data = await getPartsByCarId(car.id);
        if (data?.list) setCarParts(structurePartsData(data.list));
      }
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const goToPrices = (code) => {
    if (!code) return;
    ym('reachGoal', 'GO_TO_PRICES', { article: code });
    setCarParts(null); 
    setLaximoData(null);
    handleUniversalSearch(code);
  };

  const handleArticleSelect = async (part) => {
    if (!part) return;
    setActivePart({ ...part, isImageLoading: true });
    try {
      const entities = await getEntitiesByCode(part.code);
      const detail = entities?.list?.find(item => Array.isArray(item.groups) && item.groups.length > 0) || entities?.list?.[0];
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
      setActivePart(prev => ({ ...prev, isImageLoading: false }));
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <YMInitializer accounts={[106429227]} options={{ webvisor: true }} version="2" />
      <Box display="flex" flexDirection="column" minHeight="100vh">
        <Header 
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          onSearch={() => handleUniversalSearch()} themeMode={themeMode}
          onToggleTheme={() => setThemeMode(t => t === 'light' ? 'dark' : 'light')}
        />
        <Container maxWidth="xl" sx={{ mt: 3, flex: 1, pb: 6 }}>
          {(selectedCarInfo || products.length > 0 || carParts || laximoData) && (
            <Breadcrumbs sx={{ mb: 2, bgcolor: 'background.paper', p: '8px 16px', borderRadius: 2 }}>
              <Link component="button" variant="body2" onClick={resetToHome} underline="hover" color="inherit">Главная</Link>
              {selectedCarInfo && (
                <Typography variant="body2" color="primary" sx={{ fontWeight: 700 }}>
                  {selectedCarInfo.brand} {selectedCarInfo.model}
                </Typography>
              )}
            </Breadcrumbs>
          )}

          {error && <ErrorMessage message={String(error)} onClose={() => setError(null)} />}

          {isLoading && products.length === 0 ? (
            <LoadingSpinner />
          ) : laximoData ? (
            /* --- КАТАЛОГ LAXIMO --- */
            <Grid container spacing={1.5} wrap="nowrap" sx={{ overflowX: 'auto' }}>
              <Grid item xs={2} sx={{ minWidth: '220px', maxWidth: '280px', flexShrink: 0 }}>
                <Stack spacing={0.5} sx={{ maxHeight: '78vh', overflowY: 'auto', pr: 1 }}>
                  {laximoData.categories?.map((cat) => (
                    <Accordion key={cat.id} disableGutters elevation={0} sx={{ bgcolor: 'transparent', borderBottom: '1px solid #eee' }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: '1rem' }} />}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', lineHeight: 1.2 }}>{cat.name}</Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: 0 }}>
                        <List dense disablePadding>
                          {cat.units?.map((unit) => (
                            <ListItem button key={unit.id} 
                              onClick={() => setSelectedSubGroup(unit)} 
                              selected={selectedSubGroup?.id === unit.id}
                              sx={{ py: 0.4, pl: 2 }}
                            >
                              <ListItemText primary={unit.name} primaryTypographyProps={{ fontSize: '0.7rem', lineHeight: 1.1 }} />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Stack>
              </Grid>

              <Grid item xs={7} sx={{ minWidth: '500px', flexGrow: 1 }}>
                <Paper variant="outlined" sx={{ p: 2, height: '78vh', display: 'flex', flexDirection: 'column', borderRadius: 4, bgcolor: '#fff' }}>
                  {selectedSubGroup ? (
                    <>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.85rem' }}>
                        {selectedSubGroup.name}
                      </Typography>
                      <Divider sx={{ mb: 1.5 }} />
                      <Box sx={{ flex: 1, overflow: 'hidden' }}>
                        <SmartImage key={selectedSubGroup.id} src={selectedSubGroup.image} />
                      </Box>
                    </>
                  ) : <Typography align="center" sx={{ mt: 4 }}>Выберите узел</Typography>}
                </Paper>
              </Grid>

              <Grid item xs={3} sx={{ minWidth: '280px', maxWidth: '350px', flexShrink: 0 }}>
                {selectedSubGroup && (
                  <TableContainer component={Paper} variant="outlined" sx={{ height: '78vh', borderRadius: 3 }}>
                    <Table stickyHeader size="small">
                      <TableHead><TableRow><TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', py: 1.5 }}>OEM / Поиск цен</TableCell></TableRow></TableHead>
                      <TableBody>
                        {selectedSubGroup.details?.map((detail, idx) => (
                          <TableRow key={idx} hover sx={{ cursor: 'pointer' }}>
                            <TableCell sx={{ py: 1 }}>
                              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                                <Stack direction="row" spacing={1} alignItems="flex-start">
                                    <Typography sx={{ minWidth: 18, fontWeight: 800, color: 'text.disabled', fontSize: '0.65rem' }}>{detail.codeonimage}</Typography>
                                    <Box>
                                        <Typography sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.75rem', lineHeight: 1 }}>{detail.oem || '---'}</Typography>
                                        <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', mt: 0.3, lineHeight: 1.1 }}>{detail.name}</Typography>
                                    </Box>
                                </Stack>
                                {detail.oem && (
                                    <Tooltip title="Найти цены">
                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); goToPrices(detail.oem); }} color="primary" sx={{ bgcolor: 'action.hover' }}>
                                            <SearchIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                )}
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Grid>
            </Grid>
          ) : carParts ? (
            /* --- ОБЫЧНЫЙ КАТАЛОГ (По ГОС номеру) --- */
            <Grid container spacing={1.5} wrap="nowrap" sx={{ overflowX: 'auto' }}>
              <Grid item xs={2} sx={{ minWidth: '220px', maxWidth: '280px', flexShrink: 0 }}>
                <Stack spacing={0.5} sx={{ maxHeight: '78vh', overflowY: 'auto', pr: 1 }}>
                  {Object.entries(carParts).map(([id, group]) => (
                    <Accordion key={id} disableGutters elevation={0} sx={{ bgcolor: 'transparent', borderBottom: '1px solid #eee' }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: '1rem' }} />}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', lineHeight: 1.2 }}>{renderSafeText(group.name)}</Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: 0 }}>
                        <List dense disablePadding>
                          {Object.entries(group.subGroups).map(([sid, sub]) => (
                            <ListItem 
                                button 
                                key={sid} 
                                onClick={() => { 
                                    setSelectedSubGroup(sub); 
                                    if (sub.parts?.length > 0) handleArticleSelect(sub.parts[0]); 
                                }} 
                                selected={selectedSubGroup?.name === sub.name} 
                                sx={{ py: 0.4, pl: 2 }}
                            >
                              <ListItemText primary={renderSafeText(sub.name)} primaryTypographyProps={{ fontSize: '0.7rem', lineHeight: 1.1 }} />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Stack>
              </Grid>

              <Grid item xs={7} sx={{ minWidth: '500px', flexGrow: 1 }}>
                <Paper variant="outlined" sx={{ p: 2, height: '78vh', display: 'flex', flexDirection: 'column', borderRadius: 4, bgcolor: '#fff' }}>
                  {activePart ? (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.85rem' }}>
                          {activePart.code} — {activePart.name}
                        </Typography>
                        <Button size="small" variant="contained" startIcon={<SearchIcon />} onClick={() => goToPrices(activePart.code)}>Цены</Button>
                      </Box>
                      <Divider sx={{ mb: 1.5 }} />
                      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                        {activePart.isImageLoading ? (
                            <CircularProgress />
                        ) : activePart.images?.length > 0 ? (
                            <SmartImage key={activePart.images[0]} src={activePart.images[0]} />
                        ) : (
                            <Stack alignItems="center" spacing={1} sx={{ opacity: 0.3 }}>
                                <PhotoCameraIcon sx={{ fontSize: 80 }} />
                                <Typography variant="caption">Нет изображения</Typography>
                            </Stack>
                        )}
                      </Box>
                    </>
                  ) : <Typography align="center" sx={{ mt: 4 }}>Выберите узел и деталь</Typography>}
                </Paper>
              </Grid>

              <Grid item xs={3} sx={{ minWidth: '280px', maxWidth: '350px', flexShrink: 0 }}>
                {selectedSubGroup && (
                  <TableContainer component={Paper} variant="outlined" sx={{ height: '78vh', borderRadius: 3 }}>
                    <Table stickyHeader size="small">
                      <TableHead><TableRow><TableCell sx={{ fontSize: '0.7rem', py: 1.5 }}>Деталь / Поиск цен</TableCell></TableRow></TableHead>
                      <TableBody>
                        {selectedSubGroup.parts?.map((part) => (
                          <TableRow 
                            key={part.key} 
                            hover 
                            onClick={() => handleArticleSelect(part)} 
                            selected={activePart?.code === part.code} 
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell sx={{ py: 1 }}>
                                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                                    <Box sx={{ flex: 1 }}>
                                        <Typography sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.75rem' }}>{part.code || 'Арт. отсутствует'}</Typography>
                                        <Typography sx={{ fontSize: '0.65rem', mt: 0.3 }}>{part.name}</Typography>
                                    </Box>
                                    <Tooltip title="Найти цены">
                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); goToPrices(part.code); }} color="primary" sx={{ bgcolor: 'action.hover' }}>
                                            <SearchIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
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
            /* --- СПИСОК МАШИН --- */
            <Grid container spacing={2}>
              {cars.map((car) => (
                <Grid item xs={12} sm={4} key={car.id || car.vehicleid}>
                  <Card variant="outlined" sx={{ cursor: 'pointer', borderRadius: 4, '&:hover': { borderColor: 'primary.main' } }} onClick={() => handleSelectCar(car)}>
                    <CardContent>
                      <Typography fontWeight={800} color="primary">{renderSafeText(car.brand)} {renderSafeText(car.name || car.model)}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {renderSafeText(car.manufactured || car.year)} • {renderSafeText(car.engine || car.engine_code)}
                      </Typography>
                      {car.market && <Typography variant="caption" display="block">{car.market}</Typography>}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : products.length > 0 ? (
            /* --- РЕЗУЛЬТАТЫ ПОИСКА ТОВАРОВ --- */
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>Предложения: {searchQuery}</Typography>
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