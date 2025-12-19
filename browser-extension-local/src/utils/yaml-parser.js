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
  const stack = [{ obj: result, indent: -1, key: null }];

  for (let line of lines) {
    // Skip comments and empty lines
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    // Calculate indentation
    const indent = line.search(/\S/);
    const content = trimmed;

    // Array item
    if (content.startsWith("- ")) {
      const value = content.substring(2).trim();

      // Find the parent that should contain this array
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }

      const parent = stack[stack.length - 1].obj;
      const key = stack[stack.length - 1].key;

      // If parent[key] doesn't exist, create array
      if (key && !Array.isArray(parent[key])) {
        parent[key] = [];
      }

      // Add to array
      if (key) {
        parent[key].push(value);
      }
      continue;
    }

    // Key-value pair
    const colonIndex = content.indexOf(":");
    if (colonIndex > -1) {
      const key = content.substring(0, colonIndex).trim();
      let value = content.substring(colonIndex + 1).trim();

      // Pop stack to find correct parent
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }

      const parent = stack[stack.length - 1].obj;

      if (value === "") {
        // New nested object (key with no value means object)
        parent[key] = {};
        stack.push({ obj: parent[key], indent, key });
      } else if (value.startsWith('"') && value.endsWith('"')) {
        // Double-quoted string
        parent[key] = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        // Single-quoted string
        parent[key] = value.slice(1, -1);
      } else if (!isNaN(value) && value !== "") {
        // Number
        parent[key] = parseFloat(value);
      } else if (value === "true") {
        // Boolean true
        parent[key] = true;
      } else if (value === "false") {
        // Boolean false
        parent[key] = false;
      } else {
        // Plain string value
        parent[key] = value;
      }
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
