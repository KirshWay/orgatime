import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ImageUploader } from './ImageUploader';

const createObjectURL = vi.fn(() => 'blob:preview');
const revokeObjectURL = vi.fn();

describe('ImageUploader preview lifecycle', () => {
  beforeEach(() => {
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
    vi.stubGlobal(
      'URL',
      class extends URL {
        static createObjectURL = createObjectURL;
        static revokeObjectURL = revokeObjectURL;
      },
    );
  });

  function selectImage(
    file = new File(['image'], 'image.png', { type: 'image/png' }),
  ) {
    fireEvent.change(screen.getByLabelText('Upload image (up to 10MB)'), {
      target: { files: [file] },
    });
    return file;
  }

  it('releases the preview when the uploader closes after an upload', () => {
    const onFileChange = vi.fn();
    const { unmount } = render(
      <ImageUploader onFileChange={onFileChange} onCancel={vi.fn()} />,
    );
    const file = selectImage();
    expect(onFileChange).toHaveBeenCalledWith(file);
    expect(createObjectURL).toHaveBeenCalledWith(file);
    expect(revokeObjectURL).not.toHaveBeenCalled();
    unmount();
    expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:preview');
  });

  it('releases the preview on cancellation without revoking it twice', () => {
    const onFileChange = vi.fn();
    const onCancel = vi.fn();
    const { unmount } = render(
      <ImageUploader onFileChange={onFileChange} onCancel={onCancel} />,
    );
    selectImage();
    fireEvent.click(
      screen.getByRole('button', { name: 'Cancel image upload' }),
    );
    expect(onFileChange).toHaveBeenLastCalledWith(null);
    expect(onCancel).toHaveBeenCalledOnce();
    expect(
      screen.getByLabelText('Upload image (up to 10MB)'),
    ).toBeInTheDocument();
    unmount();
    expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:preview');
  });

  it('does not allocate a preview or pass an oversized file to the parent', () => {
    const onFileChange = vi.fn();
    render(<ImageUploader onFileChange={onFileChange} onCancel={vi.fn()} />);
    const file = new File(['image'], 'large.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 + 1 });
    selectImage(file);
    expect(screen.getByText(/File is too large/)).toBeInTheDocument();
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(onFileChange).not.toHaveBeenCalled();
  });
});
