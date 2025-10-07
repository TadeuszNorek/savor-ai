# SavorAI

SavorAI is a web application that combines AI-powered recipe generation with a convenient personal catalog, allowing users to discover, create, and organize recipes that perfectly match their dietary needs and preferences.

## Project Description

Many users struggle to find recipes that align with their specific diet, allergies, or taste. SavorAI solves this by providing an intelligent platform where users can define their food profile and generate tailored recipes using AI. These recipes can be saved to a private collection, creating a personalized cookbook that is easy to search and browse.

## Tech Stack

| Category      | Technology                                       |
|---------------|--------------------------------------------------|
| **Frontend**  | Astro, React (for interactive islands), TypeScript |
| **Styling**   | Tailwind CSS, shadcn/ui                          |
| **Backend**   | Supabase (PostgreSQL, Authentication, RLS)       |
| **AI**        | Google Gemini                                    |
| **DevOps**    | GitHub Actions, Docker, DigitalOcean             |

## Getting Started Locally

Follow these steps to set up and run the project on your local machine.

### Prerequisites

- **Node.js**: Version `22.14.0` is required. We recommend using a version manager like [nvm](https://github.com/nvm-sh/nvm) to ensure compatibility.
  ```bash
  nvm use
  ```

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/savor-ai.git
    cd savor-ai
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file by copying the example file.
    ```bash
    cp .env.example .env
    ```
    Open the `.env` file and add your credentials for Supabase and the Google Gemini API.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:4321`.

## Available Scripts

This project includes several scripts to help with development:

- `npm run dev`: Starts the development server with hot-reloading.
- `npm run build`: Builds the application for production.
- `npm run preview`: Serves the production build locally for testing.
- `npm run astro`: access the Astro CLI directly.
- `npm run lint`: Lints the codebase using ESLint to check for errors and style issues.
- `npm run lint:fix`: fix lint issues where possible.
- `npm run format`: Formats all project files using Prettier.

## Project Scope (MVP)

The current scope is focused on delivering a Minimum Viable Product (MVP) with the following core features:

- **AI Recipe Generation**: Generate a single recipe at a time based on a user's profile (diet, dislikes, preferred cuisines).
- **Personal Recipe Collection**: Save generated recipes to a private, user-specific collection.
- **Search and Filter**: Perform full-text search on titles and ingredients, and filter recipes by tags.
- **User Profile**: Manage dietary preferences and application settings like dark mode.
- **Authentication**: Secure user registration and login.

**Out of Scope for MVP**: Features like interactive recipe-building chat, automatic preference learning, recipe import/editing, and social sharing are planned for future releases.

## Project Status

This project is currently in the **MVP development phase**.

## License

The license for this project is yet to be determined.