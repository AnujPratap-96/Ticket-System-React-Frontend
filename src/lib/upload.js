import api from '../api/client';

export const MAX_BYTES = 10 * 1024 * 1024;
export const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'txt', 'log', 'zip'];

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_EXT = ['jpg', 'jpeg', 'png', 'webp'];

export const extOf = (name) => (name.includes('.') ? name.split('.').pop().toLowerCase() : '');

export function validateFile(file) {
  if (!ALLOWED_EXT.includes(extOf(file.name))) return `".${extOf(file.name) || '?'}" files are not allowed`;
  if (file.size > MAX_BYTES) return 'File is larger than 10 MB';
  return null;
}

export function validateAvatar(file) {
  if (!AVATAR_EXT.includes(extOf(file.name))) return 'Please choose a JPG, PNG or WEBP image';
  if (file.size > AVATAR_MAX_BYTES) return 'The photo must be smaller than 2 MB';
  return null;
}

/** Browser -> Cloudinary POST with progress. Resolves with Cloudinary's JSON answer. */
function postToCloudinary(sig, file, onProgress) {
  const form = new FormData();
  Object.entries(sig.params).forEach(([k, v]) => form.append(k, v));
  form.append('api_key', sig.api_key);
  form.append('signature', sig.signature);
  form.append('file', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', sig.upload_url);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let body = {};
      try { body = JSON.parse(xhr.responseText); } catch { /* non-JSON error page */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve(body);
      else reject(new Error(body.error?.message || 'Upload failed'));
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(form);
  });
}

/**
 * Direct browser -> Cloudinary upload using a signature from our API.
 * The file never touches our server. Resolves with the attachment reference to send on submit.
 */
export async function uploadFile(file, ticketId, onProgress) {
  const { data: sig } = await api.post('/attachments/sign', ticketId ? { ticket_id: ticketId } : {});
  const res = await postToCloudinary(sig, file, onProgress);

  return { public_id: res.public_id, resource_type: res.resource_type, name: file.name };
}

/**
 * Profile photo: sign -> upload to Cloudinary -> tell the API, which verifies the file before using it.
 * Resolves with the updated user.
 */
export async function uploadAvatar(file, onProgress) {
  const { data: sig } = await api.post('/auth/avatar/sign');
  await postToCloudinary(sig, file, onProgress);
  const { data } = await api.post('/auth/avatar', { public_id: sig.public_id });

  return data.user;
}
