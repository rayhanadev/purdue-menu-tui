import { Data } from "effect";

export class NetworkError extends Data.TaggedError("NetworkError")<{
  message: string;
}> {}

export class ParseError extends Data.TaggedError("ParseError")<{
  message: string;
}> {}

export class ServerError extends Data.TaggedError("ServerError")<{
  message: string;
  status: number;
  statusText: string;
}> {}

export class GraphQLError extends Data.TaggedError("GraphQLError")<{
  message: string;
  errors: Array<{ message: string }>;
}> {}

export class TimeoutError extends Data.TaggedError("TimeoutError")<{
  message: string;
}> {}
