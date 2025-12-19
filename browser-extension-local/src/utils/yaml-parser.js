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
  let currentPath = [];
  let currentIndent = 0;
  let currentObject = result;
  const stack = [{ obj: result, indent: -2 }];

  for (let line of lines) {
    // Skip comments and empty lines
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    // Calculate indentation
    const indent = line.search(/\S/);
    const content = line.trim();

    // Array item
    if (content.startsWith("- ")) {
      const value = content.substring(2).trim();

      // Find parent array
      while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }

      const parent = stack[stack.length - 1].obj;
      const lastKey = stack[stack.length - 1].lastKey;

      if (lastKey && !Array.isArray(parent[lastKey])) {
        parent[lastKey] = [];
      }

      if (lastKey) {
        parent[lastKey].push(value);
      }
      continue;
    }

    // Key-value pair
    const colonIndex = content.indexOf(":");
    if (colonIndex > -1) {
      const key = content.substring(0, colonIndex).trim();
      const value = content.substring(colonIndex + 1).trim();

      // Pop stack to correct level
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }

      const parent = stack[stack.length - 1].obj;

      if (value === "" || value === "{}" || value === "[]") {
        // New object or array
        parent[key] = {};
        stack.push({ obj: parent[key], indent, lastKey: key });
      } else if (value.startsWith('"') || value.startsWith("'")) {
        // String value
        parent[key] = value.slice(1, -1);
      } else if (!isNaN(value)) {
        // Number
        parent[key] = parseFloat(value);
      } else if (value === "true" || value === "false") {
        // Boolean
        parent[key] = value === "true";
      } else {
        // Plain string
        parent[key] = value;
      }

      stack[stack.length - 1].lastKey = key;
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
