-- All warehouse stock with product names
SELECT w.name AS warehouse, p.name AS product, wi.quantity
FROM warehouse_inventory wi
JOIN warehouse w ON wi.warehouse_id = w.id
JOIN products p ON p.id = wi.product_id;

-- Low stock products in warehouse
SELECT w.name AS warehouse, p.name AS product, wi.quantity, wi.threshold
FROM warehouse_inventory wi
JOIN warehouse w ON w.id = wi.warehouse_id
JOIN products p ON p.id = wi.product_id
WHERE wi.quantity < wi.threshold;

-- Stock value summary per warehouse
SELECT w.name AS warehouse, SUM(wi.quantity * wi.price) AS total_stock_value
FROM warehouse_inventory wi
JOIN warehouse w ON w.id = wi.warehouse_id
GROUP BY w.name;

-- All raw materials in factories
SELECT f.name AS factory, rm.name AS raw_material, fi.quantity, fi.threshold_units
FROM factory_inventory fi
JOIN factories f ON f.id = fi.factory_id
JOIN raw_materials rm ON rm.id = fi.raw_material_id;

-- Raw materials below threshold
SELECT f.name, rm.name, fi.quantity, fi.threshold_units
FROM factory_inventory fi
JOIN factories f ON fi.factory_id = f.id
JOIN raw_materials rm ON fi.raw_material_id = rm.id
WHERE fi.quantity < fi.threshold_units;

-- Total base price of raw materials per factory
SELECT f.name AS factory, SUM(fi.base_price * fi.quantity) AS inventory_value
FROM factory_inventory fi
JOIN factories f ON fi.factory_id = f.id
GROUP BY f.name;

-- Unread notifications
SELECT * FROM notifications
WHERE read = false;

-- All notifications grouped by factory
SELECT f.name, n.message, n.created_at
FROM notifications n
JOIN factories f ON n.factory_id = f.id
ORDER BY n.created_at DESC;

-- Raw material notifications grouped by type
SELECT type, COUNT(*) AS count
FROM notifications
GROUP BY type;

-- All distributor orders
SELECT o.id, d.name AS distributor, p.name AS product, o.quantity, o.status
FROM orders o
JOIN products p ON o.product_id = p.id
JOIN profiles d ON o.distributor_id = d.id;

-- Pending orders with deadline
SELECT * FROM orders
WHERE status = 'pending' AND deadline >= CURRENT_DATE;

-- Raw material orders made by warehouses
SELECT rw.id, w.name, p.name, rw.base_price, rw.deadline
FROM raw_orders rw
JOIN warehouse w ON rw.warehouse_id = w.id
JOIN products p ON rw.product_id = p.id;

-- Raw orders sorted by status
SELECT status_updated, COUNT(*) AS total
FROM raw_orders
GROUP BY status_updated;

-- Factories managed by each production manager
SELECT pmf.prod_manager_id, f.name AS factory
FROM production_manager_factory pmf
JOIN factories f ON pmf.factory_id = f.id;

-- Product recipe for each product
SELECT p.name AS product, r.raw_material_id, r.quantity_per_unit
FROM product_recipes r
JOIN products p ON p.id = r.product_id;

-- Quantity of raw material needed per product
SELECT p.name, rm.name AS raw_material, r.quantity_per_unit
FROM product_recipes r
JOIN products p ON p.id = r.product_id
JOIN raw_materials rm ON rm.id = r.raw_material_id;


-- Packaging types used for products
SELECT p.name AS product, pk.type
FROM packaging pk
JOIN products p ON pk.product_id = p.id;

-- Packaging cost summary
SELECT pk.product_id, p.name AS product, SUM(pk.price) AS total_packaging_cost
FROM packaging pk
JOIN products p ON pk.product_id = p.id
GROUP BY pk.product_id, p.name;


-- All users and roles
SELECT name, role, company_name, company_location FROM profiles;

-- Count of users by role
SELECT role, COUNT(*) AS total_users FROM profiles GROUP BY role;

-- Warehouse managers and their assigned warehouses
SELECT m.manager_id, w.name AS warehouse
FROM warehouse_managers m
JOIN warehouse w ON m.warehouse_id = w.id;

-- Top 5 most ordered products
SELECT product_id, COUNT(*) AS total_orders
FROM orders
GROUP BY product_id
ORDER BY total_orders DESC
LIMIT 5;

-- Warehouses with the most stock
SELECT warehouse_id, SUM(quantity) AS total_stock
FROM warehouse_inventory
GROUP BY warehouse_id
ORDER BY total_stock DESC;

-- Monthly orders trend
SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*) AS orders
FROM orders
GROUP BY month
ORDER BY month;
