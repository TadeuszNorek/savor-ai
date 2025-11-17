/**
 * Translation definitions for SavorAI
 *
 * Structure:
 * - Top level: feature/section (e.g., "common", "generator", "profile")
 * - Nested: specific keys with translations
 *
 * Keep translations concise and consistent.
 */

export interface Translations {
  common: {
    loading: string;
    save: string;
    saving: string;
    cancel: string;
    delete: string;
    deleting: string;
    edit: string;
    close: string;
    search: string;
    filter: string;
    noResults: string;
    error: string;
    success: string;
  };
  header: {
    recipes: string;
    generator: string;
    profile: string;
    signIn: string;
    signOut: string;
  };
  generator: {
    title: string;
    description: string;
    placeholder: string;
    generateButton: string;
    generating: string;
    tipsTitle: string;
    tip1: string;
    tip2: string;
    tip3: string;
  };
  recipePreview: {
    prepTime: string;
    cookTime: string;
    servings: string;
    ingredients: string;
    ingredientsProgress: string; // "{count} of {total}"
    instructions: string;
    stepProgress: string; // "Step {current} of {total}"
    nutrition: string;
    nutritionPerServing: string;
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
    completionMessage: string;
    completionSubtitle: string;
  };
  recipeSave: {
    saveButton: string;
    saveSuccess: string;
    saveError: string;
    dislikedWarning: string;
    updatePreferences: string;
  };
  recipeList: {
    title: string;
    emptyStateTitle: string;
    emptyStateDescription: string;
    emptyStateCta: string;
    searchPlaceholder: string;
    sortRecent: string;
    sortOldest: string;
    sortNameAsc: string;
    sortNameDesc: string;
    loadMore: string;
    loading: string;
  };
  profile: {
    title: string;
    createTitle: string;
    editTitle: string;
    createDescription: string;
    editDescription: string;
    dietTypeLabel: string;
    dietTypeHelper: string;
    dislikedIngredientsLabel: string;
    dislikedIngredientsPlaceholder: string;
    dislikedIngredientsHelper: string;
    dislikedIngredientsLanguageHint: string;
    preferredCuisinesLabel: string;
    preferredCuisinesPlaceholder: string;
    preferredCuisinesHelper: string;
    preferredCuisinesLanguageHint: string;
    atLeastOneFieldRequired: string;
    createButton: string;
    saveButton: string;
    saveSuccess: string;
    saveError: string;
  };
  errors: {
    notFound: string;
    unauthorized: string;
    serverError: string;
    networkError: string;
    validationError: string;
  };
}

export const translations: Record<'pl' | 'en', Translations> = {
  pl: {
    common: {
      loading: 'Ładowanie...',
      save: 'Zapisz',
      saving: 'Zapisywanie...',
      cancel: 'Anuluj',
      delete: 'Usuń',
      deleting: 'Usuwanie...',
      edit: 'Edytuj',
      close: 'Zamknij',
      search: 'Szukaj',
      filter: 'Filtruj',
      noResults: 'Brak wyników',
      error: 'Błąd',
      success: 'Sukces',
    },
    header: {
      recipes: 'Przepisy',
      generator: 'Generator',
      profile: 'Profil',
      signIn: 'Zaloguj się',
      signOut: 'Wyloguj się',
    },
    generator: {
      title: 'Generator Przepisów AI',
      description: 'Opisz przepis, który chcesz stworzyć, a AI wygeneruje szczegółowy przepis dla Ciebie.',
      placeholder: 'Np. "Szybki obiad dla dwóch osób z kurczakiem i warzywami" lub "Wegański deser czekoladowy bez cukru"',
      generateButton: 'Generuj przepis',
      generating: 'Generowanie...',
      tipsTitle: 'Wskazówki:',
      tip1: 'Bądź konkretny - opisz składniki, rodzaj kuchni lub preferencje dietetyczne',
      tip2: 'Możesz określić liczbę porcji, czas przygotowania lub poziom trudności',
      tip3: 'AI stworzy kompletny przepis ze składnikami, instrukcjami i informacjami odżywczymi',
    },
    recipePreview: {
      prepTime: 'Przygotowanie',
      cookTime: 'Gotowanie',
      servings: 'Porcje',
      ingredients: 'Składniki',
      ingredientsProgress: '{count} z {total}',
      instructions: 'Instrukcje',
      stepProgress: 'Krok {current} z {total}',
      nutrition: 'Wartości odżywcze',
      nutritionPerServing: 'na porcję',
      calories: 'Kalorie',
      protein: 'Białko',
      carbs: 'Węglowodany',
      fat: 'Tłuszcze',
      completionMessage: 'Smacznego!',
      completionSubtitle: 'Ukończyłeś ten przepis.',
    },
    recipeSave: {
      saveButton: 'Zapisz przepis',
      saveSuccess: 'Przepis zapisany pomyślnie!',
      saveError: 'Nie udało się zapisać przepisu',
      dislikedWarning: 'Ten przepis zawiera "{ingredient}", który znajduje się na Twojej liście niechcianych składników.',
      updatePreferences: 'Zaktualizuj preferencje dietetyczne',
    },
    recipeList: {
      title: 'Twoje przepisy',
      emptyStateTitle: 'Brak przepisów',
      emptyStateDescription: 'Wybierz przepis z listy lub wygeneruj nowy za pomocą AI, aby go tutaj zobaczyć.',
      emptyStateCta: 'Wygeneruj pierwszy przepis',
      searchPlaceholder: 'Szukaj przepisów...',
      sortRecent: 'Najnowsze',
      sortOldest: 'Najstarsze',
      sortNameAsc: 'Nazwa A-Z',
      sortNameDesc: 'Nazwa Z-A',
      loadMore: 'Załaduj więcej',
      loading: 'Ładowanie przepisów...',
    },
    profile: {
      title: 'Profil',
      createTitle: 'Utwórz profil',
      editTitle: 'Edytuj profil',
      createDescription: 'Ustaw swoje preferencje dietetyczne, aby zacząć.',
      editDescription: 'Zaktualizuj swoje preferencje dietetyczne, aby dostosować rekomendacje.',
      dietTypeLabel: 'Rodzaj diety (opcjonalne)',
      dietTypeHelper: 'Wybierz swoją preferencję dietetyczną, aby odpowiednio filtrować przepisy.',
      dislikedIngredientsLabel: 'Niechciane składniki (opcjonalne)',
      dislikedIngredientsPlaceholder: 'Dodaj składniki, których chcesz unikać...',
      dislikedIngredientsHelper: 'Przepisy zawierające te składniki zostaną zablokowane przed zapisaniem.',
      dislikedIngredientsLanguageHint: 'Wprowadź w języku polskim (obecny język interfejsu).',
      preferredCuisinesLabel: 'Preferowane kuchnie (opcjonalne)',
      preferredCuisinesPlaceholder: 'Dodaj kuchnie, które lubisz...',
      preferredCuisinesHelper: 'Będziemy priorytetyzować przepisy z tych kuchni w Twoich rekomendacjach.',
      preferredCuisinesLanguageHint: 'Wprowadź w języku polskim (obecny język interfejsu).',
      atLeastOneFieldRequired: 'Proszę wypełnić przynajmniej jedno pole, aby zapisać profil.',
      createButton: 'Utwórz profil',
      saveButton: 'Zapisz zmiany',
      saveSuccess: 'Profil zapisany pomyślnie!',
      saveError: 'Nie udało się zapisać profilu',
    },
    errors: {
      notFound: 'Nie znaleziono',
      unauthorized: 'Brak autoryzacji',
      serverError: 'Błąd serwera',
      networkError: 'Błąd sieci',
      validationError: 'Błąd walidacji',
    },
  },
  en: {
    common: {
      loading: 'Loading...',
      save: 'Save',
      saving: 'Saving...',
      cancel: 'Cancel',
      delete: 'Delete',
      deleting: 'Deleting...',
      edit: 'Edit',
      close: 'Close',
      search: 'Search',
      filter: 'Filter',
      noResults: 'No results',
      error: 'Error',
      success: 'Success',
    },
    header: {
      recipes: 'Recipes',
      generator: 'Generator',
      profile: 'Profile',
      signIn: 'Sign In',
      signOut: 'Sign Out',
    },
    generator: {
      title: 'AI Recipe Generator',
      description: 'Describe the recipe you want to create, and AI will generate a detailed recipe for you.',
      placeholder: 'E.g. "Quick dinner for two with chicken and vegetables" or "Vegan chocolate dessert without sugar"',
      generateButton: 'Generate recipe',
      generating: 'Generating...',
      tipsTitle: 'Tips:',
      tip1: 'Be specific - describe ingredients, cuisine type, or dietary preferences',
      tip2: 'You can specify number of servings, preparation time, or difficulty level',
      tip3: 'AI will create a complete recipe with ingredients, instructions, and nutritional info',
    },
    recipePreview: {
      prepTime: 'Prep',
      cookTime: 'Cook',
      servings: 'Serves',
      ingredients: 'Ingredients',
      ingredientsProgress: '{count} of {total}',
      instructions: 'Instructions',
      stepProgress: 'Step {current} of {total}',
      nutrition: 'Nutrition',
      nutritionPerServing: 'per serving',
      calories: 'Calories',
      protein: 'Protein',
      carbs: 'Carbs',
      fat: 'Fat',
      completionMessage: 'Bon Appétit!',
      completionSubtitle: "You've completed this recipe.",
    },
    recipeSave: {
      saveButton: 'Save recipe',
      saveSuccess: 'Recipe saved successfully!',
      saveError: 'Failed to save recipe',
      dislikedWarning: 'This recipe contains "{ingredient}" which is in your disliked ingredients list.',
      updatePreferences: 'Update dietary preferences',
      },
    recipeList: {
      title: 'Your recipes',
      emptyStateTitle: 'No recipe selected',
      emptyStateDescription: 'Select a recipe from the list or generate a new one using AI to see it here.',
      emptyStateCta: 'Generate first recipe',
      searchPlaceholder: 'Search recipes...',
      sortRecent: 'Recent',
      sortOldest: 'Oldest',
      sortNameAsc: 'Name A-Z',
      sortNameDesc: 'Name Z-A',
      loadMore: 'Load more',
      loading: 'Loading recipes...',
    },
    profile: {
      title: 'Profile',
      createTitle: 'Create Profile',
      editTitle: 'Edit Profile',
      createDescription: 'Set up your dietary preferences to get started.',
      editDescription: 'Update your dietary preferences to refine your recommendations.',
      dietTypeLabel: 'Diet Type (Optional)',
      dietTypeHelper: 'Select your dietary preference to filter recipes accordingly.',
      dislikedIngredientsLabel: 'Disliked Ingredients (Optional)',
      dislikedIngredientsPlaceholder: 'Add ingredients you want to avoid...',
      dislikedIngredientsHelper: 'Recipes containing these ingredients will be blocked from saving.',
      dislikedIngredientsLanguageHint: 'Enter in English (current UI language).',
      preferredCuisinesLabel: 'Preferred Cuisines (Optional)',
      preferredCuisinesPlaceholder: 'Add cuisines you enjoy...',
      preferredCuisinesHelper: "We'll prioritize recipes from these cuisines in your recommendations.",
      preferredCuisinesLanguageHint: 'Enter in English (current UI language).',
      atLeastOneFieldRequired: 'Please fill in at least one field to save your profile.',
      createButton: 'Create Profile',
      saveButton: 'Save Changes',
      saveSuccess: 'Profile saved successfully!',
      saveError: 'Failed to save profile',
    },
    errors: {
      notFound: 'Not found',
      unauthorized: 'Unauthorized',
      serverError: 'Server error',
      networkError: 'Network error',
      validationError: 'Validation error',
    },
  },
};

/**
 * Get nested translation value by dot-separated path
 * @example
 * getTranslation(translations.pl, 'generator.title') // => 'Generator Przepisów AI'
 */
export function getTranslation(
  translations: Translations,
  path: string,
  replacements?: Record<string, string | number>
): string {
  const keys = path.split('.');
  let value: any = translations;

  for (const key of keys) {
    value = value?.[key];
    if (value === undefined) {
      console.warn(`Translation key not found: ${path}`);
      return path; // Return path as fallback
    }
  }

  if (typeof value !== 'string') {
    console.warn(`Translation value is not a string: ${path}`);
    return path;
  }

  // Replace placeholders like {count}, {total}, {ingredient}
  if (replacements) {
    return Object.entries(replacements).reduce((result, [key, val]) => {
      return result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
    }, value);
  }

  return value;
}
