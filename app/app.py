from flask import Flask, render_template, session, request, redirect, url_for
from flask_socketio import SocketIO, emit, join_room, leave_room
import uuid
from dataclasses import dataclass, asdict
from typing import Dict, Optional

app = Flask(__name__)
app.config['SECRET_KEY'] = 'gugugaga'
socketio = SocketIO(app, cors_allowed_origins="*")

#data classes were suggested by claude to ensure proper working
@dataclass
class Player:
    id: str
    name: str

@dataclass
class Game:
    white: Player
    black: Optional[Player]
    moves: list
    status: str
    current_position: str
    
    def to_dict(self):
        return asdict(self)


#i learned about type hints here :p
games: Dict[str, Game] = {}

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/create-room', methods=['POST'])
def create_room():
    player_name = request.form.get('player_name')
    if not player_name:
        return redirect(url_for('home'))
    
    room_id = str(uuid.uuid4())[:8] #makes sure room id is short only
    player_id = str(uuid.uuid4())
    
    white_player = Player(id=player_id, name=player_name)
    games[room_id] = Game(
        white=white_player,
        black=None,
        moves=[],
        status='waiting',
        current_position='start'
    )
    
    session['player_id'] = player_id
    session['room_id'] = room_id
    session['player_name'] = player_name
    
    return redirect(url_for('game', room_id=room_id))

@app.route('/join-game', methods=['POST'])
def join_game():
    room_id = request.form.get('room_id')
    player_name = request.form.get('player_name')
    
    if not room_id or not player_name:
        return "Please provide both room ID and player name", 400
        
    if room_id not in games:
        return "Game room not found", 404
    
    game = games[room_id]
    
    #check rejoin
    player_id = session.get('player_id')
    if player_id:
        if game.white and game.white.id == player_id:
            return redirect(url_for('game', room_id=room_id))
        if game.black and game.black.id == player_id:
            return redirect(url_for('game', room_id=room_id))
    
    if game.black is not None:
        return "This game is already full", 400
    
    #black joins
    player_id = str(uuid.uuid4())
    black_player = Player(id=player_id, name=player_name)
    game.black = black_player
    game.status = 'playing'
    
    session['player_id'] = player_id
    session['room_id'] = room_id
    session['player_name'] = player_name
    
    #notification
    socketio.emit('opponent_joined', {
        'black_player': player_name,
        'game_status': 'playing'
    }, room=room_id)
    
    return redirect(url_for('game', room_id=room_id))

#took help of snippets provided by chatGPT since this is new concept for me.
@app.route('/game/<room_id>')
def game(room_id):
    if room_id not in games:
        return redirect(url_for('home'))
    
    player_id = session.get('player_id')
    if not player_id:
        return redirect(url_for('home'))
    
    game = games[room_id]
    
    #color determinor
    if game.white and game.white.id == player_id:
        player_color = 'white'
        opponent_name = game.black.name if game.black else None
    elif game.black and game.black.id == player_id:
        player_color = 'black'
        opponent_name = game.white.name
    else:
        return "You are not a player in this game", 403
    
    waiting_for_opponent = game.status == 'waiting'
    
    return render_template('match.html',
                         room_id=room_id,
                         player_color=player_color,
                         player_name=session.get('player_name'),
                         opponent_name=opponent_name,
                         waiting_for_opponent=waiting_for_opponent)

@socketio.on('connect')
def handle_connect():
    room_id = session.get('room_id')
    if room_id and room_id in games:
        join_room(room_id)
        game = games[room_id]
        player_id = session.get('player_id')
        
        player_color = 'white' if game.white.id == player_id else 'black'
        
        emit('game_start', {
            'status': game.status,
            'position': game.current_position,
            'waiting_for_opponent': game.status == 'waiting',
            'player_color': player_color
        })

@socketio.on('move')
def handle_move(data):
    room_id = session.get('room_id')
    player_name = session.get('player_name')
    
    if not room_id or room_id not in games:
        return
    
    game = games[room_id]
    if game.status != 'playing':
        return
    
    game.current_position = data['fen']
    game.moves.append(data)
    
    emit('move_made', {
        'from': data['from'],
        'to': data['to'],
        'fen': data['fen'],
        'move': data['move'],
        'player': player_name
    }, room=room_id, include_self=False)

@socketio.on('chat_message')
def handle_chat_message(data):
    room = data['room']
    if room in games:
        emit('chat_message', {
            'message': data['message'],
            'sender': data['sender']
        }, room=room, include_self=False)


@socketio.on('ready_for_call')
def handle_ready_for_call(data):
    room = data['room']
    if room in games:
        emit('opponent_ready_for_call', {
            'peerId': data['peerId']
        }, room=room, include_self=False)

if __name__ == '__main__':
    socketio.run(app, debug=True)