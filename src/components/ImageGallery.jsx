import React from 'react';
import { Box, Typography } from '@mui/material';
// Импорт Swiper компонентов и стилей
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';

// Обязательные стили Swiper
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

/**
 * Стилизация кнопок Swiper под MUI (опционально)
 * Swiper использует CSS-переменные для темизации
 */
const swiperStyles = {
  "--swiper-navigation-size": "20px",
  "--swiper-navigation-color": "#1976d2",
  "--swiper-pagination-color": "#1976d2",
  "width": "100%",
  "height": "100%",
};

function ImageGallery({ images }) {
  const validImages = images?.filter((img) => img && img.trim() !== '') || [];

  if (validImages.length === 0) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height={200}
        bgcolor="#f5f7fa"
        borderRadius={2}
      >
        <Typography variant="body2" color="text.secondary">
          Нет фото
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', position: 'relative', height: 250 }}>
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={0}
        slidesPerView={1}
        navigation={validImages.length > 1} // Показываем стрелки только если фото > 1
        pagination={validImages.length > 1 ? { clickable: true } : false}
        style={swiperStyles}
      >
        {validImages.map((src, idx) => (
          <SwiperSlide key={idx}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                height: '100%',
                bgcolor: '#f5f7fa'
              }}
            >
              <Box
                component="img"
                src={src}
                alt={`Product Image ${idx}`}
                sx={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/400x300?text=Error';
                }}
              />
            </Box>
          </SwiperSlide>
        ))}
      </Swiper>
    </Box>
  );
}

export default ImageGallery;