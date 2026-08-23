class ApiError extends Error {
    constructor(statusCode, message = "Something went wrong", errors = [], code = "INTERNAL_SERVER_ERROR", details = {}) {
        super(message);
        this.name = "ApiError";
        this.statusCode = statusCode;
        this.errors = errors;
        this.code = code;
        this.details = details;
        this.success = false;
        this.data = null;
        Error.captureStackTrace(this, ApiError);
    }
}

export { ApiError };