//initial part is written with help of claude and internet. i used some snippets by claude to make this work
const initVideo = (roomId) => {
    const socket = io();
    let peer = null;
    let localStream = null;
    let currentCall = null;
    
    const localVideo = document.getElementById('localVideo');
    const remoteVideo = document.getElementById('remoteVideo');
    const startVideoButton = document.getElementById('startVideo');
    const toggleAudioButton = document.getElementById('toggleAudio');
    
    const videoContainer = document.querySelector('.video-container');
    const videoStatus = document.createElement('div');
    videoStatus.className = 'video-status active';
    videoStatus.textContent = 'Click "Start Video" to begin';
    videoContainer.appendChild(videoStatus);

    function updateVideoStatus(message) {
        videoStatus.textContent = message;
        videoStatus.className = 'video-status active';
    }

    function initializePeer() {
        if (peer) {
            peer.destroy();
        }

        peer = new Peer(undefined, {
            debug: 2,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' },
                    { urls: 'stun:stun3.l.google.com:19302' },
                    { urls: 'stun:stun4.l.google.com:19302' }
                ]
            }
        });

        peer.on('open', (id) => {
            console.log('Connected with peer ID:', id);
            startVideoButton.disabled = false;
        });

        peer.on('error', (err) => {
            console.error('PeerJS error:', err);
            updateVideoStatus('Connection error. Retrying...');
            setTimeout(initializePeer, 5000);
        });

        peer.on('call', handleIncomingCall);
    }

    async function startLocalVideo() {
        try {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }

            localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            localVideo.srcObject = localStream;
            videoStatus.className = 'video-status';
            startVideoButton.textContent = 'Video Started';
            toggleAudioButton.disabled = false;

            socket.emit('ready_for_call', {
                room: roomId,
                peerId: peer.id
            });

            return true;
        } catch (err) {
            console.error('Media access error:', err);
            handleMediaError(err);
            return false;
        }
    }

    async function handleIncomingCall(call) {
        try {
            if (!localStream) {
                const started = await startLocalVideo();
                if (!started) return;
            }

            currentCall = call;
            call.answer(localStream);
            handleCallStream(call);
        } catch (err) {
            console.error('Error handling incoming call:', err);
            updateVideoStatus('Error connecting to call');
        }
    }

    function handleCallStream(call) {
        call.on('stream', (remoteStream) => {
            remoteVideo.srcObject = remoteStream;
            videoStatus.className = 'video-status';
        });

        call.on('close', () => {
            remoteVideo.srcObject = null;
            updateVideoStatus('Call ended');
        });

        call.on('error', (err) => {
            console.error('Call error:', err);
            updateVideoStatus('Call error occurred');
            currentCall = null;
        });
    }

    async function initiateCall(remotePeerId) {
        try {
            if (!localStream) {
                const started = await startLocalVideo();
                if (!started) return;
            }

            const call = peer.call(remotePeerId, localStream);
            currentCall = call;
            handleCallStream(call);
        } catch (err) {
            console.error('Error initiating call:', err);
            updateVideoStatus('Error starting call');
        }
    }

    function handleMediaError(err) {
        let message = 'Error accessing camera/microphone';
        if (err.name === 'NotAllowedError') {
            message = 'Please allow camera and microphone access';
        } else if (err.name === 'NotFoundError') {
            message = 'Camera or microphone not found';
        }
        updateVideoStatus(message);
        startVideoButton.textContent = 'Retry Video';
        startVideoButton.disabled = false;
    }

    startVideoButton.addEventListener('click', async () => {
        startVideoButton.disabled = true;
        startVideoButton.textContent = 'Starting...';
        updateVideoStatus('Accessing camera...');
        await startLocalVideo();
    });

    toggleAudioButton.addEventListener('click', () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            audioTrack.enabled = !audioTrack.enabled;
            toggleAudioButton.textContent = audioTrack.enabled ? 'Mute' : 'Unmute';
        }
    });

    socket.on('opponent_ready_for_call', (data) => {
        initiateCall(data.peerId);
    });

    toggleAudioButton.disabled = true;
    startVideoButton.disabled = true;
    initializePeer();
};