declare module 'express-async-handler' {
    import { RequestHandler } from 'express';
    function asyncHandler(fn: RequestHandler): RequestHandler;
    export default asyncHandler;
} 