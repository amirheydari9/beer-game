import {useState} from 'react';

const API_URL = 'http://localhost:3000';

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

export default function App() {
    const [game, setGame] = useState<Game | null>(null);
    const [role, setRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const createGame = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/games`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Failed to create game');
            }

            const data = await response.json();

            setGame(data);
        } catch {
            setError('Could not create game');
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
                throw new Error('Failed to join game');
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

    return (
        <main>
            <h1>Beer Game</h1>

            {!game && (
                <button
                    type="button"
                    onClick={createGame}
                    disabled={loading}
                >
                    {loading ? 'Creating...' : 'Create Game'}
                </button>
            )}

            {game && (
                <>
                    <p>Room: {game.id}</p>

                    <h2>Choose your role</h2>

                    {roles.map((item) => {
                        const taken = game.players.includes(item);

                        return (
                            <button
                                key={item}
                                type="button"
                                disabled={taken || loading || role !== null}
                                onClick={() => joinGame(item)}
                            >
                                {item}
                                {taken ? ' - taken' : ''}
                            </button>
                        );
                    })}

                    {role && (
                        <p>
                            You are playing as: <strong>{role}</strong>
                        </p>
                    )}

                    <p>
                        Players: {game.players.length} / 4
                    </p>

                    {game.players.length < 4 && (
                        <p>Waiting for other players...</p>
                    )}

                    {game.players.length === 4 && (
                        <p>Game is ready!</p>
                    )}
                </>
            )}

            {error && (
                <p>{error}</p>
            )}
        </main>
    );
}
