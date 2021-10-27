class InvalidDesignError extends Error {
  constructor(message: string) {
    super(message);

    Object.setPrototypeOf(this, InvalidDesignError.prototype);
  }
}

export default InvalidDesignError;
