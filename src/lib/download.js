import api from '../api/client';

/** Authenticated file download (the bearer token can't be sent by a plain <a href>). */
export async function downloadFile(url, filename, params) {
  const res = await api.get(url, { params, responseType: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(res.data);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
