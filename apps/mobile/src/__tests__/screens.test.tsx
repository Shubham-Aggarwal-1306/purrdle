import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { createLevelProgress, type LevelProgress } from '@purrdle/shared';

import { playHaptic } from '@/features/feedback/haptics';
import { playSound } from '@/features/feedback/sound';
import { LevelScreen, WIN_TRANSITION_MS } from '@/features/game/LevelScreen';
import { HomeScreen } from '@/features/home/HomeScreen';
import { LevelMapScreen } from '@/features/level-map/LevelMapScreen';
import { getLevels } from '@/features/levels/repository';
import { useProgressStore } from '@/features/progress/store';
import { ResultScreen } from '@/features/result/ResultScreen';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { useSettingsStore } from '@/features/settings/store';
import { resetRouter, router } from '@/test-utils/router';

jest.mock('expo-router', () => ({
  useRouter: () =>
    jest.requireActual<typeof import('@/test-utils/router')>('@/test-utils/router').router,
}));

const levels = getLevels();
const level = levels[0];
if (!level) throw new Error('no bundled levels');

beforeEach(() => {
  resetRouter();
  jest.mocked(playHaptic).mockClear();
  jest.mocked(playSound).mockClear();
  useProgressStore.getState().resetAll();
  useSettingsStore.setState({ soundEnabled: true, hapticsEnabled: true });
});

async function guess(text: string) {
  await fireEvent.changeText(screen.getByTestId('guess-input'), text);
  await fireEvent.press(screen.getByTestId('guess-submit'));
}

describe('LevelScreen', () => {
  it('shows the first hint and three guesses', async () => {
    await render(<LevelScreen level={level} levelNumber={1} />);
    expect(screen.getByText(level.hints[0])).toBeOnTheScreen();
    expect(screen.queryByText(level.hints[1])).toBeNull();
    expect(screen.getByLabelText('3 guesses left')).toBeOnTheScreen();
  });

  it('reveals the next hint on request', async () => {
    await render(<LevelScreen level={level} levelNumber={1} />);
    await fireEvent.press(screen.getByTestId('reveal-hint'));
    expect(screen.getByText(level.hints[1])).toBeOnTheScreen();
    expect(screen.getByLabelText('3 guesses left')).toBeOnTheScreen();
    expect(playHaptic).toHaveBeenCalledWith('light');
  });

  it('a wrong guess reveals a hint, costs a guess and buzzes', async () => {
    await render(<LevelScreen level={level} levelNumber={1} />);
    await guess('zebra');
    expect(screen.getByText(level.hints[1])).toBeOnTheScreen();
    expect(screen.getByLabelText('2 guesses left')).toBeOnTheScreen();
    expect(screen.getByTestId('game-message')).toHaveTextContent(/another hint/);
    expect(screen.getByTestId('guess-input')).toHaveDisplayValue('');
    expect(playHaptic).toHaveBeenCalledWith('error');
    expect(playSound).toHaveBeenCalledWith('wrong');
  });

  it('does not charge for repeating a wrong guess', async () => {
    await render(<LevelScreen level={level} levelNumber={1} />);
    await guess('zebra');
    await guess('ZEBRA!');
    expect(screen.getByLabelText('2 guesses left')).toBeOnTheScreen();
    expect(screen.getByTestId('game-message')).toHaveTextContent(/already tried/);
  });

  it('respects muted sound and disabled haptics', async () => {
    useSettingsStore.setState({ soundEnabled: false, hapticsEnabled: false });
    await render(<LevelScreen level={level} levelNumber={1} />);
    await guess('zebra');
    expect(playHaptic).not.toHaveBeenCalled();
    expect(playSound).not.toHaveBeenCalled();
  });

  it('fails after three wrong guesses and can retry', async () => {
    await render(<LevelScreen level={level} levelNumber={1} />);
    await guess('zebra');
    await guess('giraffe');
    await guess('hippo');
    expect(screen.getByTestId('failed-panel')).toBeOnTheScreen();
    expect(screen.queryByTestId('guess-input')).toBeNull();
    await fireEvent.press(screen.getByTestId('retry'));
    expect(screen.getByLabelText('3 guesses left')).toBeOnTheScreen();
  });

  it('a correct guess wins and moves to the result screen', async () => {
    jest.useFakeTimers();
    try {
      await render(<LevelScreen level={level} levelNumber={1} />);
      await guess(level.word.toUpperCase());
      expect(playHaptic).toHaveBeenCalledWith('success');
      expect(playSound).toHaveBeenCalledWith('correct');
      expect(useProgressStore.getState().levels[level.id]).toMatchObject({
        status: 'won',
        pawStars: 3,
      });
      await act(() => {
        jest.advanceTimersByTime(WIN_TRANSITION_MS);
      });
      expect(router.replace).toHaveBeenCalledWith({
        pathname: '/result/[id]',
        params: { id: level.id },
      });
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('ResultScreen', () => {
  const wonWith = (outcome: 'exact' | 'typo', text: string): LevelProgress => ({
    ...createLevelProgress(level.id),
    status: 'won',
    hintsRevealed: 3,
    pawStars: 2,
    guesses: [{ text, outcome }],
  });

  it('shows the word, paws, explanation and image credit', async () => {
    await render(<ResultScreen level={level} progress={wonWith('exact', level.word)} />);
    expect(screen.getByTestId('result-word')).toHaveTextContent(level.word);
    expect(screen.getByLabelText('2 of 3 paws')).toBeOnTheScreen();
    expect(screen.getByText(level.explanation)).toBeOnTheScreen();
    expect(screen.getByTestId('image-credit')).toHaveTextContent(
      `${level.image.credit} · ${level.image.license}`,
    );
  });

  it('shows the correct spelling for close-enough answers', async () => {
    await render(<ResultScreen level={level} progress={wonWith('typo', 'wiskers')} />);
    expect(screen.getByText(/Close enough/)).toBeOnTheScreen();
    expect(screen.getByText('You typed “wiskers”')).toBeOnTheScreen();
  });

  it('continues to the next level', async () => {
    await render(<ResultScreen level={level} progress={wonWith('exact', level.word)} />);
    await fireEvent.press(screen.getByTestId('next-level'));
    expect(router.replace).toHaveBeenCalledWith({
      pathname: '/level/[id]',
      params: { id: levels[1]?.id },
    });
  });
});

describe('HomeScreen', () => {
  it('starts at level 1 and opens the level map and settings', async () => {
    await render(<HomeScreen />);
    expect(screen.getByText('Play level 1')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('play'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/level/[id]', params: { id: level.id } });
    await fireEvent.press(screen.getByTestId('open-levels'));
    expect(router.push).toHaveBeenCalledWith('/levels');
    await fireEvent.press(screen.getByTestId('open-settings'));
    expect(router.push).toHaveBeenCalledWith('/settings');
  });

  it('continues from the first unsolved level', async () => {
    useProgressStore
      .getState()
      .dispatch({ type: 'submitGuess', guess: level.word }, { level, judgeAvailable: false });
    await render(<HomeScreen />);
    expect(screen.getByText('Play level 2')).toBeOnTheScreen();
    expect(screen.getByLabelText('3 paws collected')).toBeOnTheScreen();
  });
});

describe('LevelMapScreen', () => {
  it('locks levels until the previous one is solved', async () => {
    await render(<LevelMapScreen />);
    expect(screen.getByTestId('level-tile-1')).toBeEnabled();
    expect(screen.getByTestId('level-tile-2')).toBeDisabled();
  });

  it('opens solved levels on their result screen', async () => {
    useProgressStore
      .getState()
      .dispatch({ type: 'submitGuess', guess: level.word }, { level, judgeAvailable: false });
    await render(<LevelMapScreen />);
    await fireEvent.press(screen.getByTestId('level-tile-1'));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/result/[id]',
      params: { id: level.id },
    });
    await fireEvent.press(screen.getByTestId('level-tile-2'));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/level/[id]',
      params: { id: levels[1]?.id },
    });
  });
});

describe('SettingsScreen', () => {
  it('toggles sound and haptics', async () => {
    await render(<SettingsScreen />);
    await fireEvent(screen.getByTestId('toggle-sound'), 'valueChange', false);
    await fireEvent(screen.getByTestId('toggle-haptics'), 'valueChange', false);
    expect(useSettingsStore.getState()).toMatchObject({
      soundEnabled: false,
      hapticsEnabled: false,
    });
  });
});
