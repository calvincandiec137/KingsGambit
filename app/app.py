from flask import Flask, render_template, session, request, redirect, url_for, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
import uuid

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
socketio = SocketIO(app, cors_allowed_origins="*")

games = {}

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/create-room', methods=['POST'])
def create_room():
    player_name = request.form.get('player_name')
    if not player_name:
        return redirect(url_for('home'))
    
    room_id = str(uuid.uuid4())[:8]  # shorter id
    player_id = str(uuid.uuid4())
    
    games[room_id] = {
        'white': {'id': player_id, 'name': player_name},
        'black': None,
        'moves': [],
        'status': 'waiting',
        'current_position': 'start'
    }
    
    session['player_id'] = player_id
    session['room_id'] = room_id
    session['player_name'] = player_name
    
    return redirect(url_for('game', room_id=room_id))

@app.route('/join-game', methods=['POST'])
def join_game():
    room_id = request.form.get('room_id')
    player_name = request.form.get('player_name')
    
    if not room_id or not player_name or room_id not in games:
        return redirect(url_for('home'))
    
    game = games[room_id]
    if game['black'] is not None:
        return "Game is full", 400
    
    player_id = str(uuid.uuid4())
    game['black'] = {'id': player_id, 'name': player_name}
    game['status'] = 'playing'
    
    session['player_id'] = player_id
    session['room_id'] = room_id
    session['player_name'] = player_name
    
    socketio.emit('opponent_joined', {
        'black_player': player_name
    }, room=room_id)
    
    return redirect(url_for('game', room_id=room_id))

@app.route('/game/<room_id>')
def game(room_id):
    if room_id not in games:
        return redirect(url_for('home'))
    
    player_id = session.get('player_id')
    if not player_id:
        return redirect(url_for('home'))
    
    game = games[room_id]
    
    player_color = None
    if game['white']['id'] == player_id:
        player_color = 'white'
    elif game['black'] and game['black']['id'] == player_id:
        player_color = 'black'
    
    if not player_color:
        return redirect(url_for('home'))
    
    waiting_for_opponent = game['status'] == 'waiting'
    opponent_name = game['black']['name'] if player_color == 'white' and game['black'] else \
                   game['white']['name'] if player_color == 'black' else None
    
    return render_template('match.html',
                         room_id=room_id,
                         player_color=player_color,
                         player_name=session.get('player_name'),
                         opponent_name=opponent_name,
                         waiting_for_opponent=waiting_for_opponent)

@socketio.on('connect')
def handle_connect():
    room_id = session.get('room_id')
    if room_id:
        join_room(room_id)
        game = games.get(room_id)
        if game and game['status'] == 'playing':
            emit('game_start', {
                'status': 'playing',
                'position': game['current_position']
            }, room=room_id)

@socketio.on('move')
def handle_move(data):
    room_id = session.get('room_id')
    if not room_id in games:
        return
    
    game = games[room_id]
    if game['status'] != 'playing':
        return
    
    game['current_position'] = data['fen']
    game['moves'].append(data)
    
    emit('move_made', {
        'from': data['from'],
        'to': data['to'],
        'fen': data['fen'],
        'move': data['move'],
        'player': session.get('player_name')
    }, room=room_id)

if __name__ == '__main__':
    socketio.run(app, debug=True)