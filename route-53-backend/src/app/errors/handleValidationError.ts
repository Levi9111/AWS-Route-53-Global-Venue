import { Error } from 'mongoose';
import { TErrorSources, TGenericErrorResponse } from '../interfaces/error';

const handleValidationError = (
  err: Error.ValidationError,
): TGenericErrorResponse => {
  const errorSources: TErrorSources = Object.values(err.errors).map(
    (val: Error.ValidatorError | Error.CastError) => ({
      path: val?.path,
      message: val?.message,
    }),
  );
  return { statusCode: 400, message: 'Validation Error', errorSources };
};

export default handleValidationError;
