import type { Request, Response, NextFunction } from "express";

// ============================================================================
// JSON ERROR HANDLING MIDDLEWARE
// ============================================================================

/**
 * Middleware to ensure all API responses are in JSON format
 * Converts HTML error responses to consistent JSON error format
 */
export function jsonErrorMiddleware(req: Request, res: Response, next: NextFunction) {
  // Override res.send to ensure JSON responses for API routes
  if (req.path.startsWith('/api/')) {
    const originalSend = res.send;
    
    res.send = function(data: any) {
      // If sending HTML content on an API route, convert to JSON error
      if (typeof data === 'string' && data.includes('<html>')) {
        const statusCode = res.statusCode || 500;
        
        let message = 'Internal server error';
        if (statusCode === 404) {
          message = `API endpoint not found: ${req.method} ${req.path}`;
        } else if (statusCode === 405) {
          message = `Method ${req.method} not allowed for ${req.path}`;
        } else if (statusCode >= 400 && statusCode < 500) {
          message = 'Client error';
        } else if (statusCode >= 500) {
          message = 'Server error';
        }
        
        const jsonError = {
          error: true,
          status: statusCode,
          message,
          path: req.path,
          method: req.method,
          timestamp: new Date().toISOString()
        };
        
        res.setHeader('Content-Type', 'application/json');
        return originalSend.call(this, JSON.stringify(jsonError));
      }
      
      return originalSend.call(this, data);
    };
  }
  
  next();
}

/**
 * 404 handler for API routes - ensures JSON response for missing endpoints
 */
export function apiNotFoundHandler(req: Request, res: Response, next: NextFunction) {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: true,
      status: 404,
      message: `API endpoint not found: ${req.method} ${req.path}`,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
      suggestion: "Check the API documentation for available endpoints"
    });
  }
  
  next();
}

/**
 * Global error handler for API routes - ensures JSON response for all errors
 */
export function apiErrorHandler(error: any, req: Request, res: Response, next: NextFunction) {
  // Only handle API routes
  if (!req.path.startsWith('/api/')) {
    return next(error);
  }
  
  console.error('API Error:', {
    path: req.path,
    method: req.method,
    error: error.message,
    stack: error.stack
  });
  
  const statusCode = error.status || error.statusCode || 500;
  
  // Determine error message
  let message = 'Internal server error';
  if (error.message) {
    if (statusCode < 500) {
      message = error.message; // Client errors: show the message
    } else {
      message = 'Internal server error'; // Server errors: generic message for security
    }
  }
  
  const jsonError = {
    error: true,
    status: statusCode,
    message,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {
      details: error.message,
      stack: error.stack
    })
  };
  
  res.status(statusCode).json(jsonError);
}

/**
 * Method not allowed handler for API routes
 */
export function apiMethodNotAllowedHandler(req: Request, res: Response, next: NextFunction) {
  if (req.path.startsWith('/api/')) {
    return res.status(405).json({
      error: true,
      status: 405,
      message: `Method ${req.method} not allowed for ${req.path}`,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    });
  }
  
  next();
}

/**
 * Request timeout handler for API routes
 */
export function apiTimeoutHandler(req: Request, res: Response, next: NextFunction) {
  const timeout = 30000; // 30 seconds
  
  if (req.path.startsWith('/api/')) {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          error: true,
          status: 408,
          message: 'Request timeout',
          path: req.path,
          method: req.method,
          timestamp: new Date().toISOString(),
          timeout: `${timeout}ms`
        });
      }
    }, timeout);
    
    // Clear timeout when response is sent
    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));
  }
  
  next();
}

/**
 * Content-Type validation for API POST/PUT requests
 */
export function apiContentTypeValidator(req: Request, res: Response, next: NextFunction) {
  if (req.path.startsWith('/api/') && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    
    // Allow JSON content-type or no content-type for GET requests
    if (contentType && !contentType.includes('application/json') && !contentType.includes('multipart/form-data')) {
      return res.status(415).json({
        error: true,
        status: 415,
        message: 'Unsupported Media Type. Expected application/json',
        path: req.path,
        method: req.method,
        receivedContentType: contentType,
        expectedContentType: 'application/json',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  next();
}

/**
 * Request size limiter for API routes
 */
export function apiRequestSizeLimiter(limit: string = '10mb') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/')) {
      const contentLength = req.headers['content-length'];
      
      if (contentLength) {
        const sizeInMB = parseInt(contentLength) / (1024 * 1024);
        const limitInMB = parseInt(limit.replace('mb', ''));
        
        if (sizeInMB > limitInMB) {
          return res.status(413).json({
            error: true,
            status: 413,
            message: 'Request entity too large',
            path: req.path,
            method: req.method,
            requestSize: `${sizeInMB.toFixed(2)}MB`,
            maxSize: limit,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
    
    next();
  };
}

/**
 * Rate limiting for API routes (simple implementation)
 */
export function createApiRateLimiter(windowMs: number = 15 * 60 * 1000, max: number = 100) {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.path.startsWith('/api/')) {
      return next();
    }
    
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    for (const [key, value] of Array.from(requests.entries())) {
      if (value.resetTime < windowStart) {
        requests.delete(key);
      }
    }
    
    const clientData = requests.get(clientId);
    
    if (!clientData) {
      requests.set(clientId, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (clientData.count >= max) {
      return res.status(429).json({
        error: true,
        status: 429,
        message: 'Too many requests',
        path: req.path,
        method: req.method,
        limit: max,
        windowMs,
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
        timestamp: new Date().toISOString()
      });
    }
    
    clientData.count++;
    next();
  };
}