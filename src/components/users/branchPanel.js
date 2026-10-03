import { useState, useEffect, useContext } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import StoreIcon from '@mui/icons-material/Store';
import EditIcon from '@mui/icons-material/Edit';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import InstagramIcon from '@mui/icons-material/Instagram';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import COUNTRIES from '../crm/util/countryData';

const useT = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return {
    TEXT_PRI: isDark ? '#ffffff'                : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    DIVIDER:  isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    MOD_BG:   isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    MOD_BD:   isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    SYS_BG:   isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    HVR_BG:   isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    isDark,
  };
};

const SectionLabel = ({ children, T }) => (
  <Typography sx={{ fontSize: '0.65rem', color: T.TEXT_TER, textTransform: 'uppercase',
    letterSpacing: 1, mb: 1 }}>
    {children}
  </Typography>
);

// One number in the stats strip.
const Stat = ({ value, label, T }) => (
  <Box sx={{ textAlign: 'center', minWidth: 58 }}>
    <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: T.TEXT_PRI, lineHeight: 1,
      fontVariantNumeric: 'tabular-nums' }}>
      {value}
    </Typography>
    <Typography sx={{ fontSize: '0.6rem', color: T.TEXT_TER, textTransform: 'uppercase',
      letterSpacing: 0.6, mt: 0.4 }}>
      {label}
    </Typography>
  </Box>
);

// A labelled contact row; nothing renders when the value is blank.
const ContactRow = ({ Icon, value, href, T }) => {
  if (!value) return null;
  const body = (
    <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_SEC, lineHeight: 1.5,
      wordBreak: 'break-word', ...(href ? { '&:hover': { color: T.TEXT_PRI } } : {}) }}>
      {value}
    </Typography>
  );
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
      <Icon sx={{ fontSize: 15, color: T.TEXT_TER, flexShrink: 0, mt: '2px' }} />
      {href
        ? <Box component="a" href={href} target="_blank" rel="noreferrer"
            sx={{ textDecoration: 'none' }}>{body}</Box>
        : body}
    </Box>
  );
};

const TEMPLATE_ROWS = [
  ['customerInvoice',      'users.templateCustomerInvoice'],
  ['customerQuotation',    'users.templateCustomerQuotation'],
  ['interBranchInvoice',   'users.templateInterBranchInvoice'],
  ['interBranchQuotation', 'users.templateInterBranchQuotation'],
  ['packingList',          'users.templatePackingList'],
  ['label',                'users.templateLabel'],
  ['dealLetter',           'users.templateDealLetter'],
];

const BranchPanel = ({ branch, onEdit }) => {
  const T = useT();
  const { t } = useTranslation();
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const userDirectory = useSelector((s) => s.userDirectory) || {};

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!branch?._id) return;
    let cancelled = false;
    setLoading(true); setStats(null);
    authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/branches/${branch._id}/stats` })
      .then((res) => { if (!cancelled) setStats(res.data.data); })
      .catch(() => { if (!cancelled) setStats(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [branch?._id, authCtx, axiosGlobal]);

  if (!branch) return null;

  const country = COUNTRIES.find((c) => c.code === branch.country) || null;
  const archived = branch.status === 'archived';
  const counts = stats?.counts || {};
  const members = stats?.members || [];
  const sharedWith = stats?.sharedWith || [];
  const notifyUsers = branch.priceRequestNotifyUsers || [];
  const hasContact = branch.address || branch.phone || branch.instagramHandle;

  const igHandle = String(branch.instagramHandle || '').replace(/^@/, '');

  return (
    <Box sx={{ p: 3, height: '100%', overflowY: 'auto' }}>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
        <Box sx={{ width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
          bgcolor: T.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: country ? '1.4rem' : undefined, opacity: archived ? 0.5 : 1 }}>
          {country ? country.flag : <StoreIcon sx={{ fontSize: 22, color: T.TEXT_SEC }} />}
        </Box>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: T.TEXT_PRI }}>
              {branch.name}
            </Typography>
            {archived && (
              <Chip label={t('users.archivedBadge')} size="small"
                sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, borderRadius: '4px',
                  bgcolor: T.SYS_BG, color: T.TEXT_TER, '& .MuiChip-label': { px: 0.75 } }} />
            )}
          </Box>
          {country && (
            <Typography sx={{ fontSize: '0.75rem', color: T.TEXT_TER, mt: 0.25 }}>
              {country.name}
            </Typography>
          )}
          {branch.description && (
            <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_SEC, mt: 0.5, lineHeight: 1.5 }}>
              {branch.description}
            </Typography>
          )}
        </Box>

        {onEdit && (
          <Tooltip title={t('common.edit')}>
            <IconButton size="small" onClick={() => onEdit(branch)}
              sx={{ color: T.TEXT_TER, '&:hover': { color: T.TEXT_PRI, bgcolor: T.HVR_BG } }}>
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* ── What this branch holds ── */}
      <SectionLabel T={T}>{t('users.branchContentsSection')}</SectionLabel>
      {loading && !stats ? (
        <Skeleton variant="rounded" height={64} sx={{ mb: 3 }} />
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center',
          px: 1.5, py: 1.5, mb: 3, borderRadius: '10px',
          bgcolor: T.MOD_BG, border: `1px solid ${T.MOD_BD}` }}>
          <Stat value={counts.products ?? 0}      label={t('users.branchStatProducts')} T={T} />
          <Stat value={counts.variants ?? 0}      label={t('users.branchStatVariants')} T={T} />
          <Box sx={{ width: '1px', alignSelf: 'stretch', bgcolor: T.DIVIDER }} />
          <Stat value={counts.invoices ?? 0}      label={t('users.branchStatInvoices')} T={T} />
          <Stat value={counts.quotations ?? 0}    label={t('users.branchStatQuotations')} T={T} />
          <Stat value={counts.packingLists ?? 0}  label={t('users.branchStatPackingLists')} T={T} />
          <Box sx={{ width: '1px', alignSelf: 'stretch', bgcolor: T.DIVIDER }} />
          <Stat value={counts.supplyRecords ?? 0} label={t('users.branchStatSupply')} T={T} />
        </Box>
      )}

      {/* ── Assigned staff ── */}
      <SectionLabel T={T}>
        {t('users.branchMembersSection')}
        {counts.members ? ` · ${counts.members}` : ''}
      </SectionLabel>
      {loading && !stats ? (
        <Skeleton variant="rounded" height={40} sx={{ mb: 3 }} />
      ) : members.length === 0 ? (
        <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_TER, mb: 3 }}>
          {t('users.branchNoMembers')}
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 3 }}>
          {members.map((m) => (
            <Box key={m._id} sx={{ display: 'flex', alignItems: 'center', gap: 0.6,
              px: 1, py: 0.5, borderRadius: '8px',
              bgcolor: T.MOD_BG, border: `1px solid ${T.MOD_BD}` }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%',
                bgcolor: m.isOnline ? '#81C784' : T.TEXT_TER }} />
              <Typography sx={{ fontSize: '0.75rem', color: T.TEXT_SEC }}>
                {m.name || '—'}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* ── Public site / contact ── */}
      <SectionLabel T={T}>{t('users.branchPublicSiteSection')}</SectionLabel>
      {hasContact ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3,
          px: 1.5, py: 1.25, borderRadius: '10px',
          bgcolor: T.MOD_BG, border: `1px solid ${T.MOD_BD}` }}>
          <ContactRow Icon={PlaceOutlinedIcon} value={branch.address} T={T} />
          <ContactRow Icon={PhoneIphoneIcon} value={branch.phone}
            href={branch.phone ? `tel:${branch.phone}` : null} T={T} />
          <ContactRow Icon={InstagramIcon} value={igHandle ? `@${igHandle}` : ''}
            href={igHandle ? `https://instagram.com/${igHandle}` : null} T={T} />
        </Box>
      ) : (
        <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_TER, mb: 3 }}>
          {t('users.branchNoContactInfo')}
        </Typography>
      )}

      {/* ── Price-request recipients ── */}
      {notifyUsers.length > 0 && (
        <>
          <SectionLabel T={T}>{t('users.branchNotifyUsersLabel')}</SectionLabel>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 3 }}>
            {notifyUsers.map((id) => {
              const u = userDirectory[String(id)];
              const name = u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '';
              return (
                <Chip key={String(id)} size="small" label={name || String(id).slice(-6)}
                  sx={{ height: 22, fontSize: '0.68rem', borderRadius: '6px',
                    bgcolor: T.MOD_BG, color: T.TEXT_SEC, border: `1px solid ${T.MOD_BD}` }} />
              );
            })}
          </Box>
        </>
      )}

      {/* ── Cross-branch sharing ── */}
      <SectionLabel T={T}>{t('users.branchSharingSection')}</SectionLabel>
      {sharedWith.length === 0 ? (
        <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_TER, mb: 3 }}>
          {t('users.branchSharedWithNone')}
        </Typography>
      ) : (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 0.75 }}>
            {sharedWith.map((b) => (
              <Chip key={String(b._id)} size="small" label={b.name}
                sx={{ height: 22, fontSize: '0.68rem', borderRadius: '6px',
                  bgcolor: T.MOD_BG, color: T.TEXT_SEC, border: `1px solid ${T.MOD_BD}` }} />
            ))}
          </Box>
          <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, lineHeight: 1.6 }}>
            {t('users.branchSharedWithHelper')}
          </Typography>
        </Box>
      )}

      {/* ── Document templates ── */}
      <SectionLabel T={T}>{t('users.branchMisTemplatesSection')}</SectionLabel>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 3 }}>
        {TEMPLATE_ROWS.map(([key, labelKey]) => (
          <Box key={key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            px: 1.5, py: 0.75, borderRadius: '8px',
            bgcolor: T.MOD_BG, border: `1px solid ${T.MOD_BD}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
              <DescriptionOutlinedIcon sx={{ fontSize: 14, color: T.TEXT_TER, flexShrink: 0 }} />
              <Typography sx={{ fontSize: '0.76rem', color: T.TEXT_SEC }} noWrap>
                {t(labelKey)}
              </Typography>
            </Box>
            {/* Only 'classic' exists today; an unknown value falls back to it
                server-side, so show the raw string if one ever appears. */}
            <Chip size="small"
              label={(branch.misTemplates?.[key] || 'classic') === 'classic'
                ? t('users.templateClassic')
                : branch.misTemplates[key]}
              sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, borderRadius: '4px',
                bgcolor: T.SYS_BG, color: T.TEXT_SEC, '& .MuiChip-label': { px: 0.75 } }} />
          </Box>
        ))}
      </Box>

      {/* ── Meta ── */}
      <Box sx={{ pt: 2, borderTop: `1px solid ${T.DIVIDER}` }}>
        <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_TER }}>
          {t('users.branchCreatedOn', {
            date: branch.insertDate ? new Date(branch.insertDate).toLocaleDateString() : '—',
          })}
          {branch.updateDate && ` · ${t('users.branchUpdatedOn', {
            date: new Date(branch.updateDate).toLocaleDateString(),
          })}`}
        </Typography>
      </Box>
    </Box>
  );
};

export default BranchPanel;
