import { boolAttr, escapeHtml, renderFieldWrapper, toFieldProps } from '../field-render-context.js';

const GEO_SELECT_OTHER_VALUE = '__geo_select_other__';
const GEO_SELECT_PAYLOAD_GROUP_LABEL = 'pdis con payload';
const GEO_SELECT_CUSTOM_GROUP_LABEL = 'Punto de interes sin payload';

export function renderGeoSelectField(field, contextOptions) {
  const { name, disabled, required, props } = toFieldProps(field, contextOptions);
  const defaultValue = props.default ?? '';
  const payloadOptions = Array.isArray(contextOptions?.geoSelectPayloadOptions)
    ? contextOptions.geoSelectPayloadOptions
    : [];

  if (!payloadOptions.length) {
    return renderFieldWrapper(
      field,
      `<input class="uk-input uk-border-rounded inputTxtFrm" type="text" name="${escapeHtml(name)}" value="${escapeHtml(defaultValue)}" placeholder="Escribe tu ubicacion"${boolAttr(disabled, 'disabled')}${boolAttr(required, 'required')}>`,
      contextOptions
    );
  }

  const payloadOptionsHtml = payloadOptions
    .map((item) => {
      const value = String(item?.COD_OBJECT_MAP ?? '').trim();
      if (!value) {
        return '';
      }

      const label = String(item?.DESCRIPCION ?? value).trim() || value;
      const selected = String(defaultValue) === value ? ' selected' : '';
      const cadenaPayload = String(item?.CADENA_PAYLOAD ?? '');
      return `<option value="${escapeHtml(value)}" data-cadena-payload="${escapeHtml(cadenaPayload)}"${selected}>${escapeHtml(label)}</option>`;
    })
    .join('');

  const hasDefaultInPayload = payloadOptions.some((item) => String(item?.COD_OBJECT_MAP ?? '').trim() === String(defaultValue).trim());
  const isCustomDefault = String(defaultValue).trim() !== '' && !hasDefaultInPayload;
  const customOptionHtml = isCustomDefault
    ? `<option value="${escapeHtml(String(defaultValue))}" selected>${escapeHtml(String(defaultValue))}</option>`
    : '';

  return renderFieldWrapper(
    field,
    `<select class="uk-select uk-border-rounded inputTxtFrm" name="${escapeHtml(name)}" data-geo-select-custom-option="1"${boolAttr(disabled, 'disabled')}${boolAttr(required, 'required')}>
      <option value="">Selecciona una ubicacion</option>
      <optgroup label="${GEO_SELECT_PAYLOAD_GROUP_LABEL}">
        ${payloadOptionsHtml}
      </optgroup>
      <optgroup label="${GEO_SELECT_CUSTOM_GROUP_LABEL}">
        ${customOptionHtml}
        <option value="${GEO_SELECT_OTHER_VALUE}">otro...</option>
      </optgroup>
    </select>`,
    contextOptions
  );
}

function parsePayloadJson(rawValue) {
  const normalizedRaw = String(rawValue ?? '').trim();
  if (!normalizedRaw) {
    return null;
  }

  try {
    const parsed = JSON.parse(normalizedRaw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (error) {
    return null;
  }
}

function hasDefinedArrayValues(values) {
  if (!Array.isArray(values) || !values.length) {
    return false;
  }

  return values.some((item) => String(item ?? '').trim() !== '');
}

function getNonEmptyArrayValues(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((item) => String(item ?? '').trim())
    .filter((item) => item !== '');
}

function findFieldNode(mountNode, fieldName) {
  const allNodes = mountNode.querySelectorAll(`[name="${CSS.escape(fieldName)}"]`);
  if (!allNodes.length) {
    return null;
  }

  const preferredNodes = Array.from(allNodes).filter((node) => {
    if (node instanceof HTMLInputElement && node.type === 'hidden') {
      return false;
    }

    return node instanceof HTMLInputElement
      || node instanceof HTMLTextAreaElement
      || node instanceof HTMLSelectElement;
  });

  if (preferredNodes.length) {
    return preferredNodes[0];
  }

  return null;
}

function replaceFieldNodeWithSelect(fieldNode, values, questionId) {
  if (!(fieldNode instanceof HTMLInputElement || fieldNode instanceof HTMLTextAreaElement || fieldNode instanceof HTMLSelectElement)) {
    return fieldNode;
  }

  const nonEmptyValues = getNonEmptyArrayValues(values);
  if (!nonEmptyValues.length) {
    return fieldNode;
  }

  if (fieldNode instanceof HTMLSelectElement) {
    fieldNode.innerHTML = '';
    nonEmptyValues.forEach((value, valueIndex) => {
      const option = document.createElement('option');
      option.value = String(value ?? '');
      option.textContent = String(value ?? '');
      option.dataset.payloadIndex = String(valueIndex);
      fieldNode.appendChild(option);
    });
    fieldNode.dataset.payloadLinkedQuestionId = String(questionId);
    return fieldNode;
  }

  const selectNode = document.createElement('select');
  selectNode.className = 'uk-select uk-border-rounded inputTxtFrm';
  selectNode.name = fieldNode.name;
  selectNode.disabled = fieldNode.disabled;
  selectNode.required = fieldNode.required;
  selectNode.dataset.payloadLinkedQuestionId = String(questionId);

  nonEmptyValues.forEach((value, valueIndex) => {
    const option = document.createElement('option');
    option.value = String(value ?? '');
    option.textContent = String(value ?? '');
    option.dataset.payloadIndex = String(valueIndex);
    selectNode.appendChild(option);
  });

  fieldNode.parentNode?.replaceChild(selectNode, fieldNode);
  return selectNode;
}

function setLinkedFieldsByIndex(linkedEntries, sourceIndex) {
  linkedEntries.forEach((entry) => {
    entry.node.dataset.payloadSyncing = '1';
    const valueAtIndex = sourceIndex < entry.values.length ? String(entry.values[sourceIndex] ?? '') : '';
    const optionByIndex = Array.from(entry.node.options).find((option) => Number.parseInt(String(option.dataset.payloadIndex || '-1'), 10) === sourceIndex);
    if (optionByIndex) {
      entry.node.value = optionByIndex.value;
    } else {
      entry.node.value = valueAtIndex;
    }
    entry.node.dispatchEvent(new Event('change', { bubbles: true }));
    entry.node.classList.add('geo-select-payload-filled');
    window.setTimeout(() => {
      entry.node.classList.remove('geo-select-payload-filled');
    }, 2200);
    entry.node.dataset.payloadSyncing = '0';
  });
}

function setupLinkedPayloadSelects(mountNode, scopedAnswers) {
  const linkedEntries = Object.entries(scopedAnswers)
    .filter(([questionId, answerValue]) => String(questionId ?? '').trim() !== '' && hasDefinedArrayValues(answerValue))
    .map(([questionId, answerValue]) => {
      const fieldName = `field_${String(questionId).trim()}`;
      const fieldNode = findFieldNode(mountNode, fieldName);
      if (!fieldNode) {
        return null;
      }
      const nonEmptyValues = getNonEmptyArrayValues(answerValue);
      if (!nonEmptyValues.length) {
        return null;
      }
      const selectNode = replaceFieldNodeWithSelect(fieldNode, answerValue, questionId);
      if (!(selectNode instanceof HTMLSelectElement)) {
        return null;
      }
      return {
        questionId: String(questionId),
        node: selectNode,
        values: nonEmptyValues
      };
    })
    .filter((entry) => entry !== null);

  if (!linkedEntries.length) {
    return 0;
  }

  linkedEntries.forEach((entry) => {
    if (entry.node.dataset.payloadLinkedBound === '1') {
      return;
    }
    entry.node.dataset.payloadLinkedBound = '1';
    entry.node.addEventListener('change', () => {
      if (entry.node.dataset.payloadSyncing === '1') {
        return;
      }
      const selectedIndex = entry.node.selectedIndex;
      if (selectedIndex < 0) {
        return;
      }
      setLinkedFieldsByIndex(linkedEntries, selectedIndex);
    });
  });

  setLinkedFieldsByIndex(linkedEntries, 0);
  return linkedEntries.length;
}

function applyPayloadAnswersToForm(mountNode, selectNode, pdiValue) {
  const selectedOption = selectNode.selectedOptions?.[0];
  const cadenaPayloadRaw = String(selectedOption?.dataset?.cadenaPayload ?? '').trim();
  if (!cadenaPayloadRaw) {
    return;
  }

  const payloadObject = parsePayloadJson(cadenaPayloadRaw);
  if (!payloadObject || typeof payloadObject !== 'object') {
    return;
  }

  const scopedAnswers = payloadObject?.[pdiValue];
  if (!scopedAnswers || typeof scopedAnswers !== 'object') {
    return;
  }

  const linkedSelectCount = setupLinkedPayloadSelects(mountNode, scopedAnswers);
  let appliedCount = 0;
  Object.entries(scopedAnswers).forEach(([questionId, answerValue]) => {
    const normalizedQuestionId = String(questionId ?? '').trim();
    if (Array.isArray(answerValue)) {
      return;
    }
    const normalizedAnswer = String(answerValue ?? '').trim();
    if (!normalizedQuestionId || !normalizedAnswer) {
      return;
    }

    const fieldName = `field_${normalizedQuestionId}`;
    const targetNode = findFieldNode(mountNode, fieldName);
    if (!(targetNode instanceof HTMLInputElement
      || targetNode instanceof HTMLTextAreaElement
      || targetNode instanceof HTMLSelectElement)) {
      return;
    }

    targetNode.value = normalizedAnswer;
    targetNode.dispatchEvent(new Event('change', { bubbles: true }));
    targetNode.classList.add('geo-select-payload-filled');
    window.setTimeout(() => {
      targetNode.classList.remove('geo-select-payload-filled');
    }, 2200);
    appliedCount += 1;
  });

  const totalApplied = appliedCount + linkedSelectCount;
  if (totalApplied > 0 && typeof window.UIkit?.notification === 'function') {
    window.UIkit.notification({
      message: `Se cargaron ${totalApplied} respuestas desde payload (${pdiValue}).`,
      status: 'primary',
      timeout: 2500,
      pos: 'top-center'
    });
  }
}

export function initGeoSelectFieldBehavior(mountNode) {
  if (!document.getElementById('geo-select-payload-fill-style')) {
    const style = document.createElement('style');
    style.id = 'geo-select-payload-fill-style';
    style.textContent = `
      .geo-select-payload-filled {
        outline: 2px solid #1e87f0;
        box-shadow: 0 0 0 3px rgba(30, 135, 240, 0.2);
        transition: box-shadow 0.25s ease, outline-color 0.25s ease;
      }
    `;
    document.head.appendChild(style);
  }

  const selects = mountNode.querySelectorAll('select[data-geo-select-custom-option="1"]');
  selects.forEach((selectNode) => {
    if (!(selectNode instanceof HTMLSelectElement) || selectNode.dataset.geoSelectCustomBound === '1') {
      return;
    }
    selectNode.dataset.geoSelectCustomBound = '1';

    const openCustomPrompt = async () => {
      if (selectNode.dataset.geoSelectPromptOpen === '1') {
        return;
      }

      if (selectNode.value !== GEO_SELECT_OTHER_VALUE) {
        return;
      }

      if (typeof window.UIkit?.modal?.prompt !== 'function') {
        selectNode.value = '';
        return;
      }

      selectNode.dataset.geoSelectPromptOpen = '1';
      try {
        const capturedValue = await window.UIkit.modal.prompt('Escribe el item number del PDI', '');
        const normalizedValue = String(capturedValue ?? '').trim();
        if (!normalizedValue) {
          selectNode.value = '';
          return;
        }

        let customGroup = Array.from(selectNode.querySelectorAll('optgroup'))
          .find((group) => group.label === GEO_SELECT_CUSTOM_GROUP_LABEL);

        if (!customGroup) {
          customGroup = document.createElement('optgroup');
          customGroup.label = GEO_SELECT_CUSTOM_GROUP_LABEL;
          selectNode.appendChild(customGroup);
        }

        let optionNode = Array.from(customGroup.querySelectorAll('option'))
          .find((option) => option.value === normalizedValue);
        if (!optionNode) {
          optionNode = document.createElement('option');
          optionNode.value = normalizedValue;
          optionNode.textContent = normalizedValue;

          const otherOption = Array.from(customGroup.querySelectorAll('option'))
            .find((option) => option.value === GEO_SELECT_OTHER_VALUE);
          if (otherOption) {
            customGroup.insertBefore(optionNode, otherOption);
          } else {
            customGroup.appendChild(optionNode);
          }
        }

        selectNode.value = normalizedValue;
        selectNode.dispatchEvent(new Event('change', { bubbles: true }));
      } catch (error) {
        selectNode.value = '';
      } finally {
        selectNode.dataset.geoSelectPromptOpen = '0';
      }
    };

    selectNode.addEventListener('change', async () => {
      if (selectNode.value === GEO_SELECT_OTHER_VALUE) {
        await openCustomPrompt();
        return;
      }

      const selectedValue = String(selectNode.value ?? '').trim();
      if (!selectedValue) {
        return;
      }

      applyPayloadAnswersToForm(mountNode, selectNode, selectedValue);
    });

    selectNode.addEventListener('click', async () => {
      await openCustomPrompt();
    });
  });
}
