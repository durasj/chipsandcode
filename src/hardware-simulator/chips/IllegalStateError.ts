class IllegalStateError extends Error {
  constructor(message: string) {
    super(message);

    Object.setPrototypeOf(this, IllegalStateError.prototype);
  }
}

export default IllegalStateError;
