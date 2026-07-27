import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Slider,
  Checkbox,
  ListItemText,
} from '@mui/material';
import ProductCard from './ProductCard';

const getReturnInfo = (warehouse) => {
  const info = warehouse.supplier_info?.original_data || {};
  const returnType = info.return_type || {};
  const returnTypeName = String(returnType.name || '').toLowerCase();
  const returnTypeId = String(returnType.id || '');
  const armtekDays = Number(info.RETDAYS);
  const backDays = Number(info.back_days);
  const backPercent = Number(info.back_percent);

  if (returnTypeId === '3' || returnTypeName.includes('невозмож') || backPercent === -1) return false;
  if (returnTypeId && returnTypeId !== '3') return true;
  if (returnTypeName.includes('возмож')) return true;
  return (armtekDays > 0) || (backDays > 0);
};

const parseDateValue = (value) => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const date = new Date(`${raw}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (/^\d{2}\.\d{2}\.\d{4}/.test(raw)) {
    const [day, month, year] = raw.slice(0, 10).split('.');
    const date = new Date(`${year}-${month}-${day}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (/^\d{14}$/.test(raw)) {
    const year = raw.slice(0, 4);
    const month = raw.slice(4, 6);
    const day = raw.slice(6, 8);
    const date = new Date(`${year}-${month}-${day}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
};

const getDeliveryMetric = (warehouse) => {
  const directDays = Number(warehouse.delivery_days);
  if (!Number.isNaN(directDays) && directDays > 0) return directDays;

  const startDate = parseDateValue(warehouse.delivery_date_start);
  const endDate = parseDateValue(warehouse.delivery_date_end);
  const target = startDate || endDate;
  if (!target) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
};

const getWarehouseSupplierName = (warehouse) => {
  const candidates = [
    warehouse.supplier,
    warehouse.supplier_name,
    warehouse.supplier_info?.name,
    warehouse.supplier_info?.original_data?.supplier_name,
    warehouse.supplier_info?.original_data?.supplier_code,
  ];
  return candidates.find((value) => typeof value === 'string' && value.trim()) || null;
};

const getPriceValue = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;

  const normalized = value
    .trim()
    .replace(/\s+/g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');
  if (!normalized) return null;

  const price = Number(normalized);
  return Number.isFinite(price) ? price : null;
};

// Артикулы поставщиков могут отличаться только разделителями: 123-45, 123 45 и 12345.
// Такие варианты считаются одним точным совпадением для приоритета выдачи.
const normalizeArticleForMatch = (value) => String(value ?? '')
  .trim()
  .toLocaleUpperCase('ru')
  .replace(/[\s-]+/g, '');

const isExactArticleMatch = (product, searchQuery) => {
  const requestedArticle = normalizeArticleForMatch(searchQuery);
  if (!requestedArticle) return false;

  const productArticles = [
    product.article,
    ...(Array.isArray(product.articles) ? product.articles : []),
    ...(Array.isArray(product.warehouses)
      ? product.warehouses.map((warehouse) => warehouse.sourceProduct?.article)
      : []),
  ];

  return productArticles.some((article) => normalizeArticleForMatch(article) === requestedArticle);
};

const getNameGroup = (product) => {
  const label = String(product.name ?? '').trim().replace(/\s+/g, ' ') || 'Без названия';
  return {
    key: product.groupKey || (label === 'Без названия' ? '__unnamed_product__' : label.toLocaleLowerCase('ru')),
    label,
  };
};

const getProductMetrics = (product) => {
  const warehouses = Array.isArray(product.warehouses) ? product.warehouses : [];
  const suppliers = new Set();

  if (typeof product.supplier === 'string' && product.supplier.trim()) {
    suppliers.add(product.supplier.trim());
  }
  warehouses.forEach((warehouse) => {
    const warehouseSupplier = getWarehouseSupplierName(warehouse);
    if (warehouseSupplier) suppliers.add(warehouseSupplier);
  });

  const supplierList = suppliers.size > 0 ? [...suppliers] : ['Без поставщика'];

  const prices = warehouses
    .map((warehouse) => getPriceValue(warehouse.price))
    .filter((price) => price !== null);
  const minPrice = prices.length ? Math.min(...prices) : null;

  const minDelivery = warehouses.length
    ? Math.min(...warehouses.map((w) => getDeliveryMetric(w)))
    : 0;

  const hasReturn = warehouses.some((w) => getReturnInfo(w));

  return {
    suppliers: supplierList,
    primarySupplier: supplierList[0],
    minPrice,
    minDelivery,
    hasReturn,
  };
};

const ProductsGrid = ({ products, searchQuery, onAddToCart, isItemInCart }) => {
  const preparedProducts = useMemo(
    () => products.map((product) => ({ product, metrics: getProductMetrics(product) })),
    [products],
  );

  const suppliers = useMemo(() => {
    const counts = new Map();
    preparedProducts.forEach(({ metrics }) => {
      metrics.suppliers.forEach((supplier) => {
        counts.set(supplier, (counts.get(supplier) || 0) + 1);
      });
    });
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }, [preparedProducts]);
  const supplierNames = useMemo(
    () => suppliers.map((supplier) => supplier.name),
    [suppliers],
  );

  const nameGroups = useMemo(() => {
    const groups = new Map();
    preparedProducts.forEach(({ product }) => {
      const group = getNameGroup(product);
      const existing = groups.get(group.key);
      groups.set(group.key, {
        ...group,
        count: (existing?.count || 0) + (product.groupItemCount || 1),
      });
    });
    return [...groups.values()].sort((a, b) => (
      b.count - a.count || a.label.localeCompare(b.label, 'ru')
    ));
  }, [preparedProducts]);

  const maxPrice = useMemo(
    () => Math.max(1, ...preparedProducts.map((item) => item.metrics.minPrice ?? 0)),
    [preparedProducts],
  );

  const maxDelivery = useMemo(
    () => Math.max(1, ...preparedProducts.map((item) => item.metrics.minDelivery)),
    [preparedProducts],
  );

  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [hiddenNameGroups, setHiddenNameGroups] = useState([]);
  const [isAllSuppliersMode, setIsAllSuppliersMode] = useState(true);
  const [returnFilter, setReturnFilter] = useState('all');
  const [priceRange, setPriceRange] = useState([0, maxPrice]);
  const [deliveryRange, setDeliveryRange] = useState([0, maxDelivery]);
  const [sortBy, setSortBy] = useState('priceAsc');
  const selectedNameGroupKeys = nameGroups
    .filter((group) => !hiddenNameGroups.includes(group.key))
    .map((group) => group.key);
  const allNameGroupsSelected = nameGroups.length > 0 && selectedNameGroupKeys.length === nameGroups.length;
  const someNameGroupsSelected = !allNameGroupsSelected && selectedNameGroupKeys.length > 0;

  const resetFilters = () => {
    setIsAllSuppliersMode(true);
    setSelectedSuppliers(supplierNames);
    setHiddenNameGroups([]);
    setReturnFilter('all');
    setSortBy('priceAsc');
    setPriceRange([0, maxPrice]);
    setDeliveryRange([0, maxDelivery]);
  };

  useEffect(() => {
    if (supplierNames.length === 0) {
      setSelectedSuppliers([]);
      setIsAllSuppliersMode(true);
      return;
    }
    if (isAllSuppliersMode) {
      setSelectedSuppliers(supplierNames);
      return;
    }
    setSelectedSuppliers((prev) => prev.filter((supplier) => supplierNames.includes(supplier)));
  }, [supplierNames, isAllSuppliersMode]);

  useEffect(() => {
    setHiddenNameGroups([]);
  }, [searchQuery]);

  useEffect(() => {
    setPriceRange((prev) => [Math.min(prev[0], maxPrice), maxPrice]);
  }, [maxPrice]);

  useEffect(() => {
    setDeliveryRange((prev) => [Math.min(prev[0], maxDelivery), maxDelivery]);
  }, [maxDelivery]);

  const normalizedPriceRange = useMemo(
    () => [Math.min(priceRange[0], maxPrice), Math.min(priceRange[1], maxPrice)],
    [priceRange, maxPrice],
  );

  const normalizedDeliveryRange = useMemo(
    () => [Math.min(deliveryRange[0], maxDelivery), Math.min(deliveryRange[1], maxDelivery)],
    [deliveryRange, maxDelivery],
  );

  const filteredAndSorted = useMemo(() => {
    const filtered = preparedProducts.filter(({ product, metrics }) => {
      const nameMatch = !hiddenNameGroups.includes(getNameGroup(product).key);
      const supplierMatch = isAllSuppliersMode
        || selectedSuppliers.length === 0
        || selectedSuppliers.some((supplier) => metrics.suppliers.includes(supplier));

      const returnMatch = returnFilter === 'all'
        || (returnFilter === 'possible' && metrics.hasReturn)
        || (returnFilter === 'not_possible' && !metrics.hasReturn);

      const priceMatch = metrics.minPrice === null
        || (metrics.minPrice >= normalizedPriceRange[0] && metrics.minPrice <= normalizedPriceRange[1]);
      const deliveryMatch = metrics.minDelivery >= normalizedDeliveryRange[0] && metrics.minDelivery <= normalizedDeliveryRange[1];

      return nameMatch && supplierMatch && returnMatch && priceMatch && deliveryMatch;
    });

    const sorted = [...filtered].sort((a, b) => {
      // Оригинал, точно соответствующий запросу, всегда показываем раньше заменителей.
      // Только внутри каждой из этих групп применяется выбранная сортировка.
      const exactMatchDifference = Number(isExactArticleMatch(b.product, searchQuery))
        - Number(isExactArticleMatch(a.product, searchQuery));
      if (exactMatchDifference) return exactMatchDifference;

      switch (sortBy) {
        case 'priceDesc':
          if (a.metrics.minPrice === null) return 1;
          if (b.metrics.minPrice === null) return -1;
          return b.metrics.minPrice - a.metrics.minPrice;
        case 'deliveryAsc':
          return a.metrics.minDelivery - b.metrics.minDelivery;
        case 'deliveryDesc':
          return b.metrics.minDelivery - a.metrics.minDelivery;
        case 'supplierAsc':
          return a.metrics.primarySupplier.localeCompare(b.metrics.primarySupplier, 'ru');
        case 'supplierDesc':
          return b.metrics.primarySupplier.localeCompare(a.metrics.primarySupplier, 'ru');
        case 'return':
          return Number(b.metrics.hasReturn) - Number(a.metrics.hasReturn);
        case 'priceAsc':
        default:
          if (a.metrics.minPrice === null) return 1;
          if (b.metrics.minPrice === null) return -1;
          return a.metrics.minPrice - b.metrics.minPrice;
      }
    });

    return sorted;
  }, [
    preparedProducts,
    selectedSuppliers,
    hiddenNameGroups,
    returnFilter,
    normalizedPriceRange,
    normalizedDeliveryRange,
    sortBy,
    isAllSuppliersMode,
    searchQuery,
  ]);

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          p: 1.25,
          mb: 1.25,
          borderRadius: 2.5,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gap: 1,
            alignItems: 'center',
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              md: 'minmax(180px, 1.1fr) minmax(180px, 1.1fr) minmax(140px, 0.9fr) minmax(170px, 1.1fr) minmax(170px, 1.1fr) auto',
            },
          }}
        >
          <FormControl size="small" sx={{ minWidth: 0 }}>
            <InputLabel id="name-filter-label">Наименование</InputLabel>
            <Select
              labelId="name-filter-label"
              multiple
              value={selectedNameGroupKeys}
              onChange={(event) => {
                const selected = typeof event.target.value === 'string'
                  ? event.target.value.split(',')
                  : event.target.value;
                if (selected.includes('__all_name_groups__')) {
                  setHiddenNameGroups(allNameGroupsSelected ? nameGroups.map((group) => group.key) : []);
                  return;
                }
                setHiddenNameGroups(nameGroups
                  .map((group) => group.key)
                  .filter((key) => !selected.includes(key)));
              }}
              input={<OutlinedInput label="Наименование" />}
              renderValue={(selected) => selected.length === nameGroups.length ? 'Все наименования' : `Выбрано: ${selected.length}`}
              MenuProps={{ PaperProps: { sx: { maxHeight: 360, minWidth: 340 } } }}
            >
              <MenuItem value="__all_name_groups__">
                <Checkbox
                  size="small"
                  checked={allNameGroupsSelected}
                  indeterminate={someNameGroupsSelected}
                />
                <ListItemText primary="Все наименования" secondary={`Всего: ${nameGroups.length}`} />
              </MenuItem>
              {nameGroups.map(({ key, label, count }) => (
                <MenuItem
                  key={key}
                  value={key}
                >
                  <Checkbox size="small" checked={!hiddenNameGroups.includes(key)} />
                  <ListItemText primary={label} secondary={`Товаров: ${count}`} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 0, '& .MuiSelect-select': { whiteSpace: 'nowrap', textOverflow: 'ellipsis' } }}>
            <InputLabel id="sort-by-label">Сортировка</InputLabel>
            <Select
              labelId="sort-by-label"
              value={sortBy}
              label="Сортировка"
              onChange={(e) => setSortBy(e.target.value)}
              renderValue={(value) => {
                const labels = {
                  priceAsc: 'Цена: по возрастанию',
                  priceDesc: 'Цена: по убыванию',
                  deliveryAsc: 'Срок: быстрее',
                  deliveryDesc: 'Срок: дольше',
                  return: 'Сначала с возвратом',
                };
                return labels[value] || 'Сортировка';
              }}
            >
              <MenuItem value="priceAsc">Цена: по возрастанию</MenuItem>
              <MenuItem value="priceDesc">Цена: по убыванию</MenuItem>
              <MenuItem value="deliveryAsc">Срок: быстрее</MenuItem>
              <MenuItem value="deliveryDesc">Срок: дольше</MenuItem>
              <MenuItem value="return">Сначала с возвратом</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 0, '& .MuiSelect-select': { whiteSpace: 'nowrap', textOverflow: 'ellipsis' } }}>
            <InputLabel id="return-filter-label">Возврат</InputLabel>
            <Select
              labelId="return-filter-label"
              value={returnFilter}
              label="Возврат"
              onChange={(e) => setReturnFilter(e.target.value)}
            >
              <MenuItem value="all">Любой</MenuItem>
              <MenuItem value="possible">Возможен</MenuItem>
              <MenuItem value="not_possible">Без возврата</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ minWidth: 0, px: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              Цена: {normalizedPriceRange[0]}-{normalizedPriceRange[1]} ₽
            </Typography>
            <Slider
              value={normalizedPriceRange}
              onChange={(_, value) => {
                if (Array.isArray(value)) setPriceRange(value);
              }}
              valueLabelDisplay="auto"
              min={0}
              max={maxPrice}
              step={1}
              size="small"
            />
          </Box>

          <Box sx={{ minWidth: 0, px: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              Срок: {normalizedDeliveryRange[0]}-{normalizedDeliveryRange[1]} дн.
            </Typography>
            <Slider
              value={normalizedDeliveryRange}
              onChange={(_, value) => {
                if (Array.isArray(value)) setDeliveryRange(value);
              }}
              valueLabelDisplay="auto"
              min={0}
              max={maxDelivery}
              step={1}
              size="small"
            />
          </Box>

          <Button
            variant="outlined"
            size="small"
            onClick={resetFilters}
            sx={{
              minWidth: { xs: '100%', md: 124 },
              height: 40,
              textTransform: 'none',
              fontWeight: 700,
            }}
          >
            Сбросить
          </Button>
        </Box>
      </Paper>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 2,
          justifyContent: { xs: 'center', xl: 'stretch' },
        }}
      >
        {filteredAndSorted.map(({ product }) => (
          <Box key={product.internalId} sx={{ display: 'flex', justifyContent: 'center' }}>
            <ProductCard
              product={product}
              searchQuery={searchQuery}
              onAddToCart={onAddToCart}
              isItemInCart={isItemInCart}
            />
          </Box>
        ))}
      </Box>
      {filteredAndSorted.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            mt: 2,
            p: 3,
            borderRadius: 3,
            textAlign: 'center',
            border: '1px dashed',
            borderColor: 'divider',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            По текущим фильтрам ничего не найдено. Измените параметры фильтрации.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ProductsGrid;
