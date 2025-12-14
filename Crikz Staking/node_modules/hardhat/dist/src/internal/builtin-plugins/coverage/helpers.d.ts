export declare function getCoveragePath(rootPath: string): string;
/**
 * NOTE: The following helpers interact with the global HRE instance only;
 * This is OK because:
 * - They are intended for the internal use only. They are exposed via the
 *   internal public API only.
 * - We know the HRE has been initialized by the time they are used.
 */
export declare function markTestRunStart(id: string): Promise<void>;
export declare function markTestWorkerDone(id: string): Promise<void>;
export declare function markTestRunDone(id: string): Promise<void>;
//# sourceMappingURL=helpers.d.ts.map