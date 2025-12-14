import { opGenesisState, opLatestHardfork, l1GenesisState, l1HardforkLatest, IncludeTraces, FsAccessPermission, CollectStackTraces, } from "@nomicfoundation/edr";
import { hexStringToBytes } from "@nomicfoundation/hardhat-utils/hex";
import chalk from "chalk";
import { DEFAULT_VERBOSITY, OPTIMISM_CHAIN_TYPE } from "../../constants.js";
import { formatArtifactId } from "./formatters.js";
function hexStringToBuffer(hexString) {
    return Buffer.from(hexStringToBytes(hexString));
}
export function solidityTestConfigToRunOptions(config) {
    return config;
}
export async function solidityTestConfigToSolidityTestRunnerConfigArgs({ chainType, projectRoot, config, verbosity, observability, testPattern, generateGasReport, }) {
    const fsPermissions = [
        config.fsPermissions?.readWriteFile?.map((p) => ({
            access: FsAccessPermission.ReadWriteFile,
            path: p,
        })) ?? [],
        config.fsPermissions?.readFile?.map((p) => ({
            access: FsAccessPermission.ReadFile,
            path: p,
        })) ?? [],
        config.fsPermissions?.writeFile?.map((p) => ({
            access: FsAccessPermission.WriteFile,
            path: p,
        })) ?? [],
        config.fsPermissions?.dangerouslyReadWriteDirectory?.map((p) => ({
            access: FsAccessPermission.DangerouslyReadWriteDirectory,
            path: p,
        })) ?? [],
        config.fsPermissions?.readDirectory?.map((p) => ({
            access: FsAccessPermission.ReadDirectory,
            path: p,
        })) ?? [],
        config.fsPermissions?.dangerouslyWriteDirectory?.map((p) => ({
            access: FsAccessPermission.DangerouslyWriteDirectory,
            path: p,
        })) ?? [],
    ].flat(1);
    const sender = config.from === undefined ? undefined : hexStringToBuffer(config.from);
    const txOrigin = config.txOrigin === undefined
        ? undefined
        : hexStringToBuffer(config.txOrigin);
    const blockCoinbase = config.coinbase === undefined
        ? undefined
        : hexStringToBuffer(config.coinbase);
    const localPredeploys = chainType === OPTIMISM_CHAIN_TYPE
        ? opGenesisState(opLatestHardfork())
        : l1GenesisState(l1HardforkLatest());
    let includeTraces = IncludeTraces.None;
    if (verbosity >= 5) {
        includeTraces = IncludeTraces.All;
    }
    else if (verbosity >= 3) {
        includeTraces = IncludeTraces.Failing;
    }
    const blockGasLimit = config.blockGasLimit === false ? undefined : config.blockGasLimit;
    const disableBlockGasLimit = config.blockGasLimit === false;
    const blockDifficulty = config.prevRandao;
    let ethRpcUrl;
    if (config.forking?.url !== undefined) {
        ethRpcUrl = await config.forking.url.get();
    }
    const forkBlockNumber = config.forking?.blockNumber;
    let rpcEndpoints;
    if (config.forking?.rpcEndpoints !== undefined) {
        rpcEndpoints = {};
        for (const [name, configValue] of Object.entries(config.forking.rpcEndpoints)) {
            rpcEndpoints[name] = await configValue.get();
        }
    }
    const shouldAlwaysCollectStackTraces = verbosity > DEFAULT_VERBOSITY;
    return {
        projectRoot,
        ...config,
        fsPermissions,
        localPredeploys,
        sender,
        txOrigin,
        blockCoinbase,
        observability,
        testPattern,
        includeTraces,
        blockGasLimit,
        disableBlockGasLimit,
        blockDifficulty,
        ethRpcUrl,
        forkBlockNumber,
        rpcEndpoints,
        generateGasReport,
        collectStackTraces: shouldAlwaysCollectStackTraces
            ? CollectStackTraces.Always
            : CollectStackTraces.OnFailure,
    };
}
export function isTestSuiteArtifact(artifact) {
    const abi = JSON.parse(artifact.contract.abi);
    return abi.some(({ type, name }) => {
        if (type === "function" && typeof name === "string") {
            return name.startsWith("test") || name.startsWith("invariant");
        }
        return false;
    });
}
export function warnDeprecatedTestFail(artifact, sourceNameToUserSourceName, colorizer = chalk) {
    const abi = JSON.parse(artifact.contract.abi);
    abi.forEach(({ type, name }) => {
        if (type === "function" &&
            typeof name === "string" &&
            name.startsWith("testFail")) {
            const formattedLocation = formatArtifactId(artifact.id, sourceNameToUserSourceName);
            const warningMessage = `${colorizer.yellow("Warning")}: ${name} The support for the prefix \`testFail*\` has been removed. Consider using \`vm.expectRevert()\` for testing reverts in ${formattedLocation}\n`;
            console.warn(warningMessage);
        }
    });
}
//# sourceMappingURL=helpers.js.map