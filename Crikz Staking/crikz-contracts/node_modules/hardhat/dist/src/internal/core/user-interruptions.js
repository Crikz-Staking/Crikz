import { assertHardhatInvariant } from "@nomicfoundation/hardhat-errors";
import { AsyncMutex } from "@nomicfoundation/hardhat-utils/synchronization";
export class UserInterruptionManagerImplementation {
    #hooks;
    #mutex = new AsyncMutex();
    constructor(hooks) {
        this.#hooks = hooks;
    }
    async displayMessage(interruptor, message) {
        return this.#mutex.exclusiveRun(async () => {
            return this.#hooks.runHandlerChain("userInterruptions", "displayMessage", [interruptor, message], defaultDisplayMessage);
        });
    }
    async requestInput(interruptor, inputDescription) {
        return this.#mutex.exclusiveRun(async () => {
            return this.#hooks.runHandlerChain("userInterruptions", "requestInput", [interruptor, inputDescription], defaultRequestInput);
        });
    }
    async requestSecretInput(interruptor, inputDescription) {
        return this.#mutex.exclusiveRun(async () => {
            return this.#hooks.runHandlerChain("userInterruptions", "requestSecretInput", [interruptor, inputDescription], defaultRequestSecretInput);
        });
    }
    async uninterrupted(f) {
        return this.#mutex.exclusiveRun(f);
    }
}
async function defaultDisplayMessage(_context, interruptor, message) {
    const chalk = (await import("chalk")).default;
    console.log(chalk.blue(`[${interruptor}]`) + ` ${message}`);
}
async function defaultRequestInput(_context, interruptor, inputDescription) {
    const { createInterface } = await import("node:readline");
    const chalk = (await import("chalk")).default;
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => {
        rl.question(chalk.blue(`[${interruptor}]`) + ` ${inputDescription}: `, (answer) => {
            resolve(answer);
            rl.close();
        });
    });
}
async function defaultRequestSecretInput(_context, interruptor, inputDescription) {
    const { createInterface } = await import("node:readline");
    const chalk = (await import("chalk")).default;
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions --
    We need to access a private property of the readline interface. */
    const rlAsAny = rl;
    let initialMessage;
    rlAsAny._writeToOutput = (out) => {
        if (initialMessage === undefined || out.length !== 1) {
            if (initialMessage === undefined) {
                initialMessage = out;
            }
            assertHardhatInvariant(rlAsAny.output !== undefined, "Espected readline output to be defined");
            // We show the initial message as is
            if (out.startsWith(initialMessage)) {
                rlAsAny.output.write(initialMessage);
                out = out.slice(initialMessage.length);
            }
            else if (out.trim() === "") {
                rlAsAny.output.write(out);
                out = "";
            }
        }
        // We show the rest of the chars as "*"
        for (const _ of out) {
            rlAsAny.output.write("*");
        }
    };
    return new Promise((resolve) => {
        rl.question(chalk.blue(`[${interruptor}]`) + ` ${inputDescription}: `, (answer) => {
            resolve(answer);
            rl.close();
        });
    });
}
//# sourceMappingURL=user-interruptions.js.map