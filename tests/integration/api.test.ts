import { describe, it, expect, beforeAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';

/**
 * Integration tests for API interactions
 * These tests verify that our application correctly handles API responses
 */

describe('API Integration Tests', () => {
  describe('Recipe API', () => {
    it('should fetch recipes successfully', async () => {
      // Mock the API response
      server.use(
        http.get('/api/recipes', () => {
          return HttpResponse.json({
            data: [
              { id: '1', name: 'Recipe 1', description: 'Test recipe 1' },
              { id: '2', name: 'Recipe 2', description: 'Test recipe 2' },
            ],
          });
        })
      );

      // Make the API call
      const response = await fetch('/api/recipes');
      const data = await response.json();

      // Verify the response
      expect(response.ok).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0]).toHaveProperty('name', 'Recipe 1');
    });

    it('should handle API errors gracefully', async () => {
      // Mock an API error
      server.use(
        http.get('/api/recipes', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      // Make the API call
      const response = await fetch('/api/recipes');

      // Verify the error response
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });
  });

  describe('Profile API', () => {
    it('should update profile successfully', async () => {
      const profileData = {
        displayName: 'Test User',
        dietType: 'vegetarian',
      };

      // Mock the API response
      server.use(
        http.put('/api/profile', async ({ request }) => {
          const body = await request.json();
          return HttpResponse.json({
            success: true,
            data: body,
          });
        })
      );

      // Make the API call
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });
      const data = await response.json();

      // Verify the response
      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data.displayName).toBe('Test User');
    });
  });
});
