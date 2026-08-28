-- ============================================================================
-- Seed data: default categories
-- Run this AFTER 0001_init.sql. Safe to re-run (upserts by slug).
-- ============================================================================

insert into public.categories (slug, name, sort_order) values
  ('breakfast', 'Frühstück', 1),
  ('lunch', 'Mittagessen', 2),
  ('dinner', 'Abendessen', 3),
  ('dessert', 'Dessert', 4),
  ('snacks', 'Snacks', 5),
  ('meal-prep', 'Meal Prep', 6),
  ('high-protein', 'High Protein', 7),
  ('low-calorie', 'Low Calorie', 8),
  ('protein-dessert', 'Protein Dessert', 9),
  ('protein-pancakes', 'Protein Pancakes', 10),
  ('rice-dishes', 'Reisgerichte', 11),
  ('pasta', 'Pasta', 12),
  ('chicken', 'Chicken', 13),
  ('beef', 'Beef', 14),
  ('vegetarian', 'Vegetarisch', 15)
on conflict (slug) do update set name = excluded.name, sort_order = excluded.sort_order;
