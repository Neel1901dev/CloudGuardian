import axios from 'axios';

const API_BASE_URL = 'http://localhost:8001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Scan AWS resources
export const scanAWS = async (accountId, region = 'us-east-1') => {
  const response = await api.post('/api/scan/aws', {
    account_id: accountId,
    region: region,
  });
  return response.data;
};

// Get dashboard data with pagination
export const getDashboard = async (page = 1, severity = null, limit = 20) => {
  const params = { page, limit };
  if (severity) params.severity = severity;

  const response = await api.get('/api/dashboard', { params });
  return response.data;
};

// Get violations with pagination
export const getViolations = async (page = 1, limit = 20, severity = null, resourceType = null) => {
  const params = { page, limit };
  if (severity) params.severity = severity;
  if (resourceType) params.resource_type = resourceType;

  const response = await api.get('/api/violations', { params });
  return response.data;
};

// Get remediation details for a specific violation
export const getRemediationDetails = async (violationId) => {
  const response = await api.get(`/api/remediation/${violationId}`);
  return response.data;
};

// Download PDF report
export const downloadPDFReport = async (scanId = 'latest') => {
  const response = await api.get(`/api/report/pdf/${scanId}`, {
    responseType: 'blob',
  });

  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `compliance_report_${scanId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

// Get statistics
export const getStatistics = async () => {
  const response = await api.get('/api/stats');
  return response.data;
};

// Health check
export const healthCheck = async () => {
  const response = await api.get('/api/health');
  return response.data;
};

export default api;
