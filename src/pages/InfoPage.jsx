import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Container,
  CssBaseline,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded';
import AssignmentReturnRoundedIcon from '@mui/icons-material/AssignmentReturnRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import PhoneInTalkRoundedIcon from '@mui/icons-material/PhoneInTalkRounded';
import HandshakeRoundedIcon from '@mui/icons-material/HandshakeRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

const PAGE_CONTENT = {
  delivery: {
    title: 'Доставка',
    subtitle: 'Логистика BOGTAR: от выбора склада до отслеживания поставки в одном интерфейсе.',
    icon: <LocalShippingRoundedIcon sx={{ fontSize: 32 }} />,
    accent: '#0c7be7',
    quickFacts: ['Онлайн-трекинг статусов', 'Сроки по каждому складу', 'Пункты выдачи и курьер'],
    sections: [
      { title: 'Сроки', items: ['Срок рассчитывается по складу поставщика.', 'В карточке товара показывается ближайшая доступная дата.', 'После оформления отслеживание доступно в личном кабинете.'] },
      { title: 'Способы', items: ['Курьер по городу.', 'Самовывоз из пункта выдачи.', 'Транспортные компании для регионов.'] },
      { title: 'Важно', items: ['Срок может измениться, если поставщик обновит остатки.', 'Для заказных позиций возможна предоплата.', 'Уточняйте точный интервал поставки у менеджера.'] },
    ],
  },
  payment: {
    title: 'Оплата',
    subtitle: 'Гибкие платежные сценарии для частных клиентов, СТО и корпоративных закупок.',
    icon: <CreditCardRoundedIcon sx={{ fontSize: 32 }} />,
    accent: '#0d63c8',
    quickFacts: ['Карты, СБП, безнал', 'Оплата для юрлиц по счету', 'Автоматическая отправка чека'],
    sections: [
      { title: 'Для физлиц', items: ['Оплата картой онлайн.', 'СБП и банковские переводы.', 'Оплата при получении для доступных заказов.'] },
      { title: 'Для юрлиц', items: ['Безналичный расчет по счету.', 'Закрывающие документы в полном комплекте.', 'Работа по договору на регулярные поставки.'] },
      { title: 'Безопасность', items: ['Платежи проходят через защищенные каналы.', 'Реквизиты карты не хранятся на нашей стороне.', 'Чек отправляется автоматически после подтверждения оплаты.'] },
    ],
  },
  returns: {
    title: 'Возврат',
    subtitle: 'Прозрачная политика возвратов: условия отображаются заранее в карточке товара.',
    icon: <AssignmentReturnRoundedIcon sx={{ fontSize: 32 }} />,
    accent: '#0b6ca8',
    quickFacts: ['Условия по поставщику', 'Сценарии без возврата отмечены', 'Заявка оформляется онлайн'],
    sections: [
      { title: 'Когда возврат возможен', items: ['Если позиция не была в установке.', 'Сохранен товарный вид и упаковка.', 'Соблюден срок подачи заявки на возврат.'] },
      { title: 'Когда возврат ограничен', items: ['Позиции под заказ.', 'Электрика и спецтовары по условиям поставщика.', 'Товары из групп с отметкой "без возврата".'] },
      { title: 'Как оформить', items: ['Откройте заказ в профиле.', 'Создайте заявку с причиной возврата.', 'Дождитесь подтверждения и инструкции по отправке.'] },
    ],
  },
  about: {
    title: 'О нас',
    subtitle: 'BOGTAR объединяет поставщиков и клиентов в единой цифровой платформе автозапчастей.',
    icon: <BusinessRoundedIcon sx={{ fontSize: 32 }} />,
    accent: '#0a5fa0',
    quickFacts: ['Поиск по VIN/артикулу', 'Сравнение сроков и цен', 'Работаем с B2C и B2B'],
    sections: [
      { title: 'Чем занимаемся', items: ['Собираем предложения с разных поставщиков в одном интерфейсе.', 'Показываем аналоги и оригинальные позиции.', 'Помогаем быстро сравнивать сроки и цены.'] },
      { title: 'Подход', items: ['Ставка на прозрачность данных в карточках товара.', 'Автоматизация поиска по VIN, артикулу и госномеру.', 'Поддержка клиентов на каждом этапе заказа.'] },
      { title: 'Для кого', items: ['Автовладельцы.', 'СТО и сервисные центры.', 'Магазины автозапчастей и корпоративные клиенты.'] },
    ],
  },
  contacts: {
    title: 'Контакты',
    subtitle: 'Команда BOGTAR на связи по всем вопросам подбора, поставки и сотрудничества.',
    icon: <PhoneInTalkRoundedIcon sx={{ fontSize: 32 }} />,
    accent: '#0072a8',
    quickFacts: ['Поддержка: Пн-Пт 09:00-20:00', 'Отдел продаж для опта', 'Быстрая обратная связь'],
    sections: [
      { title: 'Клиентская поддержка', items: ['Телефон: +7 (800) 000-00-00', 'Email: support@bogtar.ru', 'Режим: Пн-Пт 09:00-20:00 (МСК)'] },
      { title: 'Отдел продаж', items: ['Телефон: +7 (495) 000-00-00', 'Email: sales@bogtar.ru', 'Работа с оптовыми и корпоративными заказами.'] },
      { title: 'Реквизиты', items: ['ООО «БОГТАР»', 'ИНН/КПП: 0000000000 / 000000000', 'Юр. адрес: Россия, Москва'] },
    ],
  },
  partners: {
    title: 'Партнерам',
    subtitle: 'Подключайтесь к BOGTAR: новые продажи, автоматизация и расширение клиентской базы.',
    icon: <HandshakeRoundedIcon sx={{ fontSize: 32 }} />,
    accent: '#006aa1',
    quickFacts: ['Интеграция прайсов через API', 'Персональные условия сотрудничества', 'Аналитика по заказам'],
    sections: [
      { title: 'Для поставщиков', items: ['Интеграция остатков и прайсов через API.', 'Повышение оборачиваемости складских позиций.', 'Прозрачная аналитика по заказам.'] },
      { title: 'Для СТО и магазинов', items: ['Персональные условия и отсрочка.', 'Быстрый подбор с фильтрацией по срокам/возврату.', 'Поддержка менеджера для регулярных закупок.'] },
      { title: 'Как начать', items: ['Оставьте заявку на подключение.', 'Согласуем схему интеграции.', 'Запустим тестовый период и выйдем в прод.'] },
    ],
  },
};

function InfoPage({ pageKey }) {
  const navigate = useNavigate();
  const page = PAGE_CONTENT[pageKey] || PAGE_CONTENT.about;
  const [searchQuery, setSearchQuery] = useState('');
  const [themeMode, setThemeMode] = useState('light');

  const theme = useMemo(() => createTheme({
    palette: {
      mode: themeMode,
      primary: { main: '#005387' },
      background: { default: themeMode === 'light' ? '#f4f7f9' : '#0a1016' },
    },
    typography: { fontFamily: '"Inter", sans-serif' },
    shape: { borderRadius: 12 },
  }), [themeMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box display="flex" flexDirection="column" minHeight="100vh">
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearch={(term) => navigate(`/search?article=${encodeURIComponent(term || searchQuery)}`)}
          onHome={() => navigate('/')}
          themeMode={themeMode}
          onToggleTheme={() => setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'))}
        />

        <Container maxWidth="xl" sx={{ mt: 3, pb: 6, flex: 1 }}>
          <Box
            sx={{
              position: 'relative',
              borderRadius: 5,
              overflow: 'hidden',
              mb: 2,
              border: '1px solid',
              borderColor: 'divider',
              background: themeMode === 'light'
                ? 'linear-gradient(130deg, #0c5ca8 0%, #1a83ea 58%, #4cb0ff 100%)'
                : 'linear-gradient(130deg, #113a5e 0%, #18598f 58%, #1d6aa8 100%)',
            }}
          >
            <Box sx={{ position: 'absolute', right: -120, top: -100, width: 320, height: 320, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.12)' }} />
            <Box sx={{ position: 'absolute', left: -80, bottom: -120, width: 250, height: 250, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.09)' }} />

            <Grid container spacing={2} sx={{ position: 'relative', p: { xs: 2, md: 3 } }}>
              <Grid item xs={12} md={8}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.2 }}>
                  <Box sx={{ display: 'inline-flex', color: '#fff' }}>{page.icon}</Box>
                  <Chip
                    size="small"
                    label="BOGTAR INFO"
                    sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.45)' }}
                    variant="outlined"
                  />
                </Stack>
                <Typography variant="h3" sx={{ color: '#fff', fontWeight: 900, lineHeight: 1.1, mb: 1 }}>
                  {page.title}
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', maxWidth: 760 }}>
                  {page.subtitle}
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    border: '1px solid rgba(255,255,255,0.3)',
                    bgcolor: 'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(6px)',
                    color: '#fff',
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Ключевые моменты</Typography>
                  <Stack spacing={0.8}>
                    {page.quickFacts.map((fact) => (
                      <Stack key={fact} direction="row" spacing={0.8} alignItems="center">
                        <CheckCircleRoundedIcon sx={{ fontSize: 16 }} />
                        <Typography variant="body2">{fact}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          <Grid container spacing={2}>
            {page.sections.map((section, index) => (
              <Grid item xs={12} md={4} key={section.title}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    minHeight: 250,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    transition: 'transform .2s ease, box-shadow .2s ease, border-color .2s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: themeMode === 'light'
                        ? '0 14px 30px rgba(21, 80, 132, 0.12)'
                        : '0 14px 30px rgba(0, 0, 0, 0.28)',
                      borderColor: page.accent,
                    },
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.2 }}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 900,
                        fontSize: 13,
                        color: '#fff',
                        bgcolor: page.accent,
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {section.title}
                    </Typography>
                  </Stack>
                  <Stack spacing={1}>
                    {section.items.map((item) => (
                      <Stack key={item} direction="row" spacing={1} alignItems="flex-start">
                        <CheckCircleRoundedIcon sx={{ mt: '2px', fontSize: 16, color: page.accent, flexShrink: 0 }} />
                        <Typography variant="body2" color="text.secondary">{item}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Paper
            elevation={0}
            sx={{
              mt: 2,
              p: { xs: 2, md: 2.5 },
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              background: themeMode === 'light'
                ? `linear-gradient(135deg, ${page.accent}18, #ffffff)`
                : `linear-gradient(135deg, ${page.accent}22, #101820)`,
            }}
          >
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between">
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>Нужна консультация по этой теме?</Typography>
                <Typography variant="body2" color="text.secondary">
                  Напишите нам, и мы поможем подобрать лучшее решение под ваш сценарий.
                </Typography>
              </Box>
              <Button
                component={RouterLink}
                to="/contacts"
                variant="contained"
                endIcon={<ArrowForwardRoundedIcon />}
                sx={{ borderRadius: 2.5, px: 2.2, textTransform: 'none', fontWeight: 800 }}
              >
                Связаться
              </Button>
            </Stack>
          </Paper>
        </Container>

        <Footer />
      </Box>
    </ThemeProvider>
  );
}

export default InfoPage;
