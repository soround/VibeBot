const {useMessage} = require("./composable");
const {onLeave} = require("./composable");
const {onEnter} = require("./composable");
const {watch} = require("./composable");
const {ref} = require("./composable");
const {setCurrentInstance} = require("./composable");
const {getCurrentInstance} = require("./composable");
const {Commander} = require("./composable");


module.exports = {
    getCurrentInstance,
    setCurrentInstance,
    ref,
    watch,
    onEnter,
    onLeave,
    useMessage,
    Commander
};