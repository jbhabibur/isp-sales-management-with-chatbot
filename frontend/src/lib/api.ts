const API_BASE_URL = "http://127.0.0.1:8000";

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
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });

  if (response.status === 401) {
    logout();
    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Request failed");
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

export interface CallbackRequest {
  id: number;
  customer_name: string;
  phone: string;
  message?: string | null;
  status: string;
  created_at: string;
}

export async function getCallbackRequests(): Promise<CallbackRequest[]> {
  return authenticatedFetch("/api/callbacks/");
}

// ==================== Admin → Callback Requests  ====================

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

export async function getFutureLeads(): Promise<FutureLead[]> {
  return authenticatedFetch("/api/future-leads/");
}
