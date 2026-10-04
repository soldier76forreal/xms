// What the current viewer may do with an MIS document — one place for the card
// menu and the detail header, so the two never disagree. An action the viewer
// can't perform isn't offered at all. The server is the real gate
// (routes/mis/invoices.js: requireDocChange / requireFulfillingSide); this only
// mirrors it.
//
// An inter-branch document belongs to the branch it was sent to (doc.branchId):
// that side prices it, moves it on, converts it, takes its payments and assigns
// it. The requesting branch follows along, except that it may still correct or
// withdraw its own request while it waits to be answered ('requested').
export function getDocActions(doc, { can, activeBranchId }) {
  const isInvoice = doc.docType === 'invoice';
  const permBase = isInvoice ? 'mis:invoice' : 'mis:preinvoice';
  const isInterBranch = doc.tradeMode === 'interBranch';
  const fulfilling = !isInterBranch || String(doc.branchId) === String(activeBranchId);
  const pendingOwnRequest = isInterBranch && !isInvoice && doc.status === 'requested'
    && String(doc.requestingBranchId) === String(activeBranchId);
  const mayChange = fulfilling || pendingOwnRequest;
  const converted = doc.status === 'converted' || Boolean(doc.convertedToInvoiceId);

  return {
    fulfilling,
    edit: mayChange && !converted && can(`${permBase}:edit`),
    pdf: can(`${permBase}:pdf`),
    convert: !isInvoice && fulfilling && !converted && doc.status !== 'cancelled' && can('mis:preinvoice:convert'),
    payment: isInvoice && fulfilling && can('mis:payment:edit'),
    assign: fulfilling && can(`${permBase}:edit`),
    remove: mayChange && can(`${permBase}:delete`),
  };
}
