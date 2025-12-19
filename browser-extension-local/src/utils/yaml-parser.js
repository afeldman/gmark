/**
 * Simple YAML Parser
 * Parst einfache YAML-Dateien (ohne komplexe Features)
 */

/**
 * Parse simple YAML to JavaScript object
 * @param {string} yamlText - YAML text
 * @returns {Object} Parsed object
 */
export function parseSimpleYAML(yamlText) {
  const lines = yamlText.split("\n");
  const result = {};
  const stack = [{ obj: result, indent: -1, currentKey: null }];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip comments and empty lines
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    // Calculate indentation
    const indent = line.search(/\S/);
    const content = trimmed;

    // Array item (starts with -)
    if (content.startsWith("- ")) {
      const value = content.substring(2).trim();

      // Find correct parent object at this indent level
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }

      const parent = stack[stack.length - 1].obj;
      const key = stack[stack.length - 1].currentKey;

      // Create array if it doesn't exist
      if (key && !Array.isArray(parent[key])) {
        parent[key] = [];
      }

      // Add value to array
      if (key && Array.isArray(parent[key])) {
        parent[key].push(value);
      }
      continue;
    }

    // Key-value pair
    const colonIndex = content.indexOf(":");
    if (colonIndex > -1) {
      const key = content.substring(0, colonIndex).trim();
      const value = content.substring(colonIndex + 1).trim();

      // Pop stack to find correct parent at this indent level
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }

      const parent = stack[stack.length - 1].obj;

      if (value === "") {
        // Empty value means nested object (or will be array if followed by -)
        parent[key] = {};
        stack.push({ obj: parent[key], indent, currentKey: key });
      } else if (value.startsWith('"') && value.endsWith('"')) {
        // Double-quoted string
        parent[key] = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        // Single-quoted string
        parent[key] = value.slice(1, -1);
      } else if (value === "true") {
        // Boolean true
        parent[key] = true;
      } else if (value === "false") {
        // Boolean false
        parent[key] = false;
      } else if (!isNaN(value) && value !== "") {
        // Number
        parent[key] = parseFloat(value);
      } else {
        // Plain string value
        parent[key] = value;
      }

      // Update the key being tracked at this level
      stack[stack.length - 1].currentKey = key;
    }
  }

  return result;
}

/**
 * Load and parse YAML file
 * @param {string} url - URL to YAML file
 * @returns {Promise<Object>} Parsed YAML object
 */
export async function loadYAML(url) {
  try {
    console.log("📄 Loading YAML from:", url);
    const response = await fetch(url);
    const text = await response.text();
    console.log("✅ YAML loaded, parsing...");
    const parsed = parseSimpleYAML(text);
    console.log("✅ YAML parsed successfully");
    return parsed;
  } catch (error) {
    console.error("❌ Failed to load YAML:", error);
    throw error;
  }
}

export default {
  parseSimpleYAML,
  loadYAML,
};
