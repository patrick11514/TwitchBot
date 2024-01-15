export const parseCommand = (msg: string) => {
    const [commandWithPrefix, ...args] = msg.split(' ')
    const [prefix, ...command] = commandWithPrefix.split('')

    console.log(commandWithPrefix, args, prefix, command)

    if (prefix !== '!') {
        return null
    }
    return {
        command: command.join(''),
        args,
    }
}
