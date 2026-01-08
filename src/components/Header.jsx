import {
  Box,
  Container,
  Typography,
  Stack,
} from '@mui/material'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'

function Header() {
  return (
    <Box
      component="header"
      sx={{
        py: 4,
        background: 'linear-gradient(135deg, #1976d2, #0d47a1)',
        color: 'white',
      }}
    >
      <Container maxWidth="lg">
        <Stack
          spacing={1}
          alignItems="center"
          textAlign="center"
        >
          <DirectionsCarIcon sx={{ fontSize: 48 }} />

          <Typography variant="h4" fontWeight={700}>
            AutoParts Pro
          </Typography>

          <Typography
            variant="subtitle1"
            sx={{ opacity: 0.85 }}
          >
            Поиск автозапчастей по артикулу
          </Typography>
        </Stack>
      </Container>
    </Box>
  )
}

export default Header
