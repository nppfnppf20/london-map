-- Requires PostGIS: run "create extension if not exists postgis;"
-- Run in Supabase SQL editor to enable /api/places/along-route
create or replace function along_route_places(
  line jsonb,
  width_meters integer,
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
  with line_points as (
    select
      (value->>0)::float8 as lat,
      (value->>1)::float8 as lng,
      ordinality as ord
    from jsonb_array_elements(line) with ordinality
  ),
  line_geom as (
    select
      st_makeline(st_setsrid(st_point(lng, lat), 4326) order by ord) as geom
    from line_points
  )
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
    st_dwithin(
      st_setsrid(st_makepoint(p.longitude, p.latitude), 4326)::geography,
      (select geom::geography from line_geom),
      width_meters
    )
    and (
      (mode = 'sites' and (p.priority = 'site' or p.priority is null) and (categories is null or p.category = any(categories)))
      or (mode = 'routes' and p.route is not null and (routes is null or p.route = any(routes)))
      or (mode = 'collections' and (collection_ids is null or pc.collection_id = any(collection_ids)))
    )
  group by p.id;
$$;
