// src/types/index.ts

export type LifecycleStatus =
  | 'CURRENTLY_HELD'
  | 'UNDER_MAINTENANCE'
  | 'LOST'
  | 'STOLEN'
  | 'DAMAGED'
  | 'MISSING'
  | 'PENDING_DISPOSAL'
  | 'DISPOSED';

export type ConditionStatus =
  | 'NEW'
  | 'GOOD'
  | 'OK'
  | 'FAIR'
  | 'POOR'
  | 'NEEDS_REPAIR'
  | 'DAMAGED'
  | 'UNKNOWN';

export interface User {
  id: string;
  username: string;
  email: string | null;
  role_id: number;
  role_code: string;
  role_name: string;
  employee_id: string | null;
  employee_name?: string;
}

export interface Role {
  id: number;
  code: string;
  name: string;
  description: string;
}

export interface Office {
  id: string;
  country: string;
  office_code: string;
  office_name: string;
  is_active: boolean;
}

export interface Department {
  id: string;
  department_code: string;
  department_name: string;
  office_id: string;
  office_name?: string;
}

export interface Location {
  id: string;
  office_id: string;
  office_name?: string;
  parent_location_id: string | null;
  location_code: string;
  location_name: string;
  location_type: string;
  description: string | null;
  asset_count?: number;
}

export interface AssetCategory {
  id: string;
  code: string;
  name: string;
  description: string | null;
  subcategories?: AssetSubcategory[];
}

export interface AssetSubcategory {
  id: string;
  category_id: string;
  code: string;
  name: string;
}

export interface Donor {
  id: string;
  donor_code: string;
  donor_name: string;
}

export interface Employee {
  id: string;
  employee_number: string;
  full_name: string;
  department_id: string | null;
  department_name?: string;
  office_name?: string;
  job_title: string | null;
  email: string | null;
  phone: string | null;
  employment_status: string;
  is_active: boolean;
  notes: string | null;
  active_custody_count?: number;
}

export interface Asset {
  id: string;
  asset_number: string | null;
  full_asset_number: string | null;
  normalized_asset_number: string;
  item_description: string;
  asset_type: string;
  category_id: string | null;
  category_name?: string;
  category_code?: string;
  subcategory_id: string | null;
  subcategory_name?: string;
  brand_name: string | null;
  model: string | null;
  serial_number_1: string | null;
  serial_number_2: string | null;
  accessories: string | null;
  invoice_cost_syp: number | null;
  currency: string;
  invoice_cost_usd: number | null;
  donor_id: string | null;
  donor_name?: string;
  cost_center_id: string | null;
  cost_center_name?: string;
  office_id: string | null;
  office_name?: string;
  department_id: string | null;
  department_name?: string;
  date_received: string | null;
  lifecycle_status: LifecycleStatus;
  condition_status: ConditionStatus;
  current_location_id: string | null;
  current_location_name?: string;
  current_custodian_employee_id: string | null;
  custodian_name?: string;
  custodian_number?: string;
  custodian_job_title?: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssetAssignment {
  id: string;
  asset_id: string;
  employee_id: string;
  employee_name?: string;
  employee_number?: string;
  assigned_location_id: string | null;
  assigned_location_name?: string;
  assignment_date: string;
  expected_return_date: string | null;
  returned_at: string | null;
  assignment_condition: string;
  assignment_notes: string | null;
  return_condition: string | null;
  return_notes: string | null;
  is_current: boolean;
  assigned_by_username?: string;
  returned_by_username?: string;
}

export interface AssetMovement {
  id: string;
  asset_id: string;
  full_asset_number?: string;
  item_description?: string;
  movement_type: string;
  from_location_name?: string;
  to_location_name?: string;
  from_employee_name?: string;
  to_employee_name?: string;
  movement_date: string;
  reference_number?: string;
  notes: string | null;
  performed_by_username?: string;
}

export interface InventorySession {
  id: string;
  session_number: string;
  session_name: string;
  office_id: string | null;
  office_name?: string;
  location_id: string | null;
  location_name?: string;
  category_id: string | null;
  category_name?: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  started_at: string;
  completed_at: string | null;
  total_items?: number;
  matched_count?: number;
  missing_count?: number;
  pending_count?: number;
  created_by_username?: string;
}

export interface InventoryItem {
  id: string;
  inventory_session_id: string;
  asset_id: string | null;
  full_asset_number?: string;
  item_description?: string;
  brand_name?: string;
  model?: string;
  scanned_asset_number: string | null;
  expected_location_name?: string;
  actual_location_name?: string;
  expected_custodian_name?: string;
  actual_custodian_name?: string;
  result_status: 'PENDING' | 'MATCHED' | 'FOUND_DIFFERENT_LOCATION' | 'FOUND_DIFFERENT_CUSTODIAN' | 'DAMAGED' | 'NEEDS_REPAIR' | 'MISSING' | 'UNREGISTERED';
  condition_status: string;
  scanned_at: string | null;
  scanned_by_username?: string;
  notes: string | null;
}

export interface MaintenanceRequest {
  id: string;
  request_number: string;
  asset_id: string;
  full_asset_number?: string;
  item_description?: string;
  brand_name?: string;
  model?: string;
  reported_by_employee_name?: string;
  reported_by_username?: string;
  issue_description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'SENT_TO_VENDOR' | 'RESOLVED' | 'CANCELLED' | 'CANNOT_BE_REPAIRED';
  sent_to: string | null;
  opened_at: string;
  closed_at: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  currency: string;
  resolution_notes: string | null;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  username?: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: any;
  new_values: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface DashboardStats {
  totalAssets: number;
  assignedAssets: number;
  inStockAssets: number;
  underRepairAssets: number;
  missingAssets: number;
  activeEmployees: number;
  activeCustodies: number;
  activeInventoryAudits: number;
  totalValuationUsd: number;
}

