import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Stack,
  Button,
} from '@mui/material'

import CloseIcon from '@mui/icons-material/Close'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

function ImageModal({ images, productInfo, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const validImages = images.filter((img) => img && img.trim() !== '')

  if (validImages.length === 0) return null

  const nextImage = () => setCurrentIndex((prev) => (prev + 1) % validImages.length)
  const prevImage = () => setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length)
  const goToImage = (index) => setCurrentIndex(index)

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      {/* HEADER */}
      <DialogTitle
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}
      >
        <Typography variant="subtitle1" noWrap>
          {productInfo?.brand || ''} {productInfo?.article || ''} - {productInfo?.name || ''}
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* BODY */}
      <DialogContent
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          p: 2,
        }}
      >
        {/* IMAGE */}
        <Box
          component="img"
          src={validImages[currentIndex]}
          alt={productInfo?.name || 'Изображение'}
          sx={{
            maxHeight: 400,
            width: 'auto',
            maxWidth: '100%',
            objectFit: 'contain',
          }}
        />

        {validImages.length > 1 && (
          <>
            {/* NAVIGATION */}
            <Stack direction="row" spacing={2} mt={1}>
              <IconButton onClick={prevImage}>
                <ChevronLeftIcon />
              </IconButton>
              <IconButton onClick={nextImage}>
                <ChevronRightIcon />
              </IconButton>
            </Stack>

            {/* INDICATORS */}
            <Stack direction="row" spacing={1} mt={1}>
              {validImages.map((_, idx) => (
                <Button
                  key={idx}
                  size="small"
                  variant={idx === currentIndex ? 'contained' : 'outlined'}
                  onClick={() => goToImage(idx)}
                  sx={{ minWidth: 24, width: 24, height: 24, p: 0 }}
                />
              ))}
            </Stack>

            {/* COUNTER */}
            <Typography variant="caption" color="text.secondary" mt={1}>
              {currentIndex + 1} / {validImages.length}
            </Typography>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ImageModal
