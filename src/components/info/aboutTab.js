import { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import PageSection from '../../contextApi/pageSection';
import { usePermissions } from '../../contextApi/PermissionContext';
import { NAV_ITEMS, FOOTER_NAV_ITEMS } from '../../tools/navs/navConfig';
import { CHANGELOG, APP_VERSION, APP_RELEASED, changeText } from './changelog';
import { fetchAppInfo } from './feedbackApi';

// ── helpers, at MODULE scope ────────────────────────────────────────────────
// A component declared inside another component's body is a new type on every
// render, so React remounts its whole subtree each time. These stay out here.

const CHANGE_COLORS = { new: '#34D399', improved: '#38BDF8', fixed: '#FBBF24' };

// The calendar is pinned to Gregorian: a release date should read the same in
// every language, and Farsi would otherwise switch to the Jalali calendar.
const formatDay = (iso, language) => {
  try {
    return new Intl.DateTimeFormat(`${language}-u-ca-gregory`, { year: 'numeric', month: 'long', day: 'numeric' })
      .format(new Date(`${iso}T12:00:00`));
  } catch (_) {
    return iso;
  }
};

function Heading({ title, hint, T }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: T.TEXT_SEC }}>
        {title}
      </Typography>
      {hint && <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_TER, mt: 0.25 }}>{hint}</Typography>}
    </Box>
  );
}

function VersionCard({ label, value, sub, T }) {
  return (
    <Box sx={{ p: 2, borderRadius: '14px', bgcolor: T.CARD_BG, border: `1px solid ${T.BD}` }}>
      <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: T.TEXT_TER }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '1.9rem', fontWeight: 800, lineHeight: 1.15, color: T.TEXT_PRI, mt: 0.5, unicodeBidi: 'isolate' }}>
        {value}
      </Typography>
      {sub && <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_SEC, mt: 0.5 }}>{sub}</Typography>}
    </Box>
  );
}

function SectionCard({ item, accessible, current, onOpen, T, t }) {
  const name = t(`nav.${item.navKey}`);
  const card = (
    <Box sx={{
      p: 1.75, borderRadius: '14px', bgcolor: T.CARD_BG, border: `1px solid ${T.BD}`,
      display: 'flex', flexDirection: 'column', gap: 1, opacity: accessible ? 1 : 0.5, height: '100%',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 30, height: 30, borderRadius: '9px', bgcolor: T.CTRL_BG, color: T.TEXT_SEC,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, '& svg': { fontSize: 18 } }}>
          {item.icon}
        </Box>
        <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: T.TEXT_PRI, flexGrow: 1, minWidth: 0 }} noWrap>
          {name}
        </Typography>
        {!accessible && <LockOutlinedIcon sx={{ fontSize: 15, color: T.TEXT_TER }} />}
      </Box>
      <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_SEC, lineHeight: 1.5, flexGrow: 1 }}>
        {t(`info.sectionDesc.${item.navKey}`)}
      </Typography>
      {accessible && !current && (
        <Button size="small" onClick={() => onOpen(item)}
          sx={{ alignSelf: 'flex-start', textTransform: 'none', fontSize: '0.74rem', px: 1.25, borderRadius: '8px',
            color: T.TEXT_PRI, bgcolor: T.CTRL_BG, '&:hover': { bgcolor: T.BD } }}>
          {t('info.open')}
        </Button>
      )}
    </Box>
  );
  return accessible ? card : <Tooltip title={t('info.noAccess')}>{card}</Tooltip>;
}

function ChangeRow({ change, language, T, t }) {
  const color = CHANGE_COLORS[change.type] || T.TEXT_TER;
  return (
    <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'baseline' }}>
      <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase',
        color, minWidth: 66, flexShrink: 0 }}>
        {t(`info.change.${change.type}`)}
      </Typography>
      <Typography sx={{ fontSize: '0.84rem', color: T.TEXT_PRI, lineHeight: 1.55 }}>
        {changeText(change, language)}
      </Typography>
    </Box>
  );
}

// ── the tab ─────────────────────────────────────────────────────────────────
export default function AboutTab({ T }) {
  const { t, i18n } = useTranslation();
  const language = (i18n.language || 'en').slice(0, 2);
  const history = useHistory();
  const pageSection = useContext(PageSection);
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can } = usePermissions();

  // The server reports its own version, so a deploy where the two halves are
  // out of step shows up here instead of as a mystery.
  const [serverVersion, setServerVersion] = useState(null);
  const [serverFailed, setServerFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetchAppInfo(authCtx, axiosGlobal)
      .then((info) => { if (!cancelled) setServerVersion(info.apiVersion); })
      .catch(() => { if (!cancelled) setServerFailed(true); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openSection = (item) => {
    pageSection.selectedSectionFunc(item.section);
    history.push(item.path);
  };

  const sections = [...NAV_ITEMS, ...FOOTER_NAV_ITEMS];

  return (
    <Box sx={{ height: '100%', overflowY: 'auto' }}>
      <Box sx={{ maxWidth: 980, mx: 'auto', p: { xs: 1.5, sm: 3 }, display: 'flex', flexDirection: 'column', gap: 4 }}>

        {/* version */}
        <Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
            <VersionCard T={T} label={t('info.appVersion')} value={`v${APP_VERSION}`}
              sub={t('info.released', { date: formatDay(APP_RELEASED, language) })} />
            <VersionCard T={T} label={t('info.serverVersion')}
              value={serverVersion ? `v${serverVersion}` : '—'}
              sub={serverFailed ? t('info.serverUnavailable') : ''} />
          </Box>
          <Typography sx={{ fontSize: '0.75rem', color: T.TEXT_TER, mt: 1 }}>{t('info.versionHint')}</Typography>
        </Box>

        {/* sections */}
        <Box>
          <Heading T={T} title={t('info.sectionsTitle')} hint={t('info.sectionsHint')} />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 1.25 }}>
            {sections.map((item) => (
              <SectionCard key={item.section} item={item} T={T} t={t}
                accessible={!item.permission || can(item.permission)}
                current={item.path === '/info'}
                onOpen={openSection} />
            ))}
          </Box>
        </Box>

        {/* what's new */}
        <Box>
          <Heading T={T} title={t('info.whatsNew')} />
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {CHANGELOG.map((entry, index) => (
              <Box key={entry.version} sx={{ display: 'flex', gap: { xs: 1.25, sm: 2 } }}>
                {/* the rail: a dot per release, a line joining them */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <Box sx={{ width: 11, height: 11, borderRadius: '50%', mt: '5px',
                    bgcolor: index === 0 ? T.TEXT_PRI : 'transparent', border: `2px solid ${index === 0 ? T.TEXT_PRI : T.TEXT_TER}` }} />
                  {index < CHANGELOG.length - 1 && <Box sx={{ width: 2, flexGrow: 1, bgcolor: T.BD, mt: 0.5 }} />}
                </Box>
                <Box sx={{ pb: 3, minWidth: 0, flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: T.TEXT_PRI, unicodeBidi: 'isolate' }}>v{entry.version}</Typography>
                    {index === 0 && (
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase',
                        px: 0.75, py: '1px', borderRadius: '5px', bgcolor: T.TEXT_PRI, color: T.APP_BG }}>
                        {t('info.latest')}
                      </Typography>
                    )}
                    <Typography sx={{ fontSize: '0.76rem', color: T.TEXT_TER }}>{formatDay(entry.date, language)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.9 }}>
                    {entry.changes.map((change, i) => (
                      <ChangeRow key={i} change={change} language={language} T={T} t={t} />
                    ))}
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

      </Box>
    </Box>
  );
}
