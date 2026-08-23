class AsyncHandler {
    static wrap(requestHandler) {
        return (req, res, next) => {
            Promise.resolve(requestHandler(req, res, next)).catch(next);
        };
    }
}

const asyncHandler = (requestHandler) => AsyncHandler.wrap(requestHandler);

export { AsyncHandler, asyncHandler };