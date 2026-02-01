-- Run in Supabase SQL editor to enable /api/places/nearby
create or replace function nearby_places(
  lat double precision,
  lng double precision,
  radius_meters integer,
  mode text,
  categories text[] default null,
  routes text[] default null,
  collection_ids uuid[] default null
)
returns table (
  id uuid,
  name text,
  description text,
  latitude double precision,
  longitude double precision,
  category text,
  priority text,
  route text,
  route_stop integer,
  tags text[],
  created_at timestamptz,
  updated_at timestamptz,
  collections jsonb
)
language sql
stable
as $$
  select
    p.id,
    p.name,
    p.description,
    p.latitude,
    p.longitude,
    p.category,
    p.priority,
    p.route,
    p.route_stop,
    p.tags,
    p.created_at,
    p.updated_at,
    coalesce(
      jsonb_agg(distinct to_jsonb(c)) filter (where c.id is not null),
      '[]'::jsonb
    ) as collections
  from places p
  left join place_collections pc on pc.place_id = p.id
  left join collections c on c.id = pc.collection_id
  where
    (6371000 * acos(least(1, greatest(-1,
      cos(radians(lat)) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians(lng)) +
      sin(radians(lat)) * sin(radians(p.latitude))
    )))) <= radius_meters
    and (
      (mode = 'sites' and (p.priority = 'site' or p.priority is null) and (categories is null or p.category = any(categories)))
      or (mode = 'routes' and p.route is not null and (routes is null or p.route = any(routes)))
      or (mode = 'collections' and (collection_ids is null or pc.collection_id = any(collection_ids)))
    )
  group by p.id;
$$;
