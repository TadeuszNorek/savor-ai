import type { RecipeSchema, ProfileDTO, LanguageCode } from "../../../../types";
import type { AiProvider, AiProviderConfig } from "../types";

/**
 * Mock AI Provider for Development
 * Returns realistic fake recipes without calling external APIs
 * Useful for UI development and testing without API costs
 */
export class MockProvider implements AiProvider {
  private readonly delay: number;

  constructor(config?: Partial<AiProviderConfig>) {
    // Simulate API delay (default 1-2 seconds)
    this.delay = config?.timeout ? config.timeout / 10 : 1500;
  }

  async generateRecipe(prompt: string, profile?: ProfileDTO, lang?: LanguageCode): Promise<RecipeSchema> {
    // Simulate network delay
    await this.sleep(this.delay + Math.random() * 500);

    // Generate mock recipe based on prompt keywords
    const recipe = this.createMockRecipe(prompt, profile, lang);

    return recipe;
  }

  /**
   * Create a realistic mock recipe based on prompt
   */
  private createMockRecipe(prompt: string, profile?: ProfileDTO, lang?: LanguageCode): RecipeSchema {
    const lowerPrompt = prompt.toLowerCase();

    // Detect recipe type from prompt
    let recipeType = "pasta"; // default
    let cuisine = "Italian";
    let difficulty: "easy" | "medium" | "hard" = "easy";

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

    // Detect difficulty from prompt
    if (lowerPrompt.includes("quick") || lowerPrompt.includes("easy") || lowerPrompt.includes("simple")) {
      difficulty = "easy";
    } else if (lowerPrompt.includes("medium") || lowerPrompt.includes("intermediate")) {
      difficulty = "medium";
    } else if (lowerPrompt.includes("hard") || lowerPrompt.includes("complex") || lowerPrompt.includes("advanced")) {
      difficulty = "hard";
    }

    // Get recipe template
    const recipe = this.getRecipeTemplate(recipeType, cuisine, difficulty);

    // Adjust for dietary preferences
    if (profile) {
      this.adjustForDietaryPreferences(recipe, profile);
    }

    return recipe;
  }

  /**
   * Get recipe template based on type
   */
  private getRecipeTemplate(type: string, cuisine: string, difficulty: "easy" | "medium" | "hard"): RecipeSchema {
    const templates: Record<string, RecipeSchema> = {
      pasta: {
        title: "Creamy Garlic Pasta",
        summary: "Quick and delicious pasta with a creamy garlic sauce",
        description:
          "A simple yet flavorful pasta dish featuring al dente spaghetti tossed in a rich, creamy garlic sauce with fresh herbs and parmesan cheese.",
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
          "Olive oil",
        ],
        instructions: [
          "Bring a large pot of salted water to boil and cook spaghetti according to package directions",
          "While pasta cooks, melt butter in a large pan over medium heat",
          "Add minced garlic and sauté for 1-2 minutes until fragrant",
          "Pour in heavy cream and simmer for 3-4 minutes until slightly thickened",
          "Drain pasta, reserving 1 cup of pasta water",
          "Add pasta to the sauce and toss to coat, adding pasta water if needed",
          "Stir in parmesan cheese and season with salt and pepper",
          "Garnish with fresh parsley and serve immediately",
        ],
        tags: ["pasta", "italian", "quick", "comfort-food"],
        dietary_info: {
          vegetarian: true,
          vegan: false,
          gluten_free: false,
          dairy_free: false,
          nut_free: true,
        },
        nutrition: {
          calories: 520,
          protein_g: 18,
          carbs_g: 68,
          fat_g: 20,
        },
      },
      curry: {
        title: "Vegetable Chickpea Curry",
        summary: "Hearty and aromatic curry with vegetables and chickpeas",
        description:
          "A flavorful and nutritious curry packed with vegetables, chickpeas, and warming spices in a rich coconut milk sauce.",
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
          "Salt to taste",
        ],
        instructions: [
          "Heat oil in a large pot over medium heat",
          "Add diced onion and cook until softened, about 5 minutes",
          "Add garlic, curry powder, cumin, and turmeric. Cook for 1 minute until fragrant",
          "Add mixed vegetables and stir to coat with spices",
          "Pour in coconut milk and vegetable broth. Bring to a simmer",
          "Add chickpeas and simmer for 20 minutes until vegetables are tender",
          "Season with salt to taste",
          "Garnish with fresh cilantro and serve with rice or naan",
        ],
        tags: ["curry", "indian", "vegan", "healthy", "one-pot"],
        dietary_info: {
          vegetarian: true,
          vegan: true,
          gluten_free: true,
          dairy_free: true,
          nut_free: true,
        },
        nutrition: {
          calories: 380,
          protein_g: 12,
          carbs_g: 45,
          fat_g: 18,
        },
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
          "Sesame seeds for garnish",
        ],
        instructions: [
          "Mix soy sauce, sesame oil, rice vinegar, and cornstarch in a small bowl. Set aside",
          "Heat vegetable oil in a large wok or skillet over high heat",
          "Add garlic and ginger, stir-fry for 30 seconds",
          "Add carrots and broccoli, stir-fry for 3 minutes",
          "Add bell pepper and snap peas, stir-fry for 2 more minutes",
          "Pour in the sauce and toss everything together for 1-2 minutes until sauce thickens",
          "Remove from heat, garnish with sesame seeds",
          "Serve immediately over rice or noodles",
        ],
        tags: ["stir-fry", "asian", "quick", "healthy", "vegan"],
        dietary_info: {
          vegetarian: true,
          vegan: true,
          gluten_free: false,
          dairy_free: true,
          nut_free: true,
        },
        nutrition: {
          calories: 180,
          protein_g: 6,
          carbs_g: 22,
          fat_g: 9,
        },
      },
      salad: {
        title: "Mediterranean Quinoa Salad",
        summary: "Fresh and healthy quinoa salad with Mediterranean flavors",
        description:
          "A nutritious and colorful salad combining fluffy quinoa with fresh vegetables, olives, and a tangy lemon dressing.",
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
          "Salt and pepper to taste",
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
          "Top with feta cheese and fresh parsley before serving",
        ],
        tags: ["salad", "mediterranean", "healthy", "vegetarian", "meal-prep"],
        dietary_info: {
          vegetarian: true,
          vegan: false,
          gluten_free: true,
          dairy_free: false,
          nut_free: true,
        },
        nutrition: {
          calories: 320,
          protein_g: 10,
          carbs_g: 38,
          fat_g: 15,
        },
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
          "Fresh parsley for garnish",
        ],
        instructions: [
          "Heat olive oil in a large pot over medium heat",
          "Add onion, carrots, and celery. Cook for 5-7 minutes until softened",
          "Add garlic and cook for 1 minute until fragrant",
          "Add diced tomatoes, vegetable broth, potatoes, thyme, basil, and bay leaves",
          "Bring to a boil, then reduce heat and simmer for 15 minutes",
          "Add zucchini and green beans. Simmer for another 10-15 minutes",
          "Remove bay leaves and season with salt and pepper",
          "Garnish with fresh parsley and serve hot with crusty bread",
        ],
        tags: ["soup", "healthy", "comfort-food", "vegan", "one-pot"],
        dietary_info: {
          vegetarian: true,
          vegan: true,
          gluten_free: true,
          dairy_free: true,
          nut_free: true,
        },
        nutrition: {
          calories: 150,
          protein_g: 4,
          carbs_g: 28,
          fat_g: 5,
        },
      },
      burger: {
        title: "Classic Veggie Burger",
        summary: "Delicious plant-based burger with all the fixings",
        description:
          "A hearty vegetarian burger made with black beans and vegetables, topped with your favorite fixings.",
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
          "Vegetable oil for cooking",
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
          "Serve immediately with a side of fries or salad",
        ],
        tags: ["burger", "vegetarian", "american", "comfort-food"],
        dietary_info: {
          vegetarian: true,
          vegan: false,
          gluten_free: false,
          dairy_free: true,
          nut_free: true,
        },
        nutrition: {
          calories: 320,
          protein_g: 14,
          carbs_g: 52,
          fat_g: 7,
        },
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
          "Salsa and sour cream for serving",
        ],
        instructions: [
          "Heat olive oil in a pan over medium heat",
          "Add diced onion and cook until softened, about 5 minutes",
          "Add garlic, chili powder, cumin, and paprika. Cook for 1 minute",
          "Add black beans and 1/4 cup water. Simmer for 10 minutes, mashing some beans",
          "Warm tortillas in a dry skillet or microwave",
          "Fill each tortilla with seasoned beans",
          "Top with lettuce, tomato, corn, and cilantro",
          "Serve with lime wedges, salsa, and sour cream",
        ],
        tags: ["tacos", "mexican", "quick", "vegetarian", "family-friendly"],
        dietary_info: {
          vegetarian: true,
          vegan: false,
          gluten_free: false,
          dairy_free: false,
          nut_free: true,
        },
        nutrition: {
          calories: 380,
          protein_g: 16,
          carbs_g: 62,
          fat_g: 8,
        },
      },
    };

    return templates[type] || templates.pasta;
  }

  /**
   * Adjust recipe based on user's dietary preferences
   */
  private adjustForDietaryPreferences(recipe: RecipeSchema, profile: ProfileDTO): void {
    // Set dietary flags based on profile
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

    // Add note about disliked ingredients if present
    if (profile.disliked_ingredients && profile.disliked_ingredients.length > 0) {
      const ingredientsNote = `\n\nNote: This recipe avoids: ${profile.disliked_ingredients.join(", ")}`;
      recipe.description = (recipe.description || "") + ingredientsNote;
    }

    // Add preferred cuisines note if present
    if (profile.preferred_cuisines && profile.preferred_cuisines.length > 0) {
      const cuisinesNote = `\n\nPreferred cuisines: ${profile.preferred_cuisines.join(", ")}`;
      recipe.description = (recipe.description || "") + cuisinesNote;
    }

    // Add diet tag
    if (profile.diet_type && !recipe.tags?.includes(profile.diet_type)) {
      recipe.tags = [...(recipe.tags || []), profile.diet_type];
    }
  }

  /**
   * Sleep utility for simulating delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
