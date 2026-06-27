"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashOpaqueToken = exports.generateOpaqueToken = void 0;
const crypto_1 = __importDefault(require("crypto"));
const generateOpaqueToken = () => {
    return crypto_1.default.randomBytes(40).toString('hex');
};
exports.generateOpaqueToken = generateOpaqueToken;
const hashOpaqueToken = (token) => {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
};
exports.hashOpaqueToken = hashOpaqueToken;
