# King-sGambit
#### Video Demo: 
https://youtu.be/iI9_71zqy08
## Description:
A one on one chess playing platform with private rooms for two players supporting text based chatting and Video calling in the same place for that specific room. 

Each game room and players have a unique ID, ensuring privacy of both players. The project is able to handle dynamic links which are needed when users create a new room and want to join it.

- Problems faced: During the development I faced many errors with libraries and integration. I thought it would be a breeze integrating chessboard.js and working on other features after it. It took me 2 days to figure out what I was doing wrong. Keeping the moves persistent was also an issue which we solved by making objects about the player and game. I feel really great solving all the problems that came along the way. Figuring out data emit using socketIO took the longest and then tweaking CSS was another really hard part. Even though I used internet but still CSS turned out to be one of the things that took me time to get right. 

I have seperated each files into their respective modules like static and templates for flask. And inside static I have further divided them into assets, css and js.

### Backend:
app.py: It is the backbone of this project which handles all the routing and socketio related functionalities.

### Frontend:
#### CSS Files

home.css: Styles the landing page with a dark theme, handling layout for the create/join game forms and responsive design.

match.css: Manages the grid layout of the game room, including board positioning, chat interface, video controls, and move history panel. Implements custom scrollbars and responsive design for all game components.

#### JavaScript Files

chat.js: Handles real-time chat functionality using Socket.IO, including message sending/receiving and chat UI updates.
game.js: Core chess game logic handler - manages board state, move validation, turn management, player color assignment, and synchronizes moves between players through Socket.IO.
vc.js: Implements WebRTC video calling using PeerJS.

#### HTML Files

home.html: Landing page template with forms for creating new games or joining existing ones via room ID.

match.html: Main game interface template that has the chessboard, move history, chat, and video calling components. Initializes all required JavaScript modules.

### Installation:
#### Prerequisites:
1. Python 3.8 or higher
2. pip
3. Any modern web browser

#### Setup:
1. Clone my repository
```
git clone https://github.com/BhaveshKukreja29/Kings-Gambit.git
```
2. Open project in VScode or IDE of your choice
3. Open terminal inside IDE and change to app folder
```
cd app
``` 
4. Inside app folder run 
```
flask run
```
5. To access the website open your browser and go to 
```
http://localhost:5000
```

### Usage:
The website has a very simple and straight forward User Interface. You can enter your name in the text field to create a new room and then invite someone or join a room using the invite you already have.

Inside the room you can drag and drop the chess pieces when it's your turn and send texts messages using the texting section on the bottom right side and start a video call to your friend by clicking "Start Video" and then you can unmute to speak.

### Acknowledgements

This project leverages several key open source technologies that handle core functionality:

#### Chess Engine & Interface
- chess.js - Provides the complete chess logic, move validation, game state management, and rules enforcement.
- chessboard.js (Chris Oakman) - Handles the interactive chess board UI, piece movement, position rendering, and board state management.
- chessboard.css - Base styling for the chess interface adapted from chessboard.js
- Chess pieces and Chessboard were provided by chessboard.js.

#### Real-time Communication 
- Socket.IO - Powers all real-time game state synchronization between players, handles room management, move broadcasting, and chat message delivery.
- PeerJS - Abstracts WebRTC implementation to enable peer-to-peer video calling functionality between players.
- Flask-SocketIO - Data flow between Flask backend and Socket.IO, managing WebSocket connections and event handling.

#### Web Framework & UI
- Flask - Core web framework handling routing, session management, and game state persistence.
- jQuery CDN - DOM manipulation and event handling for the chess interface.
- Modern CSS Grid & Flexbox - Layout system for the responsive game interface.

#### Development Tools
- W3Schools - Revisiting CSS concepts and snippets related to specific components.
- Claude and ChatGPT - PeerJS integration help and optimization suggestions.
- CS50 Notes - Revision of Flask core concepts and HTML.

#### Icons & Assets
The website Logo and Icons are made by myself.

A big thanks to the open source community, I wouldn't have been able to imagine this if I was asked to start working with raw connections and rendering (One day I will.). I truly have felt the feeling of "Standing on the shoulders of giants" with this project.