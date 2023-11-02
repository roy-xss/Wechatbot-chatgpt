export declare const retryRequest: <T>(promise: () => Promise<T>, retryTimes?: number, retryInterval?: number) => Promise<T | null>;
