class PointPoker {
    constructor() {
        this.players = new Map();
        this.currentPlayer = null;
        this.revealed = false;
        this.activeTicket = null;
        this.ticketHistory = [];

        // Session management
        this.sessionCode = null;
        this.isHost = false;
        this.playerId = this.getOrCreatePlayerId();
        this.db = null;
        this.sessionRef = null;
        this.isOnline = false;

        this.init();
    }

    getOrCreatePlayerId() {
        let id = localStorage.getItem('pointPokerPlayerId');
        if (!id) {
            id = 'p_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
            localStorage.setItem('pointPokerPlayerId', id);
        }
        return id;
    }

    init() {
        this.initFirebase();
        this.loadHistory();
        this.setupEventListeners();
        this.updateUI();
        this.checkUrlForSession();
    }

    initFirebase() {
        try {
            if (typeof firebase !== 'undefined' &&
                typeof firebaseConfig !== 'undefined' &&
                typeof isFirebaseConfigured !== 'undefined' &&
                isFirebaseConfigured) {
                if (!firebase.apps.length) {
                    firebase.initializeApp(firebaseConfig);
                }
                this.db = firebase.database();
                document.getElementById('sessionSection').style.display = 'block';
            }
        } catch (e) {
            console.warn('Firebase initialization failed:', e);
            this.db = null;
        }
    }

    checkUrlForSession() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('session');
        if (code && this.db) {
            const input = document.getElementById('sessionCodeInput');
            if (input) {
                input.value = code.toUpperCase();
            }
        }
    }

    generateSessionCode() {
        const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
        let code = '';
        const array = new Uint8Array(6);
        crypto.getRandomValues(array);
        for (let i = 0; i < 6; i++) {
            code += chars[array[i] % chars.length];
        }
        return code;
    }

    setupEventListeners() {
        // Card selection
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!this.currentPlayer) {
                    alert('Please join the session first!');
                    return;
                }
                if (!this.activeTicket) {
                    alert('Please start voting on a ticket first!');
                    return;
                }
                this.selectCard(e.target.dataset.value, e.target);
            });
        });

        // Join session
        document.getElementById('joinBtn').addEventListener('click', () => {
            this.joinSession();
        });

        // Start voting
        document.getElementById('startVotingBtn').addEventListener('click', () => {
            this.startVoting();
        });

        // Reveal cards
        document.getElementById('revealBtn').addEventListener('click', () => {
            this.stopVoting();
        });

        // Reset
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.reset();
        });

        // Clear history
        document.getElementById('clearHistoryBtn').addEventListener('click', () => {
            this.clearHistory();
        });

        // Enter key for player name
        document.getElementById('playerName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.joinSession();
            }
        });

        // Enter key for ticket input
        document.getElementById('jiraTicket').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.startVoting();
            }
        });

        // Session management buttons
        const createBtn = document.getElementById('createSessionBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.createSession());
        }

        const joinSessionBtn = document.getElementById('joinSessionBtn');
        if (joinSessionBtn) {
            joinSessionBtn.addEventListener('click', () => this.joinSessionByCode());
        }

        const sessionCodeInput = document.getElementById('sessionCodeInput');
        if (sessionCodeInput) {
            sessionCodeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.joinSessionByCode();
            });
        }

        const copyLinkBtn = document.getElementById('copyLinkBtn');
        if (copyLinkBtn) {
            copyLinkBtn.addEventListener('click', () => this.copySessionLink());
        }

        const leaveBtn = document.getElementById('leaveSessionBtn');
        if (leaveBtn) {
            leaveBtn.addEventListener('click', () => this.leaveSession());
        }
    }

    // ---- Session Management ----

    createSession() {
        if (!this.db) {
            alert('Firebase is not configured. See README for setup instructions.');
            return;
        }
        if (!this.currentPlayer) {
            alert('Please enter your name and join first!');
            return;
        }

        const code = this.generateSessionCode();
        this.sessionCode = code;
        this.isHost = true;
        this.isOnline = true;

        this.sessionRef = this.db.ref('sessions/' + code);
        this.sessionRef.set({
            ticket: null,
            revealed: false,
            hostId: this.playerId,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });

        // Add self as player
        this.sessionRef.child('players/' + this.playerId).set({
            name: this.currentPlayer,
            vote: null
        });

        // Update URL
        const url = new URL(window.location.href);
        url.searchParams.set('session', code);
        window.history.replaceState({}, '', url);

        this.attachFirebaseListeners();
        this.updateSessionUI();
    }

    joinSessionByCode() {
        if (!this.db) {
            alert('Firebase is not configured. See README for setup instructions.');
            return;
        }
        if (!this.currentPlayer) {
            alert('Please enter your name and join first!');
            return;
        }

        const input = document.getElementById('sessionCodeInput');
        const code = input.value.toUpperCase().trim();

        if (!code) {
            alert('Please enter a session code');
            return;
        }

        this.db.ref('sessions/' + code).once('value').then((snapshot) => {
            if (!snapshot.exists()) {
                alert('Session not found. Please check the code and try again.');
                return;
            }

            this.sessionCode = code;
            this.sessionRef = this.db.ref('sessions/' + code);
            this.isOnline = true;

            const sessionData = snapshot.val();
            this.isHost = (sessionData.hostId === this.playerId);

            // Add self as player
            this.sessionRef.child('players/' + this.playerId).set({
                name: this.currentPlayer,
                vote: null
            });

            // Update URL
            const url = new URL(window.location.href);
            url.searchParams.set('session', code);
            window.history.replaceState({}, '', url);

            this.attachFirebaseListeners();
            this.updateSessionUI();
        });
    }

    attachFirebaseListeners() {
        if (!this.sessionRef) return;

        this.sessionRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                this.leaveSession();
                return;
            }

            const prevRevealed = this.revealed;

            this.activeTicket = data.ticket || null;
            this.revealed = data.revealed || false;
            this.isHost = (data.hostId === this.playerId);

            // Update players from Firebase
            this.players = new Map();
            if (data.players) {
                Object.entries(data.players).forEach(([id, player]) => {
                    this.players.set(id, {
                        name: player.name,
                        vote: player.vote || null,
                        id: id
                    });
                });
            }

            this.renderPlayers();
            this.updateTicketUI();
            this.updateUI();
            this.updateSessionUI();

            if (this.revealed) {
                this.showResults();
                if (!prevRevealed) {
                    this.saveToHistory();
                }
            } else {
                document.getElementById('results').style.display = 'none';
            }
        });
    }

    leaveSession() {
        if (this.sessionRef && this.playerId) {
            this.sessionRef.child('players/' + this.playerId).remove();
            this.sessionRef.off();
        }

        this.sessionCode = null;
        this.sessionRef = null;
        this.isHost = false;
        this.isOnline = false;
        this.activeTicket = null;
        this.revealed = false;
        this.players = new Map();

        const url = new URL(window.location.href);
        url.searchParams.delete('session');
        window.history.replaceState({}, '', url);

        this.updateSessionUI();
        this.renderPlayers();
        this.updateUI();
        this.updateTicketUI();
        document.getElementById('results').style.display = 'none';
    }

    copySessionLink() {
        if (!this.sessionCode) return;

        const url = new URL(window.location.href);
        url.searchParams.set('session', this.sessionCode);

        navigator.clipboard.writeText(url.toString()).then(() => {
            const btn = document.getElementById('copyLinkBtn');
            const originalText = btn.textContent;
            btn.textContent = '✅ Copied!';
            setTimeout(() => { btn.textContent = originalText; }, 2000);
        }).catch(() => {
            prompt('Copy this link to invite others:', url.toString());
        });
    }

    updateSessionUI() {
        const setupDiv = document.getElementById('sessionSetup');
        const infoDiv = document.getElementById('sessionInfo');

        if (this.sessionCode) {
            setupDiv.style.display = 'none';
            infoDiv.style.display = 'block';
            document.getElementById('sessionCodeDisplay').textContent = this.sessionCode;

            const hostBadge = document.getElementById('hostBadge');
            if (hostBadge) {
                hostBadge.style.display = this.isHost ? 'inline' : 'none';
            }
        } else {
            setupDiv.style.display = 'block';
            infoDiv.style.display = 'none';
        }
    }

    updateTicketUI() {
        const ticketInput = document.getElementById('jiraTicket');
        const startBtn = document.getElementById('startVotingBtn');
        const activeTicketDiv = document.getElementById('activeTicket');
        const activeTicketNumber = document.getElementById('activeTicketNumber');

        if (this.activeTicket) {
            ticketInput.disabled = true;
            ticketInput.value = this.activeTicket;
            startBtn.disabled = true;
            activeTicketDiv.style.display = 'block';
            activeTicketNumber.textContent = this.activeTicket;
        } else {
            if (this.isOnline && !this.isHost) {
                ticketInput.disabled = true;
                startBtn.disabled = true;
            } else {
                ticketInput.disabled = false;
                startBtn.disabled = false;
            }
            ticketInput.value = '';
            activeTicketDiv.style.display = 'none';
        }
    }

    // ---- Player Management ----

    joinSession() {
        const nameInput = document.getElementById('playerName');
        const name = nameInput.value.trim();

        if (!name) {
            alert('Please enter your name');
            return;
        }

        this.currentPlayer = name;

        if (this.isOnline && this.sessionRef) {
            this.sessionRef.child('players/' + this.playerId).update({
                name: name
            });
        } else {
            this.players.set(this.playerId, { name, vote: null, id: this.playerId });
        }

        nameInput.value = '';
        nameInput.disabled = true;
        document.getElementById('joinBtn').textContent = 'Joined ✓';
        document.getElementById('joinBtn').disabled = true;

        this.renderPlayers();
    }

    // ---- Voting ----

    selectCard(value, target) {
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('selected');
        });
        target.classList.add('selected');

        if (this.currentPlayer) {
            if (this.isOnline && this.sessionRef) {
                this.sessionRef.child('players/' + this.playerId).update({
                    vote: value
                });
            } else {
                const player = this.players.get(this.playerId);
                if (player) {
                    player.vote = value;
                    this.players.set(this.playerId, player);
                    this.renderPlayers();
                    this.saveCurrentSession();
                }
            }
        }
    }

    startVoting() {
        const ticketInput = document.getElementById('jiraTicket');
        const ticketNumber = ticketInput.value.trim();

        if (!ticketNumber) {
            alert('Please enter a ticket number');
            return;
        }

        if (this.activeTicket) {
            alert('Voting is already active for ticket: ' + this.activeTicket);
            return;
        }

        if (this.isOnline && this.sessionRef) {
            const updates = {
                ticket: ticketNumber,
                revealed: false
            };

            this.sessionRef.child('players').once('value').then((snapshot) => {
                if (snapshot.exists()) {
                    snapshot.forEach(child => {
                        updates['players/' + child.key + '/vote'] = null;
                    });
                }
                this.sessionRef.update(updates);
            });
        } else {
            this.activeTicket = ticketNumber;

            this.players.forEach((player, key) => {
                player.vote = null;
                this.players.set(key, player);
            });

            this.revealed = false;
            document.getElementById('results').style.display = 'none';

            ticketInput.disabled = true;
            document.getElementById('startVotingBtn').disabled = true;
            document.getElementById('activeTicket').style.display = 'block';
            document.getElementById('activeTicketNumber').textContent = ticketNumber;

            this.renderPlayers();
            this.updateUI();
            this.saveCurrentSession();
        }

        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('selected');
        });
    }

    stopVoting() {
        if (!this.activeTicket) {
            alert('No active voting session');
            return;
        }

        const votes = Array.from(this.players.values())
            .map(p => p.vote)
            .filter(v => v && v !== '?');

        if (votes.length === 0) {
            const confirmStop = confirm('No votes have been cast yet. Stop voting anyway?');
            if (!confirmStop) return;
        }

        if (this.isOnline && this.sessionRef) {
            this.sessionRef.update({ revealed: true });
        } else {
            this.revealed = true;
            this.renderPlayers();
            this.showResults();
            this.saveToHistory();

            const ticketInput = document.getElementById('jiraTicket');
            ticketInput.disabled = false;
            ticketInput.value = '';
            document.getElementById('startVotingBtn').disabled = false;
            document.getElementById('activeTicket').style.display = 'none';

            this.activeTicket = null;
            this.saveCurrentSession();
            this.updateUI();
        }
    }

    reset() {
        if (this.isOnline && this.sessionRef) {
            const updates = {
                ticket: null,
                revealed: false
            };

            this.sessionRef.child('players').once('value').then((snapshot) => {
                if (snapshot.exists()) {
                    snapshot.forEach(child => {
                        updates['players/' + child.key + '/vote'] = null;
                    });
                }
                this.sessionRef.update(updates);
            });
        } else {
            this.revealed = false;
            this.players.forEach((player, key) => {
                player.vote = null;
                this.players.set(key, player);
            });
            document.getElementById('results').style.display = 'none';

            document.querySelectorAll('.card').forEach(card => {
                card.classList.remove('selected');
            });

            this.renderPlayers();
            this.updateUI();
            this.saveCurrentSession();
        }
    }

    // ---- History (always local) ----

    saveToHistory() {
        if (!this.activeTicket) return;

        const votes = Array.from(this.players.values())
            .map(p => p.vote)
            .filter(v => v && v !== '?')
            .map(v => parseInt(v));

        let average = 0;
        let suggested = 0;

        if (votes.length > 0) {
            average = votes.reduce((a, b) => a + b, 0) / votes.length;
            suggested = this.suggestPoints(average);
        }

        const playersCopy = Array.from(this.players.values())
            .filter(p => p.vote)
            .map(p => ({ name: p.name, vote: p.vote }));

        const historyItem = {
            ticketNumber: this.activeTicket,
            players: playersCopy,
            average: average,
            suggested: suggested,
            timestamp: new Date().toISOString(),
            status: 'completed'
        };

        this.ticketHistory.unshift(historyItem);

        if (this.ticketHistory.length > 20) {
            this.ticketHistory = this.ticketHistory.slice(0, 20);
        }

        this.saveHistoryToLocalStorage();
        this.renderHistory();
    }

    saveHistoryToLocalStorage() {
        try {
            localStorage.setItem('pointPokerHistory', JSON.stringify(this.ticketHistory));
        } catch (e) {
            console.error('Failed to save history to localStorage:', e);
        }
    }

    saveCurrentSession() {
        if (this.isOnline) return;
        try {
            const sessionData = {
                activeTicket: this.activeTicket,
                players: Array.from(this.players.entries()),
                currentPlayer: this.currentPlayer,
                revealed: this.revealed
            };
            localStorage.setItem('pointPokerSession', JSON.stringify(sessionData));
        } catch (e) {
            console.error('Failed to save session to localStorage:', e);
        }
    }

    loadHistory() {
        try {
            const historyData = localStorage.getItem('pointPokerHistory');
            if (historyData) {
                this.ticketHistory = JSON.parse(historyData);
                this.renderHistory();
            }

            // Only restore local session if not in online mode
            if (!this.isOnline) {
                const sessionData = localStorage.getItem('pointPokerSession');
                if (sessionData) {
                    const session = JSON.parse(sessionData);
                    if (session.activeTicket) {
                        this.activeTicket = session.activeTicket;
                        this.revealed = session.revealed || false;
                        this.currentPlayer = session.currentPlayer;

                        if (session.players) {
                            this.players = new Map(session.players);
                        }

                        // Restore UI state
                        const ticketInput = document.getElementById('jiraTicket');
                        ticketInput.value = this.activeTicket;
                        ticketInput.disabled = true;
                        document.getElementById('startVotingBtn').disabled = true;
                        document.getElementById('activeTicket').style.display = 'block';
                        document.getElementById('activeTicketNumber').textContent = this.activeTicket;

                        if (this.currentPlayer) {
                            document.getElementById('playerName').disabled = true;
                            document.getElementById('joinBtn').textContent = 'Joined ✓';
                            document.getElementById('joinBtn').disabled = true;
                        }

                        this.renderPlayers();

                        if (this.revealed) {
                            this.showResults();
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Failed to load from localStorage:', e);
        }
    }

    renderHistory() {
        const historySection = document.getElementById('historySection');
        const historyList = document.getElementById('historyList');

        if (this.ticketHistory.length === 0) {
            historySection.style.display = 'none';
            return;
        }

        historySection.style.display = 'block';
        historyList.innerHTML = '';

        this.ticketHistory.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';

            const timestamp = new Date(item.timestamp);
            const formattedDate = timestamp.toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });

            const playerVotes = item.players
                .map(p => `${p.name}: ${p.vote}`)
                .join(', ');

            historyItem.innerHTML = `
                <div class="history-item-header">
                    <span class="history-ticket">${this.escapeHtml(item.ticketNumber)}</span>
                    <span class="history-timestamp">${formattedDate}</span>
                </div>
                <div class="history-stats">
                    <span>Average: ${item.average.toFixed(1)}</span>
                    <span>Suggested: ${item.suggested}</span>
                </div>
                <div class="history-votes">${this.escapeHtml(playerVotes) || 'No votes'}</div>
            `;

            historyList.appendChild(historyItem);
        });
    }

    clearHistory() {
        const confirmClear = confirm('Are you sure you want to clear all voting history?');
        if (!confirmClear) return;

        this.ticketHistory = [];
        localStorage.removeItem('pointPokerHistory');
        this.renderHistory();
    }

    updateUI() {
        const hasActiveTicket = this.activeTicket !== null;
        document.querySelectorAll('.card').forEach(card => {
            card.disabled = !hasActiveTicket || this.revealed;
        });

        document.getElementById('revealBtn').disabled = !hasActiveTicket || this.revealed;

        // In online mode, only host can reveal and reset
        if (this.isOnline && !this.isHost) {
            document.getElementById('revealBtn').disabled = true;
        }

        document.getElementById('resetBtn').disabled = !hasActiveTicket;
        if (this.isOnline && !this.isHost) {
            document.getElementById('resetBtn').disabled = true;
        }
    }

    renderPlayers() {
        const playersList = document.getElementById('playersList');
        playersList.innerHTML = '';

        this.players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player';
            if (player.vote) playerDiv.classList.add('voted');
            if (this.revealed) playerDiv.classList.add('revealed');

            const nameText = this.escapeHtml(player.name);
            playerDiv.innerHTML = `
                <strong>${nameText}</strong>
                ${player.vote ? (this.revealed ?
                    `<span class="vote">${this.escapeHtml(player.vote)}</span>` :
                    ' ✓ Voted') :
                    ' ⏳ Waiting'}
            `;

            playersList.appendChild(playerDiv);
        });
    }

    revealCards() {
        this.revealed = true;
        this.renderPlayers();
        this.showResults();
    }

    showResults() {
        const votes = Array.from(this.players.values())
            .map(p => p.vote)
            .filter(v => v && v !== '?')
            .map(v => parseInt(v));

        if (votes.length === 0) {
            return;
        }

        const average = votes.reduce((a, b) => a + b, 0) / votes.length;
        const suggested = this.suggestPoints(average);

        document.getElementById('results').style.display = 'block';
        document.getElementById('average').textContent = average.toFixed(1);
        document.getElementById('suggested').textContent = suggested;

        const resultsContent = document.getElementById('resultsContent');
        const voteCounts = votes.reduce((acc, vote) => {
            acc[vote] = (acc[vote] || 0) + 1;
            return acc;
        }, {});

        resultsContent.innerHTML = Object.entries(voteCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([vote, count]) => `<p><strong>${vote} points:</strong> ${count} vote(s)</p>`)
            .join('');
    }

    suggestPoints(average) {
        const fibonacci = [1, 2, 3, 5, 8, 13, 21];
        return fibonacci.reduce((prev, curr) =>
            Math.abs(curr - average) < Math.abs(prev - average) ? curr : prev
        );
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app
const app = new PointPoker();
