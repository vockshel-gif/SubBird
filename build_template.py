import os
import base64

LOGO_PATH = r"c:/Users/vikum/OneDrive/Desktop/SunBird/Logo of Sunbird Lanka Tours.jpeg"
OUTPUT_HTML = r"c:/Users/vikum/OneDrive/Desktop/SunBird/itinerary_template.html"

logo_b64 = ""
if os.path.exists(LOGO_PATH):
    with open(LOGO_PATH, "rb") as f:
        logo_b64 = base64.b64encode(f.read()).decode("utf-8")

raw_html = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sunbird Lanka Tours - Official Itinerary</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
      color: #111827;
      background: #0b1120;
    }

    /* Web Preview Floating Toolbar */
    .no-print-toolbar {
      position: sticky;
      top: 0;
      left: 0;
      right: 0;
      background: #0f172a;
      color: #ffffff;
      padding: 10px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #3b82f6;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
      z-index: 9999;
      font-family: 'Segoe UI', system-ui, sans-serif;
    }
    .toolbar-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.95rem;
      font-weight: 700;
    }
    .toolbar-status {
      font-size: 0.78rem;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.4);
      padding: 3px 10px;
      border-radius: 999px;
      font-weight: 600;
    }
    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .btn-tool {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      border-radius: 5px;
      font-size: 0.82rem;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }
    .btn-tool-print {
      background: #2563eb;
      color: #ffffff;
    }
    .btn-tool-print:hover {
      background: #1d4ed8;
      box-shadow: 0 0 12px rgba(37, 99, 235, 0.6);
    }
    .btn-tool-download {
      background: #059669;
      color: #ffffff;
    }
    .btn-tool-download:hover {
      background: #047857;
      box-shadow: 0 0 12px rgba(5, 150, 105, 0.6);
    }
    .btn-tool-secondary {
      background: #334155;
      color: #e2e8f0;
      border: 1px solid #475569;
    }
    .btn-tool-secondary:hover {
      background: #475569;
      color: #ffffff;
    }

    /* Editable Styling */
    [contenteditable="true"] {
      transition: background-color 0.2s ease, outline 0.2s ease;
      border-radius: 2px;
    }
    [contenteditable="true"]:hover {
      outline: 1.5px dashed rgba(37, 99, 235, 0.5);
      background-color: rgba(37, 99, 235, 0.04);
      cursor: text;
    }
    [contenteditable="true"]:focus {
      outline: 2px solid #2563eb;
      background-color: rgba(37, 99, 235, 0.08);
    }

    /* PDF Page A4 Layout */
    .pdf-pages-container {
      padding: 12mm 0 20mm 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12mm;
    }
    .pdf-page {
      width: 210mm;
      height: 297mm;
      min-height: 297mm;
      max-height: 297mm;
      padding: 8mm;
      background: #ffffff;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      position: relative;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    }
    @media print {
      body {
        background: #ffffff !important;
      }
      .no-print-toolbar, .no-print-btn, .edit-tip-banner {
        display: none !important;
      }
      .pdf-pages-container {
        padding: 0 !important;
        gap: 0 !important;
      }
      .pdf-page {
        margin: 0 !important;
        padding: 8mm !important;
        page-break-after: always !important;
        break-after: page !important;
        box-shadow: none !important;
      }
      [contenteditable="true"] {
        outline: none !important;
        background: transparent !important;
      }
    }

    .page-inner-border {
      border: 3.5px double #1a365d;
      width: 100%;
      height: 100%;
      padding: 6mm 7mm;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    /* ── Header Section ────────────────────────────────── */
    .header-table {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 3.5mm;
      border-bottom: 2px solid #2b4c7e;
      margin-bottom: 3mm;
    }
    .header-logo-wrap {
      display: flex;
      align-items: center;
      gap: 3mm;
      flex: 0 0 38%;
    }
    .header-logo-img {
      height: 22mm;
      width: auto;
      object-fit: contain;
    }
    .header-contact-col {
      flex: 1;
      padding: 0 3mm;
      font-size: 8.5pt;
      line-height: 1.35;
      color: #334155;
    }
    .contact-item {
      display: flex;
      align-items: center;
      gap: 1.5mm;
      margin-bottom: 0.8mm;
    }
    .contact-icon {
      color: #2b6cb0;
      font-weight: bold;
      width: 3.5mm;
      text-align: center;
    }
    .contact-text {
      font-weight: 500;
    }
    .header-accreditations {
      flex: 0 0 24%;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 1.5mm;
    }
    .accred-badge {
      display: flex;
      align-items: center;
      gap: 2mm;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 3px;
      padding: 1.5mm 2.5mm;
      font-size: 7.5pt;
      color: #1e3a8a;
      font-weight: 700;
      text-align: right;
    }
    .slaito-text {
      color: #1e3a8a;
      letter-spacing: 0.5px;
      font-weight: 900;
      font-size: 9pt;
    }
    .srilanka-wonder {
      font-size: 8pt;
      font-weight: 800;
      color: #0d9488;
    }

    /* ── Main Title Banner ─────────────────────────────── */
    .title-banner {
      text-align: center;
      margin-bottom: 3mm;
    }
    .main-title {
      font-size: 13pt;
      font-weight: 900;
      color: #0f2942;
      letter-spacing: 0.5px;
      margin: 0 0 1.2mm 0;
      text-transform: uppercase;
    }
    .sub-title {
      font-size: 9pt;
      color: #334155;
      font-weight: 600;
    }
    .highlight-red {
      color: #dc2626;
      font-weight: 800;
    }

    /* ── Itinerary Table ───────────────────────────────── */
    .itin-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
      line-height: 1.35;
      margin-bottom: 2mm;
    }
    .itin-table th {
      background: #8fa9d4;
      color: #0f2942;
      font-weight: 800;
      font-size: 8.5pt;
      text-align: center;
      padding: 2.2mm 1.5mm;
      border: 1px solid #2b4c7e;
    }
    .itin-table td {
      border: 1px solid #4a6fa5;
      padding: 2mm 2mm;
      vertical-align: top;
      color: #0f172a;
    }
    .col-day {
      width: 9%;
      text-align: center;
      font-weight: 700;
      font-size: 8pt;
      background: #fafbfc;
    }
    .col-dest {
      width: 17%;
      font-weight: 700;
      font-size: 8.5pt;
      color: #0f2942;
    }
    .col-dist {
      width: 9%;
      text-align: center;
      font-weight: 700;
    }
    .col-time {
      width: 9%;
      text-align: center;
      font-weight: 700;
    }
    .col-attract {
      width: 38%;
      text-align: left;
    }
    .col-stay {
      width: 18%;
      text-align: left;
    }

    .attract-list {
      margin: 0;
      padding-left: 3.5mm;
    }
    .attract-list li {
      margin-bottom: 1.5mm;
    }
    .attract-list li:last-child {
      margin-bottom: 0;
    }
    .attract-title {
      font-weight: 700;
      color: #0f2942;
    }

    .hotel-name {
      font-weight: 800;
      font-style: italic;
      color: #0f2942;
      font-size: 8.5pt;
      display: block;
      margin-bottom: 0.5mm;
    }
    .hotel-room {
      font-weight: 600;
      font-style: italic;
      color: #334155;
      display: block;
      margin-bottom: 0.5mm;
    }
    .hotel-rating-plan {
      font-weight: 700;
      font-style: italic;
      color: #dc2626;
      font-size: 8pt;
    }

    /* ── Page 3 Sections: Inclusions, Exclusions, Terms, Bank ─── */
    .section-header-red {
      font-size: 10pt;
      font-weight: 800;
      color: #dc2626;
      margin: 2mm 0 1.5mm 0;
      display: flex;
      align-items: center;
      gap: 2mm;
    }
    .section-header-navy {
      font-size: 10pt;
      font-weight: 800;
      color: #0f2942;
      margin: 3mm 0 1.5mm 0;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .section-list {
      margin: 0 0 2mm 0;
      padding-left: 4.5mm;
      font-size: 8.5pt;
      line-height: 1.45;
      color: #1e293b;
    }
    .section-list li {
      margin-bottom: 1.2mm;
    }
    .nested-list {
      list-style-type: none;
      padding-left: 3mm;
      margin: 1mm 0 1.5mm 0;
    }
    .nested-list li {
      margin-bottom: 0.8mm;
    }
    .nested-list li::before {
      content: "- ";
      font-weight: bold;
      color: #475569;
    }

    /* Bank Account Card Box */
    .bank-card-box {
      background: #f8fafc;
      border: 1.5px solid #2b4c7e;
      border-radius: 4px;
      padding: 3mm 4mm;
      margin-top: 2mm;
    }
    .bank-grid {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      line-height: 1.4;
    }
    .bank-grid td {
      padding: 0.8mm 1mm;
      vertical-align: top;
    }
    .bank-label {
      width: 28%;
      font-weight: 700;
      color: #0f2942;
    }
    .bank-colon {
      width: 3%;
      font-weight: 700;
      text-align: center;
    }
    .bank-value {
      width: 69%;
      font-weight: 600;
      color: #1e293b;
    }
    .contact-person-row {
      margin-top: 3mm;
      padding-top: 2mm;
      border-top: 1.5px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9.5pt;
      font-weight: 800;
      color: #0f2942;
    }
    .contact-phone-badge {
      background: #1e3a8a;
      color: #ffffff;
      padding: 1.5mm 3.5mm;
      border-radius: 3px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }

    /* Footer Branding */
    .page-footer {
      margin-top: auto;
      padding-top: 2mm;
      border-top: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7pt;
      color: #64748b;
    }
  </style>
</head>
<body>

  <!-- Web-Only Action Toolbar -->
  <div class="no-print-toolbar">
    <div class="toolbar-brand">
      <span style="font-weight: 900; color: #38bdf8; letter-spacing: 0.5px;">SUNBIRD LANKA TOURS</span>
      <span style="color: #64748b;">•</span>
      <span style="font-size: 0.85rem; color: #cbd5e1;">Client Itinerary Studio</span>
      <span class="toolbar-status" id="toolbar-sync-status">⚡ Live App Data Synced</span>
    </div>
    <div class="toolbar-actions">
      <button type="button" class="btn-tool btn-tool-secondary" onclick="addAttractionPrompt()" title="Add a custom attraction bullet point to any day">
        ➕ Add Attraction
      </button>
      <button type="button" class="btn-tool btn-tool-secondary" onclick="resetToLiveData()" title="Reset any edits back to current live app data">
        ↺ Reset App Data
      </button>
      <button type="button" class="btn-tool btn-tool-print" onclick="window.print()" title="Print directly or save as PDF">
        🖨️ Print / Save to PDF
      </button>
      <a href="SunBird_Lanka_Tours_Itinerary.pdf" download="SunBird_Lanka_Tours_Itinerary.pdf" class="btn-tool btn-tool-download" title="Download pre-generated PDF file">
        ⬇️ Download PDF
      </a>
    </div>
  </div>

  <div class="pdf-pages-container" id="pdf-pages-container">
    <!-- Dynamically populated from Live App Data or Fallback Reference Data -->
  </div>

  <script>
    const EMBEDDED_LOGO_B64 = "__LOGO_B64__";

    // Default Fallback Dataset (matching reference PDF)
    const DEFAULT_ITINERARY_DATA = {
      days: 7,
      nights: 6,
      touristsCount: 2,
      periodTitle: "Period from 26th August to 01st Sep 2026 <span class=\\"highlight-red\\">(06 Nights/07 Days)</span> - 2 Adults",
      rows: [
        {
          dayNum: 1,
          dateStr: "26th<br>Aug",
          destination: "Airport (CMB) -<br>Sigiriya",
          distanceKm: 150,
          travelTimeHours: "3.5",
          attractions: [
            "Arrive at Colombo Airport and transfer to hotel in Sigiriya.",
            "<strong>Dambulla Cave Temple</strong>, a UNESCO World Heritage Site, has five cave temples with ancient murals, 150+ Buddha statues, and the iconic Golden Buddha statue."
          ],
          overnight: {
            name: "Kassapa Lions Rock",
            room: "Deluxe Chalet",
            stars: 4,
            mealPlan: "HB"
          }
        },
        {
          dayNum: 2,
          dateStr: "27th<br>Aug",
          destination: "Sigiriya-Kandy",
          distanceKm: 90,
          travelTimeHours: "2.5",
          attractions: [
            "<strong>Village Tour and Bullock Cart Ride</strong> – Experience rural Sri Lankan village life, traditional cooking, and boat rides on a catamaran. Ideal for families and cultural explorers.",
            "<strong>Ayurveda & Spice Garden Visit:</strong> Discover ancient healing traditions, medicinal herbs, and natural beauty products at a traditional Ayurveda and spice garden.",
            "<strong>Kandy</strong>, Sri Lanka’s cultural heart, features the UNESCO-listed Temple of the Sacred Tooth, scenic hills, Kandy Lake, botanical gardens, cultural shows, and vibrant markets."
          ],
          overnight: {
            name: "Mount Randholee",
            room: "Deluxe Room",
            stars: 4,
            mealPlan: "HB"
          }
        },
        {
          dayNum: 3,
          dateStr: "28th<br>Aug",
          destination: "Kandy-Nuwara<br>Eliya",
          distanceKm: 90,
          travelTimeHours: "3.0",
          attractions: [
            "A <strong>gem lapidary visit</strong> showcases Sri Lanka’s gemstones, including rubies and the rare blue sapphire.",
            "A <strong>Sri Lankan tea factory visit</strong> offers a hands-on look at Ceylon tea production, from leaf to brew, amid scenic views and colonial charm.",
            "<strong>Victoria Park</strong> – Featuring Victorian flower beds, walking trails, and a mini railway. A hotspot for birdwatching during March–May blooms.",
            "<strong>Gregory Lake</strong> – A serene, man-made lake in the heart of town—perfect for boat rides, family picnics, lakeside strolls, or even a playful “lake party” during peak season."
          ],
          overnight: {
            name: "Araliya Green City",
            room: "Superior room",
            stars: 5,
            mealPlan: "HB"
          }
        },
        {
          dayNum: 4,
          dateStr: "29th<br>Aug",
          destination: "Nuwara Eliya-<br>Ella",
          distanceKm: 55,
          travelTimeHours: "2.0",
          attractions: [
            "<strong>Train Ride from Nuwara Eliya to Ella</strong> (Morning time) depending on the availability.",
            "<strong>Nine Arch Bridge (Bridge in the Sky)</strong> – A remarkable colonial-era railway viaduct built in 1921 using only stone and brick.",
            "<strong>Ravana Falls</strong> – A 25 m cascade close to town—dip in its pools or explore the legendary Ravana Cave above via steep steps."
          ],
          overnight: {
            name: "Misty Hills Ella Resort",
            room: "Deluxe with Balcony",
            stars: 3,
            mealPlan: "HB"
          }
        },
        {
          dayNum: 5,
          dateStr: "30th<br>Aug",
          destination: "Ella- Mirissa",
          distanceKm: 180,
          travelTimeHours: "5.0",
          attractions: [
            "<strong>Mirissa</strong> is a laid-back beach town known for golden beaches, whale watching, surfing, snorkeling, fresh seafood, and stunning sunsets."
          ],
          overnight: {
            name: "Paradise Beach Club",
            room: "Junior Suite - Sea view",
            stars: 4,
            mealPlan: "HB"
          }
        },
        {
          dayNum: 6,
          dateStr: "31st<br>Aug",
          destination: "Mirissa-Galle / Galle-Bentota",
          segments: [
            { dest: "Mirissa-Galle", km: 40, hrs: "1.0" },
            { dest: "Galle-Bentota", km: 70, hrs: "1.5" }
          ],
          attractions: [
            "<strong>Galle Dutch Fort</strong>, a UNESCO World Heritage Site, features historic ramparts, ocean views, the iconic lighthouse, and a charming colonial neighborhood.",
            "<strong>Beautiful Southern Beaches & Attractions:</strong> Enjoy the scenic southern coastline, golden beaches, and some of Sri Lanka's most popular coastal attractions."
          ],
          overnight: {
            name: "EKHO Surf",
            room: "Premium Sea view with Balcony",
            stars: 4,
            mealPlan: "HB"
          }
        },
        {
          dayNum: 7,
          dateStr: "01st<br>Sep",
          destination: "Bentota-Colombo / Colombo-Airport",
          segments: [
            { dest: "Bentota-Colombo", km: 100, hrs: "2.0" },
            { dest: "Colombo- Airport (CMB)", km: 35, hrs: "1.0" }
          ],
          attractions: [
            "<strong>Gangaramaya Temple</strong> – Iconic temple with diverse architecture, a museum, and a sacred Bodhi tree.",
            "<strong>Independence Memorial Hall</strong> – Historic monument marking Sri Lanka’s 1948 independence, featuring colonial architecture and serene open spaces.",
            "<strong>Colombo Port City & Marina Promenade</strong> – Modern waterfront with scenic walkways and luxury attractions; ideal for an evening visit.",
            "<strong style=\\"color:#dc2626;\\">Departure</strong> {01:00 hrs on 2nd Sep}"
          ],
          overnight: {
            name: "Airport Transit & Departure",
            room: "VIP Departure Transfer",
            stars: 5,
            mealPlan: "Departure"
          }
        }
      ]
    };

    function loadItineraryData() {
      const liveJson = localStorage.getItem('sunbird_live_itinerary');
      if (liveJson) {
        try {
          const parsed = JSON.parse(liveJson);
          if (parsed && parsed.rows && parsed.rows.length > 0) {
            const statusEl = document.getElementById('toolbar-sync-status');
            if (statusEl) {
              statusEl.textContent = '⚡ Live App Data Synced (' + parsed.days + ' Days / ' + parsed.nights + ' Nights - ' + (parsed.touristsCount || 2) + ' Guests)';
            }
            return parsed;
          }
        } catch(e) {
          console.error("Error parsing sunbird_live_itinerary", e);
        }
      }
      const statusEl = document.getElementById('toolbar-sync-status');
      if (statusEl) statusEl.textContent = 'ℹ️ Default Reference Itinerary';
      return DEFAULT_ITINERARY_DATA;
    }

    function renderItinerary() {
      const data = loadItineraryData();
      const container = document.getElementById('pdf-pages-container');
      container.innerHTML = '';

      // Partition rows across pages:
      // Page 1: Days 1 to 3
      // Page 2: Days 4 to N
      // Page 3: Inclusions, Exclusions, Terms, Bank
      const page1Rows = data.rows.slice(0, 3);
      const page2Rows = data.rows.slice(3);

      // ── RENDER PAGE 1 ──────────────────────────────────────────
      const p1 = document.createElement('div');
      p1.className = 'pdf-page';
      p1.innerHTML = `
        <div class="page-inner-border">
          ${getHeaderHtml()}
          <div class="title-banner">
            <h1 class="main-title" contenteditable="true">HOTEL ARRANGEMENTS WITH TRANSPORT SERVICES</h1>
            <div class="sub-title" contenteditable="true">
              ${data.periodTitle || 'Period from 26th August to 01st Sep 2026 <span class="highlight-red">(06 Nights/07 Days)</span> - 2 Adults'}
            </div>
          </div>
          <table class="itin-table">
            <thead>
              <tr>
                <th class="col-day">Day</th>
                <th class="col-dest">Destination</th>
                <th class="col-dist">Distance<br>(Km)</th>
                <th class="col-time">Travel<br>Time<br>(hours)</th>
                <th class="col-attract">Attractions</th>
                <th class="col-stay">Overnight Stay</th>
              </tr>
            </thead>
            <tbody>
              ${renderTableRowsHtml(page1Rows)}
            </tbody>
          </table>
          <div class="page-footer">
            <span>Sunbird Lanka Tours & Travels (Pvt) Ltd &bull; www.sunbirdtours.lk</span>
            <span>Page 1 of 3</span>
          </div>
        </div>
      `;
      container.appendChild(p1);

      // ── RENDER PAGE 2 ──────────────────────────────────────────
      const p2 = document.createElement('div');
      p2.className = 'pdf-page';
      p2.innerHTML = `
        <div class="page-inner-border">
          <table class="itin-table" style="margin-top: 1mm;">
            <thead>
              <tr>
                <th class="col-day">Day</th>
                <th class="col-dest">Destination</th>
                <th class="col-dist">Distance<br>(Km)</th>
                <th class="col-time">Travel<br>Time<br>(hours)</th>
                <th class="col-attract">Attractions</th>
                <th class="col-stay">Overnight Stay</th>
              </tr>
            </thead>
            <tbody>
              ${renderTableRowsHtml(page2Rows)}
            </tbody>
          </table>
          <div class="page-footer">
            <span>Sunbird Lanka Tours & Travels (Pvt) Ltd &bull; www.sunbirdtours.lk</span>
            <span>Page 2 of 3</span>
          </div>
        </div>
      `;
      container.appendChild(p2);

      // ── RENDER PAGE 3 ──────────────────────────────────────────
      const p3 = document.createElement('div');
      p3.className = 'pdf-page';
      p3.innerHTML = `
        <div class="page-inner-border">
          ${renderPage3Content(data)}
          <div class="page-footer">
            <span>Sunbird Lanka Tours & Travels (Pvt) Ltd &bull; www.sunbirdtours.lk</span>
            <span>Page 3 of 3</span>
          </div>
        </div>
      `;
      container.appendChild(p3);
    }

    function getHeaderHtml() {
      return `
        <div class="header-table">
          <div class="header-logo-wrap">
            <img class="header-logo-img" src="data:image/jpeg;base64,${EMBEDDED_LOGO_B64}" alt="Sunbird Lanka Tours Logo">
          </div>
          <div class="header-contact-col" contenteditable="true">
            <div class="contact-item">
              <span class="contact-icon">📍</span>
              <span class="contact-text">403 – Elakanda Road, Hendala, Wattala, -11300 Sri Lanka.</span>
            </div>
            <div class="contact-item">
              <span class="contact-icon">✉</span>
              <span class="contact-text">sunbirdlankatours@gmail.com</span>
            </div>
            <div class="contact-item">
              <span class="contact-icon">📞</span>
              <span class="contact-text">(+94) 766 800 130 &nbsp;|&nbsp; (+94) 112 938 465</span>
            </div>
            <div class="contact-item">
              <span class="contact-icon">🌐</span>
              <span class="contact-text">www.sunbirdtours.lk</span>
            </div>
          </div>
          <div class="header-accreditations">
            <div class="accred-badge">
              <span class="slaito-text">Slaito</span>
              <span>Approved Tour Operator</span>
            </div>
            <div class="accred-badge">
              <span class="srilanka-wonder">srilanka</span>
              <span style="font-size: 6.5pt; color: #475569;">WONDER OF ASIA</span>
            </div>
          </div>
        </div>
      `;
    }

    function renderTableRowsHtml(rows) {
      let html = '';
      rows.forEach(r => {
        if (r.segments && r.segments.length > 1) {
          const segCount = r.segments.length;
          html += `
            <tr>
              <td class="col-day" rowspan="${segCount}" contenteditable="true">${r.dateStr}</td>
              <td class="col-dest" contenteditable="true">${r.segments[0].dest}</td>
              <td class="col-dist" contenteditable="true">${r.segments[0].km}</td>
              <td class="col-time" contenteditable="true">${r.segments[0].hrs}</td>
              <td class="col-attract" rowspan="${segCount}" contenteditable="true">
                <ul class="attract-list">
                  ${r.attractions.map(a => `<li>${a}</li>`).join('')}
                </ul>
              </td>
              <td class="col-stay" rowspan="${segCount}" contenteditable="true">
                ${renderOvernightHtml(r.overnight)}
              </td>
            </tr>
          `;
          for (let s = 1; s < segCount; s++) {
            html += `
              <tr>
                <td class="col-dest" contenteditable="true">${r.segments[s].dest}</td>
                <td class="col-dist" contenteditable="true">${r.segments[s].km}</td>
                <td class="col-time" contenteditable="true">${r.segments[s].hrs}</td>
              </tr>
            `;
          }
        } else {
          html += `
            <tr>
              <td class="col-day" contenteditable="true">${r.dateStr}</td>
              <td class="col-dest" contenteditable="true">${r.destination}</td>
              <td class="col-dist" contenteditable="true">${r.distanceKm}</td>
              <td class="col-time" contenteditable="true">${r.travelTimeHours}</td>
              <td class="col-attract" contenteditable="true">
                <ul class="attract-list">
                  ${r.attractions.map(a => `<li>${a}</li>`).join('')}
                </ul>
              </td>
              <td class="col-stay" contenteditable="true">
                ${renderOvernightHtml(r.overnight)}
              </td>
            </tr>
          `;
        }
      });
      return html;
    }

    function renderOvernightHtml(stay) {
      if (!stay || !stay.name) {
        return `<span style="color: #64748b; font-style: italic;" contenteditable="true">To be assigned</span>`;
      }
      const mealPlan = stay.mealPlan || 'HB';
      const starsLabel = stay.stars ? `(${stay.stars} star)-${mealPlan}` : mealPlan;
      return `
        <span class="hotel-name">${stay.name}</span>
        <span class="hotel-room">${stay.room || 'Deluxe Room'}</span>
        <span class="hotel-rating-plan">${starsLabel}</span>
      `;
    }

    function renderPage3Content(data) {
      const guests = data.touristsCount || 2;
      const vehicleDesc = (guests > 6) 
        ? "Private transport with an English-speaking tourist chauffeur driver and air-conditioned Luxury Mini Coach for the entire tour, including all transfers"
        : (guests > 2)
          ? "Private transport with an English-speaking tourist driver and air-conditioned Luxury Van for the entire tour, including all transfers"
          : "Private transport with an English-speaking tourist driver and air-conditioned Car for the entire tour, including all transfers";

      let roomDesc = "Accommodation in 1 double/Twin-sharing room with the specified meal plan at hotels listed in the itinerary (HB - Dinner & Breakfast)";
      if (data.rooms && data.rooms.length > 0) {
        const roomCounts = {};
        data.rooms.forEach(r => {
          roomCounts[r.type] = (roomCounts[r.type] || 0) + 1;
        });
        const parts = Object.entries(roomCounts).map(([type, count]) => `${count} ${type}`);
        roomDesc = `Accommodation in ${parts.join(', ')} with the specified meal plan at hotels listed in the itinerary (HB - Dinner & Breakfast)`;
      }

      return `
        <!-- Price Includes -->
        <div class="section-header-red">
          <span>✔</span> <span contenteditable="true">Price Includes</span>
        </div>
        <ul class="section-list" contenteditable="true">
          <li><strong>${roomDesc}</strong></li>
          <li><strong>Additional room supplement</strong> in Kandy hotel during festival dates if applicable</li>
          <li><strong>${vehicleDesc}</strong></li>
          <li><strong>24/7 customer support</strong> with a dedicated travel coordinator assigned to assist you throughout your journey</li>
        </ul>

        <!-- Price Excludes -->
        <div class="section-header-red" style="margin-top: 2mm;">
          <span>✖</span> <span contenteditable="true">Price Excludes:</span>
        </div>
        <ul class="section-list" contenteditable="true">
          <li>Airfare, Visa & travel insurance</li>
          <li>Meals (lunch) which are not specified in the itinerary</li>
          <li>Expenses of personal nature such as laundry, mini bar charges, beverages, liquor, telephone charges, etc.</li>
          <li>Tip money (appreciations) to the driver, bellboys etc.</li>
          <li><strong>Site entrance fee:</strong>
            <ul class="nested-list">
              <li>Dambulla Cave Temple – 10 USD pp</li>
              <li>Village tour – 20 USD pp</li>
              <li>Tooth Relic Temple – 10 USD pp / {7.5 USD for SAARC Countries}</li>
              <li>Train Ride – 20 to 25 USD pp</li>
              <li>Turtle hatcheries – 10 USD pp</li>
              <li>Gangaramaya Buddhist Temple – 2 USD per person</li>
            </ul>
          </li>
        </ul>

        <!-- Terms & Conditions of the Hotel -->
        <div class="section-header-navy" contenteditable="true">TERMS & CONDITIONS OF THE HOTEL</div>
        <ul class="section-list" contenteditable="true">
          <li>Hotels in the itinerary might be slightly changed based on the availability before our confirmation (Rooms will be held on confirmation only).</li>
          <li>Standard check-in time: <strong>14:00 hrs</strong> &bull; Checkout time: <strong>12:00 hrs</strong></li>
          <li>All prices mentioned herewith are inclusive of local Government taxes and service charges.</li>
          <li><strong>50% advance</strong> with confirmation of the tour and balance before the arrival.</li>
        </ul>

        <!-- Bank Account Details Card -->
        <div class="section-header-navy" style="margin-top: 2mm;" contenteditable="true">BANK ACCOUNT - DETAILS</div>
        <div class="bank-card-box" contenteditable="true">
          <table class="bank-grid">
            <tr>
              <td class="bank-label">Account Name</td>
              <td class="bank-colon">:</td>
              <td class="bank-value"><strong>Sunbird Lanka Tours & Travels (Pvt) Ltd</strong></td>
            </tr>
            <tr>
              <td class="bank-label">Account No</td>
              <td class="bank-colon">:</td>
              <td class="bank-value"><strong>8010004785</strong> (USD Account)</td>
            </tr>
            <tr>
              <td class="bank-label">Bank</td>
              <td class="bank-colon">:</td>
              <td class="bank-value"><strong>Commercial Bank of Ceylon Plc</strong></td>
            </tr>
            <tr>
              <td class="bank-label">Wattala Branch</td>
              <td class="bank-colon">:</td>
              <td class="bank-value">No, 396, Negombo Road, Wattala, Sri Lanka</td>
            </tr>
            <tr>
              <td class="bank-label">Bank Code</td>
              <td class="bank-colon">:</td>
              <td class="bank-value"><strong>7056</strong></td>
            </tr>
            <tr>
              <td class="bank-label">SWIFT Code</td>
              <td class="bank-colon">:</td>
              <td class="bank-value"><strong>CCEYLKLX</strong></td>
            </tr>
          </table>

          <div class="contact-person-row">
            <div>Contact Person: <span style="font-weight: 900; color: #1e3a8a;">Rohana Hettiarachchi</span></div>
            <div class="contact-phone-badge">📞 +94 766800130</div>
          </div>
        </div>
      `;
    }

    function addAttractionPrompt() {
      const dayStr = prompt("Which Day would you like to add an attraction to? (e.g. 1, 2, 3...):", "1");
      if (!dayStr) return;
      const title = prompt("Attraction Title (e.g. Pidurangala Rock Sunset Hike):", "");
      if (!title) return;
      const desc = prompt("Attraction Description:", "");
      
      let targetRow = null;
      document.querySelectorAll('.col-day').forEach(td => {
        if (td.textContent.trim().startsWith(dayStr)) {
          targetRow = td.closest('tr');
        }
      });
      if (targetRow) {
        const attractCol = targetRow.querySelector('.col-attract ul') || targetRow.querySelector('.col-attract');
        if (attractCol) {
          const li = document.createElement('li');
          li.innerHTML = `<strong>${title}</strong>${desc ? ' – ' + desc : ''}`;
          if (attractCol.tagName === 'UL') {
            attractCol.appendChild(li);
          } else {
            const ul = document.createElement('ul');
            ul.className = 'attract-list';
            ul.appendChild(li);
            attractCol.appendChild(ul);
          }
          li.scrollIntoView({ behavior: 'smooth', block: 'center' });
          alert("Attraction added! You can click on it directly to edit anytime.");
        }
      } else {
        alert("Day " + dayStr + " not found on the page.");
      }
    }

    function resetToLiveData() {
      if (confirm("Reset all text back to the latest Live App Data? Any manual edits on this page will be reloaded.")) {
        renderItinerary();
      }
    }

    // Auto-render on load
    document.addEventListener('DOMContentLoaded', () => {
      renderItinerary();
    });
  </script>

</body>
</html>
"""

final_html = raw_html.replace("__LOGO_B64__", logo_b64)

with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
    f.write(final_html)

print(f"Successfully generated dynamic {OUTPUT_HTML} (size: {len(final_html)} bytes)")
