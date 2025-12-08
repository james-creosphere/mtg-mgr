# Meeting Manager

A beautiful web application to help keep meetings on track with automatic time allocation and speaker management.

## Features

- ⏱️ **Large countdown timer** - Front and center display of remaining meeting time
- 👤 **Speaker timer** - Tracks time for current speaker (intro/participants/outro)
- ⚙️ **Configurable meeting time** - Set total meeting duration
- 🎯 **Intro/Outro management** - Set custom times and names for meeting segments
- 👥 **Participant management** - Add participants with automatic time allocation
- 🎨 **Beautiful UI** - Modern glassmorphism design with Vanta.js animated background
- ⏯️ **Timer controls** - Start, pause/resume, and reset functionality

## How to Use

1. Set your total meeting time
2. Configure intro and outro times with custom names
3. Add participants - time is automatically divided equally
4. Click "Start Meeting" to begin
5. The timer automatically cycles through: Intro → Participants → Outro

## Demo

Open `index.html` in your web browser or serve it with a local server:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`

## Technologies

- HTML5
- CSS3 (Glassmorphism design)
- Vanilla JavaScript
- [Vanta.js](https://www.vantajs.com/) - Animated background effects

