/**
 * BUMBA Frontend Deep Expertise
 * Comprehensive knowledge base for frontend specialists
 * Sprint 11 Enhancement
 */

class FrontendExpertise {
  /**
   * React Expertise
   */
  static getReactExpertise() {
    return {
      name: 'React Expert',
      
      expertise: {
        core: {
          version: 'React 18+, Concurrent features, Suspense, Error boundaries',
          hooks: 'useState, useEffect, useContext, useReducer, useMemo, useCallback',
          advanced: 'Custom hooks, useImperativeHandle, useLayoutEffect, useDebugValue',
          patterns: 'Compound components, render props, higher-order components',
          concurrent: 'Concurrent rendering, Suspense, transitions, deferred values'
        },
        
        ecosystem: {
          routing: 'React Router v6+, nested routes, code splitting, lazy loading',
          state: 'Redux Toolkit, Zustand, Jotai, Context API, SWR, React Query',
          styling: 'Styled-components, Emotion, CSS Modules, Tailwind CSS',
          forms: 'React Hook Form, Formik, validation, controlled/uncontrolled',
          testing: 'React Testing Library, Jest, Cypress, Storybook'
        },
        
        performance: {
          optimization: 'React.memo, useMemo, useCallback, lazy loading, code splitting',
          profiling: 'React DevTools Profiler, performance monitoring',
          patterns: 'Virtualization, pagination, debouncing, throttling',
          bundling: 'Webpack, Vite, bundle analysis, tree shaking'
        },
        
        frameworks: {
          nextjs: 'Next.js 13+, App Router, Server Components, API routes',
          gatsby: 'Static site generation, GraphQL, plugins, optimization',
          remix: 'Full-stack React, nested routing, data loading, actions',
          mobile: 'React Native, Expo, cross-platform development'
        },
        
        patterns: {
          architecture: 'Feature-based folder structure, barrel exports, dependency injection',
          components: 'Composition over inheritance, single responsibility, prop drilling solutions',
          hooks: 'Custom hook patterns, useReducer for complex state, effect cleanup',
          performance: 'Memoization patterns, virtual scrolling, image optimization'
        }
      },
      
      capabilities: [
        'Modern React development with hooks and concurrent features',
        'Component architecture and design patterns',
        'State management with Redux Toolkit and modern alternatives',
        'React Router v6+ with advanced routing patterns',
        'Performance optimization and profiling',
        'React testing with Testing Library and Jest',
        'Next.js development with App Router and Server Components',
        'React Native mobile development',
        'Custom hook development and patterns',
        'Accessibility implementation in React',
        'TypeScript integration with React',
        'CSS-in-JS and modern styling solutions',
        'Form handling and validation',
        'Error boundary implementation',
        'Code splitting and lazy loading'
      ],
      
      codePatterns: {
        modernReactComponent: `
// Modern React component with hooks and TypeScript
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface UserSearchProps {
  onUserSelect: (user: User) => void;
  placeholder?: string;
  className?: string;
}

const UserSearch: React.FC<UserSearchProps> = ({
  onUserSelect,
  placeholder = "Search users...",
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setUsers([]);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(\`/api/users/search?q=\${encodeURIComponent(searchQuery)}\`);
        
        if (!response.ok) {
          throw new Error('Failed to search users');
        }
        
        const data = await response.json();
        setUsers(data.users || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );
  
  // Effect for search
  useEffect(() => {
    debouncedSearch(query);
    
    // Cleanup function
    return () => {
      debouncedSearch.cancel();
    };
  }, [query, debouncedSearch]);
  
  // Memoized filtered results
  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase())
    );
  }, [users, query]);
  
  const handleUserClick = useCallback((user: User) => {
    onUserSelect(user);
    setQuery('');
    setUsers([]);
  }, [onUserSelect]);
  
  return (
    <div className={\`relative \${className}\`}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        aria-label="Search for users"
        aria-expanded={filteredUsers.length > 0}
        aria-haspopup="listbox"
      />
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
          {error}
        </div>
      )}
      
      {filteredUsers.length > 0 && (
        <ul
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto z-10"
          role="listbox"
        >
          {filteredUsers.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                onClick={() => handleUserClick(user)}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex items-center space-x-3"
                role="option"
              >
                {user.avatar && (
                  <img
                    src={user.avatar}
                    alt=""
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div>
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserSearch;`,

        customHookPattern: `
// Custom hooks for reusable logic
import { useState, useEffect, useCallback, useRef } from 'react';

// Custom hook for API data fetching
export function useApi<T>(url: string, options?: RequestInit) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const fetchData = useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [url, options]);
  
  useEffect(() => {
    fetchData();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);
  
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);
  
  return { data, loading, error, refetch };
}

// Custom hook for local storage
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(\`Error reading localStorage key "\${key}":\`, error);
      return initialValue;
    }
  });
  
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(\`Error setting localStorage key "\${key}":\`, error);
    }
  }, [key, storedValue]);
  
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(\`Error removing localStorage key "\${key}":\`, error);
    }
  }, [key, initialValue]);
  
  return [storedValue, setValue, removeValue] as const;
}

// Custom hook for debounced value
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

// Custom hook for intersection observer
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options?: IntersectionObserverInit
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      options
    );
    
    observer.observe(element);
    
    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options]);
  
  return isIntersecting;
}`,

        nextjsAppRouter: `
// Next.js 13+ App Router with Server Components
// app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Modern Next.js App',
  description: 'Built with App Router and Server Components',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="bg-white shadow-sm">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold">My App</h1>
              </div>
            </div>
          </nav>
        </header>
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}

// app/users/page.tsx - Server Component
import { Suspense } from 'react';
import UserList from './UserList';
import UserListSkeleton from './UserListSkeleton';

async function getUsers() {
  const res = await fetch('https://jsonplaceholder.typicode.com/users', {
    next: { revalidate: 3600 } // Revalidate every hour
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch users');
  }
  
  return res.json();
}

export default async function UsersPage() {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Users</h1>
        <Suspense fallback={<UserListSkeleton />}>
          <UserList />
        </Suspense>
      </div>
    </div>
  );
}

// app/users/UserList.tsx - Server Component with data fetching
interface User {
  id: number;
  name: string;
  email: string;
  username: string;
}

async function getUsers(): Promise<User[]> {
  const res = await fetch('https://jsonplaceholder.typicode.com/users', {
    next: { revalidate: 3600 }
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch users');
  }
  
  return res.json();
}

export default async function UserList() {
  const users = await getUsers();
  
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {users.map((user) => (
        <div
          key={user.id}
          className="bg-white overflow-hidden shadow rounded-lg"
        >
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {user.name}
            </h3>
            <p className="mt-1 text-sm text-gray-500">@{user.username}</p>
            <p className="mt-2 text-sm text-gray-600">{user.email}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// app/api/users/route.ts - API Route
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  
  try {
    // Simulate API call
    const users = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ];
    
    const filteredUsers = query
      ? users.filter(user => 
          user.name.toLowerCase().includes(query.toLowerCase()) ||
          user.email.toLowerCase().includes(query.toLowerCase())
        )
      : users;
    
    return NextResponse.json({ users: filteredUsers });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }
    
    // Simulate user creation
    const newUser = {
      id: Date.now(),
      name: body.name,
      email: body.email,
      createdAt: new Date().toISOString()
    };
    
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}`,

        stateManagement: `
// Modern state management with Zustand
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        
        // Actions
        login: async (email: string, password: string) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });
          
          try {
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password })
            });
            
            if (!response.ok) {
              throw new Error('Login failed');
            }
            
            const { user, token } = await response.json();
            
            // Store token in localStorage
            localStorage.setItem('token', token);
            
            set((state) => {
              state.user = user;
              state.isAuthenticated = true;
              state.isLoading = false;
            });
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Login failed';
              state.isLoading = false;
            });
          }
        },
        
        logout: () => {
          localStorage.removeItem('token');
          set((state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.error = null;
          });
        },
        
        updateUser: (updates: Partial<User>) => {
          set((state) => {
            if (state.user) {
              Object.assign(state.user, updates);
            }
          });
        },
        
        clearError: () => {
          set((state) => {
            state.error = null;
          });
        }
      })),
      {
        name: 'auth-store',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated
        })
      }
    ),
    { name: 'auth-store' }
  )
);

// React Query for server state management
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

// Custom hooks for posts
export function usePosts() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: async (): Promise<Post[]> => {
      const response = await fetch('/api/posts');
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function usePost(id: number) {
  return useQuery({
    queryKey: ['posts', id],
    queryFn: async (): Promise<Post> => {
      const response = await fetch(\`/api/posts/\${id}\`);
      if (!response.ok) {
        throw new Error('Failed to fetch post');
      }
      return response.json();
    },
    enabled: !!id,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newPost: Omit<Post, 'id'>): Promise<Post> => {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create post');
      }
      
      return response.json();
    },
    onSuccess: (newPost) => {
      // Invalidate and refetch posts
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      
      // Optimistically update the cache
      queryClient.setQueryData(['posts', newPost.id], newPost);
    },
    onError: (error) => {
      console.error('Error creating post:', error);
    }
  });
}

// Usage in component
function PostForm() {
  const createPost = useCreatePost();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createPost.mutate({
      title,
      body,
      userId: 1
    }, {
      onSuccess: () => {
        setTitle('');
        setBody('');
      }
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Post title"
        className="w-full px-3 py-2 border rounded"
        required
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Post content"
        className="w-full px-3 py-2 border rounded h-32"
        required
      />
      <button
        type="submit"
        disabled={createPost.isPending}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {createPost.isPending ? 'Creating...' : 'Create Post'}
      </button>
    </form>
  );
}`,

        testingPatterns: `
// Comprehensive React testing patterns
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import UserSearch from '../UserSearch';

// Test utilities
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    );
  };
}

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('UserSearch Component', () => {
  const mockOnUserSelect = vi.fn();
  const mockUsers = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
  ];
  
  beforeEach(() => {
    mockFetch.mockClear();
    mockOnUserSelect.mockClear();
  });
  
  afterEach(() => {
    vi.clearAllTimers();
  });
  
  it('renders search input with placeholder', () => {
    render(
      <UserSearch onUserSelect={mockOnUserSelect} placeholder="Find users..." />,
      { wrapper: createWrapper() }
    );
    
    expect(screen.getByLabelText(/search for users/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Find users...')).toBeInTheDocument();
  });
  
  it('displays loading state during search', async () => {
    mockFetch.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ users: mockUsers })
        }), 100)
      )
    );
    
    const user = userEvent.setup();
    
    render(<UserSearch onUserSelect={mockOnUserSelect} />, {
      wrapper: createWrapper()
    });
    
    const searchInput = screen.getByLabelText(/search for users/i);
    
    await user.type(searchInput, 'john');
    
    // Check loading state
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });
  
  it('displays search results when available', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ users: mockUsers })
    });
    
    const user = userEvent.setup();
    
    render(<UserSearch onUserSelect={mockOnUserSelect} />, {
      wrapper: createWrapper()
    });
    
    const searchInput = screen.getByLabelText(/search for users/i);
    
    await user.type(searchInput, 'john');
    
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
    
    const listbox = screen.getByRole('listbox');
    const options = within(listbox).getAllByRole('option');
    
    expect(options).toHaveLength(2);
    expect(within(options[0]).getByText('John Doe')).toBeInTheDocument();
    expect(within(options[0]).getByText('john@example.com')).toBeInTheDocument();
  });
  
  it('calls onUserSelect when user is clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ users: mockUsers })
    });
    
    const user = userEvent.setup();
    
    render(<UserSearch onUserSelect={mockOnUserSelect} />, {
      wrapper: createWrapper()
    });
    
    const searchInput = screen.getByLabelText(/search for users/i);
    
    await user.type(searchInput, 'john');
    
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
    
    const firstOption = screen.getAllByRole('option')[0];
    await user.click(firstOption);
    
    expect(mockOnUserSelect).toHaveBeenCalledWith(mockUsers[0]);
    expect(searchInput).toHaveValue('');
  });
  
  it('displays error message when search fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    
    const user = userEvent.setup();
    
    render(<UserSearch onUserSelect={mockOnUserSelect} />, {
      wrapper: createWrapper()
    });
    
    const searchInput = screen.getByLabelText(/search for users/i);
    
    await user.type(searchInput, 'john');
    
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });
  
  it('debounces search input', async () => {
    vi.useFakeTimers();
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ users: mockUsers })
    });
    
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    
    render(<UserSearch onUserSelect={mockOnUserSelect} />, {
      wrapper: createWrapper()
    });
    
    const searchInput = screen.getByLabelText(/search for users/i);
    
    // Type multiple characters quickly
    await user.type(searchInput, 'john');
    
    // Should not have called fetch yet (debounced)
    expect(mockFetch).not.toHaveBeenCalled();
    
    // Advance timers to trigger debounced function
    vi.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
    
    vi.useRealTimers();
  });
  
  it('supports keyboard navigation', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ users: mockUsers })
    });
    
    const user = userEvent.setup();
    
    render(<UserSearch onUserSelect={mockOnUserSelect} />, {
      wrapper: createWrapper()
    });
    
    const searchInput = screen.getByLabelText(/search for users/i);
    
    await user.type(searchInput, 'j');
    
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
    
    // Tab to first option
    await user.keyboard('{Tab}');
    
    const firstOption = screen.getAllByRole('option')[0];
    expect(firstOption).toHaveFocus();
    
    // Press Enter to select
    await user.keyboard('{Enter}');
    
    expect(mockOnUserSelect).toHaveBeenCalledWith(mockUsers[0]);
  });
});

// Integration tests
describe('UserSearch Integration', () => {
  it('integrates with real API endpoint', async () => {
    // This would test against a real or mock API
    const user = userEvent.setup();
    
    render(<UserSearch onUserSelect={vi.fn()} />, {
      wrapper: createWrapper()
    });
    
    const searchInput = screen.getByLabelText(/search for users/i);
    
    await user.type(searchInput, 'test');
    
    // Wait for debounced search
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    }, { timeout: 1000 });
  });
});`
      },
      
      bestPractices: [
        'Use functional components with hooks over class components',
        'Implement proper prop validation with TypeScript or PropTypes',
        'Use React.memo for expensive components that render frequently',
        'Implement proper error boundaries for graceful error handling',
        'Use custom hooks to extract and reuse stateful logic',
        'Implement proper accessibility with ARIA attributes',
        'Use React.Suspense for code splitting and lazy loading',
        'Implement proper form validation and error handling',
        'Use proper key props for list items',
        'Implement debouncing for search and input handling',
        'Use proper state management patterns (local vs global state)',
        'Implement proper loading and error states',
        'Use React DevTools for debugging and profiling',
        'Follow consistent file and folder naming conventions',
        'Write comprehensive tests with React Testing Library'
      ],
      
      systemPromptAdditions: `
You are a React expert specializing in:
- Modern React development with hooks and concurrent features
- Component architecture and design patterns
- State management with Redux Toolkit and modern alternatives
- Performance optimization and profiling
- React testing and quality assurance
- Next.js and full-stack React development
- TypeScript integration with React
- Accessibility implementation

When working with React:
- Use functional components with hooks
- Implement proper TypeScript typing
- Follow React best practices and patterns
- Consider performance implications
- Implement proper error handling
- Write testable and maintainable code
- Use modern React features and concurrent mode
- Implement proper accessibility standards`
    };
  }
  
  /**
   * Vue.js Expertise
   */
  static getVueExpertise() {
    return {
      name: 'Vue.js Expert',
      
      expertise: {
        core: {
          version: 'Vue 3+, Composition API, Options API, TypeScript support',
          reactivity: 'Reactive system, ref, reactive, computed, watch, watchEffect',
          composition: 'Composition API, composables, lifecycle hooks, provide/inject',
          templates: 'Template syntax, directives, slots, scoped slots',
          components: 'Single File Components, component communication, props, events'
        },
        
        ecosystem: {
          routing: 'Vue Router 4+, nested routes, route guards, lazy loading',
          state: 'Pinia, Vuex, composables for state management',
          styling: 'Scoped CSS, CSS Modules, PostCSS, Sass/Less integration',
          forms: 'Form handling, validation, v-model, custom inputs',
          testing: 'Vue Testing Library, Vitest, Cypress, component testing'
        },
        
        performance: {
          optimization: 'v-memo, v-once, keep-alive, lazy loading, tree shaking',
          profiling: 'Vue DevTools, performance monitoring, bundle analysis',
          patterns: 'Virtual scrolling, lazy rendering, component splitting',
          bundling: 'Vite, Webpack, build optimization, code splitting'
        },
        
        frameworks: {
          nuxt: 'Nuxt 3+, SSR, SSG, universal apps, modules',
          quasar: 'Cross-platform development, Material Design',
          gridsome: 'Static site generation, GraphQL data layer',
          ionic: 'Mobile development with Capacitor'
        }
      },
      
      capabilities: [
        'Vue 3 development with Composition API',
        'Component architecture and design patterns',
        'State management with Pinia and Vuex',
        'Vue Router with advanced routing features',
        'Performance optimization and profiling',
        'Vue testing with Testing Library and Vitest',
        'Nuxt.js development for SSR and SSG',
        'TypeScript integration with Vue',
        'Custom directive development',
        'Plugin and composable development',
        'Accessibility implementation',
        'CSS and styling solutions',
        'Form handling and validation',
        'Animation and transitions',
        'Build tooling and optimization'
      ],
      
      bestPractices: [
        'Use Composition API for complex logic and reusability',
        'Implement proper TypeScript typing for props and events',
        'Use Pinia over Vuex for new projects',
        'Implement proper component communication patterns',
        'Use scoped slots for flexible component APIs',
        'Implement proper error handling with errorCaptured',
        'Use v-memo for expensive list rendering',
        'Implement proper accessibility with ARIA attributes',
        'Use provide/inject for deep component trees',
        'Implement proper form validation and error handling',
        'Use Vue DevTools for debugging and profiling',
        'Follow Vue style guide and naming conventions',
        'Write comprehensive tests for components',
        'Use async components for code splitting',
        'Implement proper SEO with meta management'
      ],
      
      systemPromptAdditions: `
You are a Vue.js expert specializing in:
- Vue 3 development with Composition API
- Component architecture and design patterns  
- State management with Pinia and Vuex
- Performance optimization and profiling
- Vue testing and quality assurance
- Nuxt.js for SSR and static site generation
- TypeScript integration with Vue
- Advanced Vue features and patterns

When working with Vue:
- Use Composition API for complex logic
- Implement proper TypeScript typing
- Follow Vue best practices and style guide
- Consider performance implications
- Implement proper error handling
- Write testable and maintainable code
- Use modern Vue 3 features and patterns
- Implement proper accessibility standards`
    };
  }
  
  /**
   * Angular Expertise  
   */
  static getAngularExpertise() {
    return {
      name: 'Angular Expert',
      
      expertise: {
        core: {
          version: 'Angular 17+, TypeScript, decorators, dependency injection',
          components: 'Components, templates, data binding, lifecycle hooks',
          services: 'Services, dependency injection, providers, observables',
          modules: 'NgModules, feature modules, shared modules, lazy loading',
          routing: 'Router, route guards, resolvers, child routes'
        },
        
        ecosystem: {
          rxjs: 'Observables, operators, subjects, reactive programming',
          forms: 'Reactive forms, template-driven forms, validation',
          http: 'HttpClient, interceptors, error handling, caching',
          testing: 'Jasmine, Karma, Protractor, Angular Testing Utilities',
          material: 'Angular Material, CDK, component library'
        },
        
        performance: {
          optimization: 'OnPush strategy, trackBy functions, lazy loading, preloading',
          profiling: 'Angular DevTools, performance monitoring, bundle analysis',
          patterns: 'Virtual scrolling, pagination, async pipes',
          bundling: 'Angular CLI, Webpack, build optimization, tree shaking'
        },
        
        architecture: {
          patterns: 'Feature modules, barrel exports, smart/dumb components',
          state: 'NgRx, Akita, services with subjects, state management',
          scalability: 'Micro-frontends, module federation, large application patterns',
          universal: 'Angular Universal, SSR, prerendering, SEO'
        }
      },
      
      capabilities: [
        'Angular development with TypeScript',
        'Component architecture and design patterns',
        'RxJS and reactive programming',
        'Angular Forms and validation',
        'State management with NgRx',
        'Angular Router and navigation',
        'Angular testing with Jasmine and Karma',
        'Angular Universal for SSR',
        'Custom directive and pipe development',
        'Angular CLI and build optimization',
        'Angular Material implementation',
        'Accessibility with Angular CDK',
        'Micro-frontend architecture',
        'Performance optimization',
        'Enterprise Angular applications'
      ],
      
      bestPractices: [
        'Use OnPush change detection strategy for performance',
        'Implement proper TypeScript typing throughout',
        'Use reactive forms over template-driven forms',
        'Implement proper error handling with observables',
        'Use trackBy functions for *ngFor optimization',
        'Implement proper unsubscription patterns',
        'Use Angular CLI for consistent project structure',
        'Implement proper lazy loading for large applications',
        'Use Angular style guide and linting rules',
        'Implement proper testing strategy with high coverage',
        'Use dependency injection properly',
        'Implement proper accessibility with Angular CDK',
        'Use Angular DevTools for debugging',
        'Follow Angular security best practices',
        'Implement proper state management patterns'
      ],
      
      systemPromptAdditions: `
You are an Angular expert specializing in:
- Angular development with TypeScript
- Component architecture and reactive programming
- RxJS and observable patterns
- State management with NgRx
- Angular testing and quality assurance
- Angular Universal for SSR
- Enterprise-scale Angular applications
- Performance optimization and profiling

When working with Angular:
- Use TypeScript throughout the application
- Implement reactive programming with RxJS
- Follow Angular style guide and best practices
- Use proper dependency injection patterns
- Implement OnPush change detection for performance
- Write comprehensive tests
- Use Angular CLI for consistent development
- Implement proper accessibility standards`
    };
  }
}

module.exports = FrontendExpertise;