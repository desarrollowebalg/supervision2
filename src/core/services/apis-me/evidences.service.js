import { apisMePost } from './client.js';

export async function saveTextEvidence(payload) {
  return apisMePost('evidences/save-text', payload);
}

export async function savePhotoEvidence(payload) {
  return apisMePost('evidences/save-photos', payload);
}

