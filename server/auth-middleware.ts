// Middleware to auto-assign Ender's user ID (bypasses authentication for testing)
export const authenticateToken = (req: any, res: any, next: any) => {
  // Auto-assign Ender's user ID (first user in storage)
  req.userId = 1;
  next();
};