import type { ProfileDTO } from "../../../../types";

/**
 * Build system prompt with recipe schema and dietary preferences
 * @param profile - Optional user profile with dietary preferences
 * @returns Formatted system prompt
 */
export function buildSystemPrompt(profile?: ProfileDTO): string {
  let prompt = `You are a professional chef and recipe creator. Generate recipes in strict JSON format matching this structure:

{
  "title": "Recipe Title",
  "summary": "Brief one-sentence summary",
  "description": "Detailed description",
  "prep_time_minutes": 15,
  "cook_time_minutes": 30,
  "servings": 4,
  "difficulty": "easy|medium|hard",
  "cuisine": "Italian",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": ["step 1", "step 2"],
  "tags": ["tag1", "tag2"],
  "dietary_info": {
    "vegetarian": true,
    "vegan": false,
    "gluten_free": false,
    "dairy_free": false,
    "nut_free": true
  },
  "nutrition": {
    "calories": 350,
    "protein_g": 12,
    "carbs_g": 45,
    "fat_g": 10
  }
}

CRITICAL RULES:
- Return ONLY valid JSON, no markdown, no explanations
- All fields must match the types shown above
- ingredients and instructions must be non-empty arrays
- times and servings must be positive numbers
- difficulty must be exactly: "easy", "medium", or "hard"`;

  // Append user dietary preferences if provided
  if (profile) {
    prompt += buildDietaryPreferencesSection(profile);
  }

  return prompt;
}

/**
 * Build user prompt from user input
 * @param userPrompt - User's recipe request
 * @returns Formatted user prompt
 */
export function buildUserPrompt(userPrompt: string): string {
  return `Create a recipe for: ${userPrompt}

Remember: Return ONLY valid JSON matching the exact structure specified in the system prompt.`;
}

/**
 * Build dietary preferences section for system prompt (internal helper)
 * @param profile - User profile with dietary preferences
 * @returns Formatted dietary preferences text
 */
function buildDietaryPreferencesSection(profile: ProfileDTO): string {
  let section = `\n\nUSER DIETARY PREFERENCES:`;

  if (profile.diet_type) {
    section += `\n- Diet type: ${profile.diet_type}`;
  }

  if (profile.disliked_ingredients && profile.disliked_ingredients.length > 0) {
    section += `\n- AVOID these ingredients: ${profile.disliked_ingredients.join(", ")}`;
  }

  if (profile.preferred_cuisines && profile.preferred_cuisines.length > 0) {
    section += `\n- Preferred cuisines: ${profile.preferred_cuisines.join(", ")}`;
  }

  return section;
}
