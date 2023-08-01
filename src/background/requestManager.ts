export enum RequestToken {
  NewRequest = 0,
}

// [Sean Kelley]:
// Without Bluebird cancellation, this is the simplest thing I can think of to prevent
// simultaneous requests from getting all out of order, when those requests can be issued
// from many different places.
export class RequestManager {
  private _token: RequestToken = RequestToken.NewRequest;

  public startNewRequest(): RequestToken {
    return ++this._token;
  }

  public isRequestLatest(token: RequestToken): boolean {
    return token === this._token;
  }
}
