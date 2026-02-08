import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, CircularProgress, Fade, Typography } from '@mui/material';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

const SmartImage = ({
  src,
  imageMap = [],
  hoveredCode = null,
  selectedCode = null,
  onHoverCode,
  onSelectCode,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const imgRef = useRef(null);

  useEffect(() => {
    setIsLoaded(false);
    setNaturalSize({ width: 0, height: 0 });
    setDisplaySize({ width: 0, height: 0 });
  }, [src]);

  useEffect(() => {
    if (!imgRef.current) return undefined;

    const updateSize = () => {
      if (!imgRef.current) return;
      const rect = imgRef.current.getBoundingClientRect();
      setDisplaySize({ width: rect.width, height: rect.height });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [isLoaded]);

  const scaledMap = useMemo(() => {
    if (!naturalSize.width || !naturalSize.height || !displaySize.width || !displaySize.height) return [];
    const scaleX = displaySize.width / naturalSize.width;
    const scaleY = displaySize.height / naturalSize.height;

    return imageMap
      .map((item, index) => {
        const x1 = Number(item.x1);
        const x2 = Number(item.x2);
        const y1 = Number(item.y1);
        const y2 = Number(item.y2);
        if ([x1, x2, y1, y2].some((value) => Number.isNaN(value))) return null;

        return {
          key: `${item.code || 'code'}-${index}`,
          code: String(item.code || ''),
          left: Math.min(x1, x2) * scaleX,
          top: Math.min(y1, y2) * scaleY,
          width: Math.abs(x2 - x1) * scaleX,
          height: Math.abs(y2 - y1) * scaleY,
        };
      })
      .filter(Boolean);
  }, [imageMap, naturalSize, displaySize]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 300,
      }}
    >
      {!isLoaded && (
        <Box
          sx={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <CircularProgress size={40} thickness={4} />
          <Typography variant="caption" color="text.secondary">
            Загрузка изображения...
          </Typography>
        </Box>
      )}
      <Fade in={isLoaded} timeout={800}>
        <div
          style={{
            width: '100%',
            height: '100%',
            display: isLoaded ? 'flex' : 'none',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <Zoom>
              <img
                ref={imgRef}
                src={src}
                alt="деталь"
                onLoad={(event) => {
                  setIsLoaded(true);
                  setNaturalSize({
                    width: event.currentTarget.naturalWidth || 0,
                    height: event.currentTarget.naturalHeight || 0,
                  });
                }}
                style={{
                  maxWidth: '100%',
                  maxHeight: '65vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  cursor: 'zoom-in',
                  display: 'block',
                }}
              />
            </Zoom>
            {scaledMap.length > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: displaySize.width,
                  height: displaySize.height,
                  pointerEvents: 'none',
                }}
              >
                {scaledMap.map((item) => {
                  const isActive = item.code === hoveredCode || item.code === selectedCode;
                  return (
                    <Box
                      key={item.key}
                      onMouseEnter={() => onHoverCode?.(item.code)}
                      onMouseLeave={() => onHoverCode?.(null)}
                      onClick={() => onSelectCode?.(item.code)}
                      sx={{
                        position: 'absolute',
                        left: item.left,
                        top: item.top,
                        width: item.width,
                        height: item.height,
                        border: isActive ? '2px solid #1928f3' : '2px solid #fbc02d',
                        backgroundColor: isActive ? 'rgba(47, 63, 211, 0.15)' : 'rgba(251, 192, 45, 0.08)',
                        boxSizing: 'border-box',
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                        transition: 'border-color 150ms ease, background-color 150ms ease',
                      }}
                    />
                  );
                })}
              </Box>
            )}
          </Box>
        </div>
      </Fade>
    </Box>
  );
};

export default SmartImage;
