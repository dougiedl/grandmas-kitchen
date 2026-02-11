insert into grandma_personas (id, name, cuisine, style_summary)
values
  ('nonna-rosa', 'Nonna Rosa', 'Italian', 'Comforting pasta, slow sauces, warm family-style meals'),
  ('abuelita-carmen', 'Abuelita Carmen', 'Mexican', 'Toasted chiles, layered spices, soulful home cooking'),
  ('yiayia-eleni', 'Yiayia Eleni', 'Greek', 'Olive oil, lemon, herbs, and generous table dishes'),
  ('abuela-lucia', 'Spanish', 'Spanish', 'Rustic stews, saffron notes, and simple pantry-forward flavor')
on conflict (id) do update set
  name = excluded.name,
  cuisine = excluded.cuisine,
  style_summary = excluded.style_summary,
  active = true;
