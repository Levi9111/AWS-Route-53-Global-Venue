import { TErrorSources, TGenericErrorResponse } from '../interfaces/error';

const handleDuplicateError = (err: {
  message: string;
}): TGenericErrorResponse => {
  const match = err.message.match(/"([^"]*)"/);
  const extractedMessage = match ? match[1] : 'Field';
  const errorSources: TErrorSources = [
    { path: '', message: `'${extractedMessage}' already exists` },
  ];
  return { statusCode: 409, message: 'Duplicate Entry', errorSources };
};

export default handleDuplicateError;
