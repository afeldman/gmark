/**
 * Simple YAML Parser
 * Parst einfache YAML-Dateien (ohne komplexe Features)
 */

/**
 * Parse simple YAML to JavaScript object
 * Simplified version that handles the categories.yml structure
 * @param {string} yamlText - YAML text
 * @returns {Object} Parsed object
 */
export function parseSimpleYAML(yamlText) {
  const lines = yamlText.split("\n");
  const result = {};
  const stack = [];
  let currentContext = result;
  let currentKey = null;
  let currentIndent = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith("#")) continue;

    // Calculate indentation level
    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1].length : 0;

    const content = line.trim();

    // Handle array items (- value)
    if (content.startsWith("- ")) {
      const value = content.slice(2).trim();
      
      // Make sure we're at the right context level
      while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
        currentContext = stack.length > 0 ? stack[stack.length - 1].obj : result;
      }

      // Get the key we should be filling
      const key = stack.length > 0 ? stack[stack.length - 1].key : currentKey;
      
      // Create array if needed
      if (key && currentContext[key] && !Array.isArray(currentContext[key])) {
        currentContext[key] = [];
      } else if (key && !currentContext[key]) {
        currentContext[key] = [];
      }

      // Add value to array
      if (key && Array.isArray(currentContext[key])) {
        currentContext[key].push(value);
      }
      continue;
    }

    // Handle key-value pairs (key: value or key:)
    const colonIdx = content.indexOf(":");
    if (colonIdx !== -1) {
      const key = content.substring(0, colonIdx).trim();
      const value = content.substring(colonIdx + 1).trim();

      // Pop stack if we've decreased indentation
      while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
        currentContext = stack.length > 0 ? stack[stack.length - 1].obj : result;
      }

      if (value === "") {
        // Empty value = nested object
        currentContext[key] = {};
        stack.push({
          obj: currentContext[key],
          key: key,
          indent: indent
        });
        currentContext = currentContext[key];
        currentKey = key;
      } else if (value.startsWith('"') && value.endsWith('"')) {
        // Quoted string
        currentContext[key] = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        // Single quoted string
        currentContext[key] = value.slice(1, -1);
      } else if (value === "true") {
        currentContext[key] = true;
      } else if (value === "false") {
        currentContext[key] = false;
      } else if (!isNaN(value) && value !== "") {
        // Number
        currentContext[key] = parseFloat(value);
      } else {
        // Plain string
        currentContext[key] = value;
      }

      currentKey = key;
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
