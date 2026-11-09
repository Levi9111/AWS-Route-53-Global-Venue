import { Response } from 'express';

type TMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
};

type TResponse<T> = {
  statusCode: number;
  success: boolean;
  message?: string;
  meta?: TMeta;
  page?: number;
  limit?: number;
  total?: number;
  data: T | null;
};

const sendResponse = <T>(res: Response, payload: TResponse<T>): void => {
  const page = payload.page ?? payload.meta?.page;
  const limit = payload.limit ?? payload.meta?.limit;
  const total = payload.total ?? payload.meta?.total;

  const body: Record<string, unknown> = {
    success: payload.success,
    message: payload.message,
    data: payload.data,
  };

  if (page !== undefined && limit !== undefined && total !== undefined) {
    body.page = page;
    body.limit = limit;
    body.total = total;
    body.meta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / Math.max(limit, 1)),
    };
  } else if (payload.meta) {
    body.meta = payload.meta;
  }

  res.status(payload.statusCode).json(body);
};

export default sendResponse;
