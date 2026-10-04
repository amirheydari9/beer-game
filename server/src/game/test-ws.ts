import WebSocket from 'ws';

const ws = new WebSocket(
    'ws://localhost:3000/games/d922ac4f-7987-45b2-9f59-dea1e13222a0/ws',
);

ws.on('open', () => {
    console.log('CONNECTED');

    ws.send(
        JSON.stringify({
            type: 'state',
        }),
    );
});

ws.on('message', (data) => {
    console.log(
        'MESSAGE:',
        data.toString(),
    );
});

ws.on('error', (error) => {
    console.error('ERROR:', error);
});

ws.on('close', () => {
    console.log('CLOSED');
});
