-- 018_create_views.sql
-- Production reporting and query optimization views

CREATE OR REPLACE VIEW v_assets_detailed AS
SELECT 
    a.id,
    a.asset_number,
    a.full_asset_number,
    a.normalized_asset_number,
    a.item_description,
    a.asset_type,
    a.category_id,
    c.name AS category_name,
    c.code AS category_code,
    a.subcategory_id,
    sc.name AS subcategory_name,
    sc.code AS subcategory_code,
    a.brand_name,
    a.model,
    a.serial_number_1,
    a.serial_number_2,
    a.accessories,
    a.invoice_cost_syp,
    a.currency,
    a.invoice_cost_usd,
    a.donor_id,
    dn.donor_name,
    dn.donor_code,
    a.cost_center_id,
    cc.code AS cost_center_code,
    a.gl_account,
    a.lin,
    a.office_id,
    o.office_name,
    o.office_code,
    a.department_id,
    d.department_name,
    d.department_code,
    a.payment_voucher_number,
    a.pr_number,
    a.po_number,
    a.grn_number,
    a.date_received,
    a.registered_by,
    a.lifecycle_status,
    a.condition_status,
    a.current_location_id,
    loc.location_name AS current_location_name,
    loc.location_code AS current_location_code,
    loc.location_type AS current_location_type,
    a.current_custodian_employee_id,
    emp.full_name AS current_custodian_name,
    emp.employee_number AS current_custodian_number,
    emp.job_title AS current_custodian_job_title,
    a.notes,
    a.source_row_number,
    a.created_at,
    a.updated_at,
    a.deleted_at
FROM assets a
LEFT JOIN asset_categories c ON a.category_id = c.id
LEFT JOIN asset_subcategories sc ON a.subcategory_id = sc.id
LEFT JOIN donors dn ON a.donor_id = dn.id
LEFT JOIN cost_centers cc ON a.cost_center_id = cc.id
LEFT JOIN offices o ON a.office_id = o.id
LEFT JOIN departments d ON a.department_id = d.id
LEFT JOIN locations loc ON a.current_location_id = loc.id
LEFT JOIN employees emp ON a.current_custodian_employee_id = emp.id;

CREATE OR REPLACE VIEW v_employee_custody_summary AS
SELECT 
    e.id AS employee_id,
    e.employee_number,
    e.full_name,
    e.job_title,
    e.email,
    e.phone,
    d.department_name,
    COUNT(a.id) AS total_assigned_assets,
    COALESCE(SUM(a.invoice_cost_usd), 0) AS total_custody_value_usd
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN assets a ON a.current_custodian_employee_id = e.id AND a.deleted_at IS NULL
WHERE e.is_active = TRUE
GROUP BY e.id, e.employee_number, e.full_name, e.job_title, e.email, e.phone, d.department_name;
