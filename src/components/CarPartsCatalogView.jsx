import React from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Divider,
  Grid,
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
import SmartImage from './SmartImage';

const CarPartsCatalogView = ({
  carParts,
  selectedSubGroup,
  setSelectedSubGroup,
  activePart,
  handleArticleSelect,
  goToPrices,
}) => (
  <Grid container spacing={1.5} wrap="nowrap" sx={{ overflowX: 'auto' }}>
    <Grid item xs={2} sx={{ minWidth: '220px', maxWidth: '280px', flexShrink: 0 }}>
      <Stack spacing={0.5} sx={{ maxHeight: '78vh', overflowY: 'auto', pr: 1 }}>
        {Object.entries(carParts).map(([id, group]) => (
          <Accordion key={id} disableGutters sx={{ bgcolor: 'transparent' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.75rem' }}>{group.name}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <List dense>
                {Object.entries(group.subGroups).map(([sid, sub]) => (
                  <ListItem
                    button
                    key={sid}
                    onClick={() => setSelectedSubGroup(sub)}
                    selected={selectedSubGroup?.name === sub.name}
                  >
                    <ListItemText primary={sub.name} primaryTypographyProps={{ fontSize: '0.7rem' }} />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>
    </Grid>

    <Grid item xs={7} sx={{ flexGrow: 1 }}>
      <Paper variant="outlined" sx={{ p: 2, height: '78vh', borderRadius: 4 }}>
        {activePart ? (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              {activePart.code} — {activePart.name}
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ flex: 1 }}>
              <SmartImage src={activePart.images?.[0]} />
            </Box>
            <Button variant="contained" onClick={() => goToPrices(activePart.code)} sx={{ mt: 1 }}>
              Найти цены
            </Button>
          </Box>
        ) : (
          <Typography align="center" sx={{ mt: 4 }}>Выберите деталь</Typography>
        )}
      </Paper>
    </Grid>

    <Grid item xs={3} sx={{ minWidth: '280px' }}>
      {selectedSubGroup && (
        <TableContainer component={Paper} variant="outlined" sx={{ height: '78vh' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>№ / Деталь</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedSubGroup.parts?.map((part) => (
                <TableRow key={part.key} hover onClick={() => handleArticleSelect(part)} sx={{ cursor: 'pointer' }}>
                  <TableCell sx={{ py: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography sx={{ fontWeight: 800, color: 'text.disabled', minWidth: 24, fontSize: '0.7rem' }}>
                        {part.position}
                      </Typography>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.75rem' }}>{part.code}</Typography>
                        <Typography sx={{ fontSize: '0.65rem' }}>{part.name}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Grid>
  </Grid>
);

export default CarPartsCatalogView;
