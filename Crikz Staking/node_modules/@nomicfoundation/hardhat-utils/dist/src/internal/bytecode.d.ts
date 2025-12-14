import type { PrefixedHexString } from "../hex.js";
export interface Artifact {
    bytecode: string;
    linkReferences: {
        [inputSourceName: string]: {
            [libraryName: string]: Array<{
                start: number;
                length: number;
            }>;
        };
    };
}
export interface LibraryLink {
    sourceName: string;
    libraryName: string;
    libraryFqn: string;
    address: string;
}
export interface LibraryAddresses {
    [contractName: string]: PrefixedHexString;
}
/**
 * Check that the provided library addresses are valid Ethereum addresses.
 * If any of them are not, an InvalidLibraryAddressError is thrown.
 */
export declare function checkProvidedLibraryAddresses(providedLibraries: LibraryAddresses): void;
/**
 * Check that the provided libraries can't be resolved to multiple libraries, or
 * that they are not needed by the contract. If any of these conditions are met,
 * an AmbiguousLibraryNameError or an UnnecessaryLibraryError is thrown.
 */
export declare function checkAmbiguousOrUnnecessaryLinks(providedLibraries: LibraryAddresses, neededLibraries: LibraryLink[]): void;
/**
 * Check that each library is only provided once, either by its name or its
 * fully qualified name. If a library is provided more than once, an
 * OverlappingLibrariesError is thrown.
 */
export declare function checkOverlappingLibraryNames(providedLibraries: LibraryAddresses, neededLibraries: LibraryLink[]): void;
/**
 * Check if the needed libraries have all their addresses resolved. If an
 * address is missing, it means that the user didn't provide it in the
 * providedLibraries map. In that case, an MissingLibrariesError is thrown.
 */
export declare function checkMissingLibraryAddresses(neededLibraries: LibraryLink[]): void;
//# sourceMappingURL=bytecode.d.ts.map