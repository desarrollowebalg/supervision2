import { boolAttr, escapeHtml, renderFieldWrapper, toFieldProps } from '../field-render-context.js';
import { photoUploadService } from '../../../../core/services/photo-upload.service.js';

export function renderSignatureField(field, contextOptions) {
  const { name, disabled, required } = toFieldProps(field, contextOptions);
  const fieldId = escapeHtml(name);

  const html = `
    <div class="uk-card uk-card-default uk-card-small uk-border-rounded">
      <div class="uk-card-body uk-padding-small">
        <canvas
          class="uk-width-1-1 signature-canvas schema-signature-canvas"
          data-signature-canvas="${fieldId}"
          width="640"
          height="220"
        ></canvas>
        <div class="uk-flex uk-flex-between uk-flex-middle uk-margin-small-top">
          <small class="uk-text-meta">Dibuja tu firma dentro del recuadro</small>
          <div class="uk-flex uk-flex-middle uk-grid-small" uk-grid>
            <div>
              <button type="button" class="uk-button uk-button-secondary uk-button-small uk-border-rounded"${boolAttr(disabled, 'disabled')} data-signature-clear="${fieldId}">
                Limpiar
              </button>
            </div>
            <div>
              <button type="button" class="uk-button uk-button-text uk-text-danger uk-text-small" data-signature-retry="${fieldId}" hidden>
                Reintentar envio
              </button>
            </div>
          </div>
        </div>
        <p class="uk-text-meta uk-margin-small-top uk-margin-remove-bottom" data-signature-status="${fieldId}">Sin firma</p>
        <input type="hidden" name="${fieldId}"${boolAttr(required, 'required')} data-signature-input="${fieldId}">
      </div>
    </div>
  `;

  return renderFieldWrapper(field, html, contextOptions);
}

export function initSignatureFieldBehavior(rootNode, options = {}) {
  const getUploadContext = typeof options?.getUploadContext === 'function' ? options.getUploadContext : () => ({});
  const debounceMs = Number.isFinite(options?.debounceMs) ? Number(options.debounceMs) : 700;
  const canvases = rootNode.querySelectorAll('canvas[data-signature-canvas]');
  canvases.forEach((canvas) => {
    const key = String(canvas.getAttribute('data-signature-canvas') || '');
    if (!key || canvas.dataset.signatureBound === '1') {
      return;
    }

    const hiddenInput = rootNode.querySelector(`input[data-signature-input="${CSS.escape(key)}"]`);
    const clearButton = rootNode.querySelector(`button[data-signature-clear="${CSS.escape(key)}"]`);
    const retryButton = rootNode.querySelector(`button[data-signature-retry="${CSS.escape(key)}"]`);
    const statusLabel = rootNode.querySelector(`[data-signature-status="${CSS.escape(key)}"]`);

    if (!hiddenInput || !statusLabel || !retryButton) {
      return;
    }
    let lastSignatureDataUrl = '';
    let uploadDebounceTimer = null;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1f2933';

    let drawing = false;

    const setFieldState = (state, message = '') => {
      const map = {
        idle: { text: message || 'Sin firma', cls: 'uk-text-meta' },
        uploading: { text: message || 'Enviando firma...', cls: 'uk-text-primary' },
        uploaded: { text: message || 'Firma enviada', cls: 'uk-text-success' },
        error: { text: message || 'No se pudo subir la firma', cls: 'uk-text-danger' }
      };
      const next = map[state] || map.idle;
      statusLabel.className = `uk-text-small uk-margin-small-top uk-margin-remove-bottom ${next.cls}`;
      statusLabel.textContent = next.text;
      retryButton.hidden = state !== 'error';
    };

    const notifyChange = () => {
      hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const clearUploadDebounce = () => {
      if (uploadDebounceTimer) {
        clearTimeout(uploadDebounceTimer);
        uploadDebounceTimer = null;
      }
    };

    const uploadSignature = async (signatureDataUrl) => {
      if (!signatureDataUrl) {
        hiddenInput.value = '';
        setFieldState('idle', 'Sin firma');
        notifyChange();
        return;
      }
      lastSignatureDataUrl = signatureDataUrl;
      setFieldState('uploading', 'Enviando firma...');
      try {
        const uploadContext = getUploadContext();
        const result = await photoUploadService.uploadFieldAsset({
          formRef: uploadContext.formRef,
          savedAt: uploadContext.savedAt,
          gps: uploadContext.gps,
          fieldName: key,
          fieldType: 'signature',
          dataUrl: signatureDataUrl
        });
        hiddenInput.value = String(result?.s3Name || '');
        setFieldState('uploaded', 'Firma enviada');
      } catch (error) {
        hiddenInput.value = '';
        setFieldState('error', String(error?.message || 'No se pudo subir la firma.'));
      }
      notifyChange();
    };

    const clearValue = () => {
      clearUploadDebounce();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hiddenInput.value = '';
      lastSignatureDataUrl = '';
      setFieldState('idle', 'Sin firma');
      notifyChange();
    };

    const restoreSignature = () => {
      if (!hiddenInput.value) {
        setFieldState('idle', 'Sin firma');
        return;
      }
      if (!canvas.dataset.signaturePreviewDataUrl) {
        setFieldState('uploaded', 'Referencia S3 lista');
        return;
      }
      const image = new Image();
      image.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      };
      image.src = canvas.dataset.signaturePreviewDataUrl;
      setFieldState('uploaded', 'Referencia S3 lista');
    };

    const getPos = (event) => {
      const rect = canvas.getBoundingClientRect();
      const source = event.touches?.[0] ?? event;
      return {
        x: source.clientX - rect.left,
        y: source.clientY - rect.top
      };
    };

    const startDraw = (event) => {
      if (hiddenInput.disabled) return;
      event.preventDefault();
      clearUploadDebounce();
      drawing = true;
      const pos = getPos(event);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const draw = (event) => {
      if (!drawing || hiddenInput.disabled) return;
      event.preventDefault();
      const pos = getPos(event);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };

    const scheduleUpload = (signatureDataUrl) => {
      clearUploadDebounce();
      uploadDebounceTimer = window.setTimeout(async () => {
        uploadDebounceTimer = null;
        await uploadSignature(signatureDataUrl);
      }, debounceMs);
    };

    const endDraw = () => {
      if (!drawing) return;
      drawing = false;
      const signatureDataUrl = canvas.toDataURL('image/png');
      canvas.dataset.signaturePreviewDataUrl = signatureDataUrl;
      scheduleUpload(signatureDataUrl);
    };

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', endDraw);
    canvas.addEventListener('mouseleave', endDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', endDraw);

    if (clearButton) {
      clearButton.addEventListener('click', clearValue);
    }
    retryButton.addEventListener('click', async () => {
      if (!lastSignatureDataUrl) {
        setFieldState('error', 'Firma nuevamente para reintentar.');
        return;
      }
      await uploadSignature(lastSignatureDataUrl);
    });

    restoreSignature();
    canvas.dataset.signatureBound = '1';
  });
}
