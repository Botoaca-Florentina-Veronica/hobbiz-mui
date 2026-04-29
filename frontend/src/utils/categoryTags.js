/**
 * Tag groups for each category.
 * groupKey and tagKeys are i18n keys looked up via t('categoryTags.groups.<key>')
 * and t('categoryTags.tags.<key>'). Tag keys are language-neutral and are the
 * values stored in the database.
 *
 * Keys must match the `description` values from Categories.jsx.
 */
export const categoryTagsMap = {
  "Fotografie": [
    { groupKey: "photo_services",      tagKeys: ["events", "portrait", "products_photo", "real_estate_photo"] },
    { groupKey: "photo_equipment",     tagKeys: ["dslr_mirrorless", "lenses", "flashes", "tripods"] },
    { groupKey: "photo_tutorials",     tagKeys: ["online_courses", "photo_editing", "communities"] },
    { groupKey: "photo_specialization",tagKeys: ["composition", "lighting", "marketing"] },
  ],
  "Prajituri": [
    { groupKey: "pastry_products",   tagKeys: ["custom_cakes", "small_catering", "homemade_sweets"] },
    { groupKey: "pastry_equipment",  tagKeys: ["planetary_mixer", "electric_oven", "molds_utensils"] },
    { groupKey: "pastry_recipes",    tagKeys: ["traditional_recipes", "international_recipes", "pastry_tips"] },
    { groupKey: "pastry_sales",      tagKeys: ["packaging", "permits", "pricing_strategy"] },
  ],
  "Muzica": [
    { groupKey: "music_activities",  tagKeys: ["instrument_lessons", "performances", "recordings"] },
    { groupKey: "music_genres",      tagKeys: ["classical", "modern_music", "popular_music", "jazz", "rock"] },
    { groupKey: "music_instruments", tagKeys: ["guitar", "piano", "violin", "drums", "flute"] },
    { groupKey: "music_resources",   tagKeys: ["sheet_music", "video_tutorials", "competitions"] },
  ],
  "Reparații": [
    { groupKey: "repair_types",         tagKeys: ["electrical_repairs", "plumbing_repairs", "furniture_repairs"] },
    { groupKey: "repair_installations", tagKeys: ["assembly", "inspection", "modernization"] },
    { groupKey: "repair_tools",         tagKeys: ["tool_kit", "power_tools", "consumables"] },
    { groupKey: "repair_diy",           tagKeys: ["small_furniture", "decorations", "renovations"] },
  ],
  "Dans": [
    { groupKey: "dance_styles",      tagKeys: ["salsa", "tango", "ballet", "hip_hop", "contemporary"] },
    { groupKey: "dance_activities",  tagKeys: ["dance_lessons", "choreography", "dance_shows"] },
    { groupKey: "dance_preparation", tagKeys: ["auditions", "dance_contests", "workshops"] },
    { groupKey: "dance_level",       tagKeys: ["beginners", "intermediate", "advanced"] },
  ],
  "Curățenie": [
    { groupKey: "clean_services",      tagKeys: ["general_cleaning", "post_construction_cleaning", "window_cleaning"] },
    { groupKey: "clean_maintenance",   tagKeys: ["minor_repairs", "basic_plumbing"] },
    { groupKey: "clean_products",      tagKeys: ["eco_products", "professional_products", "specific_products"] },
    { groupKey: "clean_organization",  tagKeys: ["planning", "team", "logistics"] },
  ],
  "Gradinarit": [
    { groupKey: "garden_services",    tagKeys: ["hedge_trimming", "tree_cutting", "planting", "landscaping"] },
    { groupKey: "garden_maintenance", tagKeys: ["watering", "fertilizing", "leaf_cleanup"] },
    { groupKey: "garden_design",      tagKeys: ["garden_layout", "lawn", "drainage"] },
    { groupKey: "garden_equipment",   tagKeys: ["lawnmower", "garden_scissors", "irrigation_system"] },
  ],
  "Sport": [
    { groupKey: "sport_sports",     tagKeys: ["football", "tennis", "swimming", "cycling", "running"] },
    { groupKey: "sport_fitness",    tagKeys: ["yoga", "pilates", "gym", "crossfit"] },
    { groupKey: "sport_activities", tagKeys: ["training", "sport_competitions", "sport_camps"] },
    { groupKey: "sport_level",      tagKeys: ["sport_beginners", "sport_intermediate", "performance"] },
  ],
  "Arta": [
    { groupKey: "art_techniques",  tagKeys: ["painting", "sculpture", "drawing", "watercolor", "oil_painting"] },
    { groupKey: "art_materials",   tagKeys: ["canvas", "clay", "ceramics", "digital_graphics"] },
    { groupKey: "art_styles",      tagKeys: ["abstract", "realist", "impressionist", "modern_art"] },
    { groupKey: "art_activities",  tagKeys: ["art_workshops", "exhibitions", "art_courses"] },
  ],
  "Tehnologie": [
    { groupKey: "tech_development", tagKeys: ["web_development", "mobile_apps", "software", "databases"] },
    { groupKey: "tech_support",     tagKeys: ["pc_repairs", "networks", "security", "cloud"] },
    { groupKey: "tech_design",      tagKeys: ["ui_ux", "figma", "adobe_xd", "prototypes"] },
    { groupKey: "tech_training",    tagKeys: ["it_courses", "it_tutorials", "certifications"] },
  ],
  "Auto": [
    { groupKey: "auto_services",    tagKeys: ["mechanics", "aesthetics", "itp_inspection"] },
    { groupKey: "auto_types",       tagKeys: ["cars", "motorcycles", "bicycles", "trucks"] },
    { groupKey: "auto_parts",       tagKeys: ["tires", "auto_consumables", "protective_gear"] },
    { groupKey: "auto_maintenance", tagKeys: ["revisions", "oil_change", "seasonal_auto", "car_wash"] },
  ],
  "Meditații": [
    { groupKey: "tutor_subjects",     tagKeys: ["math", "romanian_lang", "english_lang", "computer_science", "physics"] },
    { groupKey: "tutor_format",       tagKeys: ["individual_sessions", "group_sessions", "online_sessions", "home_visits"] },
    { groupKey: "tutor_materials",    tagKeys: ["workbooks", "tests", "worksheets"] },
    { groupKey: "tutor_preparation",  tagKeys: ["national_exam", "baccalaureate", "university_admission"] },
  ],
};
