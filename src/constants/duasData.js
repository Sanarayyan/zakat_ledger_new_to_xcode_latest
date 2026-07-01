import DUAS_JSON from './duas.json';

// Utility to transform the flat JSON back into the nested structure for the UI
const transformJsonToLegacyFormat = (json) => {
  const result = {};
  
  json.categories.forEach(cat => {
    result[cat.id] = {
      id: cat.id,
      title_en: cat.title.en,
      title_ml: cat.title.ml,
      icon: cat.icon,
      sections: {}
    };
  });

  json.subcategories.forEach(sub => {
    if (result[sub.category]) {
      result[sub.category].sections[sub.id] = {
        id: sub.id,
        title_en: sub.title.en,
        title_ml: sub.title.ml,
        icon: sub.icon,
        duas: []
      };
    }
  });

  json.duas.forEach(dua => {
    const legacyDua = {
      id: dua.id,
      title_en: dua.title.en,
      title_ml: dua.title.ml,
      arabic: dua.arabic,
      transliteration: dua.transliteration,
      translation_en: dua.translation.en,
      translation_ml: dua.translation.ml,
      reference: dua.reference,
      audioUrl: dua.audio
    };

    if (dua.secondary) {
      legacyDua.secondary = {
        arabic: dua.secondary.arabic,
        transliteration: dua.secondary.transliteration,
        translation_en: dua.secondary.translation.en,
        translation_ml: dua.secondary.translation.ml,
        reference: dua.secondary.reference,
        audioUrl: dua.secondary.audio
      };
    }

    if (result[dua.category] && result[dua.category].sections[dua.subcategory]) {
      result[dua.category].sections[dua.subcategory].duas.push(legacyDua);
    }
  });

  return result;
};

export const DUAS_DATA = transformJsonToLegacyFormat(DUAS_JSON);

// Fallback data to prevent crashes
export const DEFAULT_DUAS_DATA = DUAS_DATA;

/**
 * Utility to merge new dua data into existing state
 * This prevents the 'overwriting' bug reported by users.
 */
export const mergeDuaData = (prevData, newData) => {
  return {
    ...prevData,
    ...newData
  };
};

