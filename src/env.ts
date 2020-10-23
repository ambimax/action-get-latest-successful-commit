declare global {
    export namespace Ambimax {
        export interface Env {}
        export type EnvName = keyof Env;
    }
}

type EnvType = {
    (name: Ambimax.EnvName): string;
} & {
    [Name in Ambimax.EnvName]: string;
};

const getEnv = ((name: Ambimax.EnvName): string => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Environment variable not set: ${name}`);
    }

    return value;
}) as EnvType;

export const env = new Proxy(getEnv, {
    get(target, property) {
        if (property in target) {
            return property;
        }

        return getEnv(property as never);
    },
});
