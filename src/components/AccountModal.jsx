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
import { authorize, confirmEmail, createUser, passwordRecovery } from '../utils/api'

function AccountModal({ onClose }) {
  const navigate = useNavigate() // 2. Инициализируем навигацию
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [recoveryHash, setRecoveryHash] = useState('')
  const [message, setMessage] = useState({ text: '', color: 'primary' })
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('login')

  const showMsg = (text, color = 'primary') => setMessage({ text, color })

  // Функция для успешного завершения (сохранение токена и редирект)
  const handleSuccessAuth = (token) => {
    localStorage.setItem('authToken', token)
    window.dispatchEvent(new Event('auth-changed'))
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

  async function handleSendRecoveryCode() {
    if (!email) return showMsg('Введите email', 'error')
    setLoading(true)
    try {
      await confirmEmail({ email }, undefined, true)
      setCode('')
      setStep('recovery-confirm')
      showMsg('Код для восстановления отправлен на почту.')
    } catch (e) {
      showMsg(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmRecovery() {
    if (!code) return showMsg('Введите код из письма', 'error')
    setLoading(true)
    try {
      const result = await confirmEmail({ email }, code, true)
      const hash = result?.data?.hash
      if (!hash) return showMsg('Не удалось подтвердить код', 'error')
      setRecoveryHash(hash)
      setPassword('')
      setStep('recovery-password')
      showMsg('Код подтверждён. Придумайте новый пароль.')
    } catch (e) {
      showMsg(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handlePasswordRecovery() {
    if (!password) return showMsg('Введите новый пароль', 'error')
    setLoading(true)
    try {
      await passwordRecovery({ login: email, password }, recoveryHash)
      setCode('')
      setRecoveryHash('')
      setStep('login')
      showMsg('Пароль изменён. Теперь войдите с новым паролем.', 'primary')
    } catch (e) {
      showMsg(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      disablePortal
      transitionDuration={0}
    >
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
            disabled={step.startsWith('recovery')}
            fullWidth
            size="small"
          />
          {step !== 'recovery-confirm' && <TextField
            label={step === 'recovery-password' ? 'Новый пароль' : 'Пароль'}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            size="small"
          />}

          {step === 'login' ? (
            <Stack spacing={1}>
              <Button variant="contained" onClick={handleLogin} disabled={loading} fullWidth>
                {loading ? <CircularProgress size={24} /> : 'Войти'}
              </Button>
              <Button variant="outlined" onClick={handleSendCode} disabled={loading} fullWidth>
                Зарегистрироваться
              </Button>
              <Button variant="text" onClick={handleSendRecoveryCode} disabled={loading}>
                Забыли пароль?
              </Button>
            </Stack>
          ) : step === 'confirm' ? (
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
          ) : step === 'recovery-confirm' ? (
            <Stack spacing={2} sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
              <Typography variant="body2">Введите код из письма, чтобы подтвердить восстановление пароля.</Typography>
              <TextField label="Код из письма" value={code} onChange={(e) => setCode(e.target.value)} fullWidth size="small" />
              <Button variant="contained" onClick={handleConfirmRecovery} disabled={loading}>{loading ? <CircularProgress size={24} /> : 'Подтвердить код'}</Button>
              <Button size="small" onClick={() => setStep('login')} disabled={loading}>Назад</Button>
            </Stack>
          ) : (
            <Stack spacing={2} sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
              <Typography variant="body2">Укажите новый пароль для аккаунта.</Typography>
              <Button variant="contained" color="success" onClick={handlePasswordRecovery} disabled={loading}>{loading ? <CircularProgress size={24} /> : 'Сохранить новый пароль'}</Button>
              <Button size="small" onClick={() => setStep('login')} disabled={loading}>Назад</Button>
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
