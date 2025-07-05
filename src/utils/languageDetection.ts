// Language detection utilities

export const supportedLanguages = {
  'en': 'English',
  'hi': 'Hindi',
  'bh': 'Bhojpuri',
  'fr': 'French',
  'ta': 'Tamil',
  'ur': 'Urdu',
  'ar': 'Arabic',
  'bn': 'Bengali',
  'es': 'Spanish',
  'de': 'German',
  'id': 'Indonesian',
  'ja': 'Japanese'
};

export function detectLanguage(text: string): string {
  // Simple language detection based on character patterns
  // In a real app, you'd use a proper language detection library
  
  const patterns = {
    'hi': /[\u0900-\u097F]/, // Devanagari script
    'ta': /[\u0B80-\u0BFF]/, // Tamil script
    'ar': /[\u0600-\u06FF]/, // Arabic script
    'bn': /[\u0980-\u09FF]/, // Bengali script
    'ja': /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/, // Hiragana, Katakana, Kanji
    'ur': /[\u0600-\u06FF]/, // Arabic script (Urdu uses Arabic script)
  };
  
  // Check for non-Latin scripts first
  for (const [lang, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) {
      return lang;
    }
  }
  
  // Simple keyword-based detection for Latin scripts
  const keywords = {
    'fr': ['le', 'la', 'les', 'de', 'du', 'des', 'et', 'est', 'une', 'un'],
    'es': ['el', 'la', 'los', 'las', 'de', 'del', 'y', 'es', 'una', 'un'],
    'de': ['der', 'die', 'das', 'und', 'ist', 'ein', 'eine', 'mit', 'zu'],
    'id': ['dan', 'yang', 'di', 'ke', 'dari', 'untuk', 'dengan', 'pada']
  };
  
  const words = text.toLowerCase().split(/\s+/);
  let maxMatches = 0;
  let detectedLang = 'en';
  
  for (const [lang, langKeywords] of Object.entries(keywords)) {
    const matches = words.filter(word => langKeywords.includes(word)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      detectedLang = lang;
    }
  }
  
  return detectedLang;
}

export function getLanguageName(code: string): string {
  return supportedLanguages[code as keyof typeof supportedLanguages] || 'English';
}