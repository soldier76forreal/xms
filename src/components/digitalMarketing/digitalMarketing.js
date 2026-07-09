import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import MovieIcon from '@mui/icons-material/Movie';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useTheme } from '@mui/material/styles';
import { usePermissions } from '../../contextApi/PermissionContext';
import RawContentSection from './rawContentSection';
import ReadyToUploadSection from './readyToUploadSection';

// Phase 8 — Digital Marketing. Two sub-sections: Raw Contents (batch upload +
// real-time chat with the creator + status pipeline) and Ready to Upload
// (created only via a raw content's status toggle). Same dark/opacity shell
// as CRM/MIS/Inventory; both list views are timeline-styled per spec.
export default function DigitalMarketing() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { can } = usePermissions();

  const [tab, setTab] = useState('rawContent');   // 'rawContent' | 'readyToUpload'

  const T = {
    APP_BG:   isDark ? '#060606' : theme.palette.background.default,
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    CTRL_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  };

  if (!can('digitalMarketing:view')) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', p: 4 }}>
        <Typography sx={{ fontSize: '0.85rem', color: T.TEXT_TER }}>
          You don't have permission to view Digital Marketing
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: T.APP_BG, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1,
        bgcolor: isDark ? '#0d0d0d' : 'background.paper', borderBottom: `1px solid ${T.BD}`, flexShrink: 0 }}>
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: T.TEXT_PRI, flexShrink: 0 }}>
          Digital Marketing
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, bgcolor: T.CTRL_BG, borderRadius: '9px',
          p: '3px', border: `1px solid ${T.BD}`, flexShrink: 0, ml: 1 }}>
          {[
            { id: 'rawContent',    Icon: MovieIcon,       label: 'Raw Contents' },
            { id: 'readyToUpload', Icon: CloudUploadIcon, label: 'Ready to Upload' },
          ].map(({ id, Icon, label }) => (
            <Button key={id} size="small" onClick={() => setTab(id)}
              startIcon={<Icon sx={{ fontSize: 14 }} />}
              sx={{ minWidth: 0, height: 26, px: 1.25, py: 0, borderRadius: '7px',
                fontSize: '0.72rem', fontWeight: tab === id ? 700 : 400, textTransform: 'none',
                color: tab === id ? T.TEXT_PRI : T.TEXT_TER,
                bgcolor: tab === id ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)') : 'transparent',
                '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)', color: T.TEXT_PRI } }}>
              {label}
            </Button>
          ))}
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {tab === 'rawContent' ? <RawContentSection /> : <ReadyToUploadSection />}
      </Box>
    </Box>
  );
}
