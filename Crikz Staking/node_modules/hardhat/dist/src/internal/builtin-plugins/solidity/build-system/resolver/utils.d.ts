import type { Result } from "./types.js";
import type { ResolvedNpmPackage } from "../../../../../types/solidity.js";
export declare enum PathValidationErrorType {
    DOES_NOT_EXIST = "DOES_NOT_EXIST",
    CASING_ERROR = "CASING_ERROR"
}
export declare function validateFsPath(from: string, relative: string): Promise<Result<undefined, {
    type: PathValidationErrorType.DOES_NOT_EXIST;
} | {
    type: PathValidationErrorType.CASING_ERROR;
    correctCasing: string;
}>>;
/**
 * Resolves a subpath for a given package, when it uses package#exports
 * @param npmPackage The npm package.
 * @param subpath The supath to resolve. Which must use forward slashes.
 * @returns The resolved subpath. Which uses forward slashes.
 */
export declare function resolveSubpathWithPackageExports(npmPackage: Required<ResolvedNpmPackage>, subpath: string): Result<string, undefined>;
//# sourceMappingURL=utils.d.ts.map