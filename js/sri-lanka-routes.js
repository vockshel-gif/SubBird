/**
 * Sri Lanka Authentic Highway & Road Routing Network
 * Dual-Mode Routing System:
 * 1. HIGHWAY MODE (Expressways & Arterial Bypasses)
 *    - E03 Colombo-Katunayake Expressway (Toll)
 *    - E01 Southern Expressway & Extensions to Mattala / Hambantota (Toll)
 *    - E04 Central Expressway / A28 Padeniya-Anuradhapura Highway
 *    - A6 Ambepussa-Kurunegala Dambulla Express Bypass
 *    - Fast driving times and bypass alignments.
 *
 * 2. NORMAL ROUTE MODE (Traditional Coastal & Town Roads)
 *    - A2 Classic Galle Coastal Road (through Moratuwa, Kalutara, Bentota, Hikkaduwa)
 *    - A3 Peliyagoda - Negombo Suburban Road (through Wattala & Ja-Ela)
 *    - A1 Classic Colombo - Kandy Road (through Warakapola, Kegalle, Kadugannawa Pass)
 *    - A3 Coastal Route to Anuradhapura (via Chilaw & Puttalam)
 *    - A4 High Level Road to Ella (via Ratnapura & Haputale Pass)
 *    - Authentic town-center traffic times and oceanfront scenic alignments.
 */
(function () {
  'use strict';

  // Road Graph Vertices and Highway Junctions (3D map local coordinates [x, y], where 3D Z = -y)
  const JUNCTIONS = {
    // Primary Destinations
    'airport': [-6.985, -5.344],
    'colombo': [-7.16, -7.293],
    'negombo': [-7.355, -5.191],
    'kandy': [-1.228, -4.501],
    'dambulla': [-1.089, -0.019],
    'sigiriya': [-0.255, 0.617],
    'polonnaruwa': [1.588, 0.489],
    'anuradhapura': [-2.994, 3.339],
    'nuwara-eliya': [-0.255, -7.119],
    'ella': [1.943, -7.756],
    'yala': [5.582, -11.582],
    'udawalawe': [0.724, -10.768],
    'mirissa': [-2.579, -14.811],
    'galle': [-4.428, -14.002],
    'bentota': [-6.124, -11.143],
    'unawatuna': [-4.183, -14.333],
    'weligama': [-2.801, -14.626],
    'hikkaduwa': [-5.318, -13.342],
    'tangalle': [0.004, -14.225],
    'trincomalee': [3.379, 5.459],
    'passikudah': [5.921, 0.37],
    'arugam-bay': [7.935, -7.949],
    'jaffna': [-6.038, 13.708],
    'wilpattu': [-6.051, 4.443],
    'sinharaja': [-2.57, -11.212],
    'horton-plains': [0.08, -8.247],
    'adams-peak': [-2.261, -8.197],
    'minneriya': [0.305, 1.203],
    'kitulgala': [-2.894, -6.861],
    'mannar': [-6.83, 8.484],
    'pigeon-island': [3.151, 6.488],
    'delft-island': [-8.462, 12.596],
    'casuarina-beach': [-6.951, 14.556],
    'nainativu': [-7.838, 13.351],

    // Key Intermediate Highway Interchanges & Hubs
    'jnc-peliyagoda': [-7.12, -6.95],
    'jnc-kadawatha': [-6.85, -6.72],
    'jnc-ambepussa': [-4.40, -5.30],
    'jnc-kurunegala': [-3.30, -2.85],
    'jnc-matale': [-1.15, -2.40],
    'jnc-habarana': [0.35, 1.05],
    'jnc-kaduwela': [-6.65, -7.35],
    'jnc-dodangoda': [-5.80, -11.05],
    'jnc-kurundugaha': [-5.15, -12.45],
    'jnc-pinnaduwa': [-4.35, -13.80],
    'jnc-matara': [-1.85, -14.70],
    'jnc-beliatta': [-0.60, -14.15],
    'jnc-hambantota': [3.50, -12.60],
    'jnc-tissamaharama': [4.70, -11.95],
    'jnc-wellawaya': [1.85, -8.85],
    'jnc-hatton': [-1.65, -7.60],
    'jnc-vavuniya': [-2.35, 6.70],
    'jnc-kilinochchi': [-3.60, 11.20],
    'jnc-medawachchiya': [-2.65, 4.90],
    'jnc-kantale': [1.80, 4.10],
    'jnc-batticaloa': [6.60, -3.20],
    'jnc-siyambalanduwa': [5.80, -7.90]
  };

  // Active routing mode: 'highway' (default) | 'normal'
  let activeRouteMode = 'highway';

  // Highway & Normal Segments with real GPS spline curves, distances (km), and driving times (mins)
  const SEGMENTS = [
    // =========================================================================
    // 1. COLOMBO <-> AIRPORT / NEGOMBO
    // =========================================================================
    // Highway Mode: E03 Katunayake Expressway (Toll)
    {
      id: 'e03-airport-colombo',
      from: 'airport',
      to: 'colombo',
      mode: 'highway',
      name: 'E03 Katunayake Expressway',
      distanceKm: 33,
      durationMin: 35,
      points: [
        [-6.985, -5.344],
        [-7.01, -5.60],
        [-7.06, -6.15],
        [-7.10, -6.65],
        [-7.12, -6.95],
        [-7.14, -7.15],
        [-7.16, -7.293]
      ]
    },
    // Normal Route Mode: A3 Peliyagoda - Wattala - Ja-Ela - Seeduwa - Katunayake Road
    {
      id: 'a3-airport-colombo-normal',
      from: 'airport',
      to: 'colombo',
      mode: 'normal',
      name: 'A3 Negombo - Peliyagoda Road (Wattala & Ja-Ela)',
      distanceKm: 37,
      durationMin: 75, // 1h 15m through towns
      points: [
        [-6.985, -5.344],
        [-7.20, -5.60],
        [-7.12, -6.00],
        [-7.08, -6.35],
        [-7.05, -6.65],
        [-6.978, -7.002],
        [-7.16, -7.293]
      ]
    },
    // Airport <-> Negombo (B352 link)
    {
      id: 'road-airport-negombo',
      from: 'airport',
      to: 'negombo',
      mode: 'both',
      name: 'Katunayake - Negombo Road',
      distanceKm: 9,
      durationMin: 15,
      points: [
        [-6.985, -5.344],
        [-7.12, -5.31],
        [-7.26, -5.25],
        [-7.355, -5.191]
      ]
    },

    // =========================================================================
    // 2. COLOMBO <-> SOUTHERN COAST (Bentota, Galle, Mirissa, Tangalle)
    // =========================================================================
    // Highway Mode: E01 Southern Expressway (Toll Expressway)
    {
      id: 'e01-colombo-bentota',
      from: 'colombo',
      to: 'bentota',
      mode: 'highway',
      name: 'E01 Southern Expressway',
      distanceKm: 65,
      durationMin: 55,
      points: [
        [-7.16, -7.293],
        [-7.05, -7.45],
        [-6.85, -7.80],
        [-6.65, -8.30],
        [-6.40, -9.10],
        [-6.15, -10.05],
        [-5.80, -11.05],
        [-6.124, -11.143]
      ]
    },
    {
      id: 'e01-bentota-galle',
      from: 'bentota',
      to: 'galle',
      mode: 'highway',
      name: 'E01 Southern Expressway',
      distanceKm: 55,
      durationMin: 45,
      points: [
        [-6.124, -11.143],
        [-5.80, -11.05],
        [-5.55, -11.75],
        [-5.15, -12.45],
        [-4.75, -13.20],
        [-4.35, -13.80],
        [-4.428, -14.002]
      ]
    },
    // Normal Route Mode: A2 Classic Galle Road (Coastal Scenic Route along the ocean)
    {
      id: 'a2-colombo-bentota-normal',
      from: 'colombo',
      to: 'bentota',
      mode: 'normal',
      name: 'A2 Coastal Galle Road (Panadura & Kalutara)',
      distanceKm: 62,
      durationMin: 120, // 2h 00m through coastal towns
      points: [
        [-7.16, -7.293],  // Colombo Fort
        [-7.20, -7.75],   // Mount Lavinia
        [-7.15, -8.30],   // Moratuwa
        [-7.00, -8.90],   // Panadura
        [-6.80, -9.60],   // Wadduwa
        [-6.60, -10.30],  // Kalutara
        [-6.30, -11.00],  // Beruwala / Aluthgama
        [-6.124, -11.143] // Bentota
      ]
    },
    {
      id: 'a2-bentota-galle-normal',
      from: 'bentota',
      to: 'galle',
      mode: 'normal',
      name: 'A2 Coastal Galle Road (Ambalangoda & Hikkaduwa)',
      distanceKm: 54,
      durationMin: 105, // 1h 45m through beach towns
      points: [
        [-6.124, -11.143], // Bentota
        [-5.85, -11.90],   // Kosgoda
        [-5.60, -12.55],   // Ambalangoda
        [-5.318, -13.342], // Hikkaduwa
        [-4.90, -13.70],   // Dodanduwa / Gintota
        [-4.428, -14.002]  // Galle Fort
      ]
    },

    // Coastal Beach Links (Shared by both modes)
    {
      id: 'a2-galle-hikkaduwa',
      from: 'galle',
      to: 'hikkaduwa',
      mode: 'both',
      name: 'A2 Coastal Highway',
      distanceKm: 18,
      durationMin: 28,
      points: [
        [-4.428, -14.002],
        [-4.85, -13.75],
        [-5.12, -13.55],
        [-5.318, -13.342]
      ]
    },
    {
      id: 'a2-galle-unawatuna',
      from: 'galle',
      to: 'unawatuna',
      mode: 'both',
      name: 'A2 Coastal Highway',
      distanceKm: 6,
      durationMin: 12,
      points: [
        [-4.428, -14.002],
        [-4.30, -14.15],
        [-4.183, -14.333]
      ]
    },
    {
      id: 'a2-unawatuna-weligama',
      from: 'unawatuna',
      to: 'weligama',
      mode: 'both',
      name: 'A2 Coastal Highway',
      distanceKm: 22,
      durationMin: 32,
      points: [
        [-4.183, -14.333],
        [-3.85, -14.45],
        [-3.40, -14.52],
        [-3.05, -14.58],
        [-2.801, -14.626]
      ]
    },
    {
      id: 'a2-weligama-mirissa',
      from: 'weligama',
      to: 'mirissa',
      mode: 'both',
      name: 'A2 Coastal Highway',
      distanceKm: 8,
      durationMin: 14,
      points: [
        [-2.801, -14.626],
        [-2.70, -14.72],
        [-2.579, -14.811]
      ]
    },
    {
      id: 'a2-mirissa-tangalle',
      from: 'mirissa',
      to: 'tangalle',
      mode: 'both',
      name: 'A2 / E01 Matara-Beliatta Corridor',
      distanceKm: 48,
      durationMin: 50,
      points: [
        [-2.579, -14.811],
        [-1.85, -14.70],
        [-1.20, -14.45],
        [-0.60, -14.15],
        [-0.25, -14.18],
        [0.004, -14.225]
      ]
    },
    {
      id: 'e01-tangalle-yala',
      from: 'tangalle',
      to: 'yala',
      mode: 'both',
      name: 'E01 / A2 Hambantota Safari Corridor',
      distanceKm: 85,
      durationMin: 85,
      points: [
        [0.004, -14.225],
        [0.85, -13.90],
        [1.80, -13.50],
        [2.70, -13.10],
        [3.50, -12.60],
        [4.25, -12.25],
        [4.70, -11.95],
        [5.15, -11.75],
        [5.582, -11.582]
      ]
    },
    {
      id: 'a18-tangalle-udawalawe',
      from: 'tangalle',
      to: 'udawalawe',
      mode: 'both',
      name: 'A18 Nonagama-Pelmadulla Highway',
      distanceKm: 68,
      durationMin: 75,
      points: [
        [0.004, -14.225],
        [0.45, -13.80],
        [0.70, -13.00],
        [0.72, -12.10],
        [0.724, -10.768]
      ]
    },
    {
      id: 'road-udawalawe-yala',
      from: 'udawalawe',
      to: 'yala',
      mode: 'both',
      name: 'Southern Safari Corridor',
      distanceKm: 92,
      durationMin: 110,
      points: [
        [0.724, -10.768],
        [1.85, -11.20],
        [3.10, -11.70],
        [4.25, -12.25],
        [4.70, -11.95],
        [5.582, -11.582]
      ]
    },
    {
      id: 'a23-udawalawe-ella',
      from: 'udawalawe',
      to: 'ella',
      mode: 'both',
      name: 'A23 Wellawaya Scenic Mountain Road',
      distanceKm: 92,
      durationMin: 125,
      points: [
        [0.724, -10.768],
        [1.20, -10.10],
        [1.85, -8.85],
        [1.90, -8.30],
        [1.943, -7.756]
      ]
    },
    {
      id: 'a23-yala-ella',
      from: 'yala',
      to: 'ella',
      mode: 'both',
      name: 'B35 / A23 Ravana Falls Pass',
      distanceKm: 95,
      durationMin: 130,
      points: [
        [5.582, -11.582],
        [4.70, -11.95],
        [3.60, -10.85],
        [2.65, -9.80],
        [1.85, -8.85],
        [1.90, -8.30],
        [1.943, -7.756]
      ]
    },

    // =========================================================================
    // 3. COLOMBO / AIRPORT <-> KANDY
    // =========================================================================
    // Highway Mode: E04 Central Expressway / A1 Fast Bypass
    {
      id: 'e04-colombo-kandy',
      from: 'colombo',
      to: 'kandy',
      mode: 'highway',
      name: 'E04 Central Expressway / Kandy Link',
      distanceKm: 105,
      durationMin: 165, // 2h 45m
      points: [
        [-7.16, -7.293],
        [-6.85, -6.72],
        [-5.90, -5.50],
        [-4.50, -4.60],
        [-3.00, -4.55],
        [-1.80, -4.50],
        [-1.228, -4.501]
      ]
    },
    // Normal Route Mode: Traditional A1 Colombo-Kandy Road (via Kadugannawa Mountain Pass)
    {
      id: 'a1-colombo-kandy-normal',
      from: 'colombo',
      to: 'kandy',
      mode: 'normal',
      name: 'A1 Traditional Colombo - Kandy Road (Kadugannawa)',
      distanceKm: 115,
      durationMin: 225, // 3h 45m
      points: [
        [-7.16, -7.293],
        [-6.85, -6.72],
        [-5.90, -5.95],
        [-4.40, -5.30],
        [-3.30, -4.95],
        [-2.40, -4.75],
        [-1.75, -4.60],
        [-1.228, -4.501]
      ]
    },
    // Airport <-> Kandy
    {
      id: 'road-airport-kandy',
      from: 'airport',
      to: 'kandy',
      mode: 'both',
      name: 'Airport - Kandy Corridor',
      distanceKm: 104,
      durationMin: 175,
      points: [
        [-6.985, -5.344],
        [-6.35, -5.30],
        [-5.45, -5.32],
        [-4.40, -5.30],
        [-3.30, -4.95],
        [-2.40, -4.75],
        [-1.228, -4.501]
      ]
    },

    // =========================================================================
    // 4. COLOMBO / AIRPORT <-> ANURADHAPURA
    // =========================================================================
    // Highway Mode: A28 Padeniya - Anuradhapura Highway (Google Maps Match)
    {
      id: 'a28-colombo-anuradhapura',
      from: 'colombo',
      to: 'anuradhapura',
      mode: 'highway',
      name: 'A28 Padeniya - Anuradhapura Highway',
      distanceKm: 206,
      durationMin: 262, // 4h 22m (Exact Google Maps match)
      points: [
        [-7.16, -7.293],    // Colombo Fort
        [-6.978, -7.002],   // Peliyagoda
        [-6.924, -6.157],   // Ja-Ela
        [-6.985, -5.344],   // Katunayake Interchange
        [-7.131, -4.698],   // Kochchikade
        [-6.65, -4.35],     // Dunagaha
        [-6.248, -4.198],   // Pannala
        [-5.173, -4.006],   // Giriulla
        [-4.482, -3.392],   // Narammala
        [-4.712, -1.933],   // Padeniya Junction
        [-4.251, -0.934],   // Daladagama
        [-4.098, 0.064],    // Ambanpola
        [-3.944, 0.832],    // Galgamuwa
        [-3.79, 2.099],     // Tambuttegama
        [-3.56, 2.79],      // Talawa
        [-2.994, 3.339]     // Anuradhapura
      ]
    },
    {
      id: 'a28-airport-anuradhapura',
      from: 'airport',
      to: 'anuradhapura',
      mode: 'highway',
      name: 'A28 Padeniya - Anuradhapura Highway',
      distanceKm: 175,
      durationMin: 220, // 3h 40m
      points: [
        [-6.985, -5.344],   // Katunayake / Airport
        [-7.131, -4.698],   // Kochchikade
        [-6.65, -4.35],     // Dunagaha
        [-6.248, -4.198],   // Pannala
        [-5.173, -4.006],   // Giriulla
        [-4.482, -3.392],   // Narammala
        [-4.712, -1.933],   // Padeniya Junction
        [-4.251, -0.934],   // Daladagama
        [-4.098, 0.064],    // Ambanpola
        [-3.944, 0.832],    // Galgamuwa
        [-3.79, 2.099],     // Tambuttegama
        [-3.56, 2.79],      // Talawa
        [-2.994, 3.339]     // Anuradhapura
      ]
    },
    {
      id: 'a28-negombo-anuradhapura',
      from: 'negombo',
      to: 'anuradhapura',
      mode: 'highway',
      name: 'A28 Padeniya - Anuradhapura Highway',
      distanceKm: 168,
      durationMin: 215, // 3h 35m
      points: [
        [-7.355, -5.191],   // Negombo
        [-7.131, -4.698],   // Kochchikade
        [-6.65, -4.35],     // Dunagaha
        [-6.248, -4.198],   // Pannala
        [-5.173, -4.006],   // Giriulla
        [-4.482, -3.392],   // Narammala
        [-4.712, -1.933],   // Padeniya Junction
        [-4.251, -0.934],   // Daladagama
        [-4.098, 0.064],    // Ambanpola
        [-3.944, 0.832],    // Galgamuwa
        [-3.79, 2.099],     // Tambuttegama
        [-3.56, 2.79],      // Talawa
        [-2.994, 3.339]     // Anuradhapura
      ]
    },
    // Normal Route Mode: A3 / A12 Coastal Route (via Chilaw & Puttalam)
    {
      id: 'a3-colombo-anuradhapura-normal',
      from: 'colombo',
      to: 'anuradhapura',
      mode: 'normal',
      name: 'A3 / A12 Coastal Route (via Chilaw & Puttalam)',
      distanceKm: 215,
      durationMin: 315, // 5h 15m through coastal towns
      points: [
        [-7.16, -7.293],    // Colombo Fort
        [-7.355, -5.191],   // Negombo
        [-7.15, -4.10],     // Marawila
        [-6.95, -2.60],     // Chilaw
        [-6.70, -0.90],     // Mundalama
        [-6.55, 1.20],      // Puttalam
        [-5.30, 1.80],      // Saliyawewa
        [-4.20, 2.50],      // Nochchiyagama
        [-2.994, 3.339]     // Anuradhapura
      ]
    },
    {
      id: 'a3-airport-anuradhapura-normal',
      from: 'airport',
      to: 'anuradhapura',
      mode: 'normal',
      name: 'A3 / A12 Coastal Route (via Chilaw & Puttalam)',
      distanceKm: 185,
      durationMin: 275, // 4h 35m
      points: [
        [-6.985, -5.344],   // Airport
        [-7.355, -5.191],   // Negombo
        [-7.15, -4.10],     // Marawila
        [-6.95, -2.60],     // Chilaw
        [-6.70, -0.90],     // Mundalama
        [-6.55, 1.20],      // Puttalam
        [-5.30, 1.80],      // Saliyawewa
        [-4.20, 2.50],      // Nochchiyagama
        [-2.994, 3.339]     // Anuradhapura
      ]
    },

    // =========================================================================
    // 5. COLOMBO / AIRPORT <-> DAMBULLA & SIGIRIYA
    // =========================================================================
    // Highway Mode: A6 Kurunegala Bypass Highway (Bypasses Kandy)
    {
      id: 'a6-colombo-dambulla',
      from: 'colombo',
      to: 'dambulla',
      mode: 'highway',
      name: 'A6 Ambepussa - Kurunegala - Dambulla Highway',
      distanceKm: 154,
      durationMin: 210, // 3h 30m
      points: [
        [-7.16, -7.293],    // Colombo
        [-6.85, -6.72],     // Kadawatha
        [-5.90, -5.95],     // Nittambuwa
        [-4.40, -5.30],     // Ambepussa Junction
        [-3.85, -4.10],     // Alawwa / Polgahawela
        [-3.30, -2.85],     // Kurunegala
        [-2.75, -2.10],     // Ibbagamuwa
        [-2.05, -1.25],     // Melsiripura
        [-1.45, -0.55],     // Galewela
        [-1.089, -0.019]    // Dambulla
      ]
    },
    {
      id: 'a6-airport-dambulla',
      from: 'airport',
      to: 'dambulla',
      mode: 'highway',
      name: 'A6 Kurunegala - Dambulla Highway',
      distanceKm: 130,
      durationMin: 185, // 3h 05m
      points: [
        [-6.985, -5.344],   // Airport
        [-5.90, -5.20],     // Minuwangoda / Mirigama
        [-4.40, -5.30],     // Ambepussa Junction
        [-3.85, -4.10],     // Alawwa / Polgahawela
        [-3.30, -2.85],     // Kurunegala
        [-2.75, -2.10],     // Ibbagamuwa
        [-2.05, -1.25],     // Melsiripura
        [-1.45, -0.55],     // Galewela
        [-1.089, -0.019]    // Dambulla
      ]
    },
    {
      id: 'a6-colombo-sigiriya',
      from: 'colombo',
      to: 'sigiriya',
      mode: 'highway',
      name: 'A6 Heritage Express to Sigiriya',
      distanceKm: 168,
      durationMin: 235, // 3h 55m
      points: [
        [-7.16, -7.293],    // Colombo
        [-6.85, -6.72],     // Kadawatha
        [-4.40, -5.30],     // Ambepussa
        [-3.30, -2.85],     // Kurunegala
        [-2.05, -1.25],     // Melsiripura
        [-1.089, -0.019],   // Dambulla
        [-0.85, 0.20],      // Inamaluwa
        [-0.255, 0.617]     // Sigiriya
      ]
    },
    {
      id: 'a6-airport-sigiriya',
      from: 'airport',
      to: 'sigiriya',
      mode: 'highway',
      name: 'A6 Express Airport to Sigiriya',
      distanceKm: 144,
      durationMin: 210, // 3h 30m
      points: [
        [-6.985, -5.344],   // Airport
        [-4.40, -5.30],     // Ambepussa
        [-3.30, -2.85],     // Kurunegala
        [-2.05, -1.25],     // Melsiripura
        [-1.089, -0.019],   // Dambulla
        [-0.85, 0.20],      // Inamaluwa
        [-0.255, 0.617]     // Sigiriya
      ]
    },
    // Normal Route Mode: A1 / A6 Traditional Road through Towns
    {
      id: 'a1-colombo-dambulla-normal',
      from: 'colombo',
      to: 'dambulla',
      mode: 'normal',
      name: 'A1 / A6 Classic Road (via Kegalle & Kurunegala)',
      distanceKm: 165,
      durationMin: 270, // 4h 30m through town centers
      points: [
        [-7.16, -7.293],
        [-6.85, -6.72],
        [-5.90, -5.95],
        [-4.40, -5.30],
        [-3.85, -4.10],
        [-3.30, -2.85],
        [-2.75, -2.10],
        [-2.05, -1.25],
        [-1.45, -0.55],
        [-1.089, -0.019]
      ]
    },
    {
      id: 'a1-colombo-sigiriya-normal',
      from: 'colombo',
      to: 'sigiriya',
      mode: 'normal',
      name: 'Classic Route to Sigiriya Rock',
      distanceKm: 175,
      durationMin: 295, // 4h 55m
      points: [
        [-7.16, -7.293],
        [-6.85, -6.72],
        [-4.40, -5.30],
        [-3.30, -2.85],
        [-2.05, -1.25],
        [-1.089, -0.019],
        [-0.85, 0.20],
        [-0.255, 0.617]
      ]
    },

    // =========================================================================
    // 6. CENTRAL HIGHLANDS (Nuwara Eliya, Ella, Horton Plains)
    // =========================================================================
    {
      id: 'a5-kandy-nuwara-eliya',
      from: 'kandy',
      to: 'nuwara-eliya',
      mode: 'both',
      name: 'A5 Ramboda Falls Mountain Pass',
      distanceKm: 76,
      durationMin: 150,
      points: [
        [-1.228, -4.501],
        [-1.15, -5.15],
        [-0.95, -5.85],
        [-0.65, -6.45],
        [-0.40, -6.85],
        [-0.255, -7.119]
      ]
    },
    {
      id: 'a16-nuwara-eliya-ella',
      from: 'nuwara-eliya',
      to: 'ella',
      mode: 'both',
      name: 'A16 Highland Cloud Tea Corridor',
      distanceKm: 55,
      durationMin: 110,
      points: [
        [-0.255, -7.119],
        [0.35, -7.30],
        [0.85, -7.50],
        [1.40, -7.65],
        [1.943, -7.756]
      ]
    },
    {
      id: 'road-nuwara-eliya-horton',
      from: 'nuwara-eliya',
      to: 'horton-plains',
      mode: 'both',
      name: "Pattipola World's End Pass",
      distanceKm: 28,
      durationMin: 60,
      points: [
        [-0.255, -7.119],
        [-0.15, -7.60],
        [-0.05, -8.00],
        [0.08, -8.247]
      ]
    },
    // Normal Route Mode: A4 High Level Road to Ella (via Ratnapura & Haputale Pass)
    {
      id: 'a4-colombo-ella-normal',
      from: 'colombo',
      to: 'ella',
      mode: 'normal',
      name: 'A4 High Level Road (Ratnapura & Haputale Pass)',
      distanceKm: 205,
      durationMin: 390, // 6h 30m over mountains
      points: [
        [-7.16, -7.293],  // Colombo
        [-5.45, -7.15],   // Avissawella
        [-4.00, -7.35],   // Ratnapura (Gem City)
        [-2.90, -7.45],   // Pelmadulla
        [-1.70, -7.50],   // Balangoda
        [0.20, -7.60],    // Beragala
        [1.10, -7.70],    // Haputale
        [1.50, -7.72],    // Bandarawela
        [1.943, -7.756]   // Ella
      ]
    },

    // =========================================================================
    // 7. CULTURAL TRIANGLE (Dambulla, Sigiriya, Polonnaruwa, Anuradhapura)
    // =========================================================================
    {
      id: 'a9-kandy-dambulla',
      from: 'kandy',
      to: 'dambulla',
      mode: 'both',
      name: 'A9 Kandy - Dambulla Highway',
      distanceKm: 74,
      durationMin: 130,
      points: [
        [-1.228, -4.501],
        [-1.20, -3.80],
        [-1.15, -2.40],
        [-1.12, -1.20],
        [-1.089, -0.019]
      ]
    },
    {
      id: 'road-dambulla-sigiriya',
      from: 'dambulla',
      to: 'sigiriya',
      mode: 'both',
      name: 'B162 Lion Rock Link',
      distanceKm: 17,
      durationMin: 25,
      points: [
        [-1.089, -0.019],
        [-0.85, 0.20],
        [-0.55, 0.45],
        [-0.255, 0.617]
      ]
    },
    {
      id: 'road-sigiriya-minneriya',
      from: 'sigiriya',
      to: 'minneriya',
      mode: 'both',
      name: 'A11 Elephant Sanctuary Road',
      distanceKm: 22,
      durationMin: 30,
      points: [
        [-0.255, 0.617],
        [0.05, 0.85],
        [0.305, 1.203]
      ]
    },
    {
      id: 'a11-minneriya-polonnaruwa',
      from: 'minneriya',
      to: 'polonnaruwa',
      mode: 'both',
      name: 'A11 Medieval Kingdom Highway',
      distanceKm: 26,
      durationMin: 35,
      points: [
        [0.305, 1.203],
        [0.75, 0.95],
        [1.20, 0.70],
        [1.588, 0.489]
      ]
    },
    {
      id: 'a11-dambulla-polonnaruwa',
      from: 'dambulla',
      to: 'polonnaruwa',
      mode: 'both',
      name: 'A11 Dambulla - Polonnaruwa Highway',
      distanceKm: 68,
      durationMin: 80,
      points: [
        [-1.089, -0.019],
        [-0.255, 0.617],
        [0.305, 1.203],
        [1.00, 0.80],
        [1.588, 0.489]
      ]
    },
    {
      id: 'a9-dambulla-anuradhapura',
      from: 'dambulla',
      to: 'anuradhapura',
      mode: 'both',
      name: 'A9 / A28 Sacred City Highway',
      distanceKm: 65,
      durationMin: 75,
      points: [
        [-1.089, -0.019],
        [-1.55, 0.85],
        [-2.15, 1.70],
        [-2.65, 2.55],
        [-2.994, 3.339]
      ]
    },

    // =========================================================================
    // 8. NORTHERN & NORTH-WESTERN HIGHWAYS (Wilpattu, Mannar, Jaffna)
    // =========================================================================
    {
      id: 'road-anuradhapura-wilpattu',
      from: 'anuradhapura',
      to: 'wilpattu',
      mode: 'both',
      name: 'B201 Wilpattu Wildlife Corridor',
      distanceKm: 40,
      durationMin: 45,
      points: [
        [-2.994, 3.339],
        [-4.10, 3.65],
        [-5.15, 4.05],
        [-6.051, 4.443]
      ]
    },
    {
      id: 'a9-anuradhapura-jaffna',
      from: 'anuradhapura',
      to: 'jaffna',
      mode: 'both',
      name: 'A9 Northern Highway (Elephant Pass)',
      distanceKm: 195,
      durationMin: 225,
      points: [
        [-2.994, 3.339],
        [-2.65, 4.90],
        [-2.35, 6.70],
        [-2.80, 8.85],
        [-3.60, 11.20],
        [-4.55, 12.80],
        [-5.35, 13.35],
        [-6.038, 13.708]
      ]
    },
    {
      id: 'a14-anuradhapura-mannar',
      from: 'anuradhapura',
      to: 'mannar',
      mode: 'both',
      name: "A14 Causeway to Adam's Bridge",
      distanceKm: 105,
      durationMin: 120,
      points: [
        [-2.994, 3.339],
        [-3.85, 4.65],
        [-4.80, 6.00],
        [-5.80, 7.30],
        [-6.83, 8.484]
      ]
    },
    {
      id: 'a3-colombo-wilpattu',
      from: 'colombo',
      to: 'wilpattu',
      mode: 'both',
      name: 'A3 Coastal Highway to Wilpattu Safari',
      distanceKm: 175,
      durationMin: 220,
      points: [
        [-7.16, -7.293],
        [-6.985, -5.344],
        [-7.355, -5.191],
        [-7.15, -4.10],
        [-6.95, -2.60],
        [-6.70, -0.90],
        [-6.55, 1.20],
        [-6.30, 2.80],
        [-6.051, 4.443]
      ]
    },
    {
      id: 'a3-airport-wilpattu',
      from: 'airport',
      to: 'wilpattu',
      mode: 'both',
      name: 'A3 Coastal Highway to Wilpattu Safari',
      distanceKm: 145,
      durationMin: 185,
      points: [
        [-6.985, -5.344],
        [-7.355, -5.191],
        [-7.15, -4.10],
        [-6.95, -2.60],
        [-6.70, -0.90],
        [-6.55, 1.20],
        [-6.30, 2.80],
        [-6.051, 4.443]
      ]
    },
    {
      id: 'a3-negombo-wilpattu',
      from: 'negombo',
      to: 'wilpattu',
      mode: 'both',
      name: 'A3 Coastal Highway to Wilpattu Safari',
      distanceKm: 138,
      durationMin: 175,
      points: [
        [-7.355, -5.191],
        [-7.15, -4.10],
        [-6.95, -2.60],
        [-6.70, -0.90],
        [-6.55, 1.20],
        [-6.30, 2.80],
        [-6.051, 4.443]
      ]
    },
    {
      id: 'road-wilpattu-mannar',
      from: 'wilpattu',
      to: 'mannar',
      mode: 'both',
      name: 'B379 / A32 Wilpattu - Mannar Coastal Route',
      distanceKm: 85,
      durationMin: 100,
      points: [
        [-6.051, 4.443],
        [-6.35, 5.80],
        [-6.60, 7.20],
        [-6.83, 8.484]
      ]
    },

    // =========================================================================
    // 9. EAST COAST (Trincomalee, Passikudah, Arugam Bay)
    // =========================================================================
    {
      id: 'a6-dambulla-trincomalee',
      from: 'dambulla',
      to: 'trincomalee',
      mode: 'both',
      name: 'A6 Trinco Harbour Highway',
      distanceKm: 106,
      durationMin: 120,
      points: [
        [-1.089, -0.019],
        [-0.30, 0.85],
        [0.35, 1.05],
        [1.80, 4.10],
        [2.70, 4.90],
        [3.379, 5.459]
      ]
    },
    {
      id: 'road-trinco-pigeon-island',
      from: 'trincomalee',
      to: 'pigeon-island',
      mode: 'both',
      name: 'Nilaveli Marine Highway',
      distanceKm: 16,
      durationMin: 25,
      points: [
        [3.379, 5.459],
        [3.25, 6.05],
        [3.151, 6.488]
      ]
    },
    {
      id: 'road-polonnaruwa-passikudah',
      from: 'polonnaruwa',
      to: 'passikudah',
      mode: 'both',
      name: 'A11 East Coast Reef Route',
      distanceKm: 72,
      durationMin: 85,
      points: [
        [1.588, 0.489],
        [2.80, 0.45],
        [4.20, 0.40],
        [5.40, 0.38],
        [5.921, 0.37]
      ]
    },
    {
      id: 'a4-passikudah-arugambay',
      from: 'passikudah',
      to: 'arugam-bay',
      mode: 'both',
      name: 'A15 / A4 Coastal Surf Corridor',
      distanceKm: 140,
      durationMin: 190,
      points: [
        [5.921, 0.37],
        [6.60, -1.20],
        [6.60, -3.20],
        [6.80, -5.10],
        [7.40, -6.80],
        [7.935, -7.949]
      ]
    },
    {
      id: 'a4-ella-arugambay',
      from: 'ella',
      to: 'arugam-bay',
      mode: 'both',
      name: 'A4 Ella - Arugam Bay Highway',
      distanceKm: 135,
      durationMin: 180,
      points: [
        [1.943, -7.756],
        [3.20, -7.80],
        [4.50, -7.85],
        [5.80, -7.90],
        [6.90, -7.92],
        [7.935, -7.949]
      ]
    },

    // =========================================================================
    // 10. ADVENTURE & ECO-TOURISM (Kitulgala, Adams Peak, Sinharaja)
    // =========================================================================
    {
      id: 'a7-colombo-kitulgala',
      from: 'colombo',
      to: 'kitulgala',
      mode: 'both',
      name: 'A7 Kelani Valley Adventure Road',
      distanceKm: 85,
      durationMin: 140,
      points: [
        [-7.16, -7.293],
        [-6.10, -7.20],
        [-5.05, -7.10],
        [-3.95, -7.00],
        [-2.894, -6.861]
      ]
    },
    {
      id: 'road-kitulgala-adamspeak',
      from: 'kitulgala',
      to: 'adams-peak',
      mode: 'both',
      name: 'A7 / B149 Sacred Mountain Ascent',
      distanceKm: 42,
      durationMin: 75,
      points: [
        [-2.894, -6.861],
        [-2.60, -7.30],
        [-2.40, -7.80],
        [-2.261, -8.197]
      ]
    },
    {
      id: 'road-colombo-sinharaja',
      from: 'colombo',
      to: 'sinharaja',
      mode: 'both',
      name: 'E01 / B422 Rainforest Route',
      distanceKm: 130,
      durationMin: 210,
      points: [
        [-7.16, -7.293],
        [-6.65, -8.30],
        [-5.80, -11.05],
        [-4.50, -11.10],
        [-3.40, -11.15],
        [-2.57, -11.212]
      ]
    },

    // =========================================================================
    // 11. NORTHERN ISLANDS (Delft, Nainativu, Casuarina Beach)
    // =========================================================================
    {
      id: 'road-jaffna-casuarina',
      from: 'jaffna',
      to: 'casuarina-beach',
      mode: 'both',
      name: 'Karaitivu Causeway',
      distanceKm: 24,
      durationMin: 40,
      points: [
        [-6.038, 13.708],
        [-6.45, 14.10],
        [-6.951, 14.556]
      ]
    },
    {
      id: 'road-jaffna-nainativu',
      from: 'jaffna',
      to: 'nainativu',
      mode: 'both',
      name: 'Kayts - Kurikadduwan Causeway & Boat',
      distanceKm: 38,
      durationMin: 65,
      points: [
        [-6.038, 13.708],
        [-6.90, 13.50],
        [-7.838, 13.351]
      ]
    },
    {
      id: 'road-jaffna-delft',
      from: 'jaffna',
      to: 'delft-island',
      mode: 'both',
      name: 'Kurikadduwan Jetty & Delft Ferry',
      distanceKm: 48,
      durationMin: 90,
      points: [
        [-6.038, 13.708],
        [-6.90, 13.50],
        [-7.838, 13.351],
        [-8.462, 12.596]
      ]
    }
  ];

  // Build Adjacency Graphs for Highway and Normal modes
  const graphs = {
    highway: {},
    normal: {}
  };

  function addEdgeToGraph(targetGraph, u, v, segment, isReverse) {
    if (!targetGraph[u]) targetGraph[u] = [];
    const pts = isReverse ? [...segment.points].reverse() : segment.points;
    targetGraph[u].push({
      to: v,
      segmentId: segment.id,
      name: segment.name,
      distanceKm: segment.distanceKm,
      durationMin: segment.durationMin,
      mode: segment.mode || 'both',
      points: pts
    });
  }

  SEGMENTS.forEach((seg) => {
    const segMode = seg.mode || 'both';
    if (segMode === 'highway' || segMode === 'both') {
      addEdgeToGraph(graphs.highway, seg.from, seg.to, seg, false);
      addEdgeToGraph(graphs.highway, seg.to, seg.from, seg, true);
    }
    if (segMode === 'normal' || segMode === 'both') {
      addEdgeToGraph(graphs.normal, seg.from, seg.to, seg, false);
      addEdgeToGraph(graphs.normal, seg.to, seg.from, seg, true);
    }
  });

  // Normalize ID helper
  function normalizeId(id) {
    if (!id) return '';
    const clean = id.toLowerCase().replace(/[-_]/g, ' ').trim();
    if (clean.includes('airport') || clean.includes('bia')) return 'airport';
    if (clean.includes('colombo')) return 'colombo';
    if (clean.includes('negombo')) return 'negombo';
    if (clean.includes('kandy')) return 'kandy';
    if (clean.includes('dambulla')) return 'dambulla';
    if (clean.includes('sigiriya')) return 'sigiriya';
    if (clean.includes('polonnaruwa')) return 'polonnaruwa';
    if (clean.includes('anuradhapura')) return 'anuradhapura';
    if (clean.includes('nuwara') || clean.includes('eliya')) return 'nuwara-eliya';
    if (clean.includes('ella')) return 'ella';
    if (clean.includes('yala')) return 'yala';
    if (clean.includes('udawalawe')) return 'udawalawe';
    if (clean.includes('mirissa')) return 'mirissa';
    if (clean.includes('galle')) return 'galle';
    if (clean.includes('bentota')) return 'bentota';
    if (clean.includes('unawatuna')) return 'unawatuna';
    if (clean.includes('weligama')) return 'weligama';
    if (clean.includes('hikkaduwa')) return 'hikkaduwa';
    if (clean.includes('tangalle')) return 'tangalle';
    if (clean.includes('trincomalee') || clean.includes('trinco')) return 'trincomalee';
    if (clean.includes('passikudah') || clean.includes('pasikuda')) return 'passikudah';
    if (clean.includes('arugam')) return 'arugam-bay';
    if (clean.includes('jaffna')) return 'jaffna';
    if (clean.includes('wilpattu')) return 'wilpattu';
    if (clean.includes('sinharaja')) return 'sinharaja';
    if (clean.includes('horton')) return 'horton-plains';
    if (clean.includes('adam')) return 'adams-peak';
    if (clean.includes('minneriya')) return 'minneriya';
    if (clean.includes('kitulgala')) return 'kitulgala';
    if (clean.includes('mannar')) return 'mannar';
    if (clean.includes('pigeon')) return 'pigeon-island';
    if (clean.includes('delft')) return 'delft-island';
    if (clean.includes('casuarina')) return 'casuarina-beach';
    if (clean.includes('nainativu')) return 'nainativu';
    return id.toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * Returns an authentic route descriptor for any destination pair
   */
  function getRealRouteName(start, end, mode) {
    const s = start.toLowerCase();
    const e = end.toLowerCase();
    const pair = [s, e].sort().join(':');

    // Expressways & Key Arterials
    if (pair === 'airport:colombo') {
      return mode === 'highway' ? 'E03 Katunayake Expressway' : 'A3 Peliyagoda - Wattala Road';
    }
    if (pair.includes('colombo') && (pair.includes('galle') || pair.includes('matara') || pair.includes('mirissa') || pair.includes('weligama') || pair.includes('unawatuna') || pair.includes('hikkaduwa') || pair.includes('bentota'))) {
      return mode === 'highway' ? 'E01 Southern Expressway' : 'A2 Coastal Galle Road';
    }
    if (pair.includes('airport') && (pair.includes('galle') || pair.includes('matara') || pair.includes('mirissa') || pair.includes('bentota') || pair.includes('hikkaduwa'))) {
      return mode === 'highway' ? 'E03 Katunayake & E01 Southern Expressways' : 'A3 & A2 Coastal Galle Road';
    }
    if ((s === 'colombo' || s === 'airport') && e === 'anuradhapura') {
      return mode === 'highway' ? 'A28 Padeniya - Anuradhapura Highway' : 'A3 Coastal Highway via Chilaw & Puttalam';
    }
    if ((e === 'colombo' || e === 'airport') && s === 'anuradhapura') {
      return mode === 'highway' ? 'A28 Padeniya - Anuradhapura Highway' : 'A3 Coastal Highway via Chilaw & Puttalam';
    }
    if ((s === 'colombo' || s === 'airport') && e === 'kandy') {
      return mode === 'highway' ? 'E04 Central Expressway / Kandy Link' : 'A1 Traditional Kadugannawa Pass';
    }
    if ((e === 'colombo' || e === 'airport') && s === 'kandy') {
      return mode === 'highway' ? 'E04 Central Expressway / Kandy Link' : 'A1 Traditional Kadugannawa Pass';
    }
    if (pair.includes('kandy') && pair.includes('nuwara-eliya')) {
      return 'A5 Gampola - Nuwara Eliya Mountain Pass';
    }
    if (pair.includes('nuwara-eliya') && pair.includes('ella')) {
      return 'A16 Highland Cloud Forest Tea Corridor';
    }
    if (pair.includes('kandy') && (pair.includes('sigiriya') || pair.includes('dambulla'))) {
      return 'A9 Central Cultural Corridor';
    }
    if ((pair.includes('sigiriya') || pair.includes('dambulla')) && pair.includes('polonnaruwa')) {
      return 'A11 Habarana - Polonnaruwa Heritage Highway';
    }
    if (pair.includes('ella') && pair.includes('yala')) {
      return 'A23 Wellawaya - Thanamalwila Safari Route';
    }
    if (pair.includes('jaffna')) {
      return 'A9 Northern Kandy - Jaffna Highway';
    }
    if (pair.includes('trincomalee')) {
      return 'A6 Habarana - Trincomalee Eastern Highway';
    }
    if (pair.includes('arugam-bay')) {
      return 'A4 Southern Eastern Surf Corridor';
    }
    if (pair.includes('wilpattu')) {
      return 'A12 Puttalam - Anuradhapura Forest Highway';
    }
    if (pair.includes('udawalawe')) {
      return 'A18 Pelmadulla - Nonagama Wildlife Route';
    }
    if (pair.includes('sinharaja')) {
      return 'Rainforest Biosphere Access Corridor';
    }

    function cap(str) { return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' '); }
    return `${cap(start)} ⇄ ${cap(end)} National Highway`;
  }

  /**
   * Finds the authentic road route between any two destinations.
   * Prioritizes real OpenStreetMap/OSRM road geometries (561 pairs), with
   * seamless fallback to Dijkstra's algorithm.
   * Supports 'highway' (Expressways & Arterial Bypasses) and 'normal' (Coastal & Town Roads).
   */
  function findRoute(startId, endId, requestedMode) {
    const start = normalizeId(startId);
    const end = normalizeId(endId);

    if (!start || !end) {
      return null;
    }

    const mode = (requestedMode === 'normal' || requestedMode === 'highway') ? requestedMode : activeRouteMode;

    if (start === end) {
      const coord = JUNCTIONS[start] || [0, 0];
      return {
        startId: start,
        endId: end,
        mode: mode,
        isHighway: mode === 'highway',
        points: [coord, coord],
        distanceKm: 0,
        durationMin: 0,
        formattedDistance: '0 km',
        formattedDuration: '0 min',
        routeName: 'Within Destination',
        isLocal: true
      };
    }

    // 1. Check authentic real road data (OSRM / OpenStreetMap verified geometries)
    if (window.SRI_LANKA_REAL_ROUTES) {
      const k1 = `${start}:${end}`;
      const k2 = `${end}:${start}`;
      const routeEntry = window.SRI_LANKA_REAL_ROUTES[k1] || window.SRI_LANKA_REAL_ROUTES[k2];
      if (routeEntry) {
        const isReversed = !window.SRI_LANKA_REAL_ROUTES[k1];
        let chosenData = null;
        if (mode === 'normal' && routeEntry.n) {
          chosenData = routeEntry.n;
        } else if (routeEntry.h) {
          chosenData = routeEntry.h;
        } else if (routeEntry.n) {
          chosenData = routeEntry.n;
        }

        if (chosenData) {
          const [distKm, durMin, rawPts] = chosenData;
          let points = isReversed ? rawPts.slice().reverse().map(p => [...p]) : rawPts.map(p => [...p]);

          // Snap endpoints precisely to junction coordinates
          if (JUNCTIONS[start]) points[0] = [...JUNCTIONS[start]];
          if (JUNCTIONS[end]) points[points.length - 1] = [...JUNCTIONS[end]];

          return {
            startId: start,
            endId: end,
            mode: mode,
            isHighway: mode === 'highway',
            points: points,
            distanceKm: Math.round(distKm),
            durationMin: durMin,
            formattedDistance: `${Math.round(distKm)} km`,
            formattedDuration: formatDuration(durMin),
            routeName: getRealRouteName(start, end, mode),
            isRealRoute: true
          };
        }
      }
    }

    // 2. Standard Dijkstra fallback for any custom or missing junctions
    const graph = graphs[mode] || graphs.highway;

    const distances = {};
    const previous = {};
    const unvisited = new Set();

    Object.keys(graph).forEach(node => {
      distances[node] = Infinity;
      unvisited.add(node);
    });
    distances[start] = 0;

    while (unvisited.size > 0) {
      let current = null;
      let minDistance = Infinity;

      unvisited.forEach(node => {
        if (distances[node] < minDistance) {
          minDistance = distances[node];
          current = node;
        }
      });

      if (current === null || current === end || minDistance === Infinity) {
        break;
      }

      unvisited.delete(current);

      if (graph[current]) {
        graph[current].forEach(edge => {
          if (unvisited.has(edge.to)) {
            const alt = distances[current] + edge.distanceKm;
            if (alt < distances[edge.to]) {
              distances[edge.to] = alt;
              previous[edge.to] = { from: current, edge: edge };
            }
          }
        });
      }
    }

    // If no path in requested graph, try fallback to the other graph
    if (!previous[end] && distances[end] === Infinity) {
      const fallbackMode = (mode === 'highway') ? 'normal' : 'highway';
      const fallbackGraph = graphs[fallbackMode];
      if (fallbackGraph && fallbackGraph[start]) {
        return findRoute(startId, endId, fallbackMode);
      }

      // Straight line interpolation fallback
      const startCoord = JUNCTIONS[start];
      const endCoord = JUNCTIONS[end];
      if (startCoord && endCoord) {
        const dx = endCoord[0] - startCoord[0];
        const dy = endCoord[1] - startCoord[1];
        const distKm = Math.round(Math.hypot(dx, dy) * 16.5);
        const durMin = Math.round(distKm * 1.5);
        return {
          startId: start,
          endId: end,
          mode: mode,
          isHighway: mode === 'highway',
          points: [startCoord, endCoord],
          distanceKm: distKm,
          durationMin: durMin,
          formattedDistance: `${distKm} km`,
          formattedDuration: formatDuration(durMin),
          routeName: `${start.toUpperCase()} ➔ ${end.toUpperCase()}`
        };
      }
      return null;
    }

    // Reconstruct path
    const pathEdges = [];
    let curr = end;
    while (previous[curr]) {
      pathEdges.unshift(previous[curr].edge);
      curr = previous[curr].from;
    }

    const allPoints = [];
    let totalKm = 0;
    let totalMin = 0;
    const names = [];

    pathEdges.forEach((edge, idx) => {
      totalKm += edge.distanceKm;
      totalMin += edge.durationMin;
      if (!names.includes(edge.name)) names.push(edge.name);

      const pts = edge.points;
      if (idx > 0 && allPoints.length > 0) {
        allPoints.push(...pts.slice(1));
      } else {
        allPoints.push(...pts);
      }
    });

    return {
      startId: start,
      endId: end,
      mode: mode,
      isHighway: mode === 'highway',
      points: allPoints,
      distanceKm: totalKm,
      durationMin: totalMin,
      formattedDistance: `${totalKm} km`,
      formattedDuration: formatDuration(totalMin),
      routeName: names.join(' • ')
    };
  }

  function formatDuration(minutes) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0 && mins > 0) {
      return `${hrs}h ${mins}m`;
    } else if (hrs > 0) {
      return `${hrs}h`;
    } else {
      return `${mins} min`;
    }
  }

  function setRouteMode(mode) {
    if (mode === 'normal' || mode === 'highway') {
      activeRouteMode = mode;
    }
    return activeRouteMode;
  }

  function getRouteMode() {
    return activeRouteMode;
  }

  // Export to window
  window.SRI_LANKA_ROUTES = {
    junctions: JUNCTIONS,
    segments: SEGMENTS,
    graphs: graphs,
    findRoute: findRoute,
    setRouteMode: setRouteMode,
    getRouteMode: getRouteMode,
    normalizeId: normalizeId,
    formatDuration: formatDuration
  };

})();
