import React, { useMemo } from 'react';
import {
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded';

const SearchBreadcrumbs = ({
  show,
  historyItems = [],
  currentLabel = '',
  onReset,
  onHistoryClick,
  onBack,
}) => {
  const crumbs = useMemo(() => {
    const list = [{ key: 'home', label: 'Главная', icon: <HomeRoundedIcon sx={{ fontSize: 16 }} />, clickable: true }];
    historyItems.forEach((item) => {
      list.push({
        key: item.id,
        label: item.label,
        icon: <DirectionsCarRoundedIcon sx={{ fontSize: 16 }} />,
        clickable: true,
        historyId: item.id,
      });
    });
    if (currentLabel) {
      list.push({
        key: 'current',
        label: currentLabel,
        icon: <TuneRoundedIcon sx={{ fontSize: 16 }} />,
        clickable: false,
      });
    }
    return list;
  }, [historyItems, currentLabel]);

  if (!show) return null;

  return (
    <Box
      sx={{
        mb: 2,
        px: 1.2,
        py: 1,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2.5,
        bgcolor: 'background.paper',
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }} useFlexGap>
        <Tooltip title="Назад">
          <span>
            <IconButton size="small" onClick={onBack} aria-label="Назад">
              <ArrowBackRoundedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          const clickable = Boolean(crumb.clickable);
          return (
            <React.Fragment key={crumb.key}>
              <Chip
                size="small"
                icon={crumb.icon}
                label={crumb.label}
                clickable={clickable}
                onClick={clickable ? () => {
                  if (crumb.key === 'home') {
                    onReset?.();
                    return;
                  }
                  if (crumb.historyId) {
                    onHistoryClick?.(crumb.historyId);
                  }
                } : undefined}
                color={isLast ? 'primary' : 'default'}
                variant={isLast ? 'filled' : 'outlined'}
                sx={{
                  maxWidth: { xs: 230, md: 320 },
                  '& .MuiChip-label': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  },
                }}
              />
              {!isLast && <ChevronRightRoundedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />}
            </React.Fragment>
          );
        })}
      </Stack>
    </Box>
  );
};

export default SearchBreadcrumbs;
