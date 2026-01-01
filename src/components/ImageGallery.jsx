import React, { useState, useEffect, useRef } from 'react';

function ImageGallery({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slidesRef = useRef(null);

  const validImages = images.filter(img => img && img.trim() !== '');
  
  if (validImages.length === 0) {
    return (
      <div className="no-image">
        <i className="fas fa-camera-slash"></i>
        <span>Изображение отсутствует</span>
      </div>
    );
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % validImages.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (slidesRef.current) {
      const translateX = -currentIndex * 100;
      slidesRef.current.style.transform = `translateX(${translateX}%)`;
    }
  }, [currentIndex]);

  return (
    <div className="gallery-container">
      <div className="gallery-slides" ref={slidesRef}>
        {validImages.map((src, index) => (
          <div key={index} className="gallery-slide">
            <img src={src} alt={`Изображение ${index + 1}`} />
          </div>
        ))}
      </div>
      
      {validImages.length > 1 && (
        <>
          <div className="gallery-nav">
            <button className="nav-btn" onClick={(e) => { e.stopPropagation(); prevSlide(); }}>
              <i className="fas fa-chevron-left"></i>
            </button>
            <button className="nav-btn" onClick={(e) => { e.stopPropagation(); nextSlide(); }}>
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
          
          <div className="image-indicators">
            {validImages.map((_, index) => (
              <div
                key={index}
                className={`indicator ${index === currentIndex ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); goToSlide(index); }}
              ></div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default ImageGallery;