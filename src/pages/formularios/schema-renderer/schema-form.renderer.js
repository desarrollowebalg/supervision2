import { renderAutocompleteField } from './components/autocomplete-field.component.js';
import { renderDateField } from './components/date-field.component.js';
import { initGeoSelectFieldBehavior, renderGeoSelectField } from './components/geo-select-field.component.js';
import { initGalleryFieldBehavior, renderGalleryField } from './components/gallery-field.component.js';
import { renderMultiSelectField } from './components/multi-select-field.component.js';
import { renderNumberField } from './components/number-field.component.js';
import { initPhotoFieldBehavior, renderPhotoField } from './components/photo-field.component.js';
import { renderRadioField } from './components/radio-field.component.js';
import { renderSelectField } from './components/select-field.component.js';
import { renderSeparatorField } from './components/separator-field.component.js';
import { initSignatureFieldBehavior, renderSignatureField } from './components/signature-field.component.js';
import { renderIndexMarkerField } from './components/index-marker-field.component.js';
import { renderTableEndMarkerField } from './components/table-end-marker-field.component.js';
import { escapeHtml } from './field-render-context.js';
import { renderTextField } from './components/text-field.component.js';
import { renderTextareaField } from './components/textarea-field.component.js';
import { renderTimeField } from './components/time-field.component.js';
import { saveTextEvidence } from '../../../core/services/apis-me/evidences.service.js';
import { saveEvidenceRecord, savePendingToSendRecord } from '../../../core/services/evidence-indexeddb.service.js';
import { getPayloadsByFormQuestionId } from '../../../core/services/apis-me/payloads.service.js';

const fieldComponentRegistry = {
  text: renderTextField,
  date: renderDateField,
  time: renderTimeField,
  number: renderNumberField,
  select: renderSelectField,
  'multi-select': renderMultiSelectField,
  radio: renderRadioField,
  separator: renderSeparatorField,
  textarea: renderTextareaField,
  autocomplete: renderAutocompleteField,
  'geo-select': renderGeoSelectField,
  signature: renderSignatureField,
  gallery: renderGalleryField,
  photo: renderPhotoField,
  'index-marker': renderIndexMarkerField,
  'table-end-marker': renderTableEndMarkerField
};
function getFields(schema) {
  return Array.isArray(schema?.form?.fields) ? schema.form.fields : [];
}

function buildUploadContextGetter({ formRef, gpsSnapshot }) {
  return () => ({
    formRef: formRef && typeof formRef === 'object' ? formRef : {},
    gps: gpsSnapshot && typeof gpsSnapshot === 'object' ? gpsSnapshot : null,
    savedAt: new Date().toISOString()
  });
}

function ensureSchemaFormStyles() {
  if (document.getElementById('schema-renderer-input-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'schema-renderer-input-styles';
  style.textContent = `
    

    .schema-question-label {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .schema-question-number {
      color: #1e87f0;
      line-height: 1.35;
      min-width: 1.4rem;
      font-weight: 600;
    }

    .schema-question-text {
      line-height: 1.3;
      color: #555;
      font-weight: 500;
    }

    .schema-question-required {
      line-height: 1;
    }

    .schema-question-optional {
      color: #32a852;
      font-style: italic;
    }

    .form-powered-by {
      line-height: 1.1;
    }

    .form-powered-by-brand {
      font-weight: 400;
    }

    .mixed-section-list-item {
      border: 1px solid #d8e6f5;
      border-radius: 8px;
      padding: 1rem 1.25rem;
      background: #f8fbff;
    }

    .mixed-section-item-actions {
      display: flex;
      gap: 0.5rem;
    }

    .schema-table-section .uk-card-title {
      font-weight: 600;
    }

    .schema-table-section .mixed-section-helper {
      color: #4a6484;
    }

    .schema-media-preview {
      max-height: 220px;
      width: auto;
    }

    .schema-media-trigger {
      background-color: var(--uk-muted-background, #f8f8f8);
      border-color: var(--uk-border-color, #e5e5e5);
      min-height: 85px;
      width: 150px;
    }

    .schema-signature-canvas {
      touch-action: none;
      border: 1px dashed var(--uk-primary, #1e87f0);
      background-color: var(--uk-card-default-background, #fff);
      border-radius: 8px;
    }

    .schema-table-section input,
    .schema-table-section select,
    .schema-table-section textarea,
    .schema-table-section button,
    .schema-table-section .uk-modal-dialog,
    .schema-table-section .mixed-section-list-item {
      border-radius: 8px;
    }

  `;

  document.head.appendChild(style);
}

export async function renderSchemaForm(schema, mountNode, options = {}) {
  ensureSchemaFormStyles();

  const fields = getFields(schema);
  const persistence = options?.persistence || {};
  const storageKey = String(persistence?.storageKey || '').trim();
  const formRef = persistence?.formRef || {};
  const gpsSnapshot = persistence?.gpsSnapshot && typeof persistence.gpsSnapshot === 'object'
    ? persistence.gpsSnapshot
    : null;
  const onAutosave = typeof options?.onAutosave === 'function' ? options.onAutosave : () => {};
  const renderOptions = {
    readOnlyMode: options.readOnlyMode !== false,
    respectFieldDisabled: options.respectFieldDisabled !== false
  };
  const formQuestionId = String(formRef?.clv || '').trim();
  renderOptions.geoSelectPayloadOptions = await getPayloadsByFormQuestionId(formQuestionId);
  const showSubmitButton = options.showSubmitButton !== false;
  const onSubmitResult = typeof options?.onSubmitResult === 'function' ? options.onSubmitResult : () => {};
  const onSubmitFinished = typeof options?.onSubmitFinished === 'function' ? options.onSubmitFinished : () => {};
  const persistedRecord = storageKey ? getStoredRecord(storageKey) : null;
  const persistedAnswers = persistedRecord?.answers && typeof persistedRecord.answers === 'object'
    ? persistedRecord.answers
    : {};

  const html = renderFieldsHtml(fields, schema, renderOptions);

  mountNode.innerHTML = `
    <form class="uk-form-stacked">
      ${html}
      ${showSubmitButton ? `
        <div class="uk-margin-medium-top uk-text-right">
          <button type="submit" class="uk-button uk-button-primary uk-border-rounded">
            <span uk-icon="icon: forward" class="uk-margin-small-right"></span>Enviar
          </button>
        </div>
      ` : ''}
    </form>
  `;

  hydrateFormWithAnswers(mountNode, fields, persistedAnswers);
  initializeMixedSections(mountNode, fields, persistedAnswers);
  const getUploadContext = buildUploadContextGetter({ formRef, gpsSnapshot });
  initSignatureFieldBehavior(mountNode, { getUploadContext });
  initGalleryFieldBehavior(mountNode, { getUploadContext });
  initPhotoFieldBehavior(mountNode, { getUploadContext });
  initGeoSelectFieldBehavior(mountNode);

  const formNode = mountNode.querySelector('form');
  if (formNode && storageKey) {
    const persistCurrent = () => {
      const answers = collectAnswersByField(formNode, fields, schema);
      const savedAt = new Date().toISOString();
      const nextRecord = {
        ...(persistedRecord || {}),
        formRef,
        schema,
        gpsSnapshot: gpsSnapshot || persistedRecord?.gpsSnapshot || null,
        answers,
        lastSavedAt: savedAt,
        updatedAt: savedAt
      };
      setStoredRecord(storageKey, nextRecord);
      onAutosave(savedAt);
      return { answers, savedAt };
    };

    formNode.addEventListener('focusout', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
        return;
      }

      if (!target.name) {
        return;
      }

      persistCurrent();
    });

    formNode.addEventListener('change', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
        return;
      }

      if (!target.name) {
        return;
      }

      persistCurrent();
    });

    formNode.addEventListener('submit', async (event) => {
      event.preventDefault();
      const { answers, savedAt } = persistCurrent();
      const payloadTexto = {
        formRef,
        savedAt,
        gps: gpsSnapshot || persistedRecord?.gpsSnapshot || null,
        answers: {}
      };
      const gps = gpsSnapshot || persistedRecord?.gpsSnapshot || null;
      const submitOverlay = createSubmitOverlay(mountNode);
      submitOverlay.show();

      fields.forEach((field) => {
        const name = String(field?.name || '');
        if (!name) return;
        const value = answers[name];
        payloadTexto.answers[name] = value ?? '';
      });

      console.log('payloadTexto', payloadTexto);

      try {
        const textResponse = await saveTextEvidence(payloadTexto);
        const idrc = String(textResponse?.data?.IDRC || '');
        const wasSent = Boolean(textResponse?.success) && idrc !== '';
        const evidenciaRecord = buildEvidenceRecord({
          formRef,
          savedAt,
          gps,
          answers: payloadTexto.answers,
          idrc,
          wasSent
        });

        if (wasSent) {
          await saveEvidenceRecord(evidenciaRecord);
        } else {
          await saveEvidenceRecord(evidenciaRecord);
          await savePendingToSendRecord(evidenciaRecord);
        }

        const resultPayload = {
          ok: wasSent,
          textMessage: String(textResponse?.message || 'Evidencia de texto recibida'),
          photosMessage: '',
          idrc,
          status: textResponse?.status,
          error: wasSent ? '' : String(textResponse?.message || 'No fue posible enviar la evidencia.')
        };
        onSubmitResult(resultPayload);
        await onSubmitFinished(resultPayload);
      } catch (error) {
        const pendingRecord = buildEvidenceRecord({
          formRef,
          savedAt,
          gps,
          answers: payloadTexto.answers,
          idrc: '',
          wasSent: false
        });
        await saveEvidenceRecord(pendingRecord);
        await savePendingToSendRecord(pendingRecord);

        const resultPayload = {
          ok: false,
          textMessage: '',
          photosMessage: '',
          error: error?.message || 'No fue posible enviar la evidencia.'
        };
        onSubmitResult(resultPayload);
        await onSubmitFinished(resultPayload);
      } finally {
        submitOverlay.hide();
      }
    });
  }

  const unsupported = Array.isArray(schema?.unsupported) ? schema.unsupported : [];
  if (unsupported.length) {
    console.warn('form-engine unsupported fields', unsupported);
  }
}

export { fieldComponentRegistry };

function getStoredRecord(key) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || 'null');
  } catch (error) {
    console.warn('No se pudo leer estado persistido del formulario', error);
    return null;
  }
}

function setStoredRecord(key, record) {
  window.localStorage.setItem(key, JSON.stringify(record));
}

function hydrateFormWithAnswers(mountNode, fields, answers) {
  fields.forEach((field) => {
    const name = String(field?.name || '');
    if (!name || !(name in answers)) {
      return;
    }

    if (field?.type === 'index-marker' || field?.type === 'table-end-marker') {
      return;
    }

    const value = answers[name];
    if (field?.type === 'radio') {
      const radios = mountNode.querySelectorAll(`input[type="radio"][name="${CSS.escape(name)}"]`);
      radios.forEach((radio) => {
        radio.checked = String(radio.value) === String(value ?? '');
      });
      return;
    }

    const inputs = mountNode.querySelectorAll(`[name="${CSS.escape(name)}"]`);
    if (!inputs.length) {
      return;
    }

    inputs.forEach((inputNode) => {
      if (inputNode instanceof HTMLSelectElement && inputNode.multiple) {
        const list = Array.isArray(value) ? value.map((item) => String(item)) : [];
        Array.from(inputNode.options).forEach((option) => {
          option.selected = list.includes(option.value);
        });
        return;
      }

      inputNode.value = Array.isArray(value) ? value.join(',') : String(value ?? '');
    });
  });
}

function collectAnswersByField(formNode, fields, schema = null) {
  const answers = {};
  const sectionFieldNames = getSectionChildFieldNames(fields, schema);

  fields.forEach((field) => {
    const name = String(field?.name || '');
    if (!name) {
      return;
    }
    if (sectionFieldNames.has(name)) {
      return;
    }

    if (field?.type === 'radio') {
      const checked = formNode.querySelector(`input[type="radio"][name="${CSS.escape(name)}"]:checked`);
      answers[name] = checked ? checked.value : '';
      return;
    }

    const inputNode = formNode.querySelector(`[name="${CSS.escape(name)}"]`);
    if (!inputNode) {
      answers[name] = '';
      return;
    }

    if (inputNode instanceof HTMLSelectElement && inputNode.multiple) {
      answers[name] = Array.from(inputNode.selectedOptions).map((option) => option.value);
      return;
    }

    answers[name] = inputNode.value;
  });

  return answers;
}

function renderFieldsHtml(fields, schema, renderOptions) {
  const renderMode = String(schema?.form?.renderMode || '');
  if (renderMode === 'table-sections') {
    return renderTableSections(fields, renderOptions);
  }

  return renderFlatFields(fields, renderOptions, 1).html;
}

function renderFlatFields(fields, renderOptions, startQuestionNumber = 1) {
  let questionNumber = startQuestionNumber;
  const html = fields
    .map((field) => {
      const renderer = fieldComponentRegistry[field?.type];
      if (!renderer) {
        return '';
      }

      const withContext = { ...renderOptions };
      if (shouldShowQuestionNumber(field)) {
        withContext.questionNumber = questionNumber;
        questionNumber += 1;
      }
      return renderer(field, withContext);
    })
    .join('');

  return {
    html,
    nextQuestionNumber: questionNumber
  };
}

function renderTableSections(fields, renderOptions) {
  let activeSectionTitle = '';
  let activeSectionFields = [];
  let questionNumber = 1;
  const chunks = [];

  const flushSection = () => {
    if (!activeSectionFields.length) {
      activeSectionTitle = '';
      return;
    }
    const markerField = activeSectionFields.find((field) => field?.type === 'index-marker');
    const markerName = String(markerField?.name || '');
    const sectionFields = activeSectionFields.slice();

    if (!markerName || !sectionFields.length) {
      activeSectionTitle = '';
      activeSectionFields = [];
      return;
    }

    const sectionBody = renderMixedSectionShell({
      sectionTitle: activeSectionTitle,
      sectionKey: markerName,
      sectionFields,
      renderOptions,
      startQuestionNumber: questionNumber
    });
    questionNumber += sectionFields.filter((field) => shouldShowQuestionNumber(field)).length;
    chunks.push(`
      ${sectionBody}
    `);
    activeSectionTitle = '';
    activeSectionFields = [];
  };

  fields.forEach((field) => {
    const type = String(field?.type || '');
    if (type === 'index-marker') {
      flushSection();
      activeSectionTitle = String(field?.label || '');
      activeSectionFields = [field];
      return;
    }
    if (type === 'table-end-marker') {
      if (activeSectionTitle) {
        activeSectionFields.push(field);
      }
      flushSection();
      return;
    }
    if (activeSectionTitle) {
      activeSectionFields.push(field);
      return;
    }

    const renderer = fieldComponentRegistry[type];
    if (!renderer) {
      return;
    }
    const withContext = { ...renderOptions };
    if (shouldShowQuestionNumber(field)) {
      withContext.questionNumber = questionNumber;
      questionNumber += 1;
    }
    chunks.push(renderer(field, withContext));
  });

  flushSection();
  return chunks.join('');
}

function shouldShowQuestionNumber(field) {
  return !['separator', 'table-end-marker'].includes(String(field?.type || ''));
}

function renderMixedSectionShell({ sectionTitle, sectionKey, sectionFields, renderOptions, startQuestionNumber }) {
  const visibleSectionFields = sectionFields.filter((field) => String(field?.type || '') !== 'table-end-marker');
  const renderedModalFields = renderFlatFields(visibleSectionFields, renderOptions, startQuestionNumber).html;
  const escapedConfig = escapeHtml(JSON.stringify(sectionFields));
  const escapedTitle = escapeHtml('Registros');

  return `
    <section class="uk-card uk-card-default uk-card-body uk-border-rounded uk-margin-medium-bottom schema-table-section"
      data-mixed-section="1"
      data-section-key="${escapeHtml(sectionKey)}"
      data-section-title="${escapedTitle}"
      data-section-fields="${escapedConfig}">
      <nav class="uk-flex uk-flex-between uk-flex-middle uk-margin-small-bottom">
        <h4 class="uk-card-title uk-margin-remove">${escapedTitle}</h4>
        <button type="button" class="uk-button uk-button-secondary uk-button-small uk-border-rounded" data-mixed-action="new">Nueva captura</button>
      </nav>
      <p class="uk-margin-small-top uk-margin-medium-bottom mixed-section-helper">Para agregar un registro, da clic en el botón <strong>Nueva captura</strong>.</p>
      <input type="hidden" name="${escapeHtml(sectionKey)}" value="[]">
      <ul class="uk-list uk-list-divider uk-margin-remove" data-mixed-list></ul>
      <div id="mixed-modal-${escapeHtml(sectionKey)}" class="uk-modal" uk-modal>
        <div class="uk-modal-dialog uk-modal-body uk-border-rounded">
          <h4 class="uk-modal-title">${escapedTitle}</h4>
          <div class="uk-form-stacked" data-mixed-modal-form>
            ${renderedModalFields}
            <div class="uk-flex uk-flex-right uk-margin-top">
              <button type="button" class="uk-button uk-button-default uk-border-rounded uk-margin-small-right" data-mixed-action="cancel">Cancelar</button>
              <button type="button" class="uk-button uk-button-secondary uk-border-rounded" data-mixed-action="save-row">Agregar al formulario</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function initializeMixedSections(mountNode, fields, persistedAnswers) {
  const sections = mountNode.querySelectorAll('[data-mixed-section="1"]');
  console.debug('[mixed-section] detected sections:', sections.length);
  if (!sections.length) {
    return;
  }

  sections.forEach((sectionNode) => {
    const sectionKey = String(sectionNode.getAttribute('data-section-key') || '');
    const rawFields = sectionNode.getAttribute('data-section-fields') || '[]';
    const sectionFields = parseJsonSafe(rawFields, []);
    const hiddenInput = sectionNode.querySelector(`input[type="hidden"][name="${CSS.escape(sectionKey)}"]`);
    const listNode = sectionNode.querySelector('[data-mixed-list]');
    const modalNode = sectionNode.querySelector('[uk-modal]');
    const modalForm = sectionNode.querySelector('[data-mixed-modal-form]');
    const saveRowButton = sectionNode.querySelector('[data-mixed-action="save-row"]');
    const newButton = sectionNode.querySelector('[data-mixed-action="new"]');
    const cancelButton = sectionNode.querySelector('[data-mixed-action="cancel"]');
    console.debug('[mixed-section] binding section:', {
      sectionKey,
      sectionTitle: sectionNode.getAttribute('data-section-title') || '',
      sectionFieldsCount: Array.isArray(sectionFields) ? sectionFields.length : 0
    });
    if (!sectionKey || !hiddenInput || !listNode || !modalNode || !modalForm || !newButton || !cancelButton || !saveRowButton) {
      console.debug('[mixed-section] missing required nodes for section:', sectionKey);
      return;
    }

    let editingIndex = -1;
    const persistedValue = persistedAnswers?.[sectionKey];
    const initialRows = parseSectionRows(persistedValue);
    let rows = Array.isArray(initialRows) ? initialRows : [];
    hiddenInput.value = JSON.stringify(rows);

    const refreshList = () => {
      if (!rows.length) {
        listNode.innerHTML = '<li class="uk-text-muted">Sin capturas aún.</li>';
        return;
      }
      listNode.innerHTML = rows
        .map((row, index) => {
          const display = formatMixedRowDisplay(sectionFields, row, index);
          return `
          <li class="mixed-section-list-item uk-border-rounded">
            <div class="uk-flex uk-flex-between uk-flex-top">
              <div>
                <strong class="uk-display-block uk-text-lead">${escapeHtml(display.title)}</strong>
                ${display.details.map((detail) => `<div class="uk-text-meta uk-margin-small-top"><strong>${escapeHtml(detail.label)}:</strong> ${escapeHtml(detail.value)}</div>`).join('')}
              </div>
              <div class="mixed-section-item-actions">
                <button type="button" class="uk-button uk-button-default uk-button-small uk-border-rounded" data-mixed-row-action="edit" data-row-index="${index}" aria-label="Editar">
                  <span uk-icon="pencil"></span>
                </button>
                <button type="button" class="uk-button uk-button-default uk-button-small uk-border-rounded" data-mixed-row-action="delete" data-row-index="${index}" aria-label="Eliminar">
                  <span uk-icon="trash"></span>
                </button>
              </div>
            </div>
          </li>
        `;
        })
        .join('');
    };

    const syncHiddenAndNotify = () => {
      hiddenInput.value = JSON.stringify(rows);
      hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const fillModal = (values = {}) => {
      sectionFields.forEach((field) => {
        const name = String(field?.name || '');
        if (!name) return;
        const target = modalForm.querySelector(`[name="${CSS.escape(name)}"]`);
        if (!target) return;
        const value = values[name];
        if (target instanceof HTMLSelectElement && target.multiple) {
          const list = Array.isArray(value) ? value.map((item) => String(item)) : [];
          Array.from(target.options).forEach((option) => {
            option.selected = list.includes(option.value);
          });
          return;
        }
        target.value = Array.isArray(value) ? value.join(',') : String(value ?? '');
      });
    };

    const collectModalValues = () => {
      const row = {};
      sectionFields.forEach((field) => {
        const name = String(field?.name || '');
        if (!name) return;
        const target = modalForm.querySelector(`[name="${CSS.escape(name)}"]`);
        if (!target) {
          row[name] = '';
          return;
        }
        if (target instanceof HTMLSelectElement && target.multiple) {
          row[name] = Array.from(target.selectedOptions).map((option) => option.value);
          return;
        }
        row[name] = target.value;
      });
      return row;
    };

    const showModal = () => {
      console.debug('[mixed-section] show modal request:', sectionKey);
      if (window.UIkit?.modal) {
        window.UIkit.modal(modalNode).show();
        return;
      }
      modalNode.classList.add('uk-open');
      modalNode.style.display = 'block';
    };

    const hideModal = () => {
      console.debug('[mixed-section] hide modal request:', sectionKey);
      if (window.UIkit?.modal) {
        window.UIkit.modal(modalNode).hide();
        return;
      }
      modalNode.classList.remove('uk-open');
      modalNode.style.display = 'none';
    };

    newButton.addEventListener('click', () => {
      console.debug('[mixed-section] new capture click:', sectionKey);
      editingIndex = -1;
      fillModal({});
      showModal();
    });

    cancelButton.addEventListener('click', () => {
      hideModal();
    });

    saveRowButton.addEventListener('click', () => {
      const rowData = collectModalValues();
      console.debug('[mixed-section] submit row:', { sectionKey, editingIndex, rowData });

      const incomingKey = buildMixedRowDuplicateKey(sectionFields, rowData);
      if (incomingKey) {
        const duplicateClave = getMixedRowDuplicateClaveLabel(sectionFields, rowData);
        const duplicateFound = rows.some((existingRow, existingIndex) => {
          if (editingIndex >= 0 && existingIndex === editingIndex) {
            return false;
          }
          return buildMixedRowDuplicateKey(sectionFields, existingRow) === incomingKey;
        });

        if (duplicateFound) {
          const duplicateMessage = duplicateClave
            ? `Error: ya existe un elemento con la clave de producto duplicada (${duplicateClave}).`
            : 'Error: ya existe un elemento con los mismos datos clave y descripcion.';
          if (typeof window.UIkit?.notification === 'function') {
            window.UIkit.notification({
              message: duplicateMessage,
              status: 'danger',
              timeout: 3000,
              pos: 'top-center'
            });
          } else {
            window.alert(duplicateMessage);
          }
          return;
        }
      }

      if (editingIndex >= 0 && editingIndex < rows.length) {
        rows[editingIndex] = rowData;
      } else {
        rows.push(rowData);
      }
      editingIndex = -1;
      syncHiddenAndNotify();
      refreshList();
      hideModal();
    });

    listNode.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const actionNode = target.closest('[data-mixed-row-action]');
      if (!(actionNode instanceof HTMLElement)) {
        return;
      }
      const action = String(actionNode.getAttribute('data-mixed-row-action') || '');
      const index = Number.parseInt(String(actionNode.getAttribute('data-row-index') || '-1'), 10);
      if (!Number.isInteger(index) || index < 0 || index >= rows.length) {
        return;
      }
      if (action === 'delete') {
        console.debug('[mixed-section] delete row:', { sectionKey, index });
        rows.splice(index, 1);
        syncHiddenAndNotify();
        refreshList();
        return;
      }
      if (action === 'edit') {
        console.debug('[mixed-section] edit row:', { sectionKey, index, row: rows[index] || {} });
        editingIndex = index;
        fillModal(rows[index] || {});
        showModal();
      }
    });

    refreshList();
  });
}

function getSectionChildFieldNames(fields, schema) {
  const mode = String(schema?.form?.renderMode || '');
  if (mode !== 'table-sections') {
    return new Set();
  }

  const names = new Set();
  let inSection = false;
  fields.forEach((field) => {
    const type = String(field?.type || '');
    if (type === 'index-marker') {
      inSection = true;
      return;
    }
    if (type === 'table-end-marker') {
      inSection = false;
      return;
    }
    if (!inSection) {
      return;
    }
    const name = String(field?.name || '');
    if (name) {
      names.add(name);
    }
  });
  return names;
}

function parseSectionRows(value) {
  const parsed = parseJsonSafe(value, []);
  return Array.isArray(parsed) ? parsed : [];
}

function parseJsonSafe(value, fallback) {
  try {
    if (typeof value === 'string') {
      return JSON.parse(value);
    }
    if (value && typeof value === 'object') {
      return value;
    }
    return fallback;
  } catch (error) {
    return fallback;
  }
}

function formatMixedRowDisplay(sectionFields, row, index) {
  const parts = sectionFields
    .map((field) => {
      const label = String(field?.label || '').trim();
      const name = String(field?.name || '').trim();
      if (!label || !name) {
        return null;
      }
      const value = row?.[name];
      const normalized = Array.isArray(value) ? value.join(', ') : String(value ?? '').trim();
      if (!normalized) {
        return null;
      }
      return { label, value: normalized };
    })
    .filter((entry) => entry !== null);

  if (!parts.length) {
    return {
      title: `Captura ${index + 1}`,
      details: []
    };
  }

  return {
    title: parts[0].value,
    details: parts.slice(1)
  };
}

function normalizeDuplicateValue(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function resolveDuplicateFieldValue(sectionFields, row, matcher) {
  for (let index = 0; index < sectionFields.length; index += 1) {
    const field = sectionFields[index];
    const label = String(field?.label || '').trim();
    const name = String(field?.name || '').trim();
    if (!name) {
      continue;
    }
    if (!matcher(label, name)) {
      continue;
    }
    const rawValue = row?.[name];
    const value = Array.isArray(rawValue) ? rawValue.join(' ') : rawValue;
    const normalized = normalizeDuplicateValue(value);
    if (normalized) {
      return normalized;
    }
  }
  return '';
}

function buildMixedRowDuplicateKey(sectionFields, row) {
  const clave = resolveDuplicateFieldValue(
    sectionFields,
    row,
    (label, name) => /clave|key|codigo|code|item/i.test(label) || /clave|key|codigo|code|item/i.test(name)
  );
  const descripcion = resolveDuplicateFieldValue(
    sectionFields,
    row,
    (label, name) => /descripcion|descripci[oó]n|description|producto|product/i.test(label) || /descripcion|description|producto|product/i.test(name)
  );

  if (!clave && !descripcion) {
    return '';
  }

  return `${clave}::${descripcion}`;
}

function getMixedRowDuplicateClaveLabel(sectionFields, row) {
  for (let index = 0; index < sectionFields.length; index += 1) {
    const field = sectionFields[index];
    const label = String(field?.label || '').trim();
    const name = String(field?.name || '').trim();
    if (!name) {
      continue;
    }
    if (!(/clave|key|codigo|code|item/i.test(label) || /clave|key|codigo|code|item/i.test(name))) {
      continue;
    }
    const rawValue = row?.[name];
    const rendered = Array.isArray(rawValue) ? rawValue.join(', ') : String(rawValue ?? '').trim();
    if (rendered) {
      return rendered;
    }
  }
  return '';
}

function buildEvidenceRecord({ formRef, savedAt, gps, answers, idrc, wasSent }) {
  const nowIso = new Date().toISOString();
  return {
    DESCRIPCION: String(formRef?.descripcion || formRef?.formName || ''),
    ITEM_NUMBER: String(formRef?.itemNumber || formRef?.indicator || ''),
    FECHA_ENVIO: nowIso,
    ESTATUS: wasSent ? 'ENVIADA' : 'NO ENVIADA',
    IDRC: wasSent ? String(idrc || '') : '',
    captured: {
      formRef,
      savedAt,
      gps: gps || null,
      answers: answers && typeof answers === 'object' ? answers : {}
    }
  };
}

function createSubmitOverlay(mountNode) {
  const overlayId = 'formSubmitOverlay';
  let overlay = document.getElementById(overlayId);
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = overlayId;
    overlay.className = 'uk-flex uk-flex-center uk-flex-middle';
    overlay.style.background = 'rgba(0, 0, 0, 0.55)';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.left = '0';
    overlay.style.zIndex = '2000';
    overlay.style.display = 'none';
    overlay.innerHTML = `
      <div class="uk-card uk-card-default uk-card-body uk-border-rounded uk-text-center">
        <div uk-spinner="ratio: 1.2"></div>
        <p class="uk-margin-small-top uk-margin-remove-bottom">Enviando...</p>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  return {
    show: () => {
      overlay.style.display = 'flex';
    },
    hide: () => {
      overlay.style.display = 'none';
    }
  };
}
