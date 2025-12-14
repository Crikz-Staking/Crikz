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
export declare function withDebugLogs<This, Args extends any[], Return>(tag?: string): (originalMethod: (this: This, ...args: Args) => Return, _context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>) => (this: This, ...args: Args) => Return;
//# sourceMappingURL=debug.d.ts.map