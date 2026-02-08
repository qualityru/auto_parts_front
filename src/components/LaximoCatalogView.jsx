import React from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import SmartImage from './SmartImage';

const LaximoCatalogView = ({
  laximoData,
  selectedSubGroup,
  setSelectedSubGroup,
  isDetailsLoading,
  goToPrices,
  hoveredCode,
  selectedCode,
  onHoverCode,
  onSelectCode,
}) => {
  const imageMap = selectedSubGroup?.details?.flatMap((detail, index) => {
    const code = String(detail.codeonimage || index + 1);
    return (detail.image_map || []).map((mapItem, mapIndex) => ({
      ...mapItem,
      code: String(mapItem.code || code),
      key: `${code}-${mapIndex}`,
    }));
  }) || [];

  return (
    <Grid container spacing={1.5} wrap="nowrap" sx={{ overflowX: 'auto' }}>
      <Grid item xs={2} sx={{ minWidth: '220px', maxWidth: '280px', flexShrink: 0 }}>
        <Stack spacing={0.5} sx={{ maxHeight: '78vh', overflowY: 'auto', pr: 1 }}>
          {laximoData.categories?.map((cat) => (
            <Accordion key={cat.id} disableGutters elevation={0} sx={{ bgcolor: 'transparent', borderBottom: '1px solid #eee' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: '1rem' }} />}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', lineHeight: 1.2 }}>{cat.name}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <List dense disablePadding>
                  {cat.units?.map((unit) => (
                    <ListItem
                      button
                      key={unit.id}
                      onClick={() => setSelectedSubGroup(unit)}
                      selected={selectedSubGroup?.id === unit.id}
                      sx={{ py: 0.4, pl: 2 }}
                    >
                      <ListItemText primary={unit.name} primaryTypographyProps={{ fontSize: '0.7rem', lineHeight: 1.1 }} />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      </Grid>

    <Grid item xs={7} sx={{ minWidth: '500px', flexGrow: 1 }}>
      <Paper variant="outlined" sx={{ p: 2, height: '78vh', display: 'flex', flexDirection: 'column', borderRadius: 4, bgcolor: '#fff' }}>
        {selectedSubGroup ? (
          <>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, fontSize: '0.85rem' }}>{selectedSubGroup.name}</Typography>
            <Divider sx={{ mb: 1.5 }} />
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <SmartImage
                key={selectedSubGroup.id}
                src={selectedSubGroup.image}
                imageMap={imageMap}
                hoveredCode={hoveredCode}
                selectedCode={selectedCode}
                onHoverCode={onHoverCode}
                onSelectCode={onSelectCode}
              />
            </Box>
          </>
        ) : (
          <Typography align="center" sx={{ mt: 4 }}>Выберите узел</Typography>
        )}
      </Paper>
    </Grid>

    <Grid item xs={3} sx={{ minWidth: '280px', maxWidth: '350px', flexShrink: 0 }}>
      {selectedSubGroup && (
        <TableContainer component={Paper} variant="outlined" sx={{ height: '78vh', borderRadius: 3 }}>
          {isDetailsLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 10, gap: 2 }}>
              <CircularProgress size={30} />
              <Typography variant="caption">Загрузка деталей...</Typography>
            </Box>
          ) : (
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>№ / Деталь</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedSubGroup.details?.map((detail, idx) => {
                  const code = String(detail.codeonimage || idx + 1);
                  const isSelected = code === selectedCode;
                  return (
                  <TableRow
                    key={idx}
                    hover
                    selected={isSelected}
                    sx={{ cursor: 'pointer' }}
                    onMouseEnter={() => onHoverCode?.(code)}
                    onMouseLeave={() => onHoverCode?.(null)}
                    onClick={() => onSelectCode?.(code)}
                  >
                    <TableCell sx={{ py: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography sx={{ fontWeight: 800, color: 'text.disabled', minWidth: 24, fontSize: '0.7rem' }}>
                          {detail.codeonimage || idx + 1}
                        </Typography>
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.75rem' }}>{detail.oem || '---'}</Typography>
                          <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>{detail.name}</Typography>
                        </Box>
                        {detail.oem && (
                          <IconButton
                            size="small"
                            component="a"
                            href={`/search?article=${encodeURIComponent(detail.oem)}`}
                            color="primary"
                            onClick={(event) => {
                              if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                              event.preventDefault();
                              event.stopPropagation();
                              goToPrices(detail.oem);
                            }}
                          >
                            <SearchIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
                })}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      )}
    </Grid>
  </Grid>
  );
};

export default LaximoCatalogView;
