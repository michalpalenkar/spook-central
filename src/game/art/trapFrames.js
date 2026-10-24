// Hand-drawn 12×8 ghost trap. Keys: s shell, h highlight, y hazard stripe,
// l status light, p feet (see the trap palette).

export const TRAP_FRAME_WIDTH = 12
export const TRAP_FRAME_HEIGHT = 8

export const TRAP_FRAMES = {
  closed: [
    '............',
    '............',
    '.hhhhhhhhhh.',
    '.ssssssssss.',
    '.syyyyyyyys.',
    '.sssssslsss.',
    '.ssssssssss.',
    'pp........pp',
  ],
  open: [
    'h..........h',
    '.h........h.',
    '..h......h..',
    '.ssssssssss.',
    '.syyyyyyyys.',
    '.sssssslsss.',
    '.ssssssssss.',
    'pp........pp',
  ],
}
