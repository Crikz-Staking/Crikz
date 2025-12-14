import type { ArgumentTypeToValueType } from "../../../types/arguments.js";
import type { NewTaskActionFunction, NewTaskDefinitionBuilder, NewTaskDefinition, TaskOverrideActionFunction, TaskOverrideDefinitionBuilder, TaskOverrideDefinition, EmptyTaskDefinitionBuilder, EmptyTaskDefinition, ExtendTaskArguments, TaskArguments, LazyActionObject } from "../../../types/tasks.js";
import { ArgumentType } from "../../../types/arguments.js";
export declare class EmptyTaskDefinitionBuilderImplementation implements EmptyTaskDefinitionBuilder {
    #private;
    constructor(id: string | string[], description?: string);
    build(): EmptyTaskDefinition;
}
export declare class NewTaskDefinitionBuilderImplementation<TaskArgumentsT extends TaskArguments = TaskArguments> implements NewTaskDefinitionBuilder<TaskArgumentsT> {
    #private;
    constructor(id: string | string[], description?: string);
    setDescription(description: string): this;
    setAction(action: LazyActionObject<NewTaskActionFunction<TaskArgumentsT>>): this;
    addOption<NameT extends string, TypeT extends ArgumentType = ArgumentType.STRING>({ name, shortName, description, type, defaultValue, hidden, }: {
        name: NameT;
        shortName?: string;
        description?: string;
        type?: TypeT;
        defaultValue: ArgumentTypeToValueType<TypeT>;
        hidden?: boolean;
    }): NewTaskDefinitionBuilder<ExtendTaskArguments<NameT, TypeT, TaskArgumentsT>>;
    addFlag<NameT extends string>(flagConfig: {
        name: NameT;
        shortName?: string;
        description?: string;
        hidden?: boolean;
    }): NewTaskDefinitionBuilder<ExtendTaskArguments<NameT, ArgumentType.FLAG, TaskArgumentsT>>;
    addLevel<NameT extends string>(levelConfig: {
        name: NameT;
        shortName?: string;
        description?: string;
        defaultValue?: number;
    }): NewTaskDefinitionBuilder<ExtendTaskArguments<NameT, ArgumentType.LEVEL, TaskArgumentsT>>;
    addPositionalArgument<NameT extends string, TypeT extends ArgumentType = ArgumentType.STRING>(argConfig: {
        name: NameT;
        description?: string;
        type?: TypeT;
        defaultValue?: ArgumentTypeToValueType<TypeT>;
    }): NewTaskDefinitionBuilder<ExtendTaskArguments<NameT, TypeT, TaskArgumentsT>>;
    addVariadicArgument<NameT extends string, TypeT extends ArgumentType = ArgumentType.STRING>(argConfig: {
        name: NameT;
        description?: string;
        type?: TypeT;
        defaultValue?: Array<ArgumentTypeToValueType<TypeT>>;
    }): NewTaskDefinitionBuilder<ExtendTaskArguments<NameT, TypeT, TaskArgumentsT>>;
    build(): NewTaskDefinition;
}
export declare class TaskOverrideDefinitionBuilderImplementation<TaskArgumentsT extends TaskArguments = TaskArguments> implements TaskOverrideDefinitionBuilder<TaskArgumentsT> {
    #private;
    constructor(id: string | string[]);
    setDescription(description: string): this;
    setAction(action: LazyActionObject<TaskOverrideActionFunction<TaskArgumentsT>>): this;
    addOption<NameT extends string, TypeT extends ArgumentType = ArgumentType.STRING>({ name, shortName, description, type, defaultValue, hidden, }: {
        name: NameT;
        shortName?: string;
        description?: string;
        type?: TypeT;
        defaultValue: ArgumentTypeToValueType<TypeT>;
        hidden?: boolean;
    }): TaskOverrideDefinitionBuilder<ExtendTaskArguments<NameT, TypeT, TaskArgumentsT>>;
    addFlag<NameT extends string>(flagConfig: {
        name: string;
        shortName?: string;
        description?: string;
        hidden?: boolean;
    }): TaskOverrideDefinitionBuilder<ExtendTaskArguments<NameT, ArgumentType.FLAG, TaskArgumentsT>>;
    addLevel<NameT extends string>(levelConfig: {
        name: string;
        shortName?: string;
        description?: string;
        defaultValue?: number;
    }): TaskOverrideDefinitionBuilder<ExtendTaskArguments<NameT, ArgumentType.LEVEL, TaskArgumentsT>>;
    build(): TaskOverrideDefinition;
}
//# sourceMappingURL=builders.d.ts.map