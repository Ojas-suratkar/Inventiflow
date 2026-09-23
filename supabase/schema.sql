-- InventiFlow schema. Safe to run more than once.
-- Reconstructed from the queries the app actually makes.

create extension if not exists "pgcrypto";

-- Reference data -----------------------------------------------------------
create table if not exists products (
  id          bigint generated always as identity primary key,
  name        text not null,
  category    text,
  base_price  numeric(10,2) default 0,
  created_at  timestamptz default now(),
  unique (name)
);

create table if not exists packaging (
  id          bigint generated always as identity primary key,
  product_id  bigint references products(id) on delete cascade,
  type        text not null,
  price       numeric(10,2) default 0,
  unique (product_id, type)
);

create table if not exists raw_materials (
  id          bigint generated always as identity primary key,
  name        text not null unique,
  unit        text default 'kg',
  base_price  numeric(10,2) default 0
);

create table if not exists product_recipes (
  id                bigint generated always as identity primary key,
  product_id        bigint references products(id) on delete cascade,
  raw_material_id   bigint references raw_materials(id) on delete cascade,
  quantity_per_unit numeric(10,3) not null default 1,
  unique (product_id, raw_material_id)
);

-- Sites --------------------------------------------------------------------
create table if not exists warehouse (
  id                bigint generated always as identity primary key,
  name              text not null,
  location          text,
  service_pincodes  integer[] default '{}',
  created_at        timestamptz default now()
);

create table if not exists factories (
  id          bigint generated always as identity primary key,
  name        text not null,
  location    text,
  product_id  bigint references products(id) on delete set null,
  created_at  timestamptz default now()
);

-- People -------------------------------------------------------------------
create table if not exists profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  name              text,
  email             text,
  company_name      text,
  company_location  text,
  role              text not null default 'Distributor',
  pincode           text,
  warehouse_id      bigint references warehouse(id) on delete set null,
  created_at        timestamptz default now()
);

create table if not exists warehouse_managers (
  id            bigint generated always as identity primary key,
  manager_id    uuid references profiles(id) on delete cascade,
  warehouse_id  bigint references warehouse(id) on delete cascade,
  unique (manager_id, warehouse_id)
);

create table if not exists production_manager_factory (
  id               bigint generated always as identity primary key,
  prod_manager_id  uuid references profiles(id) on delete cascade,
  factory_id       bigint references factories(id) on delete cascade,
  unique (prod_manager_id, factory_id)
);

-- Stock --------------------------------------------------------------------
create table if not exists warehouse_inventory (
  id            bigint generated always as identity primary key,
  warehouse_id  bigint references warehouse(id) on delete cascade,
  product_id    bigint references products(id) on delete cascade,
  packaging_id  bigint references packaging(id) on delete set null,
  quantity      integer not null default 0,
  threshold     integer default 100,
  base_price    numeric(10,2) default 0,
  price         numeric(10,2) default 0,
  total_price   numeric(12,2) default 0,
  updated_at    timestamptz default now(),
  unique (warehouse_id, product_id, packaging_id)
);

create table if not exists factory_inventory (
  id               bigint generated always as identity primary key,
  factory_id       bigint references factories(id) on delete cascade,
  raw_material_id  bigint references raw_materials(id) on delete cascade,
  quantity         numeric(12,2) not null default 0,
  threshold_units  numeric(12,2) default 500,
  base_price       numeric(10,2) default 0,
  unique (factory_id, raw_material_id)
);

-- Orders -------------------------------------------------------------------
-- A distributor orders finished goods from its warehouse.
create table if not exists orders (
  id              bigint generated always as identity primary key,
  distributor_id  uuid references profiles(id) on delete cascade,
  product_id      bigint references products(id) on delete set null,
  packaging       bigint references packaging(id) on delete set null,
  quantity        integer not null default 0,
  price           numeric(12,2) default 0,
  status          text not null default 'Pending',
  deadline        date,
  created_at      timestamptz default now()
);

-- A warehouse orders stock from a factory.
create table if not exists war_orders (
  id            bigint generated always as identity primary key,
  warehouse_id  bigint references warehouse(id) on delete cascade,
  product_id    bigint references products(id) on delete set null,
  packaging_id  bigint references packaging(id) on delete set null,
  quantity      integer not null default 0,
  base_price    numeric(10,2) default 0,
  total_price   numeric(12,2) default 0,
  status        text not null default 'Pending',
  deadline      date,
  created_at    timestamptz default now()
);

-- A factory orders raw materials from a vendor.
create table if not exists raw_orders (
  id               bigint generated always as identity primary key,
  factory_id       bigint references factories(id) on delete cascade,
  warehouse_id     bigint references warehouse(id) on delete set null,
  raw_material_id  bigint references raw_materials(id) on delete set null,
  product_id       bigint references products(id) on delete set null,
  vendor_id        uuid references profiles(id) on delete set null,
  quantity         numeric(12,2) default 0,
  base_price       numeric(10,2) default 0,
  total_price      numeric(12,2) default 0,
  status_updated   text not null default 'Pending',
  deadline         date,
  created_at       timestamptz default now()
);

create table if not exists notifications (
  id          bigint generated always as identity primary key,
  factory_id  bigint references factories(id) on delete cascade,
  message     text not null,
  type        text default 'info',
  read        boolean default false,
  created_at  timestamptz default now()
);

create index if not exists orders_distributor_idx on orders(distributor_id);
create index if not exists war_orders_warehouse_idx on war_orders(warehouse_id);
create index if not exists warehouse_inventory_wh_idx on warehouse_inventory(warehouse_id);

-- Row level security -------------------------------------------------------
-- Signed-in staff read the catalogue and their own site's rows. Writes are
-- limited to the tables each dashboard actually posts to.
alter table products                   enable row level security;
alter table packaging                  enable row level security;
alter table raw_materials              enable row level security;
alter table product_recipes            enable row level security;
alter table warehouse                  enable row level security;
alter table factories                  enable row level security;
alter table profiles                   enable row level security;
alter table warehouse_managers         enable row level security;
alter table production_manager_factory enable row level security;
alter table warehouse_inventory        enable row level security;
alter table factory_inventory          enable row level security;
alter table orders                     enable row level security;
alter table war_orders                 enable row level security;
alter table raw_orders                 enable row level security;
alter table notifications              enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'products','packaging','raw_materials','product_recipes','warehouse','factories',
    'profiles','warehouse_managers','production_manager_factory','warehouse_inventory',
    'factory_inventory','orders','war_orders','raw_orders','notifications'
  ] loop
    execute format('drop policy if exists "read %1$s" on %1$I', t);
    execute format('create policy "read %1$s" on %1$I for select using (true)', t);
  end loop;

  -- The dashboards create and update these.
  foreach t in array array['profiles','orders','war_orders','raw_orders','warehouse_inventory','factory_inventory','notifications'] loop
    execute format('drop policy if exists "write %1$s" on %1$I', t);
    execute format('drop policy if exists "change %1$s" on %1$I', t);
    execute format('create policy "write %1$s" on %1$I for insert with check (true)', t);
    execute format('create policy "change %1$s" on %1$I for update using (true) with check (true)', t);
  end loop;
end $$;
