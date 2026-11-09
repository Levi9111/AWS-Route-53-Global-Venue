import { Error } from 'mongoose';
import { TErrorSources, TGenericErrorResponse } from '../interfaces/error';

const handleCastError = (err: Error.CastError): TGenericErrorResponse => {
  const errorSources: TErrorSources = [
    {
      path: err.path,
      message: `Invalid value for field '${err.path}': ${err.value}`,
    },
  ];
  return { statusCode: 400, message: 'Invalid ID', errorSources };
};

export default handleCastError;
