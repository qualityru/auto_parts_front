import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Box, Container, CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { YMInitializer } from 'react-yandex-metrika';
import ym from 'react-yandex-metrika';
import { useNavigate, useSearchParams } from 'react-router-dom';

import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import MainBody from './components/MainBody';
import Footer from './components/Footer';
import SearchBreadcrumbs from './components/SearchBreadcrumbs';
import LaximoCatalogView from './components/LaximoCatalogView';
import CarPartsCatalogView from './components/CarPartsCatalogView';
import CarsGrid from './components/CarsGrid';
import ProductsGrid from './components/ProductsGrid';

// Импорт API
import { 
  getCarsByVin, 
  getPartsByCarId, 
  searchProductsStream, 
  getEntitiesByCode, 
  getCarsByNumber, 
  getCarCatalog,
  getUnitDetails 
} from './utils/api';

// Вспомогательная функция для рендера текста
const renderSafeText = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return value.name || value.id || '---';
  return String(value);
};

// Структурирование данных обычного каталога (по группам)
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
      key: `part-${index}-${part.code}`,
      position: index + 1 
    });
  });
  return tree;
};

function App({ searchType }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [themeMode, setThemeMode] = useState('light');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isArticleSearching, setIsArticleSearching] = useState(false);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [products, setProducts] = useState([]); 
  const [cars, setCars] = useState([]); 
  const [carParts, setCarParts] = useState(null); 
  const [laximoData, setLaximoData] = useState(null); 
  const [selectedSubGroup, setSelectedSubGroup] = useState(null);
  const [selectedCarInfo, setSelectedCarInfo] = useState(null);
  const [activePart, setActivePart] = useState(null);
  const [hoveredDetailCode, setHoveredDetailCode] = useState(null);
  const [selectedDetailCode, setSelectedDetailCode] = useState(null);
  const activeStream = useRef(null);
  const hasFirstArticleItem = useRef(false);
  const loadingStartRef = useRef(0);
  const loadingTimerRef = useRef(null);
  const MIN_SPINNER_MS = 900;

  const startLoadingTimer = () => {
    loadingStartRef.current = Date.now();
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
  };

  const stopWithMinDelay = (setter) => {
    const elapsed = Date.now() - loadingStartRef.current;
    const delay = Math.max(0, MIN_SPINNER_MS - elapsed);
    if (delay === 0) {
      setter(false);
      return;
    }
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    loadingTimerRef.current = setTimeout(() => {
      setter(false);
      loadingTimerRef.current = null;
    }, delay);
  };

  // Инициализация поиска из URL параметров (поддерживаем старые и новые имена параметров)
  useEffect(() => {
    const vinParam = searchParams.get('search_vin') || searchParams.get('vin');
    const plateParam = searchParams.get('search_plate_number') || searchParams.get('number');
    const articleParam = searchParams.get('search_article') || searchParams.get('article');

    if (vinParam) {
      setSearchQuery(vinParam);
      setSearchCategory('vin');
      handleUniversalSearch(vinParam);
    } else if (plateParam) {
      setSearchQuery(plateParam);
      setSearchCategory('plate_number');
      handleUniversalSearch(plateParam);
    } else if (articleParam) {
      setSearchQuery(articleParam);
      setSearchCategory('article');
      handleUniversalSearch(articleParam);
    }
  }, [searchParams]);

  const theme = useMemo(() => createTheme({
    palette: { 
      mode: themeMode,
      primary: { main: '#005387' }, 
      background: { default: themeMode === 'light' ? '#f4f7f9' : '#0a1016' }
    },
    typography: { fontFamily: '"Inter", sans-serif' },
    shape: { borderRadius: 12 }
  }), [themeMode]);

  const loadUnitDetails = async (unit) => {
    if (unit.details && unit.details.length > 0) return;
    setIsDetailsLoading(true);
    try {
      const unitSsd = unit.ssd || laximoData.ssd;
      const data = await getUnitDetails(laximoData.catalog, unit.id, unitSsd);
      const details = data.details || [];
      setLaximoData(prev => {
        if (!prev) return prev;
        const newCategories = prev.categories.map(cat => ({
          ...cat,
          units: cat.units.map(u => u.id === unit.id ? { ...u, details: details } : u)
        }));
        return { ...prev, categories: newCategories };
      });
      setSelectedSubGroup(prev => ({ ...prev, details: details }));
    } catch (err) {
      setError("Не удалось загрузить список деталей");
    } finally {
      setIsDetailsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSubGroup && laximoData?.catalog) {
      loadUnitDetails(selectedSubGroup);
    }
  }, [selectedSubGroup?.id]);

  useEffect(() => {
    setHoveredDetailCode(null);
    setSelectedDetailCode(null);
  }, [selectedSubGroup?.id]);

  const resetToHome = () => {
    setCarParts(null);
    setLaximoData(null);
    setSelectedCarInfo(null);
    setActivePart(null);
    setSelectedSubGroup(null);
    setHoveredDetailCode(null);
    setSelectedDetailCode(null);
    setProducts([]);
    setCars([]);
    setSearchQuery('');
    setSearchCategory(null);
    navigate('/');
    if (activeStream.current) activeStream.current.abort();
    ym('hit', '/');
  };

  const handleUniversalSearch = async (query) => {
    const term = query?.trim() || searchQuery.trim();
    if (!term) return;
    if (activeStream.current) activeStream.current.abort();
    
    setIsLoading(true);
    startLoadingTimer();
    setError(null);
    setSearchQuery(term);
    
    setProducts([]);
    setCars([]);
    setCarParts(null);
    setLaximoData(null);
      setSelectedCarInfo(null);
      setHoveredDetailCode(null);
      setSelectedDetailCode(null);

    ym('reachGoal', 'SEARCH_INIT', { query: term });

    const isVin = /^[A-HJ-NPR-Z0-9]{17}$/i.test(term);
    const isPlate = /^[A-ZА-Я]{1}\d{3}[A-ZА-Я]{2}\d{2,3}$/i.test(term.replace(/\s+/g, ''));

    try {
      if (isVin) {
        setIsArticleSearching(false);
        setSearchCategory('vin');
        navigate(`/search?vin=${encodeURIComponent(term)}`);
        const res = await getCarsByVin(term);
        const list = Array.isArray(res) ? res : (res.list || []);
        setCars(list);
        if (list.length === 0) {
          setError("Автомобиль по VIN не найден");
        }
        stopWithMinDelay(setIsLoading);
      } else if (isPlate) {
        setIsArticleSearching(false);
        setSearchCategory('plate_number');
        navigate(`/search?number=${encodeURIComponent(term)}`);
        const res = await getCarsByNumber(term);
        const list = Array.isArray(res) ? res : (res.list || []);
        setCars(list);
        if (list.length === 0) {
          setError("Автомобиль по гос. номеру не найден");
        }
        stopWithMinDelay(setIsLoading);
      } else {
        setSearchCategory('article');
        navigate(`/search?article=${encodeURIComponent(term)}`);
        hasFirstArticleItem.current = false;
        setIsArticleSearching(true);
        const stream = searchProductsStream(term, {
          onItem: (item) => {
            if (!hasFirstArticleItem.current) {
              hasFirstArticleItem.current = true;
              stopWithMinDelay(setIsArticleSearching);
            }
            setProducts(prev => {
              const groupKey = `${renderSafeText(item.brand)}-${renderSafeText(item.article)}`.toLowerCase().replace(/\s+/g, '');
              if (prev.find(p => p.groupKey === groupKey)) return prev;
              return [...prev, { 
                ...item, 
                internalId: groupKey, 
                groupKey, 
                warehouses: item.warehouses || [], 
                images: item.images || [] 
              }];
            });
          },
          onImages: (imageData) => {
            setProducts(prev => prev.map(p => {
              if (p.article === imageData.article) {
                return { ...p, images: imageData.images };
              }
              return p;
            }));
          },
          onDone: () => {
            stopWithMinDelay(setIsLoading);
            if (!hasFirstArticleItem.current) {
              stopWithMinDelay(setIsArticleSearching);
            }
          },
          onError: (err) => {
            setError(err.message);
            stopWithMinDelay(setIsLoading);
            stopWithMinDelay(setIsArticleSearching);
          }
        });
        activeStream.current = stream;
        await stream.start();
      }
    } catch (err) {
      setError(err.message);
      stopWithMinDelay(setIsLoading);
      stopWithMinDelay(setIsArticleSearching);
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
        const data = await getPartsByCarId(car.id || car.vehicleid);
        if (data?.list) setCarParts(structurePartsData(data.list));
      }
    } catch (err) { 
      setError("Не удалось загрузить данные каталога"); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const goToPrices = (code) => {
    if (!code) return;
    setCarParts(null); 
    setLaximoData(null);
    handleUniversalSearch(code);
  };

  const handleSelectDetailCode = (code) => {
    setSelectedDetailCode((prev) => (prev === code ? null : code));
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
          
          <SearchBreadcrumbs
            show={Boolean(selectedCarInfo || products.length > 0 || carParts || laximoData || cars.length > 0)}
            searchCategory={searchCategory}
            searchQuery={searchQuery}
            selectedCarInfo={selectedCarInfo}
            selectedSubGroup={selectedSubGroup}
            laximoData={laximoData}
            onReset={resetToHome}
          />

          {error && <ErrorMessage message={String(error)} onClose={() => setError(null)} />}

          {(isLoading && products.length === 0 && cars.length === 0) || (isArticleSearching && products.length === 0) ? (
            <LoadingSpinner />
          ) : laximoData ? (
            <LaximoCatalogView
              laximoData={laximoData}
              selectedSubGroup={selectedSubGroup}
              setSelectedSubGroup={setSelectedSubGroup}
              isDetailsLoading={isDetailsLoading}
              goToPrices={goToPrices}
              hoveredCode={hoveredDetailCode}
              selectedCode={selectedDetailCode}
              onHoverCode={setHoveredDetailCode}
              onSelectCode={handleSelectDetailCode}
            />
          ) : carParts ? (
            <CarPartsCatalogView
              carParts={carParts}
              selectedSubGroup={selectedSubGroup}
              setSelectedSubGroup={setSelectedSubGroup}
              activePart={activePart}
              handleArticleSelect={handleArticleSelect}
              goToPrices={goToPrices}
            />
          ) : cars.length > 0 ? (
            <CarsGrid cars={cars} onSelectCar={handleSelectCar} renderSafeText={renderSafeText} />
          ) : products.length > 0 ? (
            <ProductsGrid products={products} searchQuery={searchQuery} />
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
