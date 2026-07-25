/**
 * AI Powered Lab Security System - University Academic Lab Session Frontend
 * Department of Software Engineering &bull; Final Year Project
 */

// Application Global State
const state = {
    apiBaseUrl: window.location.origin.includes('5500') || window.location.origin.includes('3000') 
        ? 'http://localhost:8000' 
        : '',
    authToken: localStorage.getItem('access_token') || null,
    currentUser: {
        name: 'Dr. Tabraiz Shams',
        role: 'Lab Instructor',
        username: 'admin_user'
    },
    activeSession: null,
    sessionTimerInterval: null,
    cameraAnimationInterval: null,
    incidents: [
        {
            id: 15,
            assetName: 'Mouse',
            expected: 20,
            detected: 19,
            missing: 1,
            confidence: 0.92,
            status: 'Open',
            cameraName: 'Cam 1: Overhead Main',
            time: new Date().toLocaleTimeString()
        }
    ],
    notifications: [
        {
            id: 101,
            title: 'Asset Missing Alert',
            message: '1 Mouse missing in Software Engineering AI Lab 1 (Cam 1).',
            severity: 'critical',
            time: 'Just now'
        },
        {
            id: 100,
            title: 'Monitoring Started',
            message: 'AI Monitoring Scheduler initialized for 2 cameras.',
            severity: 'info',
            time: '2 mins ago'
        }
    ],
    cameraBoxes: {
        cam1: [
            { label: 'Monitor', conf: 0.96, x: 50, y: 40, w: 120, h: 80, color: '#10b981' },
            { label: 'Monitor', conf: 0.94, x: 200, y: 40, w: 120, h: 80, color: '#10b981' },
            { label: 'Monitor', conf: 0.92, x: 350, y: 40, w: 120, h: 80, color: '#10b981' },
            { label: 'Keyboard', conf: 0.88, x: 50, y: 150, w: 100, h: 40, color: '#38bdf8' },
            { label: 'Keyboard', conf: 0.91, x: 200, y: 150, w: 100, h: 40, color: '#38bdf8' },
            { label: 'Mouse (Missing)', conf: 0.92, x: 350, y: 150, w: 40, h: 40, color: '#ef4444' }
        ],
        cam2: [
            { label: 'Laptop', conf: 0.95, x: 80, y: 60, w: 130, h: 90, color: '#a855f7' },
            { label: 'Laptop', conf: 0.91, x: 240, y: 60, w: 130, h: 90, color: '#a855f7' },
            { label: 'Chair', conf: 0.89, x: 80, y: 180, w: 80, h: 100, color: '#f59e0b' },
            { label: 'Chair', conf: 0.87, x: 240, y: 180, w: 80, h: 100, color: '#f59e0b' }
        ]
    }
};

// DOM Elements
const elements = {
    loginScreen: document.getElementById('loginScreen'),
    startSessionScreen: document.getElementById('startSessionScreen'),
    activeDashboardScreen: document.getElementById('activeDashboardScreen'),
    loginForm: document.getElementById('loginForm'),
    startSessionForm: document.getElementById('startSessionForm'),
    logoutBtn: document.getElementById('logoutBtn'),
    endSessionBtn: document.getElementById('endSessionBtn'),
    
    startTimeInput: document.getElementById('startTime'),
    durationSelect: document.getElementById('sessionDuration'),
    expectedEndTimeInput: document.getElementById('expectedEndTime'),
    
    sessionTimer: document.getElementById('sessionTimer'),
    activeCourseTitle: document.getElementById('activeCourseTitle'),
    activeInstructor: document.getElementById('activeInstructor'),
    activeTopic: document.getElementById('activeTopic'),
    activeLabName: document.getElementById('activeLabName'),
    
    sideInstructor: document.getElementById('sideInstructor'),
    sideCourseCode: document.getElementById('sideCourseCode'),
    sideStartTime: document.getElementById('sideStartTime'),
    sideEndTime: document.getElementById('sideEndTime'),
    
    incidentsTableBody: document.getElementById('incidentsTableBody'),
    activeIncidentsBadge: document.getElementById('activeIncidentsBadge'),
    notificationsFeedContainer: document.getElementById('notificationsFeedContainer'),
    unreadBadgeCount: document.getElementById('unreadBadgeCount'),
    markAllReadBtn: document.getElementById('markAllReadBtn'),
    
    evidenceModal: document.getElementById('evidenceModal'),
    closeEvidenceModal: document.getElementById('closeEvidenceModal'),
    closeEvidenceModalBtn: document.getElementById('closeEvidenceModalBtn'),
    evidenceImagePreview: document.getElementById('evidenceImagePreview'),
    evidenceTitle: document.getElementById('evidenceTitle'),
    evidenceDescription: document.getElementById('evidenceDescription'),
    evidenceTime: document.getElementById('evidenceTime'),
    evidenceConf: document.getElementById('evidenceConf'),
    downloadEvidenceBtn: document.getElementById('downloadEvidenceBtn'),
    
    summaryReportModal: document.getElementById('summaryReportModal'),
    closeReportModal: document.getElementById('closeReportModal'),
    printReportBtn: document.getElementById('printReportBtn'),
    finishReportBtn: document.getElementById('finishReportBtn'),
    
    camCanvas1: document.getElementById('camCanvas1'),
    camCanvas2: document.getElementById('camCanvas2')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    updateTimeInputs();
    renderNotifications();
    renderIncidents();
    
    // Check if user is already authenticated or show start session
    if (state.authToken) {
        showScreen(elements.startSessionScreen);
    } else {
        showScreen(elements.loginScreen);
    }
});

// Event Listeners Setup
function initEventListeners() {
    // Login Form Submit
    elements.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('usernameInput').value;
        const role = document.getElementById('roleSelect').value;
        
        state.currentUser = {
            name: username.includes('admin') ? 'Dr. Tabraiz Shams' : username,
            role: role,
            username: username
        };
        document.getElementById('currentUserName').textContent = state.currentUser.name;
        
        // Save dummy token for frontend session
        state.authToken = 'mock_jwt_token_12345';
        localStorage.setItem('access_token', state.authToken);
        
        showScreen(elements.startSessionScreen);
        updateTimeInputs();
    });
    
    // Logout Button
    elements.logoutBtn.addEventListener('click', () => {
        state.authToken = null;
        localStorage.removeItem('access_token');
        if (state.sessionTimerInterval) clearInterval(state.sessionTimerInterval);
        if (state.cameraAnimationInterval) clearInterval(state.cameraAnimationInterval);
        showScreen(elements.loginScreen);
    });

    // Duration change calculates expected end time
    elements.durationSelect.addEventListener('change', updateTimeInputs);

    // Start Session Form Submit
    elements.startSessionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const instructor = document.getElementById('instructorName').value;
        const course = document.getElementById('courseName').value;
        const code = document.getElementById('courseCode').value;
        const labId = document.getElementById('labSelect').value;
        const labText = document.getElementById('labSelect').options[document.getElementById('labSelect').selectedIndex].text;
        const topic = document.getElementById('sessionTopic').value;
        const durationHours = parseFloat(elements.durationSelect.value);
        const captureRef = document.getElementById('captureReference').checked;
        const startMon = document.getElementById('startMonitoring').checked;

        const now = new Date();
        const endTime = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

        state.activeSession = {
            instructor,
            course,
            code,
            labId,
            labName: labText,
            topic,
            durationHours,
            startTime: now,
            expectedEndTime: endTime,
            captureReference: captureRef,
            startMonitoring: startMon,
            remainingSeconds: Math.floor(durationHours * 3600)
        };

        // Call backend API if running alongside Django
        try {
            await fetch(`${state.apiBaseUrl}/api/monitoring/start/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.authToken}`
                }
            });
        } catch (err) {
            console.log('Backend API call simulated/started locally.');
        }

        launchActiveSessionDashboard();
    });

    // End Session Button
    elements.endSessionBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to end this lab session? Monitoring will be stopped and evidence archived.')) {
            // Stop monitoring via API
            try {
                await fetch(`${state.apiBaseUrl}/api/monitoring/stop/`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${state.authToken}` }
                });
            } catch (err) {
                console.log('Backend monitoring stop call executed.');
            }

            if (state.sessionTimerInterval) clearInterval(state.sessionTimerInterval);
            if (state.cameraAnimationInterval) clearInterval(state.cameraAnimationInterval);
            
            showSummaryReportModal();
        }
    });

    // Modals Close Buttons
    elements.closeEvidenceModal.addEventListener('click', hideEvidenceModal);
    elements.closeEvidenceModalBtn.addEventListener('click', hideEvidenceModal);
    elements.closeReportModal.addEventListener('click', hideReportModal);
    elements.finishReportBtn.addEventListener('click', () => {
        hideReportModal();
        showScreen(elements.startSessionScreen);
        updateTimeInputs();
    });

    // Print Report Button
    elements.printReportBtn.addEventListener('click', () => {
        window.print();
    });

    // Mark All Notifications Read
    elements.markAllReadBtn.addEventListener('click', () => {
        state.notifications.forEach(n => n.read = true);
        renderNotifications();
    });
}

// Update Start Time and Expected End Time Inputs
function updateTimeInputs() {
    const now = new Date();
    const durationHours = parseFloat(elements.durationSelect.value || 1.5);
    const endTime = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

    elements.startTimeInput.value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    elements.expectedEndTimeInput.value = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Switch Visible Screen
function showScreen(targetScreen) {
    [elements.loginScreen, elements.startSessionScreen, elements.activeDashboardScreen].forEach(s => {
        s.classList.add('hidden');
    });
    targetScreen.classList.remove('hidden');
}

// Launch Active Dashboard
function launchActiveSessionDashboard() {
    const s = state.activeSession;
    
    elements.activeCourseTitle.textContent = `${s.course} (${s.code})`;
    elements.activeInstructor.textContent = s.instructor;
    elements.activeTopic.textContent = s.topic;
    elements.activeLabName.textContent = s.labName;

    elements.sideInstructor.textContent = s.instructor;
    elements.sideCourseCode.textContent = s.code;
    elements.sideStartTime.textContent = s.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    elements.sideEndTime.textContent = s.expectedEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    showScreen(elements.activeDashboardScreen);

    // Start Timer
    if (state.sessionTimerInterval) clearInterval(state.sessionTimerInterval);
    state.sessionTimerInterval = setInterval(updateSessionTimer, 1000);
    updateSessionTimer();

    // Start Camera Stream Animations
    startCameraCanvasStreams();
}

// Update Session Countdown Timer
function updateSessionTimer() {
    if (!state.activeSession) return;

    if (state.activeSession.remainingSeconds <= 0) {
        elements.sessionTimer.textContent = '00:00:00';
        return;
    }

    state.activeSession.remainingSeconds--;
    const secs = state.activeSession.remainingSeconds;
    
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;

    elements.sessionTimer.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function pad(num) {
    return num.toString().padStart(2, '0');
}

// Render Incidents Table
function renderIncidents() {
    const tbody = elements.incidentsTableBody;
    tbody.innerHTML = '';

    if (state.incidents.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No missing asset incidents detected. All lab assets verified.</td></tr>`;
        elements.activeIncidentsBadge.textContent = '0 Active Incidents';
        elements.activeIncidentsBadge.className = 'badge badge-success';
        return;
    }

    elements.activeIncidentsBadge.textContent = `${state.incidents.length} Active Incident(s)`;
    elements.activeIncidentsBadge.className = 'badge badge-danger';

    state.incidents.forEach(inc => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${inc.id}</td>
            <td><strong>${inc.assetName}</strong></td>
            <td>${inc.expected}</td>
            <td>${inc.detected}</td>
            <td><span class="badge badge-danger">-${inc.missing}</span></td>
            <td>${(inc.confidence * 100).toFixed(1)}%</td>
            <td><span class="badge badge-warning">${inc.status}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="inspectEvidence(${inc.id})">
                    <i class="fa-solid fa-eye"></i> Inspect Evidence
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Render Notifications Feed
function renderNotifications() {
    const container = elements.notificationsFeedContainer;
    container.innerHTML = '';

    const unreadCount = state.notifications.filter(n => !n.read).length;
    elements.unreadBadgeCount.textContent = unreadCount;

    state.notifications.forEach(n => {
        const div = document.createElement('div');
        div.className = `notification-item ${n.severity}`;
        div.innerHTML = `
            <div class="title">
                <span>${n.title}</span>
                <span class="time">${n.time}</span>
            </div>
            <div class="msg">${n.message}</div>
        `;
        container.appendChild(div);
    });
}

// Inspect Evidence Modal
window.inspectEvidence = function(incidentId) {
    const inc = state.incidents.find(i => i.id === incidentId);
    if (!inc) return;

    elements.evidenceTitle.textContent = `Incident #${inc.id} - ${inc.assetName} Missing Alert`;
    elements.evidenceDescription.textContent = `${inc.missing} ${inc.assetName}(s) detected missing from ${inc.cameraName}. Consecutive 3-cycle verification passed.`;
    elements.evidenceTime.textContent = inc.time;
    elements.evidenceConf.textContent = (inc.confidence * 100).toFixed(1) + '%';
    
    // Generate simulated evidence image on canvas and set to img preview
    elements.evidenceImagePreview.src = createSimulatedEvidenceImage(inc.assetName);
    elements.downloadEvidenceBtn.href = `${state.apiBaseUrl}/api/evidence/${inc.id}/download/`;

    elements.evidenceModal.classList.remove('hidden');
};

function hideEvidenceModal() {
    elements.evidenceModal.classList.add('hidden');
}

// Summary Report Modal
function showSummaryReportModal() {
    const s = state.activeSession || {
        instructor: 'Dr. Tabraiz Shams',
        course: 'Deep Learning & Computer Vision',
        code: 'SE-412',
        labName: 'Software Engineering AI Lab 1',
        topic: 'Lab 08: Real-Time YOLOv8 Object Tracking',
        startTime: new Date()
    };

    document.getElementById('repInstructor').textContent = s.instructor;
    document.getElementById('repCourse').textContent = `${s.course} (${s.code})`;
    document.getElementById('repLab').textContent = s.labName;
    document.getElementById('repTopic').textContent = s.topic;
    document.getElementById('repStartTime').textContent = s.startTime.toLocaleTimeString();
    document.getElementById('repEndTime').textContent = new Date().toLocaleTimeString();

    const incContainer = document.getElementById('reportIncidentsContainer');
    if (state.incidents.length === 0) {
        incContainer.innerHTML = `<p class="text-muted">No unresolved theft incidents logged during this lab session.</p>`;
    } else {
        incContainer.innerHTML = state.incidents.map(inc => `
            <div style="background:rgba(239, 68, 68, 0.1); border:1px solid rgba(239, 68, 68, 0.3); padding:12px; border-radius:6px; margin-bottom:8px;">
                <strong>Incident #${inc.id}: ${inc.assetName} Discrepancy</strong><br>
                <span>Missing: ${inc.missing} unit(s) &bull; Confidence: ${(inc.confidence*100).toFixed(1)}% &bull; Status: ${inc.status}</span>
            </div>
        `).join('');
    }

    elements.summaryReportModal.classList.remove('hidden');
}

function hideReportModal() {
    elements.summaryReportModal.classList.add('hidden');
}

// Simulated Live Camera Stream Canvas Drawing
function startCameraCanvasStreams() {
    if (state.cameraAnimationInterval) clearInterval(state.cameraAnimationInterval);

    const canvas1 = elements.camCanvas1;
    const canvas2 = elements.camCanvas2;
    if (!canvas1 || !canvas2) return;

    const ctx1 = canvas1.getContext('2d');
    const ctx2 = canvas2.getContext('2d');

    let phase = 0;

    state.cameraAnimationInterval = setInterval(() => {
        phase += 0.05;
        drawSimulatedStream(ctx1, canvas1.width, canvas1.height, 'Cam 1: Overhead Main', state.cameraBoxes.cam1, phase);
        drawSimulatedStream(ctx2, canvas2.width, canvas2.height, 'Cam 2: Entrance Array', state.cameraBoxes.cam2, phase);
    }, 50);
}

function drawSimulatedStream(ctx, width, height, title, boxes, phase) {
    // Dark background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Draw perspective grid lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
    }
    for (let j = 0; j < height; j += 40) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(width, j);
        ctx.stroke();
    }

    // Draw Bounding Boxes with slight animation jitter
    boxes.forEach(box => {
        const jitterX = Math.sin(phase) * 1.5;
        const jitterY = Math.cos(phase) * 1.5;
        const bx = box.x + jitterX;
        const by = box.y + jitterY;

        ctx.strokeStyle = box.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, box.w, box.h);

        // Fill label box
        ctx.fillStyle = box.color;
        ctx.fillRect(bx, by - 20, box.w, 20);

        ctx.fillStyle = '#ffffff';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText(`${box.label} ${(box.conf * 100).toFixed(0)}%`, bx + 4, by - 5);
    });
}

// Generate Simulated Evidence Image URL
function createSimulatedEvidenceImage(assetName) {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 640, 360);

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.strokeRect(350, 150, 60, 60);

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(350, 125, 140, 25);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 12px Inter';
    ctx.fillText(`${assetName} MISSING (92%)`, 355, 142);

    return canvas.toDataURL('image/jpeg');
}
