import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { useAuthStore } from "../store/useAuthStore";
import {
  mockProducts,
  mockCategories,
  mockTags,
  mockTourismSpots,
  mockFinanceDashboard,
  mockLoanProducts,
  mockInsuranceProducts,
  mockLoanApplications,
  mockPolicies,
  mockClaims,
  mockRoutes,
  mockOrders,
  mockAddresses,
} from "./mockData";

// Mock Data Handler
const getMockData = (config: AxiosRequestConfig) => {
  const url = config.url || "";
  const method = config.method?.toLowerCase() || "get";
  const data = config.data ? JSON.parse(config.data) : {};

  console.log(`[Mock API] Request: ${method.toUpperCase()} ${url}`);

  // --- Auth ---
  if (url.includes("/auth/login") && method === "post") {
    const { username } = data;
    let role = "TOURIST";
    let nickname = "测试用户";
    if (username === "admin") { role = "ADMIN"; nickname = "系统管理员"; }
    if (username.includes("farmer")) { role = "FARMER"; nickname = "张三果园"; }
    if (username.includes("bank")) { role = "FINANCIAL_PROVIDER"; nickname = "农村信用社"; }
    if (username.includes("insure")) { role = "INSURANCE_PROVIDER"; nickname = "人保财险"; }
    if (username.includes("merchant")) { role = "MERCHANT"; nickname = "测试商家"; }

    return {
      token: "mock-jwt-token-12345",
      userInfo: { id: 1, username, nickname, role, avatar: null },
    };
  } else if (url.includes("/auth/register") && method === "post") {
    return {
      token: "mock-jwt-token-register",
      userInfo: { id: Date.now(), username: data.username, nickname: data.nickname, role: data.role, orgName: data.orgName, licenseNo: data.licenseNo, avatar: null },
    };
  }

  // --- Products ---
  else if (url.includes("/products/categories") && method === "get") {
    return mockCategories;
  } else if (url.includes("/admin/categories") && method === "post") {
    const newCat = { id: mockCategories.length + 1, name: data.name, parentId: 0 };
    mockCategories.push(newCat);
    return newCat;
  } else if (url.includes("/products/tags") && method === "get") {
    return mockTags;
  } else if (url.includes("/products/mine") && method === "get") {
    return mockProducts.filter(p => p.sellerId === 2);
  } else if (url.match(/\/products\/\d+\/status$/) && method === "put") {
    return true;
  } else if (url.match(/\/products\/\d+$/) && method === "get") {
    const id = parseInt(url.split("/").pop() || "0");
    return mockProducts.find((p) => p.id === id) || mockProducts[0];
  } else if (url.match(/\/products\/\d+$/) && (method === "put" || method === "patch")) {
    return true;
  } else if (url.includes("/products") && method === "post") {
    return true;
  } else if (url.match(/\/products\/\d+$/) && method === "delete") {
    return true;
  } else if (url.includes("/products") && method === "get") {
    return { records: [...mockProducts], total: mockProducts.length, page: 1, size: 10, totalPages: 1 };
  }

  // --- Tourism: Admin audit ---
  else if (url.includes("/admin/tourism/spots") && url.includes("status=PENDING") && method === "get") {
    return { records: mockTourismSpots.filter(s => s.status === "PENDING"), total: 0, page: 1, size: 10, totalPages: 1 };
  } else if (url.match(/\/admin\/tourism\/spots\/\d+\/audit$/) && method === "put") {
    return true;
  }

  // --- Tourism: Spots ---
  else if (url.match(/\/tourism\/spots\/\d+\/tickets\/\d+$/) && method === "delete") {
    return true;
  } else if (url.match(/\/tourism\/spots\/\d+\/tickets$/) && method === "post") {
    return true;
  } else if (url.match(/\/tourism\/spots\/\d+\/tickets/) && method === "get") {
    return [];
  } else if (url.match(/\/tourism\/spots\/\d+\/reviews/) && method === "get") {
    return { records: [], total: 0, page: 1, size: 10, totalPages: 1 };
  } else if (url.match(/\/tourism\/spots\/\d+\/reviews$/) && method === "post") {
    return true;
  } else if (url.match(/\/tourism\/spots\/\d+\/favorite$/) && method === "post") {
    return true;
  } else if (url.includes("/tourism/favorites") && method === "get") {
    return { records: [], total: 0, page: 1, size: 10, totalPages: 1 };
  } else if (url.match(/\/tourism\/reviews\/\d+$/) && method === "delete") {
    return true;
  } else if (url.includes("/tourism/spots/mine") && method === "get") {
    return { records: [], total: 0 };
  } else if (url.match(/\/tourism\/spots\/\d+$/) && method === "get") {
    const id = parseInt(url.split("/").pop() || "0");
    return mockTourismSpots.find(s => s.id === id) || mockTourismSpots[0];
  } else if (url.match(/\/tourism\/spots\/\d+$/) && method === "put") {
    return true;
  } else if (url.match(/\/tourism\/spots\/\d+$/) && method === "delete") {
    return true;
  } else if (url.includes("/tourism/spots") && method === "post") {
    return true;
  } else if (url.includes("/tourism/spots") && method === "get") {
    return { records: mockTourismSpots, total: mockTourismSpots.length, page: 1, size: 10, totalPages: 1 };
  }

  // --- Tourism: Routes ---
  else if (url.includes("/tourism/routes/public") && method === "get") {
    return { records: mockRoutes, total: mockRoutes.length, page: 1, size: 10, totalPages: 1 };
  } else if (url.includes("/tourism/routes/mine") && method === "get") {
    return { records: [], total: 0, page: 1, size: 10, totalPages: 1 };
  } else if (url.match(/\/tourism\/routes\/\d+\/copy$/) && method === "post") {
    return true;
  } else if (url.match(/\/tourism\/routes\/\d+$/) && method === "get") {
    const id = parseInt(url.split("/").pop() || "0");
    return mockRoutes.find(r => r.id === id) || mockRoutes[0];
  } else if (url.match(/\/tourism\/routes\/\d+$/) && method === "put") {
    return true;
  } else if (url.match(/\/tourism\/routes\/\d+$/) && method === "delete") {
    return true;
  } else if (url.includes("/tourism/routes") && method === "post") {
    return true;
  }

  // --- Tourism: Bookings ---
  else if (url.includes("/tourism/bookings") && method === "post") {
    return { id: Date.now(), bookingCode: "A3K7M2", status: "PENDING_PAYMENT" };
  }

  // --- Finance: Dashboard ---
  else if (url.match(/\/finance\/dashboard\/\d+$/) && method === "get") {
    return mockFinanceDashboard;
  } else if (url.includes("/finance/dashboard") && method === "get") {
    return mockFinanceDashboard;
  }

  // --- Finance: Loan Products ---
  else if (url.includes("/finance/loan-products/mine") && method === "get") {
    return { records: mockLoanProducts, total: mockLoanProducts.length, page: 1, size: 10, totalPages: 1 };
  } else if (url.match(/\/finance\/loan-products\/\d+$/) && (method === "put" || method === "patch")) {
    return true;
  } else if (url.match(/\/finance\/loan-products\/\d+$/) && method === "delete") {
    return true;
  } else if (url.includes("/finance/loan-products") && method === "post") {
    return true;
  } else if (url.includes("/finance/loan-products") && method === "get") {
    return { records: mockLoanProducts, total: mockLoanProducts.length, page: 1, size: 10, totalPages: 1 };
  }

  // --- Finance: Loan Applications ---
  else if (url.includes("/finance/loan-applications/mine") && method === "get") {
    return { records: mockLoanApplications, total: mockLoanApplications.length };
  } else if (url.includes("/finance/loan-applications/review") && method === "get") {
    return { records: mockLoanApplications.filter(a => a.status === "SUBMITTED"), total: 1 };
  } else if (url.match(/\/finance\/loan-applications\/\d+\/review$/) && method === "put") {
    return true;
  } else if (url.includes("/finance/loan-applications") && method === "post") {
    return true;
  }

  // --- Finance: Insurance Products ---
  else if (url.includes("/finance/insurance-products/mine") && method === "get") {
    return { records: mockInsuranceProducts, total: mockInsuranceProducts.length, page: 1, size: 10, totalPages: 1 };
  } else if (url.match(/\/finance\/insurance-products\/\d+$/) && (method === "put" || method === "patch")) {
    return true;
  } else if (url.match(/\/finance\/insurance-products\/\d+$/) && method === "delete") {
    return true;
  } else if (url.includes("/finance/insurance-products") && method === "post") {
    return true;
  } else if (url.includes("/finance/insurance-products") && method === "get") {
    return { records: mockInsuranceProducts, total: mockInsuranceProducts.length, page: 1, size: 10, totalPages: 1 };
  }

  // --- Finance: Policies ---
  else if (url.includes("/finance/policies/mine") && method === "get") {
    return { records: mockPolicies, total: mockPolicies.length };
  } else if (url.match(/\/finance\/policies\/\d+\/pay$/) && method === "put") {
    return true;
  } else if (url.includes("/finance/policies") && method === "post") {
    return true;
  }

  // --- Finance: Claims ---
  else if (url.includes("/finance/claims/mine") && method === "get") {
    return { records: mockClaims, total: mockClaims.length };
  } else if (url.includes("/finance/claims/review") && method === "get") {
    return { records: mockClaims.filter(c => c.status === "SUBMITTED"), total: 1 };
  } else if (url.match(/\/finance\/claims\/\d+\/review$/) && method === "put") {
    return true;
  } else if (url.includes("/finance/claims") && method === "post") {
    return true;
  }

  // --- Finance: Credit Report ---
  else if (url.includes("/finance/credit-report") && method === "get") {
    return mockFinanceDashboard.creditReport;
  }

  // --- Addresses ---
  else if (url.match(/\/addresses\/\d+\/default$/) && method === "put") {
    return true;
  } else if (url.match(/\/addresses\/\d+$/) && method === "put") {
    return true;
  } else if (url.match(/\/addresses\/\d+$/) && method === "delete") {
    return true;
  } else if (url.includes("/addresses") && method === "post") {
    const newAddr = { id: Date.now(), ...data, fullAddress: `${data.province}${data.city}${data.district || ""}${data.detail}`, createdAt: new Date().toISOString() };
    mockAddresses.push(newAddr);
    return newAddr;
  } else if (url.includes("/addresses") && method === "get") {
    return mockAddresses;
  }

  // --- Cart ---
  else if (url.includes("/cart/count") && method === "get") {
    return { count: 0 };
  } else if (url.match(/\/cart\/\d+$/) && method === "delete") {
    return true;
  } else if (url.match(/\/cart\/\d+$/) && method === "put") {
    return true;
  } else if (url.includes("/cart") && method === "get") {
    return { items: [], totalCount: 0, selectedCount: 0, selectedAmount: 0 };
  } else if (url.includes("/cart") && method === "post") {
    return true;
  }

  // --- Orders ---
  else if (url.match(/\/orders\/\d+\/(pay|ship|confirm|cancel)$/) && method === "put") {
    return true;
  } else if (url.match(/\/orders\/\d+$/) && method === "get") {
    const orderId = parseInt(url.split("/").pop() || "0");
    return mockOrders.find(o => o.id === orderId) || mockOrders[0];
  } else if (url.includes("/orders") && method === "post") {
    return { id: Date.now(), orderNo: "ORD" + Date.now(), status: "PENDING_PAYMENT", items: [], totalAmount: 0, ...data };
  } else if (url.includes("/orders") && method === "get") {
    return { records: mockOrders, total: mockOrders.length, page: 1, size: 10, totalPages: 1 };
  }

  // --- Users ---
  else if (url.includes("/users/profile") && method === "put") {
    return true;
  } else if (url.includes("/users/password") && method === "put") {
    return true;
  } else if (url.match(/\/admin\/users\/\d+\/reset-pwd$/) && method === "put") {
    return true;
  } else if (url.match(/\/admin\/users\/\d+$/) && method === "put") {
    return true;
  } else if (url.match(/\/admin\/users\/\d+$/) && method === "delete") {
    return true;
  } else if (url.includes("/admin/users") && method === "get") {
    return {
      records: [
        { id: 1, username: "admin", nickname: "系统管理员", role: "ADMIN", enabled: true, createdAt: "2026-01-01" },
        { id: 2, username: "farmer01", nickname: "张三果园", role: "FARMER", enabled: true, createdAt: "2026-01-15" },
        { id: 3, username: "bank01", nickname: "农村信用社", role: "FINANCIAL_PROVIDER", enabled: true, createdAt: "2026-01-10" },
        { id: 4, username: "insure01", nickname: "人保财险", role: "INSURANCE_PROVIDER", enabled: true, createdAt: "2026-01-10" },
        { id: 5, username: "tourist01", nickname: "游客小王", role: "TOURIST", enabled: true, createdAt: "2026-02-01" },
      ],
      total: 5, page: 1, size: 10, totalPages: 1,
    };
  }

  // Generic success for mutations
  if (["post", "put", "delete", "patch"].includes(method)) {
    return true;
  }

  return null;
};

// Toggle this to false to use the real backend API
const USE_MOCK_DATA = false;

// Custom Adapter to intercept requests before they hit the network
const mockAdapter = async (config: AxiosRequestConfig): Promise<AxiosResponse> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const mockData = getMockData(config);
        if (mockData !== null) {
          resolve({
            data: {
              code: 200,
              message: "success (mocked)",
              data: mockData,
            },
            status: 200,
            statusText: "OK",
            headers: {},
            config: config as any,
            request: {},
          });
        } else {
          reject({
            message: "Request failed with status code 404",
            response: { status: 404, statusText: "Not Found", data: { message: "Mock data not found for this endpoint" } },
            config,
          });
        }
      } catch (error) {
        reject(error);
      }
    }, 300);
  });
};

// Create an axios instance
export const api = axios.create({
  baseURL: "/api/v1",
  timeout: 10000,
  adapter: USE_MOCK_DATA ? mockAdapter : undefined,
});

// Add a request interceptor to inject the token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);
