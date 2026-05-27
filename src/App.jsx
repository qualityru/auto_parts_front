import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Box, Container, CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { YMInitializer } from 'react-yandex-metrika';
import ym from 'react-yandex-metrika';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

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
import { useCart } from './hooks/useCart';

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

const normalizeArticle = (value) => String(value ?? '').trim();

const mergeImages = (prevImages = [], nextImages = []) => {
  const all = [...prevImages, ...nextImages];
  const unique = [];
  const seen = new Set();

  all.forEach((img) => {
    const normalized = typeof img === 'string' ? img.trim() : '';
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    unique.push(normalized);
  });

  return unique;
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
  const location = useLocation();
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
  const [breadcrumbHistory, setBreadcrumbHistory] = useState([]);
  const {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    isItemInCart,
    refreshCart,
  } = useCart();
  const activeStream = useRef(null);
  const hasFirstArticleItem = useRef(false);
  const loadingStartRef = useRef(0);
  const loadingTimerRef = useRef(null);
  const isRestoringRef = useRef(false);
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

  const findUnitById = (data, unitId) => {
    if (!data?.categories?.length || !unitId) return null;
    for (const cat of data.categories) {
      const unit = cat.units?.find((item) => String(item.id) === String(unitId));
      if (unit) return unit;
    }
    return null;
  };

  const restoreCatalogFromParams = async ({ catalog, vehicleId, ssd, unitId, detailCode }) => {
    if (!catalog || !vehicleId || !ssd) return;
    setIsLoading(true);
    setError(null);
    setSearchCategory(null);
    setSearchQuery('');
    setCars([]);
    setCarParts(null);
    setProducts([]);
    setSelectedCarInfo({ id: vehicleId, brand: '', model: '', full: null });

    try {
      if (!laximoData || laximoData.catalog !== catalog || laximoData.ssd !== ssd) {
        const data = await getCarCatalog(catalog, vehicleId, ssd);
        setLaximoData(data);
        const unit = findUnitById(data, unitId) || data.categories?.[0]?.units?.[0] || null;
        if (unit) setSelectedSubGroup(unit);
      } else if (unitId) {
        const unit = findUnitById(laximoData, unitId);
        if (unit) setSelectedSubGroup(unit);
      }

      setSelectedDetailCode(detailCode || null);
    } catch (err) {
      setError('Не удалось загрузить данные каталога');
    } finally {
      setIsLoading(false);
    }
  };

  // Инициализация поиска из URL параметров (поддерживаем старые и новые имена параметров)
  useEffect(() => {
    const vinParam = searchParams.get('search_vin') || searchParams.get('vin');
    const plateParam = searchParams.get('search_plate_number') || searchParams.get('number');
    const articleParam = searchParams.get('search_article') || searchParams.get('article');
    const catalogParam = searchParams.get('catalog');
    const vehicleParam = searchParams.get('vehicleId');
    const ssdParam = searchParams.get('ssd');
    const unitParam = searchParams.get('unit');
    const detailParam = searchParams.get('detail');

    if (catalogParam && vehicleParam && ssdParam) {
      isRestoringRef.current = true;
      restoreCatalogFromParams({
        catalog: catalogParam,
        vehicleId: vehicleParam,
        ssd: ssdParam,
        unitId: unitParam,
        detailCode: detailParam,
      }).finally(() => {
        isRestoringRef.current = false;
      });
      return;
    }

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
    setBreadcrumbHistory([]);
    navigate('/');
    if (activeStream.current) activeStream.current.abort();
    ym('hit', '/');
  };

  const cloneSnapshotValue = (value) => {
    if (value === null || value === undefined) return value;
    return JSON.parse(JSON.stringify(value));
  };

  const buildStateSnapshot = () => ({
    searchCategory,
    searchQuery,
    products: cloneSnapshotValue(products),
    cars: cloneSnapshotValue(cars),
    carParts: cloneSnapshotValue(carParts),
    laximoData: cloneSnapshotValue(laximoData),
    selectedSubGroup: cloneSnapshotValue(selectedSubGroup),
    selectedCarInfo: cloneSnapshotValue(selectedCarInfo),
    activePart: cloneSnapshotValue(activePart),
    hoveredDetailCode,
    selectedDetailCode,
    path: location.pathname,
    query: location.search,
  });

  const applyStateSnapshot = (snapshot) => {
    if (!snapshot) return;
    if (activeStream.current) activeStream.current.abort();

    setError(null);
    setIsLoading(false);
    setIsArticleSearching(false);
    setSearchCategory(snapshot.searchCategory ?? null);
    setSearchQuery(snapshot.searchQuery ?? '');
    setProducts(snapshot.products || []);
    setCars(snapshot.cars || []);
    setCarParts(snapshot.carParts || null);
    setLaximoData(snapshot.laximoData || null);
    setSelectedSubGroup(snapshot.selectedSubGroup || null);
    setSelectedCarInfo(snapshot.selectedCarInfo || null);
    setActivePart(snapshot.activePart || null);
    setHoveredDetailCode(snapshot.hoveredDetailCode || null);
    setSelectedDetailCode(snapshot.selectedDetailCode || null);

    const nextPath = snapshot.path || '/';
    const nextQuery = snapshot.query || '';
    const target = `${nextPath}${nextQuery}`;
    const current = `${location.pathname}${location.search}`;
    if (target !== current) {
      navigate(target, { replace: false });
    }
  };

  const pushBreadcrumbCheckpoint = (label) => {
    const snapshot = buildStateSnapshot();
    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label,
      snapshot,
    };
    setBreadcrumbHistory((prev) => [...prev, item].slice(-8));
  };

  const restoreBreadcrumbCheckpoint = (index) => {
    if (index < 0 || index >= breadcrumbHistory.length) return;
    const target = breadcrumbHistory[index];
    applyStateSnapshot(target.snapshot);
    setBreadcrumbHistory((prev) => prev.slice(0, index));
  };

  const getCurrentCrumbLabel = () => {
    if (laximoData && selectedSubGroup) return `Узел: ${selectedSubGroup.name || '—'}`;
    if (carParts && activePart) return `Деталь: ${activePart.code || activePart.name || '—'}`;
    if (carParts && selectedSubGroup) return `Группа: ${selectedSubGroup.name || '—'}`;
    if (selectedCarInfo) return `${selectedCarInfo.brand || ''} ${selectedCarInfo.model || ''}`.trim() || 'Автомобиль';
    if (cars.length > 0) return `Автомобили: ${cars.length}`;
    if (products.length > 0) return `Результаты: ${searchQuery || 'Артикул'}`;
    if (searchCategory && searchQuery) return `Поиск: ${searchQuery}`;
    return '';
  };

  const handleBreadcrumbBack = () => {
    if (selectedDetailCode) {
      setSelectedDetailCode(null);
      return;
    }

    if (laximoData && selectedSubGroup) {
      setSelectedSubGroup(null);
      return;
    }

    if (carParts && activePart) {
      setActivePart(null);
      return;
    }

    if (carParts && selectedSubGroup) {
      setSelectedSubGroup(null);
      return;
    }

    if ((laximoData || carParts) && selectedCarInfo) {
      setLaximoData(null);
      setCarParts(null);
      setSelectedSubGroup(null);
      setActivePart(null);
      setSelectedDetailCode(null);
      if (selectedCarInfo.full) {
        setCars([selectedCarInfo.full]);
      }
      return;
    }

    if (breadcrumbHistory.length > 0) {
      restoreBreadcrumbCheckpoint(breadcrumbHistory.length - 1);
      return;
    }

    if (products.length > 0 || cars.length > 0 || searchCategory) {
      resetToHome();
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    resetToHome();
  };

  const handleUniversalSearch = async (query, options = {}) => {
    const term = query?.trim() || searchQuery.trim();
    if (!term) return;
    if (activeStream.current) activeStream.current.abort();

    const currentContextLabel = getCurrentCrumbLabel();
    const hasMeaningfulContext = Boolean(
      selectedCarInfo || selectedSubGroup || laximoData || carParts || activePart || products.length > 0 || cars.length > 0
    );
    if (!options.skipCheckpoint && currentContextLabel && hasMeaningfulContext) {
      pushBreadcrumbCheckpoint(currentContextLabel);
    }
    
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
              if (normalizeArticle(p.article) === normalizeArticle(imageData.article)) {
                return { ...p, images: mergeImages(p.images, imageData.images) };
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
    const contextLabel = getCurrentCrumbLabel();
    if (contextLabel) {
      pushBreadcrumbCheckpoint(contextLabel);
    }
    setCarParts(null); 
    setLaximoData(null);
    handleUniversalSearch(code, { skipCheckpoint: true });
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

  useEffect(() => {
    if (isRestoringRef.current) return;
    if (!laximoData?.catalog || !selectedSubGroup?.id) return;

    const params = new URLSearchParams();
    params.set('catalog', laximoData.catalog);
    params.set('vehicleId', selectedCarInfo?.id || '');
    params.set('ssd', laximoData.ssd || '');
    params.set('unit', selectedSubGroup.id);
    if (selectedDetailCode) params.set('detail', selectedDetailCode);

    if (!params.get('vehicleId') || !params.get('ssd')) return;

    navigate(
      {
        pathname: location.pathname || '/',
        search: `?${params.toString()}`,
      },
      { replace: false }
    );
  }, [laximoData?.catalog, laximoData?.ssd, selectedSubGroup?.id, selectedDetailCode, selectedCarInfo?.id, location.pathname, navigate]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <YMInitializer accounts={[106429227]} options={{ webvisor: true }} version="2" />
      <Box display="flex" flexDirection="column" minHeight="100vh">
        <Header 
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          onSearch={() => handleUniversalSearch()} themeMode={themeMode}
          onHome={resetToHome}
          onToggleTheme={() => setThemeMode(t => t === 'light' ? 'dark' : 'light')}
          cartItems={cart}
          onRemoveItem={removeFromCart}
          onUpdateQuantity={updateQuantity}
          onClearCart={clearCart}
          getCartTotal={getCartTotal}
          onOrderCreated={refreshCart}
        />
        <Container maxWidth="xl" sx={{ mt: 3, flex: 1, pb: 6 }}>
          
          <SearchBreadcrumbs
            show={Boolean(
              breadcrumbHistory.length > 0
              || selectedCarInfo
              || products.length > 0
              || carParts
              || laximoData
              || cars.length > 0
              || Boolean(searchCategory && searchQuery)
              || isLoading
              || isArticleSearching
            )}
            historyItems={breadcrumbHistory.map((item) => ({ id: item.id, label: item.label }))}
            currentLabel={getCurrentCrumbLabel()}
            onHistoryClick={(id) => {
              const index = breadcrumbHistory.findIndex((item) => item.id === id);
              if (index >= 0) restoreBreadcrumbCheckpoint(index);
            }}
            onReset={resetToHome}
            onBack={handleBreadcrumbBack}
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
            <ProductsGrid
              products={products}
              searchQuery={searchQuery}
              onAddToCart={addToCart}
              isItemInCart={isItemInCart}
            />
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
