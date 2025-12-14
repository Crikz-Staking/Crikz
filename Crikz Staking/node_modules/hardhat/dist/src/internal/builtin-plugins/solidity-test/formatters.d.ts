import type { ArtifactId, CallTrace } from "@nomicfoundation/edr";
export interface Colorizer {
    blue: (text: string) => string;
    green: (text: string) => string;
    red: (text: string) => string;
    cyan: (text: string) => string;
    yellow: (text: string) => string;
    grey: (text: string) => string;
    dim: (text: string) => string;
}
export declare function formatArtifactId(artifactId: ArtifactId, sourceNameToUserSourceName: Map<string, string>): string;
export declare function formatLogs(logs: string[], indent: number, colorizer: Colorizer): string;
export declare function formatTraces(traces: CallTrace[], prefix: string, colorizer: Colorizer): string;
//# sourceMappingURL=formatters.d.ts.map