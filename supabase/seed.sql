-- Demo data for InventiFlow. Safe to run more than once.
begin;

delete from notifications;      delete from raw_orders;   delete from war_orders;   delete from orders;
delete from warehouse_inventory; delete from factory_inventory;
delete from production_manager_factory; delete from warehouse_managers;
delete from product_recipes;    delete from packaging;    delete from raw_materials;
delete from factories;          delete from profiles;     delete from warehouse;    delete from products;

-- Catalogue ----------------------------------------------------------------
insert into products (name, category, base_price) values
  ('Alpine Spring Water',   'Beverages', 0.62),
  ('Citrus Sparkling Soda', 'Beverages', 0.94),
  ('Cold Brew Coffee',      'Beverages', 2.15),
  ('Honey Oat Granola',     'Snacks',    3.40),
  ('Sea Salt Crisps',       'Snacks',    1.85),
  ('Dark Chocolate Bar',    'Snacks',    2.05),
  ('Whole Milk',            'Dairy',     1.32),
  ('Greek Yoghurt',         'Dairy',     1.70),
  ('Stone Ground Flour',    'Staples',   1.10),
  ('Cane Sugar',            'Staples',   0.98);

insert into packaging (product_id, type, price)
select p.id, t.type, t.price from products p
cross join (values ('Single unit', 0.00), ('6 pack', 0.85), ('Case of 24', 2.60), ('Pallet', 14.00)) as t(type, price);

insert into raw_materials (name, unit, base_price) values
  ('Filtered water',   'litre', 0.03),
  ('Cane sugar',       'kg',    0.72),
  ('Citrus concentrate','litre',3.10),
  ('Arabica beans',    'kg',    7.40),
  ('Rolled oats',      'kg',    1.25),
  ('Wildflower honey', 'kg',    4.60),
  ('Potatoes',         'kg',    0.48),
  ('Sea salt',         'kg',    0.35),
  ('Cocoa mass',       'kg',    5.80),
  ('Raw milk',         'litre', 0.55),
  ('Wheat grain',      'kg',    0.41),
  ('PET resin',        'kg',    1.15),
  ('Corrugated board', 'sheet', 0.22);

insert into product_recipes (product_id, raw_material_id, quantity_per_unit)
select p.id, r.id, v.qty from (values
  ('Alpine Spring Water',   'Filtered water',    1.000),
  ('Alpine Spring Water',   'PET resin',         0.022),
  ('Citrus Sparkling Soda', 'Filtered water',    0.900),
  ('Citrus Sparkling Soda', 'Cane sugar',        0.045),
  ('Citrus Sparkling Soda', 'Citrus concentrate',0.020),
  ('Cold Brew Coffee',      'Arabica beans',     0.060),
  ('Cold Brew Coffee',      'Filtered water',    0.950),
  ('Honey Oat Granola',     'Rolled oats',       0.320),
  ('Honey Oat Granola',     'Wildflower honey',  0.080),
  ('Sea Salt Crisps',       'Potatoes',          0.210),
  ('Sea Salt Crisps',       'Sea salt',          0.004),
  ('Dark Chocolate Bar',    'Cocoa mass',        0.075),
  ('Dark Chocolate Bar',    'Cane sugar',        0.030),
  ('Whole Milk',            'Raw milk',          1.020),
  ('Greek Yoghurt',         'Raw milk',          1.400),
  ('Stone Ground Flour',    'Wheat grain',       1.050),
  ('Cane Sugar',            'Cane sugar',        1.000)
) as v(product, material, qty)
join products p on p.name = v.product
join raw_materials r on r.name = v.material;

-- Sites --------------------------------------------------------------------
insert into warehouse (name, location, service_pincodes) values
  ('Long Beach Distribution Centre', 'Long Beach, CA', array[90802,90803,90804,90805,90806,90807,90808,90810,90813,90814,90815]),
  ('Inland Empire Hub',              'Ontario, CA',    array[91710,91758,91761,91762,91764,92316,92324,92335,92337]),
  ('Bay Area Cross Dock',            'Hayward, CA',    array[94536,94541,94544,94545,94560,94587,94608,94621]);

insert into factories (name, location, product_id)
select v.name, v.location, p.id from (values
  ('Torrance Bottling Works', 'Torrance, CA',    'Alpine Spring Water'),
  ('Vernon Snack Plant',      'Vernon, CA',      'Sea Salt Crisps'),
  ('Chino Creamery',          'Chino, CA',       'Whole Milk')
) as v(name, location, product) join products p on p.name = v.product;

-- People -------------------------------------------------------------------
insert into profiles (id, name, email, company_name, company_location, role, pincode, warehouse_id) values
  ('0ca2ea11-220a-4ebd-a6c4-278c71978090', 'Dana Ruiz',    'distributor@inventiflow.demo', 'Harbor Provisions',   'Long Beach, CA', 'Distributor',        '90802',
     (select id from warehouse where name = 'Long Beach Distribution Centre')),
  ('dc7ef242-cc1a-424c-ace8-12a4986e8f36', 'Marcus Webb',  'warehouse@inventiflow.demo',   'InventiFlow Logistics','Long Beach, CA', 'Warehouse Manager',  '90802',
     (select id from warehouse where name = 'Long Beach Distribution Centre')),
  ('72f813fa-d09b-497e-8a87-1f95a7819d20', 'Priya Shah',   'production@inventiflow.demo',  'Torrance Bottling Works','Torrance, CA','Production Manager', '90501', null),
  ('aa3a378a-0d6b-4349-ae8f-66b882319e43', 'Tom Alvarez',  'vendor@inventiflow.demo',      'Pacific Raw Supply',  'Carson, CA',     'Vendor',             '90745', null);

insert into warehouse_managers (manager_id, warehouse_id)
values ('dc7ef242-cc1a-424c-ace8-12a4986e8f36', (select id from warehouse where name = 'Long Beach Distribution Centre'));

insert into production_manager_factory (prod_manager_id, factory_id)
values ('72f813fa-d09b-497e-8a87-1f95a7819d20', (select id from factories where name = 'Torrance Bottling Works'));

-- Stock --------------------------------------------------------------------
insert into warehouse_inventory (warehouse_id, product_id, packaging_id, quantity, threshold, base_price, price, total_price)
select w.id, p.id, pk.id, q.qty, q.threshold, p.base_price, p.base_price + pk.price,
       round((p.base_price + pk.price) * q.qty, 2)
from (values
  ('Long Beach Distribution Centre', 'Alpine Spring Water',   'Case of 24', 4200,  800),
  ('Long Beach Distribution Centre', 'Citrus Sparkling Soda', 'Case of 24', 1850,  600),
  ('Long Beach Distribution Centre', 'Cold Brew Coffee',      '6 pack',      420,  500),
  ('Long Beach Distribution Centre', 'Honey Oat Granola',     '6 pack',     1120,  400),
  ('Long Beach Distribution Centre', 'Sea Salt Crisps',       'Case of 24', 2600,  700),
  ('Long Beach Distribution Centre', 'Dark Chocolate Bar',    '6 pack',      310,  450),
  ('Long Beach Distribution Centre', 'Whole Milk',            'Case of 24',  980,  900),
  ('Long Beach Distribution Centre', 'Greek Yoghurt',         '6 pack',      640,  350),
  ('Inland Empire Hub',              'Alpine Spring Water',   'Pallet',      760,  300),
  ('Inland Empire Hub',              'Sea Salt Crisps',       'Case of 24', 1440,  500),
  ('Bay Area Cross Dock',            'Stone Ground Flour',    'Pallet',      520,  250)
) as q(warehouse, product, packaging, qty, threshold)
join warehouse w on w.name = q.warehouse
join products p on p.name = q.product
join packaging pk on pk.product_id = p.id and pk.type = q.packaging;

insert into factory_inventory (factory_id, raw_material_id, quantity, threshold_units, base_price)
select f.id, r.id, v.qty, v.threshold, r.base_price from (values
  ('Torrance Bottling Works', 'Filtered water',     48000, 10000),
  ('Torrance Bottling Works', 'PET resin',            820,  1200),
  ('Torrance Bottling Works', 'Cane sugar',          3100,   900),
  ('Torrance Bottling Works', 'Citrus concentrate',   260,   400),
  ('Vernon Snack Plant',      'Potatoes',           14500,  4000),
  ('Vernon Snack Plant',      'Sea salt',             310,   200),
  ('Chino Creamery',          'Raw milk',           22000,  6000)
) as v(factory, material, qty, threshold)
join factories f on f.name = v.factory
join raw_materials r on r.name = v.material;

-- Orders over the last three months ----------------------------------------
insert into orders (distributor_id, product_id, packaging, quantity, price, status, deadline, created_at)
select '0ca2ea11-220a-4ebd-a6c4-278c71978090', p.id, pk.id, v.qty,
       round((p.base_price + pk.price) * v.qty, 2), v.status,
       (current_date - v.days_ago + 14), (now() - make_interval(days => v.days_ago))
from (values
  ('Alpine Spring Water',   'Case of 24', 900, 'Delivered',  84),
  ('Sea Salt Crisps',       'Case of 24', 640, 'Delivered',  77),
  ('Whole Milk',            'Case of 24', 380, 'Delivered',  70),
  ('Citrus Sparkling Soda', 'Case of 24', 720, 'Delivered',  63),
  ('Honey Oat Granola',     '6 pack',     260, 'Delivered',  56),
  ('Alpine Spring Water',   'Case of 24', 1100,'Delivered',  49),
  ('Dark Chocolate Bar',    '6 pack',     180, 'Rejected',   42),
  ('Cold Brew Coffee',      '6 pack',     210, 'Delivered',  35),
  ('Sea Salt Crisps',       'Case of 24', 880, 'Delivered',  28),
  ('Greek Yoghurt',         '6 pack',     240, 'Accepted',   21),
  ('Alpine Spring Water',   'Case of 24', 1250,'Accepted',   14),
  ('Whole Milk',            'Case of 24', 460, 'Pending',     7),
  ('Citrus Sparkling Soda', 'Case of 24', 540, 'Pending',     3),
  ('Honey Oat Granola',     '6 pack',     300, 'Pending',     1)
) as v(product, packaging, qty, status, days_ago)
join products p on p.name = v.product
join packaging pk on pk.product_id = p.id and pk.type = v.packaging;

insert into war_orders (warehouse_id, product_id, packaging_id, quantity, base_price, total_price, status, deadline, created_at)
select w.id, p.id, pk.id, v.qty, p.base_price, round((p.base_price + pk.price) * v.qty, 2), v.status,
       (current_date - v.days_ago + 21), (now() - make_interval(days => v.days_ago))
from (values
  ('Alpine Spring Water',   'Pallet',     6000, 'Delivered', 60),
  ('Sea Salt Crisps',       'Case of 24', 3200, 'Delivered', 45),
  ('Whole Milk',            'Case of 24', 1800, 'Delivered', 30),
  ('Cold Brew Coffee',      '6 pack',      900, 'Accepted',  12),
  ('Dark Chocolate Bar',    '6 pack',      750, 'Pending',    4)
) as v(product, packaging, qty, status, days_ago)
join products p on p.name = v.product
join packaging pk on pk.product_id = p.id and pk.type = v.packaging
join warehouse w on w.name = 'Long Beach Distribution Centre';

insert into raw_orders (factory_id, raw_material_id, vendor_id, quantity, base_price, total_price, status_updated, deadline, created_at)
select f.id, r.id, 'aa3a378a-0d6b-4349-ae8f-66b882319e43', v.qty, r.base_price, round(r.base_price * v.qty, 2),
       v.status, (current_date - v.days_ago + 10), (now() - make_interval(days => v.days_ago))
from (values
  ('Torrance Bottling Works', 'PET resin',          2000, 'Delivered', 26),
  ('Torrance Bottling Works', 'Citrus concentrate',  600, 'Pending',    5),
  ('Vernon Snack Plant',      'Potatoes',           8000, 'Accepted',   9),
  ('Chino Creamery',          'Raw milk',          12000, 'Pending',    2)
) as v(factory, material, qty, status, days_ago)
join factories f on f.name = v.factory
join raw_materials r on r.name = v.material;

insert into notifications (factory_id, message, type, read, created_at)
select f.id, v.message, v.type, v.read, now() - make_interval(hours => v.hours_ago)
from (values
  ('Torrance Bottling Works', 'Citrus concentrate is below its threshold: 260 of 400 litres', 'low_stock', false, 3),
  ('Torrance Bottling Works', 'PET resin is below its threshold: 820 of 1200 kg',             'low_stock', false, 9),
  ('Vernon Snack Plant',      'Warehouse order 3200 cases of Sea Salt Crisps accepted',       'order',     true, 30),
  ('Chino Creamery',          'Raw milk delivery scheduled for tomorrow',                     'info',      false, 14)
) as v(factory, message, type, read, hours_ago)
join factories f on f.name = v.factory;

commit;
