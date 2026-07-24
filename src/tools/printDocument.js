// Client-side "Save as PDF" via the browser's own print engine — no server-side
// headless browser (Puppeteer) involved. We drop the invoice HTML (the SAME
// template used for the on-screen preview) into a hidden iframe and open the
// browser's print dialog, where the user picks "Save as PDF".
//
// Why this instead of server Puppeteer: the production server couldn't run
// headless Chrome reliably (snap confinement / DevTools pipe hangs). The
// browser already renders this exact template for the preview, so print-to-PDF
// reproduces it perfectly — RTL Arabic, multi-page A4, embedded logo — using the
// viewer's own Chrome/Edge/Safari, which always works.
export function printHtmlDocument(html) {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  Object.assign(iframe.style, {
    position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0',
  });
  document.body.appendChild(iframe);

  let removed = false;
  const cleanup = () => { if (removed) return; removed = true; try { iframe.remove(); } catch (_) {} };

  iframe.onload = () => {
    const win = iframe.contentWindow;
    if (!win) { cleanup(); return; }
    // Remove the iframe once the print dialog closes; long fallback in case the
    // browser never fires afterprint (removing it mid-dialog would cancel print).
    win.onafterprint = cleanup;
    setTimeout(cleanup, 120000);
    // Small delay so layout/images settle before the dialog opens.
    setTimeout(() => { try { win.focus(); win.print(); } catch (_) { cleanup(); } }, 250);
  };

  // srcdoc reliably fires onload after the document renders.
  iframe.srcdoc = html;
}
