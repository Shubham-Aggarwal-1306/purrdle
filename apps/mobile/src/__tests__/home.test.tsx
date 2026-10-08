import { render, screen } from '@testing-library/react-native';

import Home from '@/app/index';

describe('Home (placeholder)', () => {
  it('renders and uses @purrdle/shared', async () => {
    await render(<Home />);
    expect(screen.getByText('Purrdle')).toBeOnTheScreen();
    expect(screen.getByTestId('shared-check')).toHaveTextContent('hello kitty');
  });
});
