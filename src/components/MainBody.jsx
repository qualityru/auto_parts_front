import { Box, Typography, Grid, Paper, Stack, Container, Button } from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SpeedIcon from '@mui/icons-material/Speed';
import ShieldMoonIcon from '@mui/icons-material/ShieldMoon';

const features = [
  { 
    icon: <SpeedIcon sx={{ fontSize: 40, color: '#00d2ff' }} />, 
    title: 'Мгновенный поиск', 
    desc: 'Находим детали по миллионам складов за доли секунды.' 
  },
  { 
    icon: <AutoFixHighIcon sx={{ fontSize: 40, color: '#9d50bb' }} />, 
    title: 'Умные кроссы', 
    desc: 'Автоматически подбираем проверенные аналоги и заменители.' 
  },
  { 
    icon: <ShieldMoonIcon sx={{ fontSize: 40, color: '#3a7bd5' }} />, 
    title: 'Безопасность', 
    desc: 'Проверка поставщиков и гарантия возврата средств.' 
  },
];

const MainBody = ({ onExampleSearch }) => {
  return (
    <Box sx={{ py: { xs: 4, md: 8 } }}>
      {/* Hero Section */}
      <Box sx={{ textAlign: 'center', mb: 10 }}>
        <Typography 
          variant="h2" 
          fontWeight="900" 
          sx={{ 
            background: 'linear-gradient(90deg, #1976d2, #9c27b0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
            letterSpacing: '-0.02em'
          }}
        >
          Будущее поиска запчастей
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto', mb: 4 }}>
          Профессиональная экосистема для подбора деталей. Быстро, точно, надежно.
        </Typography>
      </Box>

      {/* Features Grid */}
      <Grid container spacing={4}>
        {features.map((f, i) => (
          <Grid item xs={12} md={4} key={i}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 4, 
                height: '100%', 
                borderRadius: 5,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxEquadow: '0 12px 30px rgba(0,0,0,0.1)'
                }
              }}
            >
              <Box sx={{ mb: 2 }}>{f.icon}</Box>
              <Typography variant="h6" fontWeight="800" gutterBottom>{f.title}</Typography>
              <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
                {f.desc}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default MainBody;