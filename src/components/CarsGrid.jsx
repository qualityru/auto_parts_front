import React from 'react';
import { Card, CardContent, Grid, Typography } from '@mui/material';

const CarsGrid = ({ cars, onSelectCar, renderSafeText }) => (
  <Grid container spacing={2}>
    {cars.map((car) => (
      <Grid item xs={12} sm={4} key={car.id || car.vehicleid}>
        <Card
          variant="outlined"
          sx={{ cursor: 'pointer', borderRadius: 4, '&:hover': { borderColor: 'primary.main', boxShadow: 2 } }}
          onClick={() => onSelectCar(car)}
        >
          <CardContent>
            <Typography fontWeight={800} color="primary" variant="h6">
              {renderSafeText(car.brand)} {renderSafeText(car.name || car.model)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Год: {renderSafeText(car.manufactured || car.year)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Двиг: {renderSafeText(car.engine || car.engine_code)}
            </Typography>
            {car.vin && (
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                VIN: {car.vin}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

export default CarsGrid;
