import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
// import { getProfile } from './utils/api';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = ({ children }) => {
  const [isAuth, setIsAuth] = useState(null); // null - загрузка, true/false - результат

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsAuth(false);
        return;
      }

    //   try {
    //     await getProfile(); // Проверяем токен на сервере
    //     setIsAuth(true);
    //   } catch (err) {
    //     console.error("Токен невалиден или протух");
    //     localStorage.removeItem('authToken'); // Стираем протухший токен
    //     setIsAuth(false);
    //   }
    };
    checkAuth();
  }, []);

  if (isAuth === null) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return isAuth ? children : <Navigate to="/" replace />;
};

export default ProtectedRoute;