export type Language = "en" | "ml";

export interface StageMessage {
  id: string;
  label: string;
}

export interface ClassificationTranslation {
  label: string;
  status: string;
}

export const CENSUS_MESSAGES = {
  en: {
    // 1. Analysis Status Messages (English)
    stages: [
      { id: "init", label: "INITIALIZING CENSUS..." },
      { id: "head", label: "LOCATING HEAD..." },
      { id: "scalp", label: "MAPPING SCALP..." },
      { id: "hair", label: "IDENTIFYING HAIR..." },
      { id: "distribution", label: "ANALYZING FOLLICULAR DISTRIBUTION..." },
      { id: "coverage", label: "MEASURING HAIR COVERAGE..." },
      { id: "population", label: "ESTIMATING HAIR POPULATION..." },
      { id: "crosscheck", label: "CROSS-CHECKING FOLLICULAR DATA..." },
      { id: "consult", label: "CONSULTING HAIR AUTHORITIES..." },
      { id: "finalize", label: "FINALIZING CENSUS..." },
      { id: "complete", label: "GENERATING OFFICIAL RESULT..." },
    ] as StageMessage[],

    // UI Headings & Navigation
    step03: "STEP 03 OF 03",
    completePct: "% COMPLETE",
    censusInProgress: "CENSUS IN PROGRESS",
    censusInterrupted: "CENSUS INTERRUPTED",
    segmentationView: "SEGMENTATION VIEW",
    scanning: "● SCANNING",
    pixelsAnalyzed: "PIXELS ANALYZED",
    regionDetected: "REGION DETECTED",
    segmentation: "SEGMENTATION",
    analysisComplete: "ANALYSIS COMPLETE",
    retryAnalysis: "RETRY ANALYSIS",
    returnToCamera: "RETURN TO CAMERA",

    // System Telemetry Labels
    systemTelemetry: "SYSTEM TELEMETRY",
    censusNode: "CENSUS NODE",
    analysisMode: "ANALYSIS MODE",
    dataSource: "DATA SOURCE",
    inference: "INFERENCE",
    status: "STATUS",
    processing: "PROCESSING",
    onDevice: "ON-DEVICE",

    // Official Disclaimer
    disclaimer:
      "MUDI UNDO?™ is an experimental computer-vision census. Hair population is an estimate, not a literal hair count or medical measurement.",

    // Results Page Terminology
    report: "REPORT",
    censusComplete: "CENSUS COMPLETE",
    hairPopulation: "HAIR POPULATION",
    estimated: "ESTIMATED ±",
    hairCoverage: "HAIR COVERAGE",
    scalpExposure: "SCALP EXPOSURE",
    baldnessIndex: "BALDNESS INDEX",
    confidence: "CENSUS CONFIDENCE",
    censusClassification: "CENSUS CLASSIFICATION",
    hairPopulationStatusLabel: "HAIR POPULATION STATUS",
    finalVerdict: "FINAL VERDICT",
    docMu07: "DOC MU-07",
    certifiedBy: "CERTIFIED BY: CENSUS DIVISION",
    takeAnotherCensus: "TAKE ANOTHER CENSUS",
    generateCertificate: "GENERATE CENSUS CERTIFICATE",
    disputeCensus: "DISPUTE THIS CENSUS",
    experimentalNote:
      "ALL METRICS ARE EXPERIMENTAL ESTIMATES PRODUCED BY AN UNVERIFIED VISION PIPELINE.",
    verdictHairDetected:
      "HAIR DETECTED. The census department confirms that the subject currently possesses a statistically significant quantity of hair.",
    verdictSparseDetected:
      "LOW DENSITY DETECTED. Measured follicle distribution falls within sparse census thresholds.",

    // Density Classifications & Official Status Line
    classifications: {
      "DENSE FOREST": { label: "DENSE FOREST", status: "HAIR POPULATION: THRIVING" },
      WOODLAND: { label: "WOODLAND", status: "HAIR POPULATION: STABLE" },
      GRASSLAND: { label: "GRASSLAND", status: "HAIR POPULATION: MODERATE" },
      "DRY LAND": { label: "DRY LAND", status: "HAIR POPULATION: DECLINING" },
      DESERT: { label: "DESERT", status: "HAIR POPULATION: CRITICAL" },
      "MOON SURFACE": { label: "MOON SURFACE", status: "HAIR POPULATION: EXTINCT" },
    } as Record<string, ClassificationTranslation>,
  },
  ml: {
    // 2. Analysis Status Messages (Malayalam Unicode)
    stages: [
      { id: "init", label: "സെൻസസ് ആരംഭിക്കുന്നു..." },
      { id: "head", label: "മുടി തിരയുന്നു..." },
      { id: "scalp", label: "തലയോട്ടി മാപ്പ് ചെയ്യുന്നു..." },
      { id: "hair", label: "മുടി തിരിച്ചറിയുന്നു..." },
      { id: "distribution", label: "മുടിയുടെ സാന്ദ്രത പരിശോധിക്കുന്നു..." },
      { id: "coverage", label: "മുടിയുടെ വിസ്തീർണ്ണം അളക്കുന്നു..." },
      { id: "population", label: "മുടിയുടെ എണ്ണം കണക്കാക്കുന്നു..." },
      { id: "crosscheck", label: "ഫോളിക്കിൾ ഡാറ്റ പരിശോധിക്കുന്നു..." },
      { id: "consult", label: "ഹെയർ അഥോറിറ്റികളുമായി ആലോചിക്കുന്നു..." },
      { id: "finalize", label: "അന്തിമ സെൻസസ് തയ്യാറാക്കുന്നു..." },
      { id: "complete", label: "ഔദ്യോഗിക ഫലം തയാറാക്കുന്നു..." },
    ] as StageMessage[],

    // UI Headings & Navigation
    step03: "ഘട്ടം 03 / 03",
    completePct: "% പൂർത്തിയായി",
    censusInProgress: "സെൻസസ് നടക്കുന്നു",
    censusInterrupted: "സെൻസസ് തടസ്സപ്പെട്ടു",
    segmentationView: "സെഗ്മെന്റേഷൻ വ്യൂ",
    scanning: "● സ്കാൻ ചെയ്യുന്നു",
    pixelsAnalyzed: "പരിശോധിച്ച പിക്സലുകൾ",
    regionDetected: "കണ്ടെത്തിയ ഭാഗം",
    segmentation: "സെഗ്മെന്റേഷൻ",
    analysisComplete: "സെൻസസ് പൂർത്തിയായി",
    retryAnalysis: "വീണ്ടും ശ്രമിക്കുക",
    returnToCamera: "ക്യാമറയിലേക്ക് മടങ്ങുക",

    // System Telemetry Labels
    systemTelemetry: "സിസ്റ്റം ടെലിമെട്രി",
    censusNode: "സെൻസസ് നോഡ്",
    analysisMode: "വിശകലന രീതി",
    dataSource: "ഡാറ്റ ഉറവിടം",
    inference: "ഇൻഫറൻസ്",
    status: "നില",
    processing: "പ്രോസസ്സ് ചെയ്യുന്നു",
    onDevice: "ഓൺ-ഡിവൈസ്",

    // Official Disclaimer
    disclaimer:
      "MUDI UNDO?™ ഒരു പരീക്ഷണാത്മക കമ്പ്യൂട്ടർ വിഷൻ സെൻസസാണ്. കാണിക്കുന്ന മുടിയുടെ എണ്ണം ഏകദേശ കണക്കാണ്; ഇത് യഥാർത്ഥ മുടി എണ്ണലോ മെഡിക്കൽ അളവെടുപ്പോ അല്ല.",

    // Results Page Terminology
    report: "റിപ്പോർട്ട്",
    censusComplete: "സെൻസസ് പൂർത്തിയായി",
    hairPopulation: "മുടിയുടെ എണ്ണം",
    estimated: "ഏകദേശം ±",
    hairCoverage: "മുടിയുടെ വിസ്തീർണ്ണം",
    scalpExposure: "തലയോട്ടി വെളിപ്പെടൽ",
    baldnessIndex: "വഴുക്കൽ സൂചിക",
    confidence: "സെൻസസ് കൃത്യത",
    censusClassification: "സെൻസസ് വർഗ്ഗീകരണം",
    hairPopulationStatusLabel: "മുടി സമ്പത്ത് നില",
    finalVerdict: "അന്തിമ വിധി",
    docMu07: "രേഖ MU-07",
    certifiedBy: "അംഗീകരിച്ചത്: സെൻസസ് ഡിവിഷൻ",
    takeAnotherCensus: "മറ്റൊരു സെൻസസ് എടുക്കുക",
    generateCertificate: "സെൻസസ് സർട്ടിഫിക്കറ്റ് തയാറാക്കുക",
    disputeCensus: "സെൻസസ് ചോദ്യം ചെയ്യുക",
    experimentalNote:
      "എല്ലാ അളവുകളും പരീക്ഷണാത്മക വിഷൻ മോഡൽ തയാറാക്കിയ ഏകദേശ കണക്കുകളാണ്.",
    verdictHairDetected:
      "മുടി കണ്ടെത്താനായി. വിഷയത്തിന് കാര്യമായ അളവിൽ മുടിയുണ്ടെന്ന് സെൻസസ് വിഭാഗം സ്ഥിരീകരിക്കുന്നു.",
    verdictSparseDetected:
      "കുറഞ്ഞ സാന്ദ്രത രേഖപ്പെടുത്തി. മുടിയുടെ അളവ് പരിമിതമായ പരിധിയിലാണ്.",

    // Density Classifications & Official Status Line
    classifications: {
      "DENSE FOREST": { label: "സാന്ദ്ര വനം", status: "മുടി സമ്പത്ത്: സമൃദ്ധം" },
      WOODLAND: { label: "കാട്", status: "മുടി സമ്പത്ത്: സുസ്ഥിരം" },
      GRASSLAND: { label: "പുൽമേട്", status: "മുടി സമ്പത്ത്: മിതമായത്" },
      "DRY LAND": { label: "വരണ്ട ഭൂമി", status: "മുടി സമ്പത്ത്: കുറയുന്നു" },
      DESERT: { label: "മരുഭൂമി", status: "മുടി സമ്പത്ത്: ആശങ്കാജനകം" },
      "MOON SURFACE": { label: "ചന്ദ്രോപരിതലം", status: "മുടി സമ്പത്ത്: ഇല്ല" },
    } as Record<string, ClassificationTranslation>,
  },
} as const;
