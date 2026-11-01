import { describe, it, expect } from 'vitest';
import { PhoneticService } from '../services/phoneticService';

describe('PhoneticService', () => {
  it('correctly calculates dataset similarity percentage', () => {
    // 2538 total chars, 21 red chars -> 99.17%
    const res = PhoneticService.calculateDatasetSimilarity(2538, 21);
    expect(res.similarity).toBe(99.17);
    expect(res.isPassed).toBe(true);

    // Failing score (< 95%)
    const failRes = PhoneticService.calculateDatasetSimilarity(100, 10);
    expect(failRes.similarity).toBe(90.0);
    expect(failRes.isPassed).toBe(false);
  });

  it('evaluates character matching and assigns Black/Red statuses', () => {
    const pair = PhoneticService.evaluatePair('歌嚋㓜格', 'Ca trù thê cách');
    expect(pair.isMatched).toBe(true);
    expect(pair.color).toBe('BLACK');
    expect(pair.charStatuses.length).toBe(4);
    expect(pair.charStatuses.every(c => c.color === 'BLACK')).toBe(true);
  });
});
