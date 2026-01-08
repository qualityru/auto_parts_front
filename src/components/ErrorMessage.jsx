import {
  Alert,
  AlertTitle,
  IconButton,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

function ErrorMessage({ message, onClose }) {
  return (
    <Alert
      severity="error"
      sx={{ mb: 2 }}
      action={
        <IconButton
          aria-label="close"
          color="inherit"
          size="small"
          onClick={onClose}
        >
          <CloseIcon fontSize="inherit" />
        </IconButton>
      }
    >
      <AlertTitle>Произошла ошибка</AlertTitle>
      {message}
    </Alert>
  )
}

export default ErrorMessage
