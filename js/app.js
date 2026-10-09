/**
 * SunBird Sri Lanka Travel Itinerary Planner
 * Day & Night Timeline Visualizer Logic with Arrival Trimming & Date Header
 */

(function () {
  'use strict';

  // Default Tour Presets
  const PRESETS = [
    { name: '3D / 2N Weekend', days: 3, nights: 2, destinations: ['Negombo', 'Kandy', 'Colombo'] },
    { name: '5D / 4N Heritage', days: 5, nights: 4, destinations: ['Negombo', 'Sigiriya', 'Anuradhapura', 'Kandy', 'Colombo'] },
    { name: '7D / 6N Classic Ceylon', days: 7, nights: 6, destinations: ['Negombo', 'Sigiriya', 'Kandy', 'Nuwara Eliya', 'Ella', 'Bentota', 'Colombo'] },
    { name: '10D / 9N Island Highlights', days: 10, nights: 9, destinations: ['Negombo', 'Sigiriya', 'Dambulla', 'Kandy', 'Nuwara Eliya', 'Ella', 'Yala', 'Mirissa', 'Galle', 'Colombo'] },
    { name: '14D / 13N Grand Ceylon', days: 14, nights: 13, destinations: ['Negombo', 'Anuradhapura', 'Trincomalee', 'Sigiriya', 'Kandy', 'Nuwara Eliya', 'Ella', 'Yala', 'Tangalle', 'Mirissa', 'Galle', 'Bentota', 'Colombo', 'Airport (BIA)'] }
  ];

  // Constants
  const STANDARD_DAY_WIDTH = 130; // px for a full daytime segment (scaled up for better legibility)
  const NIGHT_SQUARE_WIDTH = 36;  // px for the lime-green night square

  // Application State
  const state = {
    days: 8,
    nights: 7,
    arrivalDate: '2026-08-27', // Defaults to Aug 27 so Day 2 is AUG 28 TUE, matching Image 3
    arrivalTime: '20:00',      // Defaults to 08:00 PM, matching Image 2 & 3
    filter: 'none',           // 'none' by default
    zoom: 1.2,                 // Timeline zoom expansion scale (0.5 to 2.5, default 120%)
    indicatorPoint: null,      // Current snapped 30-min time point object
    hotelTimings: {},          // Per-night check-in and check-out hours: { [nightNum]: { checkIn: 14.0, checkOut: 10.0 } }
    mergedNights: {},          // Map of merged night boundaries: { [nightNum]: true } (Night N continues into Night N+1)
    selectedPiece: null,       // Selected Day Bar piece: { type: 'day' | 'night', index: number } | null
    activeSideTab: 'destinations', // 'destinations' | 'hotels' | 'activity'
    selectedDayIndex: 0,       // Day 1 selected
    selectedDestIndex: -1,     // Selected destination index in real destinations list
    selectedDestName: 'Sigiriya',      // Currently focused destination
    selectedDestSlot: 0,       // Active destination slot on multi-dest days (0 = Stop 1, 1 = Stop 2)
    dayDestinations: ['Sigiriya', 'Anuradhapura', 'Kandy', 'Nuwara Eliya', 'Ella', 'Yala', 'Galle', 'Colombo'], // Per-day assigned destinations
    checkedDestinations: { 0: true },   // Checked destination map
    selectedAttractions: {},           // Map of { [dayIndex]: [ { title, desc, checked, custom } ] }
    expandedAttractionDays: { 0: true }, // Default Day 1 expanded matching wireframe
    expandedAttractionItems: { '0-Climb Sigiriya Rock Fortress': true }, // Default item expanded matching wireframe
    attractSearchTerm: '',
    destSearchTerm: '',
    hotelSearchTerm: '',
    hotelStarFilter: '4',      // '4' (default matching wireframe) | '5' | '3' | 'all'
    hotelRatingFilter: 'all',  // 'all' | '4.5' | '4.0'
    hotelRegionMode: 'auto',   // 'auto' (regional) | 'all' (all island)
    hotelDisplayLimit: 35,     // Progressive render batch limit
    selectedHotelIndex: 0,
    selectedHotelName: 'Heritance Kandalama',
    checkedHotels: { 0: true },
    hotelBookings: { 1: 'Heritance Kandalama' }, // Per-night hotel booking details: { [nightNum]: hotelName }
    expandedHotelName: null,   // Currently expanded hotel in sidebar accordion (only one at a time)
    hotelRoomRates: {},        // Per-hotel room amounts: { [hotelName]: { [roomType]: '100 USD' } }
    hotelMealPlans: {},        // Per-hotel meal plan: { [hotelName]: 'HB' | 'FB' | 'BB' | 'RO' | 'AI' }
    nightMealPlans: {},        // Per-night meal plan override: { [nightNum]: 'HB' | 'FB' | 'BB' | 'RO' | 'AI' }
    hotelRoomCounts: {},       // Per-hotel custom room counts: { [hotelName]: { [idx]: count } }
    hotelRoomTypes: {},        // Per-hotel custom room types: { [hotelName]: { [idx]: typeName } }
    activeMainView: 'map',      // 'map' | 'itinerary' | 'fleet' | 'advisory'
    activePdfVersion: 'modern', // 'modern' | 'classic'
    routeMode: 'normal',       // Route mode — always normal routes
    touristsCount: 14,         // Number of tourists
    rooms: [                   // Room allocations array matching media_1789984716153.png
      { id: 'room-1', type: 'Double Single', capacity: 2 },
      { id: 'room-2', type: 'Standard Single', capacity: 1 }
    ],
    currency: 'USD',           // 'USD' | 'LKR' — Currency toggle for pricing display
    employees: []              // Assigned employees: ['Driver', 'Guide', ...]
  };
  window.appState = state;
  window.state = state;

  // Cached DOM Elements
  let daysInput, nightsInput;
  let daysDecBtn, daysIncBtn, nightsDecBtn, nightsIncBtn;
  let arrivalDateInput, arrivalTimeInput;
  let quickTimeChips;
  let presetsContainer;
  let dateHeaderTrack;
  let timelineTrack;
  let hotelsTrack;
  let arrivalMarker;
  let arrivalBadgeText;
  let filterNightsBtn, filterDaysBtn;
  let exportPngBtn;
  let toastEl;
  let zoomSlider;
  let zoomOutBtn, zoomInBtn;
  let zoomLevelBadge;
  let timelineScrollContainer;
  let liveSystemClock;

  // Selected Day Journey Status Bar Elements (Image 1, 2, 3)
  let timelineDayStatusBar, dayStatusEmpty, dayStatusActive, nightStatusActive, nightStatusTitle;
  let statusOriginIcon, statusOriginName, statusDayBadge;
  let statusDestIcon, statusDestName;
  let destAssignmentHeader;
  let sidebarTopStatusBar, sidebarStatusEmpty, sidebarStatusActive, sidebarDayPill, sidebarJourneySummary;

  // Itinerary Explorer Elements (media_1789834885720.png / media_1789842399603.png)
  let sideTabBtns, sideTabIndicator;
  let paneDestinations, paneHotels, paneActivity;
  let destCardsList, hotelsCardsList, activitiesCardsList;
  let destSearchInput, hotelSearchInput;
  let attractSearchInput, attractSummaryText, attractExpandAllBtn;
  let hotelCustomFilters, hotelDestFilterLine, hotelDestLineLeft, hotelDestHeading, hotelDestShowallBtn;
  let hotelStarFilterLine, hotelStarLineLeft, hotelStarHeading, hotelStarShowallBtn;

  // Climate & Season Elements
  let tourismSeasonCard, tourismSeasonTitle;
  let monsoonStatusCard, monsoonStatusTitle;
  let seasonAdvisoryBar, advisoryPill, advisoryText;

  // Map-Space Views Elements (media_1789843513818.png)
  let headerNavBtns;
  let mapSpaceViews, mapViewCloseBtn, btnExportPdf, mapViewTitle, mapViewIcon, mapViewBadge;
  let mapSpaceViewPanes;
  let durationTotalBadge, ratioDayBar, ratioNightBar;

  // Itinerary Information Elements (media_1789981633996.png / media_1789984716153.png)
  let touristsInput, touristsDecBtn, touristsIncBtn;
  let touristsBadgeBox, touristsBadgeCount, touristsBadgeLabel, touristsBadgeIcon;
  let paxBarBooked, paxBarRemaining, paxLegendBookedText, paxLegendRemainingText, paxLegendTotalText;
  let roomTypeBtn, roomTypeDropdown;
  let roomCardsContainer, touristRoomSummaryTag;
  let updateCurrencyUI, renderEmployeeProfiles, updateHotelRatingStarsUI;

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    cacheDOMElements();
    setupEventListeners();

    // Disable browser right-click context menu
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    setupHeaderNav();
    setupSideTabs();
    initItinConfigTabs();
    initCurrencyToggle();
    initHotelRatingStars();
    initEmployeeTab();
    setupArrivalDetailsControls();
    renderPresets();
    setupTouristsAndRooms();
    renderRoomList();
    if (state.dayDestinations && state.dayDestinations.length > 0) {
      if (!state.selectedAttractions) state.selectedAttractions = {};
      for (let d = 1; d < state.days; d++) {
        const cur = state.dayDestinations[d];
        const prev = state.dayDestinations[d - 1];
        const nightN = d + 1;
        const hasHotel = (state.hotelBookings && state.hotelBookings[nightN] && state.hotelBookings[nightN] !== 'Selected Hotel' && !state.hotelBookings[nightN].includes('Fill the Itinerary'));
        const hasCustomAttract = (state.selectedAttractions && state.selectedAttractions[d] && state.selectedAttractions[d].some(a => a.custom));
        if (cur === 'Sigiriya' && (prev === 'Sigiriya' || prev === 'Anuradhapura') && !hasHotel && !hasCustomAttract) {
          state.dayDestinations[d] = '';
          state.selectedAttractions[d] = [];
        }
      }
      for (let d = 0; d < state.days; d++) {
        if (state.dayDestinations[d] && (!state.selectedAttractions[d] || state.selectedAttractions[d].length === 0)) {
          state.selectedAttractions[d] = getDefaultAttractionsForDay(d);
        }
      }
    }
    updateUI();
    syncLiveItineraryToStorage();
    startLiveClock();
    initItineraryHub();
  });

  function cacheDOMElements() {
    daysInput = document.getElementById('days-input');
    nightsInput = document.getElementById('nights-input');
    daysDecBtn = document.getElementById('days-dec');
    daysIncBtn = document.getElementById('days-inc');
    nightsDecBtn = document.getElementById('nights-dec');
    nightsIncBtn = document.getElementById('nights-inc');
    arrivalDateInput = document.getElementById('arrival-date-input');
    arrivalTimeInput = document.getElementById('arrival-time-input');
    quickTimeChips = document.getElementById('quick-time-chips');
    presetsContainer = document.getElementById('presets-list');
    dateHeaderTrack = document.getElementById('date-header-track');
    timelineTrack = document.getElementById('timeline-track');
    hotelsTrack = document.getElementById('hotels-track');
    arrivalMarker = document.getElementById('arrival-marker');
    arrivalBadgeText = document.getElementById('arrival-badge-text');
    filterNightsBtn = document.getElementById('filter-nights-btn');
    filterDaysBtn = document.getElementById('filter-days-btn');
    exportPngBtn = document.getElementById('export-png-btn');
    toastEl = document.getElementById('toast');
    zoomSlider = document.getElementById('timeline-zoom-slider');
    zoomOutBtn = document.getElementById('zoom-out-btn');
    zoomInBtn = document.getElementById('zoom-in-btn');
    zoomLevelBadge = document.getElementById('zoom-level-badge');
    timelineScrollContainer = document.querySelector('.timeline-scroll-container');
    liveSystemClock = document.getElementById('live-system-clock');

    // Selected Day Journey Status Bar Elements
    timelineDayStatusBar = document.getElementById('timeline-day-status-bar');
    dayStatusEmpty = document.getElementById('day-status-empty');
    dayStatusActive = document.getElementById('day-status-active');
    nightStatusActive = document.getElementById('night-status-active');
    nightStatusTitle = document.getElementById('night-status-title');
    statusOriginIcon = document.getElementById('status-origin-icon');
    statusOriginName = document.getElementById('status-origin-name');
    statusDayBadge = document.getElementById('status-day-badge');
    statusDestIcon = document.getElementById('status-dest-icon');
    statusDestName = document.getElementById('status-dest-name');
    destAssignmentHeader = document.getElementById('dest-assignment-header');

    // Sidebar Top Status Bar (Matching Image 2: media_1789914324271.png)
    sidebarTopStatusBar = document.getElementById('sidebar-top-status-bar');
    sidebarStatusEmpty = document.getElementById('sidebar-status-empty');
    sidebarStatusActive = document.getElementById('sidebar-status-active');
    sidebarDayPill = document.getElementById('sidebar-day-pill');
    sidebarJourneySummary = document.getElementById('sidebar-journey-summary');

    // Itinerary Explorer DOM Elements
    sideTabBtns = document.querySelectorAll('.side-tab-btn');
    sideTabIndicator = document.getElementById('side-tab-indicator');
    paneDestinations = document.getElementById('pane-destinations');
    paneHotels = document.getElementById('pane-hotels');
    paneActivity = document.getElementById('pane-activity');
    destCardsList = document.getElementById('destination-cards-list');
    hotelsCardsList = document.getElementById('hotels-cards-list');
    activitiesCardsList = document.getElementById('activities-cards-list');
    destSearchInput = document.getElementById('dest-search-input');
    hotelSearchInput = document.getElementById('hotel-search-input');
    attractSearchInput = document.getElementById('attract-search-input');
    attractSummaryText = document.getElementById('attract-summary-text');
    attractExpandAllBtn = document.getElementById('attract-expand-all-btn');
    hotelCustomFilters = document.getElementById('hotel-custom-filters');
    hotelDestFilterLine = document.getElementById('hotel-dest-filter-line');
    hotelDestLineLeft = document.getElementById('hotel-dest-line-left');
    hotelDestHeading = document.getElementById('hotel-dest-heading');
    hotelDestShowallBtn = document.getElementById('hotel-dest-showall-btn');
    hotelStarFilterLine = document.getElementById('hotel-star-filter-line');
    hotelStarLineLeft = document.getElementById('hotel-star-line-left');
    hotelStarHeading = document.getElementById('hotel-star-heading');
    hotelStarShowallBtn = document.getElementById('hotel-star-showall-btn');

    // Season & Climate DOM Elements
    tourismSeasonCard = document.getElementById('tourism-season-card');
    tourismSeasonTitle = document.getElementById('tourism-season-title');
    monsoonStatusCard = document.getElementById('monsoon-status-card');
    monsoonStatusTitle = document.getElementById('monsoon-status-title');
    seasonAdvisoryBar = document.getElementById('season-advisory-bar');
    advisoryPill = document.getElementById('advisory-pill');
    advisoryText = document.getElementById('advisory-text');

    // Map-Space Views Elements (media_1789843513818.png)
    headerNavBtns = document.querySelectorAll('.header-nav-tabs .nav-tab-btn');
    mapSpaceViews = document.getElementById('map-space-views');
    mapViewCloseBtn = document.getElementById('map-view-close-btn');
    btnExportPdf = document.getElementById('btn-export-pdf');
    mapViewTitle = document.getElementById('map-view-title');
    mapViewIcon = document.getElementById('map-view-icon');
    mapViewBadge = document.getElementById('map-view-badge');
    mapSpaceViewPanes = document.querySelectorAll('.map-space-view-pane');
    durationTotalBadge = document.getElementById('duration-total-badge');
    ratioDayBar = document.getElementById('ratio-day-bar');
    ratioNightBar = document.getElementById('ratio-night-bar');

    // Itinerary Information Elements (media_1789981633996.png / media_1789984716153.png)
    touristsInput = document.getElementById('tourists-input');
    touristsDecBtn = document.getElementById('tourists-dec');
    touristsIncBtn = document.getElementById('tourists-inc');
    touristsBadgeBox = document.getElementById('tourists-badge-box');
    touristsBadgeCount = document.getElementById('tourists-badge-count');
    touristsBadgeLabel = document.getElementById('tourists-badge-label');
    touristsBadgeIcon = document.getElementById('tourists-badge-icon');
    paxBarBooked = document.getElementById('pax-bar-booked');
    paxBarRemaining = document.getElementById('pax-bar-remaining');
    paxLegendBookedText = document.getElementById('pax-legend-booked-text');
    paxLegendRemainingText = document.getElementById('pax-legend-remaining-text');
    paxLegendTotalText = document.getElementById('pax-legend-total-text');
    roomTypeBtn = document.getElementById('room-type-btn');
    roomTypeDropdown = document.getElementById('room-type-dropdown');
    roomCardsContainer = document.getElementById('room-cards-container');
    touristRoomSummaryTag = document.getElementById('tourist-room-summary-tag');
  }

  /**
   * Sets up header navigation view switching (3D Tactical Map vs Itinerary Details vs Fleet vs Advisory)
   * matching user request and media_1789843513818.png
   */
  function setupHeaderNav() {
    if (!headerNavBtns) return;

    headerNavBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        // If clicking the already active non-map tab, toggle back to map!
        if (state.activeMainView === tab && tab !== 'map') {
          switchMainView('map');
        } else {
          switchMainView(tab);
        }
      });
    });

    if (mapViewCloseBtn) {
      mapViewCloseBtn.addEventListener('click', () => {
        switchMainView('map');
      });
    }

    if (btnExportPdf) {
      btnExportPdf.addEventListener('click', (e) => {
        e.stopPropagation();
        exportItineraryPDF();
      });
    }

    const btnDownloadPdfFile = document.getElementById('btn-download-pdf-file');
    if (btnDownloadPdfFile) {
      btnDownloadPdfFile.addEventListener('click', () => {
        syncLiveItineraryToStorage();
        const verName = (state.activePdfVersion === 'classic') ? 'Classic Tabular' : 'Modern Luxury';
        showToast(`📥 Downloading Sunbird Lanka Tours Itinerary (${verName})...`);
      });
    }

    const btnPrintPdfLive = document.getElementById('btn-print-pdf-live');
    if (btnPrintPdfLive) {
      btnPrintPdfLive.addEventListener('click', () => {
        syncLiveItineraryToStorage();
        const iframe = document.getElementById('pdf-preview-iframe');
        const targetTemplate = (state.activePdfVersion === 'classic') ? 'itinerary_classic.html' : 'itinerary_modern.html';
        if (iframe && iframe.contentWindow) {
          try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          } catch(e) {
            window.open(targetTemplate, '_blank');
          }
        } else {
          window.open(targetTemplate, '_blank');
        }
      });
    }

    // PDF Version Switcher Buttons
    const btnPdfVerClassic = document.getElementById('btn-pdf-ver-classic');
    if (btnPdfVerClassic) {
      btnPdfVerClassic.addEventListener('click', () => {
        switchPdfVersion('classic');
        showToast('Switched to Classic Tabular Itinerary Quotation');
      });
    }

    const btnPdfVerModern = document.getElementById('btn-pdf-ver-modern');
    if (btnPdfVerModern) {
      btnPdfVerModern.addEventListener('click', () => {
        switchPdfVersion('modern');
        showToast('Switched to Modern Luxury Experience Itinerary');
      });
    }
  }

  /**
   * Rich attraction descriptions by destination matching official Sri Lanka tourism standards
   */
  const RICH_DESTINATION_ATTRACTIONS = {
    'Airport (BIA)': [
      '<strong>Bandaranaike International Airport Welcome</strong> – Arrive at Bandaranaike International Airport (CMB) and meet your private chauffeur guide.',
      '<strong>Scenic Expressway Transfer</strong> – Expressway transfer towards your first cultural destination with scenic views.'
    ],
    'Sigiriya': [
      '<strong>Dambulla Cave Temple</strong>, a UNESCO World Heritage Site, has five cave temples with ancient murals, 150+ Buddha statues, and the iconic Golden Buddha statue.',
      '<strong>Sigiriya Lion Rock Citadel</strong> – Climb the ancient 5th-century palace fortress of King Kashyapa, marvel at the mirror wall and world-renowned ancient frescoes.',
      '<strong>Minneriya Wild Elephant Gathering Safari</strong> – Witness hundreds of wild Asian elephants in their natural habitat around the Minneriya reservoir.'
    ],
    'Anuradhapura': [
      '<strong>Sacred Ruwanwelisaya Stupa & Jaya Sri Maha Bodhi</strong> – Revered UNESCO ancient pilgrimage site and the world’s oldest historically documented tree.',
      '<strong>Jetavanaramaya & Abhayagiri Monastic Ruins</strong> – Explore colossal brick stupas, intricate moonstones, and ancient twin ponds (Kuttam Pokuna).'
    ],
    'Dambulla': [
      '<strong>Golden Cave Temple of Dambulla</strong> – UNESCO World Heritage complex featuring 5 ancient cave sanctuaries with over 2,000 sq meters of Buddhist murals.',
      '<strong>Popham’s Arboretum</strong> – Scenic guided nature trail through conserved dry-zone forest and indigenous flora.'
    ],
    'Polonnaruwa': [
      '<strong>Colossal Gal Vihara Buddha Sculptures</strong> – Marvel at masterfully carved rock-cut Buddha statues and King Parakramabahu’s royal palace ruins.',
      '<strong>Parakrama Samudra Reservoir Trail</strong> – Enjoy a picturesque cycling tour along ancient waterworks and archaeological parks.'
    ],
    'Kandy': [
      '<strong>Village Tour and Bullock Cart Ride</strong> – Experience rural Sri Lankan village life, traditional cooking, and boat rides on a catamaran. Ideal for families and cultural explorers.',
      '<strong>Ayurveda & Spice Garden Visit:</strong> Discover ancient healing traditions, medicinal herbs, and natural beauty products at a traditional Ayurveda and spice garden.',
      '<strong>Kandy</strong>, Sri Lanka’s cultural heart, features the UNESCO-listed Temple of the Sacred Tooth, scenic hills, Kandy Lake, botanical gardens, cultural shows, and vibrant markets.'
    ],
    'Nuwara Eliya': [
      'A <strong>gem lapidary visit</strong> showcases Sri Lanka’s gemstones, including rubies and the rare blue sapphire.',
      'A <strong>Sri Lankan tea factory visit</strong> offers a hands-on look at Ceylon tea production, from leaf to brew, amid scenic views and colonial charm.',
      '<strong>Victoria Park</strong> – Featuring Victorian flower beds, walking trails, and a mini railway. A hotspot for birdwatching during March–May blooms.',
      '<strong>Gregory Lake</strong> – A serene, man-made lake in the heart of town—perfect for boat rides, family picnics, lakeside strolls, or even a playful “lake party” during peak season.'
    ],
    'Ella': [
      '<strong>Train Ride from Nuwara Eliya to Ella</strong> (Morning time) depending on the availability.',
      '<strong>Nine Arch Bridge (Bridge in the Sky)</strong> – A remarkable colonial-era railway viaduct built in 1921 using only stone and brick.',
      '<strong>Ravana Falls</strong> – A 25 m cascade close to town—dip in its pools or explore the legendary Ravana Cave above via steep steps.',
      '<strong>Little Adam’s Peak</strong> – Invigorating scenic walk with breathtaking 360-degree views of Ella Rock and lush tea hills.'
    ],
    'Mirissa': [
      '<strong>Mirissa</strong> is a laid-back beach town known for golden beaches, whale watching, surfing, snorkeling, fresh seafood, and stunning sunsets.',
      '<strong>Coconut Tree Hill</strong> – Iconic dome of palm trees overlooking the Indian Ocean, perfect for sunset photography.'
    ],
    'Galle': [
      '<strong>Galle Dutch Fort</strong>, a UNESCO World Heritage Site, features historic ramparts, ocean views, the iconic lighthouse, and a charming colonial neighborhood.',
      '<strong>Beautiful Southern Beaches & Attractions:</strong> Enjoy the scenic southern coastline, golden beaches, and some of Sri Lanka’s most popular coastal attractions.'
    ],
    'Bentota': [
      '<strong>Madu Ganga Mangrove & Cinnamon Island Boat Safari</strong> – Glide through mangrove tunnels, visit local cinnamon peelers, and enjoy fish therapy.',
      '<strong>Kosgoda Sea Turtle Conservation Project</strong> – Observe endangered green and loggerhead turtles and support local marine wildlife rescue.'
    ],
    'Unawatuna': [
      '<strong>Jungle Beach & Coral Reef</strong> – Pristine hidden bay with calm waters for snorkeling and swimming among vibrant tropical reef fish.',
      '<strong>Japanese Peace Pagoda</strong> – Hilltop Buddhist stupa with panoramic ocean views over Galle bay.'
    ],
    'Colombo': [
      '<strong>Gangaramaya Temple</strong> – Iconic temple with diverse architecture, a museum, and a sacred Bodhi tree.',
      '<strong>Independence Memorial Hall</strong> – Historic monument marking Sri Lanka’s 1948 independence, featuring colonial architecture and serene open spaces.',
      '<strong>Colombo Port City & Marina Promenade</strong> – Modern waterfront with scenic walkways and luxury attractions; ideal for an evening visit.'
    ],
    'Negombo': [
      '<strong>Dutch Canal & Lagoon Catamaran Cruise</strong> – Explore historic 17th-century waterways and mangrove estuaries.',
      '<strong>Lellama Traditional Fish Market</strong> – Witness vibrant local coastal culture and fresh ocean catches.'
    ],
    'Yala': [
      '<strong>Yala National Park 4x4 Leopard Safari</strong> – Guided game drive through Block 1 tracking Sri Lankan leopards, sloth bears, wild elephants, and spotted deer.',
      '<strong>Coastal Lagoons & Birdwatching</strong> – Spot migratory waterbirds, painted storks, and crocodiles in scenic wetlands.'
    ],
    'Udawalawe': [
      '<strong>Elephant Transit Home (ETH)</strong> – Heartwarming rehabilitation facility caring for orphaned elephant calves before release into the wild.',
      '<strong>Udawalawe Grassland 4x4 Safari</strong> – Open-top jeep safari across savannah-like plains with guaranteed elephant herds.'
    ],
    'Trincomalee': [
      '<strong>Koneswaram Temple on Swami Rock</strong> – Historic cliffside temple perched high above the deep Indian Ocean.',
      '<strong>Nilaveli Beach & Pigeon Island Snorkeling</strong> – White sand shores and crystal clear coral reefs teeming with reef sharks.'
    ],
    'Jaffna': [
      '<strong>Nallur Kandaswamy Kovil Sacred Ceremony</strong> – Spectacular golden Hindu temple complex venerating Lord Murugan with towering gopurams and vibrant daily pooja rituals.',
      '<strong>Jaffna Dutch Fort & Coastal Lagoon Ramparts</strong> – Sprawling 17th-century pentagonal fort built of coral stone offering peaceful rampart walks along the shallow lagoon.'
    ],
    'Wilpattu': [
      '<strong>Wilpattu Natural Sand-Rimmed Willu Safari</strong> – Guided game drive through Sri Lanka’s largest national park tracking Sri Lankan leopards, sloth bears, and barking deer around ancient rainwater basins.'
    ],
    'Sinharaja': [
      '<strong>Sinharaja UNESCO Virgin Rainforest Trek</strong> – Trek through primary lowland rainforest home to rare endemic bird mixed-feeding flocks, purple-faced langurs, and giant trees.'
    ],
    'Horton Plains': [
      '<strong>World’s End 880m Sheer Cliff Precipice Trail</strong> – Invigorating trek across misty high-altitude plateau to the sheer drop overlooking southern tea valleys.',
      '<strong>Baker’s Falls & Highland Cloud Forest Trek</strong> – Picturesque cascading waterfall surrounded by giant tree ferns and rhododendrons.'
    ],
    'Adams Peak': [
      '<strong>Sacred Sri Pada Midnight Summit Pilgrimage</strong> – Ancient lantern-lit staircase ascent to the sacred footprint shrine atop Sri Lanka’s revered holy peak.'
    ],
    'Tangalle': [
      '<strong>Rekawa Beach Night Sea Turtle Nesting Watch</strong> – Ethical night observation of endangered sea turtles laying eggs on moonlit southern sands.',
      '<strong>Hummanaya Natural Marine Blowhole</strong> – The world’s second largest blowhole shooting ocean plumes 25m into the sky.'
    ],
    'Weligama': [
      '<strong>Traditional Stilt Fishermen Cultural Observation</strong> – Authentic coastal encounter observing traditional fisherman perched on stilt perches above breaking surf.',
      '<strong>Beginner Surf Lesson in Sandy Surf Bay</strong> – Guided wave riding lesson in gentle protected warm-water bay with certified instructors.'
    ],
    'Kitulgala': [
      '<strong>Kelani River White Water Rafting (Grade 3/4)</strong> – Exhilarating rainforest river descent through rapids where The Bridge on the River Kwai was filmed.'
    ]
  };

  /**
   * Helper: parses a rich HTML attraction string from RICH_DESTINATION_ATTRACTIONS
   * into a structured editor object with title, desc, checked: true, and original html
   */
  function parseRichAttractionString(str) {
    if (!str) return null;
    const m = str.match(/<strong>(.*?)<\/strong>/i);
    if (m) {
      let rawTitle = m[1].replace(/[:–\-]$/, '').trim();
      let title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
      if (title.toLowerCase() === 'mirissa') title = 'Mirissa Coastal Exploration';
      if (title.toLowerCase() === 'kandy') title = 'Temple of the Sacred Tooth & Kandy Highlights';

      let desc = str
        .replace(/<strong>.*?<\/strong>/i, '')
        .replace(/^A\s+/i, '')
        .trim()
        .replace(/^[–\-:,]\s*/, '')
        .trim();
      if (desc.length > 0) {
        desc = desc.charAt(0).toUpperCase() + desc.slice(1);
      }
      return { title, desc, checked: true, custom: false, html: str };
    }
    const plain = str.replace(/<[^>]+>/g, '').trim();
    let title = plain.split(/[-–—:]/)[0].trim();
    if (title.length > 45) {
      title = title.substring(0, 42) + '...';
    }
    return { title, desc: plain, checked: true, custom: false, html: str };
  }

  /**
   * Helper: returns default pre-selected attractions for a destination
   * matching what the PDF displays automatically
   */
  function getDefaultAttractionsForDestination(destName) {
    if (!destName || typeof destName !== 'string' || !destName.trim()) {
      return [];
    }
    const trimmed = destName.trim();
    let rawList = RICH_DESTINATION_ATTRACTIONS[trimmed];
    if (!rawList) {
      const lower = trimmed.toLowerCase();
      for (const k of Object.keys(RICH_DESTINATION_ATTRACTIONS)) {
        if (k.toLowerCase() === lower || lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower)) {
          rawList = RICH_DESTINATION_ATTRACTIONS[k];
          break;
        }
      }
    }

    if (rawList && rawList.length > 0) {
      return rawList.map(str => parseRichAttractionString(str)).filter(Boolean);
    }

    if (typeof getAttractionsForDestination === 'function') {
      const catalog = getAttractionsForDestination(trimmed);
      if (catalog && catalog.length > 0) {
        return catalog.slice(0, 2).map(a => ({
          title: a.title,
          desc: a.desc,
          checked: true,
          custom: false,
          html: `<strong>${a.title}</strong> – ${a.desc}`
        }));
      }
    }

    return [
      {
        title: `${trimmed} Cultural Sightseeing & Heritage Exploration`,
        desc: `Guided excursion discovering authentic historical monuments, local culture, and scenic landscapes of ${trimmed}.`,
        checked: true,
        custom: false,
        html: `<strong>${trimmed} Cultural Sightseeing & Heritage Exploration</strong> – Guided excursion discovering authentic historical monuments, local culture, and scenic landscapes of ${trimmed}.`
      }
    ];
  }

  /**
   * Helper: returns combined default pre-selected attractions for all stops on a day
   */
  function getDefaultAttractionsForDay(dayIndex) {
    const dests = (typeof getDayDestinations === 'function') ? getDayDestinations(dayIndex) : (state.dayDestinations ? [state.dayDestinations[dayIndex]] : []);
    if (!dests || dests.length === 0) return [];
    const results = [];
    const seen = new Set();

    dests.forEach(d => {
      if (!d || typeof d !== 'string' || !d.trim()) return;
      const items = getDefaultAttractionsForDestination(d.trim());
      items.forEach(it => {
        const key = it.title.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          results.push(it);
        }
      });
    });
    return results;
  }

  /**
   * Helper: normalize attraction title for deduplication comparison
   */
  function normalizeAttractionKey(str) {
    return (str || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /**
   * Helper: checks whether two attraction titles refer to the same attraction
   */
  function isDuplicateAttraction(titleA, titleB) {
    const normA = normalizeAttractionKey(titleA);
    const normB = normalizeAttractionKey(titleB);
    if (!normA || !normB) return false;
    if (normA === normB) return true;
    if (normA.includes(normB) || normB.includes(normA)) return true;

    const keywords = [
      'airport', 'dambulla', 'sigiriya', 'pidurangala', 'minneriya', 'ruwanweli', 'maha bodhi',
      'jetavanaramaya', 'abhayagiri', 'gal vihara', 'parakrama', 'tooth relic', 'sacred tooth',
      'peradeniya', 'spice garden', 'tea factory', 'tea plantation', 'gregory lake', 'victoria park',
      'nine arch', 'ravana falls', 'adam', 'leopard safari', 'yala', 'elephant transit', 'udawalawe',
      'coconut tree hill', 'whale watching', 'galle dutch fort', 'galle fort', 'madu ganga', 'kosgoda',
      'jungle beach', 'peace pagoda', 'gangaramaya', 'independence memorial', 'port city', 'lellama',
      'dutch canal', 'koneswaram', 'pigeon island', 'nallur', 'blowhole', 'stilt fishermen', 'white water rafting'
    ];
    for (const kw of keywords) {
      if (normA.includes(kw) && normB.includes(kw)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Helper to format dates with ordinals: 26th Aug, 01st Sep, etc.
   */
  function formatItineraryDate(baseDateStr, dayOffset, fullMonth = false) {
    const d = new Date(baseDateStr + 'T00:00:00');
    d.setDate(d.getDate() + dayOffset);
    const day = d.getDate();
    const j = day % 10, k = day % 100;
    let ord = 'th';
    if (j === 1 && k !== 11) ord = 'st';
    else if (j === 2 && k !== 12) ord = 'nd';
    else if (j === 3 && k !== 13) ord = 'rd';
    const dayFormatted = (day < 10 ? '0' + day : '' + day) + ord;
    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthStr = fullMonth ? monthsFull[d.getMonth()] : monthsShort[d.getMonth()];
    const year = d.getFullYear();
    return { dayFormatted, monthStr, year, fullString: `${dayFormatted} ${monthStr} ${year}` };
  }

  /**
   * Builds the live itinerary payload from real app state
   */
  function buildLiveItineraryPayload() {
    const daysCount = state.days || 7;
    const nightsCount = state.nights || (daysCount - 1);
    const touristsCount = state.touristsCount || 2;
    const arrivalDateStr = state.arrivalDate || '2026-08-27';
    
    // Start date and end date
    const startD = formatItineraryDate(arrivalDateStr, 0, true);
    const endD = formatItineraryDate(arrivalDateStr, daysCount - 1, true);
    
    const nightLabel = nightsCount < 10 ? '0' + nightsCount : '' + nightsCount;
    const dayLabel = daysCount < 10 ? '0' + daysCount : '' + daysCount;
    const periodTitle = `Period from ${startD.dayFormatted} ${startD.monthStr} to ${endD.dayFormatted} ${endD.monthStr} ${endD.year} <span class="highlight-red">(${nightLabel} Nights/${dayLabel} Days)</span> - ${touristsCount === 2 ? '2 Adults' : touristsCount + ' Guests'}`;

    const rows = [];
    for (let i = 0; i < daysCount; i++) {
      const dayNum = i + 1;
      const nightNum = dayNum; // 1-indexed night
      const dateInfo = formatItineraryDate(arrivalDateStr, i, false);
      const dateHtml = `${dateInfo.dayFormatted}<br>${dateInfo.monthStr}`;

      const rawDests = getDayDestinations(i);
      const validStops = rawDests.filter(d => d && typeof d === 'string' && d.trim() !== '');
      const hasDests = validStops.length > 0;

      // Determine prevFinal
      let prevFinal = null;
      if (i === 0) {
        prevFinal = 'Airport (CMB)';
      } else {
        for (let p = i - 1; p >= 0; p--) {
          const pFinal = getDayFinalDestination(p);
          if (pFinal && typeof pFinal === 'string' && pFinal.trim() !== '') {
            prevFinal = pFinal.trim();
            break;
          }
        }
        if (!prevFinal) prevFinal = 'Airport (CMB)';
      }

      // Hotel status for this night
      const bookedName = (nightNum <= nightsCount && state.hotelBookings && state.hotelBookings[nightNum]) ? state.hotelBookings[nightNum] : null;
      const hasBookedHotel = !!(bookedName && bookedName.trim() !== '' && bookedName !== 'Selected Hotel' && bookedName !== 'To be assigned' && !bookedName.includes('Fill the Itinerary'));

      // Attractions status
      const userSelected = (state.selectedAttractions && state.selectedAttractions[i]) || [];
      const checkedAttractions = userSelected.filter(a => a.checked !== false && a.title && a.title.trim() !== '');
      const hasUserSelectedAttracts = userSelected.some(a => a.custom || (a.checked && a.userEdited));

      // A day is treated as undecided / template placeholder if:
      // 1. No valid destination stops exist (!hasDests)
      // 2. OR it has a repeated destination stop equal to prevFinal (e.g. Sigiriya following Sigiriya)
      //    WITHOUT a booked hotel AND WITHOUT user-selected attractions
      const isRepeatedPlaceholder = (
        i > 0 &&
        validStops.length === 1 &&
        prevFinal &&
        validStops[0].toLowerCase().trim() === prevFinal.toLowerCase().trim() &&
        !hasBookedHotel &&
        !hasUserSelectedAttracts
      );

      const isDayDecided = hasDests && !isRepeatedPlaceholder;

      let destLabel = '';
      let distKmDisplay = '—';
      let travelHrs = '—';
      let attractList = [];
      let overnight = null;

      if (!isDayDecided) {
        // Day has no assigned destination: show clear placeholder
        destLabel = '<span class="empty-placeholder" style="color: #64748b; font-style: italic; font-weight: 500;">Fill the Itinerary in the editor</span>';
        distKmDisplay = '—';
        travelHrs = '—';

        if (checkedAttractions.length > 0 && hasUserSelectedAttracts) {
          attractList = checkedAttractions.map(item => {
            if (item.desc) {
              return `<strong>${item.title}</strong> – ${item.desc}`;
            }
            return `<strong>${item.title}</strong>`;
          });
        } else {
          attractList = ['<span class="empty-placeholder" style="color: #64748b; font-style: italic; font-weight: 500;">Fill the Itinerary in the editor</span>'];
        }

        // Overnight for empty / undecided day
        if (nightNum <= nightsCount) {
          if (hasBookedHotel) {
            let hotelData = null;
            if (window.SRI_LANKA_HOTELS) {
              hotelData = window.SRI_LANKA_HOTELS.find(h => h.name === bookedName);
            }
            const stars = hotelData ? hotelData.starTier : 4;
            let roomCategory = 'Deluxe Room';
            if (state.rooms && state.rooms.length > 0) {
              roomCategory = state.rooms.map(r => r.type).join(' & ');
            }
            const bookedMealPlan = (state.nightMealPlans && state.nightMealPlans[nightNum])
              || (state.hotelMealPlans && state.hotelMealPlans[bookedName])
              || 'HB';

            overnight = {
              name: bookedName,
              room: roomCategory,
              stars: stars,
              mealPlan: bookedMealPlan
            };
          } else {
            overnight = {
              name: 'Fill the Itinerary in the editor',
              isEmpty: true
            };
          }
        } else {
          overnight = {
            name: 'Fill the Itinerary in the editor',
            isEmpty: true
          };
        }
      } else {
        // Day has configured destinations
        const currFinal = validStops[validStops.length - 1];

        if (i === 0) {
          if (validStops.length === 1 && (validStops[0].toLowerCase().includes('airport') || validStops[0].toLowerCase().includes('bia'))) {
            destLabel = 'Airport (CMB)';
          } else {
            destLabel = `Airport (CMB) -<br>${validStops.join(' - ')}`;
          }
        } else if (validStops.length === 1 && prevFinal && validStops[0].toLowerCase().trim() === prevFinal.toLowerCase().trim()) {
          destLabel = `${validStops[0]} (Leisure & Exploration)`;
        } else {
          destLabel = `${prevFinal} - ${validStops.join(' - ')}`;
        }

        // Calculate real distance & duration from SRI_LANKA_ROUTES
        let distKm = 0;
        let durationMin = 0;
        if (window.SRI_LANKA_ROUTES && window.SRI_LANKA_ROUTES.findRoute) {
          try {
            let curStart = (i === 0) ? 'airport' : prevFinal;
            for (const d of validStops) {
              const sId = (curStart === 'Airport (CMB)' || curStart === 'Airport') ? 'airport' : window.SRI_LANKA_ROUTES.normalizeId(curStart);
              const eId = window.SRI_LANKA_ROUTES.normalizeId(d);
              const r = window.SRI_LANKA_ROUTES.findRoute(sId, eId, state.routeMode || 'normal') ||
                        window.SRI_LANKA_ROUTES.findRoute(sId, eId, 'normal');
              if (r) {
                distKm += r.distanceKm;
                durationMin += r.durationMin;
              }
              curStart = d;
            }
          } catch(err) {}
        }

        if (distKm > 0) {
          distKmDisplay = distKm;
          travelHrs = (durationMin / 60).toFixed(1);
        } else {
          distKmDisplay = '—';
          travelHrs = '—';
        }

        // Attractions (Directly synchronized from user selections in Attractions Tab)
        if (checkedAttractions.length > 0) {
          attractList = checkedAttractions.map(item => {
            if (item.html) {
              return item.html;
            }
            if (item.desc) {
              return `<strong>${item.title}</strong> – ${item.desc}`;
            }
            return `<strong>${item.title}</strong>`;
          });
        } else if (userSelected && userSelected.length > 0) {
          // User explicitly unchecked all attractions for this configured day
          attractList = ['Scenic leisure transfer and relaxation at the resort.'];
        } else {
          for (const st of validStops) {
            const list = RICH_DESTINATION_ATTRACTIONS[st] || (CURATED_ACTIVITIES && CURATED_ACTIVITIES[st] ? CURATED_ACTIVITIES[st].map(a => `<strong>${a.title}</strong>`) : null);
            if (list && list.length > 0) {
              attractList = attractList.concat(list);
            } else {
              attractList.push(`Scenic transfer to <strong>${st}</strong>.`);
            }
          }
        }

        // If Day 1, prepend arrival transfer note
        if (i === 0 && (!attractList[0] || !attractList[0].toLowerCase().includes('arrive'))) {
          attractList = [`Arrive at Colombo Airport and transfer to hotel in ${currFinal}.`, ...attractList];
        }
        // If last day, append departure note
        if (i === daysCount - 1) {
          const depDate = formatItineraryDate(arrivalDateStr, daysCount, false);
          attractList = [...attractList, `<strong style="color:#dc2626;">Departure</strong> {01:00 hrs on ${depDate.dayFormatted} ${depDate.monthStr}}`];
        }

        // Hotel for this night
        if (nightNum <= nightsCount) {
          const bookedName = (state.hotelBookings && state.hotelBookings[nightNum]) ? state.hotelBookings[nightNum] : null;
          if (bookedName && bookedName.trim() !== '' && bookedName !== 'Selected Hotel') {
            let hotelData = null;
            if (window.SRI_LANKA_HOTELS) {
              hotelData = window.SRI_LANKA_HOTELS.find(h => h.name === bookedName);
            }
            const stars = hotelData ? hotelData.starTier : 4;
            let roomCategory = 'Deluxe Room';
            if (state.rooms && state.rooms.length > 0) {
              roomCategory = state.rooms.map(r => r.type).join(' & ');
            }
            const bookedMealPlan = (state.nightMealPlans && state.nightMealPlans[nightNum])
              || (state.hotelMealPlans && state.hotelMealPlans[bookedName])
              || 'HB';

            overnight = {
              name: bookedName,
              room: roomCategory,
              stars: stars,
              mealPlan: bookedMealPlan
            };
          } else {
            overnight = {
              name: 'Fill the Itinerary in the editor',
              isEmpty: true
            };
          }
        } else {
          // Last day after final night
          overnight = {
            name: 'Airport Transit & Departure',
            room: 'VIP Departure Transfer',
            stars: 5,
            mealPlan: 'Departure'
          };
        }
      }

      rows.push({
        dayNum: dayNum,
        dateStr: dateHtml,
        destination: destLabel,
        distanceKm: distKmDisplay,
        travelTimeHours: travelHrs,
        attractions: attractList,
        overnight: overnight
      });
    }

    const activeItin = (typeof hubItineraries !== 'undefined' && hubItineraries.length > 0)
      ? hubItineraries.find(item => item.id === hubActiveItinId)
      : null;
    const itinTitle = state.title || (activeItin ? activeItin.title : '') || 'HOTEL ARRANGEMENTS WITH TRANSPORT SERVICES';

    return {
      title: itinTitle,
      days: daysCount,
      nights: nightsCount,
      touristsCount: touristsCount,
      arrivalDate: arrivalDateStr,
      periodTitle: periodTitle,
      rows: rows,
      rooms: state.rooms || [],
      hotelBookings: state.hotelBookings || {},
      selectedVehicle: state.selectedVehicle || 'car',
      vehicleName: (state.selectedVehicle === 'van') ? 'Toyota HiAce Luxury KDH' : 'Toyota Prius Hybrid',
      currency: state.currency || 'USD',
      employees: state.employees || [],
      hotelStarFilter: state.hotelStarFilter || '4'
    };
  }

  /**
   * Synchronizes the latest live itinerary payload into localStorage for the PDF generator
   */
  function syncLiveItineraryToStorage() {
    try {
      const payload = buildLiveItineraryPayload();
      localStorage.setItem('sunbird_live_itinerary', JSON.stringify(payload));
      const iframe = document.getElementById('pdf-preview-iframe');
      if (iframe && iframe.contentWindow) {
        try {
          if (typeof iframe.contentWindow.renderItinerary === 'function') {
            iframe.contentWindow.renderItinerary();
          }
        } catch(e) {}
      }
    } catch(err) {
      console.warn('Could not save live itinerary payload to localStorage:', err);
    }
  }

  /**
   * Switches active PDF template between Classic Table and Modern Luxury Edition
   */
  function switchPdfVersion(version, triggerSync = true) {
    state.activePdfVersion = version;
    const btnClassic = document.getElementById('btn-pdf-ver-classic');
    const btnModern = document.getElementById('btn-pdf-ver-modern');
    const badge = document.getElementById('pdf-version-indicator');
    const iframe = document.getElementById('pdf-preview-iframe');
    const downloadBtn = document.getElementById('btn-download-pdf-file');

    const isModern = (version === 'modern');
    if (btnClassic) {
      btnClassic.classList.toggle('active', !isModern);
      btnClassic.setAttribute('aria-selected', !isModern ? 'true' : 'false');
    }
    if (btnModern) {
      btnModern.classList.toggle('active', isModern);
      btnModern.setAttribute('aria-selected', isModern ? 'true' : 'false');
    }
    if (badge) {
      badge.textContent = isModern ? '✨ Modern Luxury Edition' : '📊 Classic Table Quotation';
    }

    const templateFile = isModern ? 'itinerary_modern.html' : 'itinerary_classic.html';
    const pdfFile = isModern ? 'SunBird_Lanka_Tours_Itinerary_Modern.pdf' : 'SunBird_Lanka_Tours_Itinerary_Classic.pdf';

    if (downloadBtn) {
      downloadBtn.href = pdfFile;
      downloadBtn.download = pdfFile;
      downloadBtn.title = isModern ? 'Download Modern Luxury Itinerary PDF' : 'Download Classic Tabular Itinerary PDF';
    }

    if (triggerSync) {
      syncLiveItineraryToStorage();
    }

    if (iframe) {
      const currentSrc = iframe.getAttribute('src') || '';
      if (!currentSrc.includes(templateFile)) {
        iframe.src = templateFile;
      } else if (iframe.contentWindow && typeof iframe.contentWindow.renderItinerary === 'function') {
        try {
          iframe.contentWindow.renderItinerary();
        } catch(e) {}
      }
    }
  }

  /**
   * Opens the official client itinerary PDF document matching reference format
   * populated with real live data from the app
   */
  function exportItineraryPDF() {
    syncLiveItineraryToStorage();
    const payload = buildLiveItineraryPayload();
    const isModern = (state.activePdfVersion === 'modern');
    const templateFile = isModern ? 'itinerary_modern.html' : 'itinerary_classic.html';
    showToast(`Exporting ${isModern ? 'Modern Luxury' : 'Classic'} Itinerary: ${payload.days} Days / ${payload.nights} Nights...`);
    window.open(templateFile, '_blank');
  }

  /**
   * Switches the upper main column between Map, Itinerary Info, and Editable PDF
   */
  function switchMainView(tabName) {
    state.activeMainView = tabName;

    // Toggle full-screen PDF view mode (hides timeline and sidebar)
    const dashboardWorkspace = document.querySelector('.dashboard-workspace');
    if (dashboardWorkspace) {
      dashboardWorkspace.classList.toggle('pdf-view-active', tabName === 'pdf');
    }

    // Update active tab button in header nav
    if (headerNavBtns) {
      headerNavBtns.forEach((btn) => {
        const isActive = (btn.dataset.tab === tabName);
        btn.classList.toggle('active', isActive);
      });
    }

    if (tabName === 'map') {
      if (mapSpaceViews) {
        mapSpaceViews.style.display = 'none';
      }
      // Re-trigger 3D resize to ensure map canvas is sharp
      if (window.mapState && window.mapState.onWindowResize) {
        window.mapState.onWindowResize();
      }
      setTimeout(() => {
        if (window.mapState && window.mapState.onWindowResize) {
          window.mapState.onWindowResize();
        }
      }, 50);
      // Re-sync itinerary routes to ensure any day/night changes are immediately rendered
      if (window.mapState && window.mapState.updateItineraryRoutes && state.dayDestinations) {
        window.mapState.updateItineraryRoutes(state.dayDestinations.slice(0, state.days));
      }
    } else {
      if (mapSpaceViews) {
        mapSpaceViews.style.display = 'flex';
      }

      // If switching to editable PDF view, sync data and refresh iframe
      if (tabName === 'pdf') {
        syncLiveItineraryToStorage();
        const isModern = (state.activePdfVersion !== 'classic');
        const targetTemplate = isModern ? 'itinerary_modern.html' : 'itinerary_classic.html';
        const iframe = document.getElementById('pdf-preview-iframe');
        if (iframe) {
          const currentSrc = iframe.getAttribute('src') || '';
          if (!currentSrc.includes(targetTemplate)) {
            iframe.src = targetTemplate;
          } else {
            try {
              if (iframe.contentWindow && typeof iframe.contentWindow.renderItinerary === 'function') {
                iframe.contentWindow.renderItinerary();
              }
            } catch(e) {
              iframe.src = targetTemplate;
            }
          }
        }
      }

      // Activate corresponding pane
      const targetPaneId = (tabName === 'timeline' || tabName === 'itinerary') ? 'view-itinerary' : `view-${tabName}`;
      if (mapSpaceViewPanes) {
        mapSpaceViewPanes.forEach((pane) => {
          pane.classList.toggle('active', pane.id === targetPaneId);
        });
      }
    }
  }

  function startLiveClock() {
    function updateClock() {
      if (!liveSystemClock) return;
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      liveSystemClock.textContent = `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
    }
    updateClock();
    setInterval(updateClock, 1000);
  }

  function setupEventListeners() {
    // Destination Search Input
    if (destSearchInput) {
      destSearchInput.addEventListener('input', (e) => {
        state.destSearchTerm = e.target.value.trim().toLowerCase();
        renderDestinationCards();
      });
    }

    // Hotel Search Input (Matching Destination Tab UI)
    if (hotelSearchInput) {
      hotelSearchInput.addEventListener('input', (e) => {
        state.hotelSearchTerm = e.target.value.trim().toLowerCase();
        state.hotelDisplayLimit = 35;
        renderHotelCards();
      });
    }

    // Hotel Destination "Show all" Button
    if (hotelDestShowallBtn) {
      hotelDestShowallBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.hotelRegionMode = (state.hotelRegionMode === 'all' ? 'auto' : 'all');
        state.hotelDisplayLimit = 35;
        renderHotelCards();
        showToast(state.hotelRegionMode === 'all' ? 'Showing hotels across all of Sri Lanka' : 'Filtered to selected destination');
      });
    }

    // Hotel Destination Heading Click: Toggle destination if multiple scheduled for this day
    if (hotelDestLineLeft) {
      hotelDestLineLeft.addEventListener('click', (e) => {
        e.stopPropagation();
        const activeDay = (state.selectedPiece && state.selectedPiece.type === 'night')
          ? state.selectedPiece.index
          : (state.selectedPiece && state.selectedPiece.type === 'day')
            ? state.selectedPiece.index
            : (state.selectedDayIndex !== undefined ? state.selectedDayIndex + 1 : 1);
        const dayIdx = Math.max(0, activeDay - 1);
        if (state.dayDestinations && Array.isArray(state.dayDestinations[dayIdx])) {
          const raw = state.dayDestinations[dayIdx];
          const validStops = raw.filter(Boolean);
          if (validStops.length > 1) {
            state.selectedDestSlot = (state.selectedDestSlot === 0 ? 1 : 0);
            state.hotelRegionMode = 'auto';
            state.hotelDisplayLimit = 35;
            renderHotelCards();
            updateTimelineDayStatusBar();
            renderDestinationCards();
            showToast(`Switched hotel filter to ${raw[state.selectedDestSlot] || 'next destination'}`);
            return;
          }
        }
        // If in 'all' mode, switch back to regional auto
        if (state.hotelRegionMode === 'all') {
          state.hotelRegionMode = 'auto';
          state.hotelDisplayLimit = 35;
          renderHotelCards();
          showToast('Filtered to active destination');
        }
      });
    }

    // Hotel Star Tier Heading Click: Cycle star ratings (4 Star → 5 Star → 3 Star → All Stars)
    if (hotelStarLineLeft) {
      hotelStarLineLeft.addEventListener('click', (e) => {
        e.stopPropagation();
        const STAR_CYCLE = ['4', '5', '3', 'all'];
        const cur = state.hotelStarFilter || 'all';
        const curIdx = STAR_CYCLE.indexOf(String(cur));
        const next = STAR_CYCLE[(curIdx + 1) % STAR_CYCLE.length];
        state.hotelStarFilter = next;
        state.hotelDisplayLimit = 35;
        renderHotelCards();
        showToast(next === 'all' ? 'Showing all star tiers' : `Filter: ${next}★ and above`);
      });
    }

    // Hotel Star "Show all" Button: Reset star filter to all
    if (hotelStarShowallBtn) {
      hotelStarShowallBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (state.hotelStarFilter === 'all') {
          state.hotelStarFilter = '4'; // Toggle back to popular 4-star tier
          showToast('Filter: 4 Star Hotels');
        } else {
          state.hotelStarFilter = 'all'; // Show all star tiers
          showToast('Showing all star ratings');
        }
        state.hotelDisplayLimit = 35;
        renderHotelCards();
      });
    }

    // Stepper controls
    daysDecBtn.addEventListener('click', () => changeDays(state.days - 1));
    daysIncBtn.addEventListener('click', () => changeDays(state.days + 1));
    nightsDecBtn.addEventListener('click', () => changeNights(state.nights - 1));
    nightsIncBtn.addEventListener('click', () => changeNights(state.nights + 1));

    const handleDaysInput = (e) => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val) && val >= 1) {
        changeDays(val);
      }
    };
    daysInput.addEventListener('input', handleDaysInput);
    daysInput.addEventListener('change', (e) => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val) && val >= 1) {
        changeDays(val);
      } else {
        daysInput.value = state.days.toString();
      }
    });

    const handleNightsInput = (e) => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val) && val >= 0) {
        changeNights(val);
      }
    };
    nightsInput.addEventListener('input', handleNightsInput);
    nightsInput.addEventListener('change', (e) => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val) && val >= 0) {
        changeNights(val);
      } else {
        nightsInput.value = state.nights.toString();
      }
    });

    // Arrival Date input
    const onDateChange = (e) => {
      if (e.target.value) {
        state.arrivalDate = e.target.value;
        state.indicatorPoint = null;
        updateUI();
        if (window.mapState && window.mapState.updateWeatherForDate) {
          window.mapState.updateWeatherForDate(state.arrivalDate);
        }
      }
    };
    arrivalDateInput.addEventListener('change', onDateChange);
    arrivalDateInput.addEventListener('input', onDateChange);

    // Arrival Time input
    arrivalTimeInput.addEventListener('change', (e) => {
      if (e.target.value) {
        state.arrivalTime = e.target.value;
        state.indicatorPoint = null;
        updateQuickChipsHighlight();
        updateUI();
      }
    });

    // Quick Time chips
    if (quickTimeChips) {
      quickTimeChips.addEventListener('click', (e) => {
        const btn = e.target.closest('.time-chip');
        if (btn && btn.dataset.time) {
          state.arrivalTime = btn.dataset.time;
          state.indicatorPoint = null;
          arrivalTimeInput.value = state.arrivalTime;
          updateQuickChipsHighlight();
          updateUI();
        }
      });
    }

    // Filter toggle chips (NIGHT & DAY toggles: both on = ALL, both off = NONE)
    if (filterNightsBtn) {
      filterNightsBtn.addEventListener('click', () => {
        const showNights = (state.filter === 'night' || state.filter === 'all');
        const showDays = (state.filter === 'day' || state.filter === 'all');
        const newShowNights = !showNights;
        if (newShowNights && showDays) {
          state.filter = 'all';
        } else if (newShowNights) {
          state.filter = 'night';
        } else if (showDays) {
          state.filter = 'day';
        } else {
          state.filter = 'none';
        }
        updateUI();
      });
    }

    if (filterDaysBtn) {
      filterDaysBtn.addEventListener('click', () => {
        const showNights = (state.filter === 'night' || state.filter === 'all');
        const showDays = (state.filter === 'day' || state.filter === 'all');
        const newShowDays = !showDays;
        if (showNights && newShowDays) {
          state.filter = 'all';
        } else if (newShowDays) {
          state.filter = 'day';
        } else if (showNights) {
          state.filter = 'night';
        } else {
          state.filter = 'none';
        }
        updateUI();
      });
    }

    // Timeline Zoom & Premiere Pro Alt + Wheel expansion
    if (zoomSlider) {
      zoomSlider.addEventListener('input', (e) => {
        setZoom(parseFloat(e.target.value));
      });
    }

    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => {
        setZoom(state.zoom - 0.15);
      });
    }

    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => {
        setZoom(state.zoom + 0.15);
      });
    }

    if (zoomLevelBadge) {
      zoomLevelBadge.addEventListener('click', () => {
        setZoom(1.2);
      });
    }

    // Navigation: Grab & Drag (Pan) on timeline + Mouse Wheel navigation & zoom
    setupTimelineNavigation();

    // Time Indicator: Grab & Drag Playhead across timeline (30-min intervals)
    setupTimeIndicator();

    // Hotel Handles: Draggable Check-in and Check-out corners
    window.addEventListener('mousemove', handleHandlePointerMove);
    window.addEventListener('touchmove', handleHandlePointerMove, { passive: false });
    window.addEventListener('mouseup', handleHandlePointerEnd);
    window.addEventListener('touchend', handleHandlePointerEnd);
    window.addEventListener('blur', handleHandlePointerEnd);

    // Export PNG
    if (exportPngBtn) {
      exportPngBtn.addEventListener('click', exportTimelineAsImage);
    }

    // Global listener: Deselect Day Bar piece when clicking outside the Day Bar or pressing Escape
    document.addEventListener('click', (e) => {
      if (hasPannedTimeline) return;
      // Do not deselect if clicking inside timeline pieces, the status bar, or the right itinerary sidebar
      const path = e.composedPath ? e.composedPath() : [];
      const isInsideAllowed = path.some(el => {
        if (!el || !el.classList) return false;
        return el.classList.contains('day-segment') ||
               el.classList.contains('night-square') ||
               el.classList.contains('night-badge') ||
               el.classList.contains('timeline-day-status-bar') ||
               el.classList.contains('dashboard-sidebar-col') ||
               el.classList.contains('dest-card-item') ||
               el.classList.contains('dest-assignment-header') ||
               el.classList.contains('hotel-card-item') ||
               el.classList.contains('side-tab-btn');
      }) || (e.target && e.target.closest && e.target.closest('.day-segment, .night-square, .night-badge, .timeline-day-status-bar, .dashboard-sidebar-col, .dest-card-item, .dest-assignment-header, .hotel-card-item, .side-tab-btn'));

      if (!isInsideAllowed) {
        if (state.selectedPiece) {
          setSelectedPiece(null);
        }
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (state.selectedPiece) {
          setSelectedPiece(null);
        }
      }
    });
  }

  // Navigation panning flag so dragging doesn't trigger time piece selection
  let hasPannedTimeline = false;

  /**
   * Sets up Grab & Drag (Pan) ability and Mouse Wheel navigation.
   * Scrolling over the timeline moves the timeline horizontally instead of scrolling the browser page.
   * Alt + Scroll expands / contracts the timeline around the cursor.
   * Clicking and dragging pans the timeline smoothly left and right.
   */
  function setupTimelineNavigation() {
    if (!timelineScrollContainer) return;

    let isPanning = false;
    let startX = 0;
    let scrollLeftStart = 0;

    // 1. Mouse Wheel Navigation & Zoom on Timeline:
    // When scrolling on the timeline, move the timeline horizontally instead of scrolling the page!
    timelineScrollContainer.addEventListener('wheel', (e) => {
      e.preventDefault(); // Stop outer browser page from scrolling vertically

      if (e.altKey || e.ctrlKey) {
        // Premiere Pro style zoom expansion
        const zoomStep = 0.08;
        const delta = e.deltaY < 0 ? zoomStep : -zoomStep;
        setZoom(state.zoom + delta, e.clientX);
      } else {
        // Normal mouse wheel moves the timeline horizontally
        const scrollDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        timelineScrollContainer.scrollLeft += scrollDelta;
      }
    }, { passive: false });

    // Also support Alt+Wheel zoom across the entire canvas card
    const timelineCard = document.querySelector('.timeline-canvas-card');
    if (timelineCard && timelineCard !== timelineScrollContainer) {
      timelineCard.addEventListener('wheel', (e) => {
        if (e.altKey || e.ctrlKey) {
          e.preventDefault();
          const zoomStep = 0.08;
          const delta = e.deltaY < 0 ? zoomStep : -zoomStep;
          setZoom(state.zoom + delta, e.clientX);
        }
      }, { passive: false });
    }

    // 2. Grab & Drag (Pan) ability on the Timeline:
    function startPanning(e) {
      if (e.button !== 0) return; // Left mouse click only
      if (e.target.closest('button, input, select, a, #arrival-marker, .hotel-pin, .date-header-track, .date-cell, .date-ruler-strip, .ruler-tick')) return;

      isPanning = true;
      hasPannedTimeline = false;
      startX = e.clientX;
      scrollLeftStart = timelineScrollContainer.scrollLeft;
      timelineScrollContainer.classList.add('is-dragging');
    }

    timelineScrollContainer.addEventListener('mousedown', startPanning);

    // Also support mouse wheel and grab on the static labels column
    const labelsCol = document.querySelector('.timeline-labels-column');
    if (labelsCol) {
      labelsCol.addEventListener('mousedown', startPanning);
      labelsCol.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.altKey || e.ctrlKey) {
          const zoomStep = 0.08;
          const delta = e.deltaY < 0 ? zoomStep : -zoomStep;
          setZoom(state.zoom + delta, e.clientX);
        } else {
          const scrollDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
          timelineScrollContainer.scrollLeft += scrollDelta;
        }
      }, { passive: false });
    }

    window.addEventListener('mousemove', (e) => {
      if (!isPanning) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) {
        hasPannedTimeline = true;
      }
      e.preventDefault();
      timelineScrollContainer.scrollLeft = scrollLeftStart - dx;
    });

    window.addEventListener('mouseup', () => {
      if (isPanning) {
        isPanning = false;
        timelineScrollContainer.classList.remove('is-dragging');
        setTimeout(() => {
          hasPannedTimeline = false;
        }, 50);
      }
    });

    window.addEventListener('blur', () => {
      if (isPanning) {
        isPanning = false;
        hasPannedTimeline = false;
        timelineScrollContainer.classList.remove('is-dragging');
      }
    });

    // Prevent default browser drag ghosting
    timelineScrollContainer.addEventListener('dragstart', (e) => e.preventDefault());

    // Route Mode Toggle Listeners (Highway vs Normal)
    setupRouteModeListeners();
  }

  /**
   * Toggles the routing mode between 'highway' and 'normal', updating:
   * 1. Application state
   * 2. HUD toggle button active states
   * 3. Map 3D road textures & geometry
   * 4. Status bar telemetry chip & mode pill
   * 5. Toast feedback
   */
  function setRouteMode(mode) {
    if (mode !== 'highway' && mode !== 'normal') return;
    if (state.routeMode === mode) return; // No change

    state.routeMode = mode;

    // Sync routing engine
    if (window.SRI_LANKA_ROUTES) {
      window.SRI_LANKA_ROUTES.setRouteMode(mode);
    }

    // Update map 3D ribbons & texture
    if (window.mapState && window.mapState.setRouteMode) {
      window.mapState.setRouteMode(mode);
    }

    // Update HUD toggle buttons
    const hwBtn = document.getElementById('route-mode-btn-highway');
    const nmBtn = document.getElementById('route-mode-btn-normal');
    if (hwBtn && nmBtn) {
      hwBtn.classList.toggle('active', mode === 'highway');
      nmBtn.classList.toggle('active', mode === 'normal');
    }

    // Update HUD switch border color to match active mode
    const switchEl = document.getElementById('map-route-mode-switch');
    if (switchEl) {
      switchEl.style.borderColor = mode === 'normal'
        ? 'rgba(251, 191, 36, 0.45)'
        : 'rgba(0, 255, 170, 0.35)';
    }

    // Refresh the status bar (telemetry chip + mode pill + sidebar summary)
    updateTimelineDayStatusBar();

    // Toast feedback
    const label = mode === 'highway'
      ? 'Highway Mode — Expressways & Fast Bypasses'
      : 'Normal Route — Coastal & Town Roads';
    showToast(label);
  }

  /**
   * Attaches click listeners to the HUD route mode toggle buttons
   * and the status bar mode pill.
   */
  function setupRouteModeListeners() {
    // HUD toggle buttons
    const hwBtn = document.getElementById('route-mode-btn-highway');
    const nmBtn = document.getElementById('route-mode-btn-normal');

    if (hwBtn) {
      hwBtn.addEventListener('click', () => setRouteMode('highway'));
    }
    if (nmBtn) {
      nmBtn.addEventListener('click', () => setRouteMode('normal'));
    }

    // Status bar pill cycles between modes on click
    const modePill = document.getElementById('status-route-mode-pill');
    if (modePill) {
      modePill.addEventListener('click', () => {
        setRouteMode(state.routeMode === 'highway' ? 'normal' : 'highway');
      });
    }
  }

  function changeDays(newDays) {
    if (newDays < 1) newDays = 1;
    if (newDays > 60) newDays = 60;
    state.days = newDays;
    state.nights = Math.max(0, state.days - 1);
    state.indicatorPoint = null;

    // Synchronize day destinations array with new tour days
    if (!state.dayDestinations) state.dayDestinations = [];
    if (state.dayDestinations.length > state.days) {
      state.dayDestinations = state.dayDestinations.slice(0, state.days);
    }

    // Clamp selectedDayIndex if out of bounds
    if (state.selectedDayIndex >= state.days) {
      state.selectedDayIndex = state.days - 1;
    }

    // Clamp selectedPiece if out of bounds
    if (state.selectedPiece) {
      if (state.selectedPiece.type === 'day' && state.selectedPiece.index > state.days) {
        state.selectedPiece = null;
      } else if (state.selectedPiece.type === 'night' && state.selectedPiece.index > state.nights) {
        state.selectedPiece = null;
      }
    }

    // Clean up hotel bookings for removed nights
    if (state.hotelBookings) {
      Object.keys(state.hotelBookings).forEach((nightKey) => {
        if (parseInt(nightKey, 10) > state.nights) {
          delete state.hotelBookings[nightKey];
        }
      });
    }

    if (state.mergedNights) {
      Object.keys(state.mergedNights).forEach((nightKey) => {
        if (parseInt(nightKey, 10) >= state.nights) {
          delete state.mergedNights[nightKey];
        }
      });
    }

    updateUI();
  }

  function changeNights(newNights) {
    if (newNights < 0) newNights = 0;
    if (newNights > 60) newNights = 60;
    state.nights = newNights;
    state.days = state.nights + 1;
    state.indicatorPoint = null;

    if (state.selectedPiece && state.selectedPiece.type === 'night' && state.selectedPiece.index > state.nights) {
      state.selectedPiece = null;
    }

    if (state.hotelBookings) {
      Object.keys(state.hotelBookings).forEach((nightKey) => {
        if (parseInt(nightKey, 10) > state.nights) {
          delete state.hotelBookings[nightKey];
        }
      });
    }

    if (state.mergedNights) {
      Object.keys(state.mergedNights).forEach((nightKey) => {
        if (parseInt(nightKey, 10) >= state.nights) {
          delete state.mergedNights[nightKey];
        }
      });
    }

    updateUI();
  }

  function updateQuickChipsHighlight() {
    if (!quickTimeChips) return;
    const chips = quickTimeChips.querySelectorAll('.time-chip');
    chips.forEach(chip => {
      if (chip.dataset.time === state.arrivalTime) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });
  }

  /**
   * Initializes the Itinerary Configuration Tab Bar (Arival Info, D/N, Pax, Vehicle, Employee)
   * matching media_1790319778120.png
   */
  function initItinConfigTabs() {
    const tabBtns = document.querySelectorAll('.itin-config-tab-btn');
    const panes = document.querySelectorAll('.itin-config-pane');
    if (!tabBtns.length) return;

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        if (!targetId) return;

        tabBtns.forEach(b => b.classList.remove('active'));
        panes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetPane = document.getElementById(targetId);
        if (targetPane) {
          targetPane.classList.add('active');
        }

        if (targetId === 'itin-tab-vehicle' && window.vehicleShowcase) {
          setTimeout(() => {
            window.vehicleShowcase.handleResize();
            window.vehicleShowcase.updateUI();
          }, 50);
        }
      });
    });
  }

  /**
   * Initializes the Currency Toggle switch (USD ↔ LKR)
   * Toggles state.currency and animates the pill switch matching the design
   */
  function initCurrencyToggle() {
    const toggle = document.getElementById('currency-toggle');
    if (!toggle) return;

    const iconSymbol = document.getElementById('currency-icon-symbol');
    const label = document.getElementById('currency-toggle-label');
    let animating = false;

    function applyState(animate) {
      const isLKR = state.currency === 'LKR';

      if (!animate) {
        // Instant set (initial load)
        if (isLKR) {
          toggle.classList.add('lkr');
        } else {
          toggle.classList.remove('lkr');
        }
        iconSymbol.textContent = isLKR ? 'Rs' : '$';
        iconSymbol.style.fontSize = isLKR ? '0.95rem' : '1.25rem';
        label.textContent = isLKR ? 'LKR' : 'USD';
        label.style.opacity = '1';
        iconSymbol.style.opacity = '1';
        return;
      }

      // Animated toggle
      animating = true;

      // 1. Fade out text
      label.style.opacity = '0';
      iconSymbol.style.opacity = '0';
      iconSymbol.style.transition = 'opacity 0.15s ease';
      label.style.transition = 'opacity 0.15s ease';

      // 2. After fade out, swap class (starts slide) and update text
      setTimeout(() => {
        if (isLKR) {
          toggle.classList.add('lkr');
        } else {
          toggle.classList.remove('lkr');
        }
        iconSymbol.textContent = isLKR ? 'Rs' : '$';
        iconSymbol.style.fontSize = isLKR ? '0.95rem' : '1.25rem';
        label.textContent = isLKR ? 'LKR' : 'USD';
      }, 160);

      // 3. Fade text back in after slide is underway
      setTimeout(() => {
        label.style.opacity = '1';
        iconSymbol.style.opacity = '1';
        label.style.transition = 'opacity 0.25s ease';
        iconSymbol.style.transition = 'opacity 0.25s ease';
      }, 280);

      // 4. Unlock after full animation
      setTimeout(() => { animating = false; }, 500);
    }

    updateCurrencyUI = applyState;

    toggle.addEventListener('click', () => {
      if (animating) return;
      state.currency = state.currency === 'USD' ? 'LKR' : 'USD';
      applyState(true);
      saveCurrentItineraryToStorage();
      syncLiveItineraryToStorage();
      showToast(`Currency set to ${state.currency}`);
    });

    // Set initial state (no animation)
    applyState(false);
  }

  /**
   * Initializes the Hotel Rating star selector in the Itinerary Info tab.
   * Clicking a star sets state.hotelStarFilter to that value (stars >= N)
   * and re-renders hotel cards with the updated filter.
   */
  function initHotelRatingStars() {
    const pill = document.getElementById('hotel-rating-pill');
    if (!pill) return;

    const stars = pill.querySelectorAll('.hotel-rating-star');

    function updateStarUI(rating) {
      stars.forEach(star => {
        const val = parseInt(star.dataset.star, 10);
        if (val <= rating) {
          star.classList.add('filled');
        } else {
          star.classList.remove('filled');
        }
      });
    }

    // Set initial state from hotelStarFilter (default '4')
    const initialRating = (state.hotelStarFilter && state.hotelStarFilter !== 'all')
      ? parseInt(state.hotelStarFilter, 10)
      : 5;
    updateStarUI(initialRating);

    // Hover preview: temporarily show fill up to hovered star
    stars.forEach(star => {
      star.addEventListener('mouseenter', () => {
        const hoverVal = parseInt(star.dataset.star, 10);
        stars.forEach(s => {
          const v = parseInt(s.dataset.star, 10);
          if (v <= hoverVal) {
            s.classList.add('filled');
          } else {
            s.classList.remove('filled');
          }
        });
      });
    });

    // Restore actual state on mouse leave from the pill
    pill.addEventListener('mouseleave', () => {
      const currentRating = (state.hotelStarFilter && state.hotelStarFilter !== 'all')
        ? parseInt(state.hotelStarFilter, 10)
        : 5;
      updateStarUI(currentRating);
    });

    updateHotelRatingStarsUI = updateStarUI;

    // Click to set the filter
    stars.forEach(star => {
      star.addEventListener('click', () => {
        const clickedVal = star.dataset.star; // string like '3'
        state.hotelStarFilter = clickedVal;
        state.hotelDisplayLimit = 35;
        updateStarUI(parseInt(clickedVal, 10));
        renderHotelCards();
        saveCurrentItineraryToStorage();
        syncLiveItineraryToStorage();
        showToast(`Filter: ${clickedVal}★ and above`);
      });
    });
  }

  /**
   * Initializes the Employee tab: role carousel + Add button + profile rendering.
   * Roles cycle: Driver → Guide → National Guide
   * Clicking Add assigns the displayed role and renders a profile avatar below.
   */
  function initEmployeeTab() {
    const ROLES = ['Driver', 'Guide', 'National Guide'];
    let roleIndex = 0;

    const rolePill = document.getElementById('emp-role-pill');
    const prevBtn = document.getElementById('emp-prev-btn');
    const nextBtn = document.getElementById('emp-next-btn');
    const addBtn = document.getElementById('emp-add-btn');
    const profilesRow = document.getElementById('emp-profiles-row');

    if (!rolePill || !prevBtn || !nextBtn || !addBtn || !profilesRow) return;

    function updateRolePill() {
      rolePill.style.opacity = '0';
      setTimeout(() => {
        rolePill.textContent = ROLES[roleIndex];
        rolePill.style.opacity = '1';
      }, 120);
    }

    prevBtn.addEventListener('click', () => {
      roleIndex = (roleIndex - 1 + ROLES.length) % ROLES.length;
      updateRolePill();
    });

    nextBtn.addEventListener('click', () => {
      roleIndex = (roleIndex + 1) % ROLES.length;
      updateRolePill();
    });

    function renderProfiles() {
      profilesRow.innerHTML = '';

      state.employees.forEach((role, idx) => {
        const item = document.createElement('div');
        item.className = 'emp-profile-item';
        item.style.animationDelay = `${idx * 0.06}s`;

        item.innerHTML = `
          <div class="emp-profile-avatar">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="8" r="4" stroke="#4b83d6" stroke-width="2" fill="none"/>
              <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="#4b83d6" stroke-width="2" fill="none" stroke-linecap="round"/>
            </svg>
            <button type="button" class="emp-profile-remove-btn" data-idx="${idx}" title="Remove ${role}">×</button>
          </div>
          <span class="emp-profile-label">${role}</span>
        `;

        profilesRow.appendChild(item);
      });

      // Wire up remove buttons
      profilesRow.querySelectorAll('.emp-profile-remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const removeIdx = parseInt(btn.dataset.idx, 10);
          const removedRole = state.employees[removeIdx];
          state.employees.splice(removeIdx, 1);
          renderProfiles();
          saveCurrentItineraryToStorage();
          syncLiveItineraryToStorage();
          showToast(`Removed ${removedRole}`);
        });
      });
    }

    renderEmployeeProfiles = renderProfiles;

    addBtn.addEventListener('click', () => {
      const role = ROLES[roleIndex];
      state.employees.push(role);
      renderProfiles();
      saveCurrentItineraryToStorage();
      syncLiveItineraryToStorage();
      showToast(`Added ${role}`);
    });

    // Render initial state (empty)
    renderProfiles();
  }

  /**
   * Synchronizes the segmented date and time boxes (YYYY/MM/DD and HH/MM/AM-PM)
   * with current state.arrivalDate and state.arrivalTime
   * matching media_1790319846077.png
   */
  function syncArrivalDisplayBoxes() {
    const yearBox = document.getElementById('arrival-year-box');
    const monthBox = document.getElementById('arrival-month-box');
    const dayBox = document.getElementById('arrival-day-box');
    const hourBox = document.getElementById('arrival-hour-box');
    const minuteBox = document.getElementById('arrival-minute-box');
    const ampmBtn = document.getElementById('arrival-ampm-btn');

    // Sync Date: YYYY-MM-DD
    if (yearBox && monthBox && dayBox) {
      if (state.arrivalDate) {
        const parts = state.arrivalDate.split('-');
        if (parts.length === 3) {
          if (document.activeElement !== yearBox) yearBox.value = parts[0] || '';
          if (document.activeElement !== monthBox) monthBox.value = parts[1] || '';
          if (document.activeElement !== dayBox) dayBox.value = parts[2] || '';
        }
      } else {
        if (document.activeElement !== yearBox) yearBox.value = '';
        if (document.activeElement !== monthBox) monthBox.value = '';
        if (document.activeElement !== dayBox) dayBox.value = '';
      }
    }

    // Sync Time: HH:MM (24-hour) -> 12-hour + AM/PM
    if (hourBox && minuteBox && ampmBtn) {
      if (state.arrivalTime) {
        const parts = state.arrivalTime.split(':');
        if (parts.length >= 2) {
          const h24 = parseInt(parts[0], 10) || 0;
          const mm = parts[1] || '00';
          const ampm = h24 >= 12 ? 'PM' : 'AM';
          let h12 = h24 % 12;
          if (h12 === 0) h12 = 12;
          const h12Str = String(h12).padStart(2, '0');

          if (document.activeElement !== hourBox) hourBox.value = h12Str;
          if (document.activeElement !== minuteBox) minuteBox.value = mm;
          ampmBtn.textContent = ampm;
        }
      } else {
        if (document.activeElement !== hourBox) hourBox.value = '';
        if (document.activeElement !== minuteBox) minuteBox.value = '';
        ampmBtn.textContent = 'AM';
      }
    }
  }

  /**
   * Wires up clicking on the Calendar icon and Clock icon to open native date/time pickers,
   * as well as direct editing of the segmented date/time boxes and AM/PM toggle button.
   */
  function setupArrivalDetailsControls() {
    const dateTrigger = document.getElementById('arrival-date-box-trigger');
    const timeTrigger = document.getElementById('arrival-time-box-trigger');
    const yearBox = document.getElementById('arrival-year-box');
    const monthBox = document.getElementById('arrival-month-box');
    const dayBox = document.getElementById('arrival-day-box');
    const hourBox = document.getElementById('arrival-hour-box');
    const minuteBox = document.getElementById('arrival-minute-box');
    const ampmBtn = document.getElementById('arrival-ampm-btn');

    // 1. Calendar Icon click -> opens calendar date picker
    if (dateTrigger && arrivalDateInput) {
      dateTrigger.addEventListener('click', (e) => {
        try {
          if (typeof arrivalDateInput.showPicker === 'function') {
            arrivalDateInput.showPicker();
          } else {
            arrivalDateInput.focus();
            arrivalDateInput.click();
          }
        } catch (err) {
          arrivalDateInput.click();
        }
      });
    }

    // 2. Clock Icon click -> opens time picker
    if (timeTrigger && arrivalTimeInput) {
      timeTrigger.addEventListener('click', (e) => {
        try {
          if (typeof arrivalTimeInput.showPicker === 'function') {
            arrivalTimeInput.showPicker();
          } else {
            arrivalTimeInput.focus();
            arrivalTimeInput.click();
          }
        } catch (err) {
          arrivalTimeInput.click();
        }
      });
    }

    // 3. Direct user editing of Date segmented boxes (YYYY, MM, DD)
    function commitDateFromSegments() {
      if (!yearBox || !monthBox || !dayBox) return;
      let y = parseInt(yearBox.value, 10);
      let m = parseInt(monthBox.value, 10);
      let d = parseInt(dayBox.value, 10);

      if (isNaN(y) || y < 2000 || y > 2099) y = 2026;
      if (isNaN(m) || m < 1 || m > 12) m = 8;
      if (isNaN(d) || d < 1 || d > 31) d = 27;

      const formatted = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      state.arrivalDate = formatted;
      state.indicatorPoint = null;
      if (arrivalDateInput) arrivalDateInput.value = formatted;
      updateUI();
      if (window.mapState && window.mapState.updateWeatherForDate) {
        window.mapState.updateWeatherForDate(state.arrivalDate);
      }
    }

    [yearBox, monthBox, dayBox].forEach(box => {
      if (!box) return;
      box.addEventListener('change', commitDateFromSegments);
      box.addEventListener('blur', commitDateFromSegments);
      box.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          box.blur();
        }
      });
    });

    // 4. AM/PM button toggle
    if (ampmBtn) {
      ampmBtn.addEventListener('click', () => {
        const currentAmpm = ampmBtn.textContent.trim().toUpperCase();
        const newAmpm = currentAmpm === 'AM' ? 'PM' : 'AM';
        ampmBtn.textContent = newAmpm;
        commitTimeFromSegments(newAmpm);
      });
    }

    // 5. Direct user editing of Time segmented boxes (HH, MM)
    function commitTimeFromSegments(forcedAmpm) {
      if (!hourBox || !minuteBox || !ampmBtn) return;
      let h = parseInt(hourBox.value, 10);
      let m = parseInt(minuteBox.value, 10);
      const ampm = forcedAmpm || ampmBtn.textContent.trim().toUpperCase();

      if (isNaN(h) || h < 1 || h > 12) h = 8;
      if (isNaN(m) || m < 0 || m > 59) m = 0;

      // Convert 12h to 24h
      let h24 = h % 12;
      if (ampm === 'PM') h24 += 12;

      const formatted = `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      state.arrivalTime = formatted;
      state.indicatorPoint = null;
      if (arrivalTimeInput) arrivalTimeInput.value = formatted;
      updateQuickChipsHighlight();
      updateUI();
    }

    [hourBox, minuteBox].forEach(box => {
      if (!box) return;
      box.addEventListener('change', () => commitTimeFromSegments());
      box.addEventListener('blur', () => commitTimeFromSegments());
      box.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          box.blur();
        }
      });
    });
  }

  function renderPresets() {
    if (!presetsContainer) return;
    presetsContainer.innerHTML = '';
    PRESETS.forEach((preset) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'preset-chip';
      btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>${preset.name}`;

      btn.addEventListener('click', () => {
        state.days = preset.days;
        state.nights = Math.max(0, state.days - 1);
        state.indicatorPoint = null;
        if (preset.destinations) {
          state.dayDestinations = [...preset.destinations];
          state.selectedAttractions = {};
          for (let d = 0; d < state.days; d++) {
            if (preset.destinations[d]) {
              state.selectedAttractions[d] = getDefaultAttractionsForDay(d);
            }
          }
        }
        updateUI();
        saveCurrentItineraryToStorage();
        syncLiveItineraryToStorage();
      });

      presetsContainer.appendChild(btn);
    });
  }

  function highlightActivePreset() {
    if (!presetsContainer) return;
    const chips = presetsContainer.querySelectorAll('.preset-chip');
    PRESETS.forEach((p, idx) => {
      if (chips[idx]) {
        if (state.days === p.days && state.nights === p.nights) {
          chips[idx].classList.add('active');
        } else {
          chips[idx].classList.remove('active');
        }
      }
    });
  }

  const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const DOW_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  function getFastDateMeta(d) {
    return {
      monthName: MONTH_NAMES[d.getMonth()],
      dayDate: d.getDate(),
      dow: DOW_NAMES[d.getDay()]
    };
  }

  function format12h(h24, m) {
    const h12 = (h24 % 12 === 0) ? 12 : (h24 % 12);
    const ampm = h24 >= 12 ? 'PM' : 'AM';
    const hh = h12 < 10 ? '0' + h12 : '' + h12;
    const mm = m < 10 ? '0' + m : '' + m;
    return `${hh}:${mm} ${ampm}`;
  }

  let pendingZoomRaf = null;
  let targetZoom = null;
  let targetZoomClientX = undefined;

  /**
   * Adjusts the timeline zoom expansion level (Premiere Pro style).
   * Batched via requestAnimationFrame for silky-smooth 60fps/120fps expansion without lag.
   * If clientX is provided (e.g. from Alt+Wheel), anchors the zoom at the cursor position.
   * Otherwise anchors to the center of the scroll container.
   */
  function setZoom(newZoom, clientX) {
    const clampedZoom = Math.min(2.5, Math.max(0.5, parseFloat(newZoom.toFixed(2))));
    if (Math.abs(clampedZoom - state.zoom) < 0.001) return;

    // Immediately update state and controls for instant, 0-latency UI responsiveness
    state.zoom = clampedZoom;
    if (zoomSlider) {
      zoomSlider.value = state.zoom.toString();
    }
    if (zoomLevelBadge) {
      zoomLevelBadge.textContent = `${Math.round(state.zoom * 100)}%`;
    }

    targetZoom = clampedZoom;
    if (clientX !== undefined) {
      targetZoomClientX = clientX;
    }

    if (!pendingZoomRaf) {
      pendingZoomRaf = requestAnimationFrame(() => {
        pendingZoomRaf = null;
        if (targetZoom !== null) {
          applyZoom(targetZoom, targetZoomClientX);
          targetZoom = null;
          targetZoomClientX = undefined;
        }
      });
    }
  }

  function applyZoom(clampedZoom, clientX) {
    let targetPointRatio = 0.5;
    let mouseOffsetInContainer = 0;
    const oldScrollWidth = timelineScrollContainer ? timelineScrollContainer.scrollWidth : 0;
    const oldScrollLeft = timelineScrollContainer ? timelineScrollContainer.scrollLeft : 0;

    if (timelineScrollContainer && oldScrollWidth > 0) {
      const containerRect = timelineScrollContainer.getBoundingClientRect();
      if (clientX !== undefined) {
        mouseOffsetInContainer = clientX - containerRect.left;
      } else {
        mouseOffsetInContainer = containerRect.width / 2;
      }
      const contentPoint = oldScrollLeft + mouseOffsetInContainer;
      targetPointRatio = contentPoint / oldScrollWidth;
    }

    // Re-render tracks using optimized DocumentFragments
    renderDateHeader();
    renderTimeline();
    renderHotelsTrack();
    syncTimeIndicator();

    // Anchor horizontal scroll position to cursor / center
    if (timelineScrollContainer && oldScrollWidth > 0) {
      const newScrollWidth = timelineScrollContainer.scrollWidth;
      const newContentPoint = newScrollWidth * targetPointRatio;
      timelineScrollContainer.scrollLeft = Math.max(0, newContentPoint - mouseOffsetInContainer);
    }
  }

  /**
   * Calculates the Day 1 trimmed width based on arrival time and current zoom level.
   * Daytime is 06:00 AM to 06:00 PM (18:00).
   * Nighttime is 06:00 PM to 06:00 AM (midnight is at the center).
   * Scaled with state.zoom for Premiere Pro-style timeline expansion.
   */
  function calculateDay1Width() {
    const currentDayW = Math.round(STANDARD_DAY_WIDTH * state.zoom);
    const currentNightW = Math.round(NIGHT_SQUARE_WIDTH * state.zoom);

    const timeParts = state.arrivalTime.split(':');
    const h = parseInt(timeParts[0] || '12', 10);
    const m = parseInt(timeParts[1] || '0', 10);
    const totalHours = h + (m / 60);

    // Daytime window: 06:00 AM to 06:00 PM (18:00) = 12 hours
    if (totalHours <= 6.0) {
      return currentDayW; // 100% full width
    }
    if (totalHours >= 18.0) {
      return currentNightW; // Night arrival sliver (matches night square)
    }

    // Between 06:00 AM and 06:00 PM (18:00)
    const remainingHours = 18.0 - totalHours;
    const ratio = remainingHours / 12.0;
    return currentNightW + Math.round(ratio * (currentDayW - currentNightW));
  }

  /**
   * Formats "HH:MM" into "08:00 AM" / "08:00 PM"
   */
  function format12HourTime(timeStr) {
    const parts = timeStr.split(':');
    let h = parseInt(parts[0] || '12', 10);
    const m = parts[1] || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    const formattedH = h < 10 ? '0' + h : '' + h;
    return `${formattedH}:${m} ${ampm}`;
  }

  /**
   * Computes Sri Lanka Tourism Travel Season, Monsoon Status, and Regional Travel Advice
   * based on the arrival date month.
   */
  /**
   * Computes Sri Lanka Tourism Travel Season, Monsoon Status, and Regional Travel Advice
   * based on the arrival date month, matching the exact format in user's reference photo.
   */
  function getSriLankaClimateInfo(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length < 3) return null;
    const month = parseInt(parts[1], 10); // 1 to 12

    // 1. Tourism Travel Season: Summer Season (May - Oct) vs Winter Season (Nov - Apr)
    const isSummer = (month >= 5 && month <= 10);
    const seasonTitleHtml = isSummer ? 'Summer<br>Season' : 'Winter<br>Season';
    const seasonTooltip = isSummer
      ? 'Summer Season: Peak season for East Coast surfing & wildlife gathering.'
      : 'Winter Season: Peak inbound travel season for European & Western visitors.';

    // 2. Sri Lanka Monsoon Status (Official Meteorological Cycle)
    let monsoonTitleHtml, monsoonTooltip, recommendedZones;

    if (month >= 5 && month <= 9) {
      // South-West Monsoon (Yala)
      monsoonTitleHtml = 'South-West<br>Monsoons';
      monsoonTooltip = 'South-West Monsoon (Yala): Active May – September. Rains in South-West & Hills; East & North are sunny, dry & calm.';
      recommendedZones = 'East Coast (Arugam Bay, Trincomalee, Passikudah) & Cultural Triangle';
    } else if (month >= 10 && month <= 11) {
      // Second Inter-Monsoon (SIM)
      monsoonTitleHtml = 'Second Inter-<br>Monsoon';
      monsoonTooltip = 'Second Inter-Monsoon (SIM): Transitional Oct – Nov. Warm mornings with localized late-afternoon thunderstorms.';
      recommendedZones = 'Cultural Triangle (Sigiriya, Dambulla) & early morning wildlife safaris';
    } else if (month >= 12 || month === 1 || month === 2) {
      // North-East Monsoon (Maha)
      monsoonTitleHtml = 'North-East<br>Monsoons';
      monsoonTooltip = 'North-East Monsoon (Maha): Active Dec – February. Rains in North & East; South and West coasts enjoy calm seas & sunshine.';
      recommendedZones = 'South & West Coast (Galle, Mirissa, Bentota, Weligama) & Yala Safari';
    } else {
      // First Inter-Monsoon (FIM: March – April)
      monsoonTitleHtml = 'First Inter-<br>Monsoon';
      monsoonTooltip = 'First Inter-Monsoon (FIM): Transitional March – April. Warm and sunny across the island with brief evening convective showers.';
      recommendedZones = 'South Coast, Central Highlands (Ella, Nuwara Eliya) & Cultural Triangle';
    }

    return {
      seasonTitleHtml,
      seasonTooltip,
      monsoonTitleHtml,
      monsoonTooltip,
      recommendedZones
    };
  }

  /**
   * Renders the Sri Lanka Travel Season and Monsoon Status widget.
   */
  function renderClimateSeasonInfo() {
    if (!tourismSeasonTitle || !monsoonStatusTitle) return;
    const climate = getSriLankaClimateInfo(state.arrivalDate);
    if (!climate) return;

    tourismSeasonTitle.innerHTML = climate.seasonTitleHtml;
    if (tourismSeasonCard) tourismSeasonCard.title = climate.seasonTooltip;

    monsoonStatusTitle.innerHTML = climate.monsoonTitleHtml;
    if (monsoonStatusCard) monsoonStatusCard.title = climate.monsoonTooltip;

    if (advisoryText) {
      advisoryText.textContent = climate.recommendedZones;
      advisoryText.title = `Ideal Regions: ${climate.recommendedZones}`;
    }
    if (seasonAdvisoryBar) {
      seasonAdvisoryBar.title = `Ideal Regions: ${climate.recommendedZones}`;
    }
  }

  function updateUI() {
    daysInput.value = state.days;
    nightsInput.value = state.nights;
    if (arrivalDateInput) arrivalDateInput.value = state.arrivalDate;
    if (arrivalTimeInput) arrivalTimeInput.value = state.arrivalTime;
    syncArrivalDisplayBoxes();

    const showNights = (state.filter === 'night' || state.filter === 'all');
    const showDays = (state.filter === 'day' || state.filter === 'all');
    if (filterNightsBtn) {
      filterNightsBtn.classList.toggle('active', showNights);
      filterNightsBtn.setAttribute('aria-pressed', showNights ? 'true' : 'false');
      filterNightsBtn.setAttribute('aria-label', showNights ? 'Night Badges: ON' : 'Night Badges: OFF');
    }
    if (filterDaysBtn) {
      filterDaysBtn.classList.toggle('active', showDays);
      filterDaysBtn.setAttribute('aria-pressed', showDays ? 'true' : 'false');
      filterDaysBtn.setAttribute('aria-label', showDays ? 'Day Badges: ON' : 'Day Badges: OFF');
    }

    if (zoomSlider) {
      zoomSlider.value = state.zoom.toString();
    }
    if (zoomLevelBadge) {
      zoomLevelBadge.textContent = `${Math.round(state.zoom * 100)}%`;
    }

    updateQuickChipsHighlight();
    highlightActivePreset();

    if (durationTotalBadge) {
      durationTotalBadge.textContent = `${state.days}D / ${state.nights}N Ceylon Tour`;
    }
    if (ratioDayBar) {
      ratioDayBar.style.flex = state.days;
      ratioDayBar.title = `${state.days} Days`;
    }
    if (ratioNightBar) {
      ratioNightBar.style.flex = state.nights;
      ratioNightBar.title = `${state.nights} Nights`;
    }

    renderClimateSeasonInfo();
    if (window.mapState && window.mapState.updateWeatherForDate) {
      window.mapState.updateWeatherForDate(state.arrivalDate);
    }
    if (window.mapState && window.mapState.updateItineraryRoutes && state.dayDestinations) {
      window.mapState.updateItineraryRoutes(state.dayDestinations.slice(0, state.days));
    }
    renderDateHeader();
    renderTimeline();
    renderHotelsTrack();
    syncTimeIndicator();
    renderSideItinerary();
    updateTimelineDayStatusBar();
  }

  /* ==========================================================================
     Itinerary Explorer Module: Real Sri Lanka Destinations & Activities
     ========================================================================== */

  const ALL_SRI_LANKA_DESTINATIONS = [
    'Airport (BIA)',
    'Sigiriya',
    'Anuradhapura',
    'Dambulla',
    'Polonnaruwa',
    'Kandy',
    'Nuwara Eliya',
    'Ella',
    'Yala',
    'Udawalawe',
    'Mirissa',
    'Galle',
    'Bentota',
    'Unawatuna',
    'Colombo',
    'Negombo',
    'Trincomalee',
    'Arugam Bay',
    'Passikudah',
    'Jaffna',
    'Wilpattu',
    'Sinharaja',
    'Horton Plains',
    'Adams Peak',
    'Tangalle',
    'Weligama',
    'Hikkaduwa',
    'Minneriya',
    'Kitulgala',
    'Mannar',
    'Pigeon Island',
    'Delft Island',
    'Casuarina Beach',
    'Nainativu'
  ];

  const ALL_SRI_LANKA_HOTELS = [
    'Heritance Kandalama',
    'Aliya Resort & Spa Sigiriya',
    'Water Garden Sigiriya',
    'Jetwing Vil Uyana',
    'Cinnamon Grand Colombo',
    'Galle Face Hotel Colombo',
    'Shangri-La Hotel Colombo',
    'The Kingsbury Colombo',
    'Earl\'s Regency Kandy',
    'Grand Kandyan Hotel',
    'The Kandy House',
    'Grand Hotel Nuwara Eliya',
    'Heritance Tea Factory',
    '98 Acres Resort & Spa Ella',
    'Cinnamon Wild Yala',
    'Jetwing Yala',
    'Wild Coast Tented Lodge Yala',
    'Amangalla Galle Fort',
    'Jetwing Lighthouse Galle',
    'Taj Bentota Resort & Spa',
    'Cinnamon Bentota Beach',
    'Mandara Resort Mirissa',
    'Araliya Beach Resort Unawatuna',
    'Jetwing Blue Negombo',
    'Heritance Negombo',
    'Trinco Blu by Cinnamon',
    'Uga Jungle Beach Trincomalee',
    'Uga Bay Passikudah',
    'Maalu Maalu Resort Passikudah',
    'Jetwing Jaffna',
    'Ulagalla by Uga Escapes',
    'The Sanctuary at Tissawewa',
    'Ekho Lake House Polonnaruwa',
    'Grand Udawalawe Safari Resort',
    'Amagi Aria Airport Transit Hotel',
    'The Gateway Hotel Airport Garden'
  ];

  const CURATED_ACTIVITIES = {
    'Airport (BIA)': [
      { title: 'International Flight Arrival & VIP Lounge', tag: 'Aviation Gateway' },
      { title: 'Expressway Transit to Colombo & Cultural Triangle', tag: 'Express Transit' }
    ],
    'Sigiriya': [
      { title: 'Sigiriya Lion Rock Citadel & Frescoes', tag: 'UNESCO Citadel' },
      { title: 'Minneriya Wild Elephant Gathering Safari', tag: 'Wildlife Safari' }
    ],
    'Anuradhapura': [
      { title: 'Sacred Ruwanwelisaya Stupa & Bodhi Tree', tag: 'Ancient Heritage' },
      { title: 'Jetavanaramaya Monastic Ruins Tour', tag: 'Archaeological' }
    ],
    'Dambulla': [
      { title: 'Golden Cave Temple & Ancient Murals', tag: 'Cave Sanctuary' },
      { title: 'Popham’s Arboretum Night Walk', tag: 'Nature Walk' }
    ],
    'Polonnaruwa': [
      { title: 'Colossal Gal Vihara Buddha Sculptures', tag: 'Medieval Ruins' },
      { title: 'Parakrama Samudra Reservoir Bicycle Trail', tag: 'Scenic Cycling' }
    ],
    'Kandy': [
      { title: 'Temple of the Sacred Tooth Relic', tag: 'Cultural Relic' },
      { title: 'Peradeniya Royal Botanical Gardens Walk', tag: 'Botanical Tour' }
    ],
    'Nuwara Eliya': [
      { title: 'Pedro Tea Estate & Ceylon Tea Factory Tour', tag: 'Tea Plantation' },
      { title: 'Gregory Lake Waterfront & Victoria Park', tag: 'Alpine Garden' }
    ],
    'Ella': [
      { title: 'Nine Arches Bridge & Scenic Highland Rail', tag: 'Highland Landmark' },
      { title: 'Little Adam’s Peak Sunrise Hike', tag: 'Mountain Trek' }
    ],
    'Yala': [
      { title: 'Leopard & Sloth Bear 4x4 Game Drive', tag: 'Wildlife Safari' },
      { title: 'Yala Coastal Lagoons & Birding Tour', tag: 'Wetland Birding' }
    ],
    'Udawalawe': [
      { title: 'Elephant Transit Home Feeding Session', tag: 'Elephant Care' },
      { title: 'Udawalawe Grassland 4x4 Safari', tag: 'Open Safari' }
    ],
    'Mirissa': [
      { title: 'Blue Whale & Dolphin Watching Voyage', tag: 'Marine Safari' },
      { title: 'Coconut Tree Hill Sunset Photography', tag: 'Scenic Viewpoint' }
    ],
    'Galle': [
      { title: 'Galle Dutch Fort Ramparts & Lighthouse Walk', tag: 'Colonial Ramparts' },
      { title: 'Sunset View over Indian Ocean Bastions', tag: 'Ocean Bastion' }
    ],
    'Bentota': [
      { title: 'Madu Ganga Mangrove & Cinnamon Island Boat Safari', tag: 'Mangrove Safari' },
      { title: 'Bentota Lagoon Jet Ski & Water Skiing', tag: 'Water Sports' }
    ],
    'Unawatuna': [
      { title: 'Jungle Beach Coral Reef Snorkeling', tag: 'Coral Diving' },
      { title: 'Japanese Peace Pagoda Ocean Vista', tag: 'Hilltop Shrine' }
    ],
    'Colombo': [
      { title: 'Galle Face Green Promenade & Street Food', tag: 'Coastal Urban' },
      { title: 'Dutch Hospital Heritage Dining Precinct', tag: 'Heritage Dining' }
    ],
    'Negombo': [
      { title: 'Dutch Canal & Lagoon Catamaran Boat Tour', tag: 'Lagoon Tour' },
      { title: 'Lellama Traditional Morning Fish Auction', tag: 'Local Culture' }
    ],
    'Trincomalee': [
      { title: 'Nilaveli White Sand Beach & Snorkeling', tag: 'Coral Sanctuary' },
      { title: 'Koneswaram Temple on Swami Rock Cliff', tag: 'Cliffside Temple' }
    ],
    'Arugam Bay': [
      { title: 'Main Point World-Class Surf Session', tag: 'Wave Surfing' },
      { title: 'Kudumbigala Forest Hermitage & Lagoon Safari', tag: 'Wilderness Sanctuary' }
    ],
    'Passikudah': [
      { title: 'Shallow Calm Reef Bay Walking Tour', tag: 'Shallow Waters' },
      { title: 'East Coast Catamaran Sailing Excursion', tag: 'Sailing Tour' }
    ],
    'Jaffna': [
      { title: 'Nallur Kandaswamy Kovil & Jaffna Fort', tag: 'Northern Heritage' },
      { title: 'Nainativu Island Ferry Pilgrimage', tag: 'Island Excursion' }
    ],
    'Wilpattu': [
      { title: 'Willu Sand-Rimmed Lakes Leopard Safari', tag: 'Wilderness Safari' },
      { title: 'Kudiramalai Point Historic Exploration', tag: 'Ancient Cape' }
    ],
    'Sinharaja': [
      { title: 'UNESCO Virgin Rainforest Guided Canopy Trek', tag: 'Rainforest Trek' },
      { title: 'Mixed-Species Endemic Bird Flock Watching', tag: 'Birding Eco-Tour' }
    ],
    'Horton Plains': [
      { title: 'World’s End 880m Precipice Cliff Trail', tag: 'Highland Trek' },
      { title: 'Baker’s Falls Cloud Forest Cascade', tag: 'Waterfall Walk' }
    ],
    'Adams Peak': [
      { title: 'Sacred Sri Pada Midnight Summit Pilgrimage', tag: 'Sacred Pilgrimage' },
      { title: 'Shadow of the Peak Sunrise Phenomenon', tag: 'Mountain Sunrise' }
    ],
    'Tangalle': [
      { title: 'Rekawa Beach Night Sea Turtle Nesting Watch', tag: 'Turtle Eco-Tour' },
      { title: 'Hummanaya Natural Marine Blowhole', tag: 'Natural Wonder' }
    ],
    'Weligama': [
      { title: 'Traditional Stilt Fishermen Cultural Photography', tag: 'Living Heritage' },
      { title: 'Beginner Surf Lesson in Sandy Surf Bay', tag: 'Surfing School' }
    ],
    'Hikkaduwa': [
      { title: 'Wild Green Sea Turtle Shore Feeding', tag: 'Marine Wildlife' },
      { title: 'Glass Bottom Boat Coral Reef Excursion', tag: 'Glass Boat Tour' }
    ],
    'Minneriya': [
      { title: 'The Great Elephant Gathering 4x4 Safari', tag: 'Mega Safari' },
      { title: 'Minneriya Tank Wildlife Bird Watching', tag: 'Wetland Safari' }
    ],
    'Kitulgala': [
      { title: 'Kelani River White Water Rafting (Grade 3/4)', tag: 'Adventure Rafting' },
      { title: 'Bridge on the River Kwai & Belilena Cave Trek', tag: 'Jungle Trek' }
    ],
    'Mannar': [
      { title: 'Migratory Greater Flamingo Vankalai Lagoon Tour', tag: 'Flamingo Birding' },
      { title: 'Historic Baobab Tree & Adam’s Bridge Sandbars', tag: 'Causeway Tour' }
    ],
    'Pigeon Island': [
      { title: 'Blacktip Reef Shark & Coral Garden Snorkel', tag: 'Shark Snorkel' },
      { title: 'Hawksbill Turtle Marine Sanctuary Dive', tag: 'Marine Diving' }
    ],
    'Delft Island': [
      { title: 'Wild Feral Horses & Coral Stone Wall Trail', tag: 'Island Wildlife' },
      { title: 'Dutch Colonial Fort & Giant Ancient Baobab Tree', tag: 'Colonial Ruins' }
    ],
    'Casuarina Beach': [
      { title: 'Shallow Turquoise Waters & Casuarina Groves', tag: 'Shallow Waters' },
      { title: 'Karaitivu Island Lagoon & Traditional Catamaran', tag: 'Lagoon Sailing' }
    ],
    'Nainativu': [
      { title: 'Historic Nagadeepa Purana Vihara Temple', tag: 'Buddhist Shrine' },
      { title: 'Sacred Sri Nagapooshani Amman Kovil Tour', tag: 'Hindu Kovil' }
    ]
  };

  /**
   * Mathematically centers the blue underline indicator directly beneath the active tab button
   */
  function updateSideTabIndicator() {
    if (!sideTabIndicator) return;
    const activeBtn = document.querySelector('.side-tab-btn.active');
    if (!activeBtn) return;
    sideTabIndicator.style.width = `${activeBtn.offsetWidth}px`;
    sideTabIndicator.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
  }
  window.updateSideTabIndicator = updateSideTabIndicator;

  /**
   * Switches the active tab in the Itinerary Explorer: 'destinations' | 'hotels' | 'activity'
   */
  function switchSideTab(tab) {
    if (!sideTabBtns || sideTabBtns.length === 0) return;
    state.activeSideTab = tab;

    sideTabBtns.forEach((b) => {
      const isActive = (b.dataset.tab === tab);
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    updateSideTabIndicator();

    if (paneDestinations) paneDestinations.classList.toggle('active', tab === 'destinations');
    if (paneHotels) paneHotels.classList.toggle('active', tab === 'hotels');
    if (paneActivity) paneActivity.classList.toggle('active', tab === 'activity');

    if (tab === 'hotels') {
      renderHotelCards();
    } else if (tab === 'destinations') {
      renderDestinationCards();
    } else if (tab === 'activity') {
      renderActivityCards();
    }
  }

  /**
   * Sets up click listeners for the 3 navigation tabs: Destinations | Hotels | Activity
   */
  function setupSideTabs() {
    if (!sideTabBtns || sideTabBtns.length === 0) return;

    sideTabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        switchSideTab(tab);
      });
    });

    // Ensure indicator is positioned accurately on initial load and resize
    setTimeout(updateSideTabIndicator, 40);
    window.addEventListener('resize', updateSideTabIndicator);

    if (attractSearchInput) {
      attractSearchInput.addEventListener('input', (e) => {
        state.attractSearchTerm = e.target.value;
        renderActivityCards();
      });
    }

    if (attractExpandAllBtn) {
      attractExpandAllBtn.addEventListener('click', () => {
        const anyCollapsed = Array.from({ length: state.days }).some((_, i) => !state.expandedAttractionDays || !state.expandedAttractionDays[i]);
        if (!state.expandedAttractionDays) state.expandedAttractionDays = {};
        for (let i = 0; i < state.days; i++) {
          state.expandedAttractionDays[i] = anyCollapsed;
        }
        attractExpandAllBtn.textContent = anyCollapsed ? 'Collapse All' : 'Expand All';
        
        // Smoothly animate all cards open or closed simultaneously
        if (activitiesCardsList) {
          const cards = activitiesCardsList.querySelectorAll('.attract-day-card');
          cards.forEach((card) => {
            if (anyCollapsed) {
              card.classList.remove('collapsed');
              card.classList.add('expanded');
            } else {
              card.classList.remove('expanded');
              card.classList.add('collapsed');
            }
          });
        }
      });
    }
  }

  /**
   * Main render coordinator for Itinerary Explorer
   */
  function renderSideItinerary() {
    renderDestinationCards();
    renderHotelCards();
    renderActivityCards();
  }

  /**
   * Helper: returns all non-null destinations for a given day index (0-based) as an Array.
   */
  function getDayDestinations(dayIndex) {
    if (!state.dayDestinations) return [];
    const raw = state.dayDestinations[dayIndex];
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw.filter(Boolean);
    }
    return [raw];
  }
  window.getDayDestinations = getDayDestinations;

  /**
   * Helper: returns the final destination for a day (used for hotel stay and next day origin).
   */
  function getDayFinalDestination(dayIndex) {
    if (!state.dayDestinations) return null;
    const raw = state.dayDestinations[dayIndex];
    if (!raw) return null;
    if (Array.isArray(raw)) {
      if (raw[1]) return raw[1];
      if (raw[0]) return raw[0];
      return null;
    }
    return raw;
  }
  window.getDayFinalDestination = getDayFinalDestination;

  /**
   * Helper: returns the origin destination for a day (0-based).
   * Day 0 starts from Airport.
   */
  function getDayOrigin(dayIndex) {
    if (dayIndex <= 0) return 'Airport';
    return getDayFinalDestination(dayIndex - 1) || `Day ${dayIndex} Not Set`;
  }
  window.getDayOrigin = getDayOrigin;

  /**
   * Helper: checks if a day has 2 destination slots enabled.
   */
  function isMultiDestinationDay(dayIndex) {
    return !!(state.dayDestinations && Array.isArray(state.dayDestinations[dayIndex]));
  }
  window.isMultiDestinationDay = isMultiDestinationDay;

  /**
   * Splits a day into two destination slots:
   * [slot 0 (intermediate stop), slot 1 (final stop)]
   * The existing destination becomes slot 1, and slot 0 is empty (ready to select),
   * matching user Image 2 -> Image 3.
   */
  function splitDayIntoTwoDestinations(dayIndex) {
    if (!state.dayDestinations) state.dayDestinations = [];
    const existing = state.dayDestinations[dayIndex];
    if (Array.isArray(existing)) {
      if (existing.length < 4) {
        existing.push(null); // Append next destination stop
        state.selectedDestSlot = existing.length - 1;
        state.justSplitDay = true;
      } else {
        showToast(`Maximum 4 destinations per day`);
        return;
      }
    } else {
      const prevDest = existing || null;
      state.dayDestinations[dayIndex] = [null, prevDest];
      state.selectedDestSlot = 0;
      state.justSplitDay = true;
    }

    // Synchronize day selection
    state.selectedPiece = { type: 'day', index: dayIndex + 1 };
    state.selectedDayIndex = dayIndex;
    applySelectionFrame();

    updateTimelineDayStatusBar();
    renderDestinationCards();
    renderHotelCards();
    renderActivityCards();

    if (window.mapState && window.mapState.updateItineraryRoutes) {
      window.mapState.updateItineraryRoutes(state.dayDestinations.slice(0, state.days));
    }
    showToast(`Day ${dayIndex + 1}: select destination in the sidebar`);
  }
  window.splitDayIntoTwoDestinations = splitDayIntoTwoDestinations;

  /**
   * Removes a destination slot from a multi-destination day.
   * If more than 2 destinations, removes just that slot; if 2, returns to single destination.
   */
  function removeDayDestinationSlot(dayIndex, slotIndex) {
    if (!state.dayDestinations) return;
    const existing = state.dayDestinations[dayIndex];
    if (!Array.isArray(existing)) return;

    if (existing.length > 2) {
      existing.splice(slotIndex, 1);
      state.selectedDestSlot = Math.min(slotIndex, existing.length - 1);
      showToast(`Day ${dayIndex + 1} stop removed`);
    } else {
      const remaining = (slotIndex === 0 ? existing[1] : existing[0]) || null;
      state.dayDestinations[dayIndex] = remaining;
      state.selectedDestSlot = 0;
      showToast(`Day ${dayIndex + 1} reset to single destination`);
    }

    if (!state.selectedAttractions) state.selectedAttractions = {};
    const validDests = getDayDestinations(dayIndex);
    if (validDests.length === 0) {
      state.selectedAttractions[dayIndex] = [];
    } else {
      const existingCustom = (state.selectedAttractions[dayIndex] || []).filter(a => a.custom);
      state.selectedAttractions[dayIndex] = [...getDefaultAttractionsForDay(dayIndex), ...existingCustom];
    }

    saveCurrentItineraryToStorage();
    syncLiveItineraryToStorage();

    updateTimelineDayStatusBar();
    renderDestinationCards();
    renderHotelCards();
    renderActivityCards();

    if (window.mapState && window.mapState.updateItineraryRoutes) {
      window.mapState.updateItineraryRoutes(state.dayDestinations.slice(0, state.days));
    }
  }
  window.removeDayDestinationSlot = removeDayDestinationSlot;

  /**
   * Renders the authentic Sri Lanka destination cards with checkboxes matching media_1789842931687.png
   * When no day is selected: cards are disabled with a notice banner.
   * When a day is selected: cards allow assigning a destination to that specific day / slot.
   */
  function renderDestinationCards() {
    if (!destCardsList) return;
    destCardsList.innerHTML = '';

    const isDaySelected = (state.selectedPiece && state.selectedPiece.type === 'day');
    const dayNum = isDaySelected ? state.selectedPiece.index : null;
    const dayIdx = isDaySelected ? dayNum - 1 : null;
    const isMulti = isDaySelected && isMultiDestinationDay(dayIdx);
    const activeSlot = (state.selectedDestSlot === 0 || state.selectedDestSlot === 1) ? state.selectedDestSlot : null;

    let currentDest = null;
    if (isDaySelected && state.dayDestinations) {
      const rawDest = state.dayDestinations[dayIdx];
      if (Array.isArray(rawDest)) {
        currentDest = (activeSlot !== null) ? (rawDest[activeSlot] || null) : null;
      } else {
        currentDest = rawDest || null;
      }
    }

    const term = state.destSearchTerm || '';



    ALL_SRI_LANKA_DESTINATIONS.forEach((destName, i) => {
      if (term) {
        const lowerTerm = term.toLowerCase().trim();
        const cleanTerm = lowerTerm.replace(/[\s\(\)\-_]/g, '');
        const cleanDest = destName.toLowerCase().replace(/[\s\(\)\-_]/g, '');
        let matches = destName.toLowerCase().includes(lowerTerm) || cleanDest.includes(cleanTerm);
        if (!matches && (destName.toLowerCase().includes('airport') || destName.toLowerCase().includes('bia'))) {
          if (cleanTerm.includes('airport') || cleanTerm.includes('air') || cleanTerm.includes('port') || cleanTerm.includes('bia') || cleanTerm.includes('cmb') || cleanTerm.includes('katunayake')) {
            matches = true;
          }
        }
        if (!matches) {
          return;
        }
      }

      const card = document.createElement('div');
      card.className = 'dest-card-item';
      card.dataset.destIndex = i;
      card.dataset.destName = destName;

      // Selected card styling matching media_1789842931687.png
      const isSelected = isDaySelected && (destName === currentDest);
      if (isSelected) {
        card.classList.add('selected');
      }

      // Check if this destination is selected in another slot or when deselect is active
      let isOtherSlot = false;
      let otherSlotLabel = '';
      if (isMulti) {
        const raw = state.dayDestinations[dayIdx];
        if (Array.isArray(raw)) {
          const matchIdx = raw.indexOf(destName);
          if (matchIdx !== -1 && matchIdx !== activeSlot) {
            isOtherSlot = true;
            otherSlotLabel = `Stop ${matchIdx + 1}`;
          }
        }
      }

      // Left wrap: destination name
      const leftWrap = document.createElement('div');
      leftWrap.className = 'dest-card-left';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'dest-card-name';
      if (destName === 'Airport (BIA)' || destName === 'Airport') {
        nameSpan.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>${escapeHtml(destName)}`;
      } else {
        nameSpan.textContent = destName;
      }
      leftWrap.appendChild(nameSpan);

      if (isOtherSlot) {
        const tag = document.createElement('span');
        tag.className = 'other-slot-tag';
        tag.style.cssText = 'font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; background: rgba(59, 130, 246, 0.2); color: #60a5fa; margin-left: 8px; font-weight: 600;';
        tag.textContent = otherSlotLabel || 'Stop';
        leftWrap.appendChild(tag);
      }

      card.appendChild(leftWrap);

      // Right: Square Checkbox
      const checkbox = document.createElement('div');
      checkbox.className = 'dest-card-checkbox';
      if (isSelected) {
        checkbox.classList.add('checked');
        checkbox.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      } else if (isOtherSlot) {
        checkbox.classList.add('checked-secondary');
        checkbox.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      }
      card.appendChild(checkbox);

      function handleSelect(e) {
        if (e) e.stopPropagation();
        if (!isDaySelected) {
          showToast('Please select a day on the timeline first to assign a destination');
          return;
        }

        // Keep day selection synchronized
        state.selectedPiece = { type: 'day', index: dayNum };
        state.selectedDayIndex = dayIdx;
        applySelectionFrame();

        if (!state.dayDestinations) state.dayDestinations = [];

        if (isMulti) {
          if (!state.selectedAttractions) state.selectedAttractions = {};
          const rawDest = state.dayDestinations[dayIdx];
          let targetSlot = activeSlot;
          if (targetSlot === null || typeof targetSlot !== 'number') {
            const emptyIdx = rawDest.findIndex(d => !d);
            targetSlot = (emptyIdx !== -1) ? emptyIdx : 0;
            state.selectedDestSlot = targetSlot;
          }
          const curSlotVal = rawDest[targetSlot];
          if (curSlotVal === destName) {
            // Uncheck / clear active slot
            rawDest[targetSlot] = null;
            showToast(`Day ${dayNum} Stop ${targetSlot + 1} cleared`);
          } else {
            rawDest[targetSlot] = destName;
            showToast(`Day ${dayNum} Stop ${targetSlot + 1} set to ${destName}`);
            // If there is another empty slot ahead, automatically switch focus to it!
            const nextEmpty = rawDest.findIndex((d, idx) => !d && idx > targetSlot);
            if (nextEmpty !== -1) {
              state.selectedDestSlot = nextEmpty;
            }
          }

          const validStops = rawDest.filter(d => d && typeof d === 'string' && d.trim() !== '');
          if (validStops.length === 0) {
            state.selectedAttractions[dayIdx] = [];
          } else {
            const existingCustom = (state.selectedAttractions[dayIdx] || []).filter(a => a.custom);
            state.selectedAttractions[dayIdx] = [...getDefaultAttractionsForDay(dayIdx), ...existingCustom];
          }
        } else {
          // Single-destination day
          if (!state.selectedAttractions) state.selectedAttractions = {};
          const alreadySelected = (state.dayDestinations[dayIdx] === destName);
          if (alreadySelected) {
            state.dayDestinations[dayIdx] = null;
            state.selectedDestIndex = -1;
            state.selectedDestName = '';
            state.selectedAttractions[dayIdx] = [];
            showToast(`Day ${dayNum} destination cleared`);
          } else {
            state.dayDestinations[dayIdx] = destName;
            state.selectedDestIndex = i;
            state.selectedDestName = destName;
            const existingCustom = (state.selectedAttractions[dayIdx] || []).filter(a => a.custom);
            state.selectedAttractions[dayIdx] = [...getDefaultAttractionsForDestination(destName), ...existingCustom];
            showToast(`Day ${dayNum} destination set to ${destName}`);
          }
        }

        saveCurrentItineraryToStorage();
        syncLiveItineraryToStorage();

        updateTimelineDayStatusBar();
        renderDestinationCards();
        renderHotelCards();
        renderActivityCards();

        // 3D Map sync: focus camera and update authentic road routes
        if (window.mapState) {
          if (window.mapState.focusOnDestinationById) {
            window.mapState.focusOnDestinationById(destName);
          }
          if (window.mapState.updateItineraryRoutes) {
            window.mapState.updateItineraryRoutes(state.dayDestinations.slice(0, state.days));
          } else if (window.mapState.updateRoute) {
            window.mapState.updateRoute(state.dayDestinations.slice(0, state.days));
          }
        }
      }

      checkbox.addEventListener('click', handleSelect);
      card.addEventListener('click', handleSelect);

      destCardsList.appendChild(card);
    });
  }

  /**
   * Focuses the 3D tactical camera on a selected destination and updates timeline
   */
  function triggerDestinationSelect(destName, index) {
    // If map is currently covered by detail views, switch back to map so user sees the 3D flight!
    if (state.activeMainView !== 'map') {
      switchMainView('map');
    }

    if (window.mapState && window.mapState.focusOnDestinationById) {
      window.mapState.focusOnDestinationById(destName);
    }

    if (typeof setSelectedPiece === 'function') {
      setSelectedPiece('day', (index % state.days) + 1);
    }
  }

  // Global helper for 3D map to select sidebar card when a 3D billboard marker is clicked
  window.selectDestinationByName = function (destName) {
    if (!destName) return;
    const idx = ALL_SRI_LANKA_DESTINATIONS.findIndex(d =>
      d.toLowerCase() === destName.toLowerCase() ||
      destName.toLowerCase().includes(d.toLowerCase()) ||
      d.toLowerCase().includes(destName.toLowerCase())
    );
    if (idx !== -1) {
      state.selectedDestIndex = idx;
      state.selectedDestName = ALL_SRI_LANKA_DESTINATIONS[idx];
      state.checkedDestinations = { [idx]: true };
      renderDestinationCards();

      // Scroll card into view
      const targetCard = destCardsList ? destCardsList.querySelector(`.dest-card-item[data-dest-index="${idx}"]`) : null;
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  /**
   * Safe HTML escaping helper
   */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  const MEAL_PLANS = ['HB', 'FB', 'BB', 'AI', 'RO'];
  const MEAL_PLAN_TITLES = {
    'RO': 'Room Only (No Meals)',
    'BB': 'Bed & Breakfast',
    'HB': 'Half Board (Breakfast & Dinner)',
    'FB': 'Full Board (All 3 Meals)',
    'AI': 'All Inclusive (Meals & Drinks)'
  };
  const POPULAR_ROOM_TYPES = [
    'Double Single',
    'Family Suite',
    'Deluxe Room',
    'Superior Ocean View',
    'Standard Room',
    'Twin Room'
  ];

  function setHotelMealPlan(hotelName, newMeal, card) {
    if (!state.hotelMealPlans) state.hotelMealPlans = {};
    state.hotelMealPlans[hotelName] = newMeal;

    const activeN = (state.selectedDayIndex !== undefined) ? (state.selectedDayIndex + 1) : 1;
    if (state.hotelBookings && state.hotelBookings[activeN] === hotelName) {
      if (!state.nightMealPlans) state.nightMealPlans = {};
      state.nightMealPlans[activeN] = newMeal;
    }

    saveCurrentItineraryToStorage();

    if (card) {
      const pills = card.querySelectorAll('.meal-toggle-pill');
      pills.forEach(p => {
        const isActive = (p.dataset.meal === newMeal);
        p.classList.toggle('active', isActive);
        if (isActive) {
          p.classList.remove('meal-pop');
          void p.offsetWidth;
          p.classList.add('meal-pop');
        }
      });
    }

    showToast(`Meal plan for ${hotelName}: ${MEAL_PLAN_TITLES[newMeal] || newMeal}`);
  }

  /**
   * Renders authentic Sri Lanka hotel recommendations with regional destination matching,
   * star tier filtering, verified Google ratings, phone dialer, and official booking website links.
   */
  function renderHotelCards() {
    if (!hotelsCardsList) return;
    hotelsCardsList.innerHTML = '';

    const hotelsData = window.SRI_LANKA_HOTELS || [];
    if (hotelsData.length === 0) {
      hotelsCardsList.innerHTML = '<div style="color: #94a3b8; font-size: 0.8rem; padding: 1.5rem 1rem; text-align: center;">Loading hotels database...</div>';
      return;
    }

    // Determine active Day, Night and assigned Destination
    let activeDay = null;
    let activeNight = 1;
    let activeDestName = '';

    if (state.selectedPiece && state.selectedPiece.type === 'night') {
      activeNight = state.selectedPiece.index;
      activeDay = activeNight; // Night N sleeps at Day N destination
    } else if (state.selectedPiece && state.selectedPiece.type === 'day') {
      activeDay = state.selectedPiece.index;
      activeNight = Math.min(state.nights, Math.max(1, state.selectedPiece.index));
    } else if (state.selectedDayIndex !== undefined && state.selectedDayIndex >= 0) {
      activeDay = state.selectedDayIndex + 1;
      activeNight = Math.min(state.nights, Math.max(1, activeDay));
    }

    // Multi-destination aware destination resolution (Image 2: Nuwara Eliya vs Kandy)
    if (activeDay && state.dayDestinations) {
      const dayIdx = activeDay - 1;
      const rawDest = state.dayDestinations[dayIdx];
      if (Array.isArray(rawDest)) {
        const isNightPiece = (state.selectedPiece && state.selectedPiece.type === 'night');
        let slot = 0;
        if (typeof state.selectedDestSlot === 'number' && state.selectedDestSlot >= 0 && state.selectedDestSlot < rawDest.length) {
          slot = state.selectedDestSlot;
        } else if (isNightPiece) {
          slot = Math.max(0, rawDest.length - 1);
        }
        activeDestName = rawDest[slot] || rawDest[1] || rawDest[0] || '';
      } else {
        activeDestName = rawDest || '';
      }
    }

    const term = (state.hotelSearchTerm || '').toLowerCase().trim();
    const isAutoMode = (state.hotelRegionMode === 'auto');

    // Wireframe logic: If region is not set for this day/night, and no search term:
    if (!activeDestName && isAutoMode && !term) {
      if (hotelCustomFilters) hotelCustomFilters.style.display = 'none';

      const noDestWrap = document.createElement('div');
      noDestWrap.className = 'no-destination-wrap';
      noDestWrap.innerHTML = `
        <button type="button" class="no-destination-box" id="btn-no-destination-selected" title="Click to select a destination in Destinations tab">
          No Destination Selected
        </button>
      `;

      const btn = noDestWrap.querySelector('#btn-no-destination-selected');
      if (btn) {
        btn.addEventListener('click', () => {
          switchSideTab('destinations');
          if (activeDay) {
            showToast(`Select a destination for Day ${activeDay}`);
          } else {
            showToast('Select a day on the timeline first');
          }
        });
      }

      hotelsCardsList.appendChild(noDestWrap);
      return;
    }

    if (hotelCustomFilters) hotelCustomFilters.style.display = 'flex';

    // Filter by Region if in auto mode and destination exists
    const isRegionalFilterActive = (isAutoMode && !!activeDestName);

    let filtered = hotelsData.slice();

    if (isRegionalFilterActive) {
      const destNorm = activeDestName.toLowerCase().trim();
      const destClean = destNorm.replace(/[\s\-_]/g, '');
      const regionalMatches = filtered.filter(h => {
        const hDestId = (h.destinationId || '').toLowerCase().trim();
        const hDestName = (h.destinationName || '').toLowerCase().trim();
        const hCleanId = hDestId.replace(/[\s\-_]/g, '');
        const hCleanName = hDestName.replace(/[\s\-_]/g, '');

        return hDestId === destNorm ||
               hCleanId === destClean ||
               hDestName === destNorm ||
               hCleanName === destClean ||
               hDestName.includes(destNorm) ||
               destNorm.includes(hDestName) ||
               hDestId.includes(destNorm) ||
               destNorm.includes(hDestId) ||
               (destNorm === 'dambulla' && (hDestId === 'sigiriya' || hDestId === 'dambulla')) ||
               (destNorm === 'sigiriya' && (hDestId === 'dambulla' || hDestId === 'sigiriya'));
      });

      if (regionalMatches.length > 0) {
        filtered = regionalMatches;
      }
    }

    // Update Destination Filter Row UI (Row 1 matching media_1790316139454.png)
    if (hotelDestHeading) {
      if (isRegionalFilterActive) {
        hotelDestHeading.textContent = `Hotels in ${activeDestName}`;
        const dayIdx = activeDay ? activeDay - 1 : 0;
        const isMulti = state.dayDestinations && Array.isArray(state.dayDestinations[dayIdx]) && state.dayDestinations[dayIdx].filter(Boolean).length > 1;
        hotelDestHeading.title = isMulti ? `Filtered to ${activeDestName} (Click to toggle destination)` : `Filtered to ${activeDestName}`;
      } else {
        hotelDestHeading.textContent = 'All Destinations';
        hotelDestHeading.title = 'Showing hotels across all of Sri Lanka';
      }
    }

    if (hotelDestShowallBtn) {
      hotelDestShowallBtn.textContent = isRegionalFilterActive ? 'Show all' : (activeDestName ? `Filter ${activeDestName}` : 'Show all');
      hotelDestShowallBtn.title = isRegionalFilterActive ? 'Show hotels across all of Sri Lanka' : `Filter to ${activeDestName || 'selected destination'}`;
    }

    // Update Star Filter Row UI (Row 2 matching media_1790316139454.png)
    if (hotelStarHeading) {
      const sf = state.hotelStarFilter;
      hotelStarHeading.textContent = (sf && sf !== 'all') ? `${sf} Star` : 'All Stars';
      hotelStarHeading.title = `Filter: ${hotelStarHeading.textContent}. Click to cycle (4 Star → 5 Star → 3 Star → All Stars)`;
    }

    if (hotelStarShowallBtn) {
      hotelStarShowallBtn.textContent = 'Show all';
      hotelStarShowallBtn.title = (state.hotelStarFilter === 'all') ? 'Showing all stars (Click to filter 4 Star)' : 'Show all star ratings';
    }

    // Filter by Star Tier (selected rating or above)
    if (state.hotelStarFilter && state.hotelStarFilter !== 'all') {
      const targetStar = parseInt(state.hotelStarFilter, 10);
      filtered = filtered.filter(h => h.starTier >= targetStar);
    }

    // Filter by Search Term
    if (term) {
      filtered = filtered.filter(h =>
        h.name.toLowerCase().includes(term) ||
        (h.destinationName && h.destinationName.toLowerCase().includes(term)) ||
        (h.distanceLandmark && h.distanceLandmark.toLowerCase().includes(term)) ||
        (h.amenities && h.amenities.some(a => a.toLowerCase().includes(term)))
      );
    }

    // Empty state
    if (filtered.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.style.cssText = 'color: #94a3b8; font-size: 0.78rem; padding: 1.5rem 1rem; text-align: center; background: #111827; border: 1px dashed #1f293d; border-radius: 4px; margin-top: 6px;';
      emptyEl.innerHTML = `
        <div style="display:flex; justify-content:center; margin-bottom: 6px;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><path d="M3 21h18M3 7v14M21 7v14M6 7V3h12v4M9 10h1M14 10h1M9 14h1M14 14h1M9 18h1M14 18h1"/></svg></div>
        <div style="color: #e2e8f0; font-weight: 600; margin-bottom: 4px;">No hotels match your filters</div>
        <div style="font-size: 0.72rem; color: #64748b; margin-bottom: 8px;">Try adjusting star tier or search terms</div>
        <button type="button" class="hotel-action-btn hotel-btn-web" style="display:inline-flex;" id="btn-reset-hotel-filters">Reset Filters</button>
      `;
      hotelsCardsList.appendChild(emptyEl);
      const resetBtn = emptyEl.querySelector('#btn-reset-hotel-filters');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          state.hotelStarFilter = 'all';
          state.hotelSearchTerm = '';
          state.hotelRegionMode = 'auto';
          state.hotelDisplayLimit = 35;
          if (hotelSearchInput) hotelSearchInput.value = '';
          renderHotelCards();
        });
      }
      return;
    }

    // Progressive rendering batch limit (default 35)
    const limit = state.hotelDisplayLimit || 35;
    const toRender = filtered.slice(0, limit);

    // Render hotel cards (Accordion — media_1789988199729.png)
    const houseSvg = '<svg class="hotel-room-house-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L4 9v12h16V9l-8-6zm6 16h-3v-6H9v6H6V10l6-4.5 6 4.5v9z"/></svg>';
    const checkSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    const phoneSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
    const globeSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>';

    // Build room presets from itinerary configuration
    function getPresetRooms() {
      if (state.rooms && state.rooms.length > 0) {
        const grouped = {};
        state.rooms.forEach(r => {
          const key = r.type || 'Standard Room';
          if (!grouped[key]) grouped[key] = { type: key, count: 0, capacity: r.capacity || 1 };
          grouped[key].count++;
        });
        return Object.values(grouped);
      }
      // Fallback defaults matching media_1789988199729.png
      return [
        { type: 'Deluxe Room', count: 2, capacity: 2 },
        { type: 'Double Room', count: 2, capacity: 2 },
        { type: 'Twin Room', count: 2, capacity: 2 }
      ];
    }

    const presetRooms = getPresetRooms();

    toRender.forEach((hotel) => {
      const isBookedForActiveNight = (state.hotelBookings && state.hotelBookings[activeNight] === hotel.name);
      const isExpanded = (state.expandedHotelName === hotel.name);

      const card = document.createElement('div');
      card.className = `hotel-card-item${isBookedForActiveNight ? ' selected' : ''}${isExpanded ? ' expanded' : ''}`;
      card.dataset.hotelId = hotel.id;
      card.dataset.hotelName = hotel.name;

      if (isExpanded) {
        // ── Expanded Card ──────────────────────
        const ratesForHotel = state.hotelRoomRates[hotel.name] || {};
        const hotelCounts = (state.hotelRoomCounts && state.hotelRoomCounts[hotel.name]) || {};
        const hotelTypes = (state.hotelRoomTypes && state.hotelRoomTypes[hotel.name]) || {};

        let roomRowsHtml = '';
        presetRooms.forEach((pr, rIdx) => {
          const roomType = hotelTypes[rIdx] || pr.type;
          const roomCount = hotelCounts[rIdx] !== undefined ? hotelCounts[rIdx] : pr.count;
          const savedAmount = ratesForHotel[roomType] || ratesForHotel[pr.type] || '';
          roomRowsHtml += `
            <div class="hotel-room-row">
              <div class="hotel-room-name-box" data-action="toggle-room-type" data-hotel="${escapeHtml(hotel.name)}" data-room-idx="${rIdx}" title="Click to toggle room category">
                ${houseSvg}
                <span class="hotel-room-name-text">${escapeHtml(roomType)}</span>
              </div>
              <span class="hotel-room-multiply">&times;</span>
              <div class="hotel-room-qty-box" data-action="toggle-room-qty" data-hotel="${escapeHtml(hotel.name)}" data-room-idx="${rIdx}" title="Click to toggle quantity (1, 2, 3, 4)">${roomCount}</div>
              <div class="hotel-room-amount-box">
                <input type="text" class="hotel-room-amount-input" data-hotel="${escapeHtml(hotel.name)}" data-room-type="${escapeHtml(roomType)}" placeholder="Amount" value="${escapeHtml(savedAmount)}">
              </div>
            </div>
          `;
        });

        if (!state.hotelMealPlans) state.hotelMealPlans = {};
        const currentMeal = state.hotelMealPlans[hotel.name]
          || (isBookedForActiveNight && state.nightMealPlans && state.nightMealPlans[activeNight])
          || 'HB';

        card.innerHTML = `
          <div class="hotel-card-header" data-action="toggle-expand">
            <span class="hotel-card-title" title="${escapeHtml(hotel.name)}">${escapeHtml(hotel.name)}</span>
            <div class="hotel-card-checkbox ${isBookedForActiveNight ? 'checked' : ''}" data-action="book" title="${isBookedForActiveNight ? 'Booked for Night ' + activeNight : 'Book for Night ' + activeNight}">
              ${isBookedForActiveNight ? checkSvg : ''}
            </div>
          </div>
          <div class="hotel-expanded-badges-row">
            <span class="hotel-rating-badge">⭐ ${hotel.googleRating.toFixed(1)}</span>
            <div class="hotel-meal-toggles-strip">
              <button type="button" class="meal-toggle-pill ${currentMeal === 'BB' ? 'active' : ''}" data-meal="BB" data-hotel="${escapeHtml(hotel.name)}" title="Bed & Breakfast (BB)">BB</button>
              <button type="button" class="meal-toggle-pill ${currentMeal === 'HB' ? 'active' : ''}" data-meal="HB" data-hotel="${escapeHtml(hotel.name)}" title="Half Board (HB)">HB</button>
              <button type="button" class="meal-toggle-pill ${currentMeal === 'FB' ? 'active' : ''}" data-meal="FB" data-hotel="${escapeHtml(hotel.name)}" title="Full Board (FB)">FB</button>
              <button type="button" class="meal-toggle-pill ${currentMeal === 'RO' ? 'active' : ''}" data-meal="RO" data-hotel="${escapeHtml(hotel.name)}" title="Room Only (RO)">RO</button>
              <button type="button" class="meal-toggle-pill ${currentMeal === 'AI' ? 'active' : ''}" data-meal="AI" data-hotel="${escapeHtml(hotel.name)}" title="All Inclusive (AI)">AI</button>
            </div>
          </div>
          <div class="hotel-expanded-rooms">
            ${roomRowsHtml}
          </div>
          <div class="hotel-expanded-actions">
            <a href="tel:${hotel.phone.replace(/[^0-9+]/g, '')}" class="hotel-btn-white-action" title="Call ${escapeHtml(hotel.name)}: ${hotel.phone}">
              ${phoneSvg} Call
            </a>
            <a href="${hotel.website}" target="_blank" rel="noopener noreferrer" class="hotel-btn-white-action" title="Visit website">
              ${globeSvg} Website
            </a>
          </div>
        `;

        // Event: Toggle expansion (click header)
        const header = card.querySelector('[data-action="toggle-expand"]');
        if (header) {
          header.addEventListener('click', (e) => {
            e.stopPropagation();
            state.expandedHotelName = null;
            renderHotelCards();
          });
        }

        // Event: Meal plan toggle pills click -> set specific meal plan directly
        card.querySelectorAll('.meal-toggle-pill').forEach(pill => {
          pill.addEventListener('click', (e) => {
            e.stopPropagation();
            const chosenMeal = pill.dataset.meal;
            setHotelMealPlan(hotel.name, chosenMeal, card);
          });
        });

        // Event: Toggle room quantity on qty-box click
        card.querySelectorAll('.hotel-room-qty-box').forEach(qtyBox => {
          qtyBox.addEventListener('click', (e) => {
            e.stopPropagation();
            const hn = qtyBox.dataset.hotel;
            const rIdx = qtyBox.dataset.roomIdx;
            if (!state.hotelRoomCounts) state.hotelRoomCounts = {};
            if (!state.hotelRoomCounts[hn]) state.hotelRoomCounts[hn] = {};
            const curVal = parseInt(qtyBox.textContent.trim(), 10) || 1;
            const nextVal = (curVal % 4) + 1; // 1 -> 2 -> 3 -> 4 -> 1
            state.hotelRoomCounts[hn][rIdx] = nextVal;
            qtyBox.textContent = nextVal;
            qtyBox.classList.remove('meal-pop');
            void qtyBox.offsetWidth;
            qtyBox.classList.add('meal-pop');
            saveCurrentItineraryToStorage();
            showToast(`Updated room quantity: ${nextVal}`);
          });
        });

        // Event: Toggle room category on name-box click
        card.querySelectorAll('.hotel-room-name-box').forEach(nameBox => {
          nameBox.addEventListener('click', (e) => {
            e.stopPropagation();
            const hn = nameBox.dataset.hotel;
            const rIdx = nameBox.dataset.roomIdx;
            const textSpan = nameBox.querySelector('.hotel-room-name-text');
            const curName = textSpan ? textSpan.textContent.trim() : 'Double Single';
            const curIdx = POPULAR_ROOM_TYPES.indexOf(curName);
            const nextName = POPULAR_ROOM_TYPES[(curIdx + 1) % POPULAR_ROOM_TYPES.length];
            if (!state.hotelRoomTypes) state.hotelRoomTypes = {};
            if (!state.hotelRoomTypes[hn]) state.hotelRoomTypes[hn] = {};
            state.hotelRoomTypes[hn][rIdx] = nextName;
            if (textSpan) {
              textSpan.textContent = nextName;
              textSpan.classList.remove('meal-pop');
              void textSpan.offsetWidth;
              textSpan.classList.add('meal-pop');
            }
            saveCurrentItineraryToStorage();
            showToast(`Room category: ${nextName}`);
          });
        });

        // Event: Book checkbox
        const checkbox = card.querySelector('[data-action="book"]');
        if (checkbox) {
          checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
            state.selectedHotelName = hotel.name;
            assignHotelToActiveNight(hotel.name);
          });
        }

        // Event: Amount inputs — save on input
        card.querySelectorAll('.hotel-room-amount-input').forEach(inp => {
          inp.addEventListener('click', (e) => e.stopPropagation());
          inp.addEventListener('input', (e) => {
            const hn = inp.dataset.hotel;
            const rt = inp.dataset.roomType;
            if (!state.hotelRoomRates[hn]) state.hotelRoomRates[hn] = {};
            state.hotelRoomRates[hn][rt] = inp.value;
          });
        });

        // Prevent card click from collapsing
        card.querySelectorAll('a').forEach(a => a.addEventListener('click', (e) => e.stopPropagation()));

      } else {
        // ── Collapsed Card ──────────────────────
        card.innerHTML = `
          <div class="hotel-card-header">
            <span class="hotel-card-title" title="${escapeHtml(hotel.name)}">${escapeHtml(hotel.name)}</span>
            <div class="hotel-card-checkbox ${isBookedForActiveNight ? 'checked' : ''}" data-action="book" title="${isBookedForActiveNight ? 'Booked for Night ' + activeNight : 'Book for Night ' + activeNight}">
              ${isBookedForActiveNight ? checkSvg : ''}
            </div>
          </div>
        `;

        // Event: Expand on card click
        card.addEventListener('click', (e) => {
          if (e.target.closest('[data-action="book"]')) return;
          e.stopPropagation();
          state.expandedHotelName = hotel.name;
          renderHotelCards();
          // Scroll expanded card into view after render
          setTimeout(() => {
            const expandedEl = hotelsCardsList.querySelector('.hotel-card-item.expanded');
            if (expandedEl) expandedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 50);
        });

        // Event: Book checkbox
        const checkbox = card.querySelector('[data-action="book"]');
        if (checkbox) {
          checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
            state.selectedHotelName = hotel.name;
            assignHotelToActiveNight(hotel.name);
          });
        }
      }

      hotelsCardsList.appendChild(card);
    });

    // Load More button if more accommodations exist in this filter
    if (filtered.length > toRender.length) {
      const loadMoreWrap = document.createElement('div');
      loadMoreWrap.className = 'hotel-load-more-wrap';
      loadMoreWrap.innerHTML = `
        <button type="button" class="hotel-load-more-btn">
          Load More Hotels &amp; Resorts (${toRender.length} of ${filtered.length.toLocaleString()})
        </button>
      `;
      const loadMoreBtn = loadMoreWrap.querySelector('.hotel-load-more-btn');
      if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
          state.hotelDisplayLimit = (state.hotelDisplayLimit || 35) + 35;
          renderHotelCards();
        });
      }
      hotelsCardsList.appendChild(loadMoreWrap);
    }
  }

  /**
   * Assigns a selected hotel to the active night on the timeline
   */
  function assignHotelToActiveNight(hotelName) {
    let targetNight = 1;
    if (state.selectedPiece && state.selectedPiece.type === 'night') {
      targetNight = state.selectedPiece.index;
    } else if (state.selectedPiece && state.selectedPiece.type === 'day') {
      targetNight = Math.min(state.nights, Math.max(1, state.selectedPiece.index));
    } else if (state.selectedDayIndex !== undefined) {
      targetNight = Math.min(state.nights, Math.max(1, state.selectedDayIndex + 1));
    }

    if (!state.hotelBookings) state.hotelBookings = {};
    const stay = (typeof getStayForNight === 'function') ? getStayForNight(targetNight) : null;
    if (stay && stay.nights && stay.nights.length > 1) {
      stay.nights.forEach(n => {
        state.hotelBookings[n] = hotelName;
      });
      state.selectedHotelName = hotelName;
      renderHotelsTrack();
      renderHotelCards();
      showToast(`Nights ${stay.startNight}–${stay.endNight} (${stay.nights.length} Nights): ${hotelName} Booked`);
    } else {
      state.hotelBookings[targetNight] = hotelName;
      state.selectedHotelName = hotelName;
      renderHotelsTrack();
      renderHotelCards();
      showToast(`Night ${targetNight}: ${hotelName} Booked`);
    }
  }

  /* ==========================================================================
     Attractions Explorer Module: Day-by-Day Accordion & Attraction Cards
     Matching User Wireframe Images 1, 2, and 3
     ========================================================================== */

  const DESTINATION_ATTRACTIONS_CATALOG = {
    'Sigiriya': [
      {
        title: 'Climb Sigiriya Rock Fortress',
        desc: 'A UNESCO World Heritage Site, has five cave temples with ancient murals, 150+ Buddha statues, and the iconic.'
      },
      {
        title: 'Hike Pidurangala Rock',
        desc: 'Famous adjacent monolithic rock offering premier 360-degree panoramic sunrise vistas directly facing the Sigiriya Lion Rock citadel and lush jungle canopy.'
      },
      {
        title: 'Minneriya Wild Elephant Gathering Safari',
        desc: 'Witness hundreds of wild Asian elephants in their natural habitat congregating around the receding shores of the ancient Minneriya reservoir.'
      },
      {
        title: 'Dambulla Golden Cave Temple',
        desc: 'UNESCO World Heritage complex featuring 5 ancient cliffside sanctuaries with over 2,000 sq meters of Buddhist murals and 150+ Buddha statues.'
      },
      {
        title: 'Hiriwadunna Village Cultural Tour & Catamaran Ride',
        desc: 'Experience rural Sri Lankan village life with a traditional bullock cart ride, catamaran lake glide, and authentic home-cooked cuisine.'
      }
    ],
    'Anuradhapura': [
      {
        title: 'Sacred Jaya Sri Maha Bodhi & Ruwanwelisaya Stupa',
        desc: 'Revered UNESCO ancient pilgrimage site home to the world’s oldest historically documented tree and the monumental white Ruwanwelisaya stupa.'
      },
      {
        title: 'Jetavanaramaya & Abhayagiri Monastic Ruins',
        desc: 'Explore colossal brick stupas that once ranked among antiquity’s tallest structures, ancient monastic complexes, twin ponds, and intricate moonstones.'
      },
      {
        title: 'Isurumuniya Rock Temple & Lovers Sculpture',
        desc: '5th-century rock sanctuary famous for the exquisite Gupta-style rock carving of the Isurumuniya Lovers and royal elephant bathing pools.'
      },
      {
        title: 'Mihintale Sacred Cradle of Buddhism',
        desc: 'Sacred mountain peak reached via 1,840 granite steps where Buddhism was first introduced to Sri Lanka in 247 BC, offering breathtaking vistas.'
      }
    ],
    'Polonnaruwa': [
      {
        title: 'Colossal Gal Vihara Buddha Sculptures',
        desc: 'Four masterfully preserved granite sculptures depicting seated, standing, and reclining Buddha figures considered the pinnacle of medieval rock art.'
      },
      {
        title: 'Royal Palace of King Parakramabahu I',
        desc: 'Ruins of the magnificent 7-storey medieval palace complex, audience halls, and the Council Chamber in the UNESCO World Heritage royal enclosure.'
      },
      {
        title: 'Parakrama Samudra Ancient Reservoir Cycling Trail',
        desc: 'Picturesque bicycle tour along the embankment of the colossal 12th-century inland sea supporting diverse wildlife and lush agricultural lands.'
      },
      {
        title: 'Sacred Quadrangle (Dalada Maluwa) & Vatadage',
        desc: 'Circular relic house adorned with four Buddha statues, intricate stone lattice screens, and celestial guardstones.'
      }
    ],
    'Dambulla': [
      {
        title: 'Golden Cave Temple of Dambulla',
        desc: 'UNESCO World Heritage complex featuring 5 cliffside cave sanctuaries containing over 2,000 sq meters of Buddhist murals and 150+ Buddha statues.'
      },
      {
        title: 'Popham’s Arboretum Conserved Forest Walk',
        desc: 'Scenic guided nature trail through conserved dry-zone forest, home to indigenous flora, slender lorises, and diverse bird species.'
      }
    ],
    'Kandy': [
      {
        title: 'Temple of the Sacred Tooth Relic (Sri Dalada Maligawa)',
        desc: 'Sri Lanka’s most venerated Buddhist shrine housing the sacred tooth relic of the Buddha within the historic royal palace complex along Kandy Lake.'
      },
      {
        title: 'Peradeniya Royal Botanical Gardens',
        desc: 'Vast 147-acre botanical paradise home to over 4,000 species of flora, a world-renowned Orchid House, and towering giant Java fig trees.'
      },
      {
        title: 'Kandy Cultural Dance & Fire Walking Show',
        desc: 'Dynamic performance showcasing traditional Kandyan drumming, peacock dances, acrobatic leaps, and barefoot walking across glowing embers.'
      },
      {
        title: 'Bahirawakanda Giant Buddha Hilltop Viewpoint',
        desc: 'Towering 88-foot white Buddha statue perched above the city offering sweeping panoramic vistas of Kandy town and mist-shrouded hills.'
      },
      {
        title: 'Traditional Ceylon Spice & Herbal Garden',
        desc: 'Guided tour through aromatic cinnamon, cardamom, vanilla, and cocoa groves explaining ancient Ayurvedic medicine and healing secrets.'
      }
    ],
    'Nuwara Eliya': [
      {
        title: 'Ceylon Tea Plantation & Historic Factory Experience',
        desc: 'Guided walk through emerald tea terraces and a colonial-era working factory observing orthodox tea crafting, followed by a tea tasting.'
      },
      {
        title: 'Gregory Lake Waterfront & Scenic Boat Cruise',
        desc: 'Picturesque highland lake nestled in misty hills offering speedboats, swan pedal boats, horse riding, and lakeside promenades.'
      },
      {
        title: 'Victoria Park & Alpine English Gardens',
        desc: 'Charming Victorian park with manicured lawns, rare Himalayan and European migratory birds, and seasonal floral displays.'
      },
      {
        title: 'Hakgala Botanical Gardens & Ashok Vatika',
        desc: 'Sub-tropical highland botanical gardens nestled beneath the towering Hakgala rock cliff, steeped in the Ramayana epic.'
      }
    ],
    'Ella': [
      {
        title: 'Nine Arch Bridge (Bridge in the Sky)',
        desc: 'Colonial-era railway viaduct constructed entirely from brick and cement without steel, set amidst misty green jungle and tea valleys.'
      },
      {
        title: 'Little Adam’s Peak Scenic Ridge Hike',
        desc: 'Gentle 1.5-hour round-trip trek through rolling tea estates opening into dramatic 360-degree views of Ella Rock and southern plains.'
      },
      {
        title: 'Ravana Falls & Mythological Caves',
        desc: 'Dramatic 25-meter cascading waterfall along the main road, linked to King Ravana of the ancient Ramayana legend.'
      },
      {
        title: 'Flying Ravana Mega Zipline & Adventure Park',
        desc: 'South Asia’s premier double zip-line gliding over lush tea valleys at speeds up to 80 km/h.'
      }
    ],
    'Yala': [
      {
        title: 'Yala National Park 4x4 Leopard Safari',
        desc: 'Thrilling game drive through Block 1, boasting one of the world’s highest leopard densities, alongside Asian elephants, sloth bears, and crocodiles.'
      },
      {
        title: 'Coastal Lagoons & Birding Safari',
        desc: 'Scenic wetland drive spotting painted storks, sea eagles, flamingoes, and spoonbills around coastal salt pans and lagoons.'
      },
      {
        title: 'Sithulpawwa Rock Temple Monastic Hermitage',
        desc: 'Ancient 2nd-century BC Buddhist monastery perched atop a rocky outcrop deep inside Yala forest with panoramic wilderness views.'
      }
    ],
    'Udawalawe': [
      {
        title: 'Elephant Transit Home (ETH) Milk Feeding',
        desc: 'Heartwarming ethical conservation center where orphaned baby elephants are nursed and fed before rehabilitation into the wild.'
      },
      {
        title: 'Udawalawe Open-Top 4x4 Grassland Safari',
        desc: 'Savannah-like landscape surrounding the reservoir providing guaranteed close-up encounters with wild elephant herds.'
      }
    ],
    'Mirissa': [
      {
        title: 'Blue Whale & Spinner Dolphin Ocean Expedition',
        desc: 'Morning catamaran cruise to the continental shelf where the world’s largest mammal, the blue whale, frequents southern waters.'
      },
      {
        title: 'Coconut Tree Hill Sunset Photography',
        desc: 'Iconic ocean promontory with a cluster of swaying coconut palms jutting into turquoise surf, the most photographed spot on the south coast.'
      },
      {
        title: 'Mirissa Bay Surfing & Snorkeling with Sea Turtles',
        desc: 'Crescent beach with reef breaks for beginner and intermediate surfers and calm shallows inhabited by wild green sea turtles.'
      }
    ],
    'Galle': [
      {
        title: 'Galle Dutch Fort Heritage Walking Tour',
        desc: 'UNESCO World Heritage 17th-century fortified city with cobblestone alleyways, Dutch Reformed churches, ramparts, and the iconic white lighthouse.'
      },
      {
        title: 'Sunset Bastion Walk on the Indian Ocean',
        desc: 'Atmospheric evening stroll along the granite ramparts as waves crash against Flag Rock with cliff divers and ocean views.'
      },
      {
        title: 'Historical Maritime & Galle National Museum',
        desc: 'Insightful colonial collections, shipwrecks, maps, and artifacts tracing 400 years of Arab, Portuguese, Dutch, and British seafaring trade.'
      }
    ],
    'Bentota': [
      {
        title: 'Madu Ganga River Mangrove & Cinnamon Island Safari',
        desc: 'Boat safari gliding through labyrinthine mangrove tunnels, visiting cinnamon peelers on tiny river islets, and natural fish spa therapy.'
      },
      {
        title: 'Kosgoda Sea Turtle Conservation Project',
        desc: 'Community-run hatchery dedicated to protecting vulnerable sea turtle nests, allowing visitors to see newborn hatchlings and rescued adults.'
      },
      {
        title: 'Bentota Golden Beach & Water Sports Arena',
        desc: 'Broad golden sand beach and tranquil river lagoon offering jet skiing, banana boating, windsurfing, and wakeboarding.'
      }
    ],
    'Colombo': [
      {
        title: 'Gangaramaya Buddhist Temple & Beira Lake Seema Malaka',
        desc: 'Eclectic temple complex featuring sacred relics, vintage artifact museums, and a tranquil meditation hall floating on Beira Lake.'
      },
      {
        title: 'Independence Memorial Hall & Cinnamon Gardens',
        desc: 'Grand colonial-revival monument celebrating national independence, surrounded by leafy walking tracks and national museums.'
      },
      {
        title: 'Colombo Port City Marina Promenade & Sunset Walk',
        desc: 'Modern offshore metropolis waterfront with landscaped ocean walkways, artificial beach lagoons, and luxury dining precincts.'
      },
      {
        title: 'Galle Face Green Sunset & Street Food Stroll',
        desc: 'Iconic coastal oceanfront promenade buzzing with kite-flyers, sea breezes, and mouth-watering local street snacks like isso wade.'
      }
    ],
    'Negombo': [
      {
        title: 'Dutch Canal & Muthurajawela Marsh Catamaran Safari',
        desc: 'Historic 17th-century waterways and biodiverse coastal marshland home to monitor lizards, kingfishers, and mangrove crabs.'
      },
      {
        title: 'Lellama Coastal Fish Market Experience',
        desc: 'Bustling morning beachside auction where catamaran fishermen land their fresh ocean catches and sun-dry silver sprats on golden sands.'
      }
    ],
    'Trincomalee': [
      {
        title: 'Koneswaram Temple & Swami Rock Lovers Leap',
        desc: 'Majestic classical Hindu temple perched high atop a precipitous cliff dropping into the Indian Ocean, rich in history and divine views.'
      },
      {
        title: 'Pigeon Island National Marine Park Snorkeling',
        desc: 'Pristine white sand coral reef island with crystal-clear waters populated by blacktip reef sharks, sea turtles, and colorful marine life.'
      }
    ],
    'Jaffna': [
      {
        title: 'Nallur Kandaswamy Kovil Sacred Ceremony',
        desc: 'Towering golden gopuram and monumental Dravidian Hindu temple reverberating with sacred chanting and traditional music.'
      },
      {
        title: 'Jaffna Dutch Fort & Coastal Lagoon Ramparts',
        desc: 'Vast star-shaped coral-brick fortress overlooking Jaffna lagoon, built by the Portuguese and expanded by the Dutch in 1680.'
      }
    ],
    'Wilpattu': [
      {
        title: 'Wilpattu Natural Sand-Rimmed Willu Safari',
        desc: 'Sri Lanka’s largest national park characterised by dense dry-zone forest and glistening natural lakes (willus) frequented by leopards and sloth bears.'
      }
    ],
    'Sinharaja': [
      {
        title: 'Sinharaja UNESCO Virgin Rainforest Trek',
        desc: 'Primary tropical rainforest sheltering over 50% of Sri Lanka’s endemic wildlife, giant tree ferns, cascading waterfalls, and mixed-species bird flocks.'
      }
    ],
    'Horton Plains': [
      {
        title: 'World’s End 880m Sheer Cliff Precipice Trail',
        desc: 'Scenic 9.5 km loop across windswept montane plateau culminating at a dramatic cliff edge plunging 880 meters down to southern tea estates.'
      },
      {
        title: 'Baker’s Falls & Highland Cloud Forest Trek',
        desc: 'Picturesque 20-meter waterfall rushing over volcanic rock within dwarf rhododendron forests inhabited by endemic purple-faced langurs.'
      }
    ],
    'Adams Peak': [
      {
        title: 'Sacred Sri Pada Midnight Summit Pilgrimage',
        desc: 'Nocturnal ascent via thousands of illuminated steps to witness the sunrise shadow of the sacred summit peak revered by all four world faiths.'
      }
    ],
    'Tangalle': [
      {
        title: 'Rekawa Beach Night Sea Turtle Nesting Watch',
        desc: 'Nighttime eco-patrol observing giant green turtles and leatherbacks laying eggs on wild, undeveloped southern beaches.'
      },
      {
        title: 'Hummanaya Natural Marine Blowhole',
        desc: 'The second largest natural blowhole in the world, shooting ocean spray up to 25 meters into the sky through a subterranean rock fissure.'
      }
    ],
    'Weligama': [
      {
        title: 'Traditional Stilt Fishermen Cultural Observation',
        desc: 'Famous centuries-old angling practice on wooden stilts embedded into shallow coastal reefs along the south coast.'
      },
      {
        title: 'Beginner Surf Lesson in Sandy Surf Bay',
        desc: 'Protected bay with gentle, rolling waves ideal for beginners and longboard enthusiasts learning with licensed instructors.'
      }
    ],
    'Unawatuna': [
      {
        title: 'Jungle Beach Coral Reef Snorkeling',
        desc: 'Secluded forest bay with turquoise waters for snorkeling and swimming among vibrant tropical reef fish.'
      },
      {
        title: 'Japanese Peace Pagoda Ocean Vista',
        desc: 'Hilltop Buddhist stupa offering panoramic sunset views across Galle bay and the Indian Ocean.'
      }
    ],
    'Kitulgala': [
      {
        title: 'Kelani River White Water Rafting (Grade 3/4)',
        desc: 'Exciting adrenaline adventure navigating Grade 3 and 4 rapids through picturesque rainforest where The Bridge on the River Kwai was filmed.'
      }
    ],
    'Airport (BIA)': [
      {
        title: 'Bandaranaike International Airport Welcome & VIP Chauffeur Transfer',
        desc: 'Personalized meet-and-greet in the arrivals hall with flower garlands and seamless expressway transfer to your premier resort.'
      }
    ]
  };

  function getAttractionsForDestination(destName) {
    if (DESTINATION_ATTRACTIONS_CATALOG[destName]) {
      return DESTINATION_ATTRACTIONS_CATALOG[destName];
    }
    const lower = (destName || '').toLowerCase().trim();
    for (const k of Object.keys(DESTINATION_ATTRACTIONS_CATALOG)) {
      if (k.toLowerCase() === lower || lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower)) {
        return DESTINATION_ATTRACTIONS_CATALOG[k];
      }
    }
    return [
      {
        title: `${destName} Cultural Sightseeing & Heritage Exploration`,
        desc: `Guided excursion discovering authentic historical monuments, local culture, and scenic landscapes of ${destName}.`
      },
      {
        title: `${destName} Nature Walk & Photography`,
        desc: `Scenic highlights, vibrant flora, and breathtaking viewpoints in and around ${destName}.`
      }
    ];
  }

  function getSelectedAttractionsForDay(dayIndex) {
    if (!state.selectedAttractions) state.selectedAttractions = {};
    const dests = (typeof getDayDestinations === 'function') ? getDayDestinations(dayIndex) : (state.dayDestinations ? [state.dayDestinations[dayIndex]] : []);
    const hasDest = dests.length > 0 && dests.some(d => d && typeof d === 'string' && d.trim() !== '');

    if (!hasDest) {
      state.selectedAttractions[dayIndex] = [];
      return state.selectedAttractions[dayIndex];
    }

    if (!state.selectedAttractions[dayIndex] || state.selectedAttractions[dayIndex].length === 0) {
      state.selectedAttractions[dayIndex] = getDefaultAttractionsForDay(dayIndex);
    }
    return state.selectedAttractions[dayIndex];
  }

  function isAttractionSelected(dayIndex, title) {
    const list = getSelectedAttractionsForDay(dayIndex);
    return list.some(item => (item.title === title || isDuplicateAttraction(item.title, title)) && item.checked !== false);
  }

  function updateAttractionsSummaryCount() {
    if (!attractSummaryText) return;
    let totalSelected = 0;
    for (let d = 0; d < state.days; d++) {
      const sel = getSelectedAttractionsForDay(d);
      totalSelected += sel.filter(a => a.checked !== false).length;
    }
    attractSummaryText.textContent = `${totalSelected} Attraction${totalSelected === 1 ? '' : 's'} Selected`;
    attractSummaryText.classList.remove('badge-pop');
    void attractSummaryText.offsetWidth; // Force reflow to retrigger animation
    attractSummaryText.classList.add('badge-pop');
  }

  function updateDayAttractionsBadge(card, dayIndex) {
    if (!card) return;
    const badge = card.querySelector('.attract-day-count-badge');
    const sel = getSelectedAttractionsForDay(dayIndex);
    const count = sel.filter(a => a.checked !== false).length;
    if (badge) {
      if (count > 0) {
        badge.textContent = `${count} selected`;
        badge.style.display = '';
        badge.classList.remove('badge-pop');
        void badge.offsetWidth;
        badge.classList.add('badge-pop');
      } else {
        badge.style.display = 'none';
      }
    }
  }

  function updateExpandAllBtnText() {
    if (!attractExpandAllBtn) return;
    const anyCollapsed = Array.from({ length: state.days }).some((_, i) => !state.expandedAttractionDays || !state.expandedAttractionDays[i]);
    attractExpandAllBtn.textContent = anyCollapsed ? 'Expand All' : 'Collapse All';
  }

  function toggleAttractionForDay(dayIndex, attractObj, reRender = true) {
    const list = getSelectedAttractionsForDay(dayIndex);
    const existing = list.find(item => item.title === attractObj.title || isDuplicateAttraction(item.title, attractObj.title));
    if (existing) {
      if (attractObj.checked !== undefined) {
        existing.checked = attractObj.checked;
      } else {
        existing.checked = !existing.checked;
      }
      showToast(`${existing.checked ? 'Added to' : 'Removed from'} Day ${dayIndex + 1}: "${attractObj.title}"`);
    } else {
      list.push({
        title: attractObj.title,
        desc: attractObj.desc || '',
        checked: (attractObj.checked !== undefined) ? attractObj.checked : true,
        custom: !!attractObj.custom,
        html: attractObj.html
      });
      showToast(`Added to Day ${dayIndex + 1}: "${attractObj.title}"`);
    }
    saveCurrentItineraryToStorage();
    syncLiveItineraryToStorage();
    if (reRender) {
      renderActivityCards();
    }
    if (state.activeMainView === 'itinerary' && typeof renderItineraryDetailsView === 'function') {
      renderItineraryDetailsView();
    }
  }

  function addCustomAttractionToDay(dayIndex, title, desc, card) {
    if (!title || !title.trim()) return;
    const list = getSelectedAttractionsForDay(dayIndex);
    const cleanTitle = title.trim();
    const cleanDesc = desc ? desc.trim() : '';
    const newAttract = {
      title: cleanTitle,
      desc: cleanDesc,
      checked: true,
      custom: true
    };
    if (!list.some(item => item.title.toLowerCase() === cleanTitle.toLowerCase())) {
      list.push(newAttract);
    }
    saveCurrentItineraryToStorage();
    syncLiveItineraryToStorage();
    showToast(`Added custom activity to Day ${dayIndex + 1}: "${cleanTitle}"`);

    if (card) {
      const itemsList = card.querySelector('.attract-items-list');
      if (itemsList) {
        const newEl = createAttractionItemElement(dayIndex, newAttract, card);
        newEl.style.animation = 'cardFadeSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        itemsList.appendChild(newEl);
      }
      updateDayAttractionsBadge(card, dayIndex);
      updateAttractionsSummaryCount();
    } else {
      renderActivityCards();
    }

    if (state.activeMainView === 'itinerary' && typeof renderItineraryDetailsView === 'function') {
      renderItineraryDetailsView();
    }
  }

  function formatAttractionDesc(desc) {
    if (!desc) return '';
    return escapeHtml(desc)
      .replace(/UNESCO World Heritage Site/gi, '<span class="highlight-blue">$&</span>')
      .replace(/UNESCO World/gi, '<span class="highlight-blue">$&</span>')
      .replace(/UNESCO/gi, '<span class="highlight-blue">$&</span>');
  }

  /**
   * Creates an individual attraction item DOM element with smooth drawer transitions and spring checkbox
   */
  function createAttractionItemElement(dayIndex, attract, card) {
    const itemKey = `${dayIndex}-${attract.title}`;
    const isDescOpen = !!(state.expandedAttractionItems && state.expandedAttractionItems[itemKey]);
    const isChecked = !!attract.checked;

    const itemEl = document.createElement('div');
    itemEl.className = `attract-item ${isChecked ? 'checked' : ''} ${isDescOpen ? 'expanded' : ''}`;
    itemEl.dataset.title = attract.title;

    itemEl.innerHTML = `
      <div class="attract-item-top">
        <span class="attract-item-title">${escapeHtml(attract.title)}</span>
        <div class="attract-item-checkbox ${isChecked ? 'checked' : ''}" title="${isChecked ? 'Remove from itinerary' : 'Add to itinerary'}">
          ${isChecked ? `
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ` : ''}
        </div>
      </div>
      <div class="attract-item-desc">
        ${formatAttractionDesc(attract.desc)}
      </div>
    `;

    // Checkbox click: toggle selection in itinerary with spring bounce animation
    const chkBox = itemEl.querySelector('.attract-item-checkbox');
    chkBox.addEventListener('click', (e) => {
      e.stopPropagation();
      const willBeChecked = !chkBox.classList.contains('checked');
      chkBox.classList.toggle('checked', willBeChecked);
      itemEl.classList.toggle('checked', willBeChecked);
      chkBox.setAttribute('title', willBeChecked ? 'Remove from itinerary' : 'Add to itinerary');
      attract.checked = willBeChecked;

      if (willBeChecked) {
        chkBox.innerHTML = `
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        `;
      } else {
        chkBox.innerHTML = '';
      }

      toggleAttractionForDay(dayIndex, attract, false);
      updateDayAttractionsBadge(card, dayIndex);
      updateAttractionsSummaryCount();
    });

    // Item body click: toggle description with smooth roll-down drawer
    itemEl.addEventListener('click', (e) => {
      if (e.target.closest('.attract-item-checkbox')) return;
      const isNowOpen = itemEl.classList.contains('expanded');
      itemEl.classList.toggle('expanded', !isNowOpen);
      if (!state.expandedAttractionItems) state.expandedAttractionItems = {};
      state.expandedAttractionItems[itemKey] = !isNowOpen;
    });

    return itemEl;
  }

  /**
   * Renders the Day-by-Day Attractions Accordion matching wireframe Image 1, 2, and 3
   */
  function renderActivityCards() {
    if (!activitiesCardsList) return;
    activitiesCardsList.innerHTML = '';

    // Initialize default expanded state (Day 1 open) if first visit
    if (!state.expandedAttractionDays) {
      state.expandedAttractionDays = { 0: true };
    }

    // Update total selected count in summary bar
    updateAttractionsSummaryCount();

    const q = (state.attractSearchTerm || '').trim().toLowerCase();

    for (let i = 0; i < state.days; i++) {
      const dayDests = getDayDestinations(i);
      const hasDest = dayDests.length > 0 && dayDests.some(d => d && typeof d === 'string' && d.trim() !== '');
      const destName = hasDest ? (getDayFinalDestination(i) || dayDests[0]) : '';
      const dayCatalog = hasDest ? getAttractionsForDestination(destName) : [];
      const selectedList = getSelectedAttractionsForDay(i);

      // Merge catalog and custom attractions
      const itemsMap = new Map();

      // 1. Put the selected/default attractions first (checked)
      selectedList.forEach(s => {
        itemsMap.set(s.title.toLowerCase(), {
          title: s.title,
          desc: s.desc || '',
          checked: s.checked !== false,
          custom: !!s.custom,
          html: s.html
        });
      });

      // 2. Add other catalog attractions if not duplicate of already added ones (unchecked)
      if (hasDest) {
        dayCatalog.forEach(a => {
          const key = a.title.toLowerCase();
          const isDup = Array.from(itemsMap.values()).some(existing => isDuplicateAttraction(existing.title, a.title));
          if (!isDup && !itemsMap.has(key)) {
            itemsMap.set(key, {
              title: a.title,
              desc: a.desc || '',
              checked: false,
              custom: false
            });
          }
        });
      }

      let items = Array.from(itemsMap.values());

      // If user typed a search query, filter
      if (q) {
        items = items.filter(item => 
          item.title.toLowerCase().includes(q) || 
          item.desc.toLowerCase().includes(q) ||
          destName.toLowerCase().includes(q)
        );
        if (items.length > 0) {
          state.expandedAttractionDays[i] = true;
        }
      }

      const isExpanded = !!state.expandedAttractionDays[i];
      const checkedCount = items.filter(item => item.checked).length;

      // Unified Accordion Day Card (Smoothly transitions between Collapsed and Expanded)
      const card = document.createElement('div');
      card.className = `attract-day-card ${isExpanded ? 'expanded' : 'collapsed'}`;
      card.dataset.dayIndex = i;
      card.style.setProperty('--item-idx', i);

      // 1. Accordion Header: [Day i+1] + [Destination]
      const header = document.createElement('div');
      header.className = 'attract-day-header';
      header.innerHTML = `
        <div class="attract-day-header-left">
          <span class="attract-day-pill">Day ${i + 1}</span>
          ${hasDest ? `<span class="attract-dest-pill attract-dest-pill-expanded">${escapeHtml(destName)}</span>` : `<span class="attract-dest-pill attract-dest-pill-expanded" style="background: rgba(255,255,255,0.06); color: #94a3b8; font-style: italic;">No destination set</span>`}
        </div>
        <div class="attract-day-header-right">
          <span class="attract-day-count-badge" style="${checkedCount > 0 ? '' : 'display: none;'}">${checkedCount} selected</span>
          ${hasDest ? `<span class="attract-dest-pill attract-dest-pill-collapsed">${escapeHtml(destName)}</span>` : `<span class="attract-dest-pill attract-dest-pill-collapsed" style="background: rgba(255,255,255,0.06); color: #94a3b8; font-style: italic;">No destination set</span>`}
          <button type="button" class="attract-header-collapse-btn" title="Toggle Day ${i + 1}" aria-label="Toggle Day ${i + 1}">
            <svg class="attract-chevron" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          </button>
        </div>
      `;

      // Header click: fluid accordion expansion / collapse (single-expansion accordion)
      header.addEventListener('click', () => {
        const isNowExp = card.classList.contains('expanded');
        if (isNowExp) {
          card.classList.remove('expanded');
          card.classList.add('collapsed');
          state.expandedAttractionDays[i] = false;
        } else {
          // Accordion behavior: collapse all other expanded days when opening this day
          if (activitiesCardsList) {
            const allDayCards = activitiesCardsList.querySelectorAll('.attract-day-card');
            allDayCards.forEach((otherCard) => {
              if (otherCard !== card && otherCard.classList.contains('expanded')) {
                otherCard.classList.remove('expanded');
                otherCard.classList.add('collapsed');
                const otherDayIdx = parseInt(otherCard.dataset.dayIndex, 10);
                if (!isNaN(otherDayIdx)) {
                  state.expandedAttractionDays[otherDayIdx] = false;
                }
              }
            });
          }

          if (!state.expandedAttractionDays) state.expandedAttractionDays = {};
          for (let d = 0; d < state.days; d++) {
            if (d !== i) {
              state.expandedAttractionDays[d] = false;
            }
          }

          card.classList.remove('collapsed');
          card.classList.add('expanded');
          state.expandedAttractionDays[i] = true;
          state.selectedDayIndex = i;
          if (window.mapState && window.mapState.focusOnDestinationById) {
            window.mapState.focusOnDestinationById(destName);
          }
        }
        updateExpandAllBtnText();
      });
      card.appendChild(header);

      // 2. Fluid Accordion Body
      const body = document.createElement('div');
      body.className = 'attract-day-body';

      if (!hasDest) {
        const emptyNotice = document.createElement('div');
        emptyNotice.className = 'attract-empty-day-notice';
        emptyNotice.style.cssText = 'padding: 18px 14px; text-align: center; color: #94a3b8; font-size: 13px; font-style: italic; background: rgba(255,255,255,0.02); border-radius: 8px; margin: 8px 12px 14px; border: 1px dashed rgba(255,255,255,0.08);';
        emptyNotice.textContent = `Select a destination for Day ${i + 1} in the Destinations tab to automatically populate and customize attractions.`;
        body.appendChild(emptyNotice);
      } else {
        // 2a. List of attraction items
        const itemsList = document.createElement('div');
        itemsList.className = 'attract-items-list';
        items.forEach(attract => {
          const itemEl = createAttractionItemElement(i, attract, card);
          itemsList.appendChild(itemEl);
        });
        body.appendChild(itemsList);

      // 2b. "+ Add Activity" button (Matching Image 2 & 3: blue bar with green box)
      const addRow = document.createElement('div');
      addRow.className = 'attract-add-row';
      addRow.innerHTML = `
        <span class="attract-add-label">Add Activity</span>
        <div class="attract-add-icon-box" title="Add Custom Activity">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </div>
      `;

      // 2c. Inline custom activity form with smooth slide-down
      const inlineForm = document.createElement('div');
      inlineForm.className = 'attract-inline-form';
      inlineForm.innerHTML = `
        <input type="text" class="attract-custom-input" placeholder="Activity Title (e.g. Village Bullock Cart Tour)" />
        <textarea class="attract-custom-textarea" placeholder="Description (optional)" rows="2"></textarea>
        <div class="attract-custom-actions">
          <button type="button" class="btn-attract-add-cancel">Cancel</button>
          <button type="button" class="btn-attract-add-confirm">Add Activity</button>
        </div>
      `;

      addRow.addEventListener('click', () => {
        const isOpen = inlineForm.classList.contains('open');
        inlineForm.classList.toggle('open', !isOpen);
        if (!isOpen) {
          const inp = inlineForm.querySelector('.attract-custom-input');
          if (inp) {
            inp.value = '';
            setTimeout(() => inp.focus(), 120);
          }
        }
      });

      const cancelBtn = inlineForm.querySelector('.btn-attract-add-cancel');
      cancelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        inlineForm.classList.remove('open');
      });

      const confirmBtn = inlineForm.querySelector('.btn-attract-add-confirm');
      const submitCustom = (e) => {
        if (e) e.stopPropagation();
        const titleInp = inlineForm.querySelector('.attract-custom-input');
        const descInp = inlineForm.querySelector('.attract-custom-textarea');
        const title = titleInp ? titleInp.value.trim() : '';
        const desc = descInp ? descInp.value.trim() : '';
        if (!title) {
          if (titleInp) titleInp.focus();
          return;
        }
        inlineForm.classList.remove('open');
        titleInp.value = '';
        if (descInp) descInp.value = '';
        addCustomAttractionToDay(i, title, desc, card);
      };
      confirmBtn.addEventListener('click', submitCustom);
      inlineForm.querySelector('.attract-custom-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitCustom(e);
        if (e.key === 'Escape') inlineForm.classList.remove('open');
      });

      body.appendChild(addRow);
      body.appendChild(inlineForm);
      }
      card.appendChild(body);

      activitiesCardsList.appendChild(card);
    }

    updateExpandAllBtnText();
  }

  /**
   * Renders the Date Header Strip above the timeline (Image 3)
   * The day separation line (midnight) is in the MIDDLE of each night (12 hours night, 6pm to 6am).
   * Day 1 starts at arrival and ends at the middle of Night 1.
   * Subsequent days run from middle of Night i to middle of Night i+1.
   * Last day runs from middle of previous night to end of daytime.
   * All segment widths scale precisely with state.zoom.
   */
  function renderDateHeader() {
    if (!dateHeaderTrack) return;
    dateHeaderTrack.innerHTML = '';

    const totalDays = state.days;
    const totalNights = state.nights;
    const currentDayW = Math.round(STANDARD_DAY_WIDTH * state.zoom);
    const currentNightW = Math.round(NIGHT_SQUARE_WIDTH * state.zoom);
    const day1Width = calculateDay1Width();
    const halfNight = totalNights > 0 ? (currentNightW / 2) : 0;

    // Total track width must match timelineTrack and hotelsTrack exactly
    const totalTrackWidth = day1Width + ((totalDays - 1) * currentDayW) + (totalNights * currentNightW);
    dateHeaderTrack.style.width = `${totalTrackWidth}px`;

    // Parse arrival date
    const dateParts = state.arrivalDate.split('-');
    const year = parseInt(dateParts[0], 10);
    const monthIndex = parseInt(dateParts[1], 10) - 1;
    const startDay = parseInt(dateParts[2], 10);

    const timeParts = state.arrivalTime.split(':');
    let arrH = parseInt(timeParts[0] || '12', 10);
    let arrM = parseInt(timeParts[1] || '0', 10);
    arrM = arrM >= 30 ? 30 : 0;

    let accumulatedWidth = 0;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < totalDays; i++) {
      const currentDayDate = new Date(year, monthIndex, startDay + i);

      const monthName = MONTH_NAMES[currentDayDate.getMonth()];
      const dayNumber = currentDayDate.getDate();
      const dayOfWeek = DOW_NAMES[currentDayDate.getDay()];

      // Determine width of this day's date cell
      let cellWidth = 0;
      if (totalDays === 1) {
        cellWidth = totalTrackWidth;
      } else if (i === totalDays - 1) {
        // Last cell takes the exact remaining balance so sum is mathematically identical to totalTrackWidth
        cellWidth = totalTrackWidth - accumulatedWidth;
      } else if (i === 0) {
        // Day 1: Starts at arrival, ends in the middle of Night 1
        cellWidth = day1Width + halfNight;
      } else {
        // Intermediate days: from middle of Night i to middle of Night i+1
        cellWidth = currentDayW + currentNightW;
      }

      const cellStartX = accumulatedWidth;
      accumulatedWidth += cellWidth;

      const cell = document.createElement('div');
      cell.className = 'date-cell';
      cell.style.width = `${cellWidth}px`;
      cell.dataset.day = i + 1;

      // Video editor timeline ruler strip along the top of each day cell
      const rulerStrip = document.createElement('div');
      rulerStrip.className = 'date-ruler-strip';
      const rulerFragment = document.createDocumentFragment();

      function addTick(relX, h24, m, dayNum) {
        const tick = document.createElement('div');
        tick.className = 'ruler-tick';
        tick.style.left = `${relX}px`;

        const isMajor = (h24 % 6 === 0 && m === 0);
        const isHour = (m === 0);

        if (isMajor) {
          tick.classList.add('major-tick');
        } else if (isHour) {
          tick.classList.add('hour-tick');
        } else {
          tick.classList.add('half-tick');
        }

        const time12 = format12h(h24, m);
        tick.title = `Day ${dayNum} • ${monthName} ${dayNumber} (${dayOfWeek}) • ${time12}`;

        tick.dataset.absX = Math.round(cellStartX + relX);
        tick.dataset.day = dayNum;
        tick.dataset.h24 = h24;
        tick.dataset.m = m;

        rulerFragment.appendChild(tick);
      }

      if (i === 0) {
        // Day 1: Starts at arrival time, goes to 24:00 (midnight)
        if (arrH < 18) {
          const totalMinutes = (18 - arrH) * 60 - arrM;
          const numDaySlots = Math.max(1, Math.round(totalMinutes / 30));
          for (let s = 0; s < numDaySlots; s++) {
            const relX = (s / numDaySlots) * day1Width;
            const curM = arrH * 60 + arrM + s * 30;
            addTick(relX, Math.floor(curM / 60), curM % 60, 1);
          }
          if (totalNights > 0) {
            for (let s = 0; s <= 12; s++) {
              const relX = day1Width + (s / 12) * halfNight;
              const curH = 18 + Math.floor(s / 2);
              const curM = (s % 2) * 30;
              addTick(relX, curH % 24, curM, 1);
            }
          }
        } else {
          const totalMinutes = (24 - arrH) * 60 - arrM;
          const numNightSlots = Math.max(1, Math.round(totalMinutes / 30));
          for (let s = 0; s <= numNightSlots; s++) {
            const relX = (s / numNightSlots) * cellWidth;
            const curM = arrH * 60 + arrM + s * 30;
            addTick(relX, Math.floor(curM / 60) % 24, curM % 60, 1);
          }
        }
      } else if (i === totalDays - 1 && totalNights < totalDays) {
        // Last day without evening night (00:00 to 18:00)
        for (let s = 0; s < 12; s++) {
          const relX = (s / 12) * halfNight;
          const curH = Math.floor(s / 2);
          const curM = (s % 2) * 30;
          addTick(relX, curH, curM, i + 1);
        }
        for (let s = 0; s <= 24; s++) {
          const relX = halfNight + (s / 24) * currentDayW;
          const curH = 6 + Math.floor(s / 2);
          const curM = (s % 2) * 30;
          addTick(relX, curH, curM, i + 1);
        }
      } else {
        // Intermediate days: exactly 48 pieces (30-minute intervals) across 24 hours
        // 1. Morning night: 00:00 to 06:00 (12 intervals)
        for (let s = 0; s < 12; s++) {
          const relX = (s / 12) * halfNight;
          const curH = Math.floor(s / 2);
          const curM = (s % 2) * 30;
          addTick(relX, curH, curM, i + 1);
        }
        // 2. Daytime: 06:00 to 18:00 (24 intervals)
        for (let s = 0; s < 24; s++) {
          const relX = halfNight + (s / 24) * currentDayW;
          const curH = 6 + Math.floor(s / 2);
          const curM = (s % 2) * 30;
          addTick(relX, curH, curM, i + 1);
        }
        // 3. Evening night: 18:00 to 24:00 (12 intervals + final tick)
        for (let s = 0; s <= 12; s++) {
          const relX = halfNight + currentDayW + (s / 12) * halfNight;
          const curH = 18 + Math.floor(s / 2);
          const curM = (s % 2) * 30;
          addTick(relX, curH % 24, curM, i + 1);
        }
      }

      rulerStrip.appendChild(rulerFragment);
      cell.appendChild(rulerStrip);

      // Date Label below ruler strip
      const label = document.createElement('div');
      label.className = 'date-cell-label';
      if (cellWidth < 50) {
        label.innerHTML = `<span>${monthName} ${dayNumber}</span>`;
        label.title = `${monthName} ${dayNumber} (${dayOfWeek})`;
      } else {
        label.innerHTML = `<span>${monthName} ${dayNumber}</span><span class="dow-label">${dayOfWeek}</span>`;
      }
      cell.appendChild(label);

      fragment.appendChild(cell);
    }

    dateHeaderTrack.appendChild(fragment);
  }

  /**
   * Creates an elegant minimal selection frame element
   */
  function createSelectionFrameElement() {
    const frame = document.createElement('div');
    frame.className = 'time-selection-frame';
    frame.setAttribute('aria-hidden', 'true');
    return frame;
  }

  /**
   * Updates the Selected Day Journey Status Bar above the timeline (Images 1, 2, 3).
   * - No day selected: Shows dashed badge "[ No Day Selected ]"
   * - Day 1 selected (before destination pick): " Airport  ->  [ Day 1 ] ->  Destination"
   * - Day 1 selected (after destination pick): " Airport  ->  [ Day 1 ] ->  Anuradhapura"
   * - Day N selected: Shows origin (previous day's destination)  ->  [ Day N ] ->  Destination
   */
  function updateTimelineDayStatusBar() {
    const isPieceSelected = !!state.selectedPiece;
    const isDaySelected = (state.selectedPiece && state.selectedPiece.type === 'day');
    const isNightSelected = (state.selectedPiece && state.selectedPiece.type === 'night');

    // 1. Sync timeline bottom status bar
    if (timelineDayStatusBar && dayStatusEmpty && dayStatusActive) {
      if (isDaySelected) {
        dayStatusEmpty.style.display = 'none';
        dayStatusActive.style.display = 'flex';
        if (nightStatusActive) nightStatusActive.style.display = 'none';
      } else if (isNightSelected) {
        dayStatusEmpty.style.display = 'none';
        dayStatusActive.style.display = 'none';
        if (nightStatusActive) nightStatusActive.style.display = 'flex';
      } else {
        dayStatusEmpty.style.display = 'flex';
        dayStatusActive.style.display = 'none';
        if (nightStatusActive) nightStatusActive.style.display = 'none';
      }
    }

    // 2. Sync sidebar top status bar (Supports both Day and Night pieces)
    if (sidebarStatusEmpty && sidebarStatusActive) {
      if (!isPieceSelected) {
        sidebarStatusEmpty.style.display = 'flex';
        sidebarStatusActive.style.display = 'none';
      } else {
        sidebarStatusEmpty.style.display = 'none';
        sidebarStatusActive.style.display = 'flex';

        if (sidebarDayPill) {
          if (isDaySelected) {
            sidebarDayPill.textContent = `Day ${state.selectedPiece.index}`;
            sidebarDayPill.classList.add('is-day');
            sidebarDayPill.classList.remove('is-night');
          } else if (isNightSelected) {
            sidebarDayPill.textContent = `Night ${state.selectedPiece.index}`;
            sidebarDayPill.classList.add('is-night');
            sidebarDayPill.classList.remove('is-day');
          }
        }
      }
    }

    // 3. If Night is selected: show accommodation & hotel information (Image 2: media_1789971220372.png)
    if (isNightSelected) {
      const nightNum = state.selectedPiece.index;
      // Tourist sleeps at Day N's destination on Night N
      const destName = (state.dayDestinations && state.dayDestinations[nightNum - 1]) ? state.dayDestinations[nightNum - 1] : null;
      const bookedHotel = (state.hotelBookings && state.hotelBookings[nightNum]) ? state.hotelBookings[nightNum] : null;

      let count = 0;
      if (destName && window.SRI_LANKA_HOTELS) {
        const destNorm = destName.toLowerCase().trim();
        count = window.SRI_LANKA_HOTELS.filter(h => {
          const hDestId = (h.destinationId || '').toLowerCase();
          const hDestName = (h.destinationName || '').toLowerCase();
          return hDestId === destNorm ||
                 hDestName.includes(destNorm) ||
                 destNorm.includes(hDestId) ||
                 (destNorm === 'dambulla' && hDestId === 'sigiriya') ||
                 (destNorm === 'sigiriya' && hDestId === 'dambulla');
        }).length;
      }

      if (nightStatusTitle) {
        if (!destName) {
          nightStatusTitle.innerHTML = `<span class="night-status-region">No Destination Selected for Night ${nightNum}</span>`;
        } else if (bookedHotel) {
          nightStatusTitle.innerHTML = `<span class="night-status-hotel-name">${escapeHtml(bookedHotel)}</span> <span class="night-hotel-sep" style="opacity:0.6; margin:0 4px;">•</span> <span class="night-status-region">${escapeHtml(destName)} Region (${count} Hotels &amp; Resorts)</span>`;
        } else {
          nightStatusTitle.innerHTML = `<span class="night-status-region">${escapeHtml(destName)} Region (${count} Hotels &amp; Resorts)</span>`;
        }
      }
      return;
    }

    if (!isDaySelected) return;

    const dayNum = state.selectedPiece.index;
    const dayIdx = dayNum - 1;
    const rawDest = (state.dayDestinations && state.dayDestinations[dayIdx]) ? state.dayDestinations[dayIdx] : null;
    const isMulti = Array.isArray(rawDest);

    // Calculate Origin
    let originName = 'Airport';
    let isOriginAirport = (dayNum === 1);
    let isOriginPending = false;

    if (dayNum === 1) {
      originName = 'Airport';
      isOriginAirport = true;
    } else {
      const prevFinal = getDayFinalDestination(dayIdx - 1);
      if (prevFinal) {
        originName = prevFinal;
        isOriginAirport = (prevFinal === 'Airport (BIA)' || prevFinal === 'Airport');
      } else {
        originName = `Day ${dayNum - 1} Not Set`;
        isOriginAirport = false;
        isOriginPending = true;
      }
    }

    const planeIconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`;
    const pinIconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
    const leftArrowSvg = `<svg width="15" height="12" viewBox="0 0 24 16" fill="none"><path d="M7 1L0 8L7 15V10.5H24V5.5H7V1Z" fill="#3b82f6"/></svg>`;
    const rightArrowSvg = `<svg width="15" height="12" viewBox="0 0 24 16" fill="none"><path d="M17 1L24 8L17 15V10.5H0V5.5H17V1Z" fill="#3b82f6"/></svg>`;
    const bidiArrowSvg = `<svg width="17" height="12" viewBox="0 0 24 16" fill="none"><path d="M5 2L0 8L5 14V10.5H19V14L24 8L19 2V5.5H5V2Z" fill="#3b82f6"/></svg>`;
    const plusIconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;

    const originColor = isOriginAirport ? '#38bdf8' : (isOriginPending ? '#94a3b8' : '#38bdf8');
    const originIcon = isOriginAirport ? planeIconSvg : pinIconSvg;

    // Attach outer status bar container deselect listener once
    const statusBarContainer = document.getElementById('timeline-day-status-bar');
    if (statusBarContainer && !statusBarContainer._hasDeselectBound) {
      statusBarContainer._hasDeselectBound = true;
      statusBarContainer.addEventListener('click', (e) => {
        if (!e.target.closest('.status-sub-day-badge, .status-slot-badge, .status-mode-pill, .status-center-badge, .slot-remove-btn, .status-telemetry-chip')) {
          if (state.selectedDestSlot !== null) {
            state.selectedDestSlot = null;
            updateTimelineDayStatusBar();
            renderDestinationCards();
          }
        }
      });
    }

    if (!isMulti) {
      // =========================================================================
      // SINGLE DESTINATION DAY (Image 1 & Image 2)
      // =========================================================================
      const chosenDest = rawDest || 'Destination';
      const isDestAirport = (chosenDest === 'Airport (BIA)' || chosenDest === 'Airport');

      let routeInfo = null;
      if (chosenDest !== 'Destination' && !isOriginPending && window.SRI_LANKA_ROUTES) {
        routeInfo = window.SRI_LANKA_ROUTES.findRoute(isOriginAirport ? 'airport' : originName, chosenDest, state.routeMode);
      }

      dayStatusActive.innerHTML = `
        <div class="day-status-single">
          <!-- Column 1: Origin -->
          <div class="status-origin-col">
            <span class="status-origin-icon" style="color: ${originColor};">${originIcon}</span>
            <span class="status-origin-name" style="color: ${originColor};">${escapeHtml(originName)}</span>
            <span class="status-arrow-left">${leftArrowSvg}</span>
          </div>

          <!-- Column 2: Day Badge with Contextual Travel Tooltip & Hover-to-Plus (Image 2: media_1790239035391.png) -->
          <div class="status-day-badge-wrap">
            ${routeInfo ? `
              <div class="travel-leg-tooltip" id="status-travel-tooltip" title="${state.routeMode === 'highway' ? 'Highway Route' : 'Normal Route'} from ${escapeHtml(originName)} to ${escapeHtml(chosenDest)} (Click to switch)">
                <span class="tooltip-pill-km">${routeInfo.formattedDistance}</span>
                <span class="tooltip-pill-time">${routeInfo.formattedDuration}</span>
                <span class="tooltip-caret"></span>
              </div>
            ` : ''}
            <div class="status-center-badge can-add" id="status-day-badge" title="Click to add a second destination for Day ${dayNum}">
              <span class="badge-day-text">Day ${dayNum}</span>
              <span class="badge-plus-icon">${plusIconSvg}</span>
            </div>
          </div>

          <!-- Column 3: Destination -->
          <div class="status-dest-col">
            <span class="status-arrow-right">${rightArrowSvg}</span>
            <span class="status-dest-icon" style="color: ${isDestAirport ? '#38bdf8' : (chosenDest === 'Destination' ? '#94a3b8' : '#38bdf8')};">
              ${isDestAirport ? planeIconSvg : pinIconSvg}
            </span>
            <span class="status-dest-name anim-name-enter" style="color: ${isDestAirport ? '#38bdf8' : (chosenDest === 'Destination' ? '#94a3b8' : '#38bdf8')};">
              ${escapeHtml(chosenDest)}
            </span>
          </div>
        </div>
      `;

      // Event listener: clicking the center badge splits the day into 2 destinations (Image 2 -> Image 3)
      const centerBadge = dayStatusActive.querySelector('#status-day-badge');
      if (centerBadge) {
        centerBadge.addEventListener('click', (e) => {
          e.stopPropagation();
          splitDayIntoTwoDestinations(dayIdx);
        });
      }

      // Event listener: route mode toggle on travel tooltip click
      const travelTooltip = dayStatusActive.querySelector('#status-travel-tooltip');
      if (travelTooltip) {
        travelTooltip.addEventListener('click', (e) => {
          e.stopPropagation();
          state.routeMode = (state.routeMode === 'highway') ? 'normal' : 'highway';
          updateTimelineDayStatusBar();
          if (window.mapState && window.mapState.updateItineraryRoutes) {
            window.mapState.updateItineraryRoutes(state.dayDestinations.slice(0, state.days));
          }
          showToast(`Route mode: ${state.routeMode === 'highway' ? 'Highway' : 'Normal'}`);
        });
      }

      // Empty-space click listener to deselect slot
      dayStatusActive.onclick = (e) => {
        if (!e.target.closest('.status-sub-day-badge, .status-slot-badge, .status-center-badge, .slot-remove-btn, .travel-leg-tooltip')) {
          if (state.selectedDestSlot !== null) {
            state.selectedDestSlot = null;
            updateTimelineDayStatusBar();
            renderDestinationCards();
          }
        }
      };

      // Sidebar summary
      if (sidebarJourneySummary) {
        if (routeInfo) {
          const modeLabel = state.routeMode === 'highway' ? 'HWY' : 'NORM';
          sidebarJourneySummary.textContent = `${originName} -> ${chosenDest} (${routeInfo.formattedDistance} • ${routeInfo.formattedDuration} • ${modeLabel})`;
        } else {
          sidebarJourneySummary.textContent = `${originName} -> ${chosenDest}`;
        }
      }

    } else {
      // =========================================================================
      // 2 DESTINATIONS PER DAY (Image 3 & Image 4)
      // Layout: Origin <- [Day N] <-> Dest1 <-> [Day N] -> Dest2
      // =========================================================================
      const isJustSplit = !!state.justSplitDay;
      state.justSplitDay = false; // Reset so animation only plays upon splitting

      const activeSlot = (typeof state.selectedDestSlot === 'number' && state.selectedDestSlot >= 0 && state.selectedDestSlot < rawDest.length) ? state.selectedDestSlot : null;
      const numStops = rawDest.length;

      // Calculate telemetry for each leg dynamically (supports 2, 3 or more destinations!)
      const legRoutes = [];
      let totalDistKm = 0;
      let totalDurationMin = 0;
      let hasAnyRoute = false;

      if (window.SRI_LANKA_ROUTES && !isOriginPending) {
        const startPt = isOriginAirport ? 'airport' : originName;
        for (let i = 0; i < numStops; i++) {
          const curDest = rawDest[i];
          const legStart = (i === 0) ? startPt : (rawDest[i - 1] || startPt);
          let r = null;
          if (curDest) {
            r = window.SRI_LANKA_ROUTES.findRoute(legStart, curDest, state.routeMode);
            if (r) {
              totalDistKm += r.distanceKm;
              totalDurationMin += r.durationMin;
              hasAnyRoute = true;
            }
          }
          legRoutes.push(r);
        }
      }

      const totalHours = Math.floor(totalDurationMin / 60);
      const totalMins = totalDurationMin % 60;
      const formattedTotalDuration = totalHours > 0 ? `${totalHours}h ${totalMins}m` : `${totalMins}m`;

      let stopsHtml = '';
      for (let i = 0; i < numStops; i++) {
        const curDest = rawDest[i];
        const r = legRoutes[i];
        const isLast = (i === numStops - 1);
        const legStartName = (i === 0) ? originName : (rawDest[i - 1] || originName);
        const arrowSvg = isLast ? rightArrowSvg : bidiArrowSvg;
        const arrowClass = isLast ? 'status-arrow-right' : 'status-arrow-bidi';

        stopsHtml += `
          <!-- Arrow between previous destination and this day badge (destination -> arrow -> day) -->
          ${i > 0 ? `<span class="status-arrow-bidi ${isJustSplit ? 'anim-arrow-enter' : ''}">${bidiArrowSvg}</span>` : ''}

          <!-- Sub-day Badge for Leg ${i + 1} with Contextual Travel Tooltip -->
          <div class="status-day-badge-wrap">
            ${r ? `
              <div class="travel-leg-tooltip" data-route-leg="${i + 1}" title="${state.routeMode === 'highway' ? ' Highway Route' : ' Normal Route'} from ${escapeHtml(legStartName)} to ${escapeHtml(curDest)}: ${r.formattedDistance}, ${r.formattedDuration} (Click to switch)">
                <span class="tooltip-pill-km">${r.formattedDistance}</span>
                <span class="tooltip-pill-time">${r.formattedDuration}</span>
                <span class="tooltip-caret"></span>
              </div>
            ` : ''}
            <button type="button" class="status-sub-day-badge ${activeSlot === i ? 'active-slot' : ''} ${isJustSplit ? 'anim-badge-enter' : ''}" data-slot="${i}" title="Select Stop ${i + 1}">
              Day ${dayNum}
            </button>
          </div>

          <!-- Arrow -->
          <span class="${arrowClass} ${isJustSplit ? 'anim-arrow-enter' : ''}">${arrowSvg}</span>

          <!-- Destination Slot ${i} -->
          <div class="status-slot-badge ${activeSlot === i ? 'active-slot' : ''} ${!curDest ? 'is-placeholder' : ''} ${isJustSplit ? 'anim-slot-enter' : ''}" data-slot="${i}" title="Click to select Stop ${i + 1} destination">
            ${!curDest ? `
              <span class="slot-pin-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </span>
              <span class="slot-name anim-name-enter">Destination</span>
            ` : `
              <span class="slot-name anim-name-enter" style="color: #38bdf8;">${escapeHtml(curDest)}</span>
              <button type="button" class="slot-remove-btn" data-remove-slot="${i}" title="Remove this stop">×</button>
            `}
          </div>
        `;
      }

      dayStatusActive.innerHTML = `
        <div class="day-status-multi">
          <!-- Origin -->
          <div class="multi-origin-slot">
            <span class="status-origin-icon" style="color: ${originColor};">${originIcon}</span>
            <span class="status-origin-name" style="color: ${originColor};">${escapeHtml(originName)}</span>
            <span class="status-arrow-left">${leftArrowSvg}</span>
          </div>

          ${stopsHtml}
        </div>
      `;

      // Event listeners for selecting slots and synchronizing day selection
      dayStatusActive.querySelectorAll('.status-sub-day-badge, .status-slot-badge').forEach((el) => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          if (e.target.closest('.slot-remove-btn')) return;
          const slot = parseInt(el.dataset.slot, 10);
          state.selectedDestSlot = slot;
          state.selectedPiece = { type: 'day', index: dayNum };
          state.selectedDayIndex = dayIdx;
          applySelectionFrame();
          updateTimelineDayStatusBar();
          renderDestinationCards();
          renderHotelCards();
          renderActivityCards();
        });
      });

      // Event listeners for remove buttons
      dayStatusActive.querySelectorAll('.slot-remove-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const slot = parseInt(btn.dataset.removeSlot, 10);
          removeDayDestinationSlot(dayIdx, slot);
        });
      });

      // Event listeners for route mode toggle on travel tooltips
      dayStatusActive.querySelectorAll('.travel-leg-tooltip').forEach((tt) => {
        tt.addEventListener('click', (e) => {
          e.stopPropagation();
          state.routeMode = (state.routeMode === 'highway') ? 'normal' : 'highway';
          updateTimelineDayStatusBar();
          if (window.mapState && window.mapState.updateItineraryRoutes) {
            window.mapState.updateItineraryRoutes(state.dayDestinations.slice(0, state.days));
          }
          showToast(`Route mode: ${state.routeMode === 'highway' ? ' Highway' : ' Normal'}`);
        });
      });

      // Empty-space click listener on dayStatusActive to deselect slot
      dayStatusActive.onclick = (e) => {
        if (!e.target.closest('.status-sub-day-badge, .status-slot-badge, .status-center-badge, .slot-remove-btn, .travel-leg-tooltip')) {
          if (state.selectedDestSlot !== null) {
            state.selectedDestSlot = null;
            updateTimelineDayStatusBar();
            renderDestinationCards();
            renderHotelCards();
          }
        }
      };

      // Sidebar summary
      if (sidebarJourneySummary) {
        const dest1Str = dest1 || 'Destination';
        const dest2Str = dest2 || 'Destination';
        if (hasAnyRoute) {
          const modeLabel = state.routeMode === 'highway' ? 'HWY' : 'NORM';
          sidebarJourneySummary.textContent = `${originName} -> ${dest1Str} -> ${dest2Str} (${totalDistKm} km • ${formattedTotalDuration} • ${modeLabel})`;
        } else {
          sidebarJourneySummary.textContent = `${originName} -> ${dest1Str} -> ${dest2Str}`;
        }
      }
    }
  }
  window.updateTimelineDayStatusBar = updateTimelineDayStatusBar;
  window.renderDestinationCards = renderDestinationCards;
  window.renderHotelCards = renderHotelCards;
  window.renderActivityCards = renderActivityCards;

  /**
   * Triggers an attention-grabbing spring-pop animation on the right sidebar's Day/Night pill,
   * status bar, and container border to guide user focus to the configuration panel.
   */
  function triggerSidebarAttentionAnimation(type) {
    const isNight = (type === 'night');

    // 1. Pill spring-pop & radar ping
    if (sidebarDayPill) {
      sidebarDayPill.classList.remove('pill-pop-animate');
      void sidebarDayPill.offsetWidth; // Force CSS reflow to replay animation
      sidebarDayPill.classList.add('pill-pop-animate');
    }

    // 2. Top status bar ambient lighting wave
    const statusBar = document.getElementById('sidebar-top-status-bar');
    if (statusBar) {
      statusBar.classList.remove('attention-flash-day', 'attention-flash-night');
      void statusBar.offsetWidth;
      statusBar.classList.add(isNight ? 'attention-flash-night' : 'attention-flash-day');
    }

    // 3. Sidebar container subtle border pulse
    const sidebarCol = document.querySelector('.dashboard-sidebar-col');
    if (sidebarCol) {
      sidebarCol.classList.remove('attention-pulse-day', 'attention-pulse-night');
      void sidebarCol.offsetWidth;
      sidebarCol.classList.add(isNight ? 'attention-pulse-night' : 'attention-pulse-day');
    }
  }

  /**
   * Sets or toggles the selected time piece in the Day Bar.
   * type: 'day' | 'night' | null (or object { type, index })
   * index: 1-based index (e.g. 1 for Day 1, 2 for Night 2)
   */
  function setSelectedPiece(type, index) {
    if (type && typeof type === 'object') {
      index = type.index;
      type = type.type;
    }

    if (!type) {
      if (state.selectedPiece !== null) {
        state.selectedPiece = null;
        applySelectionFrame();
        updateTimelineDayStatusBar();
        renderDestinationCards();
        renderHotelCards();
      }
      return;
    }

    // Toggle off if clicking the already selected piece
    if (state.selectedPiece && state.selectedPiece.type === type && state.selectedPiece.index === index) {
      state.selectedPiece = null;
    } else {
      state.selectedPiece = { type, index };
      if (type === 'day') {
        const dIdx = index - 1;
        if (state.dayDestinations && Array.isArray(state.dayDestinations[dIdx])) {
          const raw = state.dayDestinations[dIdx];
          if (!raw[0] && raw[1]) {
            state.selectedDestSlot = 0;
          } else if (raw[0] && !raw[1]) {
            state.selectedDestSlot = 1;
          } else {
            state.selectedDestSlot = 0;
          }
        } else {
          state.selectedDestSlot = 0;
        }
        if (!state.expandedAttractionDays) state.expandedAttractionDays = {};
        for (let k = 0; k < state.days; k++) {
          state.expandedAttractionDays[k] = (k === dIdx);
        }
        switchSideTab('destinations');
      } else if (type === 'night') {
        switchSideTab('hotels');
      }
    }

    applySelectionFrame();
    updateTimelineDayStatusBar();
    renderDestinationCards();
    renderHotelCards();
    renderActivityCards();

    if (state.selectedPiece) {
      triggerSidebarAttentionAnimation(state.selectedPiece.type);
    }
  }
  window.setSelectedPiece = setSelectedPiece;
  window.updateTimelineDayStatusBar = updateTimelineDayStatusBar;

  /**
   * Applies the vector selection frame to the active selected piece in the Day Bar.
   * Removes previous selection frames and styles.
   */
  function applySelectionFrame() {
    if (!timelineTrack) return;

    // Remove any existing selection frames and classes in timelineTrack
    const existingFrames = timelineTrack.querySelectorAll('.time-selection-frame');
    existingFrames.forEach(f => f.remove());

    const previouslySelected = timelineTrack.querySelectorAll('.is-selected');
    previouslySelected.forEach(el => el.classList.remove('is-selected'));

    const previousSelectedParents = timelineTrack.querySelectorAll('.is-selected-parent');
    previousSelectedParents.forEach(el => el.classList.remove('is-selected-parent'));

    // Also clear hotel block selection highlights
    if (hotelsTrack) {
      const prevHotelSelected = hotelsTrack.querySelectorAll('.hotel-block.is-selected');
      prevHotelSelected.forEach(el => el.classList.remove('is-selected'));
    }

    if (!state.selectedPiece) return;

    // Validate selected piece against current days/nights range
    if (state.selectedPiece.type === 'day' && state.selectedPiece.index > state.days) {
      state.selectedPiece = null;
      return;
    }
    if (state.selectedPiece.type === 'night' && state.selectedPiece.index > state.nights) {
      state.selectedPiece = null;
      return;
    }

    let targetEl = null;
    if (state.selectedPiece.type === 'day') {
      targetEl = timelineTrack.querySelector(`.day-segment[data-day="${state.selectedPiece.index}"]`);
    } else if (state.selectedPiece.type === 'night') {
      targetEl = timelineTrack.querySelector(`.night-square[data-night="${state.selectedPiece.index}"]`);
    }

    if (targetEl) {
      targetEl.classList.add('is-selected');
      const parentWrapper = targetEl.closest('.night-square-wrapper');
      if (parentWrapper) {
        parentWrapper.classList.add('is-selected-parent');
      }
      targetEl.appendChild(createSelectionFrameElement());
    }

    // Also highlight the corresponding hotel block when a night is selected
    if (state.selectedPiece.type === 'night' && hotelsTrack) {
      const nightIdx = state.selectedPiece.index;
      const hotelBlocks = hotelsTrack.querySelectorAll('.hotel-block');
      hotelBlocks.forEach(block => {
        const startN = parseInt(block.dataset.startNight, 10);
        const endN = parseInt(block.dataset.endNight, 10);
        if (nightIdx >= startN && nightIdx <= endN) {
          block.classList.add('is-selected');
        }
      });
    }
  }
  window.applySelectionFrame = applySelectionFrame;

  /**
   * Renders the Timeline bar with trimmed Day 1 (Image 1, 2, 3)
   * The badges are ALWAYS NUMBERED (NIGHT 1, NIGHT 2, ...).
   * Filter controls visibility of Night badges, Day labels, or Both.
   * Dimensions dynamically scale with state.zoom.
   */
  function renderTimeline() {
    if (!timelineTrack) return;
    timelineTrack.innerHTML = '';

    const totalDays = state.days;
    const totalNights = state.nights;
    const currentDayW = Math.round(STANDARD_DAY_WIDTH * state.zoom);
    const currentNightW = Math.round(NIGHT_SQUARE_WIDTH * state.zoom);
    const day1Width = calculateDay1Width();

    // Total track width must match dateHeaderTrack and hotelsTrack exactly
    const totalTrackWidth = day1Width + ((totalDays - 1) * currentDayW) + (totalNights * currentNightW);
    timelineTrack.style.width = `${totalTrackWidth}px`;

    const fragment = document.createDocumentFragment();
    const maxSteps = Math.max(totalDays, totalNights);

    for (let i = 0; i < maxSteps; i++) {
      const dayIndex = i + 1;
      const nightIndex = i + 1;

      // Add Day Segment
      if (i < totalDays) {
        const daySeg = document.createElement('div');
        daySeg.className = 'day-segment';
        daySeg.dataset.day = dayIndex;

        // Apply trimmed width to Day 1, standard scaled width to others
        const segW = (i === 0) ? day1Width : currentDayW;
        if (i === 0) {
          daySeg.classList.add('day-1');
        }
        daySeg.style.width = `${segW}px`;

        // Selection click listener
        daySeg.addEventListener('click', (e) => {
          if (hasPannedTimeline) return;
          e.stopPropagation();
          setSelectedPiece('day', dayIndex);
        });

        fragment.appendChild(daySeg);
      }

      // Add Night Square
      if (i < totalNights) {
        const nightWrapper = document.createElement('div');
        nightWrapper.className = 'night-square-wrapper';
        nightWrapper.style.width = `${currentNightW}px`;

        // Neon lime-green square
        const nightSquare = document.createElement('div');
        nightSquare.className = 'night-square';
        nightSquare.dataset.night = nightIndex;
        nightSquare.style.width = `${currentNightW}px`;
        nightSquare.title = `Night ${nightIndex}`;

        nightSquare.addEventListener('click', (e) => {
          if (hasPannedTimeline) return;
          e.stopPropagation();
          setSelectedPiece('night', nightIndex);
        });

        nightWrapper.appendChild(nightSquare);
        fragment.appendChild(nightWrapper);
      }
    }

    timelineTrack.appendChild(fragment);

    // Apply selection frame if a piece is currently selected
    applySelectionFrame();
  }

  /**
   * Helper to retrieve or initialize custom hotel check-in/out times for a night.
   * Default: check-in 02:00 PM (14.0) and check-out 10:00 AM (10.0).
   */
  function getHotelTiming(nightNum) {
    if (!state.hotelTimings[nightNum]) {
      state.hotelTimings[nightNum] = { checkIn: 14.0, checkOut: 10.0 };
    }
    return state.hotelTimings[nightNum];
  }

  /**
   * Formats decimal hours into a concise time string matching the reference mockup.
   * Example: 14.0 -> "02:00PM", 10.0 -> "10:00AM", 13.5 -> "01:30PM"
   */
  function formatHandleTime(hours) {
    let h24 = Math.floor(hours) % 24;
    let m = Math.round((hours - Math.floor(hours)) * 60);
    if (m >= 60) {
      h24 = (h24 + 1) % 24;
      m = 0;
    }
    const ampm = h24 >= 12 ? 'PM' : 'AM';
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    const formattedH = h12 < 10 ? '0' + h12 : '' + h12;
    const formattedM = m < 10 ? '0' + m : '' + m;
    return `${formattedH}:${formattedM} ${ampm}`;
  }

  // Active handle drag state
  let activeHandleDrag = null;
  let justFinishedHandleDrag = false;

  /**
   * Helper: checks if Night nightNum is merged with Night nightNum + 1
   */
  function isNightMergedWithNext(nightNum) {
    return !!(state.mergedNights && state.mergedNights[nightNum]);
  }

  /**
   * Helper: checks if Night nightNum is merged with Night nightNum - 1
   */
  function isNightMergedWithPrev(nightNum) {
    return !!(state.mergedNights && state.mergedNights[nightNum - 1]);
  }

  /**
   * Generates contiguous hotel stays by grouping nights that are merged together.
   * Returns array of: { startNight, endNight, nights: [number] }
   */
  function getHotelStays() {
    const stays = [];
    let currentStay = null;

    for (let i = 1; i <= state.nights; i++) {
      if (!currentStay) {
        currentStay = {
          startNight: i,
          endNight: i,
          nights: [i]
        };
      } else {
        currentStay.endNight = i;
        currentStay.nights.push(i);
      }

      if (!isNightMergedWithNext(i) || i === state.nights) {
        stays.push(currentStay);
        currentStay = null;
      }
    }

    return stays;
  }

  /**
   * Returns the stay object that contains nightNum
   */
  function getStayForNight(nightNum) {
    const stays = getHotelStays();
    return stays.find(s => s.nights.includes(nightNum)) || null;
  }

  /**
   * Merges Night nightA into Night nightB (nightB = nightA + 1),
   * synchronizes destination for the next day, and links hotel bookings.
   */
  function executeMergeHotelNights(nightA, nightB) {
    if (!state.mergedNights) state.mergedNights = {};
    state.mergedNights[nightA] = true;

    // Set destination for the next day (Day nightB) to match Day nightA
    if (!state.dayDestinations) state.dayDestinations = [];
    const sourceDest = getDayFinalDestination(nightA - 1) || '';
    state.dayDestinations[nightB - 1] = sourceDest;
    state.selectedDestName = sourceDest;

    // Synchronize hotel booking if either night is booked
    if (!state.hotelBookings) state.hotelBookings = {};
    if (state.hotelBookings[nightA]) {
      state.hotelBookings[nightB] = state.hotelBookings[nightA];
    } else if (state.hotelBookings[nightB]) {
      state.hotelBookings[nightA] = state.hotelBookings[nightB];
    }

    // Update 3D map route
    if (window.mapState) {
      if (window.mapState.updateItineraryRoutes) {
        window.mapState.updateItineraryRoutes(state.dayDestinations.slice(0, state.days));
      } else if (window.mapState.updateRoute) {
        window.mapState.updateRoute(state.dayDestinations.slice(0, state.days));
      }
    }

    updateTimelineDayStatusBar();
    renderHotelsTrack();
    renderDestinationCards();
    renderHotelCards();
    renderActivityCards();

    showToast(` Merged Nights ${nightA} & ${nightB} into a continuous stay at ${sourceDest}!`);
  }

  /**
   * Unmerges a multi-night stay back into separate 1-night stays.
   */
  function unmergeHotelStay(stay) {
    if (!stay || stay.nights.length <= 1) return;
    stay.nights.forEach(n => {
      if (state.mergedNights) {
        delete state.mergedNights[n];
      }
      const timing = getHotelTiming(n);
      timing.checkIn = 14.0;
      timing.checkOut = 10.0;
    });

    renderHotelsTrack();
    renderHotelCards();
    showToast(`Separated Nights ${stay.startNight}–${stay.endNight} into individual 1-night stays.`);
  }

  /**
   * Renders the Hotels Track row underneath the Day/Night track.
   * Groups merged nights into continuous multi-night stays.
   * Displays draggable check-in and check-out boundary handles (lollipop pins).
   * Geometry scales dynamically with state.zoom.
   */
  function renderHotelsTrack() {
    if (!hotelsTrack) return;
    hotelsTrack.innerHTML = '';
    hotelsTrack.classList.remove('is-handle-dragging');

    const totalDays = state.days;
    const totalNights = state.nights;
    const currentDayW = Math.round(STANDARD_DAY_WIDTH * state.zoom);
    const currentNightW = Math.round(NIGHT_SQUARE_WIDTH * state.zoom);
    const day1Width = calculateDay1Width();

    // Total track width must match timelineTrack exactly
    const totalTrackWidth = day1Width + ((totalDays - 1) * currentDayW) + (totalNights * currentNightW);
    hotelsTrack.style.width = `${totalTrackWidth}px`;

    const fragment = document.createDocumentFragment();
    const hotelStays = getHotelStays();

    for (let sIdx = 0; sIdx < hotelStays.length; sIdx++) {
      const stay = hotelStays[sIdx];
      const startNightIndex = stay.startNight - 1;
      const endNightIndex = stay.endNight - 1;

      const nightStartX = day1Width + startNightIndex * (currentDayW + currentNightW);
      const nightEndX = day1Width + endNightIndex * (currentDayW + currentNightW) + currentNightW;

      const startTiming = getHotelTiming(stay.startNight);
      const endTiming = getHotelTiming(stay.endNight);

      // Check-in calculation: startTiming.checkIn
      const checkInOffset = Math.round(((18.0 - startTiming.checkIn) / 12.0) * currentDayW);
      let hotelStartX = nightStartX - checkInOffset;
      if (hotelStartX < 0) {
        hotelStartX = 0;
      }

      // Check-out calculation: endTiming.checkOut
      const checkOutOffset = Math.round(((endTiming.checkOut - 6.0) / 12.0) * currentDayW);
      let hotelEndX = nightEndX + checkOutOffset;
      if (hotelEndX > totalTrackWidth) {
        hotelEndX = totalTrackWidth;
      }

      const hotelWidth = hotelEndX - hotelStartX;
      if (hotelWidth <= 0) continue;

      const isMultiNight = stay.nights.length > 1;
      const isBooked = stay.nights.some(n => state.hotelBookings && state.hotelBookings[n]);
      const bookedHotelName = isBooked ? (stay.nights.map(n => state.hotelBookings && state.hotelBookings[n]).find(Boolean)) : null;

      const block = document.createElement('div');
      block.className = `hotel-block ${isBooked ? 'booked' : 'not-booked'} ${isMultiNight ? 'merged-stay' : ''}`;
      block.dataset.night = stay.startNight.toString();
      block.dataset.startNight = stay.startNight.toString();
      block.dataset.endNight = stay.endNight.toString();
      block.style.left = `${hotelStartX}px`;
      block.style.width = `${hotelWidth}px`;

      const nightsTitle = isMultiNight ? `Nights ${stay.startNight}–${stay.endNight} (${stay.nights.length} Nights)` : `Night ${stay.startNight}`;
      block.title = `${nightsTitle}: ${isBooked ? bookedHotelName : 'Hotel Not Booked'} (Check-in ${formatHandleTime(startTiming.checkIn)} - Check-out ${formatHandleTime(endTiming.checkOut)})`;

      // Compact class if narrow
      if (hotelWidth < 88) {
        block.classList.add('compact');
      }

      // Left boundary lollipop handle (Check-In)
      const leftPin = document.createElement('div');
      leftPin.className = 'hotel-pin pin-left';
      if (hotelStartX <= 25) {
        leftPin.classList.add('at-left-edge');
      }
      leftPin.dataset.handle = 'checkin';
      leftPin.dataset.night = stay.startNight.toString();

      const leftTooltip = document.createElement('div');
      leftTooltip.className = 'hotel-handle-tooltip';
      leftTooltip.textContent = formatHandleTime(startTiming.checkIn);
      leftPin.appendChild(leftTooltip);
      block.appendChild(leftPin);

      // Hotel text
      const textSpan = document.createElement('span');
      textSpan.className = 'hotel-text';
      if (isBooked) {
        textSpan.textContent = hotelWidth < 88 ? 'BOOKED' : (isMultiNight ? `${bookedHotelName} (${stay.nights.length}N)` : bookedHotelName);
      } else {
        textSpan.textContent = hotelWidth < 78 ? 'NOT BOOKED' : (isMultiNight ? `HOTEL NOT BOOKED (${stay.nights.length} NIGHTS)` : 'HOTEL NOT BOOKED');
      }
      block.appendChild(textSpan);

      // Multi-night Split Stay button
      if (isMultiNight) {
        const splitBadge = document.createElement('button');
        splitBadge.type = 'button';
        splitBadge.className = 'hotel-stay-badge';
        splitBadge.title = `Click to separate into individual 1-night stays`;
        splitBadge.innerHTML = `<span>${stay.nights.length}N</span><span class="hotel-split-icon">&times;</span>`;
        splitBadge.addEventListener('click', (e) => {
          e.stopPropagation();
          unmergeHotelStay(stay);
        });
        block.appendChild(splitBadge);
      }

      // Right boundary lollipop handle (Check-Out)
      const rightPin = document.createElement('div');
      rightPin.className = 'hotel-pin pin-right';
      if (hotelEndX >= totalTrackWidth - 25) {
        rightPin.classList.add('at-right-edge');
      }
      rightPin.dataset.handle = 'checkout';
      rightPin.dataset.night = stay.endNight.toString();

      const rightTooltip = document.createElement('div');
      rightTooltip.className = 'hotel-handle-tooltip';
      rightTooltip.textContent = formatHandleTime(endTiming.checkOut);
      rightPin.appendChild(rightTooltip);
      block.appendChild(rightPin);

      // Setup drag listeners on leftPin and rightPin
      setupHandleDrag(leftPin, stay.startNight, 'checkin', block, textSpan, leftTooltip, stay);
      setupHandleDrag(rightPin, stay.endNight, 'checkout', block, textSpan, rightTooltip, stay);

      // Interactive click feedback: select night & switch to hotels tab
      // Clicking anywhere on the hotel block (including pins) selects the night.
      // Only the split-stay badge is excluded (it has its own stopPropagation handler).
      block.addEventListener('click', (e) => {
        if (e.target.closest('.hotel-stay-badge')) return;
        if (justFinishedHandleDrag) return; // Don't select after drag release

        // Force selection (never toggle off) — if already selected, just re-apply
        const alreadySelected = state.selectedPiece &&
          state.selectedPiece.type === 'night' &&
          state.selectedPiece.index === stay.startNight;
        if (alreadySelected) {
          // Already selected: just ensure sidebar is on hotels tab, don't toggle off
          switchSideTab('hotels');
          applySelectionFrame();
        } else {
          setSelectedPiece('night', stay.startNight);
        }

        const startT = getHotelTiming(stay.startNight);
        const endT = getHotelTiming(stay.endNight);
        if (isMultiNight) {
          showToast(`Nights ${stay.startNight}–${stay.endNight} (${stay.nights.length} Nights): ${isBooked ? bookedHotelName : 'Hotel Not Booked'} • In: ${formatHandleTime(startT.checkIn)} • Out: ${formatHandleTime(endT.checkOut)}`);
        } else {
          showToast(`Night ${stay.startNight}: ${isBooked ? bookedHotelName : 'Hotel Not Booked'} • In: ${formatHandleTime(startT.checkIn)} • Out: ${formatHandleTime(endT.checkOut)}`);
        }
      });

      fragment.appendChild(block);
    }

    hotelsTrack.appendChild(fragment);
  }

  // =========================================================================
  // Video-Editing-Style Edge Auto-Scroll Engine (Premiere Pro / After Effects)
  // =========================================================================
  let autoScrollRafId = null;

  /**
   * Computes edge auto-scroll velocity based on pointer clientX relative to the scroll container.
   * Returns a speed in px per frame (positive = scroll right, negative = scroll left).
   */
  function computeEdgeScrollSpeed(clientX) {
    if (!timelineScrollContainer) return 0;
    const containerRect = timelineScrollContainer.getBoundingClientRect();
    const edgeZone = 80; // Distance in pixels from viewport edge where auto-scroll engages
    const maxSpeed = 16; // Maximum pixels per frame

    // Right edge zone: auto-scroll forward in time
    if (clientX > containerRect.right - edgeZone) {
      const distance = clientX - (containerRect.right - edgeZone);
      const factor = Math.min(2.5, Math.max(0.2, distance / edgeZone));
      return factor * maxSpeed;
    }

    // Left edge zone: auto-scroll backward in time
    if (clientX < containerRect.left + edgeZone) {
      const distance = (containerRect.left + edgeZone) - clientX;
      const factor = Math.min(2.5, Math.max(0.2, distance / edgeZone));
      return -factor * maxSpeed;
    }

    return 0;
  }

  /**
   * Runs continuous requestAnimationFrame loop for auto-scrolling while dragging.
   */
  function startAutoScroll(getSpeedFn, onStepFn) {
    stopAutoScroll();

    function step() {
      if (!isDraggingIndicator && !activeHandleDrag) {
        stopAutoScroll();
        return;
      }

      const speed = getSpeedFn();
      if (Math.abs(speed) > 0.05 && timelineScrollContainer) {
        const maxScroll = timelineScrollContainer.scrollWidth - timelineScrollContainer.clientWidth;
        const prevScroll = timelineScrollContainer.scrollLeft;
        const newScroll = Math.max(0, Math.min(maxScroll, prevScroll + speed));

        if (Math.abs(newScroll - prevScroll) > 0.05) {
          timelineScrollContainer.scrollLeft = newScroll;
        }

        if (onStepFn) {
          onStepFn();
        }

        autoScrollRafId = requestAnimationFrame(step);
      } else {
        stopAutoScroll();
      }
    }

    autoScrollRafId = requestAnimationFrame(step);
  }

  function stopAutoScroll() {
    if (autoScrollRafId) {
      cancelAnimationFrame(autoScrollRafId);
      autoScrollRafId = null;
    }
  }

  let lastHandleClientX = 0;

  /**
   * Attaches drag listeners to a check-in or check-out lollipop handle.
   */
  function setupHandleDrag(handleEl, nightNum, handleType, blockEl, textSpan, tooltipEl, stay) {
    function onHandleStart(e) {
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      handleEl.classList.add('is-dragging');
      tooltipEl.classList.add('visible');
      tooltipEl.classList.add('is-active-drag-tooltip');
      if (hotelsTrack) hotelsTrack.classList.add('is-handle-dragging');

      activeHandleDrag = {
        handleEl,
        nightNum,
        handleType,
        blockEl,
        textSpan,
        tooltipEl,
        stay
      };
      lastHandleClientX = e.touches ? e.touches[0].clientX : e.clientX;
    }

    handleEl.addEventListener('mousedown', onHandleStart);
    handleEl.addEventListener('touchstart', onHandleStart, { passive: false });
  }

  /**
   * Updates check-in / check-out handle position and hotel block geometry from mouse clientX.
   * If a check-out handle overlaps with next night's check-in (or vice versa), magnetically snaps
   * and prepares to merge the hotel stays.
   */
  function updateHandleFromClientX(clientX) {
    if (!activeHandleDrag) return;

    const { handleEl, nightNum, handleType, blockEl, textSpan, tooltipEl, stay } = activeHandleDrag;
    const graphicArea = document.querySelector('.timeline-graphic-area');
    if (!graphicArea) return;

    const rect = graphicArea.getBoundingClientRect();
    const mouseRelX = clientX - rect.left;

    const currentDayW = Math.round(STANDARD_DAY_WIDTH * state.zoom);
    const currentNightW = Math.round(NIGHT_SQUARE_WIDTH * state.zoom);
    const day1Width = calculateDay1Width();
    const totalTrackWidth = parseFloat(hotelsTrack.style.width) || 0;

    const currentStay = stay || getStayForNight(nightNum) || { startNight: nightNum, endNight: nightNum, nights: [nightNum] };

    const startNightIndex = currentStay.startNight - 1;
    const endNightIndex = currentStay.endNight - 1;

    const nightStartX = day1Width + startNightIndex * (currentDayW + currentNightW);
    const nightEndX = day1Width + endNightIndex * (currentDayW + currentNightW) + currentNightW;

    const startTiming = getHotelTiming(currentStay.startNight);
    const endTiming = getHotelTiming(currentStay.endNight);

    if (handleType === 'checkin') {
      // Check-in on Day currentStay.startNight (06:00 to 18:00)
      const diffX = nightStartX - mouseRelX;
      const hoursBeforeNight = (diffX / currentDayW) * 12.0;
      let rawHours = 18.0 - hoursBeforeNight;

      // Snap to 30 minutes (0.5 hour)
      let snapped = Math.round(rawHours * 2) / 2;

      let minH = 6.0;
      let maxH = 17.5;
      let canMerge = false;
      let mergeNightA = null;
      let mergeNightB = null;

      if (currentStay.startNight > 1) {
        const prevNightNum = currentStay.startNight - 1;
        const prevTiming = getHotelTiming(prevNightNum);
        const targetCheckOut = prevTiming.checkOut || 10.0;

        // When dragging backwards to meet previous hotel's check-out time
        if (rawHours <= targetCheckOut + 0.5) {
          snapped = targetCheckOut;
          canMerge = true;
          mergeNightA = prevNightNum;
          mergeNightB = currentStay.startNight;
        } else {
          minH = Math.max(6.0, targetCheckOut);
          snapped = Math.min(maxH, Math.max(minH, snapped));
        }
      } else {
        // Day 1 arrival time min limit
        const timeParts = state.arrivalTime.split(':');
        const arrHours = parseInt(timeParts[0] || '12', 10) + parseInt(timeParts[1] || '0', 10) / 60;
        if (arrHours < 18.0) {
          minH = Math.floor(arrHours * 2) / 2;
        }
        snapped = Math.min(maxH, Math.max(minH, snapped));
      }

      startTiming.checkIn = snapped;
      activeHandleDrag.canMerge = canMerge;
      activeHandleDrag.mergeNightA = mergeNightA;
      activeHandleDrag.mergeNightB = mergeNightB;

      // Recalculate block left and width
      const checkInOffset = Math.round(((18.0 - snapped) / 12.0) * currentDayW);
      let newLeft = nightStartX - checkInOffset;
      if (newLeft < 0) newLeft = 0;

      const checkOutOffset = Math.round(((endTiming.checkOut - 6.0) / 12.0) * currentDayW);
      let currentRight = nightEndX + checkOutOffset;
      if (currentRight > totalTrackWidth) currentRight = totalTrackWidth;

      const newWidth = currentRight - newLeft;
      blockEl.style.left = `${newLeft}px`;
      blockEl.style.width = `${newWidth}px`;

      if (newLeft <= 25) {
        handleEl.classList.add('at-left-edge');
      } else {
        handleEl.classList.remove('at-left-edge');
      }

      const formatted = formatHandleTime(snapped);
      if (canMerge) {
        const totalCombinedNights = (currentStay.nights ? currentStay.nights.length : 1) + 1;
        tooltipEl.textContent = ` Release to Merge (${totalCombinedNights} Nights)`;
        tooltipEl.classList.add('merge-hint');
        handleEl.classList.add('is-merge-ready');
        blockEl.classList.add('is-merge-ready');
      } else {
        tooltipEl.textContent = formatted;
        tooltipEl.classList.remove('merge-hint');
        handleEl.classList.remove('is-merge-ready');
        blockEl.classList.remove('is-merge-ready');
      }

    } else if (handleType === 'checkout') {
      // Check-out on Day currentStay.endNight + 1 (06:00 to 18:00)
      const diffX = mouseRelX - nightEndX;
      const hoursAfterNight = (diffX / currentDayW) * 12.0;
      let rawHours = 6.0 + hoursAfterNight;

      // Snap to 30 minutes (0.5 hour)
      let snapped = Math.round(rawHours * 2) / 2;

      const minH = 6.5;
      let maxH = 18.0;
      let canMerge = false;
      let mergeNightA = null;
      let mergeNightB = null;

      if (currentStay.endNight < state.nights) {
        const nextNightNum = currentStay.endNight + 1;
        const nextTiming = getHotelTiming(nextNightNum);
        const targetCheckIn = nextTiming.checkIn || 14.0;

        // When dragging forward to meet next hotel's check-in time
        if (rawHours >= targetCheckIn - 0.5) {
          snapped = targetCheckIn;
          canMerge = true;
          mergeNightA = currentStay.endNight;
          mergeNightB = nextNightNum;
        } else {
          maxH = Math.min(18.0, targetCheckIn);
          snapped = Math.min(maxH, Math.max(minH, snapped));
        }
      } else {
        snapped = Math.min(maxH, Math.max(minH, snapped));
      }

      endTiming.checkOut = snapped;
      activeHandleDrag.canMerge = canMerge;
      activeHandleDrag.mergeNightA = mergeNightA;
      activeHandleDrag.mergeNightB = mergeNightB;

      // Recalculate block width
      const checkInOffset = Math.round(((18.0 - startTiming.checkIn) / 12.0) * currentDayW);
      let currentLeft = nightStartX - checkInOffset;
      if (currentLeft < 0) currentLeft = 0;

      const checkOutOffset = Math.round(((snapped - 6.0) / 12.0) * currentDayW);
      let newRight = nightEndX + checkOutOffset;
      if (newRight > totalTrackWidth) newRight = totalTrackWidth;

      const newWidth = newRight - currentLeft;
      blockEl.style.width = `${newWidth}px`;

      if (newRight >= totalTrackWidth - 25) {
        handleEl.classList.add('at-right-edge');
      } else {
        handleEl.classList.remove('at-right-edge');
      }

      const formatted = formatHandleTime(snapped);
      if (canMerge) {
        const totalCombinedNights = (currentStay.nights ? currentStay.nights.length : 1) + 1;
        tooltipEl.textContent = ` Release to Merge (${totalCombinedNights} Nights)`;
        tooltipEl.classList.add('merge-hint');
        handleEl.classList.add('is-merge-ready');
        blockEl.classList.add('is-merge-ready');
      } else {
        tooltipEl.textContent = formatted;
        tooltipEl.classList.remove('merge-hint');
        handleEl.classList.remove('is-merge-ready');
        blockEl.classList.remove('is-merge-ready');
      }
    }
  }

  function checkHandleAutoScroll() {
    if (!activeHandleDrag) {
      stopAutoScroll();
      return;
    }

    const speed = computeEdgeScrollSpeed(lastHandleClientX);
    if (Math.abs(speed) > 0.05) {
      if (!autoScrollRafId) {
        startAutoScroll(
          () => activeHandleDrag ? computeEdgeScrollSpeed(lastHandleClientX) : 0,
          () => updateHandleFromClientX(lastHandleClientX)
        );
      }
    } else {
      if (autoScrollRafId) {
        stopAutoScroll();
      }
    }
  }

  /**
   * Handles dragging movements for check-in and check-out handles across the timeline.
   */
  function handleHandlePointerMove(e) {
    if (!activeHandleDrag) return;
    e.preventDefault();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    lastHandleClientX = clientX;

    updateHandleFromClientX(clientX);
    checkHandleAutoScroll();
  }

  /**
   * Finishes dragging of check-in / check-out handles.
   * If a merge was targeted by overlapping handles, executes the merge.
   */
  function handleHandlePointerEnd() {
    if (activeHandleDrag) {
      const { canMerge, mergeNightA, mergeNightB, handleEl, tooltipEl, blockEl } = activeHandleDrag;
      handleEl.classList.remove('is-dragging');
      handleEl.classList.remove('is-merge-ready');
      if (blockEl) blockEl.classList.remove('is-merge-ready');
      tooltipEl.classList.remove('visible');
      tooltipEl.classList.remove('merge-hint');
      tooltipEl.classList.remove('is-active-drag-tooltip');
      if (hotelsTrack) hotelsTrack.classList.remove('is-handle-dragging');
      stopAutoScroll();

      if (canMerge && mergeNightA && mergeNightB) {
        activeHandleDrag = null;
        executeMergeHotelNights(mergeNightA, mergeNightB);
        return;
      }

      activeHandleDrag = null;
      justFinishedHandleDrag = true;
      setTimeout(() => { justFinishedHandleDrag = false; }, 100);
    }
  }

  /**
   * Toast notification
   */
  function showToast(message) {
    if (!toastEl) return;
    toastEl.querySelector('.toast-message').textContent = message;
    toastEl.classList.add('show');
    setTimeout(() => {
      toastEl.classList.remove('show');
    }, 3200);
  }

  /**
   * Generates a discrete list of 30-minute interval points covering the entire timeline.
   * Day 1 starts at arrival time (snapped to 30m) and progresses across all days and nights.
   */
  function buildTimelineTimePoints() {
    const totalDays = state.days;
    const totalNights = state.nights;
    const currentDayW = Math.round(STANDARD_DAY_WIDTH * state.zoom);
    const currentNightW = Math.round(NIGHT_SQUARE_WIDTH * state.zoom);
    const day1W = calculateDay1Width();

    const dateParts = state.arrivalDate.split('-');
    const startYear = parseInt(dateParts[0], 10);
    const startMonth = parseInt(dateParts[1], 10) - 1;
    const startDay = parseInt(dateParts[2], 10);

    const timeParts = state.arrivalTime.split(':');
    let arrH = parseInt(timeParts[0] || '12', 10);
    let arrM = parseInt(timeParts[1] || '0', 10);
    arrM = arrM >= 30 ? 30 : 0; // Snap arrival minute to 00 or 30

    const points = [];

    function addPoint(x, dateMeta, dayNum, h24, m) {
      const rx = Math.round(x);
      if (points.length > 0 && points[points.length - 1].x === rx) {
        return;
      }
      const time12 = format12h(h24, m);
      const tooltip = `Day ${dayNum} • ${dateMeta.monthName} ${dateMeta.dayNumber} (${dateMeta.dayOfWeek}) • ${time12}`;
      points.push({ x: rx, dayNumber: dayNum, h24, m, time12, tooltip });
    }

    const d1Meta = getFastDateMeta(new Date(startYear, startMonth, startDay));
    if (arrH < 18) {
      const totalMinutes = (18 - arrH) * 60 - arrM;
      const numSlots = Math.max(1, Math.round(totalMinutes / 30));
      for (let s = 0; s <= numSlots; s++) {
        const x = (s / numSlots) * day1W;
        const curM = arrH * 60 + arrM + s * 30;
        addPoint(x, d1Meta, 1, Math.floor(curM / 60), curM % 60);
      }
    } else {
      const totalMinutes = (24 - arrH) * 60 - arrM;
      const numSlots = Math.max(1, Math.round(totalMinutes / 30));
      const targetX = day1W + (totalNights > 0 ? (currentNightW / 2) : 0);
      for (let s = 0; s <= numSlots; s++) {
        const x = (s / numSlots) * targetX;
        const curM = arrH * 60 + arrM + s * 30;
        addPoint(x, d1Meta, 1, Math.floor(curM / 60) % 24, curM % 60);
      }
    }

    // Night 1 (if daytime arrival)
    if (arrH < 18 && totalNights > 0) {
      for (let s = 0; s <= 12; s++) {
        const x = day1W + (s / 24) * currentNightW;
        const curH = 18 + Math.floor(s / 2);
        const curM = (s % 2) * 30;
        addPoint(x, d1Meta, 1, curH % 24, curM);
      }
      const d2Meta = getFastDateMeta(new Date(startYear, startMonth, startDay + 1));
      for (let s = 12; s <= 24; s++) {
        const x = day1W + (s / 24) * currentNightW;
        const curH = Math.floor((s - 12) / 2);
        const curM = ((s - 12) % 2) * 30;
        addPoint(x, d2Meta, 2, curH, curM);
      }
    } else if (arrH >= 18 && totalNights > 0) {
      const midX = day1W + (currentNightW / 2);
      const d2Meta = getFastDateMeta(new Date(startYear, startMonth, startDay + 1));
      for (let s = 0; s <= 12; s++) {
        const x = midX + (s / 12) * (currentNightW / 2);
        const curH = Math.floor(s / 2);
        const curM = (s % 2) * 30;
        addPoint(x, d2Meta, 2, curH, curM);
      }
    }

    // Days 2+
    for (let i = 1; i < totalDays; i++) {
      const dayIndex = i + 1;
      const dayMeta = getFastDateMeta(new Date(startYear, startMonth, startDay + i));
      const dayStartX = day1W + currentNightW + (i - 1) * (currentDayW + currentNightW);
      for (let s = 0; s <= 24; s++) {
        const x = dayStartX + (s / 24) * currentDayW;
        const curH = 6 + Math.floor(s / 2);
        const curM = (s % 2) * 30;
        addPoint(x, dayMeta, dayIndex, curH, curM);
      }
      if (i < totalNights) {
        const nightStartX = dayStartX + currentDayW;
        for (let s = 0; s <= 12; s++) {
          const x = nightStartX + (s / 24) * currentNightW;
          const curH = 18 + Math.floor(s / 2);
          const curM = (s % 2) * 30;
          addPoint(x, dayMeta, dayIndex, curH % 24, curM);
        }
        const nextMeta = getFastDateMeta(new Date(startYear, startMonth, startDay + i + 1));
        for (let s = 12; s <= 24; s++) {
          const x = nightStartX + (s / 24) * currentNightW;
          const curH = Math.floor((s - 12) / 2);
          const curM = ((s - 12) % 2) * 30;
          addPoint(x, nextMeta, dayIndex + 1, curH, curM);
        }
      }
    }

    return points;
  }

  let isDraggingIndicator = false;
  let lastIndicatorClientX = 0;

  /**
   * Updates indicator playhead position from cursor clientX coordinate.
   */
  function updateIndicatorFromClientX(clientX) {
    const graphicArea = document.querySelector('.timeline-graphic-area');
    if (!graphicArea) return;

    const rect = graphicArea.getBoundingClientRect();
    const mouseRelX = clientX - rect.left;

    const points = buildTimelineTimePoints();
    if (!points || points.length === 0) return;

    let closest = points[0];
    let minDiff = Math.abs(mouseRelX - points[0].x);
    for (let i = 1; i < points.length; i++) {
      const diff = Math.abs(mouseRelX - points[i].x);
      if (diff < minDiff) {
        minDiff = diff;
        closest = points[i];
      }
    }

    state.indicatorPoint = closest;
    updateIndicatorPosition(closest);
  }

  function checkIndicatorAutoScroll() {
    if (!isDraggingIndicator) {
      stopAutoScroll();
      return;
    }

    const speed = computeEdgeScrollSpeed(lastIndicatorClientX);
    if (Math.abs(speed) > 0.05) {
      if (!autoScrollRafId) {
        startAutoScroll(
          () => isDraggingIndicator ? computeEdgeScrollSpeed(lastIndicatorClientX) : 0,
          () => updateIndicatorFromClientX(lastIndicatorClientX)
        );
      }
    } else {
      if (autoScrollRafId) {
        stopAutoScroll();
      }
    }
  }

  /**
   * Sets up interactive click-and-drag for the time indicator playhead.
   * Snaps in 30-minute intervals across the entire timeline with video-editing-style auto-scroll.
   */
  function setupTimeIndicator() {
    if (!arrivalMarker) return;

    let startIndicatorClientX = 0;
    let startIndicatorClientY = 0;
    let hasMovedIndicator = false;
    let indicatorStartTarget = null;

    function onIndicatorStart(e) {
      if (e.button !== undefined && e.button !== 0) return;
      indicatorStartTarget = e.target;
      startIndicatorClientX = e.touches ? e.touches[0].clientX : e.clientX;
      startIndicatorClientY = e.touches ? e.touches[0].clientY : e.clientY;
      lastIndicatorClientX = startIndicatorClientX;
      hasMovedIndicator = false;
      isDraggingIndicator = true;
      arrivalMarker.classList.add('is-dragging');
    }

    arrivalMarker.addEventListener('mousedown', onIndicatorStart);
    arrivalMarker.addEventListener('touchstart', onIndicatorStart, { passive: false });

    // Video editor timeline ruler scrubber: clicking or dragging on date header jumps & scrubs the indicator
    function onRulerStart(e) {
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      isDraggingIndicator = true;
      hasMovedIndicator = true;
      arrivalMarker.classList.add('is-dragging');
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      lastIndicatorClientX = clientX;
      updateIndicatorFromClientX(clientX);
      checkIndicatorAutoScroll();
    }

    if (dateHeaderTrack) {
      dateHeaderTrack.addEventListener('mousedown', onRulerStart);
      dateHeaderTrack.addEventListener('touchstart', onRulerStart, { passive: false });
    }

    function onIndicatorMove(e) {
      if (!isDraggingIndicator) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      if (!hasMovedIndicator) {
        if (Math.abs(clientX - startIndicatorClientX) > 3 || Math.abs(clientY - startIndicatorClientY) > 3) {
          hasMovedIndicator = true;
        }
      }

      if (hasMovedIndicator) {
        e.preventDefault();
        lastIndicatorClientX = clientX;
        updateIndicatorFromClientX(clientX);
        checkIndicatorAutoScroll();
      }
    }

    window.addEventListener('mousemove', onIndicatorMove);
    window.addEventListener('touchmove', onIndicatorMove, { passive: false });

    function onIndicatorEnd(e) {
      if (isDraggingIndicator) {
        isDraggingIndicator = false;
        arrivalMarker.classList.remove('is-dragging');
        stopAutoScroll();

        // If user tapped/clicked on the needle line without dragging, delegate click to the day or hotel track underneath
        if (!hasMovedIndicator && indicatorStartTarget && indicatorStartTarget.closest('.arrival-needle')) {
          const needleEl = arrivalMarker.querySelector('.arrival-needle');
          if (needleEl) needleEl.style.pointerEvents = 'none';
          const clientX = (e && e.clientX !== undefined) ? e.clientX : lastIndicatorClientX;
          const clientY = (e && e.clientY !== undefined) ? e.clientY : startIndicatorClientY;
          const elementUnder = document.elementFromPoint(clientX, clientY);
          if (needleEl) needleEl.style.pointerEvents = 'auto';

          if (elementUnder) {
            const selectable = elementUnder.closest('.day-segment, .night-square, .hotel-block');
            if (selectable) {
              selectable.click();
            }
          }
        }
      }
    }

    window.addEventListener('mouseup', onIndicatorEnd);
    window.addEventListener('touchend', onIndicatorEnd);
    window.addEventListener('blur', onIndicatorEnd);
  }

  function updateIndicatorPosition(point) {
    if (!arrivalMarker || !point) return;
    arrivalMarker.style.left = `${point.x}px`;
    if (arrivalBadgeText) {
      arrivalBadgeText.textContent = point.time12;
      arrivalBadgeText.title = point.tooltip;

      // Keep the badge fully visible inside the scroll boundary when at the far left edge
      const halfBadge = (arrivalBadgeText.offsetWidth || 78) / 2;
      if (point.x < halfBadge) {
        arrivalBadgeText.style.transform = `translateX(${halfBadge - point.x}px)`;
      } else {
        arrivalBadgeText.style.transform = 'none';
      }
    }
    arrivalMarker.title = point.tooltip;
  }

  function syncTimeIndicator() {
    const points = buildTimelineTimePoints();
    if (!points || points.length === 0) return;

    if (state.indicatorPoint) {
      const match = points.find(p => p.dayNumber === state.indicatorPoint.dayNumber && p.h24 === state.indicatorPoint.h24 && p.m === state.indicatorPoint.m);
      state.indicatorPoint = match || points[0];
    } else {
      state.indicatorPoint = points[0];
    }
    updateIndicatorPosition(state.indicatorPoint);
  }

  /**
   * Export the timeline as a high-resolution PNG image including
   * arrival time pin, date header strip, and timeline bar.
   * Matches current zoom scale.
   */
  /**
   * Export the timeline as a high-resolution PNG image including
   * Left Labels Column, Date header strip, Day/Night track, and Hotels row.
   * Matches current zoom scale.
   */
  function exportTimelineAsImage() {
    const totalDays = state.days;
    const totalNights = state.nights;
    const currentDayW = Math.round(STANDARD_DAY_WIDTH * state.zoom);
    const currentNightW = Math.round(NIGHT_SQUARE_WIDTH * state.zoom);
    const day1Width = calculateDay1Width();

    // Left labels column width
    const labelWidth = 104;

    // Total track width = day1Width + ((totalDays - 1) * currentDayW) + (totalNights * currentNightW)
    const trackWidth = day1Width + ((totalDays - 1) * currentDayW) + (totalNights * currentNightW);
    const totalVisualWidth = labelWidth + trackWidth;
    const canvasWidth = Math.max(960, totalVisualWidth + 140);
    const canvasHeight = 470;

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth * 2; // retina 2x
    canvas.height = canvasHeight * 2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Title: "TIME LINE"
    ctx.fillStyle = '#1e293b';
    ctx.font = '800 26px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('TIME LINE', canvasWidth / 2, 35);

    // Geometry layout
    const startX = (canvasWidth - totalVisualWidth) / 2;
    const tracksStartX = startX + labelWidth;
    const dateHeaderY = 135;
    const headerHeight = 34;
    const dayBarY = dateHeaderY + headerHeight;
    const dayBarHeight = 36;
    const hotelsBarY = dayBarY + dayBarHeight;
    const hotelsBarHeight = 40;
    const totalRowsHeight = headerHeight + dayBarHeight + hotelsBarHeight;

    // 0. Draw Left Labels Column (DATE :, DAY :, HOTELS :)
    ctx.fillStyle = '#71767e';
    ctx.fillRect(startX, dateHeaderY, labelWidth, totalRowsHeight);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(startX, dateHeaderY, labelWidth, headerHeight);
    ctx.strokeRect(startX, dayBarY, labelWidth, dayBarHeight);
    ctx.strokeRect(startX, hotelsBarY, labelWidth, hotelsBarHeight);

    // Dividing border between labels column and graphic area
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tracksStartX, dateHeaderY);
    ctx.lineTo(tracksStartX, hotelsBarY + hotelsBarHeight);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('DATE :', tracksStartX - 10, dateHeaderY + (headerHeight / 2));
    ctx.fillText('DAY :', tracksStartX - 10, dayBarY + (dayBarHeight / 2));
    ctx.fillText('HOTELS :', tracksStartX - 10, hotelsBarY + (hotelsBarHeight / 2));

    // 1. Draw Date Header Strip
    const dateParts = state.arrivalDate.split('-');
    const year = parseInt(dateParts[0], 10);
    const monthIndex = parseInt(dateParts[1], 10) - 1;
    const startDay = parseInt(dateParts[2], 10);

    let currCellX = tracksStartX;
    for (let i = 0; i < totalDays; i++) {
      const currentDayDate = new Date(year, monthIndex, startDay + i);
      const monthName = currentDayDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      const dayNumber = currentDayDate.getDate();
      const dayOfWeek = currentDayDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

      const halfNight = totalNights > 0 ? (currentNightW / 2) : 0;
      let cellW = 0;
      if (i === 0) {
        cellW = day1Width + halfNight;
      } else if (i < totalNights && i < totalDays - 1) {
        cellW = currentDayW + currentNightW;
      } else if (i < totalNights && i === totalDays - 1) {
        cellW = halfNight + currentDayW + currentNightW;
      } else {
        cellW = halfNight + currentDayW;
      }

      // Background of date cell
      ctx.fillStyle = '#d2d6dc';
      ctx.fillRect(currCellX, dateHeaderY, cellW, headerHeight);

      // Top and right borders
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(currCellX, dateHeaderY, cellW, headerHeight);

      // Text inside date cell
      ctx.font = '800 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (cellW < 65) {
        ctx.fillStyle = '#0f172a';
        ctx.fillText(`${monthName} ${dayNumber}`, currCellX + (cellW / 2), dateHeaderY + (headerHeight / 2));
      } else {
        // Date in black, Day of week in coral red
        const dateStr = `${monthName} ${dayNumber} `;
        const dowStr = dayOfWeek;
        const dateWidth = ctx.measureText(dateStr).width;
        ctx.font = '900 11px "Plus Jakarta Sans", sans-serif';
        const dowWidth = ctx.measureText(dowStr).width;
        const totalTextW = dateWidth + dowWidth;
        const textStartX = currCellX + (cellW / 2) - (totalTextW / 2);

        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'left';
        ctx.fillText(dateStr, textStartX, dateHeaderY + (headerHeight / 2));

        ctx.fillStyle = '#d24d44';
        ctx.fillText(dowStr, textStartX + dateWidth, dateHeaderY + (headerHeight / 2));
      }

      currCellX += cellW;
    }

    // 2. Draw Blue & Green Timeline Track
    let currentX = tracksStartX;
    const maxSteps = Math.max(totalDays, totalNights);

    for (let i = 0; i < maxSteps; i++) {
      // Day Segment
      if (i < totalDays) {
        const segW = (i === 0) ? day1Width : currentDayW;
        ctx.fillStyle = '#5b82f6';
        ctx.fillRect(currentX, dayBarY, segW, dayBarHeight);

        // Day Pill Badge
        if (state.filter === 'day' || state.filter === 'all') {
          const isCompact = segW < 50;
          const badgeText = isCompact ? `D${i + 1}` : `DAY ${i + 1}`;
          const badgeW = isCompact ? 22 : 62;
          const badgeH = 18;
          const badgeX = currentX + (segW / 2) - (badgeW / 2);
          const badgeY = dayBarY + (dayBarHeight / 2) - (badgeH / 2);

          // White pill background
          drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 9);
          ctx.fillStyle = '#ffffff';
          ctx.fill();

          // Navy bold text
          ctx.fillStyle = '#1e3a8a';
          ctx.font = '800 10px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(badgeText, currentX + (segW / 2), dayBarY + (dayBarHeight / 2));
        }

        currentX += segW;
      }

      // Night Segment (Square)
      if (i < totalNights) {
        ctx.fillStyle = '#c8f53c';
        ctx.fillRect(currentX, dayBarY, currentNightW, dayBarHeight);
        currentX += currentNightW;
      }
    }

    // 3. Draw Hotels Track (Row 3)
    ctx.fillStyle = '#cbd0d5';
    ctx.fillRect(tracksStartX, hotelsBarY, trackWidth, hotelsBarHeight);

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(tracksStartX, hotelsBarY, trackWidth, hotelsBarHeight);

    const canvasHotelStays = getHotelStays();
    for (const stay of canvasHotelStays) {
      const startNightIndex = stay.startNight - 1;
      const endNightIndex = stay.endNight - 1;

      const nightStartX = tracksStartX + day1Width + startNightIndex * (currentDayW + currentNightW);
      const nightEndX = tracksStartX + day1Width + endNightIndex * (currentDayW + currentNightW) + currentNightW;

      const startTiming = getHotelTiming(stay.startNight);
      const endTiming = getHotelTiming(stay.endNight);

      const checkInOffset = Math.round(((18.0 - startTiming.checkIn) / 12.0) * currentDayW);
      const checkOutOffset = Math.round(((endTiming.checkOut - 6.0) / 12.0) * currentDayW);

      let hotelStartX = nightStartX - checkInOffset;
      if (hotelStartX < tracksStartX) {
        hotelStartX = tracksStartX;
      }

      let hotelEndX = nightEndX + checkOutOffset;
      if (hotelEndX > tracksStartX + trackWidth) {
        hotelEndX = tracksStartX + trackWidth;
      }

      const hotelW = hotelEndX - hotelStartX;
      if (hotelW > 0) {
        const isMultiNight = stay.nights.length > 1;
        const isBooked = stay.nights.some(n => state.hotelBookings && state.hotelBookings[n]);
        const bookedHotelName = isBooked ? (stay.nights.map(n => state.hotelBookings && state.hotelBookings[n]).find(Boolean)) : null;

        // Block background
        ctx.fillStyle = isBooked ? 'rgba(16, 185, 129, 0.85)' : 'rgba(207, 125, 99, 0.85)';
        ctx.fillRect(hotelStartX, hotelsBarY, hotelW, hotelsBarHeight);

        // Top and bottom borders
        ctx.strokeStyle = isBooked ? '#059669' : '#b84a3b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(hotelStartX, hotelsBarY);
        ctx.lineTo(hotelStartX + hotelW, hotelsBarY);
        ctx.moveTo(hotelStartX, hotelsBarY + hotelsBarHeight);
        ctx.lineTo(hotelStartX + hotelW, hotelsBarY + hotelsBarHeight);
        ctx.stroke();

        // Hotel text
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 9.5px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let displayText = '';
        if (isBooked) {
          displayText = hotelW < 68 ? 'BOOKED' : (isMultiNight ? `${bookedHotelName} (${stay.nights.length}N)` : bookedHotelName);
        } else {
          displayText = hotelW < 68 ? 'NOT BOOKED' : (isMultiNight ? `HOTEL NOT BOOKED (${stay.nights.length}N)` : 'HOTEL NOT BOOKED');
        }
        ctx.fillText(displayText, hotelStartX + (hotelW / 2), hotelsBarY + (hotelsBarHeight / 2));

        // Lollipop Boundary Pins (vertical pin line + bottom circular dot)
        const pinColor = isBooked ? '#059669' : '#c54d40';
        ctx.strokeStyle = pinColor;
        ctx.fillStyle = pinColor;
        ctx.lineWidth = 2;

        // Left pin
        ctx.beginPath();
        ctx.moveTo(hotelStartX, hotelsBarY);
        ctx.lineTo(hotelStartX, hotelsBarY + hotelsBarHeight + 6);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(hotelStartX, hotelsBarY + hotelsBarHeight + 6, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Right pin
        ctx.beginPath();
        ctx.moveTo(hotelStartX + hotelW, hotelsBarY);
        ctx.lineTo(hotelStartX + hotelW, hotelsBarY + hotelsBarHeight + 6);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(hotelStartX + hotelW, hotelsBarY + hotelsBarHeight + 6, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. Draw Night Badges (Positioned cleanly below the Hotels row!)
    if (state.filter === 'night' || state.filter === 'all') {
      for (let i = 0; i < totalNights; i++) {
        const nightStartX = tracksStartX + day1Width + i * (currentDayW + currentNightW);
        const badgeCenter = nightStartX + (currentNightW / 2);
        const badgeTop = hotelsBarY + hotelsBarHeight + 10;
        const badgeWidth = 78;
        const badgeHeight = 28;
        const badgeRadius = 10;
        const badgeX = badgeCenter - (badgeWidth / 2);

        // Upward arrow pointer pointing to the hotels track
        ctx.fillStyle = '#0d0d0d';
        ctx.beginPath();
        ctx.moveTo(badgeCenter, hotelsBarY + hotelsBarHeight);
        ctx.lineTo(badgeCenter - 7, badgeTop);
        ctx.lineTo(badgeCenter + 7, badgeTop);
        ctx.closePath();
        ctx.fill();

        // Rounded badge bubble
        drawRoundedRect(ctx, badgeX, badgeTop, badgeWidth, badgeHeight, badgeRadius);
        ctx.fillStyle = '#0d0d0d';
        ctx.fill();

        // Badge text - ALWAYS NUMBERED
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 12px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`NIGHT ${i + 1}`, badgeCenter, badgeTop + (badgeHeight / 2));
      }
    }

    // 5. Draw Red Arrival / Time Indicator Marker (Images 1, 2, 3)
    const markerOffset = state.indicatorPoint ? state.indicatorPoint.x : 0;
    const pinX = tracksStartX + markerOffset;
    const formattedTime = state.indicatorPoint ? state.indicatorPoint.time12 : format12HourTime(state.arrivalTime);
    const badgeW = 78;
    const badgeH = 26;
    const badgeY = dateHeaderY - 48;
    const badgeLeft = pinX - (badgeW / 2);

    // Badge
    drawRoundedRect(ctx, badgeLeft, badgeY, badgeW, badgeH, 7);
    ctx.fillStyle = '#d24d44';
    ctx.fill();

    // Badge Text
    ctx.fillStyle = '#0d0d0d';
    ctx.font = '900 12px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(formattedTime, pinX, badgeY + (badgeH / 2));

    // Diamond pointer
    ctx.save();
    ctx.translate(pinX, badgeY + badgeH + 4);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#d24d44';
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();

    // Needle line extending through Date, Day, and Hotels rows all the way to the bottom
    ctx.fillStyle = '#d24d44';
    ctx.fillRect(pinX - 1.75, badgeY + badgeH + 8, 3.5, totalRowsHeight + 16);

    // Watermark
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Created with SunBird Sri Lanka', canvasWidth - 30, canvasHeight - 20);

    // Download image
    const link = document.createElement('a');
    link.download = `SunBird-Timeline-${state.days}D-${state.nights}N-${formattedTime.replace(/[\s:]/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    showToast('Timeline exported as PNG image!');
  }

  function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Itinerary Information: Tourists & Room Allocations
  // (media_1789981633996.png, media_1789981642137.png, media_1789984716153.png)
  // ═══════════════════════════════════════════════════════════════════════════

  function setupTouristsAndRooms() {
    // 1. Tourist Stepper Controls
    if (touristsDecBtn) {
      touristsDecBtn.addEventListener('click', () => {
        changeTourists(state.touristsCount - 1);
      });
    }

    if (touristsIncBtn) {
      touristsIncBtn.addEventListener('click', () => {
        changeTourists(state.touristsCount + 1);
      });
    }

    if (touristsInput) {
      touristsInput.addEventListener('change', (e) => {
        const val = parseInt(e.target.value, 10);
        changeTourists(isNaN(val) ? 1 : val);
      });
      touristsInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val) && val >= 1) {
          state.touristsCount = val;
          updateTouristsBadge(true);
          updateTouristRoomSummary();
          if (window.vehicleShowcase) {
            window.vehicleShowcase.onPaxCountChanged(val);
          }
        }
      });
    }

    // 2. Room Type Dropdown Trigger
    if (roomTypeBtn) {
      roomTypeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleRoomTypeDropdown();
      });
    }

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (roomTypeDropdown && roomTypeDropdown.style.display !== 'none') {
        if (!roomTypeDropdown.contains(e.target) && e.target !== roomTypeBtn && !roomTypeBtn.contains(e.target)) {
          closeRoomTypeDropdown();
        }
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeRoomTypeDropdown();
      }
    });

    // 3. Dropdown Menu Items Selection
    if (roomTypeDropdown) {
      const dropdownItems = roomTypeDropdown.querySelectorAll('.itin-dropdown-item');
      dropdownItems.forEach((item) => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const roomType = item.dataset.roomType || 'Standard Single';
          const capacity = parseInt(item.dataset.capacity, 10) || 1;
          const price = parseInt(item.dataset.price, 10) || 0;
          const fullLabel = item.dataset.fullLabel || roomType;
          addRoom(roomType, capacity, price, fullLabel);
          closeRoomTypeDropdown();
        });
      });
    }

    // 4. Room Action Event Delegation (Copy & Delete)
    if (roomCardsContainer) {
      roomCardsContainer.addEventListener('click', (e) => {
        const actionBtn = e.target.closest('.itin-room-action-btn');
        if (!actionBtn) return;
        e.stopPropagation();
        const action = actionBtn.dataset.action;
        const roomId = actionBtn.dataset.roomId;
        if (action === 'copy') {
          duplicateRoom(roomId);
        } else if (action === 'delete') {
          deleteRoom(roomId);
        }
      });
    }

    // Initial sync
    updateTouristsBadge(false);
    updateTouristRoomSummary();
  }

  function changeTourists(newCount) {
    const clamped = Math.max(1, Math.min(999, newCount));
    state.touristsCount = clamped;
    if (touristsInput) {
      touristsInput.value = clamped;
    }
    updateTouristsBadge(true);
    renderRoomList();
    updateTouristRoomSummary();
    if (window.vehicleShowcase) {
      window.vehicleShowcase.onPaxCountChanged(clamped);
    }
  }

  function updateTouristsBadge(animate = true) {
    const totalCapacity = state.rooms ? state.rooms.reduce((acc, r) => acc + (r.capacity || 1), 0) : 0;
    const remaining = Math.max(0, state.touristsCount - totalCapacity);
    const booked = Math.min(state.touristsCount, totalCapacity);

    // 1. Update Remaining Badge
    if (touristsBadgeCount) {
      const prevVal = parseInt(touristsBadgeCount.textContent, 10);
      if (animate && !isNaN(prevVal) && prevVal !== remaining) {
        touristsBadgeCount.classList.remove('count-reducing');
        void touristsBadgeCount.offsetWidth;
        touristsBadgeCount.classList.add('count-reducing');
        setTimeout(() => {
          if (touristsBadgeCount) touristsBadgeCount.classList.remove('count-reducing');
        }, 280);
      }

      if (remaining === 0) {
        if (touristsBadgeLabel) touristsBadgeLabel.textContent = 'Status:';
        touristsBadgeCount.textContent = 'All Booked';
        touristsBadgeCount.classList.add('all-accommodated');
        if (touristsBadgeBox) touristsBadgeBox.classList.add('all-accommodated');
      } else {
        if (touristsBadgeLabel) touristsBadgeLabel.textContent = 'Remaining:';
        touristsBadgeCount.textContent = remaining;
        touristsBadgeCount.classList.remove('all-accommodated');
        if (touristsBadgeBox) touristsBadgeBox.classList.remove('all-accommodated');
      }
    }

    if (touristsBadgeBox) {
      if (remaining === 0) {
        touristsBadgeBox.title = `All ${state.touristsCount} tourists accommodated (${totalCapacity} total room capacity)`;
      } else {
        touristsBadgeBox.title = `${remaining} of ${state.touristsCount} tourists still need rooms (${totalCapacity} capacity assigned)`;
      }
    }

    // 2. Update Accommodation Progress Ratio Bar (Matching D/N style)
    if (paxBarBooked && paxBarRemaining) {
      const bookedFlex = booked > 0 ? booked : 0.001;
      const remainingFlex = remaining > 0 ? remaining : 0.001;
      paxBarBooked.style.flex = bookedFlex;
      paxBarRemaining.style.flex = remainingFlex;
      paxBarBooked.title = `${booked} Tourists Booked`;
      paxBarRemaining.title = `${remaining} Tourists Awaiting Rooms`;
      paxBarBooked.style.display = booked === 0 ? 'none' : 'block';
      paxBarRemaining.style.display = remaining === 0 ? 'none' : 'block';
    }

    if (paxLegendBookedText) {
      paxLegendBookedText.textContent = `${booked} Booked`;
    }
    if (paxLegendRemainingText) {
      paxLegendRemainingText.textContent = `${remaining} Remaining`;
    }
    if (paxLegendTotalText) {
      paxLegendTotalText.textContent = `Total: ${state.touristsCount} Pax`;
    }
  }

  function toggleRoomTypeDropdown() {
    if (!roomTypeDropdown) return;
    const isVisible = roomTypeDropdown.style.display !== 'none';
    if (isVisible) {
      closeRoomTypeDropdown();
    } else {
      openRoomTypeDropdown();
    }
  }

  function openRoomTypeDropdown() {
    if (!roomTypeDropdown) return;
    roomTypeDropdown.style.display = 'grid';
    if (roomTypeBtn) {
      roomTypeBtn.setAttribute('aria-expanded', 'true');
    }
  }

  function closeRoomTypeDropdown() {
    if (!roomTypeDropdown) return;
    roomTypeDropdown.style.display = 'none';
    if (roomTypeBtn) {
      roomTypeBtn.setAttribute('aria-expanded', 'false');
    }
  }

  function addRoom(type, capacity, price, fullLabel) {
    const newRoom = {
      id: 'room-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      type: type,
      capacity: capacity,
      price: price || 0,
      fullLabel: fullLabel || type
    };
    state.rooms.push(newRoom);
    renderRoomList();
    updateTouristsBadge(true);
    updateTouristRoomSummary();
    showToast(`Added ${type}`);
  }

  function duplicateRoom(roomId) {
    const idx = state.rooms.findIndex((r) => r.id === roomId);
    if (idx !== -1) {
      const orig = state.rooms[idx];
      const copy = {
        id: 'room-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        type: orig.type,
        capacity: orig.capacity,
        price: orig.price || 0,
        fullLabel: orig.fullLabel || orig.type
      };
      state.rooms.splice(idx + 1, 0, copy);
      renderRoomList();
      updateTouristsBadge(true);
      updateTouristRoomSummary();
      showToast(`Duplicated ${orig.type}`);
    }
  }

  function deleteRoom(roomId) {
    const idx = state.rooms.findIndex((r) => r.id === roomId);
    if (idx !== -1) {
      const removed = state.rooms.splice(idx, 1)[0];
      renderRoomList();
      updateTouristsBadge(true);
      updateTouristRoomSummary();
      showToast(`Removed ${removed.type}`);
    }
  }

  function renderRoomList() {
    if (!roomCardsContainer) return;

    if (!state.rooms || state.rooms.length === 0) {
      roomCardsContainer.innerHTML = '<div class="itin-room-empty">No rooms added. Use "Room Type" dropdown above to add rooms.</div>';
      return;
    }

    const copySvg = '<svg class="itin-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';

    const trashSvg = '<svg class="itin-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';

    let html = '';

    state.rooms.forEach((room) => {
      const occupantsCount = room.capacity || (room.type.includes('Double') || room.type.includes('Twin') ? 2 : (room.type.includes('Triple') ? 3 : (room.type.includes('Family') || room.type.includes('Quad') ? 4 : 1)));

      let personIconsHtml = '';
      for (let p = 0; p < occupantsCount; p++) {
        personIconsHtml += '<svg class="itin-person-icon-small" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 12c4.42 0 8 2.24 8 5v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1c0-2.76 3.58-5 8-5z"/></svg>';
      }

      const priceLabel = room.price ? `<span class="itin-room-price">$${room.price}/nt</span>` : '';

      html += `
        <div class="itin-room-item-row" data-room-id="${room.id}">
          <div class="itin-room-main-box">
            <div class="itin-room-info-left">
              <span class="itin-room-name">${escapeHtml(room.type)}</span>
              ${priceLabel}
            </div>
            <div class="itin-room-guests-wrap">
              <span class="itin-room-pax-pill" title="${occupantsCount} Guest${occupantsCount > 1 ? 's' : ''}">
                <span class="pax-pill-count">${occupantsCount}</span>
                <span class="pax-pill-icons">${personIconsHtml}</span>
              </span>
            </div>
          </div>
          <div class="itin-room-actions">
            <button type="button" class="itin-room-action-btn itin-room-copy-btn" title="Duplicate Room" data-action="copy" data-room-id="${room.id}">
              ${copySvg}
            </button>
            <button type="button" class="itin-room-action-btn itin-room-del-btn" title="Delete Room" data-action="delete" data-room-id="${room.id}">
              ${trashSvg}
            </button>
          </div>
        </div>
      `;
    });

    roomCardsContainer.innerHTML = html;
  }

  function updateTouristRoomSummary() {
    if (!touristRoomSummaryTag) return;
    const roomCount = state.rooms ? state.rooms.length : 0;
    const totalCap = state.rooms ? state.rooms.reduce((acc, r) => acc + (r.capacity || 1), 0) : 0;
    touristRoomSummaryTag.textContent = `${state.touristsCount} Tourists • ${roomCount} Rooms (${totalCap} Capacity)`;
  }



  // =========================================================================
  // ITINERARY MANAGEMENT & HUB LAUNCHER MODULE
  // =========================================================================

  const ITIN_STORAGE_KEY = 'sunbird_itineraries_v3';
  const ACTIVE_ITIN_KEY = 'sunbird_active_itin_id';

  const DEFAULT_ITINERARIES = [
    {
      id: 'itin-grand-14d',
      title: '14D / 13N Grand Ceylon Safari & Coastal Loop',
      createdAt: '2026-08-15T08:00:00Z',
      updatedAt: '2026-08-26T16:20:00Z',
      days: 14,
      nights: 13,
      arrivalDate: '2026-11-15',
      arrivalTime: '18:00',
      touristsCount: 16,
      routeMode: 'highway',
      status: 'READY',
      progress: 100,
      dayDestinations: ['Negombo', 'Anuradhapura', 'Trincomalee', 'Sigiriya', 'Kandy', 'Nuwara Eliya', 'Ella', 'Yala', 'Tangalle', 'Mirissa', 'Galle', 'Bentota', 'Colombo', 'Airport (BIA)'],
      hotelBookings: {
        1: 'Jetwing Beach',
        2: 'Ulagalla by Uga Escapes',
        3: 'Trinco Blu by Cinnamon',
        4: 'Heritance Kandalama',
        5: "Earl's Regency",
        6: 'Grand Hotel Nuwara Eliya',
        7: '98 Acres Resort & Spa',
        8: 'Cinnamon Wild Yala',
        9: 'Anantara Peace Haven Tangalle Resort',
        10: 'Weligama Bay Marriott Resort',
        11: 'Amangalla',
        12: 'Taj Bentota Resort & Spa',
        13: 'Cinnamon Grand Colombo'
      },
      rooms: [
        { id: 'room-g1', type: 'Family Suite', capacity: 4, price: 320 },
        { id: 'room-g2', type: 'Double Single', capacity: 2, price: 140 },
        { id: 'room-g3', type: 'Double Single', capacity: 2, price: 140 }
      ],
      distanceKm: 1105,
      mergedNights: {}
    },
    {
      id: 'itin-classic-8d',
      title: '8D / 7N Cultural Triangle & Hill Country Trek',
      createdAt: '2026-08-18T10:00:00Z',
      updatedAt: '2026-08-25T14:10:00Z',
      days: 8,
      nights: 7,
      arrivalDate: '2026-12-05',
      arrivalTime: '14:00',
      touristsCount: 12,
      routeMode: 'highway',
      status: 'IN_PROGRESS',
      progress: 75,
      dayDestinations: ['Colombo', 'Kandy', 'Sigiriya', 'Dambulla', 'Nuwara Eliya', 'Ella', 'Galle', 'Airport (BIA)'],
      hotelBookings: {
        1: 'Cinnamon Grand Colombo',
        2: "Earl's Regency",
        3: 'Heritance Kandalama',
        4: 'Heritance Kandalama',
        5: 'Grand Hotel Nuwara Eliya',
        6: '98 Acres Resort & Spa'
      },
      rooms: [
        { id: 'room-c1', type: 'Double Single', capacity: 2, price: 140 },
        { id: 'room-c2', type: 'Family Suite', capacity: 4, price: 300 }
      ],
      distanceKm: 685,
      mergedNights: {}
    },
    {
      id: 'itin-wildlife-6d',
      title: '6D / 5N Southern Wildlife & Surf Expedition',
      createdAt: '2026-08-20T09:30:00Z',
      updatedAt: '2026-08-24T11:45:00Z',
      days: 6,
      nights: 5,
      arrivalDate: '2026-11-28',
      arrivalTime: '16:00',
      touristsCount: 8,
      routeMode: 'scenic',
      status: 'DRAFT',
      progress: 50,
      dayDestinations: ['Negombo', 'Udawalawe', 'Yala', 'Mirissa', 'Galle', 'Airport (BIA)'],
      hotelBookings: {
        1: 'Jetwing Beach',
        2: 'Grand Udawalawe Safari Resort',
        3: 'Cinnamon Wild Yala'
      },
      rooms: [
        { id: 'room-w1', type: 'Double Single', capacity: 2, price: 140 }
      ],
      distanceKm: 490,
      mergedNights: {}
    },
    {
      id: 'itin-escape-3d',
      title: '3D / 2N Coastal Heritage & Bentota Escape',
      createdAt: '2026-08-22T13:00:00Z',
      updatedAt: '2026-08-23T15:20:00Z',
      days: 3,
      nights: 2,
      arrivalDate: '2026-10-10',
      arrivalTime: '11:00',
      touristsCount: 4,
      routeMode: 'highway',
      status: 'PLANNING',
      progress: 25,
      dayDestinations: ['Colombo', 'Bentota', 'Galle'],
      hotelBookings: {
        1: 'Taj Bentota Resort & Spa'
      },
      rooms: [
        { id: 'room-e1', type: 'Double Single', capacity: 2, price: 140 }
      ],
      distanceKm: 215,
      mergedNights: {}
    }
  ];

  let hubItineraries = [];
  let hubActiveItinId = null;
  let hubCurrentFilter = 'all';
  let hubCurrentSort = 'recent';
  let hubSearchQuery = '';
  let hubPendingDeleteId = null;
  let hubViewMode = 'grid';

  // Hub DOM Elements
  let screenHub, screenEditor;
  let hubSearchInput, hubSearchClearBtn, hubBtnNewItin;
  let statTotalItins, statTotalDays, statTotalRegions, hubBadgeCount;
  let hubFilterTabs, hubSortSelect, hubCardsGrid;
  let hubViewGridBtn, hubViewCompactBtn;
  let hubCreateModal, modalCreateCloseBtn, modalCreateCancelBtn, hubCreateForm;
  let createItinName;
  let hubDeleteModal, modalDeleteCloseBtn, modalDeleteCancelBtn, modalDeleteConfirmBtn, deleteTargetNameEl;
  let btnReturnHub, editorActiveTitleEl;

  function initItineraryHub() {
    // Cache Hub elements
    screenHub = document.getElementById('screen-hub');
    screenEditor = document.getElementById('screen-editor');
    hubSearchInput = document.getElementById('hub-search-input');
    hubSearchClearBtn = document.getElementById('hub-search-clear-btn');
    hubBtnNewItin = document.getElementById('hub-btn-new-itin');
    statTotalItins = document.getElementById('stat-total-itins');
    statTotalDays = document.getElementById('stat-total-days');
    statTotalRegions = document.getElementById('stat-total-regions');
    hubBadgeCount = document.getElementById('hub-badge-count');
    hubFilterTabs = document.querySelectorAll('.hub-duration-tab');
    hubSortSelect = document.getElementById('hub-sort-select');
    hubCardsGrid = document.getElementById('hub-cards-grid');
    hubViewGridBtn = document.getElementById('hub-view-grid-btn');
    hubViewCompactBtn = document.getElementById('hub-view-compact-btn');

    // Create Modal elements
    hubCreateModal = document.getElementById('hub-create-modal');
    modalCreateCloseBtn = document.getElementById('modal-create-close-btn');
    modalCreateCancelBtn = document.getElementById('modal-create-cancel-btn');
    hubCreateForm = document.getElementById('hub-create-form');
    createItinName = document.getElementById('create-itin-name');

    // Delete Modal elements
    hubDeleteModal = document.getElementById('hub-delete-modal');
    modalDeleteCloseBtn = document.getElementById('modal-delete-close-btn');
    modalDeleteCancelBtn = document.getElementById('modal-delete-cancel-btn');
    modalDeleteConfirmBtn = document.getElementById('modal-delete-confirm-btn');
    deleteTargetNameEl = document.getElementById('delete-itin-target-name');

    // Editor return button & title
    btnReturnHub = document.getElementById('btn-return-hub');
    editorActiveTitleEl = document.getElementById('editor-active-itin-title');

    // Load itineraries from storage
    loadItinerariesFromStorage();

    // Check saved active itinerary or default
    try {
      hubActiveItinId = localStorage.getItem(ACTIVE_ITIN_KEY) || (hubItineraries[0] ? hubItineraries[0].id : null);
    } catch (e) {
      hubActiveItinId = hubItineraries[0] ? hubItineraries[0].id : null;
    }

    const currentActive = hubItineraries.find(i => i.id === hubActiveItinId);
    if (currentActive) {
      state.title = currentActive.title || 'Custom Sri Lanka Tour';
      if (editorActiveTitleEl) editorActiveTitleEl.textContent = state.title;
    }

    setupHubEventListeners();
    renderHub();
  }

  function loadItinerariesFromStorage() {
    try {
      const raw = localStorage.getItem(ITIN_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          hubItineraries = parsed;
          hubItineraries.forEach(itin => {
            if (itin && Array.isArray(itin.dayDestinations)) {
              for (let d = 1; d < itin.dayDestinations.length; d++) {
                const cur = itin.dayDestinations[d];
                const prev = itin.dayDestinations[d - 1];
                const nightN = d + 1;
                const hasHotel = (itin.hotelBookings && itin.hotelBookings[nightN] && itin.hotelBookings[nightN] !== 'Selected Hotel' && !itin.hotelBookings[nightN].includes('Fill the Itinerary'));
                const hasCustomAttract = (itin.selectedAttractions && itin.selectedAttractions[d] && itin.selectedAttractions[d].some(a => a.custom));
                if (cur === 'Sigiriya' && (prev === 'Sigiriya' || prev === 'Anuradhapura') && !hasHotel && !hasCustomAttract) {
                  itin.dayDestinations[d] = '';
                  if (itin.selectedAttractions) itin.selectedAttractions[d] = [];
                }
              }
            }
          });
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to parse itineraries from localStorage, seeding defaults', e);
    }
    hubItineraries = JSON.parse(JSON.stringify(DEFAULT_ITINERARIES));
    saveItinerariesToStorage();
  }

  function saveItinerariesToStorage() {
    try {
      localStorage.setItem(ITIN_STORAGE_KEY, JSON.stringify(hubItineraries));
    } catch (e) {
      console.error('Failed to save itineraries to localStorage', e);
    }
  }

  function switchScreen(screenName) {
    if (screenName === 'editor') {
      if (screenHub) screenHub.style.display = 'none';
      if (screenEditor) screenEditor.style.display = 'block';
      window.dispatchEvent(new Event('resize'));
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        if (window.mapState && window.mapState.onWindowResize) {
          window.mapState.onWindowResize();
        }
        if (window.mapState && window.mapState.updateRoute) {
          window.mapState.updateRoute(state.dayDestinations.slice(0, state.days));
        }
      }, 50);
    } else {
      if (screenEditor) screenEditor.style.display = 'none';
      if (screenHub) screenHub.style.display = 'flex';
      renderHub();
    }
  }

  function openItineraryInEditor(itinId) {
    const itin = hubItineraries.find(item => item.id === itinId) || hubItineraries[0];
    if (!itin) return;

    hubActiveItinId = itin.id;
    try {
      localStorage.setItem(ACTIVE_ITIN_KEY, itin.id);
    } catch (e) {}

    // Synchronize to app's active state
    state.days = itin.days || 1;
    state.nights = Math.max(0, state.days - 1);
    state.arrivalDate = (itin.arrivalDate !== undefined) ? itin.arrivalDate : '';
    state.arrivalTime = (itin.arrivalTime !== undefined) ? itin.arrivalTime : '';
    state.touristsCount = (itin.touristsCount !== undefined) ? itin.touristsCount : 0;
    state.routeMode = itin.routeMode || 'highway';
    state.dayDestinations = itin.dayDestinations ? [...itin.dayDestinations] : Array(state.days).fill('');
    state.hotelBookings = itin.hotelBookings ? { ...itin.hotelBookings } : {};
    state.selectedHotelName = (itin.hotelBookings && itin.hotelBookings[1]) || '';
    state.selectedDestName = (state.dayDestinations && state.dayDestinations[0]) || '';
    state.mergedNights = itin.mergedNights ? { ...itin.mergedNights } : {};
    state.rooms = Array.isArray(itin.rooms) ? JSON.parse(JSON.stringify(itin.rooms)) : [];
    state.selectedAttractions = itin.selectedAttractions ? JSON.parse(JSON.stringify(itin.selectedAttractions)) : {};

    // Restore currency, vehicle, employees, hotel star rating
    state.currency = itin.currency || 'USD';
    state.selectedVehicle = itin.selectedVehicle || (state.touristsCount > 3 ? 'van' : 'car');
    state.vehicleName = itin.vehicleName || (state.selectedVehicle === 'van' ? 'Toyota HiAce Luxury KDH' : 'Toyota Prius Hybrid');
    state.employees = Array.isArray(itin.employees) ? JSON.parse(JSON.stringify(itin.employees)) : [];
    state.hotelStarFilter = itin.hotelStarFilter || '4';

    // Sanitize any dummy repeated placeholder destinations from old presets
    for (let d = 1; d < state.days; d++) {
      const cur = state.dayDestinations[d];
      const prev = state.dayDestinations[d - 1];
      const nightN = d + 1;
      const hasHotel = (state.hotelBookings && state.hotelBookings[nightN] && state.hotelBookings[nightN] !== 'Selected Hotel' && !state.hotelBookings[nightN].includes('Fill the Itinerary'));
      const hasCustomAttract = (state.selectedAttractions && state.selectedAttractions[d] && state.selectedAttractions[d].some(a => a.custom));
      if (cur === 'Sigiriya' && (prev === 'Sigiriya' || prev === 'Anuradhapura') && !hasHotel && !hasCustomAttract) {
        state.dayDestinations[d] = '';
        if (state.selectedAttractions) state.selectedAttractions[d] = [];
      }
    }

    // Ensure days with configured destinations have default attractions populated
    for (let d = 0; d < state.days; d++) {
      const dests = (typeof getDayDestinations === 'function') ? getDayDestinations(d) : (state.dayDestinations ? [state.dayDestinations[d]] : []);
      if (dests && dests.length > 0 && dests.some(x => x && typeof x === 'string' && x.trim() !== '')) {
        if (!state.selectedAttractions[d] || state.selectedAttractions[d].length === 0) {
          state.selectedAttractions[d] = getDefaultAttractionsForDay(d);
        }
      }
    }
    state.hotelMealPlans = itin.hotelMealPlans ? JSON.parse(JSON.stringify(itin.hotelMealPlans)) : {};
    state.nightMealPlans = itin.nightMealPlans ? JSON.parse(JSON.stringify(itin.nightMealPlans)) : {};
    state.hotelRoomCounts = itin.hotelRoomCounts ? JSON.parse(JSON.stringify(itin.hotelRoomCounts)) : {};
    state.hotelRoomTypes = itin.hotelRoomTypes ? JSON.parse(JSON.stringify(itin.hotelRoomTypes)) : {};
    state.expandedAttractionDays = { 0: true };
    state.expandedAttractionItems = itin.expandedAttractionItems || {};

    state.selectedPiece = { type: 'day', index: 1 };
    state.selectedDayIndex = 0;
    state.selectedDestSlot = 0;

    // Update Form Inputs
    if (daysInput) daysInput.value = state.days;
    if (nightsInput) nightsInput.value = state.nights;
    if (arrivalDateInput) arrivalDateInput.value = state.arrivalDate;
    if (arrivalTimeInput) arrivalTimeInput.value = state.arrivalTime;
    if (touristsInput) touristsInput.value = state.touristsCount;

    // Update active title in editor header
    state.title = itin.title || 'Custom Sri Lanka Tour';
    if (editorActiveTitleEl) {
      editorActiveTitleEl.textContent = state.title;
    }

    // Refresh UI
    updateUI();
    renderRoomList();
    updateTouristsBadge(true);
    updateTouristRoomSummary();
    updateTimelineDayStatusBar();
    renderActivityCards();
    if (typeof updateCurrencyUI === 'function') {
      updateCurrencyUI(false);
    }
    if (typeof renderEmployeeProfiles === 'function') {
      renderEmployeeProfiles();
    }
    if (typeof updateHotelRatingStarsUI === 'function') {
      updateHotelRatingStarsUI(parseInt(state.hotelStarFilter, 10) || 4);
    }
    if (window.vehicleShowcase && typeof window.vehicleShowcase.selectVehicle === 'function') {
      window.vehicleShowcase.selectVehicle(state.selectedVehicle, true);
    }
    syncLiveItineraryToStorage();

    // Switch screen to editor
    switchScreen('editor');
    showToast(`Loaded ${itin.title}`);
  }

  function saveCurrentItineraryToStorage() {
    if (!hubActiveItinId) return;
    const itin = hubItineraries.find(item => item.id === hubActiveItinId);
    if (!itin) return;

    if (state.title) itin.title = state.title;
    itin.days = state.days;
    itin.nights = Math.max(0, state.days - 1);
    itin.arrivalDate = state.arrivalDate;
    itin.arrivalTime = state.arrivalTime;
    itin.touristsCount = state.touristsCount;
    itin.routeMode = state.routeMode;
    itin.dayDestinations = [...state.dayDestinations];
    itin.hotelBookings = { ...state.hotelBookings };
    itin.mergedNights = { ...state.mergedNights };
    itin.rooms = JSON.parse(JSON.stringify(state.rooms || []));
    itin.selectedAttractions = JSON.parse(JSON.stringify(state.selectedAttractions || {}));
    itin.hotelMealPlans = JSON.parse(JSON.stringify(state.hotelMealPlans || {}));
    itin.nightMealPlans = JSON.parse(JSON.stringify(state.nightMealPlans || {}));
    itin.hotelRoomCounts = JSON.parse(JSON.stringify(state.hotelRoomCounts || {}));
    itin.hotelRoomTypes = JSON.parse(JSON.stringify(state.hotelRoomTypes || {}));
    itin.currency = state.currency || 'USD';
    itin.selectedVehicle = state.selectedVehicle || 'car';
    itin.vehicleName = state.vehicleName || (state.selectedVehicle === 'van' ? 'Toyota HiAce Luxury KDH' : 'Toyota Prius Hybrid');
    itin.employees = JSON.parse(JSON.stringify(state.employees || []));
    itin.hotelStarFilter = state.hotelStarFilter || '4';
    itin.updatedAt = new Date().toISOString();

    saveItinerariesToStorage();
  }

  function duplicateItinerary(id) {
    const orig = hubItineraries.find(item => item.id === id);
    if (!orig) return;

    const copy = JSON.parse(JSON.stringify(orig));
    copy.id = 'itin-' + Date.now();
    copy.title = `${orig.title} (Copy)`;
    copy.createdAt = new Date().toISOString();
    copy.updatedAt = new Date().toISOString();

    const origIdx = hubItineraries.findIndex(item => item.id === id);
    hubItineraries.splice(origIdx + 1, 0, copy);
    saveItinerariesToStorage();
    renderHub();
    showToast(`Duplicated "${orig.title}"`);
  }

  function deleteItinerary(id) {
    const idx = hubItineraries.findIndex(item => item.id === id);
    if (idx !== -1) {
      const removed = hubItineraries.splice(idx, 1)[0];
      saveItinerariesToStorage();
      if (hubActiveItinId === id) {
        hubActiveItinId = hubItineraries.length > 0 ? hubItineraries[0].id : null;
      }
      renderHub();
      showToast(`Deleted "${removed.title}"`);
    }
  }

  function deleteAllItineraries() {
    if (hubItineraries.length === 0) {
      showToast('No itineraries to delete');
      return;
    }
    hubItineraries = [];
    hubActiveItinId = null;
    saveItinerariesToStorage();
    renderHub();
    showToast('All itineraries deleted');
  }

  /**
   * Centralized title updater for an itinerary:
   * Synchronizes changes across Hub, Editor header, localStorage, and the live PDF document.
   */
  function updateItineraryTitle(id, newTitle, syncToIframe = true) {
    if (!newTitle || !newTitle.trim()) return;
    const trimmed = newTitle.trim();

    // 1. Update in hubItineraries
    const itin = hubItineraries.find(item => item.id === id);
    if (itin) {
      itin.title = trimmed;
      itin.updatedAt = new Date().toISOString();
      saveItinerariesToStorage();
    }

    // 2. If this is active itinerary in editor:
    if (id === hubActiveItinId) {
      state.title = trimmed;
      if (editorActiveTitleEl && editorActiveTitleEl.textContent.trim() !== trimmed) {
        editorActiveTitleEl.textContent = trimmed;
      }
      syncLiveItineraryToStorage();
    }

    // 3. Update title on card in DOM if rendered
    const cardTitleEl = document.querySelector(`.itin-card[data-id="${id}"] .itin-card-title`);
    if (cardTitleEl && cardTitleEl.textContent.trim() !== trimmed) {
      cardTitleEl.textContent = trimmed;
    }
    if (cardTitleEl) {
      cardTitleEl.title = 'Click to edit title';
    }

    // 4. Update iframe if needed
    if (syncToIframe && id === hubActiveItinId) {
      const iframe = document.getElementById('pdf-preview-iframe');
      if (iframe && iframe.contentWindow) {
        try {
          const doc = iframe.contentDocument || iframe.contentWindow.document;
          const mainTitleEls = doc ? doc.querySelectorAll('.main-title') : null;
          if (mainTitleEls && mainTitleEls.length > 0) {
            mainTitleEls.forEach(el => {
              if (el.textContent.trim() !== trimmed) {
                el.textContent = trimmed;
              }
            });
          }
        } catch(e) {}
        try {
          iframe.contentWindow.postMessage({ type: 'SUNBIRD_TITLE_UPDATED', title: trimmed }, '*');
        } catch(e) {}
      }
    }
  }

  function computeItineraryDistance(itin) {
    const dests = itin.dayDestinations ? itin.dayDestinations.slice(0, itin.days) : [];
    if (dests.length <= 1) return 120;
    let totalKm = 0;
    for (let i = 1; i < dests.length; i++) {
      const o = dests[i - 1];
      const d = dests[i];
      if (typeof getRoadRouteBetween === 'function') {
        const r = getRoadRouteBetween(o, d, itin.routeMode || 'highway');
        if (r && r.distanceKm) {
          totalKm += r.distanceKm;
          continue;
        }
      }
      totalKm += 85; // Default average leg distance
    }
    return Math.round(totalKm);
  }

  function renderStatusRing(status, progress) {
    const s = (status || '').toUpperCase().trim();
    let ringContent = '';
    let statusLabel = 'Ready';

    if (s === 'READY' || s === 'COMPLETED' || (progress !== undefined && progress >= 100)) {
      statusLabel = 'Ready (100%)';
      ringContent = `
        <circle cx="22" cy="22" r="17" fill="#141a29" stroke="rgba(255, 255, 255, 0.12)" stroke-width="4.8" />
        <circle cx="22" cy="22" r="17" fill="none" stroke="#4780f1" stroke-width="4.8" />
        <path d="M14.5 22.5 L19.5 27.5 L29.5 16.5" fill="none" stroke="#61b078" stroke-width="4.0" stroke-linecap="round" stroke-linejoin="round" />
      `;
    } else if (s === 'IN_PROGRESS' || s === 'IN PROGRESS' || (progress !== undefined && progress >= 70)) {
      statusLabel = 'In Progress (75%)';
      ringContent = `
        <circle cx="22" cy="22" r="17" fill="#141a29" stroke="rgba(255, 255, 255, 0.12)" stroke-width="4.8" />
        <circle cx="22" cy="22" r="17" fill="none" stroke="#f7ec58" stroke-width="4.8" stroke-dasharray="80.1 26.7" stroke-dashoffset="0" stroke-linecap="round" transform="rotate(-90 22 22)" />
      `;
    } else if (s === 'DRAFT' || (progress !== undefined && progress >= 40)) {
      statusLabel = 'Draft (50%)';
      ringContent = `
        <circle cx="22" cy="22" r="17" fill="#141a29" stroke="rgba(255, 255, 255, 0.12)" stroke-width="4.8" />
        <circle cx="22" cy="22" r="17" fill="none" stroke="#e19641" stroke-width="4.8" stroke-dasharray="53.4 53.4" stroke-dashoffset="0" stroke-linecap="round" transform="rotate(-90 22 22)" />
      `;
    } else {
      // PLANNING / 25%
      statusLabel = 'Planning (25%)';
      ringContent = `
        <circle cx="22" cy="22" r="17" fill="#141a29" stroke="rgba(255, 255, 255, 0.12)" stroke-width="4.8" />
        <circle cx="22" cy="22" r="17" fill="none" stroke="#a93b37" stroke-width="4.8" stroke-dasharray="26.7 80.1" stroke-dashoffset="0" stroke-linecap="round" transform="rotate(-90 22 22)" />
      `;
    }

    return `
      <div class="itin-status-ring" title="${statusLabel}" aria-label="${statusLabel}">
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          ${ringContent}
        </svg>
      </div>
    `;
  }

  function renderHub() {
    if (!hubCardsGrid) return;

    // View mode toggle button state & grid class
    if (hubViewGridBtn && hubViewCompactBtn) {
      hubViewGridBtn.classList.toggle('active', hubViewMode === 'grid');
      hubViewCompactBtn.classList.toggle('active', hubViewMode === 'compact');
    }
    hubCardsGrid.classList.toggle('compact-view', hubViewMode === 'compact');

    // 1. Telemetry Metrics
    if (statTotalItins) statTotalItins.textContent = hubItineraries.length;
    if (statTotalDays) {
      const totalDays = hubItineraries.reduce((sum, item) => sum + (item.days || 0), 0);
      statTotalDays.textContent = totalDays;
    }
    if (statTotalRegions) {
      const regions = new Set();
      hubItineraries.forEach(item => {
        if (item.dayDestinations) {
          item.dayDestinations.slice(0, item.days).forEach(d => {
            if (d && d !== 'Destination') regions.add(d);
          });
        }
      });
      statTotalRegions.textContent = regions.size;
    }

    // 2. Filter itineraries
    let filtered = [...hubItineraries];

    // Duration filter
    if (hubCurrentFilter === 'short') {
      filtered = filtered.filter(item => item.days >= 1 && item.days <= 5);
    } else if (hubCurrentFilter === 'classic') {
      filtered = filtered.filter(item => item.days >= 6 && item.days <= 10);
    } else if (hubCurrentFilter === 'grand') {
      filtered = filtered.filter(item => item.days >= 11);
    }

    // Search query filter
    if (hubSearchQuery.trim()) {
      const q = hubSearchQuery.trim().toLowerCase();
      filtered = filtered.filter(item => {
        if (item.title && item.title.toLowerCase().includes(q)) return true;
        if (item.arrivalDate && item.arrivalDate.toLowerCase().includes(q)) return true;
        if (item.dayDestinations && item.dayDestinations.some(d => d.toLowerCase().includes(q))) return true;
        return false;
      });
    }

    // Sort
    if (hubCurrentSort === 'recent') {
      filtered.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    } else if (hubCurrentSort === 'duration-desc') {
      filtered.sort((a, b) => (b.days || 0) - (a.days || 0));
    } else if (hubCurrentSort === 'duration-asc') {
      filtered.sort((a, b) => (a.days || 0) - (b.days || 0));
    } else if (hubCurrentSort === 'name-asc') {
      filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    if (hubBadgeCount) {
      hubBadgeCount.textContent = filtered.length;
    }

    // 3. Render Cards Grid
    hubCardsGrid.innerHTML = '';

    // First Tile: "+ Create New Itinerary" interactive dashed tile
    const createTile = document.createElement('div');
    createTile.className = 'hub-create-tile';
    createTile.innerHTML = `
      <div class="hub-create-icon-wrap">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </div>
      <div class="hub-create-tile-title">Create New Itinerary</div>
      <div class="hub-create-tile-desc">Configure a custom expedition duration<br>guest party and Ceylon travel route</div>
    `;
    createTile.addEventListener('click', () => {
      openCreateModal();
    });
    hubCardsGrid.appendChild(createTile);

    // Itinerary Cards
    if (filtered.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'hub-empty-state';
      emptyState.innerHTML = `
        <div class="hub-empty-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <div class="hub-empty-title">No itineraries match your filter</div>
        <div class="hub-empty-desc">Try clearing the search term or switching the duration filter tab above.</div>
      `;
      hubCardsGrid.appendChild(emptyState);
      return;
    }

    filtered.forEach(itin => {
      const card = document.createElement('div');
      card.className = 'itin-card';
      card.dataset.id = itin.id;

      const bookedCount = Object.keys(itin.hotelBookings || {}).length;
      const roomCount = (itin.rooms || []).length;
      const distKm = itin.distanceKm || computeItineraryDistance(itin);
      const isHighway = (itin.routeMode || 'highway') === 'highway';

      // Style 1 Layout: Title + [14D/13N] white pill + [16 Pax] blue pill + Right circular status ring
      card.innerHTML = `
        <div class="itin-card-header">
          <div class="itin-card-header-left">
            <div class="itin-card-title" contenteditable="true" spellcheck="false" title="Click to edit title">${escapeHtml(itin.title)}</div>
            <div class="itin-card-badges">
              <span class="itin-badge-days-pill">${itin.days}D/${itin.nights}N</span>
              <span class="itin-badge-pax-pill">${itin.touristsCount || 16} Pax</span>
            </div>
          </div>
          <div class="itin-card-header-right">
            <div class="itin-compact-actions">
              <button type="button" class="btn-itin-action" data-dup-id="${itin.id}" title="Duplicate Itinerary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              </button>
              <button type="button" class="btn-itin-action btn-del" data-del-id="${itin.id}" title="Delete Itinerary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
            ${renderStatusRing(itin.status, itin.progress)}
          </div>
        </div>

        <div class="itin-card-body">
          <div class="itin-specs-box">
            <div class="itin-spec-item" title="Arrival Date">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span class="itin-spec-val">${itin.arrivalDate || '2026-11-15'}</span>
            </div>
            <div class="itin-spec-item" title="Hotels and Reservations">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
              <span class="itin-spec-val">${bookedCount} Hotels (${roomCount} Res)</span>
            </div>
            <div class="itin-spec-item" title="Estimated Road Distance">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 5h-7a4 4 0 0 0-4 4v2a4 4 0 0 0 4 4h2a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4H6"/></svg>
              <span class="itin-spec-val">${distKm} km</span>
            </div>
            <div class="itin-spec-item" title="Active Routing Engine">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"></line><line x1="7" y1="8" x2="17" y2="8"></line><line x1="7" y1="16" x2="17" y2="16"></line></svg>
              <span class="itin-spec-val">${isHighway ? 'Highway Express' : 'Coastal / Scenic'}</span>
            </div>
          </div>
        </div>

        <div class="itin-card-footer">
          <button type="button" class="btn-itin-open" data-open-id="${itin.id}">
            <span>Open in Editor</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
          <button type="button" class="btn-itin-action" data-dup-id="${itin.id}" title="Duplicate Itinerary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </button>
          <button type="button" class="btn-itin-action btn-del" data-del-id="${itin.id}" title="Delete Itinerary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      `;

      // One-click seamless inline title editing
      const titleEl = card.querySelector('.itin-card-title');
      if (titleEl) {
        let originalCardTitle = itin.title || '';

        titleEl.addEventListener('focus', () => {
          originalCardTitle = titleEl.textContent.trim();
        });

        titleEl.addEventListener('mousedown', (e) => {
          e.stopPropagation();
        });

        titleEl.addEventListener('click', (e) => {
          e.stopPropagation();
        });

        titleEl.addEventListener('dblclick', (e) => {
          e.stopPropagation();
        });

        titleEl.addEventListener('keydown', (e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            e.preventDefault();
            titleEl.blur();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            titleEl.textContent = originalCardTitle;
            titleEl.blur();
          }
        });

        titleEl.addEventListener('blur', () => {
          const newTitle = titleEl.textContent.trim();
          if (!newTitle) {
            titleEl.textContent = originalCardTitle;
          } else if (newTitle !== originalCardTitle) {
            updateItineraryTitle(itin.id, newTitle);
          }
        });

        titleEl.addEventListener('paste', (e) => {
          e.preventDefault();
          const text = (e.clipboardData || window.clipboardData).getData('text/plain').replace(/[\r\n]+/g, ' ');
          document.execCommand('insertText', false, text);
        });
      }

      // Clicking card directly opens editor (ignoring title/buttons)
      card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        if (e.target.closest('.itin-card-title')) return;
        openItineraryInEditor(itin.id);
      });

      // Event listener: open card into editor button
      const openBtn = card.querySelector('[data-open-id]');
      if (openBtn) {
        openBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openItineraryInEditor(itin.id);
        });
      }

      // Event listener: duplicate
      const dupBtns = card.querySelectorAll('[data-dup-id]');
      dupBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          duplicateItinerary(itin.id);
        });
      });

      // Event listener: delete
      const delBtns = card.querySelectorAll('[data-del-id]');
      delBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          openDeleteModal(itin.id);
        });
      });

      hubCardsGrid.appendChild(card);
    });
  }

  function openCreateModal() {
    if (!hubCreateModal) return;
    hubCreateModal.style.display = 'flex';
    if (createItinName) {
      createItinName.value = '';
      setTimeout(() => createItinName.focus(), 50);
    }
  }

  function closeCreateModal() {
    if (hubCreateModal) hubCreateModal.style.display = 'none';
  }

  function openDeleteModal(itinId) {
    const itin = hubItineraries.find(item => item.id === itinId);
    if (!itin || !hubDeleteModal) return;

    hubPendingDeleteId = itinId;
    if (deleteTargetNameEl) {
      deleteTargetNameEl.textContent = `"${itin.title}"`;
    }
    hubDeleteModal.style.display = 'flex';
  }

  function closeDeleteModal() {
    if (hubDeleteModal) hubDeleteModal.style.display = 'none';
    hubPendingDeleteId = null;
  }

  function setupHubEventListeners() {
    // 1. Search input
    if (hubSearchInput) {
      hubSearchInput.addEventListener('input', (e) => {
        hubSearchQuery = e.target.value;
        if (hubSearchClearBtn) {
          hubSearchClearBtn.style.display = hubSearchQuery ? 'flex' : 'none';
        }
        renderHub();
      });
    }

    if (hubSearchClearBtn) {
      hubSearchClearBtn.addEventListener('click', () => {
        if (hubSearchInput) hubSearchInput.value = '';
        hubSearchQuery = '';
        hubSearchClearBtn.style.display = 'none';
        renderHub();
        if (hubSearchInput) hubSearchInput.focus();
      });
    }

    // 2. Duration filter tabs
    if (hubFilterTabs) {
      hubFilterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          hubFilterTabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          hubCurrentFilter = tab.dataset.filter || 'all';
          renderHub();
        });
      });
    }

    // 3. Sort dropdown
    if (hubSortSelect) {
      hubSortSelect.addEventListener('change', (e) => {
        hubCurrentSort = e.target.value;
        renderHub();
      });
    }

    // 3b. View mode toggle (Grid vs Compact Mode)
    if (hubViewGridBtn) {
      hubViewGridBtn.addEventListener('click', () => {
        hubViewMode = 'grid';
        renderHub();
      });
    }
    if (hubViewCompactBtn) {
      hubViewCompactBtn.addEventListener('click', () => {
        hubViewMode = 'compact';
        renderHub();
      });
    }

    // 4. Header "+ Create Itinerary" button
    if (hubBtnNewItin) {
      hubBtnNewItin.addEventListener('click', () => {
        openCreateModal();
      });
    }

    // 4b. Delete All button
    const hubBtnDeleteAll = document.getElementById('hub-btn-delete-all');
    if (hubBtnDeleteAll) {
      hubBtnDeleteAll.addEventListener('click', () => {
        if (hubItineraries.length === 0) {
          showToast('No itineraries to delete');
          return;
        }
        const count = hubItineraries.length;
        if (confirm(`Are you sure you want to delete all ${count} itinerary${count > 1 ? 'ies' : ''}? This cannot be undone.`)) {
          deleteAllItineraries();
        }
      });
    }

    // 5. Create Modal Controls
    if (modalCreateCloseBtn) {
      modalCreateCloseBtn.addEventListener('click', closeCreateModal);
    }
    if (modalCreateCancelBtn) {
      modalCreateCancelBtn.addEventListener('click', closeCreateModal);
    }

    // Form submit — only name is needed, all fields start empty
    if (hubCreateForm) {
      hubCreateForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = (createItinName && createItinName.value.trim()) || 'New Itinerary';

        const newItin = {
          id: 'itin-' + Date.now(),
          title: title,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          days: 1,
          nights: 0,
          arrivalDate: '',
          arrivalTime: '',
          touristsCount: 0,
          routeMode: 'highway',
          status: 'DRAFT',
          progress: 0,
          dayDestinations: [],
          hotelBookings: {},
          rooms: [],
          selectedAttractions: {},
          mergedNights: {},
          currency: 'USD',
          selectedVehicle: 'car',
          vehicleName: 'Toyota Prius Hybrid',
          employees: [],
          hotelStarFilter: '4'
        };

        hubItineraries.unshift(newItin);
        saveItinerariesToStorage();
        closeCreateModal();
        renderHub();
        openItineraryInEditor(newItin.id);

        // Focus on Itinerary Info tab and activate first config tab (Arrival)
        switchMainView('itinerary');
        const firstConfigTab = document.querySelector('.itin-config-tab-btn[data-target="itin-tab-arrival"]');
        if (firstConfigTab) {
          firstConfigTab.click();
        }
      });
    }

    // 6. Delete Modal Controls
    if (modalDeleteCloseBtn) {
      modalDeleteCloseBtn.addEventListener('click', closeDeleteModal);
    }
    if (modalDeleteCancelBtn) {
      modalDeleteCancelBtn.addEventListener('click', closeDeleteModal);
    }
    if (modalDeleteConfirmBtn) {
      modalDeleteConfirmBtn.addEventListener('click', () => {
        if (hubPendingDeleteId) {
          deleteItinerary(hubPendingDeleteId);
          closeDeleteModal();
        }
      });
    }

    // 7. Return to Hub button in editor header
    if (btnReturnHub) {
      btnReturnHub.addEventListener('click', () => {
        saveCurrentItineraryToStorage();
        switchScreen('hub');
        showToast('Itinerary saved to Hub');
      });
    }

    // 8. Two-way synchronization message listener from PDF iframe
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'SUNBIRD_TITLE_UPDATED' && e.data.title) {
        const newTitle = e.data.title.trim();
        if (newTitle && hubActiveItinId) {
          updateItineraryTitle(hubActiveItinId, newTitle, false);
        }
      }
    });

    // 10. Multi-tab synchronization via localStorage storage event
    window.addEventListener('storage', (e) => {
      if (e.key === 'sunbird_live_itinerary' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data && data.title && hubActiveItinId) {
            updateItineraryTitle(hubActiveItinId, data.title, false);
          }
        } catch(err) {}
      }
    });

    // Close modals on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeCreateModal();
        closeDeleteModal();
      }
    });

    // Close modals on backdrop click
    if (hubCreateModal) {
      hubCreateModal.addEventListener('click', (e) => {
        if (e.target === hubCreateModal) closeCreateModal();
      });
    }
    if (hubDeleteModal) {
      hubDeleteModal.addEventListener('click', (e) => {
        if (e.target === hubDeleteModal) closeDeleteModal();
      });
    }
  }

  // Export functions to global scope for debugging & test hooks
  window.openItineraryInEditor = openItineraryInEditor;
  window.updateItineraryTitle = updateItineraryTitle;
  window.switchScreen = switchScreen;
  window.initItineraryHub = initItineraryHub;
  window.saveCurrentItineraryToStorage = saveCurrentItineraryToStorage;
  window.syncLiveItineraryToStorage = syncLiveItineraryToStorage;

})();
