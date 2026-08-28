import { useState, useEffect, useContext, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import ButtonBase from '@mui/material/ButtonBase';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CampaignIcon from '@mui/icons-material/Campaign';
import TelegramIcon from '@mui/icons-material/Telegram';
import CallIcon from '@mui/icons-material/Call';
import EmailIcon from '@mui/icons-material/Email';
import LanguageIcon from '@mui/icons-material/Language';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LinkIcon from '@mui/icons-material/Link';
import BusinessIcon from '@mui/icons-material/Business';

import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import i18n, { isRtlLang } from '../../i18n';

const TYPE_META = {
  whatsapp:        { Icon: WhatsAppIcon, color: '#25D366' },
  whatsappChannel: { Icon: CampaignIcon, color: '#25D366' },
  telegram: { Icon: TelegramIcon, color: '#229ED9' },
  phone:    { Icon: CallIcon,     color: '#4a4a4a' },
  email:    { Icon: EmailIcon,    color: '#4a4a4a' },
  website:  { Icon: LanguageIcon, color: '#4a4a4a' },
  address:  { Icon: LocationOnIcon, color: '#4a4a4a' },
  other:    { Icon: LinkIcon,     color: '#4a4a4a' },
};

// Same digits-only wa.me normalization as inventory/util/whatsappTemplate.js's
// normalizeWaNumber — duplicated locally on purpose rather than importing
// across an unrelated module, matching this codebase's existing convention of
// small per-feature duplication over premature shared utils.
const digitsOnly = (s) => String(s || '').replace(/\D/g, '');

const buildHref = (link) => {
  const v = link.value || '';
  switch (link.type) {
    case 'whatsapp':        return `https://wa.me/${digitsOnly(v)}`;
    case 'whatsappChannel': return /^https?:\/\//i.test(v) ? v : `https://${v}`;
    case 'telegram': return v.startsWith('http') ? v : `https://t.me/${v.replace(/^@/, '')}`;
    case 'phone':    return `tel:${digitsOnly(v)}`;
    case 'email':    return `mailto:${v}`;
    case 'website':  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
    case 'address':  return `https://maps.google.com/?q=${encodeURIComponent(v)}`;
    default:         return /^https?:\/\//i.test(v) ? v : null;
  }
};

// Genuinely public — no authCtx, no token, no permission check. Fetched via a
// plain axios call (no JWT to attach) from the unauthenticated
// GET /digitalMarketing/public/link-pages/:code backend route. Renders in the
// LANGUAGE THE PAGE'S CREATOR CHOSE (linkPageForm.js), fixed for every
// visitor — no in-page switcher, since a random customer has no account/
// preference to honor and picking the right language up front is simpler.
export default function PublicLinkPage() {
  const { code } = useParams();
  const { t } = useTranslation();   // fallback only, for the not-found state (no page.language known yet)
  const axiosGlobal = useContext(AxiosGlobal);

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    axios.get(`${axiosGlobal.defaultTargetApi}/digitalMarketing/public/link-pages/${code}`)
      .then((res) => { if (!cancelled) setPage(res.data); })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [code, axiosGlobal]);

  const pageLang = page?.language || 'en';
  const isRtl = isRtlLang(pageLang);
  const tFixed = useMemo(() => i18n.getFixedT(pageLang, 'translation'), [pageLang]);

  const BG = '#0a0a0a';
  const CARD_BG = '#151515';
  const CARD_BD = 'rgba(255,255,255,0.08)';
  const TEXT_PRI = '#ffffff';
  const TEXT_SEC = 'rgba(255,255,255,0.5)';

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={28} sx={{ color: TEXT_SEC }} />
      </Box>
    );
  }

  if (notFound || !page) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: BG, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 1.5, px: 3, textAlign: 'center' }}>
        <BusinessIcon sx={{ fontSize: 40, color: TEXT_SEC }} />
        <Typography sx={{ color: TEXT_PRI, fontSize: '1rem', fontWeight: 600 }}>
          {t('dm.publicPageNotAvailable')}
        </Typography>
      </Box>
    );
  }

  const coverUrl = page.coverImage?.diskName ? `${axiosGlobal.defaultTargetApi}/uploads/${page.coverImage.diskName}` : null;

  return (
    <Box dir={isRtl ? 'rtl' : 'ltr'} sx={{ minHeight: '100vh', bgcolor: BG, display: 'flex', justifyContent: 'center', py: { xs: 3, sm: 6 }, px: 2 }}>
      <Box sx={{ width: '100%', maxWidth: 420 }}>

        {coverUrl && (
          <Box component="img" src={coverUrl} alt=""
            sx={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: '16px', mb: 2.5,
              border: `1px solid ${CARD_BD}` }} />
        )}

        <Typography sx={{ color: TEXT_PRI, fontSize: '1.35rem', fontWeight: 700, textAlign: 'center', mb: 3 }}>
          {page.companyName}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {(page.links || []).map((link, i) => {
            const meta = TYPE_META[link.type] || TYPE_META.other;
            const href = buildHref(link);
            const label = link.type === 'other' && link.label ? link.label : tFixed(`dm.linkType${link.type.charAt(0).toUpperCase()}${link.type.slice(1)}`);
            const Content = (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', px: 2, py: 1.5,
                borderRadius: '14px', bgcolor: CARD_BG, border: `1px solid ${CARD_BD}`,
                transition: 'background-color 0.15s', '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' } }}>
                <meta.Icon sx={{ fontSize: 22, color: meta.color, flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0, textAlign: isRtl ? 'right' : 'left' }}>
                  <Typography sx={{ fontSize: '0.68rem', color: TEXT_SEC }}>{label}</Typography>
                  <Typography sx={{ fontSize: '0.9rem', color: TEXT_PRI, fontWeight: 600 }} noWrap>
                    {link.value}
                  </Typography>
                </Box>
              </Box>
            );
            return href
              ? <ButtonBase key={i} component="a" href={href} target="_blank" rel="noopener noreferrer" sx={{ borderRadius: '14px', width: '100%' }}>{Content}</ButtonBase>
              : <Box key={i}>{Content}</Box>;
          })}
        </Box>
      </Box>
    </Box>
  );
}
