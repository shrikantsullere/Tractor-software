// Base URL for the backend API
const API_URL = 'http://localhost:5000/api'
// const API_URL = 'https://tractor-bakend-production.up.railway.app/api'

/**
 * Standard fetch wrapper that automatically injects the Authorization header
 * if a token is present in localStorage.
 */
async function fetchAPI(endpoint, options = {}) {
  const token = localStorage.getItem('tractorlink_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

// Auth API Calls
export const api = {
  auth: {
    login: async (phone, password) => {
      return await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password }),
      });
    },
    register: async (userData) => {
      return await fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },
    getMe: async () => {
      return await fetchAPI('/auth/me', {
        method: 'GET',
      });
    },
    logout: async () => {
      return await fetchAPI('/auth/logout', { method: 'POST' });
    }
  },
  farmer: {
    getDashboard: async () => {
      return await fetchAPI('/farmer/dashboard');
    },
    getRecentActivity: async () => {
      return await fetchAPI('/farmer/recent-activity');
    },
    getUpcomingJobs: async () => {
      return await fetchAPI('/farmer/upcoming-jobs');
    },
    listServices: async () => {
      return await fetchAPI('/farmer/services');
    },
    listZones: async () => {
      return await fetchAPI('/farmer/zones');
    },
    getSystemConfig: async () => {
      return await fetchAPI('/farmer/settings/config');
    },
    getPricePreview: async (bookingData) => {
      return await fetchAPI('/farmer/price-preview', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      });
    },
    createBooking: async (bookingData) => {
      return await fetchAPI('/farmer/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      });
    },
    checkout: async (bookingData) => {
      return await fetchAPI('/farmer/checkout', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      });
    },
    listBookings: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return await fetchAPI(`/farmer/bookings?${query}`);
    },
    getBooking: async (id) => {
      return await fetchAPI(`/farmer/bookings/${id}`);
    },
    getProfile: async () => {
      return await fetchAPI('/farmer/profile');
    },
    updateProfile: async (profileData) => {
      return await fetchAPI('/farmer/profile', {
        method: 'PATCH',
        body: JSON.stringify(profileData)
      });
    },
    changePassword: async (passwordData) => {
      return await fetchAPI('/farmer/change-password', {
        method: 'PATCH',
        body: JSON.stringify(passwordData)
      });
    },
    updateLanguage: async (languageData) => {
      return await fetchAPI('/farmer/language', {
        method: 'PATCH',
        body: JSON.stringify(languageData)
      });
    }
  },
  admin: {
    getDashboardMetrics: async () => {
      return await fetchAPI('/admin/dashboard/metrics');
    },
    getAssignmentQueue: async () => {
      return await fetchAPI('/admin/dashboard/assignment-queue');
    },
    getDashboardRevenue: async (timeframe = 'daily') => {
      return await fetchAPI(`/admin/dashboard/revenue?timeframe=${timeframe}`);
    },
    getDashboardFleet: async () => {
      return await fetchAPI('/admin/dashboard/fleet');
    },
    getActiveJobs: async () => {
      return await fetchAPI('/admin/dashboard/active-jobs');
    },
    listBookings: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return await fetchAPI(`/admin/bookings?${query}`);
    },
    getBooking: async (id) => {
      return await fetchAPI(`/admin/bookings/${id}`);
    },
    getPendingBookings: async () => {
      return await fetchAPI('/admin/pending-assignment');
    },
    scheduleBooking: async (bookingId, scheduledDate) => {
      return await fetchAPI(`/admin/schedule/${bookingId}`, {
        method: 'PUT',
        body: JSON.stringify({ scheduledDate })
      });
    },
    getAvailableOperators: async () => {
      return await fetchAPI('/admin/operators');
    },
    assignBooking: async (bookingId, operatorId) => {
      return await fetchAPI(`/admin/assign/${bookingId}`, {
        method: 'PUT',
        body: JSON.stringify({ operatorId })
      });
    },
    getPayments: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return await fetchAPI(`/admin/payments?${query}`);
    },
    settleBooking: async (bookingId, data = { method: 'cash' }) => {
      return await fetchAPI(`/admin/settle-booking/${bookingId}`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    listFarmers: async () => {
      return await fetchAPI('/admin/farmers');
    },
    createFarmer: async (farmerData) => {
      return await fetchAPI('/admin/farmers', {
        method: 'POST',
        body: JSON.stringify(farmerData)
      });
    },
    updateFarmerStatus: async (farmerId, status) => {
      return await fetchAPI(`/admin/farmers/${farmerId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
    },
    getOperators: async () => {
      return await fetchAPI('/admin/operator-list');
    },
    listOperators: async () => {
      return await fetchAPI('/admin/operator-list');
    },
    createOperator: async (operatorData) => {
      return await fetchAPI('/admin/operators', {
        method: 'POST',
        body: JSON.stringify(operatorData)
      });
    },
    deleteOperator: async (id) => {
      return await fetchAPI(`/admin/operators/${id}`, {
        method: 'DELETE'
      });
    },
    // Tractor Management
    getTractors: async () => {
      return await fetchAPI('/admin/tractors');
    },
    createTractor: async (tractorData) => {
      return await fetchAPI('/admin/tractors', {
        method: 'POST',
        body: JSON.stringify(tractorData)
      });
    },
    updateTractor: async (id, tractorData) => {
      return await fetchAPI(`/admin/tractors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(tractorData)
      });
    },
    reports: {
      getRevenue: async (rangeVal = '7d') => {
        return await fetchAPI(`/admin/reports/revenue?range=${rangeVal}`);
      },
      getServiceUsage: async (rangeVal = '7d') => {
        return await fetchAPI(`/admin/reports/service-usage?range=${rangeVal}`);
      },
      getFleet: async () => {
        return await fetchAPI('/admin/reports/fleet');
      },
      getFarmers: async (rangeVal = '7d') => {
        return await fetchAPI(`/admin/reports/farmers?range=${rangeVal}`);
      },
      getBookingsAnalytics: async (rangeVal = '7d') => {
        return await fetchAPI(`/admin/reports/bookings-analytics?range=${rangeVal}`);
      },
      getOperatorPerformance: async (rangeVal = '7d') => {
        return await fetchAPI(`/admin/reports/operator-performance?range=${rangeVal}`);
      },
      getJobStatusDistribution: async (rangeVal = '7d') => {
        return await fetchAPI(`/admin/reports/job-status?range=${rangeVal}`);
      },
      getTractorProfitability: async (rangeVal = '7d') => {
        return await fetchAPI(`/admin/reports/tractor-profitability?range=${rangeVal}`);
      },
      getExportData: async (rangeVal = '7d') => {
        return await fetchAPI(`/admin/reports/export?range=${rangeVal}`);
      }
    },
    // System Configuration
    getSystemConfig: async () => {
      return await fetchAPI('/admin/settings/config');
    },
    updateSystemConfig: async (config) => {
      return await fetchAPI('/admin/settings/config', {
        method: 'POST',
        body: JSON.stringify(config)
      });
    },
    getFuelHistory: async () => {
      return await fetchAPI('/admin/settings/fuel-history');
    },
    // Distance Zones
    listZones: async () => {
      return await fetchAPI('/admin/settings/zones');
    },
    createZone: async (zoneData) => {
      return await fetchAPI('/admin/settings/zones', {
        method: 'POST',
        body: JSON.stringify(zoneData)
      });
    },
    updateZone: async (id, zoneData) => {
      return await fetchAPI(`/admin/settings/zones/${id}`, {
        method: 'PUT',
        body: JSON.stringify(zoneData)
      });
    },
    deleteZone: async (id) => {
      return await fetchAPI(`/admin/settings/zones/${id}`, {
        method: 'DELETE'
      });
    },
    // System Settings - Services
    listServices: async () => {
      return await fetchAPI('/admin/services');
    },
    updateServiceRates: async (ratesData) => {
      return await fetchAPI('/admin/services', {
        method: 'PUT',
        body: JSON.stringify(ratesData)
      });
    },
    updateService: async (id, serviceData) => {
      return await fetchAPI(`/admin/services/${id}`, {
        method: 'PUT',
        body: JSON.stringify(serviceData)
      });
    }
  },
  operator: {
    getJobs: async () => {
      return await fetchAPI('/operator/jobs');
    },
    getStats: async () => {
      return await fetchAPI('/operator/stats');
    },
    updateStatus: async (id, status) => {
      return await fetchAPI(`/operator/job-status/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },
    addFuelLog: async (fuelData) => {
      return await fetchAPI('/operator/fuel', {
        method: 'POST',
        body: JSON.stringify(fuelData)
      });
    },
    getFuelHistory: async () => {
      return await fetchAPI('/operator/fuel');
    },
    getFuelSummary: async () => {
      return await fetchAPI('/operator/fuel/summary');
    },
    getProfile: async () => {
      return await fetchAPI('/operator/profile');
    },
    updateProfile: async (profileData) => {
      return await fetchAPI('/operator/profile', {
        method: 'PATCH',
        body: JSON.stringify(profileData)
      });
    },
    changePassword: async (passwordData) => {
      return await fetchAPI('/operator/change-password', {
        method: 'PATCH',
        body: JSON.stringify(passwordData)
      });
    },
    updateLanguage: async (languageData) => {
      return await fetchAPI('/operator/language', {
        method: 'PATCH',
        body: JSON.stringify(languageData)
      });
    }
  },
  payments: {
    getPending: async () => {
      return await fetchAPI('/payments/pending');
    },
    getHistory: async () => {
      return await fetchAPI('/payments/history');
    },
    payBooking: async (paymentData) => {
      return await fetchAPI('/payments/pay-booking', {
        method: 'POST',
        body: JSON.stringify(paymentData)
      });
    },
    settleAll: async () => {
      return await fetchAPI('/payments/settle-all', {
        method: 'POST'
      });
    }
  },
  requests: {
    create: async (payload) => {
      return await fetchAPI('/request/create', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    listAll: async () => {
      return await fetchAPI('/request/all', {
        method: 'GET',
      });
    },
    accept: async (id) => {
      return await fetchAPI(`/request/${id}/accept`, {
        method: 'PATCH',
      });
    }
  },
  notifications: {
    list: async () => {
      return await fetchAPI('/notifications');
    },
    markAsRead: async (id) => {
      return await fetchAPI(`/notifications/${id}/read`, {
        method: 'PATCH'
      });
    },
    markAllAsRead: async () => {
      return await fetchAPI('/notifications/read-all', {
        method: 'PATCH'
      });
    },
    delete: async (id) => {
      return await fetchAPI(`/notifications/${id}`, {
        method: 'DELETE'
      });
    },
    deleteAll: async () => {
      return await fetchAPI(`/notifications`, {
        method: 'DELETE'
      });
    }
  }
};
