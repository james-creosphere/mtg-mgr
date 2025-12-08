// Initialize Vanta.js background
let vantaEffect;
let timerInterval = null;

window.addEventListener('DOMContentLoaded', () => {
    vantaEffect = VANTA.BIRDS({
        el: "#vanta-background",
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        backgroundColor: 0x0a0e27,
        color1: 0x1e3a8a,
        color2: 0x3b82f6,
        birdSize: 1.00,
        wingSpan: 20.00,
        speedLimit: 3.00,
        separation: 19.00,
        alignment: 19.00,
        cohesion: 19.00,
        quantity: 3.00
    });
});

// State management
let state = {
    meetingTime: 60, // minutes
    introTime: 5,
    outroTime: 5,
    introName: 'Introduction',
    outroName: 'Conclusion',
    participants: [],
    isRunning: false,
    isPaused: false,
    currentPhase: 'intro', // 'intro', 'participant', 'outro'
    currentParticipantIndex: -1,
    startTime: null,
    elapsedTime: 0,
    phaseStartTime: 0
};

// DOM elements
const elements = {
    clock: document.getElementById('clock'),
    timeDisplay: document.getElementById('timeDisplay'),
    timeLabel: document.getElementById('timeLabel'),
    speakerTime: document.getElementById('speakerTime'),
    speakerName: document.getElementById('speakerName'),
    meetingTimeInput: document.getElementById('meetingTime'),
    introTimeInput: document.getElementById('introTime'),
    outroTimeInput: document.getElementById('outroTime'),
    introNameInput: document.getElementById('introName'),
    outroNameInput: document.getElementById('outroName'),
    participantsList: document.getElementById('participantsList'),
    newParticipantInput: document.getElementById('newParticipant'),
    addParticipantBtn: document.getElementById('addParticipantBtn'),
    timePerPerson: document.getElementById('timePerPerson'),
    startBtn: document.getElementById('startBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    resetBtn: document.getElementById('resetBtn')
};

// Initialize
function init() {
    updateMeetingTime();
    calculateTimePerPerson();
    renderParticipants();
    
    // Event listeners
    elements.meetingTimeInput.addEventListener('change', updateMeetingTime);
    elements.introTimeInput.addEventListener('change', () => {
        state.introTime = parseInt(elements.introTimeInput.value) || 0;
        calculateTimePerPerson();
    });
    elements.outroTimeInput.addEventListener('change', () => {
        state.outroTime = parseInt(elements.outroTimeInput.value) || 0;
        calculateTimePerPerson();
    });
    elements.introNameInput.addEventListener('change', () => {
        state.introName = elements.introNameInput.value || 'Introduction';
    });
    elements.outroNameInput.addEventListener('change', () => {
        state.outroName = elements.outroNameInput.value || 'Conclusion';
    });
    elements.addParticipantBtn.addEventListener('click', addParticipant);
    elements.newParticipantInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addParticipant();
        }
    });
    elements.startBtn.addEventListener('click', startMeeting);
    elements.pauseBtn.addEventListener('click', pauseMeeting);
    elements.resetBtn.addEventListener('click', resetMeeting);
}

function updateMeetingTime() {
    state.meetingTime = parseInt(elements.meetingTimeInput.value) || 60;
    calculateTimePerPerson();
}

function calculateTimePerPerson() {
    const totalTime = state.meetingTime;
    const introOutroTime = state.introTime + state.outroTime;
    const availableTime = totalTime - introOutroTime;
    const participantCount = state.participants.length;
    
    if (participantCount === 0) {
        elements.timePerPerson.textContent = 'Time per person: 0 minutes';
        return;
    }
    
    const timePerPerson = Math.floor(availableTime / participantCount);
    const remainingSeconds = (availableTime % participantCount) * 60;
    
    elements.timePerPerson.textContent = `Time per person: ${timePerPerson} minutes`;
    
    // Update participant times
    state.participants.forEach(participant => {
        participant.allocatedMinutes = timePerPerson;
        participant.allocatedSeconds = remainingSeconds;
    });
    
    renderParticipants();
}

function addParticipant() {
    const name = elements.newParticipantInput.value.trim();
    if (name === '') return;
    
    state.participants.push({
        name: name,
        allocatedMinutes: 0,
        allocatedSeconds: 0
    });
    
    elements.newParticipantInput.value = '';
    calculateTimePerPerson();
}

function removeParticipant(index) {
    state.participants.splice(index, 1);
    calculateTimePerPerson();
}

function renderParticipants() {
    elements.participantsList.innerHTML = '';
    
    state.participants.forEach((participant, index) => {
        const item = document.createElement('div');
        item.className = 'participant-item';
        if (state.isRunning && state.currentPhase === 'participant' && state.currentParticipantIndex === index) {
            item.classList.add('active');
        }
        
        item.innerHTML = `
            <span class="participant-name">${participant.name}</span>
            <span class="participant-time">${participant.allocatedMinutes}:${String(Math.floor(participant.allocatedSeconds / 60)).padStart(2, '0')}</span>
            <button class="remove-participant" onclick="removeParticipant(${index})">Remove</button>
        `;
        
        elements.participantsList.appendChild(item);
    });
}

function startMeeting() {
    if (state.isRunning && !state.isPaused) return;
    
    if (state.isPaused) {
        // Resume
        state.isPaused = false;
        state.startTime = Date.now() - state.elapsedTime;
        state.phaseStartTime = Date.now() - (state.elapsedTime - getPhaseElapsedTime());
    } else {
        // Start fresh
        state.isRunning = true;
        state.currentPhase = 'intro';
        state.currentParticipantIndex = -1;
        state.startTime = Date.now();
        state.elapsedTime = 0;
        state.phaseStartTime = Date.now();
    }
    
    elements.startBtn.style.display = 'none';
    elements.pauseBtn.style.display = 'block';
    elements.meetingTimeInput.disabled = true;
    elements.introTimeInput.disabled = true;
    elements.outroTimeInput.disabled = true;
    elements.introNameInput.disabled = true;
    elements.outroNameInput.disabled = true;
    
    updateDisplay();
    startTimer();
}

function pauseMeeting() {
    state.isPaused = true;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    elements.startBtn.style.display = 'block';
    elements.pauseBtn.style.display = 'none';
    elements.startBtn.textContent = 'Resume';
}

function resetMeeting() {
    state.isRunning = false;
    state.isPaused = false;
    state.currentPhase = 'intro';
    state.currentParticipantIndex = -1;
    state.startTime = null;
    state.elapsedTime = 0;
    state.phaseStartTime = 0;
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    elements.startBtn.style.display = 'block';
    elements.pauseBtn.style.display = 'none';
    elements.startBtn.textContent = 'Start Meeting';
    elements.meetingTimeInput.disabled = false;
    elements.introTimeInput.disabled = false;
    elements.outroTimeInput.disabled = false;
    elements.introNameInput.disabled = false;
    elements.outroNameInput.disabled = false;
    
    updateDisplay();
    renderParticipants();
}

function getPhaseElapsedTime() {
    if (!state.isRunning) return 0;
    
    let phaseElapsed = 0;
    let currentElapsed = state.elapsedTime;
    
    // Intro time
    if (currentElapsed > state.introTime * 60) {
        phaseElapsed += state.introTime * 60;
        currentElapsed -= state.introTime * 60;
    } else {
        return currentElapsed;
    }
    
    // Participants time
    const timePerParticipant = (state.meetingTime - state.introTime - state.outroTime) / Math.max(state.participants.length, 1);
    const participantTime = timePerParticipant * state.participants.length;
    
    if (currentElapsed > participantTime * 60) {
        phaseElapsed += participantTime * 60;
        currentElapsed -= participantTime * 60;
    } else {
        return currentElapsed;
    }
    
    // Outro time
    return currentElapsed;
}

function startTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    if (!state.isRunning || state.isPaused) return;
    
    timerInterval = setInterval(() => {
        if (!state.isRunning || state.isPaused) {
            clearInterval(timerInterval);
            timerInterval = null;
            return;
        }
        
        state.elapsedTime = Date.now() - state.startTime;
        updateDisplay();
        checkPhaseTransition();
    }, 100);
}

function checkPhaseTransition() {
    const totalSeconds = state.elapsedTime / 1000;
    const introSeconds = state.introTime * 60;
    const totalParticipantTime = Math.max(0, (state.meetingTime - state.introTime - state.outroTime) * 60);
    const outroSeconds = state.outroTime * 60;
    
    if (totalSeconds < introSeconds) {
        // Intro phase
        if (state.currentPhase !== 'intro') {
            state.currentPhase = 'intro';
            state.currentParticipantIndex = -1;
            state.phaseStartTime = Date.now();
            renderParticipants();
        }
    } else if (state.participants.length > 0 && totalSeconds < introSeconds + totalParticipantTime) {
        // Participant phase
        const participantElapsedSeconds = totalSeconds - introSeconds;
        const timePerParticipant = totalParticipantTime / state.participants.length;
        const newIndex = Math.min(Math.floor(participantElapsedSeconds / timePerParticipant), state.participants.length - 1);
        
        if (state.currentPhase !== 'participant' || state.currentParticipantIndex !== newIndex) {
            state.currentPhase = 'participant';
            state.currentParticipantIndex = newIndex;
            const currentParticipantElapsed = participantElapsedSeconds % timePerParticipant;
            state.phaseStartTime = Date.now() - (currentParticipantElapsed * 1000);
            renderParticipants();
        }
    } else if (totalSeconds < introSeconds + totalParticipantTime + outroSeconds) {
        // Outro phase
        if (state.currentPhase !== 'outro') {
            state.currentPhase = 'outro';
            state.currentParticipantIndex = -1;
            const outroElapsed = totalSeconds - introSeconds - totalParticipantTime;
            state.phaseStartTime = Date.now() - (outroElapsed * 1000);
            renderParticipants();
        }
    } else {
        // Meeting ended
        if (state.isRunning) {
            state.isRunning = false;
            state.isPaused = false;
            elements.startBtn.style.display = 'block';
            elements.pauseBtn.style.display = 'none';
            elements.startBtn.textContent = 'Start Meeting';
        }
    }
}

function updateDisplay() {
    const totalSeconds = state.elapsedTime / 1000;
    const meetingTotalSeconds = state.meetingTime * 60;
    const remainingSeconds = Math.max(0, meetingTotalSeconds - totalSeconds);
    
    // Update main clock
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = Math.floor(remainingSeconds % 60);
    elements.timeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // Update speaker time and name
    if (!state.isRunning) {
        elements.speakerTime.textContent = '00:00';
        elements.speakerName.textContent = 'No Speaker';
        return;
    }
    
    if (state.currentPhase === 'intro') {
        const phaseElapsed = (Date.now() - state.phaseStartTime) / 1000;
        const phaseTotal = state.introTime * 60;
        const phaseRemaining = Math.max(0, phaseTotal - phaseElapsed);
        const phaseMinutes = Math.floor(phaseRemaining / 60);
        const phaseSeconds = Math.floor(phaseRemaining % 60);
        elements.speakerTime.textContent = `${String(phaseMinutes).padStart(2, '0')}:${String(phaseSeconds).padStart(2, '0')}`;
        elements.speakerName.textContent = state.introName;
    } else if (state.currentPhase === 'participant' && state.participants.length > 0 && state.currentParticipantIndex >= 0 && state.currentParticipantIndex < state.participants.length) {
        const participant = state.participants[state.currentParticipantIndex];
        const totalParticipantTime = (state.meetingTime - state.introTime - state.outroTime) * 60;
        const timePerParticipant = totalParticipantTime / state.participants.length;
        const phaseElapsed = (Date.now() - state.phaseStartTime) / 1000;
        const phaseRemaining = Math.max(0, timePerParticipant - phaseElapsed);
        const phaseMinutes = Math.floor(phaseRemaining / 60);
        const phaseSeconds = Math.floor(phaseRemaining % 60);
        elements.speakerTime.textContent = `${String(phaseMinutes).padStart(2, '0')}:${String(phaseSeconds).padStart(2, '0')}`;
        elements.speakerName.textContent = participant.name;
    } else if (state.currentPhase === 'outro') {
        const phaseElapsed = (Date.now() - state.phaseStartTime) / 1000;
        const phaseTotal = state.outroTime * 60;
        const phaseRemaining = Math.max(0, phaseTotal - phaseElapsed);
        const phaseMinutes = Math.floor(phaseRemaining / 60);
        const phaseSeconds = Math.floor(phaseRemaining % 60);
        elements.speakerTime.textContent = `${String(phaseMinutes).padStart(2, '0')}:${String(phaseSeconds).padStart(2, '0')}`;
        elements.speakerName.textContent = state.outroName;
    } else {
        elements.speakerTime.textContent = '00:00';
        elements.speakerName.textContent = 'No Speaker';
    }
}

// Make removeParticipant available globally for onclick handlers
window.removeParticipant = removeParticipant;

// Initialize on load
init();

