class PointPoker {
    constructor() {
        this.players = new Map();
        this.currentPlayer = null;
        this.revealed = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Card selection
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!this.currentPlayer) {
                    alert('Please join the session first!');
                    return;
                }
                this.selectCard(e.target.dataset.value);
            });
        });

        // Join session
        document.getElementById('joinBtn').addEventListener('click', () => {
            this.joinSession();
        });

        // Reveal cards
        document.getElementById('revealBtn').addEventListener('click', () => {
            this.revealCards();
        });

        // Reset
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.reset();
        });

        // Enter key for player name
        document.getElementById('playerName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.joinSession();
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
        this.revealed = false;
        this.players.forEach((player, name) => {
            player.vote = null;
            this.players.set(name, player);
        });

        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('selected');
        });

        document.getElementById('results').style.display = 'none';
        this.renderPlayers();
    }
}

// Initialize the app
const app = new PointPoker();
