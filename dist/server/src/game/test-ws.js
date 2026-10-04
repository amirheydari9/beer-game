"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
const ws = new ws_1.default('ws://localhost:3000/games/d922ac4f-7987-45b2-9f59-dea1e13222a0/ws');
ws.on('open', () => {
    console.log('CONNECTED');
    ws.send(JSON.stringify({
        type: 'state',
    }));
});
ws.on('message', (data) => {
    console.log('MESSAGE:', data.toString());
});
ws.on('error', (error) => {
    console.error('ERROR:', error);
});
ws.on('close', () => {
    console.log('CLOSED');
});
