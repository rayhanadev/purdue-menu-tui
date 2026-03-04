import type { Dispatch, SetStateAction } from "react";
import { Effect } from "effect";
import type { AsyncState } from "./types";

export function runEffect<T, E>(
  effect: Effect.Effect<T, E>,
  setState: Dispatch<SetStateAction<AsyncState<T>>>,
): void {
  setState({ data: null, error: null, loading: true });
  Effect.runPromise(
    effect.pipe(
      Effect.match({
        onSuccess: (data) => ({ data, error: null, loading: false }) as AsyncState<T>,
        onFailure: (e) =>
          ({
            data: null,
            error: e instanceof Error ? e.message : String(e),
            loading: false,
          }) as AsyncState<T>,
      }),
    ),
  ).then(setState);
}
