/**
 * SunBird Lanka Tours — Live PDF Export
 * Loaded inside the itinerary templates (itinerary_classic.html / itinerary_modern.html).
 * Builds a real A4 PDF from the pages currently on screen (live data + any manual edits),
 * one .pdf-page per PDF page, using html2pdf (html2canvas + jsPDF).
 */
(function (window, document) {
  'use strict';

  const EXPORT_CLASS = 'sb-pdf-exporting';

  function injectExportStyles() {
    if (document.getElementById('sb-pdf-export-styles')) return;
    const style = document.createElement('style');
    style.id = 'sb-pdf-export-styles';
    style.textContent = `
      .${EXPORT_CLASS} .pdf-page {
        box-shadow: none !important;
        margin: 0 !important;
        /* a hair under 297mm so rounding never spills a blank page */
        height: 296.6mm !important;
        min-height: 296.6mm !important;
        max-height: 296.6mm !important;
      }
      .${EXPORT_CLASS} [contenteditable] {
        outline: none !important;
        background: transparent !important;
        caret-color: transparent !important;
      }
      .${EXPORT_CLASS} .no-print-btn,
      .${EXPORT_CLASS} .edit-tip-banner,
      .${EXPORT_CLASS} .floating-pdf-actions {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function defaultFileName() {
    let title = '';
    const titleEl = document.querySelector('.main-title');
    if (titleEl) title = titleEl.textContent;
    if (!title) {
      try {
        const live = JSON.parse(window.localStorage.getItem('sunbird_live_itinerary') || '{}');
        title = live.title || '';
      } catch (e) {}
    }
    return safeFileName(title || 'SunBird Lanka Tours Itinerary');
  }

  function safeFileName(name) {
    const clean = String(name).replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
    return (clean || 'SunBird Itinerary') + (clean.toLowerCase().endsWith('.pdf') ? '' : '.pdf');
  }

  /**
   * html2canvas sizes inline SVGs from their width/height attributes, so an SVG that is
   * only sized by CSS (e.g. the letterhead logo: width:100%; height:auto) gets cropped.
   * Pin every SVG to its on-screen size for the export, and return an undo function.
   */
  function pinSvgSizes(pages) {
    const restore = [];
    pages.forEach((page) => {
      page.querySelectorAll('svg').forEach((svg) => {
        const rect = svg.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        restore.push([svg, svg.getAttribute('width'), svg.getAttribute('height')]);
        svg.setAttribute('width', String(rect.width));
        svg.setAttribute('height', String(rect.height));
      });
    });
    return function () {
      restore.forEach(([svg, w, h]) => {
        if (w === null) svg.removeAttribute('width'); else svg.setAttribute('width', w);
        if (h === null) svg.removeAttribute('height'); else svg.setAttribute('height', h);
      });
    };
  }

  async function waitForAssets() {
    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch (e) {}
    }
    const imgs = Array.from(document.images).filter(img => !img.complete);
    await Promise.all(imgs.map(img => new Promise(res => {
      img.addEventListener('load', res, { once: true });
      img.addEventListener('error', res, { once: true });
      setTimeout(res, 4000);
    })));
  }

  /**
   * Generates and downloads the PDF.
   * @param {string} [fileName]
   * @returns {Promise<void>}
   */
  async function download(fileName) {
    if (typeof window.html2pdf !== 'function') {
      throw new Error('html2pdf library is not loaded on this page.');
    }
    const pages = Array.from(document.querySelectorAll('.pdf-page'));
    if (pages.length === 0) {
      throw new Error('No itinerary pages found to export.');
    }

    injectExportStyles();
    await waitForAssets();
    try { if (document.activeElement) document.activeElement.blur(); } catch (e) {}
    document.documentElement.classList.add(EXPORT_CLASS);
    const restoreSvgs = pinSvgSizes(pages);

    const opt = {
      margin: 0,
      filename: fileName ? safeFileName(fileName) : defaultFileName(),
      image: { type: 'jpeg', quality: 0.96 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false, scrollX: 0, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
      pagebreak: { mode: [] }
    };

    try {
      let worker = window.html2pdf().set(opt).from(pages[0]).toPdf();
      for (let i = 1; i < pages.length; i++) {
        const page = pages[i];
        worker = worker.get('pdf').then(pdf => { pdf.addPage(); }).from(page).toContainer().toCanvas().toPdf();
      }
      await worker.save();
    } finally {
      restoreSvgs();
      document.documentElement.classList.remove(EXPORT_CLASS);
    }
  }

  window.SunBirdPdfExport = { download: download, safeFileName: safeFileName };
})(window, document);
