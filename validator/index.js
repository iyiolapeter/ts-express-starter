const validator = require("validator");

const extraValidators = ['contains', 'equals', 'matches'];
const extraSanitizers = [
  'blacklist',
  'escape',
  'unescape',
  'normalizeEmail',
  'ltrim',
  'rtrim',
  'trim',
  'stripLow',
  'whitelist'
];

const isSanitizer = name => name.startsWith('to') || extraSanitizers.includes(name);
const isValidator = name => name.startsWith('is') || extraValidators.includes(name);

class ValidationNode {
    
    constructor(id) {
        this.rule = {
            id,
            required: false,
            validators: [],
            sanitizers: []
        };
    }

    exists() {
        this.rule.required = true;
        return this;
    }

    optional() {
        this.rule.required = false;
        return this;
    }

    isArray() {
        return this.customValidator((value)=>{
            return Array.isArray(value);
        }).withMessage(`${this.rule.id} must be an array`);
    }

    customValidator(fn) {
        this.rule.validators.push({
            fn,
            args: [],
        });
        return this;
    }

    customSanitizer(fn) {
        this.rule.sanitizers.push({
            fn,
            args: [],
        });
        return this;
    }

    withMessage(message) {
        let len = this.rule.validators.length;
        if(len <= 0){
            return this;
        }
        this.rule.validators[len - 1].message = message;
        return this;
    }
    
    not() {
        this.negateNext = true;
    }

    end() {
        return this.rule;
    }
}

for(let key of Object.keys(validator)){
    if(key !== "default" && typeof validator[key] == "function"){
        if(isSanitizer(key)){
            ValidationNode.prototype[key] = function (...args){
                this.rule.sanitizers.push({
                    fn: key,
                    args,
                });
                return this;
            };
        } else if(isValidator(key)){
            ValidationNode.prototype[key] = function (...args){
                this.rule.validators.push({
                    fn: key,
                    args,
                });
                return this;
            };
        }
    }
}

class OneOf {
    constructor(nodes){
        this.nodes = nodes;
    }

    withMessage(message){
        this.message = message;
    }
}

function node(id){
    return new ValidationNode(id);
}

exports.node = node;

function oneOf(nodes){
    return new OneOf(nodes);
}

exports.oneOf = oneOf;

async function validate(obj, nodes = [], options = {}){
    let { onlyFirst = true } = options;
    let errors = [];
    for(let node of nodes){
        let passed = true;
        if(node instanceof ValidationNode){
            node = node.end();
        } else if(typeof node !== "object") {
            continue;
        }
        let {id, ...rule} = node;
        if(rule.required && !obj[id]){
            passed = false;
            errors.push({
                parameter: id,
                message: `${id} is required`
            });
            if(onlyFirst){
                continue;
            }
        }
        if(!rule.required && !obj[id]){
            continue;
        }
        for(let {fn: predicate, args, message} of rule.validators){
            if(typeof predicate === "string"){
                if(["string", "number"].includes(typeof obj[id])){
                    if(!validator[predicate](String(obj[id]), ...args)){
                        passed = false;
                        errors.push({
                            parameter: id,
                            message: message || "Invalid Value"
                        });
                        if(onlyFirst){
                            continue;
                        }
                    }
                } else {
                    passed = false
                    errors.push({
                        parameter: id,
                        message: "Invalid type"
                    });
                };
            } else if(typeof predicate === "function"){
                if(!(await predicate(obj[id], obj))){
                    passed = false;
                    errors.push({
                        parameter: id,
                        message: message || "Invalid Value"
                    });
                    if(onlyFirst){
                        continue;
                    }
                };
            } else {
                throw new Error("Unknown validator "+predicate);
            }
        }
        if(passed){
            for(let {fn: sanitizer, args} of rule.sanitizers){
                if(typeof sanitizer === "string"){
                    obj[id] = validator[sanitizer](String(obj[id]), ...args);
                } else if(typeof sanitizer === "function") {
                    obj[id] = await sanitizer(obj[id], obj, ...args);
                }
            }
        }
    }
    return errors;
}

exports.validate = validate;