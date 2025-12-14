import { isObject } from "@nomicfoundation/hardhat-utils/lang";
export function isDebugTraceResult(result) {
    return (isObject(result) &&
        "pass" in result &&
        "gasUsed" in result &&
        "structLogs" in result);
}
export function isEdrProviderErrorData(errorData) {
    return isObject(errorData) && "data" in errorData;
}
//# sourceMappingURL=type-validation.js.map