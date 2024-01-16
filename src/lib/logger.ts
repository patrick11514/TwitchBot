import clc from 'cli-color'
import fs from 'fs'
import strip from 'strip-color'

type color =
    | 'blackBright'
    | 'redBright'
    | 'greenBright'
    | 'yellowBright'
    | 'blueBright'
    | 'magentaBright'
    | 'cyanBright'
    | 'whiteBright'
    | 'black'
    | 'red'
    | 'green'
    | 'yellow'
    | 'blue'
    | 'magenta'
    | 'cyan'
    | 'white'

class Logger {
    name: string
    color: color
    time: number = 0

    constructor(name: string, color: color = 'yellow') {
        this.name = name
        this.color = color
    }

    getTime() {
        let date = new Date()

        //HH:MM:SS:MS
        let hours = date.getHours() < 10 ? `0${date.getHours()}` : date.getHours()
        let minutes = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes()
        let seconds = date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds()
        let milliseconds =
            date.getMilliseconds() < 10
                ? `00${date.getMilliseconds()}`
                : date.getMilliseconds() < 100
                  ? `0${date.getMilliseconds()}`
                  : date.getMilliseconds()

        return `${hours}:${minutes}:${seconds}:${milliseconds}`
    }

    log(message: any) {
        if (typeof message == 'object') {
            message = JSON.stringify(message, null, 4)
        }

        this.logToFile(
            `${clc.white('[')}${clc.green(this.getTime())}${clc.white(']')} ${clc.white('[')}${clc.blue(
                'INFO',
            )}${clc.white(']')} ${clc.white('[')}${clc[this.color](this.name)}${clc.white(']')} ${message}`,
        )
    }

    start(message: any) {
        if (typeof message == 'object') {
            message = JSON.stringify(message, null, 4)
        }

        this.time = Date.now()
        this.logToFile(
            `${clc.white('[')}${clc.green(this.getTime())}${clc.white(']')} ${clc.white('[')}${clc.blue(
                'INFO',
            )}${clc.white(']')} ${clc.white('[')}${clc[this.color](this.name)}${clc.white(']')} ${message}`,
        )
    }

    stop(message: any) {
        if (typeof message == 'object') {
            message = JSON.stringify(message, null, 4)
        }

        let ms = Date.now() - this.time
        this.time = 0

        this.logToFile(
            `${clc.white('[')}${clc.green(this.getTime())}${clc.white(']')} ${clc.white('[')}${clc.blue(
                'INFO',
            )}${clc.white(']')} ${clc.white('[')}${clc[this.color](this.name)}${clc.white(']')} ${message} ${clc.white(
                `(${ms} ms)`,
            )}`,
        )
    }

    stopError(message: any) {
        if (typeof message == 'object') {
            message = JSON.stringify(message, null, 4)
        }

        let ms = Date.now() - this.time
        this.time = 0

        this.logToFile(
            `${clc.white('[')}${clc.green(this.getTime())}${clc.white(']')} ${clc.white('[')}${clc.red(
                'ERROR',
            )}${clc.white(']')} ${clc.white('[')}${clc[this.color](this.name)}${clc.white(']')} ${clc.red(
                message,
            )} ${clc.white(`(${ms} ms)`)}`,
        )
    }

    error(message: any) {
        if (typeof message == 'object') {
            message = JSON.stringify(message, null, 4)
        }

        this.logToFile(
            `${clc.white('[')}${clc.green(this.getTime())}${clc.white(']')} ${clc.white('[')}${clc.red(
                'ERROR',
            )}${clc.white(']')} ${clc.white('[')}${clc[this.color](this.name)}${clc.white(']')} ${clc.red(message)}`,
        )
    }

    logToFile(formattedMessage: string) {
        //strip formatting of message and save it to file named by current date YYYY-MM-DD.log if date is only one digit add 0 in front and at the end console log the formatted message
        let date = new Date()
        let year = date.getFullYear()
        let month = date.getMonth() + 1
        let day = date.getDate()

        //filename
        let filename = `${year}-${month < 10 ? `0${month}` : month}-${day < 10 ? `0${day}` : day}.log`

        //strip formatting
        let message = strip(formattedMessage)

        //add it to new line of file
        fs.appendFileSync(`./logs/${filename}`, message + '\n')

        //log formatted message
        console.log(formattedMessage)
    }
}

export default Logger
