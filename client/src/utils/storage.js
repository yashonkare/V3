const STORAGE_KEY = 'casedecoder_active_brief';

export function saveActiveBrief(briefData) {
  try {
    if (!briefData) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(briefData));
  } catch (err) {
    console.error('Failed to save brief to localStorage:', err);
  }
}

export function loadActiveBrief() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('Failed to load brief from localStorage:', err);
    return null;
  }
}

export function clearActiveBrief() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear brief from localStorage:', err);
  }
}
