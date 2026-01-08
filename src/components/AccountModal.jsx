import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom' // 1. Импортируем хук навигации
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
  const navigate = useNavigate() // 2. Инициализируем навигацию
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [message, setMessage] = useState({ text: '', color: 'primary' })
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('login')

  const showMsg = (text, color = 'primary') => setMessage({ text, color })

  // Функция для успешного завершения (сохранение токена и редирект)
  const handleSuccessAuth = (token) => {
    localStorage.setItem('authToken', token)
    onClose?.() // Закрываем модалку
    navigate('/profile') // 3. Перенаправляем на страницу профиля
  }

  async function handleSendCode() {
    if (!email) return showMsg('Введите email', 'error')
    setLoading(true)
    try {
      await confirmEmail({ email }, undefined, false)
      setStep('confirm')
      showMsg('Код отправлен на почту.')
    } catch (e) {
      showMsg(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmAndRegister() {
    if (!code) return showMsg('Введите код', 'error')
    setLoading(true)
    try {
      const confirmRes = await confirmEmail({ email }, code, false)
      const hash = confirmRes?.data?.hash

      if (hash) {
        // Передаем только login и password, как того требует ваш API
        const { token } = await createUser(hash, { login: email, password })
        if (token) {
          handleSuccessAuth(token)
        }
      } else {
        showMsg('Ошибка: хэш подтверждения не получен', 'error')
      }
    } catch (e) {
      showMsg(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin() {
    if (!email || !password) return showMsg('Заполните все поля', 'error')
    setLoading(true)
    try {
      const { token } = await authorize({ login: email, password })
      if (token) {
        handleSuccessAuth(token)
      } else {
        showMsg('Ошибка: токен не получен', 'error')
      }
    } catch (e) {
      showMsg(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={true} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <AccountCircleIcon fontSize="large" color="primary" />
          <Typography variant="h6">Аккаунт</Typography>
        </Stack>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            size="small"
          />

          {step === 'login' ? (
            <Stack spacing={1}>
              <Button variant="contained" onClick={handleLogin} disabled={loading} fullWidth>
                {loading ? <CircularProgress size={24} /> : 'Войти'}
              </Button>
              <Button variant="outlined" onClick={handleSendCode} disabled={loading} fullWidth>
                Зарегистрироваться
              </Button>
            </Stack>
          ) : (
            <Stack spacing={2} sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
              <TextField
                label="Код из письма"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                fullWidth
                size="small"
              />
              <Button variant="contained" color="success" onClick={handleConfirmAndRegister} disabled={loading}>
                Подтвердить регистрацию
              </Button>
              <Button size="small" onClick={() => setStep('login')}>Назад</Button>
            </Stack>
          )}

          {message.text && (
            <Typography variant="body2" color={message.color === 'error' ? 'error.main' : 'primary.main'} textAlign="center">
              {message.text}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Закрыть</Button>
      </DialogActions>
    </Dialog>
  )
}

export default AccountModal