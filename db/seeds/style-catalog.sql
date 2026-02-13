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
  ('jm-jerk-house', 'Jamaican', 'Jerk-House', 'Jerk-House Family Style', '{"jerk","scotch bonnet","pimento"}', '{"tone":"smoky and celebratory","focus":"jerk spice profile and grill cues"}'::jsonb, true),

  -- Russian
  ('ru-moscow-home', 'Russian', 'Moscow', 'Moscow Family Home Style', '{"russian","moscow","babushka"}', '{"tone":"hearty and practical","focus":"simmered soups and braises"}'::jsonb, true),
  ('ru-pelmeni-comfort', 'Russian', 'Siberian', 'Pelmeni Dumpling Comfort', '{"pelmeni","siberian dumplings"}', '{"tone":"warming and generous","focus":"dumpling broth comfort"}'::jsonb, true),
  ('ru-village-soup', 'Russian', 'Village', 'Russian Village Soup Table', '{"borscht","cabbage soup","dill"}', '{"tone":"cozy and rustic","focus":"root vegetables and dill brightness"}'::jsonb, true),

  -- Puerto Rican
  ('pr-home-sofrito', 'Puerto Rican', 'Island Home', 'Puerto Rican Sofrito Home Style', '{"puerto rican","boricua","sofrito"}', '{"tone":"warm and celebratory","focus":"sofrito depth and sazon balance"}'::jsonb, true),
  ('pr-sunday-asopao', 'Puerto Rican', 'Sunday Pot', 'Puerto Rican Sunday Asopao Style', '{"asopao","arroz con gandules"}', '{"tone":"comforting and communal","focus":"rice-stew comfort"}'::jsonb, true),

  -- Dominican
  ('do-home-adobo', 'Dominican', 'Santo Domingo', 'Dominican Adobo Home Style', '{"dominican","la bandera","adobo"}', '{"tone":"homey and bold","focus":"adobo seasoning and braise comfort"}'::jsonb, true),
  ('do-sancocho-family', 'Dominican', 'Cibao', 'Dominican Sancocho Family Pot', '{"sancocho","moro de guandules"}', '{"tone":"festive and hearty","focus":"stewed meats and root comfort"}'::jsonb, true),

  -- Korean
  ('kr-seoul-home', 'Korean', 'Seoul', 'Seoul Home Kitchen Style', '{"korean","seoul","halmeoni"}', '{"tone":"balanced and warming","focus":"stews, banchan logic, and rice"}'::jsonb, true),
  ('kr-jjigae-comfort', 'Korean', 'Jjigae Table', 'Korean Jjigae Comfort Style', '{"kimchi jjigae","doenjang","jjigae"}', '{"tone":"cozy and savory","focus":"jang depth and broth layering"}'::jsonb, true),

  -- Filipino
  ('ph-adobo-home', 'Filipino', 'Luzon', 'Filipino Adobo Home Style', '{"filipino","adobo","lola"}', '{"tone":"bright and soulful","focus":"soy-vinegar-garlic balance"}'::jsonb, true),
  ('ph-sinigang-family', 'Filipino', 'Family Pot', 'Filipino Sinigang Family Pot', '{"sinigang","pancit","arroz caldo"}', '{"tone":"nurturing and tangy","focus":"sour broth comfort"}'::jsonb, true),

  -- Jewish
  ('jw-ashkenazi-home', 'Jewish', 'Ashkenazi', 'Ashkenazi Family Home Style', '{"jewish","ashkenazi","bubbe"}', '{"tone":"nourishing and nostalgic","focus":"soup-first and braised comfort"}'::jsonb, true),
  ('jw-holiday-table', 'Jewish', 'Holiday Table', 'Jewish Holiday Table Comfort', '{"brisket","kugel","matzo ball"}', '{"tone":"festive and homey","focus":"slow braise and broth richness"}'::jsonb, true),

  -- West African
  ('wa-jollof-home', 'West African', 'Jollof Belt', 'West African Jollof Home Style', '{"west african","jollof","nigerian","ghanaian"}', '{"tone":"vibrant and communal","focus":"pepper base and rice layering"}'::jsonb, true),
  ('wa-groundnut-stew', 'West African', 'Stew Pot', 'West African Groundnut Stew Style', '{"groundnut","egusi","stew"}', '{"tone":"deep and comforting","focus":"nutty stew depth and shared-pot flow"}'::jsonb, true)
on conflict (id) do update set
  cuisine = excluded.cuisine,
  region = excluded.region,
  label = excluded.label,
  aliases = excluded.aliases,
  voice_profile = excluded.voice_profile,
  active = excluded.active;
