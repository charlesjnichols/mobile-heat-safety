import React, { useCallback, useState, useEffect, useRef } from 'react';
import { FlatList, View, Text, StyleSheet, ListRenderItem, Image } from 'react-native';
import { PALETTE } from '../utils/outdoorColors';

// Performance optimization hooks and utilities

/**
 * Custom hook for debouncing values
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced value
 */
export const useDebounce = <T,>(value: T, delay: number): T => {
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
};

/**
 * Custom hook for throttling function calls
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export const useThrottle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): T => {
  const inThrottle = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any pending throttle timer on unmount to avoid leaks.
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: unknown[]) => {
      if (!inThrottle.current) {
        func(...args);
        inThrottle.current = true;
        timerRef.current = setTimeout(() => {
          inThrottle.current = false;
          timerRef.current = null;
        }, limit);
      }
    },
    [func, limit]
  ) as T;
};

/**
 * Custom hook for infinite scroll with virtualization
 * @param data - Data array to display
 * @param renderItem - Function to render each item
 * @param onLoadMore - Function to load more data
 * @returns Configured FlatList component
 */
export const useVirtualizedList = <T,>({
  data,
  renderItem,
  onLoadMore,
}: {
  data: T[];
  renderItem: ListRenderItem<T>;
  onLoadMore?: () => void;
}) => {
  const [loading, setLoading] = useState(false);

  const handleLoadMore = useCallback(() => {
    if (!loading && onLoadMore) {
      setLoading(true);
      Promise.resolve()
        .then(() => onLoadMore())
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [loading, onLoadMore]);

  const keyExtractor = useCallback((item: T, index: number) => {
    if (item && typeof item === 'object' && 'id' in item && typeof (item as { id: unknown }).id === 'string') {
      return (item as { id: string }).id;
    }
    return `${index}`;
  }, []);

  return {
    FlatList: (
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={loading ? <LoadingSpinner /> : null}
      />
    ),
    loading,
  };
};

/**
 * Loading spinner component for mobile optimization
 */
export const LoadingSpinner = () => (
  <View style={styles.loadingContainer}>
    <View style={styles.spinner} />
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

/**
 * Error boundary for performance monitoring
 */
export class PerformanceErrorBoundary extends React.Component<
  { children: React.ReactNode; componentName: string },
  { hasError: boolean; error?: Error; errorInfo?: React.ErrorInfo }
> {
  constructor(props: { children: React.ReactNode; componentName: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): { hasError: true; error: Error } {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Performance error in ${this.props.componentName}:`, error, errorInfo);
    
    // Report performance issue
    reportPerformanceIssue(error, this.props.componentName);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Performance issue in {this.props.componentName}
          </Text>
          <Text style={styles.errorDetails}>
            {this.state.error?.message || 'A performance error occurred.'}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

/**
 * Performance monitoring utility
 */
export const reportPerformanceIssue = (error: Error, componentName: string) => {
  // In a real app, this would send data to a monitoring service
  console.warn(`Performance issue reported for ${componentName}:`, error.message);
  
  // You could also track this in your analytics
  // trackError('performance', { componentName, error: error.message });
};

/**
 * Memory usage monitoring
 */
export const useMemoryMonitor = () => {
  const [memoryUsage, setMemoryUsage] = useState<number | null>(null);

  useEffect(() => {
    const checkMemory = () => {
      // This is a simplified version - in a real app you'd use device-specific APIs
      // or React Native's performance API
      if (global.performance && (global.performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory) {
        const memory = (global.performance as unknown as { memory: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
        const used = Math.round((memory.usedJSHeapSize / 1048576) * 100) / 100;
        const total = Math.round((memory.totalJSHeapSize / 1048576) * 100) / 100;
        const percentage = Math.round((used / total) * 100);
        
        setMemoryUsage(percentage);
        
        // Warn if memory usage is high
        if (percentage > 80) {
          console.warn(`High memory usage detected: ${percentage}%`);
        }
      }
    };

    // Check memory every 30 seconds
    const interval = setInterval(checkMemory, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return memoryUsage;
};

/**
 * Cache utility for data optimization
 */
export class Cache<T> {
  private cache = new Map<string, { data: T; timestamp: number; ttl?: number }>();
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  set(key: string, data: T, ttl?: number): void {
    // Remove oldest item if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (item.ttl && Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    return this.cache.has(key) && this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Image optimization utility
 */
export const optimizeImage = (uri: string, options: {
  width?: number;
  height?: number;
  quality?: number;
}): string => {
  // In a real app, this would use React Native's Image component
  // or a library like react-native-fast-image for optimization
  const { width = 300, height = 300, quality = 80 } = options;
  
  // Add optimization parameters to URI
  const optimizedUri = `${uri}?w=${width}&h=${height}&q=${quality}`;
  
  return optimizedUri;
};

/**
 * Preload images for better performance
 */
export const preloadImages = (uris: string[]): Promise<boolean[]> => {
  return Promise.all(
    uris.map(uri => {
      return Image.prefetch(optimizeImage(uri, { width: 100, height: 100 }));
    })
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    alignItems: 'center',
    backgroundColor: PALETTE.RED_50,
    padding: 20,
  },
  errorDetails: {
    color: PALETTE.RED_800,
    fontSize: 14,
    textAlign: 'center' as const,
  },
  errorText: {
    color: PALETTE.RED_600,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: PALETTE.TEXT_SECONDARY,
    fontSize: 14,
    marginTop: 10,
  },
  spinner: {
    borderColor: PALETTE.BLUE_500,
    borderRadius: 20,
    borderTopColor: PALETTE.TRANSPARENT,
    borderWidth: 3,
    height: 40,
    width: 40,
  },
});