import type { ProfileDTO, LanguageCode } from "../../../../types";
import { DEFAULT_LANGUAGE } from "../../../../types";

/**
 * Language-specific instruction templates
 * Easy to extend with new languages (es, fr, de, etc.)
 */
const LANGUAGE_INSTRUCTIONS: Record<LanguageCode, string> = {
  pl: `WAŻNE: Musisz odpowiedzieć w języku POLSKIM.
CAŁA treść przepisu (tytuł, opis, podsumowanie, składniki, instrukcje, tagi, kuchnia) MUSI być napisana po polsku.

Przykładowe tagi po polsku: "obiad", "szybkie", "wegetariańskie", "zdrowe", "desery"
Przykładowe kuchnie po polsku: "włoska", "grecka", "azjatycka", "polska", "meksykańska"`,

  en: `IMPORTANT: You MUST respond in ENGLISH language.
ALL recipe content (title, description, summary, ingredients, instructions, tags, cuisine) MUST be written in English.

Example tags in English: "dinner", "quick", "vegetarian", "healthy", "desserts"
Example cuisine in English: "italian", "greek", "asian", "polish", "mexican"`,
};

/**
 * Build system prompt with recipe schema and dietary preferences
 * @param profile - Optional user profile with dietary preferences
 * @param lang - Language for recipe generation (defaults to 'en')
 * @returns Formatted system prompt
 */
export function buildSystemPrompt(profile?: ProfileDTO, lang: LanguageCode = DEFAULT_LANGUAGE): string {
  const languageInstruction = LANGUAGE_INSTRUCTIONS[lang];

  let prompt = `${languageInstruction}

You are a professional chef and recipe creator. Generate recipes in strict JSON format matching this structure:

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
- All text content MUST be in ${lang === 'pl' ? 'POLISH' : 'ENGLISH'} language
- All fields must match the types shown above
- ingredients and instructions must be non-empty arrays
- times and servings must be positive numbers
- difficulty must be exactly: "easy", "medium", or "hard"`;

  // Append user dietary preferences if provided
  if (profile) {
    prompt += buildDietaryPreferencesSection(profile, lang);
  }

  return prompt;
}

/**
 * Build user prompt from user input
 * @param userPrompt - User's recipe request (in any language)
 * @param lang - Expected response language (defaults to 'en')
 * @returns Formatted user prompt
 */
export function buildUserPrompt(userPrompt: string, lang: LanguageCode = DEFAULT_LANGUAGE): string {
  const instruction = lang === 'pl'
    ? 'Stwórz przepis na'
    : 'Create a recipe for';

  return `${instruction}: ${userPrompt}

Remember: Return ONLY valid JSON in ${lang === 'pl' ? 'POLISH' : 'ENGLISH'} matching the exact structure specified in the system prompt.`;
}

/**
 * Build dietary preferences section for system prompt (internal helper)
 * Language-aware formatting
 * @param profile - User profile with dietary preferences
 * @param lang - Language for labels
 * @returns Formatted dietary preferences text
 */
function buildDietaryPreferencesSection(profile: ProfileDTO, lang: LanguageCode): string {
  const labels = lang === 'pl'
    ? {
        header: 'PREFERENCJE DIETETYCZNE UŻYTKOWNIKA:',
        dietType: 'Typ diety',
        avoid: 'UNIKAJ tych składników',
        preferred: 'Preferowane kuchnie',
      }
    : {
        header: 'USER DIETARY PREFERENCES:',
        dietType: 'Diet type',
        avoid: 'AVOID these ingredients',
        preferred: 'Preferred cuisines',
      };

  let section = `\n\n${labels.header}`;

  if (profile.diet_type) {
    section += `\n- ${labels.dietType}: ${profile.diet_type}`;
  }

  if (profile.disliked_ingredients && profile.disliked_ingredients.length > 0) {
    section += `\n- ${labels.avoid}: ${profile.disliked_ingredients.join(", ")}`;
  }

  if (profile.preferred_cuisines && profile.preferred_cuisines.length > 0) {
    section += `\n- ${labels.preferred}: ${profile.preferred_cuisines.join(", ")}`;
  }

  return section;
}
