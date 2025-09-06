# Navigation-Aware and Data-Aware Loader System Implementation

## Overview

This document outlines the implementation of a comprehensive loading system that replaces hardcoded loaders with navigation-aware and data-aware loading states. The system provides real-time feedback for both route changes and API data fetching.

## Key Components

### 1. LoadingProvider (`src/components/providers/LoadingProvider.tsx`)

**Features:**
- **Navigation Detection**: Automatically detects route changes using `usePathname()` hook
- **Progress Animation**: Smooth progress bar with realistic loading simulation
- **Data Loading Integration**: Integrates with TanStack Query for API loading states
- **Backward Compatibility**: Maintains legacy loading methods for existing code
- **Safety Mechanisms**: Timeout protection to prevent infinite loading states

**Key Methods:**
```typescript
// Legacy support
showLoader(message?: string)
hideLoader()
showNavigation()
hideNavigation()

// New data-aware methods
useDataQuery<T>(queryKey, queryFn, options)
useDataMutation<TData, TVariables>(mutationFn, options)
```

### 2. GlobalLoader (`src/components/GlobalLoader.tsx`)

**Features:**
- **Navigation Progress Bar**: Top-of-screen progress indicator with glow effect
- **Data Loading Indicator**: Floating notification for API operations
- **Conditional Rendering**: Only shows when loading states are active
- **Responsive Design**: Adapts to different screen sizes

**Visual Elements:**
- Navigation: Blue progress bar at top of screen
- Data Loading: Floating card with spinner in top-right corner

### 3. Universal Loader Component (`src/components/ui/Loader.tsx`)

**Variants:**
- `spinner`: Classic spinning circle
- `dots`: Three bouncing dots
- `pulse`: Pulsing circle
- `bars`: Animated bars

**Specialized Components:**
- `NavigationLoader`: For route change progress
- `PageLoader`: For App Router loading states
- `InlineLoader`: For component-level loading
- `ButtonLoader`: For button loading states

### 4. App Router Loading Pages

Created `loading.tsx` files for all major routes:
- `src/app/(dashboard)/loading.tsx`
- `src/app/(admin)/loading.tsx`
- `src/app/(teacher)/loading.tsx`
- `src/app/(student)/loading.tsx`
- `src/app/(parent)/loading.tsx`

## Implementation Details

### Navigation Loading Flow

1. **Route Change Detection**: `usePathname()` hook detects URL changes
2. **Progress Start**: Loading state activates with progress animation
3. **Progress Animation**: Realistic progress simulation (0-90% during navigation)
4. **Completion**: Progress completes when navigation finishes
5. **Reset**: Progress bar disappears after 200ms delay

### Data Loading Flow

1. **Query Initiation**: `useDataQuery` or `useDataMutation` called
2. **Loading State**: Global data loading indicator appears
3. **Cache Check**: TanStack Query checks for cached data
4. **API Request**: Fresh data fetched if needed
5. **State Update**: Loading indicator disappears when complete

### TanStack Query Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: 'always',
    },
  },
});
```

## Usage Examples

### Basic Data Fetching with Loading

```typescript
import { useDataQuery } from '@/components/providers/LoadingProvider';

const MyComponent = () => {
  const { data, isLoading, error } = useDataQuery(
    ['students', 'page-1'],
    () => fetch('/api/students').then(res => res.json()),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  if (isLoading) return <TableSkeleton />;
  if (error) return <ErrorMessage />;
  return <DataTable data={data} />;
};
```

### Data Mutations with Loading

```typescript
import { useDataMutation } from '@/components/providers/LoadingProvider';

const CreateStudentForm = () => {
  const mutation = useDataMutation(
    (studentData) => fetch('/api/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    }),
    {
      onSuccess: () => {
        // Invalidate and refetch students list
        invalidateQueries(['students']);
      },
    }
  );

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      mutation.mutate(formData);
    }}>
      <button disabled={mutation.isPending}>
        {mutation.isPending ? 'Creating...' : 'Create Student'}
      </button>
    </form>
  );
};
```

### Legacy Loading Support

```typescript
import { useLoading } from '@/components/providers/LoadingProvider';

const LegacyComponent = () => {
  const { showLoader, hideLoader } = useLoading();

  const handleLegacyOperation = async () => {
    showLoader('Processing...');
    try {
      await legacyApiCall();
    } finally {
      hideLoader();
    }
  };
};
```

## Performance Benefits

### 1. Navigation Loading
- **User Feedback**: Immediate visual feedback on route changes
- **Perceived Performance**: Users see progress instead of blank screens
- **Realistic Animation**: Progress simulation feels natural and responsive

### 2. Data Loading
- **Cache-First**: TanStack Query serves cached data instantly
- **Stale-While-Revalidate**: Shows cached data while fetching fresh data
- **Smart Retries**: Avoids unnecessary retries on client errors
- **Background Updates**: Refreshes data without blocking UI

### 3. Bundle Optimization
- **Code Splitting**: Lazy loading of heavy components
- **Tree Shaking**: Unused code eliminated from bundles
- **Selective Imports**: Only import needed parts of libraries

## Integration with Existing Code

### Backward Compatibility
- All existing `useLoading()` calls continue to work
- Legacy full-screen loader still available
- Gradual migration path for existing components

### Migration Strategy
1. **Phase 1**: Install new loading system alongside existing
2. **Phase 2**: Update high-traffic pages to use new system
3. **Phase 3**: Migrate remaining components gradually
4. **Phase 4**: Remove legacy loading code when no longer needed

## Configuration Options

### Loading Provider Settings
```typescript
// Customize navigation loading timing
const NAVIGATION_MIN_TIME = 500; // Minimum loading time
const NAVIGATION_TIMEOUT = 10000; // Maximum loading time

// Customize data loading cache
const DEFAULT_STALE_TIME = 5 * 60 * 1000; // 5 minutes
const DEFAULT_GC_TIME = 10 * 60 * 1000; // 10 minutes
```

### Visual Customization
```css
/* Navigation progress bar */
.navigation-progress {
  height: 2px;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
}

/* Data loading indicator */
.data-loading-indicator {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

## Testing and Validation

### Navigation Loading Tests
- Route change detection accuracy
- Progress animation smoothness
- Timeout protection functionality
- Multiple rapid navigation handling

### Data Loading Tests
- Cache hit/miss scenarios
- Network error handling
- Concurrent request management
- Loading state synchronization

## Future Enhancements

### Planned Features
1. **Smart Preloading**: Prefetch likely next pages
2. **Offline Support**: Cache management for offline scenarios
3. **Loading Analytics**: Track loading performance metrics
4. **Custom Loading Animations**: Per-route loading customization

### Performance Monitoring
- Track navigation loading times
- Monitor API response times
- Measure cache hit rates
- Analyze user engagement during loading

## Conclusion

The new navigation-aware and data-aware loader system provides:
- **Better UX**: Real-time feedback for all loading states
- **Improved Performance**: Smart caching and background updates
- **Developer Experience**: Simple APIs with powerful features
- **Future-Proof**: Built on modern React patterns and libraries

This implementation replaces hardcoded loaders with an intelligent system that adapts to user behavior and provides optimal loading experiences across the entire application.
