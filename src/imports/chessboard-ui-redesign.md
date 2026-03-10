Update the current UI of the 8-Queens puzzle project to resemble a real chess interface instead of a technical algorithm visualizer.

Do not change any of the existing logic, puzzle rules, or functionality.
Only redesign the visual interface and layout.

The board interactions, algorithm logic, and solution checking should remain exactly the same.

♜ Chessboard Redesign

Replace the current grid-style board with a classic chessboard appearance.

Board specifications:

8×8 grid

Alternating light and dark squares

Light squares: ivory (#f0d9b5)

Dark squares: brown (#b58863)

Add subtle chessboard styling:

Slight inner shadow

Smooth rounded edges

Soft board border

Include rank and file labels:

Left side:

8
7
6
5
4
3
2
1

Bottom:

A B C D E F G H
♛ Queen Pieces

Replace simple icons or markers with actual chess queen pieces.

Style:

Elegant vector chess queen

Black queen pieces for placements

Slight shadow for depth

Placement animation:

Queen gently scales in when placed

Smooth fade when removed

⚔ Attack Highlights

Keep the attack detection logic but improve visuals.

Instead of harsh coloring:

Row/Column attacks:

soft red transparent overlay

Diagonal attacks:

subtle glowing diagonal lines

Invalid squares:

rgba(255,0,0,0.25)

Valid safe squares remain neutral.

🎮 Board Interaction Improvements

Add chess-like feedback.

Hover state:

square slightly brightens

Invalid placement:

square shakes slightly

brief red flash

Valid placement:

queen appears smoothly

🎛 UI Layout Cleanup

Simplify the layout so the board is the focus.

Layout structure:

Top bar:

Queen’s Gambit Lab
Mode Toggle (Play / Algorithm / Solutions)

Center:

Large chessboard centered on screen.

Right panel:

Controls

Reset Board
Undo Move
Show Hint
Solve Automatically

Stats:

Queens placed
Safe squares
Solutions found
🎨 Updated Color Theme

Background:

#1e1e1e

Panels:

#2a2a2a

Board colors:

light: #f0d9b5
dark: #b58863

Highlights:

danger: rgba(255,0,0,0.25)
success: gold glow
✨ Completion State

When a valid solution is found:

queens glow softly

board briefly highlights

display message:

“Puzzle Solved — 8 Queens Successfully Placed.”

🎯 Goal of the UI Update

Make the application feel like a real chess puzzle interface instead of a coding tool.

The experience should feel:

strategic

elegant

immersive

chess-inspired

The board and queens should be the visual focus.