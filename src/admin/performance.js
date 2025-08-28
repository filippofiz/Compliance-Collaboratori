// =====================================================
// OTTIMIZZAZIONE PERFORMANCE - COMPLIANCE UPTOTEN
// =====================================================
// Sistema di cache, debouncing e query ottimizzate
// =====================================================

class PerformanceOptimizer {
    constructor() {
        // Cache in memoria
        this.cache = new Map();
        this.cacheExpiry = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 5 minuti default
        
        // Debounce timers
        this.debounceTimers = new Map();
        
        // Request batching
        this.batchQueue = new Map();
        this.batchTimers = new Map();
        
        // Lazy loading
        this.lazyLoadObserver = null;
        this.initLazyLoading();
        
        // Monitor performance
        this.performanceMetrics = {
            cacheHits: 0,
            cacheMisses: 0,
            avgQueryTime: 0,
            totalQueries: 0
        };
    }

    // ===== CACHE SYSTEM =====
    
    /**
     * Get data from cache or fetch if not available
     */
    async getCached(key, fetchFunction, ttl = this.defaultTTL) {
        // Check if exists and not expired
        if (this.cache.has(key)) {
            const expiry = this.cacheExpiry.get(key);
            if (expiry > Date.now()) {
                this.performanceMetrics.cacheHits++;
                console.log(`Cache hit for: ${key}`);
                return this.cache.get(key);
            }
        }
        
        // Fetch new data
        this.performanceMetrics.cacheMisses++;
        console.log(`Cache miss for: ${key}`);
        
        const startTime = performance.now();
        const data = await fetchFunction();
        const queryTime = performance.now() - startTime;
        
        // Update metrics
        this.updateQueryMetrics(queryTime);
        
        // Store in cache
        this.cache.set(key, data);
        this.cacheExpiry.set(key, Date.now() + ttl);
        
        // Clean old entries periodically
        this.scheduleCleanup();
        
        return data;
    }

    /**
     * Invalidate cache entries
     */
    invalidateCache(pattern = null) {
        if (!pattern) {
            // Clear all cache
            this.cache.clear();
            this.cacheExpiry.clear();
            console.log('Cache cleared');
            return;
        }
        
        // Clear matching patterns
        let cleared = 0;
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
                this.cacheExpiry.delete(key);
                cleared++;
            }
        }
        console.log(`Cleared ${cleared} cache entries matching: ${pattern}`);
    }

    scheduleCleanup() {
        if (this.cleanupScheduled) return;
        
        this.cleanupScheduled = true;
        setTimeout(() => {
            const now = Date.now();
            const toDelete = [];
            
            for (const [key, expiry] of this.cacheExpiry.entries()) {
                if (expiry <= now) {
                    toDelete.push(key);
                }
            }
            
            toDelete.forEach(key => {
                this.cache.delete(key);
                this.cacheExpiry.delete(key);
            });
            
            this.cleanupScheduled = false;
            console.log(`Cleaned ${toDelete.length} expired cache entries`);
        }, 60000); // Clean every minute
    }

    // ===== DEBOUNCING =====
    
    /**
     * Debounce function calls
     */
    debounce(key, func, delay = 300) {
        // Clear existing timer
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
        }
        
        return new Promise((resolve) => {
            const timer = setTimeout(async () => {
                this.debounceTimers.delete(key);
                const result = await func();
                resolve(result);
            }, delay);
            
            this.debounceTimers.set(key, timer);
        });
    }

    /**
     * Throttle function calls
     */
    throttle(key, func, limit = 1000) {
        const now = Date.now();
        const lastCall = this.lastCalls?.get(key) || 0;
        
        if (now - lastCall < limit) {
            return Promise.resolve(null); // Skip this call
        }
        
        if (!this.lastCalls) {
            this.lastCalls = new Map();
        }
        this.lastCalls.set(key, now);
        
        return func();
    }

    // ===== REQUEST BATCHING =====
    
    /**
     * Batch multiple requests into one
     */
    batchRequest(batchKey, itemKey, itemData, processBatch, delay = 100) {
        return new Promise((resolve, reject) => {
            // Add to batch queue
            if (!this.batchQueue.has(batchKey)) {
                this.batchQueue.set(batchKey, new Map());
            }
            
            const batch = this.batchQueue.get(batchKey);
            batch.set(itemKey, { data: itemData, resolve, reject });
            
            // Clear existing timer
            if (this.batchTimers.has(batchKey)) {
                clearTimeout(this.batchTimers.get(batchKey));
            }
            
            // Set new timer
            const timer = setTimeout(async () => {
                const batch = this.batchQueue.get(batchKey);
                this.batchQueue.delete(batchKey);
                this.batchTimers.delete(batchKey);
                
                try {
                    // Process entire batch
                    const results = await processBatch(batch);
                    
                    // Resolve individual promises
                    for (const [key, item] of batch.entries()) {
                        item.resolve(results[key]);
                    }
                } catch (error) {
                    // Reject all promises
                    for (const item of batch.values()) {
                        item.reject(error);
                    }
                }
            }, delay);
            
            this.batchTimers.set(batchKey, timer);
        });
    }

    // ===== LAZY LOADING =====
    
    initLazyLoading() {
        if (!window.IntersectionObserver) return;
        
        this.lazyLoadObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    
                    // Load images
                    if (element.dataset.src) {
                        element.src = element.dataset.src;
                        delete element.dataset.src;
                    }
                    
                    // Load content
                    if (element.dataset.loadContent) {
                        this.loadContent(element);
                    }
                    
                    // Unobserve after loading
                    this.lazyLoadObserver.unobserve(element);
                }
            });
        }, {
            rootMargin: '50px' // Start loading 50px before visible
        });
    }

    observeLazyLoad(element) {
        if (this.lazyLoadObserver) {
            this.lazyLoadObserver.observe(element);
        }
    }

    async loadContent(element) {
        const contentId = element.dataset.loadContent;
        const loader = element.dataset.loader;
        
        if (loader && window[loader]) {
            const content = await window[loader](contentId);
            element.innerHTML = content;
        }
    }

    // ===== OPTIMIZED QUERIES =====
    
    /**
     * Optimized Supabase query with pagination and filtering
     */
    async optimizedQuery(table, options = {}) {
        const {
            select = '*',
            filters = [],
            orderBy = null,
            limit = 50,
            offset = 0,
            useCache = true,
            cacheTTL = this.defaultTTL
        } = options;
        
        // Build cache key
        const cacheKey = `query_${table}_${JSON.stringify(options)}`;
        
        // Try cache first
        if (useCache) {
            const cached = await this.getCached(cacheKey, async () => {
                return this.executeQuery(table, options);
            }, cacheTTL);
            
            if (cached) return cached;
        }
        
        return this.executeQuery(table, options);
    }

    async executeQuery(table, options) {
        if (!window.supabase) {
            console.error('Supabase not initialized');
            return { data: [], error: 'Supabase not initialized' };
        }
        
        const {
            select = '*',
            filters = [],
            orderBy = null,
            limit = 50,
            offset = 0
        } = options;
        
        let query = window.supabase.from(table).select(select);
        
        // Apply filters
        filters.forEach(filter => {
            const { column, operator, value } = filter;
            query = query[operator](column, value);
        });
        
        // Apply ordering
        if (orderBy) {
            query = query.order(orderBy.column, { 
                ascending: orderBy.ascending !== false 
            });
        }
        
        // Apply pagination
        query = query.range(offset, offset + limit - 1);
        
        const startTime = performance.now();
        const result = await query;
        const queryTime = performance.now() - startTime;
        
        this.updateQueryMetrics(queryTime);
        
        return result;
    }

    // ===== VIRTUAL SCROLLING =====
    
    setupVirtualScrolling(container, items, renderItem, itemHeight = 50) {
        const visibleCount = Math.ceil(container.clientHeight / itemHeight);
        const totalHeight = items.length * itemHeight;
        const scrollTop = container.scrollTop;
        const startIndex = Math.floor(scrollTop / itemHeight);
        const endIndex = Math.min(startIndex + visibleCount + 1, items.length);
        
        // Create virtual container
        const virtualContainer = document.createElement('div');
        virtualContainer.style.height = `${totalHeight}px`;
        virtualContainer.style.position = 'relative';
        
        // Render visible items
        for (let i = startIndex; i < endIndex; i++) {
            const itemElement = renderItem(items[i], i);
            itemElement.style.position = 'absolute';
            itemElement.style.top = `${i * itemHeight}px`;
            itemElement.style.height = `${itemHeight}px`;
            virtualContainer.appendChild(itemElement);
        }
        
        // Replace container content
        container.innerHTML = '';
        container.appendChild(virtualContainer);
        
        // Handle scroll
        container.onscroll = () => {
            this.debounce('virtual-scroll', () => {
                this.setupVirtualScrolling(container, items, renderItem, itemHeight);
            }, 50);
        };
    }

    // ===== WEB WORKERS =====
    
    /**
     * Process heavy computation in Web Worker
     */
    async processInWorker(workerScript, data) {
        return new Promise((resolve, reject) => {
            const blob = new Blob([workerScript], { type: 'application/javascript' });
            const worker = new Worker(URL.createObjectURL(blob));
            
            worker.onmessage = (e) => {
                resolve(e.data);
                worker.terminate();
            };
            
            worker.onerror = (error) => {
                reject(error);
                worker.terminate();
            };
            
            worker.postMessage(data);
        });
    }

    // ===== METRICS =====
    
    updateQueryMetrics(queryTime) {
        const metrics = this.performanceMetrics;
        metrics.totalQueries++;
        metrics.avgQueryTime = (metrics.avgQueryTime * (metrics.totalQueries - 1) + queryTime) / metrics.totalQueries;
    }

    getMetrics() {
        return {
            ...this.performanceMetrics,
            cacheSize: this.cache.size,
            cacheHitRate: this.performanceMetrics.cacheHits / (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses) || 0
        };
    }

    // ===== PRELOADING =====
    
    /**
     * Preload data that will likely be needed
     */
    async preloadData(predictions) {
        const preloadPromises = predictions.map(prediction => {
            return this.getCached(prediction.key, prediction.fetch, prediction.ttl);
        });
        
        await Promise.all(preloadPromises);
        console.log(`Preloaded ${predictions.length} data sets`);
    }

    // ===== IMAGE OPTIMIZATION =====
    
    /**
     * Load optimized image based on viewport
     */
    getOptimizedImageUrl(baseUrl, width) {
        // If using a service like Cloudinary or similar
        const devicePixelRatio = window.devicePixelRatio || 1;
        const optimalWidth = Math.round(width * devicePixelRatio);
        
        // Round to nearest 100 for better caching
        const roundedWidth = Math.ceil(optimalWidth / 100) * 100;
        
        // Return optimized URL (adjust based on your image service)
        return `${baseUrl}?w=${roundedWidth}&q=auto&f=auto`;
    }

    // ===== MEMORY MANAGEMENT =====
    
    /**
     * Monitor and manage memory usage
     */
    checkMemoryUsage() {
        if (performance.memory) {
            const used = performance.memory.usedJSHeapSize;
            const limit = performance.memory.jsHeapSizeLimit;
            const usage = (used / limit) * 100;
            
            if (usage > 90) {
                console.warn('High memory usage detected:', usage.toFixed(2) + '%');
                this.freeMemory();
            }
            
            return {
                used: (used / 1048576).toFixed(2) + ' MB',
                limit: (limit / 1048576).toFixed(2) + ' MB',
                usage: usage.toFixed(2) + '%'
            };
        }
        return null;
    }

    freeMemory() {
        // Clear half of cache
        const cacheSize = this.cache.size;
        const toDelete = Math.floor(cacheSize / 2);
        let deleted = 0;
        
        for (const key of this.cache.keys()) {
            if (deleted >= toDelete) break;
            this.cache.delete(key);
            this.cacheExpiry.delete(key);
            deleted++;
        }
        
        console.log(`Freed memory by removing ${deleted} cache entries`);
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
    }
}

// ===== SINGLETON INSTANCE =====

const optimizer = new PerformanceOptimizer();

// ===== EXPORT UTILITIES =====

window.performanceOptimizer = optimizer;
window.PerformanceOptimizer = PerformanceOptimizer;

// Shorthand functions
window.getCached = optimizer.getCached.bind(optimizer);
window.debounce = optimizer.debounce.bind(optimizer);
window.throttle = optimizer.throttle.bind(optimizer);
window.invalidateCache = optimizer.invalidateCache.bind(optimizer);