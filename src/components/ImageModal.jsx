import { useState } from 'react'

function ImageModal({ images, productInfo, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const validImages = images.filter(img => img && img.trim() !== '')
  
  if (validImages.length === 0) return null
  
  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % validImages.length)
  }
  
  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length)
  }
  
  const goToImage = (index) => {
    setCurrentIndex(index)
  }

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            {productInfo?.brand || ''} {productInfo?.article || ''} - {productInfo?.name || ''}
          </div>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          <div className="modal-slides" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
            {validImages.map((src, idx) => (
              <div key={idx} className="modal-slide">
                <img src={src} alt={productInfo?.name || 'Изображение'} />
              </div>
            ))}
          </div>
          
          {validImages.length > 1 && (
            <>
              <div className="modal-nav">
                <button className="modal-nav-btn" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button className="modal-nav-btn" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
              
              <div className="modal-indicators">
                {validImages.map((_, idx) => (
                  <div
                    key={idx}
                    className={`modal-indicator ${idx === currentIndex ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); goToImage(idx); }}
                  ></div>
                ))}
              </div>
              
              <div className="modal-counter">
                {currentIndex + 1} / {validImages.length}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImageModal  // Добавьте эту строку