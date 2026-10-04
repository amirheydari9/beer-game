
import {useEffect, useState} from 'react';

const API_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000';

const roles = [
    'retailer',
    'wholesaler',
    'distributor',
    'factory',
] as const;

type Role = typeof roles[number];

interface Game {
    id: string;
    round: number;
    players: Role[];
}

interface Player {
    role: Role;
    inventory: number;
    backlog: number;
    shipmentsInTransit: number[];
    lastOrderPlaced: number;
    totalCost: number;
}

interface GameState {
    round: number;
    players: Record<Role, Player>;
}

export default function App() {
    const [game, setGame] = useState<Game | null>(null);
    const [state, setState] = useState<GameState | null>(null);
    const [roomId, setRoomId] = useState('');
    const [role, setRole] = useState<Role | null>(null);
    const [order, setOrder] = useState('4');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (!game) {
            return;
        }

        const socket = new WebSocket(
            `${WS_URL}/games/${game.id}/ws`,
);

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.state) {
        setState(data.state);
    }

    if (data.players) {
        setGame((current) =>
            current
                ? {
                    ...current,
                    players: data.players,
                }
                : current,
        );
    }
};

return () => socket.close();
}, [game?.id]);

useEffect(() => {
    setSubmitted(false);
    setOrder('4');
}, [state?.round]);

const createGame = async () => {
    setLoading(true);
    setError('');

    try {
        const response = await fetch(`${API_URL}/games`, {
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error();
        }

        const data = await response.json();

        setGame(data);
        setRoomId(data.id);
        setState(data.state);
    } catch {
        setError('Could not create game');
    } finally {
        setLoading(false);
    }
};

const loadGame = async () => {
    if (!roomId.trim()) {
        return;
    }

    setLoading(true);
    setError('');

    try {
        const response = await fetch(
            `${API_URL}/games/${roomId.trim()}`,
        );

        if (!response.ok) {
            throw new Error();
        }

        const data = await response.json();

        setGame(data);
        setState(data.state);
    } catch {
        setError('Game not found');
    } finally {
        setLoading(false);
    }
};

const joinGame = async (selectedRole: Role) => {
    if (!game) {
        return;
    }

    setLoading(true);
    setError('');

    try {
        const response = await fetch(
            `${API_URL}/games/${game.id}/join`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    role: selectedRole,
                }),
            },
        );

        if (!response.ok) {
            throw new Error();
        }

        const data = await response.json();

        setRole(selectedRole);

        setGame((current) =>
            current
                ? {
                    ...current,
                    players: data.players,
                }
                : current,
        );
    } catch {
        setError('Could not join game');
    } finally {
        setLoading(false);
    }
};

const submitOrder = async () => {
    if (!game || !role) {
        return;
    }

    const quantity = Number(order);

    if (!Number.isInteger(quantity) || quantity < 0) {
        setError('Order must be a non-negative integer');
        return;
    }

    setLoading(true);
    setError('');

    try {
        const response = await fetch(
            `${API_URL}/games/${game.id}/orders`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    role,
                    quantity,
                }),
            },
        );

        if (!response.ok) {
            throw new Error();
        }

        setSubmitted(true);
    } catch {
        setError('Could not place order');
    } finally {
        setLoading(false);
    }
};

if (game && role && state) {
    const player = state.players[role];

    if (!player) {
        return (
            <main>
                <h1>Beer Game</h1>
                <p>Player state not found.</p>
            </main>
        );
    }

    if (state.round >= 20) {
        const totalCost = roles.reduce(
            (total, item) =>
                total + state.players[item].totalCost,
            0,
        );

        return (
            <main>
                <h1>Beer Game</h1>

                <p>
                    Room: <strong>{game.id}</strong>
                </p>

                <h2>Game Finished</h2>

                <p>20 rounds completed.</p>

                <hr />

                <h2>Results</h2>

                {roles.map((item) => (
                    <p key={item}>
                        <strong>{item}</strong>:{' '}
                        {state.players[item].totalCost}
                    </p>
                ))}

                <hr />

                <h2>
                    Total Cost: {totalCost}
                </h2>
            </main>
        );
    }

    return (
        <main>
            <h1>Beer Game</h1>

            <p>
                Room: <strong>{game.id}</strong>
            </p>

            <h2>
                Round {state.round + 1}
            </h2>

            <p>
                Role: <strong>{role}</strong>
            </p>

            <hr />

            <p>
                Inventory: {player.inventory}
            </p>

            <p>
                Backlog: {player.backlog}
            </p>

            <p>
                Shipment arrived:{' '}
                {player.shipmentsInTransit[0] ?? 0}
            </p>

            <p>
                Last order:{' '}
                {player.lastOrderPlaced}
            </p>

            <p>
                Cost so far:{' '}
                {player.totalCost}
            </p>

            <hr />

            <label>
                Order:{' '}
                <input
                    type="number"
                    min="0"
                    step="1"
                    value={order}
                    onChange={(event) =>
                        setOrder(event.target.value)
                    }
                    disabled={submitted || loading}
                />
            </label>

            <button
                type="button"
                onClick={submitOrder}
                disabled={submitted || loading}
            >
                {submitted
                    ? 'Order submitted'
                    : 'Submit Order'}
            </button>

            <p>
                Players:{' '}
                {game.players.length} / 4
            </p>

            {submitted && (
                <p>
                    Waiting for other players...
                </p>
            )}

            {error && <p>{error}</p>}
        </main>
    );
}

return (
    <main>
        <h1>Beer Game</h1>

        {!game && (
            <>
                <button
                    type="button"
                    onClick={createGame}
                    disabled={loading}
                >
                    Create Game
                </button>

                <hr />

                <input
                    value={roomId}
                    onChange={(event) =>
                        setRoomId(event.target.value)
                    }
                    placeholder="Room ID"
                />

                <button
                    type="button"
                    onClick={loadGame}
                    disabled={loading}
                >
                    Join Room
                </button>
            </>
        )}

        {game && !role && (
            <>
                <p>
                    Room:{' '}
                    <strong>{game.id}</strong>
                </p>

                <h2>Choose your role</h2>

                {roles.map((item) => {
                    const taken =
                        game.players.includes(item);

                    return (
                        <button
                            key={item}
                            type="button"
                            disabled={
                                taken || loading
                            }
                            onClick={() =>
                                joinGame(item)
                            }
                        >
                            {item}
                            {taken ? ' - taken' : ''}
                        </button>
                    );
                })}

                <p>
                    Players:{' '}
                    {game.players.length} / 4
                </p>

                {error && <p>{error}</p>}
            </>
        )}
    </main>
);
}
