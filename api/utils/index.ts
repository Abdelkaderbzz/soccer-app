export { ValidationUtils } from './validation';
export { ResponseUtils, ApiResponse } from './response';
export { AuthUtils, authenticate, authorize } from './auth';

// General utility functions
export const GeneralUtils = {
  // Generate random string
  generateRandomString(length: number = 8): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Generate invitation code
  generateInvitationCode(): string {
    return this.generateRandomString(8).toUpperCase();
  },

  // Format date
  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  },

  // Format datetime
  formatDateTime(date: Date | string): string {
    const d = new Date(date);
    return d.toISOString();
  },

  // Calculate age from birthdate
  calculateAge(birthdate: string): number {
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  },

  // Calculate skill level based on rating
  getSkillLevel(rating: number): string {
    if (rating >= 9) return 'Expert';
    if (rating >= 7) return 'Advanced';
    if (rating >= 5) return 'Intermediate';
    if (rating >= 3) return 'Beginner';
    return 'Novice';
  },

  // Sanitize input
  sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  },

  // Parse query parameters
  parseQueryParams(query: any): {
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    search?: string;
  } {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const sortBy = query.sortBy || 'created_at';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
    const search = query.search?.trim() || undefined;

    return { page, limit, sortBy, sortOrder, search };
  },

  // Calculate pagination offset
  getPaginationOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  },
};
