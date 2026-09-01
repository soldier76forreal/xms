import { useState, useEffect, useContext, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Autocomplete from '@mui/material/Autocomplete';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';
import { useTheme, useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import MediaViewer, { downloadFile } from '../digitalMarketing/mediaViewer';
import { JobReportDetail, ReportAttachments, fmtDate, fmtDateTime } from './jobReportSection';

// ── ADMIN MODE — every user's job reports, filterable by user + date range,
// with reply capability. Mirrors jobReportSection.js's list/detail visuals
// (same JobReportDetail, ReportAttachments, date formatting) so the two modes
// feel like one section, not two different UIs bolted together.
export default function JobReportsAdminList() {
  const { t }       = useTranslation();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const theme       = useTheme();
  const isXs        = useMediaQuery(theme.breakpoints.down('sm'));
  const isDark      = theme.palette.mode === 'dark';

  const T = {
    CARD_BG:  isDark ? '#0d0d0d'                : theme.palette.background.paper,
    ROW_BG:   isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    INPUT_BG: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    INPUT_BD: isDark ? 'rgba(255,255,255,0.1)'  : theme.palette.divider,
    TEXT_PRI: isDark ? '#ffffff'                : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    DIVIDER:  isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    CARD_BD:  isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider,
  };

  const [directory, setDirectory] = useState([]);
  const [userFilter, setUserFilter] = useState(null);   // {_id, firstName, lastName}
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');

  const [reports, setReports] = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  const [viewingReport, setViewingReport] = useState(null);
  const [viewerMedia, setViewerMedia] = useState(null);

  // The picker only needs id + name — /users/directory is the ungated
  // lightweight lookup used app-wide for exactly this (avatars, mentions),
  // rather than /users which needs users:view (a permission this admin may
  // hold jobReports:viewAll without).
  useEffect(() => {
    authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/users/directory` })
      .then((res) => setDirectory(res.data?.data || []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const res = await authCtx.jwtInst({
        method: 'get',
        url: `${axiosGlobal.defaultTargetApi}/users/jobReports`,
        params: {
          page: pg, limit: 20,
          userId: userFilter?._id || undefined,
          dateFrom: dateFrom || undefined, dateTo: dateTo || undefined,
        },
      });
      setReports((prev) => (pg === 1 ? (res.data.data || []) : [...prev, ...(res.data.data || [])]));
      setTotal(res.data.total || 0);
      setPage(pg);
    } catch (_) { /* non-fatal */ }
    setLoading(false);
  }, [authCtx, axiosGlobal, userFilter, dateFrom, dateTo]);

  useEffect(() => { load(1); }, [load]);
  useEffect(() => { setHasMore(reports.length < total); }, [reports, total]);

  const clearFilters = () => { setUserFilter(null); setDateFrom(''); setDateTo(''); };

  const openAttachment = (f) => {
    const url = `${axiosGlobal.defaultTargetApi}/uploads/${f.diskName}`;
    if (f.kind === 'document') { downloadFile(url, f.name); return; }
    setViewerMedia({ url, name: f.name, kind: f.kind });
  };

  const sendReply = async (reportId, body) => {
    const res = await authCtx.jwtInst({
      method: 'post',
      url: `${axiosGlobal.defaultTargetApi}/users/jobReports/${reportId}/reply`,
      data: { body },
    });
    const updated = { ...res.data, authorName: reports.find((r) => r._id === reportId)?.authorName };
    setReports((prev) => prev.map((r) => (r._id === reportId ? updated : r)));
    setViewingReport((prev) => (prev && prev._id === reportId ? updated : prev));
  };

  return (
    <Box sx={{ p: 2.5, bgcolor: T.CARD_BG, border: `1px solid ${T.CARD_BD}`, borderRadius: '14px' }}>
      <MediaViewer open={!!viewerMedia} onClose={() => setViewerMedia(null)} media={viewerMedia} />
      <JobReportDetail open={!!viewingReport} onClose={() => setViewingReport(null)}
        report={viewingReport} T={T} isXs={isXs} isDark={isDark} axiosGlobal={axiosGlobal}
        onOpenAttachment={openAttachment} authorName={viewingReport?.authorName}
        onReply={viewingReport ? (body) => sendReply(viewingReport._id, body) : undefined} />

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <AssignmentIcon sx={{ fontSize: 16, color: T.TEXT_TER }} />
        <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, textTransform: 'uppercase', letterSpacing: 1, flexGrow: 1 }}>
          {t('users.jobReportsAdminHeader')}
        </Typography>
        {total > 0 && (
          <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER }}>
            {t('users.entriesCount', { count: total })}
          </Typography>
        )}
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 2.5 }}>
        <Autocomplete
          value={userFilter}
          onChange={(_, val) => setUserFilter(val)}
          options={directory}
          getOptionLabel={(o) => `${o.firstName || ''} ${o.lastName || ''}`.trim()}
          isOptionEqualToValue={(o, v) => String(o._id) === String(v._id)}
          size="small"
          sx={{ width: { xs: '100%', sm: 220 } }}
          renderInput={(params) => (
            <TextField {...params} label={t('users.filterByUser')}
              InputProps={{ ...params.InputProps, startAdornment: <PersonIcon sx={{ fontSize: 16, color: T.TEXT_TER, mr: 0.5 }} /> }}
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '8px', color: T.TEXT_PRI, fontSize: '0.78rem' } }} />
          )}
        />
        <TextField type="date" size="small" label={t('users.dateFromLabel')} value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: { xs: '100%', sm: 160 },
            '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '8px', color: T.TEXT_PRI, fontSize: '0.78rem' } }} />
        <TextField type="date" size="small" label={t('users.dateToLabel')} value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: { xs: '100%', sm: 160 },
            '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '8px', color: T.TEXT_PRI, fontSize: '0.78rem' } }} />
        {(userFilter || dateFrom || dateTo) && (
          <Tooltip title={t('users.clearDateFilter')}>
            <IconButton size="small" onClick={clearFilters} sx={{ color: T.TEXT_TER }}>
              <FilterAltOffIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* List */}
      {loading && reports.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={64} sx={{ borderRadius: '10px' }} />
          ))}
        </Box>
      ) : reports.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 1, opacity: 0.4 }}>
          <AssignmentIcon sx={{ fontSize: 32, color: T.TEXT_TER }} />
          <Typography sx={{ fontSize: '0.82rem', color: T.TEXT_TER }}>{t('users.noJobReportsYet')}</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {reports.map((report) => (
            <Box key={report._id} onClick={() => setViewingReport(report)}
              sx={{ p: 1.5, borderRadius: '10px', bgcolor: T.ROW_BG, border: `1px solid ${T.DIVIDER}`,
                cursor: 'pointer', transition: 'border-color 0.15s',
                '&:hover': { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                {/* The whole point of admin mode: WHO filed this and WHEN,
                    front and center — not buried in a detail click-through. */}
                <Chip icon={<PersonIcon sx={{ fontSize: '13px !important' }} />} label={report.authorName || '—'}
                  size="small" sx={{ height: 22, fontSize: '0.68rem', fontWeight: 700,
                    bgcolor: 'rgba(178,106,0,0.12)', color: '#B26A00' }} />
                <Chip icon={<EventIcon sx={{ fontSize: '13px !important' }} />} label={fmtDate(report.reportDate)}
                  size="small" sx={{ height: 22, fontSize: '0.68rem', fontWeight: 700,
                    bgcolor: 'rgba(100,181,246,0.12)', color: '#64b5f6' }} />
                {report.title && (
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: T.TEXT_PRI }}>
                    {report.title}
                  </Typography>
                )}
                <Box sx={{ flexGrow: 1 }} />
                {(report.replies?.length > 0) && (
                  <Chip size="small" label={t('users.repliesCount', { count: report.replies.length })}
                    sx={{ height: 20, fontSize: '0.64rem', bgcolor: T.INPUT_BG, color: T.TEXT_SEC }} />
                )}
              </Box>

              {report.body && (
                <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_SEC, mt: 0.5,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {report.body}
                </Typography>
              )}

              {(report.files || []).length > 0 && (
                <Box sx={{ mt: 0.75 }} onClick={(e) => e.stopPropagation()}>
                  <ReportAttachments files={report.files} T={T} isDark={isDark} axiosGlobal={axiosGlobal}
                    onOpen={openAttachment} size={60} />
                </Box>
              )}

              <Typography sx={{ fontSize: '0.65rem', color: T.TEXT_TER, mt: 0.75 }}>
                {t('users.lastActivityLabel', { date: fmtDateTime(report.lastActivityAt) })}
              </Typography>
            </Box>
          ))}

          {hasMore && (
            <Box sx={{ textAlign: 'center', pt: 0.5 }}>
              <Button size="small" onClick={() => load(page + 1)} disabled={loading}
                sx={{ fontSize: '0.72rem', color: T.TEXT_TER, textTransform: 'none' }}>
                {loading ? <CircularProgress size={12} sx={{ mr: 0.5 }} /> : null}
                {t('crm.loadMore')}
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
