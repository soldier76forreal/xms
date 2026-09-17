import { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';
import ConfirmDialog from '../../tools/modal/confirmDialog';
import {
  fetchCategories, createCategory, updateCategory, deleteCategory,
  fetchInvTags, createInvTag, updateInvTag, deleteInvTag,
} from '../../store/store';

// A single reusable list-CRUD panel — used twice below (categories, tags),
// same backend shape (name/description), same permission gate
// (inventory:website:manage for writes; read already happened via the
// existing fetchCategories/fetchTags on mount elsewhere).
function TaxonomyPanel({ items, canManage, onCreate, onUpdate, onDelete, addLabel, emptyLabel }) {
  const { t } = useTranslation();
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const nameTaken = (name, excludeId) => items.some((i) =>
    i.name.toLowerCase() === name.trim().toLowerCase() && String(i._id) !== String(excludeId));

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name || nameTaken(name)) return;
    setBusy(true);
    try { await onCreate(name); setNewName(''); } finally { setBusy(false); }
  };

  const startEdit = (item) => { setEditingId(item._id); setEditName(item.name); };
  const saveEdit = async (id) => {
    const name = editName.trim();
    if (!name || nameTaken(name, id)) return;
    setBusy(true);
    try { await onUpdate(id, name); setEditingId(null); } finally { setBusy(false); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField size="small" fullWidth value={newName} onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
          placeholder={addLabel} disabled={!canManage} />
        <Button size="small" variant="outlined" onClick={handleCreate}
          disabled={!canManage || !newName.trim() || busy}
          startIcon={busy ? <CircularProgress size={12} /> : <AddIcon sx={{ fontSize: 14 }} />}
          sx={{ flexShrink: 0 }}>
          {t('common.add')}
        </Button>
      </Box>

      {items.length === 0 ? (
        <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled', textAlign: 'center', py: 3 }}>
          {emptyLabel}
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {items.map((item) => (
            <Box key={item._id} sx={{ display: 'flex', alignItems: 'center', gap: 1,
              px: 1.5, py: 1, border: '1px solid', borderColor: 'divider', borderRadius: '10px' }}>
              {editingId === item._id ? (
                <>
                  <TextField size="small" autoFocus fullWidth value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(item._id); if (e.key === 'Escape') setEditingId(null); }} />
                  <IconButton size="small" onClick={() => saveEdit(item._id)} sx={{ color: 'success.main' }}>
                    <CheckIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                  <IconButton size="small" onClick={() => setEditingId(null)} sx={{ color: 'text.disabled' }}>
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </>
              ) : (
                <>
                  <Typography sx={{ fontSize: '0.82rem', flexGrow: 1 }}>{item.name}</Typography>
                  {canManage && (
                    <>
                      <IconButton size="small" onClick={() => startEdit(item)} sx={{ color: 'text.disabled' }}>
                        <EditOutlinedIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => setConfirmDeleteId(item._id)} sx={{ color: '#EA005A' }}>
                        <DeleteOutlineIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </>
                  )}
                </>
              )}
            </Box>
          ))}
        </Box>
      )}

      <ConfirmDialog
        open={Boolean(confirmDeleteId)}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => { onDelete(confirmDeleteId); setConfirmDeleteId(null); }}
        title={t('common.delete')}
        message={t('inventory.websiteToolsDeleteConfirm')}
        confirmLabel={t('common.delete')}
        destructive
      />
    </Box>
  );
}

// The public site's category/tag taxonomy, managed from inside Inventory
// (Pouriya: "category and tag management must be located as the website
// tools in inventory section") rather than a WordPress-style separate CMS.
// Categories already had a backend (api/routes/inventory/categories.js,
// previously only reachable from inside the product form's picker); tags are
// new (api/routes/inventory/tags.js / inventoryTagModel.js). Both gated by
// inventory:website:manage for writes.
export default function WebsiteTools({ open, onClose }) {
  const { t }  = useTranslation();
  const theme  = useTheme();
  const isXs   = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can } = usePermissions();
  const canManage = can('inventory:website:manage');

  const categories = useSelector((s) => s.invCategories) || [];
  const tags       = useSelector((s) => s.invTags) || [];
  const [tab, setTab] = useState('categories');

  useEffect(() => {
    if (!open) return;
    dispatch(fetchCategories({ authCtx, axiosGlobal }));
    dispatch(fetchInvTags({ authCtx, axiosGlobal }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={isXs}>
      <DialogTitle sx={{ px: 3, py: 2.5, fontWeight: 700, fontSize: '1rem',
        display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box component="span" sx={{ flexGrow: 1 }}>{t('inventory.websiteToolsTitle')}</Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ px: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tab value="categories" label={t('inventory.categoriesTab')} sx={{ textTransform: 'none', fontSize: '0.8rem' }} />
        <Tab value="tags" label={t('inventory.tagsTab')} sx={{ textTransform: 'none', fontSize: '0.8rem' }} />
      </Tabs>

      <DialogContent sx={{ pt: 2.5 }}>
        {!canManage && (
          <Typography sx={{ fontSize: '0.74rem', color: 'text.disabled', mb: 2 }}>
            {t('inventory.websiteToolsReadOnlyNote')}
          </Typography>
        )}
        {tab === 'categories' ? (
          <TaxonomyPanel
            items={categories}
            canManage={canManage}
            addLabel={t('inventory.addNewCategory')}
            emptyLabel={t('inventory.noCategoriesYet')}
            onCreate={(name) => dispatch(createCategory({ authCtx, axiosGlobal, name })).unwrap()}
            onUpdate={(id, name) => dispatch(updateCategory({ authCtx, axiosGlobal, id, name })).unwrap()}
            onDelete={(id) => dispatch(deleteCategory({ authCtx, axiosGlobal, id }))}
          />
        ) : (
          <TaxonomyPanel
            items={tags}
            canManage={canManage}
            addLabel={t('inventory.addNewTag')}
            emptyLabel={t('inventory.noTagsYet')}
            onCreate={(name) => dispatch(createInvTag({ authCtx, axiosGlobal, name })).unwrap()}
            onUpdate={(id, name) => dispatch(updateInvTag({ authCtx, axiosGlobal, id, name })).unwrap()}
            onDelete={(id) => dispatch(deleteInvTag({ authCtx, axiosGlobal, id }))}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
