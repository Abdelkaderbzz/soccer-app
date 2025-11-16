import { Player, Match, Club } from '../types';

export const ValidationUtils = {
  // Email validation
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // UUID validation
  isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },

  // Rating validation
  isValidRating(rating: number): boolean {
    return rating >= 1 && rating <= 10;
  },

  // Date validation
  isValidDate(date: string): boolean {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  },

  // Player validation
  validatePlayerData(playerData: Partial<Player>): string[] {
    const errors: string[] = [];

    if (playerData.email && !this.isValidEmail(playerData.email)) {
      errors.push('Invalid email format');
    }

    if (playerData.username && playerData.username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }

    if (
      playerData.position &&
      !['goalkeeper', 'defender', 'midfielder', 'forward'].includes(
        playerData.position
      )
    ) {
      errors.push('Invalid player position');
    }

    return errors;
  },

  // Match validation
  validateMatchData(matchData: Partial<Match>): string[] {
    const errors: string[] = [];

    if (matchData.match_date && !this.isValidDate(matchData.match_date)) {
      errors.push('Invalid match date');
    }

    if (matchData.location && matchData.location.length < 3) {
      errors.push('Location must be at least 3 characters long');
    }

    if (
      matchData.max_players &&
      (matchData.max_players < 2 || matchData.max_players > 22)
    ) {
      errors.push('Max players must be between 2 and 22');
    }

    if (
      matchData.status &&
      !['upcoming', 'in_progress', 'completed', 'cancelled'].includes(
        matchData.status
      )
    ) {
      errors.push('Invalid match status');
    }

    return errors;
  },

  // Club validation
  validateClubData(clubData: Partial<Club>): string[] {
    const errors: string[] = [];

    if (clubData.name && clubData.name.length < 3) {
      errors.push('Club name must be at least 3 characters long');
    }

    if (clubData.description && clubData.description.length > 500) {
      errors.push('Club description must not exceed 500 characters');
    }

    return errors;
  },
};
