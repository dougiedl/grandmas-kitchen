insert into style_catalog (id, cuisine, region, label, aliases, voice_profile, active)
values
  -- Italian
  ('it-sicilian-american', 'Italian', 'Sicilian-American', 'Sicilian Italian-American', '{"sicilian","italian american","new york red sauce","gravy"}', '{"tone":"warm and generous","focus":"slow sauce depth"}'::jsonb, true),
  ('it-neapolitan-home', 'Italian', 'Neapolitan', 'Neapolitan Home Style', '{"neapolitan","napoli","naples"}', '{"tone":"simple and focused","focus":"tomato-forward balance"}'::jsonb, true),
  ('it-roman-home', 'Italian', 'Roman', 'Roman Home Style', '{"roman","roma"}', '{"tone":"direct and practical","focus":"pepper and pecorino style restraint"}'::jsonb, true),
  ('it-northern-sunday', 'Italian', 'Northern', 'Northern Italian Sunday Comfort', '{"northern italian","lombardy","piemonte"}', '{"tone":"comforting and rich","focus":"butter-herb depth"}'::jsonb, true),

  -- Mexican
  ('mx-oaxacan-family', 'Mexican', 'Oaxacan', 'Oaxacan Family Kitchen', '{"oaxacan","oaxaca"}', '{"tone":"earthy and layered","focus":"toasted chile complexity"}'::jsonb, true),
  ('mx-yucatecan-home', 'Mexican', 'Yucatecan', 'Yucatecan Home Style', '{"yucatecan","yucatan"}', '{"tone":"bright and aromatic","focus":"citrus and achiote style cues"}'::jsonb, true),
  ('mx-jalisco-comfort', 'Mexican', 'Jalisco', 'Jalisco Comfort Table', '{"jalisco","guadalajara"}', '{"tone":"hearty and social","focus":"broth and braise comfort"}'::jsonb, true),
  ('mx-central-market', 'Mexican', 'Central Mexico', 'Central Mexico Market Style', '{"central mexico","cdmx","mexico city"}', '{"tone":"classic and versatile","focus":"sofrito and salsa foundations"}'::jsonb, true),

  -- Greek
  ('gr-island-coastal', 'Greek', 'Aegean Islands', 'Aegean Island Home Cooking', '{"aegean","island greek","coastal greek"}', '{"tone":"bright and relaxed","focus":"olive oil and lemon freshness"}'::jsonb, true),
  ('gr-cretan-family', 'Greek', 'Cretan', 'Cretan Family Kitchen', '{"cretan","crete"}', '{"tone":"rustic and healthy","focus":"herbs, legumes, and olive oil"}'::jsonb, true),
  ('gr-mainland-sunday', 'Greek', 'Mainland', 'Mainland Greek Sunday Table', '{"mainland greek","athens style"}', '{"tone":"abundant and festive","focus":"baked casseroles and braises"}'::jsonb, true),

  -- Spanish
  ('es-valencian-rice', 'Spanish', 'Valencian', 'Valencian Home Rice Style', '{"valencian","valencia","paella style"}', '{"tone":"sunny and family-first","focus":"saffron rice layering"}'::jsonb, true),
  ('es-basque-home', 'Spanish', 'Basque', 'Basque Home Cooking', '{"basque","euskadi","san sebastian"}', '{"tone":"ingredient-led","focus":"broth and seafood-friendly techniques"}'::jsonb, true),
  ('es-andalusian-pantry', 'Spanish', 'Andalusian', 'Andalusian Pantry Comfort', '{"andalusian","andalucia","seville"}', '{"tone":"rustic and warm","focus":"garlic, paprika, and olive oil"}'::jsonb, true),
  ('es-madrid-cocido', 'Spanish', 'Madrid', 'Madrid Family Cocido Style', '{"madrid","cocido"}', '{"tone":"hearty and traditional","focus":"slow pot comfort"}'::jsonb, true),

  -- French
  ('fr-provencal-home', 'French', 'Provencal', 'Provencal Home Kitchen', '{"provencal","provence"}', '{"tone":"light and fragrant","focus":"herb-forward summer comfort"}'::jsonb, true),
  ('fr-lyonnais-bistro', 'French', 'Lyonnais', 'Lyonnais Family Bistro Style', '{"lyon","lyonnais"}', '{"tone":"rich and convivial","focus":"onion-butter reductions"}'::jsonb, true),
  ('fr-country-rustic', 'French', 'Countryside', 'French Country Rustic Style', '{"country french","rustic french"}', '{"tone":"cozy and practical","focus":"braises and potage"}'::jsonb, true),
  ('fr-paris-weeknight', 'French', 'Parisian', 'Parisian Weeknight Home Style', '{"parisian","paris"}', '{"tone":"efficient and elegant","focus":"clean pan sauces"}'::jsonb, true),

  -- Lebanese
  ('lb-beirut-home', 'Lebanese', 'Beirut', 'Beirut Home Style', '{"beirut","beirut style"}', '{"tone":"hospitality-first","focus":"lemon and herb brightness"}'::jsonb, true),
  ('lb-mountain-village', 'Lebanese', 'Mountain Village', 'Lebanese Mountain Village Style', '{"mountain lebanese","village lebanese"}', '{"tone":"hearty and generous","focus":"lentils, grains, and warm spice"}'::jsonb, true),
  ('lb-coastal-mezze', 'Lebanese', 'Coastal', 'Lebanese Coastal Mezze Style', '{"coastal lebanese","mezze style"}', '{"tone":"fresh and social","focus":"mezze flow and citrus"}'::jsonb, true),

  -- Persian
  ('ir-tehrani-home', 'Persian', 'Tehran', 'Tehrani Home Kitchen', '{"tehrani","tehran"}', '{"tone":"balanced and polished","focus":"onion base and saffron finishing"}'::jsonb, true),
  ('ir-shirazi-family', 'Persian', 'Shirazi', 'Shirazi Family Table', '{"shirazi","shiraz"}', '{"tone":"bright and aromatic","focus":"herb and sour notes"}'::jsonb, true),
  ('ir-caspian-home', 'Persian', 'Caspian', 'Caspian Persian Home Style', '{"caspian persian","northern iran"}', '{"tone":"green and fresh","focus":"herb-forward stews"}'::jsonb, true),
  ('ir-isfahani-classic', 'Persian', 'Isfahan', 'Isfahani Classic Family Style', '{"isfahan","isfahani"}', '{"tone":"celebratory and warm","focus":"sweet-savory braise balance"}'::jsonb, true),

  -- Chinese
  ('cn-cantonese-home', 'Chinese', 'Cantonese', 'Cantonese Home Style', '{"cantonese","guangdong","yue"}', '{"tone":"clean and comforting","focus":"ginger-scallion and balance"}'::jsonb, true),
  ('cn-sichuan-family', 'Chinese', 'Sichuan', 'Sichuan Family Kitchen', '{"sichuan","szechuan","chengdu"}', '{"tone":"bold but balanced","focus":"aromatic spice layering"}'::jsonb, true),
  ('cn-shanghai-home', 'Chinese', 'Shanghainese', 'Shanghainese Home Style', '{"shanghai","shanghainese"}', '{"tone":"sweet-savory warmth","focus":"red-braise depth"}'::jsonb, true),
  ('cn-northern-dumpling', 'Chinese', 'Northern', 'Northern Dumpling-House Home Style', '{"northern chinese","dumpling style"}', '{"tone":"hearty and wheat-forward","focus":"vinegar and garlic accents"}'::jsonb, true),

  -- Indian
  ('in-punjabi-home', 'Indian', 'Punjabi', 'Punjabi Home Kitchen', '{"punjabi","punjab"}', '{"tone":"robust and comforting","focus":"onion-tomato masala base"}'::jsonb, true),
  ('in-south-indian-home', 'Indian', 'South Indian', 'South Indian Home Style', '{"south indian","kerala","tamil","andhra"}', '{"tone":"bright and layered","focus":"tempering, curry leaf, and tang"}'::jsonb, true),
  ('in-bengali-home', 'Indian', 'Bengali', 'Bengali Family Table', '{"bengali","kolkata","bangla"}', '{"tone":"delicate and aromatic","focus":"mustard, fish-friendly profiles"}'::jsonb, true),
  ('in-gujarati-home', 'Indian', 'Gujarati', 'Gujarati Home Comfort', '{"gujarati","gujarat"}', '{"tone":"gentle and balanced","focus":"sweet-savory-acid harmony"}'::jsonb, true),

  -- Japanese
  ('jp-kanto-home', 'Japanese', 'Kanto', 'Kanto Home Kitchen', '{"kanto","tokyo style"}', '{"tone":"simple and balanced","focus":"soy-dashi everyday comfort"}'::jsonb, true),
  ('jp-kansai-home', 'Japanese', 'Kansai', 'Kansai Home Style', '{"kansai","osaka","kyoto"}', '{"tone":"light and umami-rich","focus":"dashi clarity and gentle seasoning"}'::jsonb, true),
  ('jp-okinawan-home', 'Japanese', 'Okinawan', 'Okinawan Family Comfort', '{"okinawan","okinawa"}', '{"tone":"hearty and nourishing","focus":"pork and vegetable simmer style"}'::jsonb, true),

  -- Jamaican
  ('jm-kingston-home', 'Jamaican', 'Kingston', 'Kingston Home Kitchen', '{"kingston","jamaican home"}', '{"tone":"vibrant and warm","focus":"allspice-thyme stew foundations"}'::jsonb, true),
  ('jm-country-yard', 'Jamaican', 'Countryside', 'Jamaican Country Yard Style', '{"jamaican country","yard style"}', '{"tone":"rustic and soulful","focus":"slow-pot comfort and pepper heat"}'::jsonb, true),
  ('jm-jerk-house', 'Jamaican', 'Jerk-House', 'Jerk-House Family Style', '{"jerk","scotch bonnet","pimento"}', '{"tone":"smoky and celebratory","focus":"jerk spice profile and grill cues"}'::jsonb, true)
on conflict (id) do update set
  cuisine = excluded.cuisine,
  region = excluded.region,
  label = excluded.label,
  aliases = excluded.aliases,
  voice_profile = excluded.voice_profile,
  active = excluded.active;
