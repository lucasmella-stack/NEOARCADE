import { create } from "zustand";

interface GameState {
  roomId: string | null;
  playerNumber: 1 | 2 | null;
  connectedPlayers: number;
  isConnected: boolean;

  setRoomId: (id: string) => void;
  setPlayerNumber: (n: 1 | 2) => void;
  setConnectedPlayers: (n: number) => void;
  setConnected: (v: boolean) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  roomId: null,
  playerNumber: null,
  connectedPlayers: 0,
  isConnected: false,

  setRoomId: (id) => set({ roomId: id }),
  setPlayerNumber: (n) => set({ playerNumber: n }),
  setConnectedPlayers: (n) => set({ connectedPlayers: n }),
  setConnected: (v) => set({ isConnected: v }),
  reset: () =>
    set({
      roomId: null,
      playerNumber: null,
      connectedPlayers: 0,
      isConnected: false,
    }),
}));
