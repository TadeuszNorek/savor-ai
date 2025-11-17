import { v4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import { R as RecipeSchemaZ, G as GenerateRecipeCommandSchema } from '../../../chunks/recipe.schema_DxgUKZEZ.mjs';
import { E as EventsService } from '../../../chunks/events.service_BC3NX19O.mjs';
export { renderers } from '../../../renderers.mjs';

const DEFAULT_LANGUAGE = "en";

class AiError extends Error {
  constructor(message, isRetryable = false, originalError) {
    super(message);
    this.isRetryable = isRetryable;
    this.originalError = originalError;
    this.name = "AiError";
  }
}
class AiTimeoutError extends AiError {
  constructor(message = "AI request timed out") {
    super(message, true);
    this.name = "AiTimeoutError";
  }
}
class AiValidationError extends AiError {
  constructor(message = "AI response validation failed") {
    super(message, true);
    this.name = "AiValidationError";
  }
}
class AiProviderError extends AiError {
  constructor(message, statusCode) {
    super(message, statusCode ? statusCode >= 500 : false);
    this.statusCode = statusCode;
    this.name = "AiProviderError";
  }
}

const LANGUAGE_INSTRUCTIONS = {
  pl: `WAŻNE: Musisz odpowiedzieć w języku POLSKIM.
CAŁA treść przepisu (tytuł, opis, podsumowanie, składniki, instrukcje, tagi, kuchnia) MUSI być napisana po polsku.

Przykładowe tagi po polsku: "obiad", "szybkie", "wegetariańskie", "zdrowe", "desery"
Przykładowe kuchnie po polsku: "włoska", "grecka", "azjatycka", "polska", "meksykańska"`,
  en: `IMPORTANT: You MUST respond in ENGLISH language.
ALL recipe content (title, description, summary, ingredients, instructions, tags, cuisine) MUST be written in English.

Example tags in English: "dinner", "quick", "vegetarian", "healthy", "desserts"
Example cuisine in English: "italian", "greek", "asian", "polish", "mexican"`
};
function buildSystemPrompt(profile, lang = DEFAULT_LANGUAGE) {
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
- All text content MUST be in ${lang === "pl" ? "POLISH" : "ENGLISH"} language
- All fields must match the types shown above
- ingredients and instructions must be non-empty arrays
- times and servings must be positive numbers
- difficulty must be exactly: "easy", "medium", or "hard"`;
  if (profile) {
    prompt += buildDietaryPreferencesSection(profile, lang);
  }
  return prompt;
}
function buildUserPrompt(userPrompt, lang = DEFAULT_LANGUAGE) {
  const instruction = lang === "pl" ? "Stwórz przepis na" : "Create a recipe for";
  return `${instruction}: ${userPrompt}

Remember: Return ONLY valid JSON in ${lang === "pl" ? "POLISH" : "ENGLISH"} matching the exact structure specified in the system prompt.`;
}
function buildDietaryPreferencesSection(profile, lang) {
  const labels = lang === "pl" ? {
    header: "PREFERENCJE DIETETYCZNE UŻYTKOWNIKA:",
    dietType: "Typ diety",
    avoid: "UNIKAJ tych składników",
    preferred: "Preferowane kuchnie"
  } : {
    header: "USER DIETARY PREFERENCES:",
    dietType: "Diet type",
    avoid: "AVOID these ingredients",
    preferred: "Preferred cuisines"
  };
  let section = `

${labels.header}`;
  if (profile.diet_type) {
    section += `
- ${labels.dietType}: ${profile.diet_type}`;
  }
  if (profile.disliked_ingredients && profile.disliked_ingredients.length > 0) {
    section += `
- ${labels.avoid}: ${profile.disliked_ingredients.join(", ")}`;
  }
  if (profile.preferred_cuisines && profile.preferred_cuisines.length > 0) {
    section += `
- ${labels.preferred}: ${profile.preferred_cuisines.join(", ")}`;
  }
  return section;
}

function parseAndValidate(content) {
  const rawJson = extractJSON(content);
  const parsed = parseJSON(rawJson);
  const validated = validateSchema(parsed);
  return validated;
}
function extractJSON(content) {
  const cleaned = content.trim();
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  return cleaned;
}
function parseJSON(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new AiValidationError(`Failed to parse recipe JSON: ${message}`);
  }
}
function validateSchema(data) {
  try {
    return RecipeSchemaZ.parse(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown validation error";
    throw new AiValidationError(`Recipe schema validation failed: ${message}`);
  }
}

async function executeWithTimeout(fetchFn, timeout, providerName) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetchFn(controller.signal);
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AiTimeoutError(`${providerName} request timed out after ${timeout}ms`);
    }
    throw error;
  }
}
async function handleResponseError(response, providerName) {
  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new AiProviderError(`${providerName} API error: ${errorText}`, response.status);
  }
}
function extractContent(data, contentPath, providerName) {
  let current = data;
  for (const key of contentPath) {
    if (current == null) {
      throw new AiProviderError(`No content in ${providerName} response`, void 0);
    }
    if (!isNaN(Number(key))) {
      current = current[Number(key)];
    } else {
      current = current[key];
    }
  }
  if (typeof current !== "string" || !current) {
    throw new AiProviderError(`No content in ${providerName} response`, void 0);
  }
  return current;
}
function handleNetworkError(error, providerName) {
  const message = error instanceof Error ? error.message : "Unknown error";
  throw new AiProviderError(`${providerName} request failed: ${message}`, void 0);
}

class OpenRouterProvider {
  apiKey;
  model;
  timeout;
  baseUrl = "https://openrouter.ai/api/v1";
  providerName = "OpenRouter";
  constructor(config) {
    this.apiKey = config.apiKey;
    this.model = config.model || "deepseek/deepseek-r1-0528:free";
    this.timeout = config.timeout || 3e4;
  }
  async generateRecipe(prompt, profile, lang) {
    const systemPrompt = buildSystemPrompt(profile, lang);
    const userPrompt = buildUserPrompt(prompt, lang);
    try {
      const response = await executeWithTimeout(
        (signal) => fetch(`${this.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
            "HTTP-Referer": "https://savor-ai.app",
            // Optional: for OpenRouter analytics
            "X-Title": "Savor AI Recipe Generator"
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 4e3
          }),
          signal
        }),
        this.timeout,
        this.providerName
      );
      await handleResponseError(response, this.providerName);
      const data = await response.json();
      const content = extractContent(data, ["choices", "0", "message", "content"], this.providerName);
      const validated = parseAndValidate(content);
      return validated;
    } catch (error) {
      if (error instanceof AiProviderError || error instanceof AiValidationError || error instanceof Error && error.constructor.name === "AiTimeoutError") {
        throw error;
      }
      handleNetworkError(error, this.providerName);
    }
  }
}

class GoogleProvider {
  apiKey;
  model;
  timeout;
  baseUrl = "https://generativelanguage.googleapis.com/v1beta";
  providerName = "Google AI";
  constructor(config) {
    this.apiKey = config.apiKey;
    this.model = config.model || "gemini-1.5-flash";
    this.timeout = config.timeout || 3e4;
  }
  async generateRecipe(prompt, profile, lang) {
    const systemPrompt = buildSystemPrompt(profile, lang);
    const userPrompt = buildUserPrompt(prompt, lang);
    try {
      const response = await executeWithTimeout(
        (signal) => fetch(`${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `${systemPrompt}

${userPrompt}`
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 4e3,
              responseMimeType: "application/json"
              // Request JSON response
            }
          }),
          signal
        }),
        this.timeout,
        this.providerName
      );
      await handleResponseError(response, this.providerName);
      const data = await response.json();
      const content = extractContent(
        data,
        ["candidates", "0", "content", "parts", "0", "text"],
        this.providerName
      );
      const validated = parseAndValidate(content);
      return validated;
    } catch (error) {
      if (error instanceof AiProviderError || error instanceof AiValidationError || error instanceof Error && error.constructor.name === "AiTimeoutError") {
        throw error;
      }
      handleNetworkError(error, this.providerName);
    }
  }
}

class MockProvider {
  delay;
  constructor(config) {
    this.delay = config?.timeout ? config.timeout / 10 : 1500;
  }
  async generateRecipe(prompt, profile, lang) {
    await this.sleep(this.delay + Math.random() * 500);
    const recipe = this.createMockRecipe(prompt, profile, lang);
    return recipe;
  }
  /**
   * Create a realistic mock recipe based on prompt
   */
  createMockRecipe(prompt, profile, lang) {
    const lowerPrompt = prompt.toLowerCase();
    let recipeType = "pasta";
    let cuisine = "Italian";
    let difficulty = "easy";
    if (lowerPrompt.includes("pasta")) {
      recipeType = "pasta";
      cuisine = "Italian";
    } else if (lowerPrompt.includes("curry")) {
      recipeType = "curry";
      cuisine = "Indian";
    } else if (lowerPrompt.includes("stir fry") || lowerPrompt.includes("stir-fry")) {
      recipeType = "stir-fry";
      cuisine = "Asian";
    } else if (lowerPrompt.includes("salad")) {
      recipeType = "salad";
      cuisine = "Mediterranean";
    } else if (lowerPrompt.includes("soup")) {
      recipeType = "soup";
      cuisine = "International";
    } else if (lowerPrompt.includes("burger")) {
      recipeType = "burger";
      cuisine = "American";
    } else if (lowerPrompt.includes("taco")) {
      recipeType = "taco";
      cuisine = "Mexican";
    }
    if (lowerPrompt.includes("quick") || lowerPrompt.includes("easy") || lowerPrompt.includes("simple")) {
      difficulty = "easy";
    } else if (lowerPrompt.includes("medium") || lowerPrompt.includes("intermediate")) {
      difficulty = "medium";
    } else if (lowerPrompt.includes("hard") || lowerPrompt.includes("complex") || lowerPrompt.includes("advanced")) {
      difficulty = "hard";
    }
    const recipe = this.getRecipeTemplate(recipeType, cuisine, difficulty);
    if (profile) {
      this.adjustForDietaryPreferences(recipe, profile);
    }
    return recipe;
  }
  /**
   * Get recipe template based on type
   */
  getRecipeTemplate(type, cuisine, difficulty) {
    const templates = {
      pasta: {
        title: "Creamy Garlic Pasta",
        summary: "Quick and delicious pasta with a creamy garlic sauce",
        description: "A simple yet flavorful pasta dish featuring al dente spaghetti tossed in a rich, creamy garlic sauce with fresh herbs and parmesan cheese.",
        prep_time_minutes: 10,
        cook_time_minutes: 15,
        servings: 4,
        difficulty,
        cuisine,
        ingredients: [
          "400g spaghetti",
          "4 cloves garlic, minced",
          "200ml heavy cream",
          "50g butter",
          "100g parmesan cheese, grated",
          "Fresh parsley, chopped",
          "Salt and pepper to taste",
          "Olive oil"
        ],
        instructions: [
          "Bring a large pot of salted water to boil and cook spaghetti according to package directions",
          "While pasta cooks, melt butter in a large pan over medium heat",
          "Add minced garlic and sauté for 1-2 minutes until fragrant",
          "Pour in heavy cream and simmer for 3-4 minutes until slightly thickened",
          "Drain pasta, reserving 1 cup of pasta water",
          "Add pasta to the sauce and toss to coat, adding pasta water if needed",
          "Stir in parmesan cheese and season with salt and pepper",
          "Garnish with fresh parsley and serve immediately"
        ],
        tags: ["pasta", "italian", "quick", "comfort-food"],
        dietary_info: {
          vegetarian: true,
          vegan: false,
          gluten_free: false,
          dairy_free: false,
          nut_free: true
        },
        nutrition: {
          calories: 520,
          protein_g: 18,
          carbs_g: 68,
          fat_g: 20
        }
      },
      curry: {
        title: "Vegetable Chickpea Curry",
        summary: "Hearty and aromatic curry with vegetables and chickpeas",
        description: "A flavorful and nutritious curry packed with vegetables, chickpeas, and warming spices in a rich coconut milk sauce.",
        prep_time_minutes: 15,
        cook_time_minutes: 30,
        servings: 4,
        difficulty,
        cuisine,
        ingredients: [
          "2 cans (400g each) chickpeas, drained",
          "2 cups mixed vegetables (carrots, bell peppers, cauliflower)",
          "1 can (400ml) coconut milk",
          "1 onion, diced",
          "3 cloves garlic, minced",
          "2 tbsp curry powder",
          "1 tsp cumin",
          "1 tsp turmeric",
          "2 cups vegetable broth",
          "2 tbsp vegetable oil",
          "Fresh cilantro",
          "Salt to taste"
        ],
        instructions: [
          "Heat oil in a large pot over medium heat",
          "Add diced onion and cook until softened, about 5 minutes",
          "Add garlic, curry powder, cumin, and turmeric. Cook for 1 minute until fragrant",
          "Add mixed vegetables and stir to coat with spices",
          "Pour in coconut milk and vegetable broth. Bring to a simmer",
          "Add chickpeas and simmer for 20 minutes until vegetables are tender",
          "Season with salt to taste",
          "Garnish with fresh cilantro and serve with rice or naan"
        ],
        tags: ["curry", "indian", "vegan", "healthy", "one-pot"],
        dietary_info: {
          vegetarian: true,
          vegan: true,
          gluten_free: true,
          dairy_free: true,
          nut_free: true
        },
        nutrition: {
          calories: 380,
          protein_g: 12,
          carbs_g: 45,
          fat_g: 18
        }
      },
      "stir-fry": {
        title: "Quick Vegetable Stir-Fry",
        summary: "Colorful and crunchy vegetable stir-fry with savory sauce",
        description: "A quick and healthy stir-fry loaded with crisp vegetables in a flavorful Asian-inspired sauce.",
        prep_time_minutes: 15,
        cook_time_minutes: 10,
        servings: 4,
        difficulty,
        cuisine,
        ingredients: [
          "2 cups broccoli florets",
          "1 bell pepper, sliced",
          "1 cup snap peas",
          "2 carrots, julienned",
          "3 cloves garlic, minced",
          "1 tbsp fresh ginger, grated",
          "3 tbsp soy sauce",
          "1 tbsp sesame oil",
          "1 tbsp rice vinegar",
          "2 tsp cornstarch",
          "2 tbsp vegetable oil",
          "Sesame seeds for garnish"
        ],
        instructions: [
          "Mix soy sauce, sesame oil, rice vinegar, and cornstarch in a small bowl. Set aside",
          "Heat vegetable oil in a large wok or skillet over high heat",
          "Add garlic and ginger, stir-fry for 30 seconds",
          "Add carrots and broccoli, stir-fry for 3 minutes",
          "Add bell pepper and snap peas, stir-fry for 2 more minutes",
          "Pour in the sauce and toss everything together for 1-2 minutes until sauce thickens",
          "Remove from heat, garnish with sesame seeds",
          "Serve immediately over rice or noodles"
        ],
        tags: ["stir-fry", "asian", "quick", "healthy", "vegan"],
        dietary_info: {
          vegetarian: true,
          vegan: true,
          gluten_free: false,
          dairy_free: true,
          nut_free: true
        },
        nutrition: {
          calories: 180,
          protein_g: 6,
          carbs_g: 22,
          fat_g: 9
        }
      },
      salad: {
        title: "Mediterranean Quinoa Salad",
        summary: "Fresh and healthy quinoa salad with Mediterranean flavors",
        description: "A nutritious and colorful salad combining fluffy quinoa with fresh vegetables, olives, and a tangy lemon dressing.",
        prep_time_minutes: 15,
        cook_time_minutes: 20,
        servings: 4,
        difficulty,
        cuisine,
        ingredients: [
          "1 cup quinoa, uncooked",
          "2 cups water",
          "1 cucumber, diced",
          "2 tomatoes, diced",
          "1/2 red onion, finely chopped",
          "1/2 cup kalamata olives, halved",
          "100g feta cheese, crumbled",
          "1/4 cup fresh parsley, chopped",
          "3 tbsp olive oil",
          "2 tbsp lemon juice",
          "1 tsp dried oregano",
          "Salt and pepper to taste"
        ],
        instructions: [
          "Rinse quinoa under cold water",
          "Combine quinoa and water in a pot, bring to boil",
          "Reduce heat, cover, and simmer for 15 minutes until water is absorbed",
          "Remove from heat and let stand covered for 5 minutes, then fluff with fork",
          "Let quinoa cool to room temperature",
          "In a large bowl, combine cooled quinoa, cucumber, tomatoes, onion, and olives",
          "Whisk together olive oil, lemon juice, oregano, salt, and pepper",
          "Pour dressing over salad and toss to combine",
          "Top with feta cheese and fresh parsley before serving"
        ],
        tags: ["salad", "mediterranean", "healthy", "vegetarian", "meal-prep"],
        dietary_info: {
          vegetarian: true,
          vegan: false,
          gluten_free: true,
          dairy_free: false,
          nut_free: true
        },
        nutrition: {
          calories: 320,
          protein_g: 10,
          carbs_g: 38,
          fat_g: 15
        }
      },
      soup: {
        title: "Hearty Vegetable Soup",
        summary: "Comforting and nutritious vegetable soup",
        description: "A wholesome soup packed with seasonal vegetables in a flavorful herb-infused broth.",
        prep_time_minutes: 15,
        cook_time_minutes: 35,
        servings: 6,
        difficulty,
        cuisine,
        ingredients: [
          "2 tbsp olive oil",
          "1 onion, diced",
          "3 carrots, diced",
          "3 celery stalks, diced",
          "3 cloves garlic, minced",
          "1 can (400g) diced tomatoes",
          "6 cups vegetable broth",
          "2 potatoes, diced",
          "1 zucchini, diced",
          "1 cup green beans, chopped",
          "1 tsp dried thyme",
          "1 tsp dried basil",
          "2 bay leaves",
          "Salt and pepper to taste",
          "Fresh parsley for garnish"
        ],
        instructions: [
          "Heat olive oil in a large pot over medium heat",
          "Add onion, carrots, and celery. Cook for 5-7 minutes until softened",
          "Add garlic and cook for 1 minute until fragrant",
          "Add diced tomatoes, vegetable broth, potatoes, thyme, basil, and bay leaves",
          "Bring to a boil, then reduce heat and simmer for 15 minutes",
          "Add zucchini and green beans. Simmer for another 10-15 minutes",
          "Remove bay leaves and season with salt and pepper",
          "Garnish with fresh parsley and serve hot with crusty bread"
        ],
        tags: ["soup", "healthy", "comfort-food", "vegan", "one-pot"],
        dietary_info: {
          vegetarian: true,
          vegan: true,
          gluten_free: true,
          dairy_free: true,
          nut_free: true
        },
        nutrition: {
          calories: 150,
          protein_g: 4,
          carbs_g: 28,
          fat_g: 5
        }
      },
      burger: {
        title: "Classic Veggie Burger",
        summary: "Delicious plant-based burger with all the fixings",
        description: "A hearty vegetarian burger made with black beans and vegetables, topped with your favorite fixings.",
        prep_time_minutes: 20,
        cook_time_minutes: 15,
        servings: 4,
        difficulty,
        cuisine,
        ingredients: [
          "1 can (400g) black beans, drained and mashed",
          "1/2 cup breadcrumbs",
          "1/4 cup onion, finely chopped",
          "1 clove garlic, minced",
          "1 tsp cumin",
          "1 tsp paprika",
          "1 egg (or flax egg for vegan)",
          "Salt and pepper to taste",
          "4 burger buns",
          "Lettuce, tomato, onion for topping",
          "Your favorite condiments",
          "Vegetable oil for cooking"
        ],
        instructions: [
          "In a large bowl, mash black beans with a fork until mostly smooth",
          "Add breadcrumbs, onion, garlic, cumin, paprika, egg, salt, and pepper",
          "Mix well until combined and mixture holds together",
          "Form into 4 equal patties",
          "Heat oil in a large skillet over medium heat",
          "Cook patties for 5-6 minutes per side until crispy and heated through",
          "Toast burger buns if desired",
          "Assemble burgers with patties and your favorite toppings",
          "Serve immediately with a side of fries or salad"
        ],
        tags: ["burger", "vegetarian", "american", "comfort-food"],
        dietary_info: {
          vegetarian: true,
          vegan: false,
          gluten_free: false,
          dairy_free: true,
          nut_free: true
        },
        nutrition: {
          calories: 320,
          protein_g: 14,
          carbs_g: 52,
          fat_g: 7
        }
      },
      taco: {
        title: "Easy Bean Tacos",
        summary: "Quick and flavorful tacos with seasoned beans",
        description: "Simple and delicious tacos filled with seasoned black beans and fresh toppings.",
        prep_time_minutes: 10,
        cook_time_minutes: 15,
        servings: 4,
        difficulty,
        cuisine,
        ingredients: [
          "2 cans (400g each) black beans, drained",
          "1 tbsp olive oil",
          "1 onion, diced",
          "2 cloves garlic, minced",
          "1 tbsp chili powder",
          "1 tsp cumin",
          "1/2 tsp paprika",
          "8 small tortillas",
          "1 cup lettuce, shredded",
          "1 tomato, diced",
          "1/2 cup corn kernels",
          "1/4 cup cilantro, chopped",
          "Lime wedges",
          "Salsa and sour cream for serving"
        ],
        instructions: [
          "Heat olive oil in a pan over medium heat",
          "Add diced onion and cook until softened, about 5 minutes",
          "Add garlic, chili powder, cumin, and paprika. Cook for 1 minute",
          "Add black beans and 1/4 cup water. Simmer for 10 minutes, mashing some beans",
          "Warm tortillas in a dry skillet or microwave",
          "Fill each tortilla with seasoned beans",
          "Top with lettuce, tomato, corn, and cilantro",
          "Serve with lime wedges, salsa, and sour cream"
        ],
        tags: ["tacos", "mexican", "quick", "vegetarian", "family-friendly"],
        dietary_info: {
          vegetarian: true,
          vegan: false,
          gluten_free: false,
          dairy_free: false,
          nut_free: true
        },
        nutrition: {
          calories: 380,
          protein_g: 16,
          carbs_g: 62,
          fat_g: 8
        }
      }
    };
    return templates[type] || templates.pasta;
  }
  /**
   * Adjust recipe based on user's dietary preferences
   */
  adjustForDietaryPreferences(recipe, profile) {
    if (profile.diet_type === "vegan") {
      recipe.dietary_info = recipe.dietary_info || {};
      recipe.dietary_info.vegan = true;
      recipe.dietary_info.vegetarian = true;
      recipe.dietary_info.dairy_free = true;
    } else if (profile.diet_type === "vegetarian") {
      recipe.dietary_info = recipe.dietary_info || {};
      recipe.dietary_info.vegetarian = true;
    } else if (profile.diet_type === "gluten_free") {
      recipe.dietary_info = recipe.dietary_info || {};
      recipe.dietary_info.gluten_free = true;
    } else if (profile.diet_type === "dairy_free") {
      recipe.dietary_info = recipe.dietary_info || {};
      recipe.dietary_info.dairy_free = true;
    }
    if (profile.disliked_ingredients && profile.disliked_ingredients.length > 0) {
      const ingredientsNote = `

Note: This recipe avoids: ${profile.disliked_ingredients.join(", ")}`;
      recipe.description = (recipe.description || "") + ingredientsNote;
    }
    if (profile.preferred_cuisines && profile.preferred_cuisines.length > 0) {
      const cuisinesNote = `

Preferred cuisines: ${profile.preferred_cuisines.join(", ")}`;
      recipe.description = (recipe.description || "") + cuisinesNote;
    }
    if (profile.diet_type && !recipe.tags?.includes(profile.diet_type)) {
      recipe.tags = [...recipe.tags || [], profile.diet_type];
    }
  }
  /**
   * Sleep utility for simulating delay
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

class AiService {
  provider;
  maxRetries;
  retryDelay = 500;
  // Base delay in ms for exponential backoff
  constructor(config) {
    this.maxRetries = config.maxRetries ?? 1;
    switch (config.provider) {
      case "mock":
        this.provider = new MockProvider({
          timeout: config.timeout
        });
        break;
      case "openrouter":
        if (!config.apiKey) {
          throw new Error("API key is required for OpenRouter provider");
        }
        this.provider = new OpenRouterProvider({
          apiKey: config.apiKey,
          model: config.model,
          timeout: config.timeout
        });
        break;
      case "google":
        if (!config.apiKey) {
          throw new Error("API key is required for Google provider");
        }
        this.provider = new GoogleProvider({
          apiKey: config.apiKey,
          model: config.model,
          timeout: config.timeout
        });
        break;
      default:
        throw new Error(`Unknown AI provider: ${config.provider}`);
    }
  }
  /**
   * Generate a recipe with retry logic
   * @param prompt - User's recipe request
   * @param profile - User's profile with dietary preferences (optional)
   * @param lang - Language override (optional, defaults to profile.preferred_language or DEFAULT_LANGUAGE)
   * @returns Generated recipe matching RecipeSchema
   */
  async generateRecipe(prompt, profile, lang) {
    const recipeLanguage = lang ?? profile?.preferred_language ?? DEFAULT_LANGUAGE;
    let lastError;
    let attempt = 0;
    const maxAttempts = this.maxRetries + 1;
    while (attempt < maxAttempts) {
      try {
        console.log(`AI generation attempt ${attempt + 1}/${maxAttempts} (language: ${recipeLanguage})`);
        const recipe = await this.provider.generateRecipe(prompt, profile, recipeLanguage);
        this.validateRecipeSize(recipe);
        return recipe;
      } catch (error) {
        lastError = error;
        attempt++;
        const isRetryable = error instanceof AiError && error.isRetryable;
        if (!isRetryable || attempt >= maxAttempts) {
          break;
        }
        const delay = this.calculateBackoff(attempt);
        console.log(`AI request failed (retryable), waiting ${delay}ms before retry...`);
        await this.sleep(delay);
      }
    }
    throw lastError || new Error("AI generation failed with unknown error");
  }
  /**
   * Validate recipe size doesn't exceed 200KB limit
   * Throws error if size exceeded
   */
  validateRecipeSize(recipe) {
    const json = JSON.stringify(recipe);
    const sizeBytes = Buffer.byteLength(json, "utf8");
    const maxBytes = 200 * 1024;
    if (sizeBytes > maxBytes) {
      throw new Error(`Generated recipe exceeds size limit: ${sizeBytes} bytes (max ${maxBytes} bytes)`);
    }
  }
  /**
   * Calculate exponential backoff with jitter
   */
  calculateBackoff(attempt) {
    const baseDelay = this.retryDelay;
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.3 * exponentialDelay;
    return Math.min(exponentialDelay + jitter, 5e3);
  }
  /**
   * Sleep utility for retry delays
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  /**
   * Factory method to create AiService from environment variables
   */
  static fromEnv() {
    const provider = "google";
    const apiKey = "AIzaSyC1QyJ5q60CYbASvf7t4isyYWz0hmG_l5w";
    return new AiService({
      provider,
      apiKey,
      model: "gemini-2.5-flash",
      timeout: void 0
    });
  }
}

const prerender = false;
const POST = async ({ request }) => {
  const requestId = v4();
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonError(401, "Unauthorized", "Missing or invalid authorization header", void 0, requestId);
    }
    const token = authHeader.replace("Bearer ", "").trim();
    const supabase = createClient("https://oefboqgqosdzebdheypd.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lZmJvcWdxb3NkemViZGhleXBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5ODY1MjIsImV4cCI6MjA3NTU2MjUyMn0.ByADk4BoOO1c6CwlYCydfhYmeDNp2YyUhBMg12t1BdM", {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      return jsonError(401, "Unauthorized", "Invalid or expired token", void 0, requestId);
    }
    const userId = userData.user.id;
    const eventsService = new EventsService(supabase);
    try {
      const generationCount = await eventsService.countEventsInWindow(
        userId,
        "ai_recipe_generated",
        60
        // 1 hour window
      );
      if (generationCount >= 10) {
        return jsonError(
          429,
          "Too Many Requests",
          "Generation limit exceeded. Please try again later.",
          { retry_after: 3600 },
          requestId
        );
      }
    } catch (error) {
      console.error("Rate limit check failed:", error);
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonError(400, "Bad Request", "Invalid JSON in request body", void 0, requestId);
    }
    const validation = GenerateRecipeCommandSchema.safeParse(body);
    if (!validation.success) {
      const details = validation.error.errors.reduce(
        (acc, err) => {
          const field = err.path.join(".");
          acc[field] = err.message;
          return acc;
        },
        {}
      );
      return jsonError(400, "Bad Request", "Validation failed", details, requestId);
    }
    const { prompt, lang } = validation.data;
    let profile;
    try {
      const { data: profileData } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
      profile = profileData || void 0;
    } catch {
      console.log("No profile found for user, continuing without preferences");
    }
    const finalLang = lang ?? profile?.preferred_language ?? "en";
    try {
      await eventsService.createEvent(userId, {
        type: "ai_prompt_sent",
        payload: {
          prompt_preview: EventsService.truncatePrompt(prompt, 256),
          language: finalLang,
          request_id: requestId,
          model: "gemini-2.5-flash"
        }
      });
    } catch (error) {
      console.error("Failed to log ai_prompt_sent event:", error);
    }
    let recipe;
    try {
      const aiService = AiService.fromEnv();
      recipe = await aiService.generateRecipe(prompt, profile, finalLang);
    } catch (error) {
      if (error instanceof AiTimeoutError) {
        return jsonError(503, "Service Unavailable", "AI service timed out. Please try again.", void 0, requestId);
      }
      if (error instanceof AiProviderError) {
        const statusCode = error.statusCode && error.statusCode >= 500 ? 503 : 500;
        return jsonError(
          statusCode,
          statusCode === 503 ? "Service Unavailable" : "Internal Server Error",
          "Failed to generate recipe. Please try again.",
          void 0,
          requestId
        );
      }
      if (error instanceof Error && error.message.includes("exceeds size limit")) {
        return jsonError(
          413,
          "Payload Too Large",
          "Generated recipe is too large. Please try a simpler prompt.",
          void 0,
          requestId
        );
      }
      console.error("AI generation failed:", error);
      return jsonError(
        500,
        "Internal Server Error",
        "Failed to generate recipe. Please try again.",
        void 0,
        requestId
      );
    }
    const generationId = v4();
    try {
      await eventsService.createEvent(userId, {
        type: "ai_recipe_generated",
        payload: {
          generation_id: generationId,
          title: recipe.title,
          tags: recipe.tags || [],
          language: finalLang,
          request_id: requestId
        }
      });
    } catch (error) {
      console.error("Failed to log ai_recipe_generated event:", error);
    }
    const response = {
      recipe,
      generation_id: generationId,
      generated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Language": finalLang
      }
    });
  } catch (error) {
    console.error("Unexpected error in /api/recipes/generate:", error);
    return jsonError(500, "Internal Server Error", "An unexpected error occurred", void 0, requestId);
  }
};
function jsonError(status, error, message, details, requestId) {
  const body = {
    error,
    message,
    details,
    request_id: requestId
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
