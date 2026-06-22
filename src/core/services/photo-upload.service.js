import { savePhotoEvidence } from './apis-me/evidences.service.js';

class PhotoUploadService {
  static instancia = null;

  constructor() {
    if (PhotoUploadService.instancia) {
      return PhotoUploadService.instancia;
    }

    PhotoUploadService.instancia = this;
  }

  async uploadFieldAsset({
    formRef,
    savedAt,
    gps,
    fieldName,
    fieldType,
    file = null,
    dataUrl = ''
  }) {
    const photoItem = await this.buildPhotoItem({ fieldName, fieldType, file, dataUrl });
    const payload = {
      formRef: formRef && typeof formRef === 'object' ? formRef : {},
      savedAt: String(savedAt || new Date().toISOString()),
      gps: gps && typeof gps === 'object' ? gps : null,
      photos: [photoItem]
    };

    const response = await savePhotoEvidence(payload);
    const uploadEstado = this.extractUploadEstado(response);
    if (uploadEstado && uploadEstado !== 'ok') {
      throw new Error(`El servicio de fotos devolvio estado no valido: ${uploadEstado}`);
    }

    const s3Name = this.extractS3Name(response);
    if (!s3Name) {
      throw new Error('El servicio de fotos no devolvio nombre S3.');
    }

    return {
      s3Name,
      response
    };
  }

  async buildPhotoItem({ fieldName, fieldType, file, dataUrl }) {
    const safeFieldName = String(fieldName || '').trim();
    const safeFieldType = String(fieldType || '').trim();
    const normalizedDataUrl = file ? await this.fileToDataUrl(file) : String(dataUrl || '');
    const encodedContent = this.extractBase64FromDataUrl(normalizedDataUrl);
    if (!encodedContent) {
      throw new Error('No se pudo preparar el contenido de la imagen.');
    }

    return {
      fieldName: safeFieldName,
      fieldType: safeFieldType,
      fileName: this.resolveFileName({ file, fieldName: safeFieldName, fieldType: safeFieldType }),
      mimeType: this.resolveMimeType({ file, dataUrl: normalizedDataUrl }),
      contentBase64: encodedContent
    };
  }

  resolveFileName({ file, fieldName, fieldType }) {
    if (file?.name) {
      return String(file.name);
    }
    const cleanField = String(fieldName || 'field').replace(/[^\w.-]+/g, '_');
    const cleanType = String(fieldType || 'photo').replace(/[^\w.-]+/g, '_');
    return `${cleanType}_${cleanField}_${Date.now()}.png`;
  }

  resolveMimeType({ file, dataUrl }) {
    const fileType = String(file?.type || '').trim();
    if (fileType) {
      return fileType;
    }

    const source = String(dataUrl || '');
    const matches = source.match(/^data:([^;]+);base64,/i);
    return matches?.[1] ? String(matches[1]) : 'image/png';
  }

  extractBase64FromDataUrl(value) {
    const source = String(value || '');
    const match = source.match(/^data:[^;]+;base64,(.+)$/i);
    return match?.[1] ? String(match[1]) : '';
  }

  extractS3Name(response) {
    const candidates = [
      response?.data?.s3Name,
      response?.data?.key,
      response?.data?.Key,
      response?.data?.nombre,
      response?.data?.name,
      response?.data?.fileName,
      response?.data?.uploadApiResponse?.Key,
      response?.data?.uploadApiResponse?.key,
      response?.data?.uploadApiResponse?.body?.Key,
      response?.data?.uploadApiResponse?.body?.key,
      response?.data?.photos?.[0]?.s3Name,
      response?.data?.photos?.[0]?.name,
      response?.data?.photos?.[0]?.fileName,
      response?.data?.registros?.s3Name,
      response?.registros?.s3Name,
      response?.registros?.name,
      response?.registros?.fileName
    ];

    for (const candidate of candidates) {
      const normalized = String(candidate || '').trim();
      if (normalized) {
        return normalized;
      }
    }

    return '';
  }

  extractUploadEstado(response) {
    const candidates = [
      response?.data?.estado,
      response?.data?.Estado,
      response?.data?.uploadApiResponse?.estado,
      response?.data?.uploadApiResponse?.Estado,
      response?.data?.uploadApiResponse?.body?.estado,
      response?.data?.uploadApiResponse?.body?.Estado
    ];

    for (const candidate of candidates) {
      const normalized = String(candidate || '').trim().toLowerCase();
      if (normalized) {
        return normalized;
      }
    }

    return '';
  }

  async fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado.'));
      reader.readAsDataURL(file);
    });
  }
}

export const photoUploadService = new PhotoUploadService();
