import { JevJudge, jevQuestion } from './jev.ts';
import { JudgeUnavailableError, type AnswerJudge } from './types.ts';

describe('jevQuestion', () => {
  it('asks a yes/no question with the answer, variants and guess', () => {
    const q = jevQuestion({ word: 'purr', acceptedVariants: ['purrs'], guess: 'purring' });
    expect(q).toContain('"purr"');
    expect(q).toContain('"purrs"');
    expect(q).toContain('"purring"');
    expect(q).toMatch(/Is the guess the same word as the answer/);
  });

  it('omits the variants clause when there are none', () => {
    expect(jevQuestion({ word: 'cat', acceptedVariants: [], guess: 'cats' })).not.toContain(
      'Accepted',
    );
  });
});

describe('JevJudge (stub)', () => {
  it('reports unavailable until the client is implemented', async () => {
    const judge: AnswerJudge = new JevJudge({ apiKey: 'k', baseUrl: 'https://x', model: 'm' });
    await expect(
      judge.judge({ word: 'a', acceptedVariants: [], guess: 'b' }, new AbortController().signal),
    ).rejects.toBeInstanceOf(JudgeUnavailableError);
  });
});
