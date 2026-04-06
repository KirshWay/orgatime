export type CookieMap = Record<string, string | undefined>;

export type CookieRequestLike = {
  cookies?: CookieMap;
};

export type IpRequestLike = {
  ip?: string;
};

export type CookieReplyLike = {
  setCookie: (name: string, value: string, options?: object) => unknown;
  clearCookie: (name: string, options?: object) => unknown;
};

export type MultipartFileLike = {
  fieldname: string;
  filename: string;
  mimetype: string;
  toBuffer: () => Promise<Buffer>;
};

export type MultipartRequestLike = {
  file: (
    options?: Record<string, unknown>,
  ) => Promise<MultipartFileLike | undefined>;
};
