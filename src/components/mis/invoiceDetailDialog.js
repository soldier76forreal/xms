import Dialog from '@mui/material/Dialog';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useDispatch } from 'react-redux';
import InvoiceDetail from './invoiceDetail';
import { downloadMisInvoicePdf } from '../../store/store';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { useContext } from 'react';

// Reusable read-only invoice/pre-invoice viewer — used from surfaces OUTSIDE
// the MIS module itself (the CRM Requests tab, the Inventory product Invoices
// tab) so a reverse-lookup row can open the full detail without navigating
// away to the MIS section. Wraps the same InvoiceDetail used by mis.js.
export default function InvoiceDetailDialog({ doc, open, onClose }) {
  const theme  = useTheme();
  const isXs   = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

  if (!doc) return null;

  const handlePdf = (d) =>
    dispatch(downloadMisInvoicePdf({ authCtx, axiosGlobal, id: d._id, docType: d.docType, docNumber: d.docNumber }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isXs}
      PaperProps={{ sx: { height: isXs ? '100%' : '85vh', borderRadius: isXs ? 0 : '14px' } }}>
      <InvoiceDetail doc={doc} onClose={onClose} onPdf={handlePdf} />
    </Dialog>
  );
}
