import {
  Box,
  CircularProgress,
  Typography,
} from '@mui/material'
import { keyframes } from '@mui/system'

const spin = keyframes`
  to { transform: rotate(360deg); }
`

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
`

const shimmer = keyframes`
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
`

function LoadingSpinner() {
  return (
    <Box
      sx={{
        position: 'relative',
        display: 'grid',
        placeItems: 'center',
        minHeight: { xs: '40vh', md: '48vh' },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'grid',
          placeItems: 'center',
          animation: `${float} 3.5s ease-in-out infinite`,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: 92,
            height: 92,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '2px solid',
              borderColor: 'divider',
              opacity: 0.6,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 8,
              borderRadius: '50%',
              border: '3px solid transparent',
              borderTopColor: 'primary.main',
              borderRightColor: 'primary.light',
              animation: `${spin} 1.2s linear infinite`,
              filter: 'drop-shadow(0 0 12px rgba(0, 83, 135, 0.35))',
            }}
          />
          <CircularProgress
            size={42}
            thickness={5}
            sx={{ color: 'primary.main' }}
          />
        </Box>

      </Box>
    </Box>
  )
}

export default LoadingSpinner
