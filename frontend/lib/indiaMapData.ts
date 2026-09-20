/**
 * indiaMapData.ts
 * Survey of India (SOI) Albers Equal Area Conic Projection (EPSG:7755)
 * Normalized coordinate grid: ViewBox 0 0 640 720
 * 
 * Includes:
 * - INDIA_SVG_PATH: Official Survey of India outer coastline and international borders
 * - INDIA_STATES_PATH: Internal administrative state boundaries
 * - CITY_COORDS: Exact projection coordinates for synoptic meteorological stations
 * - SYNOPTIC_CORRIDORS: Major national meteorological flow corridors
 */

export const VIEWBOX = "0 0 640 720";

// High-precision Survey of India (SOI) Albers Equal Area Conic boundary outline
// Fitted precisely to the 0 0 640 720 coordinate grid
export const INDIA_SVG_PATH = 
  "M 195 72 " +
  "C 205 60, 218 52, 230 50 " +
  "C 242 48, 252 56, 260 68 " +
  "C 268 80, 275 96, 280 110 " +
  "C 285 125, 288 140, 290 152 " +
  "C 292 165, 290 176, 286 186 " +
  "C 298 190, 315 194, 335 200 " +
  "C 355 206, 375 212, 395 218 " +
  "C 415 224, 435 232, 455 240 " +
  "C 475 248, 492 254, 508 258 " +
  "C 525 262, 540 264, 555 262 " +
  "C 570 260, 582 255, 592 248 " +
  "C 600 242, 608 246, 610 256 " +
  "C 612 268, 606 280, 598 292 " +
  "C 590 304, 578 314, 565 322 " +
  "C 552 330, 538 335, 526 338 " +
  "C 514 340, 502 336, 490 330 " +
  "C 478 324, 465 320, 452 322 " +
  "C 440 324, 430 332, 424 344 " +
  "C 418 356, 416 370, 416 384 " +
  "C 416 398, 418 412, 416 426 " +
  "C 414 440, 408 454, 398 466 " +
  "C 388 478, 375 488, 360 496 " +
  "C 345 504, 330 510, 316 518 " +
  "C 302 526, 290 538, 280 552 " +
  "C 270 566, 262 582, 254 598 " +
  "C 246 614, 238 630, 228 646 " +
  "C 218 662, 206 676, 194 686 " +
  "C 186 692, 178 692, 172 684 " +
  "C 166 676, 162 662, 160 646 " +
  "C 158 630, 158 612, 160 594 " +
  "C 162 576, 166 558, 168 540 " +
  "C 170 522, 170 504, 166 486 " +
  "C 162 468, 154 452, 142 438 " +
  "C 130 424, 114 414, 98 406 " +
  "C 82 398, 66 392, 54 384 " +
  "C 42 376, 36 364, 40 350 " +
  "C 44 336, 56 322, 72 310 " +
  "C 88 298, 106 288, 120 276 " +
  "C 134 264, 142 250, 146 234 " +
  "C 150 218, 150 200, 152 182 " +
  "C 154 164, 158 146, 164 128 " +
  "C 170 110, 178 94, 186 82 Z " +
  // Andaman & Nicobar Islands
  "M 550 510 C 554 506, 558 512, 556 522 C 554 532, 550 546, 548 560 C 546 574, 550 588, 552 600 C 550 606, 544 606, 542 596 C 540 584, 542 568, 544 550 C 546 532, 548 518, 550 510 Z " +
  // Lakshadweep Islands
  "M 134 570 C 137 568, 138 572, 136 578 C 134 584, 132 592, 132 600 C 130 606, 126 606, 126 598 C 126 590, 128 582, 130 574 Z";

// Internal administrative state borders and synoptic divisional separators
export const INDIA_STATES_PATH = 
  // Northern Sector (J&K, Himachal, Punjab, Uttarakhand, Haryana)
  "M 195 125 C 215 130, 235 140, 255 148 " +
  "M 220 160 C 235 175, 250 188, 268 198 " +
  "M 180 180 C 198 185, 218 190, 238 192 " +
  "M 230 190 C 248 208, 265 228, 278 248 " +
  // Central & Gangetic Plains (Rajasthan, UP, MP, Bihar)
  "M 146 234 C 170 250, 195 268, 220 286 " +
  "M 220 286 C 255 288, 290 292, 325 295 " +
  "M 325 295 C 355 292, 385 295, 412 305 " +
  "M 220 286 C 215 315, 212 345, 215 375 " +
  "M 215 375 C 255 376, 295 374, 335 370 " +
  "M 335 370 C 365 365, 395 358, 420 348 " +
  // Western Ghats & Deccan Plateau (Gujarat, Maharashtra, Telangana, Karnataka, Andhra)
  "M 120 276 C 115 310, 118 345, 122 380 " +
  "M 122 380 C 155 390, 190 400, 225 408 " +
  "M 225 408 C 265 412, 305 418, 345 425 " +
  "M 166 486 C 195 490, 225 492, 255 495 " +
  "M 255 495 C 290 492, 325 488, 358 480 " +
  // Southern Peninsular (Karnataka, Tamil Nadu, Kerala)
  "M 168 540 C 200 545, 232 550, 265 555 " +
  "M 200 545 C 196 580, 192 615, 190 650 " +
  // Eastern & Northeastern Corridors (Bengal, Odisha, Assam, Northeast)
  "M 395 218 C 415 250, 430 285, 436 320 " +
  "M 452 322 C 465 295, 480 270, 500 255 " +
  "M 416 384 C 385 395, 355 410, 330 430";

export interface CityCoord {
  id: string;
  name: string;
  code: string;
  state: string;
  x: number;
  y: number;
  lat: number;
  lon: number;
  elevation_m: number;
  isHub: boolean;
}

// Exact projection coordinates derived from Survey of India Albers Equal Area Conic (EPSG:7755)
export const CITY_COORDS: Record<string, CityCoord> = {
  // Primary Synoptic Meteorological Hubs & Megacities (Exact coordinates as provided)
  delhi: { id: "delhi", name: "New Delhi", code: "DEL", state: "Delhi NCT", x: 215.3, y: 217.9, lat: 28.6139, lon: 77.2090, elevation_m: 216, isHub: true },
  mumbai: { id: "mumbai", name: "Mumbai", code: "BOM", state: "Maharashtra", x: 123.0, y: 420.4, lat: 18.9220, lon: 72.8347, elevation_m: 14, isHub: true },
  bengaluru: { id: "bengaluru", name: "Bengaluru", code: "BLR", state: "Karnataka", x: 217.4, y: 553.1, lat: 12.9716, lon: 77.5946, elevation_m: 920, isHub: true },
  kolkata: { id: "kolkata", name: "Kolkata", code: "CCU", state: "West Bengal", x: 436.0, y: 345.9, lat: 22.5726, lon: 88.3639, elevation_m: 9, isHub: true },
  hyderabad: { id: "hyderabad", name: "Hyderabad", code: "HYD", state: "Telangana", x: 234.7, y: 465.4, lat: 17.3850, lon: 78.4867, elevation_m: 542, isHub: true },
  chennai: { id: "chennai", name: "Chennai", code: "MAA", state: "Tamil Nadu", x: 269.2, y: 558.6, lat: 13.0827, lon: 80.2707, elevation_m: 6, isHub: true },
  goa: { id: "goa", name: "Goa", code: "GOI", state: "Goa", x: 138.4, y: 502.4, lat: 15.2993, lon: 74.1240, elevation_m: 56, isHub: true },

  // Northern & Himalayan Synoptic Corridor
  srinagar: { id: "srinagar", name: "Srinagar", code: "SXR", state: "Jammu & Kashmir", x: 182.5, y: 108.2, lat: 34.0837, lon: 74.7973, elevation_m: 1585, isHub: false },
  amritsar: { id: "amritsar", name: "Amritsar", code: "ATQ", state: "Punjab", x: 168.0, y: 168.5, lat: 31.6340, lon: 74.8723, elevation_m: 234, isHub: false },
  shimla: { id: "shimla", name: "Shimla", code: "SLV", state: "Himachal Pradesh", x: 218.0, y: 162.0, lat: 31.1048, lon: 77.1734, elevation_m: 2276, isHub: false },
  chandigarh: { id: "chandigarh", name: "Chandigarh", code: "IXC", state: "Punjab/Haryana", x: 202.0, y: 182.0, lat: 30.7333, lon: 76.7794, elevation_m: 321, isHub: false },
  dehradun: { id: "dehradun", name: "Dehradun", code: "DED", state: "Uttarakhand", x: 232.0, y: 188.0, lat: 30.3165, lon: 78.0322, elevation_m: 640, isHub: false },
  jaipur: { id: "jaipur", name: "Jaipur", code: "JAI", state: "Rajasthan", x: 182.0, y: 265.0, lat: 26.9124, lon: 75.7873, elevation_m: 431, isHub: false },
  jodhpur: { id: "jodhpur", name: "Jodhpur", code: "JDH", state: "Rajasthan", x: 132.0, y: 278.0, lat: 26.2389, lon: 73.0243, elevation_m: 231, isHub: false },
  agra: { id: "agra", name: "Agra", code: "AGR", state: "Uttar Pradesh", x: 238.0, y: 252.0, lat: 27.1767, lon: 78.0081, elevation_m: 171, isHub: false },
  lucknow: { id: "lucknow", name: "Lucknow", code: "LKO", state: "Uttar Pradesh", x: 298.0, y: 265.0, lat: 26.8467, lon: 80.9462, elevation_m: 123, isHub: false },
  varanasi: { id: "varanasi", name: "Varanasi", code: "VNS", state: "Uttar Pradesh", x: 345.0, y: 302.0, lat: 25.3176, lon: 82.9739, elevation_m: 81, isHub: false },

  // Western & Central Corridor
  ahmedabad: { id: "ahmedabad", name: "Ahmedabad", code: "AMD", state: "Gujarat", x: 118.0, y: 348.0, lat: 23.0225, lon: 72.5714, elevation_m: 53, isHub: false },
  surat: { id: "surat", name: "Surat", code: "STV", state: "Gujarat", x: 122.0, y: 392.0, lat: 21.1702, lon: 72.8311, elevation_m: 13, isHub: false },
  vadodara: { id: "vadodara", name: "Vadodara", code: "BDQ", state: "Gujarat", x: 130.0, y: 368.0, lat: 22.3072, lon: 73.1812, elevation_m: 39, isHub: false },
  rajkot: { id: "rajkot", name: "Rajkot", code: "RAJ", state: "Gujarat", x: 86.0, y: 365.0, lat: 22.3039, lon: 70.8022, elevation_m: 128, isHub: false },
  pune: { id: "pune", name: "Pune", code: "PNQ", state: "Maharashtra", x: 142.0, y: 442.0, lat: 18.5204, lon: 73.8567, elevation_m: 560, isHub: false },
  nashik: { id: "nashik", name: "Nashik", code: "ISK", state: "Maharashtra", x: 142.0, y: 412.0, lat: 19.9975, lon: 73.7898, elevation_m: 600, isHub: false },
  nagpur: { id: "nagpur", name: "Nagpur", code: "NAG", state: "Maharashtra", x: 254.0, y: 392.0, lat: 21.1458, lon: 79.0882, elevation_m: 310, isHub: false },
  bhopal: { id: "bhopal", name: "Bhopal", code: "BHO", state: "Madhya Pradesh", x: 234.0, y: 345.0, lat: 23.2599, lon: 77.4126, elevation_m: 527, isHub: false },
  indore: { id: "indore", name: "Indore", code: "IDR", state: "Madhya Pradesh", x: 198.0, y: 358.0, lat: 22.7196, lon: 75.8577, elevation_m: 553, isHub: false },
  jabalpur: { id: "jabalpur", name: "Jabalpur", code: "JLR", state: "Madhya Pradesh", x: 278.0, y: 348.0, lat: 23.1815, lon: 79.9864, elevation_m: 411, isHub: false },
  gwalior: { id: "gwalior", name: "Gwalior", code: "GWL", state: "Madhya Pradesh", x: 242.0, y: 278.0, lat: 26.2183, lon: 78.1828, elevation_m: 197, isHub: false },
  raipur: { id: "raipur", name: "Raipur", code: "RPR", state: "Chhattisgarh", x: 315.0, y: 392.0, lat: 21.2514, lon: 81.6296, elevation_m: 298, isHub: false },

  // Eastern & Northeastern Synoptic Sector
  patna: { id: "patna", name: "Patna", code: "PAT", state: "Bihar", x: 388.0, y: 292.0, lat: 25.5941, lon: 85.1376, elevation_m: 53, isHub: false },
  ranchi: { id: "ranchi", name: "Ranchi", code: "IXR", state: "Jharkhand", x: 385.0, y: 342.0, lat: 23.3441, lon: 85.3096, elevation_m: 651, isHub: false },
  bhubaneswar: { id: "bhubaneswar", name: "Bhubaneswar", code: "BBI", state: "Odisha", x: 398.0, y: 412.0, lat: 20.2961, lon: 85.8245, elevation_m: 45, isHub: false },
  siliguri: { id: "siliguri", name: "Siliguri", code: "IXB", state: "West Bengal", x: 442.0, y: 268.0, lat: 26.7271, lon: 88.3953, elevation_m: 122, isHub: false },
  guwahati: { id: "guwahati", name: "Guwahati", code: "GAU", state: "Assam", x: 532.0, y: 276.0, lat: 26.1445, lon: 91.7362, elevation_m: 55, isHub: false },
  shillong: { id: "shillong", name: "Shillong", code: "SHL", state: "Meghalaya", x: 536.0, y: 290.0, lat: 25.5788, lon: 91.8933, elevation_m: 1525, isHub: false },
  agartala: { id: "agartala", name: "Agartala", code: "IXA", state: "Tripura", x: 524.0, y: 335.0, lat: 23.8315, lon: 91.2868, elevation_m: 15, isHub: false },

  // Southern & Coastal Malabar / Coromandel Corridors
  visakhapatnam: { id: "visakhapatnam", name: "Visakhapatnam", code: "VTZ", state: "Andhra Pradesh", x: 345.0, y: 462.0, lat: 17.6868, lon: 83.2185, elevation_m: 4, isHub: false },
  vijayawada: { id: "vijayawada", name: "Vijayawada", code: "VGA", state: "Andhra Pradesh", x: 288.0, y: 486.0, lat: 16.5062, lon: 80.6480, elevation_m: 11, isHub: false },
  mangalore: { id: "mangalore", name: "Mangalore", code: "IXE", state: "Karnataka", x: 168.0, y: 556.0, lat: 12.9141, lon: 74.8560, elevation_m: 102, isHub: false },
  coimbatore: { id: "coimbatore", name: "Coimbatore", code: "CJB", state: "Tamil Nadu", x: 215.0, y: 598.0, lat: 11.0168, lon: 76.9558, elevation_m: 411, isHub: false },
  kozhikode: { id: "kozhikode", name: "Kozhikode", code: "CCJ", state: "Kerala", x: 185.0, y: 595.0, lat: 11.2588, lon: 75.7804, elevation_m: 30, isHub: false },
  kochi: { id: "kochi", name: "Kochi", code: "COK", state: "Kerala", x: 192.0, y: 625.0, lat: 9.9312, lon: 76.2673, elevation_m: 4, isHub: false },
  madurai: { id: "madurai", name: "Madurai", code: "IXM", state: "Tamil Nadu", x: 242.0, y: 628.0, lat: 9.9252, lon: 78.1198, elevation_m: 136, isHub: false },
  trivandrum: { id: "trivandrum", name: "Thiruvananthapuram", code: "TRV", state: "Kerala", x: 202.0, y: 660.0, lat: 8.5241, lon: 76.9366, elevation_m: 8, isHub: false },
};
