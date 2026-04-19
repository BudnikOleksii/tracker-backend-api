export type RequestHeaders = Record<string, string | string[] | undefined>;

export interface HttpRequest {
  headers: RequestHeaders;
  socket?: { remoteAddress?: string };
}

export interface RequestWithCookies {
  cookies?: Record<string, string>;
}
