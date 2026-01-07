// Known tool URLs - curated list of official websites
// For tools not in this list, we'll generate a search link

export const knownToolUrls: Record<string, string> = {
  // Healthcare AI / Clinical
  "Nuance DAX": "https://www.nuance.com/healthcare/ambient-clinical-intelligence.html",
  "Abridge": "https://www.abridge.com/",
  "Viz.ai": "https://www.viz.ai/",
  "Aidoc": "https://www.aidoc.com/",
  "Epic Sepsis Model": "https://www.epic.com/",

  // Smart Monitoring
  "EarlySense": "https://www.earlysense.com/",
  "Hillrom": "https://www.hillrom.com/",
  "SafelyYou": "https://www.safely-you.com/",
  "Vayyar": "https://vayyar.com/",

  // Robotics
  "Moxi": "https://www.diligentrobots.com/moxi",
  "Diligent Robotics": "https://www.diligentrobots.com/",
  "Cyberdyne HAL": "https://www.cyberdyne.jp/english/",
  "Sarcos": "https://www.sarcos.com/",
  "Yomi by Neocis": "https://www.neocis.com/",

  // Dental
  "Overjet": "https://www.overjet.com/",
  "Pearl": "https://www.hellopearl.com/",
  "CEREC": "https://www.dentsplysirona.com/cerec",
  "Medit": "https://www.medit.com/",

  // Pharmacy
  "Parata": "https://www.parata.com/",
  "ScriptPro": "https://www.scriptpro.com/",
  "OneOme": "https://oneome.com/",
  "Genomind": "https://genomind.com/",
  "CoverMyMeds": "https://www.covermymeds.com/",
  "Waystar": "https://www.waystar.com/",

  // Mental Health
  "Upheal": "https://www.upheal.io/",
  "Woebot": "https://woebothealth.com/",
  "Happify": "https://www.happify.com/",
  "Limbix": "https://www.limbix.com/",
  "OxfordVR": "https://ofrhealth.com/",

  // Physical Therapy
  "Sword Health": "https://swordhealth.com/",
  "Kaia Health": "https://www.kaiahealth.com/",
  "XRHealth": "https://www.xr.health/",

  // Veterinary
  "VetCV": "https://www.vetcv.com/",
  "Antech": "https://www.antechdiagnostics.com/",
  "Idexx": "https://www.idexx.com/",

  // Lab / Diagnostics
  "PathAI": "https://www.pathai.com/",
  "Tempus": "https://www.tempus.com/",
  "Paige.ai": "https://paige.ai/",

  // General Healthcare Tech
  "Dassault Systèmes": "https://www.3ds.com/",
  "Unlearn.ai": "https://www.unlearn.ai/",

  // Simulation / Training
  "CleanSlate": "https://www.cleanslatelearning.com/",
  "NeuroRehabVR": "https://neurorehabvr.com/",
  "Preventice": "https://www.preventicesolutions.com/",
  "Notch": "https://wearnotch.com/",
};

/**
 * Get the URL for a tool - either from known list or generate a search link
 */
export function getToolUrl(toolName: string): string {
  if (knownToolUrls[toolName]) {
    return knownToolUrls[toolName];
  }

  // Generate a Google search URL for unknown tools
  const searchQuery = encodeURIComponent(`${toolName} official site`);
  return `https://www.google.com/search?q=${searchQuery}`;
}

/**
 * Check if we have a known (curated) URL for a tool
 */
export function hasKnownUrl(toolName: string): boolean {
  return toolName in knownToolUrls;
}

