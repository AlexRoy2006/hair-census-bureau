/**
 * MUDI UNDO?™ — CENSUS TWIN DATABASE
 * -----------------------------------------------------------------------------
 * Data-driven character database for hair-census character matching.
 * Contains 20 popular fictional and real-world hair icons.
 * Strictly hair-based metrics — NO facial recognition or identity tracking.
 */

export interface CensusTwinProfile {
  id: string;
  name: string;
  franchise: string;
  image: string;
  targetHairCoverage: number;
  minHairCoverage: number;
  maxHairCoverage: number;
  description: string;
  association: string;
}

// Helper to create clean vector SVG Data URIs for character avatars
function createSvgAvatar(
  bgGradient: string,
  hairColor: string,
  hairPath: string,
  extraSvg: string = ""
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        ${bgGradient}
      </linearGradient>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="200" height="200" fill="url(#bg)" />
    <rect width="200" height="200" fill="url(#grid)" />
    <!-- Head Base -->
    <path d="M 60 110 C 60 65, 140 65, 140 110 C 140 155, 125 170, 100 170 C 75 170, 60 155, 60 110 Z" fill="#F3D5C0" stroke="#111" stroke-width="3"/>
    <!-- Character Hair / Accessories -->
    <g fill="${hairColor}" stroke="#111" stroke-width="3">
      ${hairPath}
    </g>
    ${extraSvg}
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// SVG Avatar Definitions for all 20 characters
const AVATARS = {
  saitama: createSvgAvatar(
    '<stop offset="0%" stop-color="#EAB308"/><stop offset="100%" stop-color="#CA8A04"/>',
    "none",
    "",
    `<!-- Shiny Glint -->
     <ellipse cx="100" cy="85" rx="35" ry="25" fill="#FFE4D6" opacity="0.3"/>
     <path d="M 80 65 Q 100 55 120 65" stroke="#FFF" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.7"/>
     <!-- Intense Eyes -->
     <ellipse cx="80" cy="115" rx="6" ry="6" fill="#111"/>
     <ellipse cx="120" cy="115" rx="6" ry="6" fill="#111"/>
     <path d="M 72 105 L 88 108" stroke="#111" stroke-width="3"/>
     <path d="M 128 105 L 112 108" stroke="#111" stroke-width="3"/>`
  ),

  krillin: createSvgAvatar(
    '<stop offset="0%" stop-color="#F97316"/><stop offset="100%" stop-color="#EA580C"/>',
    "none",
    "",
    `<!-- 6 Forehead Dots -->
     <circle cx="90" cy="80" r="3" fill="#64748B"/>
     <circle cx="100" cy="80" r="3" fill="#64748B"/>
     <circle cx="110" cy="80" r="3" fill="#64748B"/>
     <circle cx="90" cy="90" r="3" fill="#64748B"/>
     <circle cx="100" cy="90" r="3" fill="#64748B"/>
     <circle cx="110" cy="90" r="3" fill="#64748B"/>`
  ),

  professor_x: createSvgAvatar(
    '<stop offset="0%" stop-color="#1E3A8A"/><stop offset="100%" stop-color="#0F172A"/>',
    "none",
    "",
    `<!-- Telepathic Aura Rings -->
     <circle cx="100" cy="100" r="75" fill="none" stroke="#60A5FA" stroke-width="2" stroke-dasharray="6 4" opacity="0.8"/>
     <circle cx="100" cy="100" r="85" fill="none" stroke="#93C5FD" stroke-width="1.5" opacity="0.5"/>
     <!-- X Emblem -->
     <circle cx="100" cy="40" r="14" fill="#E2E8F0" stroke="#0F172A" stroke-width="2"/>
     <path d="M 93 33 L 107 47 M 107 33 L 93 47" stroke="#0F172A" stroke-width="3"/>`
  ),

  voldemort: createSvgAvatar(
    '<stop offset="0%" stop-color="#064E3B"/><stop offset="100%" stop-color="#022C22"/>',
    "none",
    "",
    `<!-- Snake Nostrils & Pale Skin -->
     <path d="M 95 120 L 93 128 M 105 120 L 107 128" stroke="#111" stroke-width="3" stroke-linecap="round"/>
     <ellipse cx="80" cy="108" rx="8" ry="4" fill="#EF4444"/>
     <ellipse cx="120" cy="108" rx="8" ry="4" fill="#EF4444"/>`
  ),

  walter_white: createSvgAvatar(
    '<stop offset="0%" stop-color="#D97706"/><stop offset="100%" stop-color="#78350F"/>',
    "#1E293B",
    `<!-- Pork Pie Hat -->
     <rect x="50" y="50" width="100" height="25" rx="4" fill="#1E293B"/>
     <rect x="35" y="70" width="130" height="8" rx="2" fill="#0F172A"/>`,
    `<!-- Glasses & Goatee -->
     <rect x="70" y="105" width="22" height="16" fill="none" stroke="#111" stroke-width="3"/>
     <rect x="108" y="105" width="22" height="16" fill="none" stroke="#111" stroke-width="3"/>
     <line x1="92" y1="113" x2="108" y2="113" stroke="#111" stroke-width="3"/>
     <path d="M 85 145 C 85 165, 115 165, 115 145 Z" fill="#475569"/>`
  ),

  gollum: createSvgAvatar(
    '<stop offset="0%" stop-color="#334155"/><stop offset="100%" stop-color="#0F172A"/>',
    "#475569",
    `<!-- Sparse Hair Strands -->
     <path d="M 60 75 Q 45 60 40 80 M 70 65 Q 60 45 55 60 M 130 65 Q 140 45 145 60 M 140 75 Q 155 60 160 80" stroke="#94A3B8" stroke-width="3" fill="none"/>`,
    `<!-- Big Gollum Eyes -->
     <circle cx="75" cy="110" r="16" fill="#FFF" stroke="#111" stroke-width="2"/>
     <circle cx="125" cy="110" r="16" fill="#FFF" stroke="#111" stroke-width="2"/>
     <circle cx="75" cy="110" r="7" fill="#84CC16"/>
     <circle cx="125" cy="110" r="7" fill="#84CC16"/>`
  ),

  marty_mcfly: createSvgAvatar(
    '<stop offset="0%" stop-color="#0284C7"/><stop offset="100%" stop-color="#0369A1"/>',
    "#78350F",
    `<!-- 80s Feathered Hair -->
     <path d="M 50 100 C 40 60, 70 40, 100 40 C 130 40, 160 60, 150 100 C 140 75, 120 60, 100 60 C 80 60, 60 75, 50 100 Z"/>`,
    `<!-- Red Vest Collar -->
     <path d="M 50 170 L 80 140 L 100 170 L 120 140 L 150 170 Z" fill="#DC2626" stroke="#111" stroke-width="2"/>`
  ),

  levi_ackerman: createSvgAvatar(
    '<stop offset="0%" stop-color="#475569"/><stop offset="100%" stop-color="#1E293B"/>',
    "#0F172A",
    `<!-- Undercut Hairstyle -->
     <path d="M 55 110 C 50 60, 75 35, 100 35 C 125 35, 150 60, 145 110 C 135 80, 115 65, 100 75 C 85 65, 65 80, 55 110 Z"/>
     <!-- Curtain Bangs -->
     <path d="M 70 65 L 95 90 L 100 75 L 105 90 L 130 65 Z" fill="#0F172A"/>`
  ),

  shikamaru_nara: createSvgAvatar(
    '<stop offset="0%" stop-color="#15803D"/><stop offset="100%" stop-color="#166534"/>',
    "#111827",
    `<!-- High Spiky Ponytail -->
     <path d="M 100 45 L 85 15 L 100 25 L 115 15 L 100 45 Z" fill="#111827"/>
     <path d="M 55 105 C 50 65, 75 45, 100 45 C 125 45, 150 65, 145 105 C 135 85, 115 70, 100 80 C 85 70, 65 85, 55 105 Z"/>
     <!-- Ponytail Tie -->
     <rect x="90" y="38" width="20" height="8" rx="2" fill="#DC2626"/>`
  ),

  tony_stark: createSvgAvatar(
    '<stop offset="0%" stop-color="#991B1B"/><stop offset="100%" stop-color="#450A0A"/>',
    "#1E293B",
    `<!-- Styled Dark Hair -->
     <path d="M 55 100 C 50 55, 75 40, 100 40 C 125 40, 150 55, 145 100 C 135 75, 120 60, 100 65 C 80 60, 65 75, 55 100 Z"/>`,
    `<!-- Goatee & Arc Reactor -->
     <path d="M 90 140 L 110 140 L 100 160 Z" fill="#1E293B"/>
     <circle cx="100" cy="180" r="12" fill="#38BDF8" stroke="#FFF" stroke-width="2"/>`
  ),

  luffy: createSvgAvatar(
    '<stop offset="0%" stop-color="#0284C7"/><stop offset="100%" stop-color="#075985"/>',
    "#1E293B",
    `<!-- Straw Hat -->
     <ellipse cx="100" cy="70" rx="75" ry="20" fill="#EAB308" stroke="#111" stroke-width="3"/>
     <path d="M 60 70 C 60 30, 140 30, 140 70 Z" fill="#EAB308" stroke="#111" stroke-width="3"/>
     <path d="M 60 65 Q 100 72 140 65" stroke="#DC2626" stroke-width="8" fill="none"/>
     <!-- Hair Tufts under hat -->
     <path d="M 50 90 L 65 110 L 75 95 M 125 95 L 135 110 L 150 90" fill="#1E293B"/>`
  ),

  naruto_uzumaki: createSvgAvatar(
    '<stop offset="0%" stop-color="#F97316"/><stop offset="100%" stop-color="#C2410C"/>',
    "#EAB308",
    `<!-- Spiky Blonde Hair -->
     <path d="M 45 90 L 35 60 L 60 65 L 60 35 L 85 45 L 100 20 L 115 45 L 140 35 L 140 65 L 165 60 L 155 90 Z"/>`,
    `<!-- Shinobi Headband -->
     <rect x="55" y="70" width="90" height="18" fill="#334155" stroke="#111" stroke-width="2"/>
     <rect x="80" y="73" width="40" height="12" rx="2" fill="#94A3B8"/>
     <!-- Spiral Emblem -->
     <circle cx="100" cy="79" r="3" fill="none" stroke="#111" stroke-width="1.5"/>`
  ),

  tanjiro_kamado: createSvgAvatar(
    '<stop offset="0%" stop-color="#881337"/><stop offset="100%" stop-color="#4C0519"/>',
    "#991B1B",
    `<!-- Spiky Burgundy Hair -->
     <path d="M 50 95 L 40 65 L 65 65 L 70 35 L 95 45 L 115 30 L 130 50 L 155 45 L 150 80 L 160 95 Z"/>`,
    `<!-- Forehead Scar & Hanafuda Earring -->
     <path d="M 75 80 Q 82 72 88 82 T 80 92 Z" fill="#7F1D1D"/>
     <rect x="42" y="115" width="10" height="18" fill="#FFF" stroke="#111" stroke-width="1.5"/>
     <circle cx="47" cy="120" r="3" fill="#DC2626"/>`
  ),

  ichigo_kurosaki: createSvgAvatar(
    '<stop offset="0%" stop-color="#EA580C"/><stop offset="100%" stop-color="#9A3412"/>',
    "#F97316",
    `<!-- Spiky Orange Soul Reaper Hair -->
     <path d="M 40 100 L 30 65 L 55 60 L 60 25 L 85 40 L 105 15 L 125 40 L 145 25 L 150 60 L 175 65 L 160 100 Z"/>`
  ),

  gojo_satoru: createSvgAvatar(
    '<stop offset="0%" stop-color="#4338CA"/><stop offset="100%" stop-color="#312E81"/>',
    "#F8FAFC",
    `<!-- Limitless Spiky White Hair -->
     <path d="M 40 100 L 25 60 L 55 55 L 55 15 L 85 30 L 100 5 L 115 30 L 145 15 L 145 55 L 175 60 L 160 100 Z"/>`,
    `<!-- Black Blindfold -->
     <rect x="52" y="85" width="96" height="24" rx="3" fill="#0F172A" stroke="#111" stroke-width="2"/>`
  ),

  johnny_bravo: createSvgAvatar(
    '<stop offset="0%" stop-color="#FACC15"/><stop offset="100%" stop-color="#CA8A04"/>',
    "#FDE047",
    `<!-- Huge Pompadour -->
     <path d="M 40 90 C 30 20, 90 5, 130 5 C 170 5, 180 40, 160 90 C 145 60, 120 40, 90 45 C 60 50, 45 70, 40 90 Z"/>`,
    `<!-- Sunglasses -->
     <polygon points="65,95 95,95 90,112 70,112" fill="#111"/>
     <polygon points="105,95 135,95 130,112 110,112" fill="#111"/>
     <line x1="95" y1="100" x2="105" y2="100" stroke="#111" stroke-width="3"/>`
  ),

  goku: createSvgAvatar(
    '<stop offset="0%" stop-color="#EAB308"/><stop offset="100%" stop-color="#854D0E"/>',
    "#FACC15",
    `<!-- Giant Super Saiyan Hair Spikes -->
     <path d="M 35 110 L 10 70 L 45 65 L 20 25 L 65 40 L 70 5 L 100 25 L 130 5 L 135 40 L 180 25 L 155 65 L 190 70 L 165 110 Z"/>`,
    `<!-- Golden Aura Flare -->
     <circle cx="100" cy="100" r="90" fill="none" stroke="#FDE047" stroke-width="3" stroke-dasharray="10 6" opacity="0.6"/>`
  ),

  bob_ross: createSvgAvatar(
    '<stop offset="0%" stop-color="#B45309"/><stop offset="100%" stop-color="#78350F"/>',
    "#92400E",
    `<!-- Happy Little Afro -->
     <circle cx="100" cy="85" r="65"/>
     <circle cx="60" cy="95" r="35"/>
     <circle cx="140" cy="95" r="35"/>
     <circle cx="100" cy="50" r="35"/>`,
    `<!-- Beard -->
     <path d="M 60 115 C 60 170, 140 170, 140 115 Z" fill="#92400E" stroke="#111" stroke-width="3"/>`
  ),

  einstein: createSvgAvatar(
    '<stop offset="0%" stop-color="#475569"/><stop offset="100%" stop-color="#0F172A"/>',
    "#E2E8F0",
    `<!-- Wild Genius Hair -->
     <path d="M 30 110 Q 10 70 40 50 Q 30 20 70 30 Q 100 5 130 30 Q 170 20 160 50 Q 190 70 170 110 Z"/>`,
    `<!-- Moustache -->
     <path d="M 75 135 Q 100 125 125 135 Q 100 150 75 135 Z" fill="#E2E8F0" stroke="#111" stroke-width="2"/>`
  ),

  hagrid: createSvgAvatar(
    '<stop offset="0%" stop-color="#1C1917"/><stop offset="100%" stop-color="#0C0A09"/>',
    "#27272A",
    `<!-- Massive Wild Hair & Beard Ecosystem -->
     <path d="M 25 120 C 10 40, 70 15, 100 15 C 130 15, 190 40, 175 120 C 190 180, 10 180, 25 120 Z"/>`,
    `<!-- Eyes peering through mane -->
     <circle cx="80" cy="95" r="5" fill="#FFF"/>
     <circle cx="120" cy="95" r="5" fill="#FFF"/>
     <circle cx="80" cy="95" r="2" fill="#111"/>
     <circle cx="120" cy="95" r="2" fill="#111"/>`
  ),
};

export const CENSUS_TWINS: CensusTwinProfile[] = [
  // 1. Saitama — 0%
  {
    id: "saitama",
    name: "Saitama",
    franchise: "One-Punch Man",
    image: AVATARS.saitama,
    targetHairCoverage: 0,
    minHairCoverage: 0,
    maxHairCoverage: 1,
    description: "The census confirms: there is no hair. Only confidence.",
    association: "MAXIMUM BALD EFFICIENCY",
  },
  // 2. Krillin — 2%
  {
    id: "krillin",
    name: "Krillin",
    franchise: "Dragon Ball",
    image: AVATARS.krillin,
    targetHairCoverage: 2,
    minHairCoverage: 1,
    maxHairCoverage: 2.5,
    description: "Maximum scalp efficiency detected.",
    association: "LOW-FOLLICLE MONK",
  },
  // 3. Professor X — 3%
  {
    id: "professor_x",
    name: "Professor X",
    franchise: "X-Men",
    image: AVATARS.professor_x,
    targetHairCoverage: 3,
    minHairCoverage: 2.5,
    maxHairCoverage: 3.5,
    description: "Your hair has apparently developed telepathic independence.",
    association: "TELEPATHIC SCALP DENSITY",
  },
  // 4. Voldemort — 4%
  {
    id: "voldemort",
    name: "Voldemort",
    franchise: "Harry Potter",
    image: AVATARS.voldemort,
    targetHairCoverage: 4,
    minHairCoverage: 3.5,
    maxHairCoverage: 8,
    description: "Even dark lords respect a clean scalp.",
    association: "DARK LORD AERODYNAMICS",
  },
  // 5. Walter White — 12%
  {
    id: "walter_white",
    name: "Walter White",
    franchise: "Breaking Bad",
    image: AVATARS.walter_white,
    targetHairCoverage: 12,
    minHairCoverage: 8,
    maxHairCoverage: 15,
    description: "The hair has entered its final season.",
    association: "HEISENBERG PRECISION",
  },

  // 6. Gollum — 18%
  {
    id: "gollum",
    name: "Gollum",
    franchise: "Lord of the Rings",
    image: AVATARS.gollum,
    targetHairCoverage: 18,
    minHairCoverage: 15,
    maxHairCoverage: 28,
    description: "Precious follicles detected.",
    association: "PRECIOUS FOLLICLE PATTERN",
  },
  // 7. Marty McFly — 40%
  {
    id: "marty_mcfly",
    name: "Marty McFly",
    franchise: "Back to the Future",
    image: AVATARS.marty_mcfly,
    targetHairCoverage: 40,
    minHairCoverage: 28,
    maxHairCoverage: 44,
    description: "Your hair density has travelled through time.",
    association: "TEMPORAL DENSITY SHIFT",
  },
  // 8. Levi Ackerman — 48%
  {
    id: "levi_ackerman",
    name: "Levi Ackerman",
    franchise: "Attack on Titan",
    image: AVATARS.levi_ackerman,
    targetHairCoverage: 48,
    minHairCoverage: 44,
    maxHairCoverage: 54,
    description: "Hair density acceptable. Cleaning standards remain questionable.",
    association: "PRECISION UNDERCUT",
  },
  // 9. Shikamaru Nara — 60%
  {
    id: "shikamaru_nara",
    name: "Shikamaru Nara",
    franchise: "Naruto",
    image: AVATARS.shikamaru_nara,
    targetHairCoverage: 60,
    minHairCoverage: 54,
    maxHairCoverage: 64,
    description: "Your hair density is acceptable. Your motivation is questionable.",
    association: "PONYTAIL TACTICIAN",
  },
  // 10. Tony Stark — 68%
  {
    id: "tony_stark",
    name: "Tony Stark",
    franchise: "Marvel",
    image: AVATARS.tony_stark,
    targetHairCoverage: 68,
    minHairCoverage: 64,
    maxHairCoverage: 70,
    description: "A perfect balance of technology, confidence and follicles.",
    association: "ARC-REACTOR FOLLICLE MATRIX",
  },

  // 11. Luffy — 72%
  {
    id: "luffy",
    name: "Luffy",
    franchise: "One Piece",
    image: AVATARS.luffy,
    targetHairCoverage: 72,
    minHairCoverage: 70,
    maxHairCoverage: 74,
    description: "Your hair has set sail toward unprecedented density.",
    association: "STRAW HAT FOLLICLE CREW",
  },
  // 12. Naruto Uzumaki — 75%
  {
    id: "naruto_uzumaki",
    name: "Naruto Uzumaki",
    franchise: "Naruto",
    image: AVATARS.naruto_uzumaki,
    targetHairCoverage: 75,
    minHairCoverage: 74,
    maxHairCoverage: 76.5,
    description: "Your hair has officially entered ninja territory.",
    association: "NINJA CROWN DENSITY",
  },
  // 13. Tanjiro Kamado — 78%
  {
    id: "tanjiro_kamado",
    name: "Tanjiro Kamado",
    franchise: "Demon Slayer",
    image: AVATARS.tanjiro_kamado,
    targetHairCoverage: 78,
    minHairCoverage: 76.5,
    maxHairCoverage: 79,
    description: "Your follicles have mastered the Water Breathing technique.",
    association: "WATER BREATHING CROP",
  },
  // 14. Ichigo Kurosaki — 80%
  {
    id: "ichigo_kurosaki",
    name: "Ichigo Kurosaki",
    franchise: "Bleach",
    image: AVATARS.ichigo_kurosaki,
    targetHairCoverage: 80,
    minHairCoverage: 79,
    maxHairCoverage: 81,
    description: "Your hair has crossed into Soul Reaper territory.",
    association: "SOUL REAPER SPIKES",
  },
  // 15. Gojo Satoru — 82%
  {
    id: "gojo_satoru",
    name: "Gojo Satoru",
    franchise: "Jujutsu Kaisen",
    image: AVATARS.gojo_satoru,
    targetHairCoverage: 82,
    minHairCoverage: 81,
    maxHairCoverage: 85,
    description: "Your hair appears to possess its own domain expansion.",
    association: "DOMAIN EXPANSION VOLUME",
  },

  // 16. Johnny Bravo — 88%
  {
    id: "johnny_bravo",
    name: "Johnny Bravo",
    franchise: "Cartoon Network",
    image: AVATARS.johnny_bravo,
    targetHairCoverage: 88,
    minHairCoverage: 85,
    maxHairCoverage: 89,
    description: "Hair population: absolutely fabulous.",
    association: "FABULOUS POMPADOUR",
  },
  // 17. Goku — 90%
  {
    id: "goku",
    name: "Goku",
    franchise: "Dragon Ball",
    image: AVATARS.goku,
    targetHairCoverage: 90,
    minHairCoverage: 89,
    maxHairCoverage: 91,
    description: "Your follicular energy level is dangerously high.",
    association: "SUPER SAIYAN MAXIMUM",
  },
  // 18. Bob Ross — 92%
  {
    id: "bob_ross",
    name: "Bob Ross",
    franchise: "Art",
    image: AVATARS.bob_ross,
    targetHairCoverage: 92,
    minHairCoverage: 91,
    maxHairCoverage: 93,
    description: "A happy little follicle has entered the census.",
    association: "HAPPY LITTLE AFRO",
  },
  // 19. Einstein — 94%
  {
    id: "einstein",
    name: "Einstein",
    franchise: "Science",
    image: AVATARS.einstein,
    targetHairCoverage: 94,
    minHairCoverage: 93,
    maxHairCoverage: 95,
    description: "The hair is doing more calculations than the computer.",
    association: "RELATIVISTIC DENSITY",
  },
  // 20. Hagrid — 96%
  {
    id: "hagrid",
    name: "Hagrid",
    franchise: "Harry Potter",
    image: AVATARS.hagrid,
    targetHairCoverage: 96,
    minHairCoverage: 95,
    maxHairCoverage: 100,
    description: "The census detected an unusually powerful follicular ecosystem.",
    association: "WILD WILDERNESS ECOSYSTEM",
  },
];

export const FALLBACK_TWIN: CensusTwinProfile = {
  id: "unknown_entity",
  name: "Unknown Follicular Entity",
  franchise: "Census Bureau Archives",
  image: createSvgAvatar(
    '<stop offset="0%" stop-color="#334155"/><stop offset="100%" stop-color="#0F172A"/>',
    "#64748B",
    `<!-- Question Mark Silhouette -->
     <path d="M 75 75 C 75 55, 125 55, 125 75 C 125 90, 100 95, 100 115" stroke="#94A3B8" stroke-width="8" fill="none" stroke-linecap="round"/>
     <circle cx="100" cy="135" r="5" fill="#94A3B8"/>`
  ),
  targetHairCoverage: 50,
  minHairCoverage: 0,
  maxHairCoverage: 100,
  description: "No registered character profile matches your unique hair metrics. You are a true follicular anomaly.",
  association: "UNCLASSIFIED FOLLICLE PATTERN",
};
