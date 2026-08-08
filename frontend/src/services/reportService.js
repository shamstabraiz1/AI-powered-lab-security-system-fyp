import api from './api';

/**
 * Downloads a binary PDF response directly through the browser.
 */
const downloadPdfBlob = async (endpoint, params, defaultFilename) => {
  console.log(`[REPORT SERVICE] Requesting PDF from ${endpoint}...`, params);
  const response = await api.get(endpoint, {
    params,
    responseType: 'blob',
  });

  // Extract filename from Content-Disposition header if present
  let filename = defaultFilename;
  const disposition = response.headers['content-disposition'];
  if (disposition && disposition.indexOf('filename=') !== -1) {
    const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
    if (matches != null && matches[1]) {
      filename = matches[1].replace(/['"]/g, '');
    }
  }

  // Create and trigger browser Blob download
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);

  console.log(`[REPORT SERVICE] Successfully downloaded PDF: ${filename}`);
  return true;
};

export const reportService = {
  downloadIncidentReport: (params) =>
    downloadPdfBlob('/reports/incident-report/', params, 'Incident_Audit_Report.pdf'),

  downloadAssetMissingReport: (params) =>
    downloadPdfBlob('/reports/asset-missing-report/', params, 'Asset_Missing_Report.pdf'),

  downloadLabSecurityReport: (params) =>
    downloadPdfBlob('/reports/lab-security-report/', params, 'Laboratory_Security_Report.pdf'),

  downloadEvidenceReport: (params) =>
    downloadPdfBlob('/reports/evidence-report/', params, 'Forensic_Evidence_Report.pdf'),

  downloadLabSessionReport: (params) =>
    downloadPdfBlob('/reports/lab-session-report/', params, 'Lab_Session_Report.pdf'),
};
