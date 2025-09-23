const { LAYOUT_MODE, WEBVIEW_SOURCE } = require('../sourceBridage.js');

const VALID_PANEL_TYPES = Object.keys(WEBVIEW_SOURCE);
const VALID_LAYOUT_MODES = Object.values(LAYOUT_MODE);

function validateWCVDefaultSetting(config) {
  const errors = [];

  if (!config || typeof config !== 'object') {
    errors.push('WCV_DEFAULT_SETTING must be an object');
    return errors;
  }

  if (!config.panels || typeof config.panels !== 'object') {
    errors.push('panels is required and must be an object');
  } else {
    for (const [panelId, panel] of Object.entries(config.panels)) {
      if (!panel.type) {
        errors.push(`Panel '${panelId}' must have a type`);
      } else if (!VALID_PANEL_TYPES.includes(panel.type)) {
        errors.push(`Panel '${panelId}' has invalid type '${panel.type}'. Valid types: ${VALID_PANEL_TYPES.join(', ')}`);
      }

      if (!panel.name) {
        errors.push(`Panel '${panelId}' must have a name`);
      }
    }
  }

  if (!config.initial || !Array.isArray(config.initial)) {
    errors.push('initial is required and must be an array');
  } else {
    const panelIds = config.panels ? Object.keys(config.panels) : [];
    for (const initPanelId of config.initial) {
      if (!panelIds.includes(initPanelId)) {
        errors.push(`initial panel '${initPanelId}' must be defined in panels`);
      }
    }
  }

  if (!config.triggers || typeof config.triggers !== 'object') {
    errors.push('triggers is required and must be an object');
  } else {
    const panelIds = config.panels ? Object.keys(config.panels) : [];

    for (const [triggerType, triggerPanels] of Object.entries(config.triggers)) {
      if (!Array.isArray(triggerPanels)) {
        errors.push(`triggers.${triggerType} must be an array`);
        continue;
      }

      for (const triggerPanelId of triggerPanels) {
        if (!panelIds.includes(triggerPanelId)) {
          errors.push(`trigger panel '${triggerPanelId}' in '${triggerType}' must be defined in panels`);
        }
      }
    }
  }

  if (!config.defaultView || typeof config.defaultView !== 'object') {
    errors.push('defaultView is required and must be an object');
  } else {
    if (!config.defaultView.layoutMode) {
      errors.push('defaultView.layoutMode is required');
    } else if (!VALID_LAYOUT_MODES.includes(config.defaultView.layoutMode)) {
      errors.push(`defaultView.layoutMode '${config.defaultView.layoutMode}' is invalid. Valid modes: ${VALID_LAYOUT_MODES.join(', ')}`);
    }
  }

  return errors;
}

function validateAndThrow(config) {
  const errors = validateWCVDefaultSetting(config);
  if (errors.length > 0) {
    throw new Error(`WCV_DEFAULT_SETTING validation failed:\n${errors.map(err => `  - ${err}`).join('\n')}`);
  }
  return true;
}

module.exports = {
  validateWCVDefaultSetting,
  validateAndThrow,
  VALID_PANEL_TYPES,
  VALID_LAYOUT_MODES
};