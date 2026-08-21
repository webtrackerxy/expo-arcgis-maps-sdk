import ExpoArcgisMapsSdkModule from '../ExpoArcgisMapsSdkModule';
import {
  addFeatureAttachment,
  deleteFeatureAttachment,
  queryFeatureAttachments,
} from '../attachments';

jest.mock('../ExpoArcgisMapsSdkModule');

const mod = ExpoArcgisMapsSdkModule as unknown as Record<string, jest.Mock>;
const URL = 'https://example.com/FeatureServer/0';

describe('queryFeatureAttachments', () => {
  beforeEach(() => mod.queryFeatureAttachments.mockClear());

  it('forwards url + objectId', async () => {
    mod.queryFeatureAttachments.mockResolvedValueOnce([
      { id: 1, name: 'photo.jpg', contentType: 'image/jpeg', size: 1000 },
    ]);
    const result = await queryFeatureAttachments(URL, 42);
    expect(mod.queryFeatureAttachments).toHaveBeenCalledWith(URL, 42);
    expect(result[0].name).toBe('photo.jpg');
  });

  it('rejects a bad url or non-integer objectId', async () => {
    await expect(queryFeatureAttachments('', 1)).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
    await expect(queryFeatureAttachments(URL, 1.5)).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
    expect(mod.queryFeatureAttachments).not.toHaveBeenCalled();
  });
});

describe('addFeatureAttachment', () => {
  beforeEach(() => mod.addFeatureAttachment.mockClear());

  it('validates and forwards the attachment', async () => {
    await addFeatureAttachment(URL, 42, 'a.txt', 'text/plain', 'aGVsbG8=');
    expect(mod.addFeatureAttachment).toHaveBeenCalledWith(
      URL,
      42,
      'a.txt',
      'text/plain',
      'aGVsbG8='
    );
  });

  it('rejects empty name/contentType/data', async () => {
    await expect(addFeatureAttachment(URL, 1, '', 'text/plain', 'x')).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
    await expect(addFeatureAttachment(URL, 1, 'a', '', 'x')).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
    await expect(addFeatureAttachment(URL, 1, 'a', 'text/plain', '')).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
  });
});

describe('deleteFeatureAttachment', () => {
  beforeEach(() => mod.deleteFeatureAttachment.mockClear());

  it('validates and forwards ids', async () => {
    await deleteFeatureAttachment(URL, 42, 7);
    expect(mod.deleteFeatureAttachment).toHaveBeenCalledWith(URL, 42, 7);
  });

  it('rejects a non-integer attachmentId', async () => {
    await expect(deleteFeatureAttachment(URL, 42, 1.5)).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
    expect(mod.deleteFeatureAttachment).not.toHaveBeenCalled();
  });

  it('maps a native rejection to a stable error', async () => {
    mod.deleteFeatureAttachment.mockRejectedValueOnce('boom');
    await expect(deleteFeatureAttachment(URL, 42, 7)).rejects.toMatchObject({
      code: 'E_NATIVE_FAILURE',
    });
  });
});
