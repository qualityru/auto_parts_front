import {
  Box,
  Typography,
  Button,
  Stack,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'

function EmptyState({ onExampleSearch }) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      textAlign="center"
      mt={8}
      px={2}
    >
      <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />

      <Typography variant="h5" gutterBottom>
        Запчасти не найдены
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        maxWidth={420}
        mb={3}
      >
        Попробуйте изменить поисковый запрос или проверьте правильность артикула
      </Typography>

      <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
        {['OC90', 'MOX100', '01218N3'].map(code => (
          <Button
            key={code}
            variant="outlined"
            size="small"
            onClick={() => onExampleSearch(code)}
          >
            {code}
          </Button>
        ))}
      </Stack>
    </Box>
  )
}

export default EmptyState
