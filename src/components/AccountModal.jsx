import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Stack,
  IconButton,
  CircularProgress,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import { authorize, confirmEmail, createUser } from '../utils/api'

function AccountModal({ onClose }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSendCode() {
    setLoading(true)
    setMessage(null)
    try {
      await confirmEmail({ login: email }, undefined, false)
      setMessage('Код отправлен на почту')
    } catch (e) {
      setMessage(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmCodeAndCreate() {
    setLoading(true)
    setMessage(null)
    try {
      await confirmEmail({ login: email }, code, false)
      const { token } = await createUser(undefined, { login: email, password })
      if (token) {
        localStorage.setItem('authToken', token)
        setMessage('Регистрация успешна')
        onClose?.()
      } else {
        setMessage('Регистрация: не получен токен')
      }
    } catch (e) {
      setMessage(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin() {
    setLoading(true)
    setMessage(null)
    try {
      const { token } = await authorize({ login: email, password })
      if (token) {
        localStorage.setItem('authToken', token)
        setMessage('Вход успешен')
        onClose?.()
      } else {
        setMessage('Вход: не получен токен')
      }
    } catch (e) {
      setMessage(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={true} onClose={onClose} maxWidth="xs" fullWidth>
      {/* HEADER */}
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <AccountCircleIcon fontSize="large" />
          <Stack spacing={0}>
            <Typography variant="h6">Личный кабинет</Typography>
            <Typography variant="body2" color="text.secondary">Вход / регистрация</Typography>
          </Stack>
        </Stack>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* BODY */}
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField
            label="Почта"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
          />
          <TextField
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
          />

          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={handleLogin} disabled={loading} fullWidth>
              {loading ? <CircularProgress size={20} /> : 'Войти'}
            </Button>
            <Button variant="outlined" onClick={handleSendCode} disabled={loading} fullWidth>
              Отправить код
            </Button>
          </Stack>

          <TextField
            label="Код из письма"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            fullWidth
          />

          <Button
            variant="contained"
            onClick={handleConfirmCodeAndCreate}
            disabled={loading}
            fullWidth
          >
            {loading ? <CircularProgress size={20} /> : 'Подтвердить и зарегистрировать'}
          </Button>

          {message && (
            <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
              {message}
            </Typography>
          )}
        </Stack>
      </DialogContent>

      {/* FOOTER */}
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Закрыть
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AccountModal
