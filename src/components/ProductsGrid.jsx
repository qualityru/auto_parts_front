import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import ProductCard from './ProductCard';

const ProductsGrid = ({ products, searchQuery }) => (
  <Box>
    <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>
      Предложения: {searchQuery}
    </Typography>
    <Grid container spacing={2}>
      {products.map((product) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={product.internalId}>
          <ProductCard
            product={product}
            onAddToCart={() => {}}
            isItemInCart={() => false}
            onOpenImageModal={() => {}}
          />
        </Grid>
      ))}
    </Grid>
  </Box>
);

export default ProductsGrid;
