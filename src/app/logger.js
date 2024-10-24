import chalk from "chalk"
import getDateTime from "../lib/getDateTime.js"
import { log } from "console"

export default function logger(type, event, message) {
    const dateTime = getDateTime()
    switch (type.toLowerCase()) {
        case "error":
            log(
                `${chalk.gray(dateTime
                )}\n${chalk.bold.white.bgRed(
                    `\x20${event.toUpperCase()}\x20`
                )}\x20${message}\n`
            );
            break;
        case "info":
            log(
                `${chalk.gray(dateTime
                )}\n${chalk.bold.white.bgCyan(
                    `\x20${event.toUpperCase()}\x20`
                )}\x20${message}\n`
            );
            break;
        case "primary":
            log(
                `${chalk.gray(dateTime
                )}\n${chalk.bold.white.bgRgb(
                    80,
                    120,
                    255
                )(`\x20${event.toUpperCase()}\x20`)}\x20${message}\n`
            );
            break;
    }
}