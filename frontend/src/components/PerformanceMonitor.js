import React, { useEffect, useState } from 'react';

const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    bundleSize: 'Unknown',
    memoryUsage: 'Unknown'
  });

  useEffect(() => {
    // Measure page load time
    const loadTime = performance.now();

    // Get bundle size from performance entries (if available)
    const resources = performance.getEntriesByType('resource');
    const jsResources = resources.filter(resource =>
      resource.name.includes('.js') && !resource.name.includes('chrome-extension')
    );

    // Calculate approximate bundle size
    const totalSize = jsResources.reduce((acc, resource) => acc + (resource.transferSize || 0), 0);
    const bundleSize = totalSize > 0 ? `${(totalSize / 1024 / 1024).toFixed(2)} MB` : 'Unknown';

    // Get memory usage if available
    const memoryUsage = performance.memory
      ? `${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`
      : 'Unknown';

    setMetrics({
      loadTime: Math.round(loadTime),
      bundleSize,
      memoryUsage
    });
  }, []);

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50 max-w-xs">
      <div className="font-bold mb-2">Performance Monitor</div>
      <div>Load Time: {metrics.loadTime}ms</div>
      <div>Bundle Size: {metrics.bundleSize}</div>
      <div>Memory: {metrics.memoryUsage}</div>
    </div>
  );
};

export default PerformanceMonitor;
