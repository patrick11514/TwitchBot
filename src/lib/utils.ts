export const parseCommand = (msg: string) => {
    const [commandWithPrefix, ...args] = msg.split(' ');
    const [prefix, ...command] = commandWithPrefix.split('');

    if (prefix !== '!') {
        return null;
    }
    return {
        command: command.join(''),
        args,
    };
};
