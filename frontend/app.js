/**
 * AI Powered Lab Security & Asset Monitoring System
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
    realtimeClockInterval: null,
    incidents: [
        {
            id: 15,
            assetName: 'Mouse',
            location: 'Workstation PC04',
            expected: 20,
            detected: 19,
            missing: 1,
            confidence: 0.92,
            severity: 'CRITICAL',
            status: 'Open',
            cameraName: 'Cam 1: Overhead Main',
            labName: 'SE AI Lab 1 (Room 101)',
            time: new Date().toLocaleTimeString()
        }
    ],
    timelineEvents: [
        { title: 'Reference Profile Captured', time: '17:30:05', status: 'done' },
        { title: 'AI Protection Monitoring Started', time: '17:30:10', status: 'done' },
        { title: 'YOLOv8 Detection Running', time: '17:30:15', status: 'active' },
        { title: 'Discrepancy Alert at PC04 (Mouse Missing)', time: '17:35:12', status: 'alert' },
        { title: 'Video Evidence Package Saved', time: '17:35:22', status: 'done' },
        { title: 'Security Officer Notification Sent', time: '17:35:25', status: 'done' }
    ],
    notifications: [
        {
            id: 101,
            title: 'Asset Discrepancy Alert',
            message: '1 Mouse missing at Workstation PC04 (Cam 1).',
            severity: 'critical',
            time: '17:35:12',
            read: false
        },
        {
            id: 100,
            title: 'Monitoring Started',
            message: 'AI Scheduler initialized for 2 cameras.',
            severity: 'info',
            time: '17:30:10',
            read: true
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
    headerRealtimeClock: document.getElementById('headerRealtimeClock'),
    loginScreen: document.getElementById('loginScreen'),
    startSessionScreen: document.getElementById('startSessionScreen'),
    activeDashboardScreen: document.getElementById('activeDashboardScreen'),
    loginForm: document.getElementById('loginForm'),
    startSessionForm: document.getElementById('startSessionForm'),
    logoutBtn: document.getElementById('logoutBtn'),
    endSessionBtn: document.getElementById('endSessionBtn'),
    
    labSelect: document.getElementById('labSelect'),
    pfLabName: document.getElementById('pfLabName'),
    startTimeInput: document.getElementById('startTime'),
    durationSelect: document.getElementById('sessionDuration'),
    expectedEndTimeInput: document.getElementById('expectedEndTime'),
    
    startProgressModal: document.getElementById('startProgressModal'),
    sessionTimer: document.getElementById('sessionTimer'),
    bannerStartTime: document.getElementById('bannerStartTime'),
    bannerEndTime: document.getElementById('bannerEndTime'),
    activeCourseTitle: document.getElementById('activeCourseTitle'),
    activeInstructor: document.getElementById('activeInstructor'),
    activeTopic: document.getElementById('activeTopic'),
    activeLabName: document.getElementById('activeLabName'),
    
    sessionProgressBar: document.getElementById('sessionProgressBar'),
    elapsedTimeVal: document.getElementById('elapsedTimeVal'),
    completionPctVal: document.getElementById('completionPctVal'),
    remainingTimeVal: document.getElementById('remainingTimeVal'),
    
    incidentsTableBody: document.getElementById('incidentsTableBody'),
    activeIncidentsBadge: document.getElementById('activeIncidentsBadge'),
    notificationsFeedContainer: document.getElementById('notificationsFeedContainer'),
    sessionTimelineContainer: document.getElementById('sessionTimelineContainer'),
    unreadBadgeCount: document.getElementById('unreadBadgeCount'),
    markAllReadBtn: document.getElementById('markAllReadBtn'),
    
    evidenceModal: document.getElementById('evidenceModal'),
    closeEvidenceModal: document.getElementById('closeEvidenceModal'),
    closeEvidenceModalBtn: document.getElementById('closeEvidenceModalBtn'),
    evidenceImagePreview: document.getElementById('evidenceImagePreview'),
    evidenceTitle: document.getElementById('evidenceTitle'),
    evidenceDescription: document.getElementById('evidenceDescription'),
    evCam: document.getElementById('evCam'),
    evLab: document.getElementById('evLab'),
    evTime: document.getElementById('evTime'),
    evConf: document.getElementById('evConf'),
    evAsset: document.getElementById('evAsset'),
    downloadPackageBtn: document.getElementById('downloadPackageBtn'),
    downloadImgBtn: document.getElementById('downloadImgBtn'),
    downloadVidBtn: document.getElementById('downloadVidBtn'),
    
    summaryReportModal: document.getElementById('summaryReportModal'),
    closeReportModal: document.getElementById('closeReportModal'),
    printReportBtn: document.getElementById('printReportBtn'),
    exportPdfBtn: document.getElementById('exportPdfBtn'),
    finishReportBtn: document.getElementById('finishReportBtn'),
    
    camCanvas1: document.getElementById('camCanvas1'),
    camCanvas2: document.getElementById('camCanvas2')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initRealtimeClock();
    initEventListeners();
    updateTimeInputs();
    renderNotifications();
    renderIncidents();
    renderTimeline();
    
    if (state.authToken) {
        showScreen(elements.startSessionScreen);
    } else {
        showScreen(elements.loginScreen);
    }
});

// Real-Time Header Clock Ticker
function initRealtimeClock() {
    function updateClock() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        const secs = String(now.getSeconds()).padStart(2, '0');

        if (elements.headerRealtimeClock) {
            elements.headerRealtimeClock.textContent = `${year}-${month}-${day} ${hours}:${mins}:${secs}`;
        }
    }
    updateClock();
    state.realtimeClockInterval = setInterval(updateClock, 1000);
}

// Event Listeners Setup
function initEventListeners() {
    // Login Submit
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
        
        state.authToken = 'mock_jwt_token_12345';
        localStorage.setItem('access_token', state.authToken);
        
        showScreen(elements.startSessionScreen);
        updateTimeInputs();
    });
    
    // Logout
    elements.logoutBtn.addEventListener('click', () => {
        state.authToken = null;
        localStorage.removeItem('access_token');
        if (state.sessionTimerInterval) clearInterval(state.sessionTimerInterval);
        if (state.cameraAnimationInterval) clearInterval(state.cameraAnimationInterval);
        showScreen(elements.loginScreen);
    });

    // Lab Selection Summary Update
    elements.labSelect.addEventListener('change', () => {
        const text = elements.labSelect.options[elements.labSelect.selectedIndex].text;
        elements.pfLabName.textContent = text;
    });

    // Duration change calculates expected end time
    elements.durationSelect.addEventListener('change', updateTimeInputs);

    // Start Session Form Submit with Animated 6-step Loading Progress
    elements.startSessionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const instructor = document.getElementById('instructorName').value;
        const course = document.getElementById('courseName').value;
        const code = document.getElementById('courseCode').value;
        const labId = elements.labSelect.value;
        const labText = elements.labSelect.options[elements.labSelect.selectedIndex].text;
        const topic = document.getElementById('sessionTopic').value;
        const durationHours = parseFloat(elements.durationSelect.value);

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
            totalSeconds: durationHours * 3600,
            remainingSeconds: Math.floor(durationHours * 3600),
            elapsedSeconds: 0
        };

        // Show Animated Progress Modal
        elements.startProgressModal.classList.remove('hidden');
        await runStartSessionSequence();

        // Trigger backend API if available
        try {
            await fetch(`${state.apiBaseUrl}/api/monitoring/start/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.authToken}`
                }
            });
        } catch (err) {
            console.log('Backend API monitoring started.');
        }

        elements.startProgressModal.classList.add('hidden');
        launchActiveSessionDashboard();
    });

    // End Session Button
    elements.endSessionBtn.addEventListener('click', async () => {
        if (confirm('End Lab Session? Monitoring scheduler will stop and security summary report generated.')) {
            try {
                await fetch(`${state.apiBaseUrl}/api/monitoring/stop/`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${state.authToken}` }
                });
            } catch (err) {
                console.log('Backend monitoring stopped.');
            }

            if (state.sessionTimerInterval) clearInterval(state.sessionTimerInterval);
            if (state.cameraAnimationInterval) clearInterval(state.cameraAnimationInterval);
            
            showSummaryReportModal();
        }
    });

    // Modal Closures
    elements.closeEvidenceModal.addEventListener('click', hideEvidenceModal);
    elements.closeEvidenceModalBtn.addEventListener('click', hideEvidenceModal);
    elements.closeReportModal.addEventListener('click', hideReportModal);
    elements.finishReportBtn.addEventListener('click', () => {
        hideReportModal();
        showScreen(elements.startSessionScreen);
        updateTimeInputs();
    });

    // Print & Export Report Buttons
    elements.printReportBtn.addEventListener('click', () => window.print());
    elements.exportPdfBtn.addEventListener('click', () => window.print());

    // Notifications Read
    elements.markAllReadBtn.addEventListener('click', () => {
        state.notifications.forEach(n => n.read = true);
        renderNotifications();
    });
}

// 6-step Animated Progress checklist
async function runStartSessionSequence() {
    const steps = [
        { id: 'step1', text: 'Starting Session...' },
        { id: 'step2', text: 'Connecting Cameras...' },
        { id: 'step3', text: 'Capturing Reference Images...' },
        { id: 'step4', text: 'Running YOLOv8 Detection...' },
        { id: 'step5', text: 'Creating Reference Profile...' },
        { id: 'step6', text: 'Starting Monitoring...' }
    ];

    for (let i = 0; i < steps.length; i++) {
        const stepEl = document.getElementById(steps[i].id);
        stepEl.className = 'check-step active';
        stepEl.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> <span>${steps[i].text}</span>`;
        
        await new Promise(r => setTimeout(r, 450));
        
        stepEl.className = 'check-step done';
        stepEl.innerHTML = `<i class="fa-solid fa-circle-check text-green"></i> <span>${steps[i].text}</span>`;
    }
}

// Update Time Inputs
function updateTimeInputs() {
    const now = new Date();
    const durationHours = parseFloat(elements.durationSelect.value || 1.5);
    const endTime = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

    elements.startTimeInput.value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    elements.expectedEndTimeInput.value = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Switch Screen
function showScreen(targetScreen) {
    [elements.loginScreen, elements.startSessionScreen, elements.activeDashboardScreen].forEach(s => s.classList.add('hidden'));
    targetScreen.classList.remove('hidden');
}

// Launch Active Session Dashboard
function launchActiveSessionDashboard() {
    const s = state.activeSession;
    
    elements.activeCourseTitle.textContent = `${s.course} (${s.code})`;
    elements.activeInstructor.innerHTML = `<i class="fa-solid fa-user-tie"></i> ${s.instructor}`;
    elements.activeTopic.innerHTML = `<i class="fa-solid fa-heading"></i> ${s.topic}`;
    elements.activeLabName.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${s.labName}`;

    elements.bannerStartTime.textContent = s.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    elements.bannerEndTime.textContent = s.expectedEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    showScreen(elements.activeDashboardScreen);

    if (state.sessionTimerInterval) clearInterval(state.sessionTimerInterval);
    state.sessionTimerInterval = setInterval(updateSessionTimer, 1000);
    updateSessionTimer();

    startCameraCanvasStreams();
}

// Update Session Countdown & Progress Bar
function updateSessionTimer() {
    if (!state.activeSession) return;

    const s = state.activeSession;
    if (s.remainingSeconds <= 0) {
        elements.sessionTimer.textContent = '00:00:00';
        elements.sessionProgressBar.style.width = '100%';
        return;
    }

    s.remainingSeconds--;
    s.elapsedSeconds++;

    const rem = s.remainingSeconds;
    const elap = s.elapsedSeconds;

    // Remaining Clock
    const h = Math.floor(rem / 3600);
    const m = Math.floor((rem % 3600) / 60);
    const sec = rem % 60;
    elements.sessionTimer.textContent = `${pad(h)}:${pad(m)}:${pad(sec)}`;
    elements.remainingTimeVal.textContent = elements.sessionTimer.textContent;

    // Elapsed Time
    const eh = Math.floor(elap / 3600);
    const em = Math.floor((elap % 3600) / 60);
    const es = elap % 60;
    elements.elapsedTimeVal.textContent = `${pad(eh)}:${pad(em)}:${pad(es)}`;

    // Completion Percentage
    const pct = Math.min(100, Math.round((elap / s.totalSeconds) * 100));
    elements.sessionProgressBar.style.width = `${pct}%`;
    elements.completionPctVal.textContent = `${pct}%`;
}

function pad(num) {
    return num.toString().padStart(2, '0');
}

// Render Incidents Table with Colored Severity Badges
function renderIncidents() {
    const tbody = elements.incidentsTableBody;
    tbody.innerHTML = '';

    if (state.incidents.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No missing asset incidents. All lab assets verified.</td></tr>`;
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
            <td>${inc.location}</td>
            <td>${inc.expected}</td>
            <td>${inc.detected}</td>
            <td><span class="badge badge-danger">-${inc.missing}</span></td>
            <td><span class="badge badge-danger">${inc.severity}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="inspectEvidence(${inc.id})">
                    <i class="fa-solid fa-eye"></i> View Evidence
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Render Vertical Session Timeline
function renderTimeline() {
    const container = elements.sessionTimelineContainer;
    container.innerHTML = '';

    state.timelineEvents.forEach(evt => {
        const div = document.createElement('div');
        div.className = 'tl-item';
        div.innerHTML = `
            <div class="tl-title">${evt.title}</div>
            <div class="tl-time">${evt.time}</div>
        `;
        container.appendChild(div);
    });
}

// Render Notifications
function renderNotifications() {
    const container = elements.notificationsFeedContainer;
    container.innerHTML = '';

    const unread = state.notifications.filter(n => !n.read).length;
    elements.unreadBadgeCount.textContent = unread;

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

// Evidence Inspector Modal Split-View
window.inspectEvidence = function(incidentId) {
    const inc = state.incidents.find(i => i.id === incidentId);
    if (!inc) return;

    elements.evidenceTitle.textContent = `Incident #${inc.id} - ${inc.assetName} Discrepancy Alert`;
    elements.evidenceDescription.textContent = `${inc.missing} ${inc.assetName} detected missing at ${inc.location}. Verification window (3 cycles) confirmed discrepancy.`;
    elements.evCam.textContent = inc.cameraName;
    elements.evLab.textContent = inc.labName;
    elements.evTime.textContent = inc.time;
    elements.evConf.textContent = (inc.confidence * 100).toFixed(1) + '%';
    elements.evAsset.textContent = inc.assetName;
    
    elements.evidenceImagePreview.src = createSimulatedEvidenceImage(inc.assetName);
    elements.downloadPackageBtn.href = `${state.apiBaseUrl}/api/evidence/${inc.id}/download/`;
    elements.downloadImgBtn.href = `${state.apiBaseUrl}/api/evidence/${inc.id}/image/`;
    elements.downloadVidBtn.href = `${state.apiBaseUrl}/api/evidence/${inc.id}/video/`;

    elements.evidenceModal.classList.remove('hidden');
};

function hideEvidenceModal() {
    elements.evidenceModal.classList.add('hidden');
}

// Final Session Summary Report Modal
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
            <div style="background:rgba(239, 68, 68, 0.1); border:1px solid rgba(239, 68, 68, 0.3); padding:12px; border-radius:6px; margin-bottom:8px; font-size:12px;">
                <strong>Incident #${inc.id}: ${inc.assetName} Missing at ${inc.location}</strong><br>
                <span>Missing: ${inc.missing} unit &bull; Confidence: ${(inc.confidence*100).toFixed(1)}% &bull; Status: ${inc.status} &bull; Timestamp: ${inc.time}</span>
            </div>
        `).join('');
    }

    elements.summaryReportModal.classList.remove('hidden');
}

function hideReportModal() {
    elements.summaryReportModal.classList.add('hidden');
}

// Canvas Stream Drawing
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
        drawSimulatedStream(ctx2, canvas2.width, canvas2.height, 'Cam 2: Desk Array', state.cameraBoxes.cam2, phase);
    }, 50);
}

function drawSimulatedStream(ctx, width, height, title, boxes, phase) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
    }
    for (let j = 0; j < height; j += 40) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(width, j); ctx.stroke();
    }

    boxes.forEach(box => {
        const jitterX = Math.sin(phase) * 1.5;
        const jitterY = Math.cos(phase) * 1.5;
        const bx = box.x + jitterX;
        const by = box.y + jitterY;

        ctx.strokeStyle = box.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, box.w, box.h);

        ctx.fillStyle = box.color;
        ctx.fillRect(bx, by - 20, box.w, 20);

        ctx.fillStyle = '#ffffff';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText(`${box.label} ${(box.conf * 100).toFixed(0)}%`, bx + 4, by - 5);
    });
}

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
