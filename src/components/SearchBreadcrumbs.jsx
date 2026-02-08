import React from 'react';
import { Breadcrumbs, Link, Typography } from '@mui/material';

const SearchBreadcrumbs = ({
  show,
  searchCategory,
  searchQuery,
  selectedCarInfo,
  selectedSubGroup,
  laximoData,
  onReset,
}) => {
  if (!show) return null;

  return (
    <Breadcrumbs sx={{ mb: 2, bgcolor: 'background.paper', p: '8px 16px', borderRadius: 2 }}>
      <Link component="button" variant="body2" onClick={onReset} underline="hover" color="inherit">
        Главная
      </Link>

      {searchCategory === 'vin' && (
        <Typography variant="body2" color="primary" sx={{ fontWeight: 700 }}>
          Поиск по VIN: {searchQuery}
        </Typography>
      )}

      {searchCategory === 'plate_number' && (
        <Typography variant="body2" color="primary" sx={{ fontWeight: 700 }}>
          Поиск по гос. номеру: {searchQuery}
        </Typography>
      )}

      {searchCategory === 'article' && (
        <Typography variant="body2" color="primary" sx={{ fontWeight: 700 }}>
          Поиск по артикулу: {searchQuery}
        </Typography>
      )}

      {selectedCarInfo && !searchCategory && (
        <Typography variant="body2" color="primary" sx={{ fontWeight: 700 }}>
          {selectedCarInfo.brand} {selectedCarInfo.model}
        </Typography>
      )}

      {selectedSubGroup && laximoData && (
        <Typography variant="body2" color="primary" sx={{ fontWeight: 700 }}>
          {selectedSubGroup.name}
        </Typography>
      )}
    </Breadcrumbs>
  );
};

export default SearchBreadcrumbs;
