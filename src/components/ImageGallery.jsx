import React, { useState, useEffect, useRef } from 'react';

function ImageGallery({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const slidesRef = useRef(null);

  // Минимальное расстояние в пикселях для срабатывания свайпа
  const minSwipeDistance = 50;

  const validImages = images.filter(img => img && img.trim() !== '');
  
  if (validImages.length === 0) return <div>Нет фото</div>;

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % validImages.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);

  // Обработка начала касания
  const onTouchStart = (e) => {
    setTouchEnd(null); // сброс в начале
    setTouchStart(e.targetTouches[0].clientX);
  };

  // Обработка движения
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  // Обработка завершения касания
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  useEffect(() => {
    if (slidesRef.current) {
      slidesRef.current.style.transform = `translateX(-${currentIndex * 100}%)`;
    }
  }, [currentIndex]);

  return (
    <div 
      className="gallery-container"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ touchAction: 'pan-y' }} // Важно: разрешает вертикальную прокрутку страницы, но ловит горизонтальные свайпы
    >
      <div className="gallery-slides" ref={slidesRef} style={{ display: 'flex', transition: 'transform 0.3s ease-out' }}>
        {validImages.map((src, index) => (
          <div key={index} className="gallery-slide" style={{ minWidth: '100%' }}>
            <img src={src} alt={`Slide ${index}`} style={{ pointerEvents: 'none' }} />
          </div>
        ))}
      </div>
      
      {/* Кнопки навигации оставляем без изменений */}
      {validImages.length > 1 && (
        <div className="gallery-nav">
           <button onClick={prevSlide}>←</button>
           <button onClick={nextSlide}>→</button>
        </div>
      )}
    </div>
  );
}

export default ImageGallery;