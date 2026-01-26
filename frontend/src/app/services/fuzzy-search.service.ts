import { Injectable } from '@angular/core';

export interface FuzzyMatchResult<T> {
  item: T;
  score: number;
  matches: number[];
}

@Injectable({
  providedIn: 'root'
})
export class FuzzySearchService {
  
  /**
   * Performs fuzzy matching on a collection of items
   * @param items Array of items to search
   * @param query Search query
   * @param getSearchFields Function to extract searchable text from each item
   * @returns Filtered and sorted array of items
   */
  search<T>(
    items: T[],
    query: string,
    getSearchFields: (item: T) => string[]
  ): T[] {
    if (!query || query.trim().length === 0) {
      return items;
    }

    const lowerQuery = query.toLowerCase().trim();
    const results: FuzzyMatchResult<T>[] = [];

    for (const item of items) {
      const fields = getSearchFields(item);
      let maxScore = 0;
      
      for (const field of fields) {
        if (!field) continue;
        const score = this.fuzzyScore(field.toLowerCase(), lowerQuery);
        maxScore = Math.max(maxScore, score);
      }

      if (maxScore > 0) {
        results.push({
          item,
          score: maxScore,
          matches: []
        });
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    return results.map(r => r.item);
  }

  /**
   * Calculate fuzzy match score for a text against a query
   * Higher score means better match
   */
  fuzzyScore(text: string, query: string): number {
    if (!text || !query) return 0;
    
    let score = 0;
    let queryIndex = 0;
    let textIndex = 0;
    let consecutiveMatches = 0;
    let wordBoundaryBonus = 0;

    const textWords = text.split(/\s+/);
    const queryWords = query.split(/\s+/);

    // Bonus for word-level matches
    for (const qWord of queryWords) {
      for (const tWord of textWords) {
        if (tWord.startsWith(qWord)) {
          wordBoundaryBonus += 20;
        } else if (tWord.includes(qWord)) {
          wordBoundaryBonus += 10;
        }
      }
    }

    // Character-level fuzzy matching
    while (textIndex < text.length && queryIndex < query.length) {
      if (text[textIndex] === query[queryIndex]) {
        score += 1 + consecutiveMatches * 2;
        consecutiveMatches++;
        queryIndex++;
      } else {
        consecutiveMatches = 0;
      }
      textIndex++;
    }

    // Full match bonus
    if (queryIndex === query.length) {
      score += 50;
    }

    // Exact substring match bonus
    if (text.includes(query)) {
      score += 100;
    }

    // Starts with bonus
    if (text.startsWith(query)) {
      score += 150;
    }

    return score + wordBoundaryBonus;
  }

  /**
   * Highlight matching characters in text
   * Returns HTML string with <mark> tags
   */
  highlight(text: string, query: string): string {
    if (!query || !text) {
      return text;
    }

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    // Try exact match first
    const exactIndex = lowerText.indexOf(lowerQuery);
    if (exactIndex !== -1) {
      const before = text.substring(0, exactIndex);
      const match = text.substring(exactIndex, exactIndex + query.length);
      const after = text.substring(exactIndex + query.length);
      return `${before}<mark>${match}</mark>${after}`;
    }

    // Fuzzy highlight
    let result = '';
    let queryIndex = 0;
    
    for (let i = 0; i < text.length && queryIndex < query.length; i++) {
      if (lowerText[i] === lowerQuery[queryIndex]) {
        result += `<mark>${text[i]}</mark>`;
        queryIndex++;
      } else {
        result += text[i];
      }
    }
    
    // Append remaining text
    if (result.length < text.length) {
      result += text.substring(result.length - (queryIndex * 13)); // Adjust for <mark> tags
    }

    return result || text;
  }

  /**
   * Calculate Levenshtein distance between two strings
   * Lower distance means more similar
   */
  levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = [];

    for (let i = 0; i <= m; i++) {
      dp[i] = [i];
    }

    for (let j = 0; j <= n; j++) {
      dp[0][j] = j;
    }

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j - 1] + 1, // substitution
            dp[i][j - 1] + 1,     // insertion
            dp[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return dp[m][n];
  }
}
