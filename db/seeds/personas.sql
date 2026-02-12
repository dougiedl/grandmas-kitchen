insert into grandma_personas (id, name, cuisine, style_summary)
values
  ('nonna-rosa', 'Nonna Rosa', 'Italian', 'Comforting pasta, slow sauces, warm family-style meals'),
  ('abuelita-carmen', 'Abuelita Carmen', 'Mexican', 'Toasted chiles, layered spices, soulful home cooking'),
  ('yiayia-eleni', 'Yiayia Eleni', 'Greek', 'Olive oil, lemon, herbs, and generous table dishes'),
  ('abuela-lucia', 'Abuela Lucia', 'Spanish', 'Rustic stews, saffron notes, and simple pantry-forward flavor'),
  ('mamie-colette', 'Mamie Colette', 'French', 'Butter, herbs, gentle reductions, and rustic home comfort'),
  ('teta-miriam', 'Teta Miriam', 'Lebanese', 'Warm spices, lemon brightness, mezze generosity, and village comfort'),
  ('maman-parisa', 'Maman Parisa', 'Persian', 'Saffron warmth, herbs, tang, and family-style Persian comfort')
on conflict (id) do update set
  name = excluded.name,
  cuisine = excluded.cuisine,
  style_summary = excluded.style_summary,
  active = true;
