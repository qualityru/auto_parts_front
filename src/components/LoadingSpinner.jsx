import {
  Box,
  CircularProgress,
  Typography,
} from '@mui/material'

function LoadingSpinner() {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      py={6}
    >
      <CircularProgress size={48} />

      <Typography
        variant="body1"
        color="text.secondary"
        mt={2}
      >
        Ищем запчасти в каталогах поставщиков...
      </Typography>
    </Box>
  )
}

export default LoadingSpinner
