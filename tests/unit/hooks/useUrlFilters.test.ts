import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUrlFilters } from '@/lib/hooks/useUrlFilters';

// Mock window.location
const originalLocation = window.location;
const mockPushState = vi.fn();
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

describe('useUrlFilters hook', () => {
  beforeEach(() => {
    // Mock window.location
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      search: '',
      pathname: '/recipes',
    };

    // Mock history
    window.history.pushState = mockPushState;
    window.addEventListener = mockAddEventListener;
    window.removeEventListener = mockRemoveEventListener;

    vi.clearAllMocks();
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  describe('initialization', () => {
    it('should initialize with default filters when URL has no params', () => {
      window.location.search = '';

      const { result } = renderHook(() => useUrlFilters());

      expect(result.current.filters).toEqual({
        search: '',
        tags: [],
        sort: 'recent',
        limit: 20,
        offset: 0,
      });
    });

    it('should initialize with search param from URL', () => {
      window.location.search = '?search=pasta';

      const { result } = renderHook(() => useUrlFilters());

      expect(result.current.filters.search).toBe('pasta');
    });

    it('should initialize with tags param from URL', () => {
      window.location.search = '?tags=italian,vegetarian';

      const { result } = renderHook(() => useUrlFilters());

      expect(result.current.filters.tags).toEqual(['italian', 'vegetarian']);
    });

    it('should initialize with sort param from URL', () => {
      window.location.search = '?sort=oldest';

      const { result } = renderHook(() => useUrlFilters());

      expect(result.current.filters.sort).toBe('oldest');
    });

    it('should initialize with limit param from URL', () => {
      window.location.search = '?limit=50';

      const { result } = renderHook(() => useUrlFilters());

      expect(result.current.filters.limit).toBe(50);
    });

    it('should initialize with offset param from URL', () => {
      window.location.search = '?offset=20';

      const { result } = renderHook(() => useUrlFilters());

      expect(result.current.filters.offset).toBe(20);
    });

    it('should initialize with multiple params from URL', () => {
      window.location.search = '?search=pizza&tags=italian&sort=oldest&limit=10&offset=5';

      const { result } = renderHook(() => useUrlFilters());

      expect(result.current.filters).toEqual({
        search: 'pizza',
        tags: ['italian'],
        sort: 'oldest',
        limit: 10,
        offset: 5,
      });
    });
  });

  describe('setFilters', () => {
    it('should update filters with new values', () => {
      const { result } = renderHook(() => useUrlFilters());

      act(() => {
        result.current.setFilters({
          search: 'sushi',
          tags: ['japanese'],
          sort: 'recent',
          limit: 20,
          offset: 0,
        });
      });

      expect(result.current.filters.search).toBe('sushi');
      expect(result.current.filters.tags).toEqual(['japanese']);
    });

    it('should update URL when filters change', () => {
      const { result } = renderHook(() => useUrlFilters());

      act(() => {
        result.current.setFilters({
          search: 'burger',
          tags: [],
          sort: 'recent',
          limit: 20,
          offset: 0,
        });
      });

      expect(mockPushState).toHaveBeenCalledWith({}, '', '/recipes?search=burger');
    });

    it('should accept updater function', () => {
      const { result } = renderHook(() => useUrlFilters());

      act(() => {
        result.current.setFilters((prev) => ({
          ...prev,
          search: 'updated',
        }));
      });

      expect(result.current.filters.search).toBe('updated');
    });

    it('should update URL with multiple params', () => {
      const { result } = renderHook(() => useUrlFilters());

      act(() => {
        result.current.setFilters({
          search: 'pasta',
          tags: ['italian', 'quick'],
          sort: 'oldest',
          limit: 10,
          offset: 5,
        });
      });

      expect(mockPushState).toHaveBeenCalledWith(
        {},
        '',
        '/recipes?search=pasta&tags=italian%2Cquick&sort=oldest&limit=10&offset=5'
      );
    });

    it('should not include default values in URL', () => {
      const { result } = renderHook(() => useUrlFilters());

      act(() => {
        result.current.setFilters({
          search: '',
          tags: [],
          sort: 'recent',
          limit: 20,
          offset: 0,
        });
      });

      expect(mockPushState).toHaveBeenCalledWith({}, '', '/recipes');
    });
  });

  describe('URL parsing edge cases', () => {
    it('should filter out empty tags', () => {
      window.location.search = '?tags=italian,,vegetarian,';

      const { result } = renderHook(() => useUrlFilters());

      expect(result.current.filters.tags).toEqual(['italian', 'vegetarian']);
    });

    it('should ignore invalid sort values', () => {
      window.location.search = '?sort=invalid';

      const { result } = renderHook(() => useUrlFilters());

      expect(result.current.filters.sort).toBe('recent');
    });

    it('should ignore invalid limit values', () => {
      window.location.search = '?limit=abc';

      const { result } = renderHook(() => useUrlFilters());

      expect(result.current.filters.limit).toBe(20);
    });

    it('should ignore limit values outside valid range', () => {
      window.location.search = '?limit=150';

      const { result } = renderHook(() => useUrlFilters());

      expect(result.current.filters.limit).toBe(20);
    });

    it('should ignore negative offset values', () => {
      window.location.search = '?offset=-5';

      const { result } = renderHook(() => useUrlFilters());

      expect(result.current.filters.offset).toBe(0);
    });

    it('should trim whitespace from search param', () => {
      const { result } = renderHook(() => useUrlFilters());

      act(() => {
        result.current.setFilters({
          search: '  pasta  ',
          tags: [],
          sort: 'recent',
          limit: 20,
          offset: 0,
        });
      });

      expect(mockPushState).toHaveBeenCalledWith({}, '', '/recipes?search=pasta');
    });
  });

  describe('popstate event handling', () => {
    it('should register popstate event listener', () => {
      renderHook(() => useUrlFilters());

      expect(mockAddEventListener).toHaveBeenCalledWith('popstate', expect.any(Function));
    });

    it('should cleanup popstate event listener on unmount', () => {
      const { unmount } = renderHook(() => useUrlFilters());

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith('popstate', expect.any(Function));
    });
  });
});
