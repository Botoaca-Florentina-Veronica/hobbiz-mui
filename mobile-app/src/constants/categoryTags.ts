// Tags associated with each category, mirroring the groups defined in the
// web app's categoryTagsMap (frontend/src/utils/categoryTags.js), flattened
// into a single list per category. Keys are the canonical category names
// stored on announcements (announcement.category) — see CATEGORY_DB_NAME_BY_KEY
// in ./categories.
export const CATEGORY_TAGS: Record<string, string[]> = {
  Fotografie: [
    'events', 'portrait', 'products_photo', 'real_estate_photo',
    'dslr_mirrorless', 'lenses', 'flashes', 'tripods',
    'online_courses', 'photo_editing', 'communities',
    'composition', 'lighting', 'marketing',
  ],
  Prajituri: [
    'custom_cakes', 'small_catering', 'homemade_sweets',
    'planetary_mixer', 'electric_oven', 'molds_utensils',
    'traditional_recipes', 'international_recipes', 'pastry_tips',
    'packaging', 'permits', 'pricing_strategy',
  ],
  Muzica: [
    'instrument_lessons', 'performances', 'recordings',
    'classical', 'modern_music', 'popular_music', 'jazz', 'rock',
    'guitar', 'piano', 'violin', 'drums', 'flute',
    'sheet_music', 'video_tutorials', 'competitions',
  ],
  'Reparații': [
    'electrical_repairs', 'plumbing_repairs', 'furniture_repairs',
    'assembly', 'inspection', 'modernization',
    'tool_kit', 'power_tools', 'consumables',
    'small_furniture', 'decorations', 'renovations',
  ],
  Dans: [
    'salsa', 'tango', 'ballet', 'hip_hop', 'contemporary',
    'dance_lessons', 'choreography', 'dance_shows',
    'auditions', 'dance_contests', 'workshops',
    'beginners', 'intermediate', 'advanced',
  ],
  'Curățenie': [
    'general_cleaning', 'post_construction_cleaning', 'window_cleaning',
    'minor_repairs', 'basic_plumbing',
    'eco_products', 'professional_products', 'specific_products',
    'planning', 'team', 'logistics',
  ],
  Gradinarit: [
    'hedge_trimming', 'tree_cutting', 'planting', 'landscaping',
    'watering', 'fertilizing', 'leaf_cleanup',
    'garden_layout', 'lawn', 'drainage',
    'lawnmower', 'garden_scissors', 'irrigation_system',
  ],
  Sport: [
    'football', 'tennis', 'swimming', 'cycling', 'running',
    'yoga', 'pilates', 'gym', 'crossfit',
    'training', 'sport_competitions', 'sport_camps',
    'sport_beginners', 'sport_intermediate', 'performance',
  ],
  Arta: [
    'painting', 'sculpture', 'drawing', 'watercolor', 'oil_painting',
    'canvas', 'clay', 'ceramics', 'digital_graphics',
    'abstract', 'realist', 'impressionist', 'modern_art',
    'art_workshops', 'exhibitions', 'art_courses',
  ],
  Tehnologie: [
    'web_development', 'mobile_apps', 'software', 'databases',
    'pc_repairs', 'networks', 'security', 'cloud',
    'ui_ux', 'figma', 'adobe_xd', 'prototypes',
    'it_courses', 'it_tutorials', 'certifications',
  ],
  Auto: [
    'mechanics', 'aesthetics', 'itp_inspection',
    'cars', 'motorcycles', 'bicycles', 'trucks',
    'tires', 'auto_consumables', 'protective_gear',
    'revisions', 'oil_change', 'seasonal_auto', 'car_wash',
  ],
  'Meditații': [
    'math', 'romanian_lang', 'english_lang', 'computer_science', 'physics',
    'individual_sessions', 'group_sessions', 'online_sessions', 'home_visits',
    'workbooks', 'tests', 'worksheets',
    'national_exam', 'baccalaureate', 'university_admission',
  ],
};

export function getCategoryTagSet(category?: string): Set<string> {
  if (!category) return new Set();
  return new Set(CATEGORY_TAGS[category] || []);
}
