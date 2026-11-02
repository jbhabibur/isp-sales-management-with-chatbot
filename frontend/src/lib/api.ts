const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export interface Package {
  id: number;
  name: string;
  speed: string;
  monthly_price: number;
  is_active: boolean;
}

export async function getPackages(): Promise<Package[]> {
  const response = await fetch(`${API_BASE_URL}/api/packages/`);

  if (!response.ok) {
    throw new Error("Failed to fetch packages");
  }

  return response.json();
}

export interface CoverageArea {
  id: number;
  city: string;
  area_name: string;
  is_active: boolean;
}

export async function getCoverageAreas(): Promise<CoverageArea[]> {
  const response = await fetch(`${API_BASE_URL}/api/coverage/`);

  if (!response.ok) {
    throw new Error("Failed to fetch coverage areas");
  }

  return response.json();
}

export async function checkCoverage(
  city: string,
  area: string,
): Promise<{ city: string; area: string; covered: boolean }> {
  const params = new URLSearchParams({ city, area });

  const response = await fetch(
    `${API_BASE_URL}/api/coverage/check?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error("Failed to check coverage");
  }

  return response.json();
}

export interface OrderCreateData {
  customer_name: string;
  phone: string;
  city: string;
  area: string;
  address: string;
  package_id: number;
}

export interface OrderCreateResponse {
  message: string;
  order_id?: number;
  lead_id?: number;
  status: string;
  covered: boolean;
}

export async function createOrder(
  data: OrderCreateData,
): Promise<OrderCreateResponse> {
  const response = await fetch(`${API_BASE_URL}/api/orders/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.detail ?? "Request failed");
  }

  return result;
}

export interface CallbackCreateData {
  customer_name: string;
  phone: string;
  message?: string;
}

export interface CallbackCreateResponse {
  message: string;
  callback_id: number;
  status: string;
}

export async function createCallback(
  data: CallbackCreateData,
): Promise<CallbackCreateResponse> {
  const response = await fetch(`${API_BASE_URL}/api/callbacks/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.detail ?? "Callback request failed");
  }

  return result;
}

// ==================== Authentication ====================

export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  role: "ADMIN" | "SALES_AGENT";
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
}

const TOKEN_KEY = "circle_network_token";
const USER_KEY = "circle_network_user";

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.detail || "Login failed");
  }

  localStorage.setItem(TOKEN_KEY, result.access_token);
  localStorage.setItem(USER_KEY, JSON.stringify(result.user));

  return result;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;

  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const user = localStorage.getItem(USER_KEY);

  return user ? (JSON.parse(user) as AuthUser) : null;
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function getCurrentUser(): Promise<AuthUser> {
  const token = getToken();

  if (!token) {
    throw new Error("Please login first");
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    logout();
    throw new Error("Session expired. Please login again.");
  }

  return response.json();
}

// ==================== Dashboard ====================

export interface AdminDashboardData {
  total_orders: number;
  pending_orders: number;
  completed_connections: number;
  total_sales_agents: number;
}

export interface AgentDashboardData {
  total_orders: number;
  pending_orders: number;
  confirmed_orders: number;
  connected_orders: number;
}

async function authenticatedFetch(endpoint: string, options?: RequestInit) {
  const token = getToken();

  if (!token) {
    throw new Error("Please login first");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    logout();
    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.detail ? JSON.stringify(errorData.detail) : "Request failed",
    );
  }

  return response.json();
}

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  return authenticatedFetch("/api/dashboard/admin");
}

export async function getAgentDashboard(): Promise<AgentDashboardData> {
  return authenticatedFetch("/api/dashboard/agent");
}

// ==================== Admin → Sales Agent Management ====================

export interface SalesAgent {
  id: number;
  full_name: string;
  email: string;
  role: "SALES_AGENT";
  is_active: boolean;
}

export interface AgentCreateData {
  full_name: string;
  email: string;
  password: string;
}

export async function getAgents(): Promise<SalesAgent[]> {
  return authenticatedFetch("/api/agents/");
}

export async function createAgent(
  data: AgentCreateData,
): Promise<{ message: string; agent: SalesAgent }> {
  const token = getToken();

  if (!token) {
    throw new Error("Please login first");
  }

  const response = await fetch(`${API_BASE_URL}/api/agents/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (response.status === 401) {
    logout();
    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    throw new Error(result.detail || "Failed to create sales agent");
  }

  return result;
}

export interface AgentUpdateData {
  full_name?: string;
  email?: string;
}

export interface AgentStatusUpdateData {
  is_active: boolean;
}

export interface AgentMutationResponse {
  message: string;
  agent?: SalesAgent;
  agent_id?: number;
}

export async function updateAgent(
  agentId: number,
  data: AgentUpdateData,
): Promise<AgentMutationResponse> {
  return authenticatedFetch(`/api/agents/${agentId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function updateAgentStatus(
  agentId: number,
  isActive: boolean,
): Promise<AgentMutationResponse> {
  return authenticatedFetch(`/api/agents/${agentId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ is_active: isActive }),
  });
}

export async function deleteAgent(
  agentId: number,
): Promise<AgentMutationResponse> {
  return authenticatedFetch(`/api/agents/${agentId}`, {
    method: "DELETE",
  });
}

// ==================== Admin → Coverage Area Management  ====================

export interface CoverageAreaCreateData {
  city: string;
  area_name: string;
}

export interface CoverageAreaUpdateData {
  city?: string;
  area_name?: string;
  is_active?: boolean;
}

export async function getAdminCoverageAreas(): Promise<CoverageArea[]> {
  return authenticatedFetch("/api/coverage/admin");
}

export async function createCoverageArea(
  data: CoverageAreaCreateData,
): Promise<CoverageArea> {
  return authenticatedFetch("/api/coverage/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function updateCoverageArea(
  areaId: number,
  data: CoverageAreaUpdateData,
): Promise<CoverageArea> {
  return authenticatedFetch(`/api/coverage/${areaId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function deleteCoverageArea(areaId: number): Promise<void> {
  await authenticatedFetch(`/api/coverage/${areaId}`, {
    method: "DELETE",
  });
}

// ==================== Admin → Package Management  ====================

export interface PackageCreateData {
  name: string;
  speed: string;
  monthly_price: number;
}

export interface PackageUpdateData {
  name?: string;
  speed?: string;
  monthly_price?: number;
  is_active?: boolean;
}

export interface PackageMutationResponse {
  message: string;
  id?: number;
}

export async function getAdminPackages(): Promise<Package[]> {
  return authenticatedFetch("/api/packages/admin");
}

export async function createPackage(
  data: PackageCreateData,
): Promise<PackageMutationResponse> {
  return authenticatedFetch("/api/packages/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function updatePackage(
  packageId: number,
  data: PackageUpdateData,
): Promise<PackageMutationResponse> {
  return authenticatedFetch(`/api/packages/${packageId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function deletePackage(
  packageId: number,
): Promise<PackageMutationResponse> {
  return authenticatedFetch(`/api/packages/${packageId}`, {
    method: "DELETE",
  });
}

// ==================== Admin → Order Management  ====================
export interface CustomerOrder {
  id: number;
  customer_name: string;
  phone: string;
  city: string;
  area: string;
  address: string;
  package_name: string;
  monthly_price: number;
  status: "PENDING" | "CONFIRMED" | "CONNECTED" | "CANCELLED";
  created_at: string;
}

export type OrderStatus = "PENDING" | "CONFIRMED" | "CONNECTED" | "CANCELLED";

export interface OrderStatusResponse {
  message: string;
  order_id: number;
  status: OrderStatus;
}

export async function getOrders(): Promise<CustomerOrder[]> {
  return authenticatedFetch("/api/orders/");
}

export async function updateOrderStatus(
  orderId: number,
  status: OrderStatus,
): Promise<OrderStatusResponse> {
  return authenticatedFetch(`/api/orders/${orderId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
}

// ==================== Admin → Callback Requests  ====================
export type CallbackStatus =
  | "PENDING"
  | "CONTACTED"
  | "COMPLETED"
  | "CANCELLED";

export interface CallbackRequest {
  id: number;
  customer_name: string;
  phone: string;
  message?: string | null;
  status: CallbackStatus;
  assigned_agent_id: number | null;
  created_at: string;
}

export interface CallbackListResponse {
  items: CallbackRequest[];
  total: number;
  skip: number;
  limit: number;
}

export interface CallbackHistory {
  id: number;
  callback_id: number;
  actor_user_id: number | null;
  actor_name: string;
  action: "CREATED" | "ASSIGNED" | "STATUS_CHANGED" | "NOTE_ADDED";
  old_value: string | null;
  new_value: string | null;
  note: string | null;
  created_at: string;
}

export interface AgentCallbackHistory {
  id: number;
  callback_id: number;
  customer_name: string;
  phone: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  note: string | null;
  created_at: string;
}

// Get all callback requests
export async function getCallbackRequests(params?: {
  status?: CallbackStatus;
  search?: string;
  skip?: number;
  limit?: number;
}): Promise<CallbackListResponse> {
  const query = new URLSearchParams();

  if (params?.status) query.set("status", params.status);
  if (params?.search?.trim()) {
    query.set("search", params.search.trim());
  }
  if (params?.skip !== undefined) {
    query.set("skip", String(params.skip));
  }
  if (params?.limit !== undefined) {
    query.set("limit", String(params.limit));
  }

  const queryString = query.toString();

  return authenticatedFetch(
    `/api/callbacks/${queryString ? `?${queryString}` : ""}`,
  );
}

// Get single callback details
export async function getCallback(id: number): Promise<CallbackRequest> {
  return authenticatedFetch(`/api/callbacks/${id}`);
}

// Assign callback to a sales agent
export async function assignCallback(
  id: number,
  agentId: number,
): Promise<{
  message: string;
  id: number;
  assigned_agent_id: number;
}> {
  return authenticatedFetch(`/api/callbacks/${id}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ agent_id: agentId }),
  });
}

// Update callback status
export async function updateCallbackStatus(
  id: number,
  status: CallbackStatus,
): Promise<{
  message: string;
  id: number;
  status: CallbackStatus;
}> {
  return authenticatedFetch(`/api/callbacks/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// Add callback note
export async function addCallbackNote(
  id: number,
  note: string,
): Promise<{
  message: string;
  callback_id: number;
}> {
  return authenticatedFetch(`/api/callbacks/${id}/notes`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

// Get callback activity history
export async function getCallbackHistory(
  id: number,
): Promise<CallbackHistory[]> {
  return authenticatedFetch(`/api/callbacks/${id}/history`);
}

// Get sales agent's callback activity history
export async function getAgentCallbackHistory(
  agentId: number,
): Promise<AgentCallbackHistory[]> {
  return authenticatedFetch(
    `/api/callbacks/agents/${agentId}/callback-history`,
  );
}

// ==================== Admin → Future Leads  ====================
export interface FutureLead {
  id: number;
  customer_name: string;
  phone: string;
  city: string;
  area: string;
  address: string | null;
  status: string;
  created_at: string;
}

export interface FutureLeadStats {
  total_leads: number;
  new_leads: number;
  contacted_leads: number;
  converted_leads: number;
}

export type FutureLeadStatus =
  | "NEW"
  | "CONTACTED"
  | "INTERESTED"
  | "COVERAGE_PLANNED"
  | "CONVERTED"
  | "REJECTED";

export interface FutureLeadFilters {
  search?: string;
  city?: string;
  area?: string;
  status?: FutureLeadStatus;
}

// Get All Future Leads
export async function getFutureLeads(
  filters?: FutureLeadFilters,
): Promise<FutureLead[]> {
  const params = new URLSearchParams();

  if (filters?.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters?.city?.trim()) {
    params.set("city", filters.city.trim());
  }

  if (filters?.area?.trim()) {
    params.set("area", filters.area.trim());
  }

  if (filters?.status) {
    params.set("status", filters.status);
  }

  const query = params.toString();

  return authenticatedFetch(`/api/future-leads/${query ? `?${query}` : ""}`);
}

// Get Single Future Lead

export async function getFutureLead(id: number): Promise<FutureLead> {
  return authenticatedFetch(`/api/future-leads/${id}`);
}

// Update Future Lead Status
export async function updateFutureLeadStatus(
  id: number,
  status: FutureLeadStatus,
): Promise<{
  message: string;
  id: number;
  status: FutureLeadStatus;
}> {
  return authenticatedFetch(`/api/future-leads/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

//Get Future Lead Statistics
export async function getFutureLeadStats(): Promise<FutureLeadStats> {
  return authenticatedFetch("/api/future-leads/stats/summary");
}
