import { useContext, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useDispatch } from 'react-redux';
import InvoiceDetail from './invoiceDetail';
import InvoiceForm from './invoiceForm';
import { downloadMisInvoicePdf } from '../../store/store';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';

// Reusable invoice/pre-invoice viewer — used from surfaces OUTSIDE the MIS
// module itself (the CRM Requests tab, the Inventory product Invoices tab, a
// Supply record's documents) so a reverse-lookup row can open the full detail
// without navigating away to the MIS section. Wraps the same InvoiceDetail
// used by mis.js.
//
// Edit and Convert work from here too: the dialog steps aside while the
// invoice form (a Drawer) is open — stacking a Drawer over a Dialog is the
// portal z-index trap documented in CLAUDE.md — and closes once the form
// saves, so whatever opened it can refresh (onChanged).
export default function InvoiceDetailDialog({ doc, open, onClose, onChanged }) {
  const theme  = useTheme();
  const isXs   = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const [form, setForm] = useState(null);   // { mode: 'edit' | 'convert', doc }

  if (!doc) return null;

  const handlePdf = (d) =>
    dispatch(downloadMisInvoicePdf({ authCtx, axiosGlobal, id: d._id, docType: d.docType, docNumber: d.docNumber }));

  return (
    <>
      <Dialog open={open && !form} onClose={onClose} maxWidth="md" fullWidth fullScreen={isXs}
        PaperProps={{ sx: { height: isXs ? '100%' : '85vh', borderRadius: isXs ? 0 : '14px' } }}>
        <InvoiceDetail doc={doc} onClose={onClose} onPdf={handlePdf}
          onEdit={(d) => setForm({ mode: 'edit', doc: d })}
          onConvert={(d) => setForm({ mode: 'convert', doc: d })} />
      </Dialog>

      <InvoiceForm
        open={Boolean(form)}
        mode={form?.mode || 'edit'}
        docType={form?.mode === 'convert' ? 'invoice' : form?.doc?.docType}
        doc={form?.doc || null}
        onClose={() => setForm(null)}
        onSaved={() => { setForm(null); onChanged && onChanged(); onClose && onClose(); }}
      />
    </>
  );
}
