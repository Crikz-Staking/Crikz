import debugLib from "debug";
/**
 * A simple decorator that adds debug logging for when a method is entered and exited.
 *
 * This decorator is meant to be used for debugging purposes only. It should not be committed in runtime code.
 *
 * Example usage:
 *
 * ```
 * class MyClass {
 *   @withDebugLogs("MyClass:exampleClassMethod")
 *   public function exampleClassMethod(...)
 * }
 * ```
 */
export function withDebugLogs(tag = "") {
    return function actualDecorator(originalMethod, _context) {
        const log = debugLib(`hardhat:dev:core${tag === "" ? "" : `:${tag}`}`);
        function replacementMethod(...args) {
            log(`Entering method with args:`, args);
            const result = originalMethod.call(this, ...args);
            log(`Exiting method.`);
            return result;
        }
        return replacementMethod;
    };
}
//# sourceMappingURL=debug.js.map