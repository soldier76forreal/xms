import { useState, useContext, useEffect, useCallback } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import SchoolIcon from '@mui/icons-material/School';
import AddIcon from '@mui/icons-material/Add';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';
import TutorialCard from './tutorialCard';
import TutorialForm from './tutorialForm';
import TutorialDetail from './tutorialDetail';
import { sectionLabel } from './sectionLabels';

// The "space for tutorials about this section" — a small icon button dropped
// next to an existing action (e.g. CRM's "New customer" button). Opens a
// compact dialog listing tutorials for `section` (optionally narrowed to a
// specific `tag`), with an upload button that pre-fills the form with both —
// this is what makes "the tag gets selected automatically when uploading
// directly from a section" true. Renders nothing if the user can't even view
// tutorials.
export default function SectionTutorials({ section, tag = null }) {
  const { t }  = useTranslation();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const history = useHistory();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can } = usePermissions();

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);

  const T = {
    DIALOG_BG: isDark ? '#0d0d0d' : theme.palette.background.paper,
    BD:        isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    BD2:       isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    TEXT_PRI:  isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC:  isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER:  isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    CTRL_BG:   isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  };

  const load = useCallback(async () => {
    setLoading(true);
    const params = { section, limit: 20, ...(tag ? { tag } : {}) };
    const res = await authCtx.jwtInst({
      method: 'get', url: `${axiosGlobal.defaultTargetApi}/tutorials`, params,
    }).catch(() => null);
    setItems(res?.data?.data || []);
    setLoading(false);
  }, [authCtx, axiosGlobal, section, tag]);

  useEffect(() => { if (open) load(); }, [open, load]);

  if (!can('tutorials:view')) return null;

  return (
    <>
      <Tooltip title={t('tutorials.sectionTutorialsTip')}>
        <IconButton size="small" onClick={() => setOpen(true)}
          sx={{ color: T.TEXT_SEC, border: `1px solid ${T.BD}`, borderRadius: '8px', width: 30, height: 30 }}>
          <SchoolIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={() => { setOpen(false); setDetailId(null); }} maxWidth="xs" fullWidth
        PaperProps={{ sx: { bgcolor: T.DIALOG_BG, border: `1px solid ${T.BD}`, borderRadius: '14px', backgroundImage: 'none' } }}>

        {detailId ? (
          /* overflowY:auto, NOT overflow:hidden. TutorialDetail scrolls itself
             via height:100% + overflowY:auto, but height:100% only resolves
             against a DEFINITE height — and maxHeight is not one. So the
             detail grew to its natural content height, overflowed this box,
             and 'hidden' clipped the rest with no way to reach it: anything
             below the fold (the video, the later steps) was simply unreachable
             in every embedded section widget. Letting THIS box scroll fixes it
             while keeping the dialog compact for short tutorials (a fixed
             height would pad short ones with dead space). The main /tutorials
             page is unaffected — its detail panel gets a definite height from
             flexGrow inside a full-height flex parent, so TutorialDetail's own
             scrolling works correctly there. */
          <Box sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <TutorialDetail id={detailId} onClose={() => setDetailId(null)} onDeleted={() => { setDetailId(null); load(); }} />
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2.5, py: 1.75, borderBottom: `1px solid ${T.BD}` }}>
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: T.TEXT_PRI, flexGrow: 1 }}>
                {sectionLabel(section, t)} {t('tutorials.sectionTutorialsTitleSuffix')}
              </Typography>
              <Tooltip title={t('tutorials.openFullCenter')}>
                <IconButton size="small" onClick={() => { setOpen(false); history.push('/tutorials'); }} sx={{ color: T.TEXT_TER }}>
                  <OpenInNewIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
              <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: T.TEXT_SEC }}>
                <CloseIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </Box>

            <Box sx={{ px: 1.5, py: 1.5, maxHeight: '55vh', overflowY: 'auto' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress size={18} sx={{ color: T.TEXT_TER }} />
                </Box>
              ) : items.length === 0 ? (
                <Typography sx={{ textAlign: 'center', color: T.TEXT_TER, py: 3, fontSize: '0.78rem' }}>
                  {t('tutorials.noneYet')}
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {items.map((item) => (
                    <TutorialCard key={item._id} tutorial={item} T={T} isDark={isDark} dense
                      onClick={() => setDetailId(item._id)} />
                  ))}
                </Box>
              )}
            </Box>

            {can('tutorials:upload') && (
              <Box sx={{ px: 2, pb: 2, pt: 0.5 }}>
                <Button fullWidth size="small" variant="contained" startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                  onClick={() => setFormOpen(true)}
                  sx={{ fontSize: '0.75rem', textTransform: 'none', borderRadius: '8px' }}>
                  {t('tutorials.uploadTutorial')}
                </Button>
              </Box>
            )}
          </>
        )}
      </Dialog>

      <TutorialForm open={formOpen} onClose={() => { setFormOpen(false); load(); }}
        initialSection={section} initialTags={tag ? [tag] : []} />
    </>
  );
}
