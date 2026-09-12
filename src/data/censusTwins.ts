/**
 * CENSUS TWINS DATABASE
 * -----------------------------------------------------------------------------
 * Data-driven character database matching hair census metrics deterministically.
 * No facial recognition or identity tracking.
 */

export interface CensusTwinProfile {
  id: string;
  name: string;
  franchise: string;
  association: string;
  targetHairCoverage: number;
  minHairCoverage: number;
  maxHairCoverage: number;
  description: string;
}

export const CENSUS_TWINS: CensusTwinProfile[] = [
  // 0% – 10% (Bald / Minimal Follicles)
  {
    id: "saitama",
    name: "Saitama",
    franchise: "One-Punch Man",
    association: "MAXIMUM BALD EFFICIENCY",
    targetHairCoverage: 0,
    minHairCoverage: 0,
    maxHairCoverage: 8,
    description: "Your scalp has achieved maximum bald efficiency. Zero air resistance registered in census telemetry.",
  },
  {
    id: "krillin",
    name: "Krillin",
    franchise: "Dragon Ball",
    association: "LOW-FOLLICLE MONK",
    targetHairCoverage: 3,
    minHairCoverage: 0,
    maxHairCoverage: 10,
    description: "Six dot markings detected. Follicular count is near zero, but martial spirit is at maximum density.",
  },
  {
    id: "aang",
    name: "Aang",
    franchise: "Avatar: The Last Airbender",
    association: "AIRBENDING AERODYNAMICS",
    targetHairCoverage: 6,
    minHairCoverage: 0,
    maxHairCoverage: 12,
    description: "Scalp aerodynamics are perfectly streamlined for high-altitude glider maneuvers.",
  },
  {
    id: "roshi",
    name: "Master Roshi",
    franchise: "Dragon Ball",
    association: "TURTLE HERMIT POLISH",
    targetHairCoverage: 4,
    minHairCoverage: 0,
    maxHairCoverage: 12,
    description: "Polished vertex surface reflects solar glare with 99.4% specular accuracy.",
  },

  // 10% – 30% (Low / Receding / Sparse)
  {
    id: "franky",
    name: "Franky",
    franchise: "One Piece",
    association: "CYBORG MODULAR FOLLICLES",
    targetHairCoverage: 18,
    minHairCoverage: 10,
    maxHairCoverage: 26,
    description: "Modular scalp framework allows style reconfiguration upon nose compression.",
  },
  {
    id: "reigen",
    name: "Reigen Arataka",
    franchise: "Mob Psycho 100",
    association: "SPIRITUAL CONSULTANT DENSITY",
    targetHairCoverage: 22,
    minHairCoverage: 12,
    maxHairCoverage: 28,
    description: "Follicle density is modest, but self-confidence ratings exceed municipal safety guidelines.",
  },
  {
    id: "vegeta",
    name: "Vegeta",
    franchise: "Dragon Ball",
    association: "PRINCE-CLASS WIDOW'S PEAK",
    targetHairCoverage: 28,
    minHairCoverage: 18,
    maxHairCoverage: 36,
    description: "Prominent widow's peak confirmed. Receding hairline is compensated by sheer royal pride.",
  },

  // 30% – 50% (Medium-Low / Neat / Tactical)
  {
    id: "shikamaru",
    name: "Shikamaru Nara",
    franchise: "Naruto",
    association: "PONYTAIL TACTICIAN",
    targetHairCoverage: 42,
    minHairCoverage: 30,
    maxHairCoverage: 48,
    description: "Efficient ponytail configuration conserves follicle energy for strategic calculation.",
  },
  {
    id: "roy_mustang",
    name: "Roy Mustang",
    franchise: "Fullmetal Alchemist",
    association: "FLAME ALCHEMIST CROP",
    targetHairCoverage: 45,
    minHairCoverage: 36,
    maxHairCoverage: 52,
    description: "Trimmed urban crop withstands localized thermal combustion ignition.",
  },
  {
    id: "levi",
    name: "Levi Ackerman",
    franchise: "Attack on Titan",
    association: "PRECISION UNDERCUT",
    targetHairCoverage: 48,
    minHairCoverage: 38,
    maxHairCoverage: 55,
    description: "Razor-sharp undercut maintains strict hygiene and minimal drag during high-speed maneuvers.",
  },

  // 50% – 70% (Medium / Normal / Balanced)
  {
    id: "tanjiro",
    name: "Tanjiro Kamado",
    franchise: "Demon Slayer",
    association: "SUN-BREATHING CROP",
    targetHairCoverage: 58,
    minHairCoverage: 48,
    maxHairCoverage: 64,
    description: "Robust reddish-brown hair density survives rigorous breath-control training.",
  },
  {
    id: "luffy",
    name: "Monkey D. Luffy",
    franchise: "One Piece",
    association: "STRAW HAT SHAG",
    targetHairCoverage: 62,
    minHairCoverage: 52,
    maxHairCoverage: 70,
    description: "Unruly elastic strands resist hat compression and maritime sea spray.",
  },
  {
    id: "deku",
    name: "Deku (Izuku Midoriya)",
    franchise: "My Hero Academia",
    association: "ONE FOR ALL CURLS",
    targetHairCoverage: 66,
    minHairCoverage: 55,
    maxHairCoverage: 74,
    description: "Dense green tufts store concentrated kinetic energy and protagonist ambition.",
  },

  // 70% – 90% (Dense / Spiky / Heavy)
  {
    id: "edward",
    name: "Edward Elric",
    franchise: "Fullmetal Alchemist",
    association: "FULLMETAL BRAID & BANGS",
    targetHairCoverage: 76,
    minHairCoverage: 66,
    maxHairCoverage: 82,
    description: "Single antenna strand increases perceived subject height by 4.2 centimeters.",
  },
  {
    id: "kakashi",
    name: "Kakashi Hatake",
    franchise: "Naruto",
    association: "COPY-NINJA SILVER SPIKES",
    targetHairCoverage: 82,
    minHairCoverage: 72,
    maxHairCoverage: 88,
    description: "Gravity-defying silver spikes maintain 82% structural volume despite headband obstruction.",
  },
  {
    id: "ichigo",
    name: "Ichigo Kurosaki",
    franchise: "Bleach",
    association: "SUBSTITUTE SHINIGAMI ORANGE",
    targetHairCoverage: 86,
    minHairCoverage: 76,
    maxHairCoverage: 92,
    description: "Vibrant orange follicle count defies standard human population census metrics.",
  },

  // 90% – 100% (Ultra Dense / Protagonist)
  {
    id: "naruto",
    name: "Naruto Uzumaki",
    franchise: "Naruto",
    association: "HOKAGE SPIKY CROWN",
    targetHairCoverage: 92,
    minHairCoverage: 85,
    maxHairCoverage: 96,
    description: "Spiky golden crown reflects immense chakra density and relentless optimism.",
  },
  {
    id: "gojo",
    name: "Gojo Satoru",
    franchise: "Jujutsu Kaisen",
    association: "LIMITLESS WHITE SPIKES",
    targetHairCoverage: 95,
    minHairCoverage: 88,
    maxHairCoverage: 100,
    description: "Infinity barrier prevents follicle degradation. Maximum hair volume achieved.",
  },
  {
    id: "goku",
    name: "Son Goku",
    franchise: "Dragon Ball",
    association: "SUPER SAIYAN MAXIMUM",
    targetHairCoverage: 98,
    minHairCoverage: 90,
    maxHairCoverage: 100,
    description: "Your hair population has entered serious anime territory. Spikes defy terrestrial gravity.",
  },
];

export const FALLBACK_TWIN: CensusTwinProfile = {
  id: "unknown_entity",
  name: "Unknown Follicular Entity",
  franchise: "Census Registry",
  association: "UNCLASSIFIED FOLLICLE PATTERN",
  targetHairCoverage: 50,
  minHairCoverage: 0,
  maxHairCoverage: 100,
  description: "Unusual follicle distribution detected. Subject exhibits non-standard census parameters.",
};

/**
 * Match a subject to a Census Twin using only census metrics deterministically.
 */
export function findCensusTwin(
  hairCoverage: number,
  confidence: number = 85,
  censusNumber: string = "",
): {
  name: string;
  association: string;
  note: string;
  franchise: string;
  matchScore: number;
} {
  const normCoverage = Math.min(Math.max(Number(hairCoverage) || 0, 0), 100);
  const normConfidence = Math.min(Math.max(Number(confidence) || 85, 0), 100);

  // 1. Filter candidate profiles within coverage tolerance
  let candidates = CENSUS_TWINS.filter(
    (c) => normCoverage >= c.minHairCoverage && normCoverage <= c.maxHairCoverage,
  );

  if (candidates.length === 0) {
    candidates = [...CENSUS_TWINS].sort(
      (a, b) =>
        Math.abs(a.targetHairCoverage - normCoverage) -
        Math.abs(b.targetHairCoverage - normCoverage),
    );
  }

  if (candidates.length === 0) {
    return {
      name: FALLBACK_TWIN.name.toUpperCase(),
      association: FALLBACK_TWIN.association.toUpperCase(),
      note: FALLBACK_TWIN.description,
      franchise: FALLBACK_TWIN.franchise,
      matchScore: 75,
    };
  }

  // 2. Score candidates based on coverage distance + deterministic census hash tie-breaker
  let hash = 0;
  for (let i = 0; i < censusNumber.length; i++) {
    hash = ((hash << 5) - hash + censusNumber.charCodeAt(i)) | 0;
  }
  const hashMod = Math.abs(hash) % 100;

  const scored = candidates.map((candidate, idx) => {
    const coverageDistance = Math.abs(candidate.targetHairCoverage - normCoverage);
    const tieBreaker = ((hashMod + idx * 17) % 20) * 0.1;
    const totalDistance = coverageDistance + tieBreaker;
    return { candidate, coverageDistance, totalDistance };
  });

  scored.sort((a, b) => a.totalDistance - b.totalDistance);

  const matchedCandidate = scored[0]?.candidate ?? FALLBACK_TWIN;
  const dist = scored[0]?.coverageDistance ?? 0;

  // 3. Compute match percentage score
  const matchScore = Math.min(98, Math.max(68, Math.round(100 - dist * 1.4)));

  return {
    name: matchedCandidate.name.toUpperCase(),
    association: matchedCandidate.association.toUpperCase(),
    note: matchedCandidate.description,
    franchise: matchedCandidate.franchise,
    matchScore,
  };
}
