import { Box, Container, Grid, Typography, Link, Divider, Stack } from '@mui/material';

const Footer = () => {
  return (
    <Box sx={{ bgcolor: 'background.paper', pt: 6, pb: 4, mt: 'auto', borderTop: '1px solid', borderColor: 'divider' }}>
      <Container maxWidth="xl">
        <Grid container spacing={4} justifyContent="space-between">
          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontWeight="800" color="primary" gutterBottom>
              BOGTAR
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ваш надежный партнер в мире автозапчастей. Мы предлагаем широкий ассортимент деталей для любых марок автомобилей.
            </Typography>
          </Grid>
          <Grid item xs={6} md={2}>
            <Typography variant="subtitle1" fontWeight="700" gutterBottom>Покупателям</Typography>
            <Stack spacing={1}>
              <Link href="#" underline="hover" color="inherit" variant="body2">Доставка</Link>
              <Link href="#" underline="hover" color="inherit" variant="body2">Оплата</Link>
              <Link href="#" underline="hover" color="inherit" variant="body2">Возврат</Link>
            </Stack>
          </Grid>
          <Grid item xs={6} md={2}>
            <Typography variant="subtitle1" fontWeight="700" gutterBottom>Компания</Typography>
            <Stack spacing={1}>
              <Link href="#" underline="hover" color="inherit" variant="body2">О нас</Link>
              <Link href="#" underline="hover" color="inherit" variant="body2">Контакты</Link>
              <Link href="#" underline="hover" color="inherit" variant="body2">Партнерам</Link>
            </Stack>
          </Grid>
        </Grid>
        <Divider sx={{ my: 4 }} />
        <Typography variant="body2" color="text.secondary" align="center">
          © {new Date().getFullYear()} BogTar. Все права защищены.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;