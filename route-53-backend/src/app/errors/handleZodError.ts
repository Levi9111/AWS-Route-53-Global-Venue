import { ZodError } from 'zod';
import { TErrorSources, TGenericErrorResponse } from '../interfaces/error';

const handleZodError = (err: ZodError): TGenericErrorResponse => {
  const errorSources: TErrorSources = err.issues.map((issue) => ({
    path: issue.path[issue.path.length - 1] as string,
    message: issue.message,
  }));
  return { statusCode: 400, message: 'Validation Error', errorSources };
};

export default handleZodError;
