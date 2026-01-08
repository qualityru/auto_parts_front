import {
  Box,
  TextField,
  IconButton,
  InputAdornment,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'

function SearchBar({ searchQuery, setSearchQuery, onSearch }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearch()
    }
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      mt={2}
    >
      <TextField
        fullWidth
        autoFocus
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Введите артикул запчасти (например: 01218N3, OC90, MOX100)"
        variant="outlined"
        autoComplete="off"
        sx={{ maxWidth: 600 }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                edge="end"
                color="primary"
                onClick={() => onSearch()}
              >
                <SearchIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </Box>
  )
}

export default SearchBar
