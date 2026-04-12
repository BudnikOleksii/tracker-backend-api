import { Injectable } from '@nestjs/common';
import { map } from 'rxjs/operators';
import type { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';

import { convertHeaderToString } from '@/shared/utils/header.utils.js';

interface PaginatedShape {
  object: 'list';
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

function isPaginated(body: unknown): body is PaginatedShape {
  if (typeof body !== 'object' || body === null) {
    return false;
  }
  const b = body as Record<string, unknown>;

  return b.object === 'list' && typeof b.page === 'number' && typeof b.totalPages === 'number';
}

function buildLinkHeader(params: {
  baseUrl: string;
  page: number;
  pageSize: number;
  totalPages: number;
}): string {
  const { baseUrl, page, pageSize, totalPages } = params;
  const url = new URL(baseUrl);
  const makeLink = (p: number, rel: string): string => {
    url.searchParams.set('page', String(p));
    url.searchParams.set('pageSize', String(pageSize));

    return `<${url.toString()}>; rel="${rel}"`;
  };

  const links: string[] = [];
  links.push(makeLink(1, 'first'));
  if (page > 1) {
    links.push(makeLink(page - 1, 'prev'));
  }
  if (page < totalPages) {
    links.push(makeLink(page + 1, 'next'));
  }
  if (totalPages > 0) {
    links.push(makeLink(totalPages, 'last'));
  }

  return links.join(', ');
}

@Injectable()
export class PaginationLinkInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((body: unknown) => {
        if (!isPaginated(body)) {
          return body;
        }

        const httpCtx = context.switchToHttp();
        const request = httpCtx.getRequest<Request>();
        const response = httpCtx.getResponse<Response>();

        const protocol =
          convertHeaderToString(request.headers['x-forwarded-proto']) ?? request.protocol;
        const host = request.get('host') ?? 'localhost';
        const baseUrl = `${protocol}://${host}${request.originalUrl}`;

        const linkValue = buildLinkHeader({
          baseUrl,
          page: body.page,
          pageSize: body.pageSize,
          totalPages: body.totalPages,
        });

        if (linkValue) {
          response.setHeader('Link', linkValue);
        }

        return body;
      }),
    );
  }
}
