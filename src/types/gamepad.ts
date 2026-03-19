export const Button = {
  Up: "up",
  Down: "down",
  Left: "left",
  Right: "right",
  A: "a",
  B: "b",
  X: "x",
  Y: "y",
  Start: "start",
  Select: "select",
} as const;

export type Button = (typeof Button)[keyof typeof Button];

export const InputState = {
  Pressed: "pressed",
  Released: "released",
} as const;

export type InputState = (typeof InputState)[keyof typeof InputState];

export interface InputEvent {
  type: "input";
  button: Button;
  state: InputState;
  player?: 1 | 2;
}

export interface PlayerAssignedEvent {
  player: 1 | 2;
}

export interface RoomUpdateEvent {
  players: number;
}
