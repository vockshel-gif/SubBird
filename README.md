# SubBird

> **SunBird / SubBird - Sri Lanka Travel Itinerary & Tactical Command Center**

An interactive, high-fidelity travel itinerary builder and exploration web application tailored for Sri Lanka tourism operations.

---

## 🌟 Features

- **Interactive 3D Sri Lanka Map (`Three.js`)**: Real elevation terrain, tactical satellite imagery, interactive tourist hotspots, animated route paths, and regional weather monsoon layers.
- **Dynamic Itinerary Builder**: Customizable day-by-day itineraries with distance calculations, attraction timings, and route overviews.
- **Curated Accommodation Intelligence**: Comprehensive hotel database with categorized tiers, amenities, and location pins across Sri Lanka.
- **Interactive 3D Vehicle Showcase**: Interactive 3D fleet inspection (Toyota Prius, Toyota Hiace Van) with specs, seating capacities, and luggage limits.
- **Executive PDF Export & Printing**: Pixel-perfect quotation and itinerary document export with customizable letterhead and branding.

---

## 🚀 Live Hosting on GitHub Pages

This repository is built as a static client-side web application and can be hosted directly on GitHub Pages with zero build steps required:

1. Go to your repository on GitHub: `https://github.com/vockshel-gif/SubBird`
2. Navigate to **Settings** > **Pages** (under the "Code and automation" section).
3. Under **Build and deployment** > **Branch**:
   - Select `main` branch.
   - Select `/ (root)` folder.
4. Click **Save**.
5. Your web application will be live at: `https://vockshel-gif.github.io/SubBird/`

---

## 📁 Repository Structure

```
SubBird/
├── index.html                     # Primary application launch hub & tactical UI
├── itinerary_modern.html          # Modern quotation & itinerary template
├── itinerary_classic.html         # Classic style itinerary layout
├── itinerary-builder.html         # Dedicated itinerary constructor
├── letterhead.html                # Official company letterhead template
├── css/
│   └── styles.css                 # Master application styling & design system
├── js/
│   ├── app.js                     # Core application state & UI coordinator
│   ├── map3d.js                   # Three.js 3D Sri Lanka terrain visualization
│   ├── vehicle-showcase.js        # 3D interactive vehicle viewer
│   ├── hotels-data.js             # Sri Lanka hotel database & metadata
│   ├── real-routes-data.js        # Real waypoint coordinates & route paths
│   └── lib/                       # Three.js loaders & controls
├── assets/                        # High-resolution satellite & terrain textures
├── Vehicles/                      # 3D models (.glb, .obj) and materials for vehicle fleet
├── Fonts/                         # Embedded brand typography
└── Logo/                          # Brand logos, badges & partner iconography
```

---

## 🛠️ Local Development

Simply serve the repository folder with any static web server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js (npx)
npx serve .
```

Open `http://localhost:8000` in your web browser.
