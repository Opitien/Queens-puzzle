♟️ Queen’s Gambit Lab

An interactive exploration of the classic N-Queens Problem, where strategy meets algorithmic thinking.

Queen’s Gambit Lab transforms a well-known computer science puzzle into a visual chessboard experience, allowing users to place queens, observe attack constraints, and watch a backtracking algorithm solve the puzzle in real time.

This project blends mathematics, game theory, and interactive UI design to make algorithmic problem solving intuitive and engaging.

🧠 The Problem

The Eight Queens Problem asks:

How can eight queens be placed on a chessboard so that none of them attack each other?

In chess, a queen can attack along:

Rows

Columns

Diagonals

The challenge is to position all queens so that no two share any of these paths.

Although the board seems simple, there are 92 valid solutions.

🎮 Features
♟️ Interactive Chessboard

Classic 8×8 chessboard interface

Click to place or remove queens

Real-time attack detection

⚔ Conflict Visualization

Attacked squares highlighted instantly

Rows, columns, and diagonals dynamically updated

Invalid placements visually indicated

🧠 Algorithm Mode

Watch a backtracking algorithm solve the puzzle step by step.

Includes:

step-by-step solving

recursive placement logic

backtracking visualization

🧩 Solution Explorer

Browse valid solutions to the puzzle and understand how the board can be arranged.

🎨 Chess-Inspired UI

Realistic chessboard styling

Queen pieces with smooth animations

Minimal, focused interface

🧮 Algorithm

The puzzle is solved using a Backtracking Algorithm, a common approach for solving constraint satisfaction problems.

High level approach:

Place a queen in the first column.

Move to the next column.

Check if the placement is safe.

If not safe, try the next row.

If no safe row exists, backtrack to the previous column.

This recursive exploration continues until a valid configuration is found.

🛠 Tech Stack

React

Vite

Tailwind CSS

JavaScript

The interface focuses on fast rendering and clean interactive feedback for board updates.

🚀 Getting Started

Clone the repository:

git clone https://github.com/opitien/queens-gambit-lab.git

Navigate into the project:

cd queens-gambit-lab

Install dependencies:

npm install

Run the development server:

npm run dev
📚 Educational Value

This project demonstrates concepts used across computer science:

Constraint Satisfaction Problems

Backtracking Algorithms

Recursive Search

Visualization of Algorithms

Interactive Educational Tools

🌟 Future Improvements

Potential upgrades:

N-Queens board size selector

Algorithm speed controls

Solution counter

3D chess pieces

Multiplayer puzzle challenges

♜ Inspiration

The N-Queens problem dates back to 1850, when it was introduced by chess composer Max Bezzel.

Since then, it has become a classic example used to teach search algorithms and constraint solving in computer science.

📄 License

MIT License