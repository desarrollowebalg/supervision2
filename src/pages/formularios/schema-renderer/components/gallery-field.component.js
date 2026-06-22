import { boolAttr, escapeHtml, renderFieldWrapper, toFieldProps } from '../field-render-context.js';
import { photoUploadService } from '../../../../core/services/photo-upload.service.js';

export function renderGalleryField(field, contextOptions) {
  const { name, disabled, required } = toFieldProps(field, contextOptions);
  const fieldId = escapeHtml(name);

  const html = `
    <div class="uk-card uk-card-default uk-card-small uk-border-rounded">
      <div class="uk-card-body uk-padding-small">
        <input
          class="uk-hidden"
          type="file"
          accept="image/*"
          data-gallery-picker="${fieldId}"
          ${boolAttr(disabled, 'disabled')}
          ${boolAttr(required, 'required')}
        >
        <div class="uk-margin-small-top" data-gallery-preview-wrap="${fieldId}" hidden>
          <img class="uk-border-rounded schema-media-preview" data-gallery-preview="${fieldId}" alt="Vista previa de galeria">
        </div>
        <div class="uk-margin-small-top">
          <button
            type="button"
            class="uk-button uk-button-default uk-border-rounded uk-width-1-1 uk-flex uk-flex-column uk-flex-center uk-flex-middle uk-padding-small schema-media-trigger"
            data-gallery-retake="${fieldId}"
            ${boolAttr(disabled, 'disabled')}
          >
            <span uk-icon="icon: image"></span>
            <span class="uk-text-small uk-margin-small-top">Seleccionar imagen</span>
          </button>
          <button type="button" class="uk-button uk-button-text uk-text-danger uk-text-small uk-margin-small-top" data-gallery-retry="${fieldId}" hidden>
            Reintentar envio
          </button>
        </div>
        <p class="uk-text-meta uk-margin-small-top uk-margin-remove-bottom" data-gallery-status="${fieldId}">Sin archivo</p>
        <input type="hidden" name="${fieldId}" data-gallery-input="${fieldId}">
      </div>
    </div>
  `;

  return renderFieldWrapper(field, html, contextOptions);
}

export function initGalleryFieldBehavior(rootNode, options = {}) {
  const getUploadContext = typeof options?.getUploadContext === 'function' ? options.getUploadContext : () => ({});
  const pickers = rootNode.querySelectorAll('input[data-gallery-picker]');
  pickers.forEach((picker) => {
    const key = String(picker.getAttribute('data-gallery-picker') || '');
    if (!key || picker.dataset.galleryBound === '1') {
      return;
    }

    const preview = rootNode.querySelector(`img[data-gallery-preview="${CSS.escape(key)}"]`);
    const previewWrap = rootNode.querySelector(`[data-gallery-preview-wrap="${CSS.escape(key)}"]`);
    const hiddenInput = rootNode.querySelector(`input[data-gallery-input="${CSS.escape(key)}"]`);
    const statusLabel = rootNode.querySelector(`[data-gallery-status="${CSS.escape(key)}"]`);
    const retakeButton = rootNode.querySelector(`button[data-gallery-retake="${CSS.escape(key)}"]`);
    const retryButton = rootNode.querySelector(`button[data-gallery-retry="${CSS.escape(key)}"]`);
    if (!preview || !previewWrap || !hiddenInput || !statusLabel || !retakeButton || !retryButton) {
      return;
    }
    let lastFile = null;

    const setFieldState = (state, message = '') => {
      const map = {
        idle: { text: message || 'Sin archivo', cls: 'uk-text-meta' },
        uploading: { text: message || 'Enviando archivo...', cls: 'uk-text-primary' },
        uploaded: { text: message || 'Archivo enviado', cls: 'uk-text-success' },
        error: { text: message || 'No se pudo subir el archivo', cls: 'uk-text-danger' }
      };
      const next = map[state] || map.idle;
      statusLabel.className = `uk-text-small uk-margin-small-top uk-margin-remove-bottom ${next.cls}`;
      statusLabel.textContent = next.text;
      retryButton.hidden = state !== 'error';
    };

    const notifyChange = () => {
      hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const restorePreview = () => {
      if (!hiddenInput.value) {
        preview.src = '';
        previewWrap.hidden = true;
        setFieldState('idle', 'Sin archivo');
        return;
      }
      const currentPreview = picker.dataset.galleryPreviewDataUrl || '';
      if (currentPreview) {
        preview.src = currentPreview;
        previewWrap.hidden = false;
      } else {
        preview.src = '';
        previewWrap.hidden = true;
      }
      setFieldState('uploaded', 'Referencia S3 lista');
    };

    const uploadSelectedFile = async (file) => {
      if (!file) {
        preview.src = '';
        hiddenInput.value = '';
        previewWrap.hidden = true;
        picker.dataset.galleryPreviewDataUrl = '';
        setFieldState('idle', 'Sin archivo');
        notifyChange();
        return;
      }
      lastFile = file;
      setFieldState('uploading', 'Enviando archivo...');

      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || '');
        preview.src = result;
        picker.dataset.galleryPreviewDataUrl = result;
        previewWrap.hidden = false;
      };
      reader.readAsDataURL(file);

      try {
        const uploadContext = getUploadContext();
        const result = await photoUploadService.uploadFieldAsset({
          formRef: uploadContext.formRef,
          savedAt: uploadContext.savedAt,
          gps: uploadContext.gps,
          fieldName: key,
          fieldType: 'gallery',
          file
        });
        hiddenInput.value = String(result?.s3Name || '');
        setFieldState('uploaded', 'Imagen enviada');
        notifyChange();
      } catch (error) {
        hiddenInput.value = '';
        setFieldState('error', String(error?.message || 'No se pudo subir la imagen.'));
        notifyChange();
      }
    };

    picker.addEventListener('change', async () => {
      const file = picker.files?.[0];
      await uploadSelectedFile(file);
    });

    retakeButton.addEventListener('click', () => {
      picker.click();
    });

    retryButton.addEventListener('click', async () => {
      if (!lastFile) {
        setFieldState('error', 'Selecciona nuevamente la imagen para reintentar.');
        return;
      }
      await uploadSelectedFile(lastFile);
    });

    restorePreview();
    picker.dataset.galleryBound = '1';
  });
}
