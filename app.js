class PointPoker {
    constructor() {
        this.players = new Map();
        this.currentPlayer = null;
        this.revealed = false;
        this.activeTicket = null;
        this.ticketHistory = [];
        this.init();
    }

    init() {
        this.loadHistory();
        this.setupEventListeners();
        this.updateUI();
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
                this.selectCard(e.target.dataset.value);
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
    }

    joinSession() {
        const nameInput = document.getElementById('playerName');
        const name = nameInput.value.trim();

        if (!name) {
            alert('Please enter your name');
            return;
        }

        this.currentPlayer = name;
        this.players.set(name, { name, vote: null });
        nameInput.value = '';
        nameInput.disabled = true;
        document.getElementById('joinBtn').textContent = 'Joined ✓';
        document.getElementById('joinBtn').disabled = true;

        this.renderPlayers();
    }

    selectCard(value) {
        // Update UI
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('selected');
        });
        event.target.classList.add('selected');

        // Update player vote
        if (this.currentPlayer) {
            const player = this.players.get(this.currentPlayer);
            player.vote = value;
            this.players.set(this.currentPlayer, player);
            this.renderPlayers();
            this.saveCurrentSession();
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

        this.activeTicket = ticketNumber;
        
        // Clear previous votes
        this.players.forEach((player, name) => {
            player.vote = null;
            this.players.set(name, player);
        });
        
        this.revealed = false;
        document.getElementById('results').style.display = 'none';
        
        // Update UI
        ticketInput.disabled = true;
        document.getElementById('startVotingBtn').disabled = true;
        document.getElementById('activeTicket').style.display = 'block';
        document.getElementById('activeTicketNumber').textContent = ticketNumber;
        
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('selected');
        });
        
        this.renderPlayers();
        this.updateUI();
        this.saveCurrentSession();
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

        this.revealed = true;
        this.renderPlayers();
        this.showResults();
        
        // Save to history
        this.saveToHistory();
        
        // Reset for next ticket
        const ticketInput = document.getElementById('jiraTicket');
        ticketInput.disabled = false;
        ticketInput.value = '';
        document.getElementById('startVotingBtn').disabled = false;
        document.getElementById('activeTicket').style.display = 'none';
        
        this.activeTicket = null;
        this.saveCurrentSession();
        this.updateUI();
    }

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

        // Create deep copies of player data to avoid reference issues
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
        
        // Keep only last 20 tickets
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
                    <span class="history-ticket">${item.ticketNumber}</span>
                    <span class="history-timestamp">${formattedDate}</span>
                </div>
                <div class="history-stats">
                    <span>Average: ${item.average.toFixed(1)}</span>
                    <span>Suggested: ${item.suggested}</span>
                </div>
                <div class="history-votes">${playerVotes || 'No votes'}</div>
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
        // Disable/enable cards based on active ticket
        const hasActiveTicket = this.activeTicket !== null;
        document.querySelectorAll('.card').forEach(card => {
            card.disabled = !hasActiveTicket || this.revealed;
        });
        
        // Disable reveal button if no active ticket
        document.getElementById('revealBtn').disabled = !hasActiveTicket || this.revealed;
        
        // Update reset button
        document.getElementById('resetBtn').disabled = !hasActiveTicket;
    }

    renderPlayers() {
        const playersList = document.getElementById('playersList');
        playersList.innerHTML = '';

        this.players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player';
            if (player.vote) playerDiv.classList.add('voted');
            if (this.revealed) playerDiv.classList.add('revealed');

            playerDiv.innerHTML = `
                <strong>${player.name}</strong>
                ${player.vote ? (this.revealed ? 
                    `<span class="vote">${player.vote}</span>` : 
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
            alert('No votes to reveal!');
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

    reset() {
        // Reset votes for active ticket
        this.revealed = false;
        this.players.forEach((player, name) => {
            player.vote = null;
            this.players.set(name, player);
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

// Initialize the app
const app = new PointPoker();
