import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react';
import useEmblaCarousel from 'embla-carousel-react';
import { beforeEach, expect, test, vi } from 'vitest';

import { Carousel, CarouselNext } from '@/shared/ui/carousel';

import { ImageGallery } from './ImageGallery';

vi.mock('embla-carousel-react', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('embla-carousel-react')>();
  return { ...original, default: vi.fn(original.default) };
});

const { default: useRealEmblaCarousel } = await vi.importActual<
  typeof import('embla-carousel-react')
>('embla-carousel-react');

beforeEach(() => {
  vi.stubGlobal('matchMedia', (media: string) =>
    Object.assign(new EventTarget(), {
      matches: false,
      media,
      onchange: null,
      addListener() {},
      removeListener() {},
    }),
  );
});

function createCarouselApi() {
  const viewport = document.createElement('div');
  viewport.appendChild(document.createElement('div'));
  const { result } = renderHook(() => useRealEmblaCarousel({ active: false }));
  act(() => result.current[0](viewport));
  const api = result.current[1]!;
  // Keep real Embla events, without starting layout observers in jsdom.
  api.internalEngine().eventHandler.init(api);
  return api;
}

test('carousel navigation ignores reInit from a replaced carousel', () => {
  const previousApi = createCarouselApi();
  const currentApi = createCarouselApi();
  vi.spyOn(previousApi, 'canScrollNext').mockReturnValue(true);
  vi.mocked(useEmblaCarousel).mockReturnValue([() => {}, previousApi]);

  const { rerender } = render(
    <Carousel>
      <CarouselNext />
    </Carousel>,
  );
  expect(screen.getByRole('button', { name: 'Next slide' })).toBeEnabled();

  vi.mocked(useEmblaCarousel).mockReturnValue([() => {}, currentApi]);
  rerender(
    <Carousel className="replacement">
      <CarouselNext />
    </Carousel>,
  );
  expect(screen.getByRole('button', { name: 'Next slide' })).toBeDisabled();

  act(() => previousApi.emit('reInit'));
  expect(screen.getByRole('button', { name: 'Next slide' })).toBeDisabled();

  const canScrollNext = vi.spyOn(currentApi, 'canScrollNext');
  canScrollNext.mockReturnValue(true);
  act(() => currentApi.emit('select'));
  expect(screen.getByRole('button', { name: 'Next slide' })).toBeEnabled();
  canScrollNext.mockReturnValue(false);
  act(() => currentApi.emit('reInit'));
  expect(screen.getByRole('button', { name: 'Next slide' })).toBeDisabled();
});

test('image preview ignores reInit from a replaced carousel', () => {
  const previousApi = createCarouselApi();
  const currentApi = createCarouselApi();
  vi.spyOn(previousApi, 'selectedScrollSnap').mockReturnValue(1);
  vi.mocked(useEmblaCarousel).mockReturnValue([() => {}, previousApi]);
  const images = [
    { id: 'first', filename: 'first.webp', path: '/first.webp' },
    { id: 'second', filename: 'second.webp', path: '/second.webp' },
  ];
  const onDelete = vi.fn();
  const { rerender } = render(
    <ImageGallery images={images} onDelete={onDelete} />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Task image 1' }));
  expect(screen.getByText('2 / 2')).toBeInTheDocument();

  vi.mocked(useEmblaCarousel).mockReturnValue([() => {}, currentApi]);
  rerender(<ImageGallery images={[...images]} onDelete={onDelete} />);
  expect(screen.getByText('1 / 2')).toBeInTheDocument();

  act(() => previousApi.emit('reInit'));
  expect(screen.getByText('1 / 2')).toBeInTheDocument();

  const selectedScrollSnap = vi.spyOn(currentApi, 'selectedScrollSnap');
  selectedScrollSnap.mockReturnValue(1);
  act(() => currentApi.emit('select'));
  expect(screen.getByText('2 / 2')).toBeInTheDocument();
  selectedScrollSnap.mockReturnValue(0);
  act(() => currentApi.emit('reInit'));
  expect(screen.getByText('1 / 2')).toBeInTheDocument();
});
