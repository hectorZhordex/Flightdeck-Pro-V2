// =========================
// FLIGHTDECK PRO - MAIN APPLICATION
// Aviation Operations Clipboard
// =========================

class FlightDeckApp {
    constructor() {
        this.currentTab = 'preflt';
        this.currentMenu = null;
        this.checklists = {};
        this.timers = {};
        this.settings = {
            units: 'metric', // metric or imperial
            darkMode: true,
            disclaimerAccepted: false
        };

        this.init();
    }

    init() {
        this.loadSettings();
        this.initEventListeners();
        this.startUTCClock();
        this.checkDisclaimer();
        this.loadChecklistData();
    }

    // =========================
    // SETTINGS & STORAGE
    // =========================

    loadSettings() {
        const stored = localStorage.getItem('flightdeck_settings');
        if (stored) {
            this.settings = { ...this.settings, ...JSON.parse(stored) };
        }
    }

    saveSettings() {
        localStorage.setItem('flightdeck_settings', JSON.stringify(this.settings));
    }

    loadChecklistData() {
        const stored = localStorage.getItem('flightdeck_checklists');
        if (stored) {
            this.checklists = JSON.parse(stored);
        }
    }

    saveChecklistData() {
        localStorage.setItem('flightdeck_checklists', JSON.stringify(this.checklists));
    }

    // =========================
    // DISCLAIMER
    // =========================

    checkDisclaimer() {
        if (!this.settings.disclaimerAccepted) {
            document.getElementById('disclaimerModal').style.display = 'flex';
            document.getElementById('mainApp').style.display = 'none';
        } else {
            document.getElementById('disclaimerModal').style.display = 'none';
            document.getElementById('mainApp').style.display = 'flex';
            this.loadTab(this.currentTab);
        }
    }

    acceptDisclaimer() {
        this.settings.disclaimerAccepted = true;
        this.saveSettings();
        document.getElementById('disclaimerModal').style.display = 'none';
        document.getElementById('mainApp').style.display = 'flex';
        this.loadTab(this.currentTab);
    }

    // =========================
    // EVENT LISTENERS
    // =========================

    initEventListeners() {
        // Disclaimer
        document.getElementById('acceptDisclaimer')?.addEventListener('click', () => {
            this.acceptDisclaimer();
        });

        // Menu toggle
        document.getElementById('menuToggle')?.addEventListener('click', () => {
            document.getElementById('sideMenu').classList.add('active');
        });

        document.getElementById('menuClose')?.addEventListener('click', () => {
            document.getElementById('sideMenu').classList.remove('active');
        });

        // Bottom nav tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Side menu items
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const menu = e.currentTarget.dataset.menu;
                this.loadMenuContent(menu);
                document.getElementById('sideMenu').classList.remove('active');
            });
        });
    }

    // =========================
    // UTC CLOCK
    // =========================

    startUTCClock() {
        const updateClock = () => {
            const now = new Date();
            const utc = now.toISOString().substr(11, 8);
            const clockEl = document.getElementById('utcClock');
            if (clockEl) {
                clockEl.textContent = `${utc} UTC`;
            }
        };
        updateClock();
        setInterval(updateClock, 1000);
    }

    // =========================
    // NAVIGATION
    // =========================

    switchTab(tabName) {
        this.currentTab = tabName;

        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            }
        });

        this.loadTab(tabName);
    }

    loadTab(tabName) {
        const content = document.getElementById('mainContent');

        switch(tabName) {
            case 'ownchecks':
                content.innerHTML = this.renderOwnChecks();
                break;
            case 'preflt':
                content.innerHTML = this.renderPreFlight();
                this.initPreFlightEvents();
                break;
            case 'crz':
                content.innerHTML = this.renderCruise();
                this.initCruiseEvents();
                break;
            case 'app':
                content.innerHTML = this.renderApproach();
                this.initApproachEvents();
                break;
            case 'pa':
                content.innerHTML = this.renderPA();
                break;
            case 'notes':
                content.innerHTML = this.renderQuickNotes();
                this.initNotesEvents();
                break;
        }
    }

    loadMenuContent(menuName) {
        const content = document.getElementById('mainContent');

        switch(menuName) {
            case 'limitations':
                content.innerHTML = this.renderLimitations();
                this.initLimitationsEvents();
                break;
            case 'memory':
                content.innerHTML = this.renderMemoryItems();
                break;
            case 'diversion':
                content.innerHTML = this.renderDiversion();
                this.initDiversionEvents();
                break;
            case 'snowtam':
                content.innerHTML = this.renderSnowtam();
                this.initSnowtamEvents();
                break;
            case 'notes':
                content.innerHTML = this.renderPersonalNotes();
                this.initPersonalNotesEvents();
                break;
            case 'settings':
                content.innerHTML = this.renderSettings();
                this.initSettingsEvents();
                break;
            case 'whatsnew':
                content.innerHTML = this.renderWhatsNew();
                break;
            case 'disclaimer':
                content.innerHTML = this.renderDisclaimerText();
                break;
            case 'support':
                content.innerHTML = this.renderSupport();
                break;
            case 'coldops':
                content.innerHTML = this.renderColdOps();
                break;
            case 'ftl':
                content.innerHTML = this.renderFTL();
                break;
            case 'loading':
                content.innerHTML = this.renderLoading();
                break;
        }
    }

    // =========================
    // CHECKLIST ENGINE
    // =========================

    renderChecklist(items, checklistId) {
        const savedState = this.checklists[checklistId] || {};

        return items.map((item, index) => {
            const itemId = `${checklistId}_${index}`;
            const isChecked = savedState[itemId] || false;

            return `
                <div class="checklist-item ${isChecked ? 'completed' : ''}">
                    <div class="checkbox-wrapper">
                        <input type="checkbox"
                               class="checkbox"
                               id="${itemId}"
                               ${isChecked ? 'checked' : ''}
                               data-checklist="${checklistId}"
                               data-index="${index}">
                    </div>
                    <label for="${itemId}" class="checklist-label">${item.label}</label>
                    ${item.info ? `<span class="info-icon" title="${item.info}">i</span>` : ''}
                </div>
            `;
        }).join('');
    }

    handleChecklistChange(checklistId, index, checked) {
        if (!this.checklists[checklistId]) {
            this.checklists[checklistId] = {};
        }

        const itemId = `${checklistId}_${index}`;
        this.checklists[checklistId][itemId] = checked;
        this.saveChecklistData();
    }

    clearChecklist(checklistId) {
        this.checklists[checklistId] = {};
        this.saveChecklistData();
        this.loadTab(this.currentTab);
    }

    // =========================
    // OWN CHECKS TAB
    // =========================

    renderOwnChecks() {
        const items = [
            { label: 'PERSONAL BRIEFING COMPLETE' },
            { label: 'WEATHER REVIEW' },
            { label: 'NOTAMS REVIEW' },
            { label: 'FUEL PLANNING' },
            { label: 'ALTERNATE SELECTION' },
            { label: 'MEL REVIEW' },
            { label: 'DISPATCH RELEASE SIGNED' }
        ];

        return `
            <div class="checklist-container">
                <div class="checklist-header">
                    <h2 class="checklist-title">OWN CHECKS</h2>
                    <div class="checklist-actions">
                        <button class="btn-secondary" onclick="app.clearChecklist('ownchecks')">CLEAR ALL</button>
                    </div>
                </div>
                <div class="checklist-section">
                    <div class="checklist-items">
                        ${this.renderChecklist(items, 'ownchecks')}
                    </div>
                </div>
            </div>
        `;
    }

    // =========================
    // PRE-FLIGHT TAB
    // =========================

    renderPreFlight() {
        const items = [
            { label: 'BRAKES TEMP CHECK' },
            { label: 'BATT CHECK / ADIRs ALIGN' },
            { label: 'POWER UP COMPLETE' },
            { label: 'OIS (OPERATIONAL INTEGRITY SYSTEM)' },
            { label: 'TECH LOG / MEL REVIEW' },
            { label: 'A/C CONFIGURATION DIFFERENCES' },
            { label: 'APU / ENG FIRE TEST' },
            { label: 'APU START - CONSIDER' },
            { label: 'LOADSHEET ACCEPTANCE' },
            { label: 'X-CHECK WITH AVNCS' },
            { label: 'CABIN + TECH LOG SIGN' },
            { label: 'BEFORE START CHECKLIST' }
        ];

        return `
            <div class="checklist-container">
                <div class="checklist-header">
                    <h2 class="checklist-title">PRE-FLIGHT</h2>
                    <div class="checklist-actions">
                        <button class="btn-secondary" onclick="app.clearChecklist('preflight')">CLEAR ALL</button>
                    </div>
                </div>

                <div class="checklist-section">
                    <h3 class="section-title">COCKPIT PREPARATION</h3>
                    <div class="checklist-items">
                        ${this.renderChecklist(items, 'preflight')}
                    </div>
                </div>

                <div class="checklist-section">
                    <h3 class="section-title">DEPARTURE TIMER</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">DEPARTURE TIME (UTC)</label>
                            <input type="time" id="deptTime" class="form-input">
                        </div>
                        <div class="form-group">
                            <label class="form-label">TIME TO GO</label>
                            <div class="timer-display" id="timeToGo">--:--</div>
                        </div>
                    </div>
                </div>

                <div class="checklist-section">
                    <h3 class="section-title">SCRATCHPAD</h3>
                    <textarea class="form-input" id="preflightScratchpad" placeholder="Free text notes...">${this.getScratchpad('preflight')}</textarea>
                </div>

                <div class="checklist-section">
                    <h3 class="section-title">FUEL SG CALC</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">FUEL SG</label>
                            <input type="number" step="0.001" id="fuelSG" class="form-input" placeholder="0.785">
                        </div>
                        <div class="form-group">
                            <label class="form-label">FUEL TEMP (°C)</label>
                            <input type="number" id="fuelTemp" class="form-input" placeholder="15">
                        </div>
                    </div>
                </div>

                <div class="checklist-section">
                    <h3 class="section-title">BASIC CALCULATOR</h3>
                    <div class="calculator">
                        <div class="calc-display" id="calcDisplay">0</div>
                        <div class="calc-buttons" id="calcButtons"></div>
                    </div>
                </div>
            </div>
        `;
    }

    initPreFlightEvents() {
        // Checklist checkboxes
        document.querySelectorAll('.checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const checklistId = e.target.dataset.checklist;
                const index = e.target.dataset.index;
                this.handleChecklistChange(checklistId, index, e.target.checked);

                // Toggle completed class on parent
                const parent = e.target.closest('.checklist-item');
                parent.classList.toggle('completed', e.target.checked);
            });
        });

        // Departure timer
        const deptTimeInput = document.getElementById('deptTime');
        if (deptTimeInput) {
            deptTimeInput.addEventListener('change', () => {
                this.startDepartureTimer();
            });
        }

        // Scratchpad auto-save
        const scratchpad = document.getElementById('preflightScratchpad');
        if (scratchpad) {
            scratchpad.addEventListener('input', (e) => {
                this.saveScratchpad('preflight', e.target.value);
            });
        }

        // Calculator
        this.initCalculator();
    }

    startDepartureTimer() {
        const deptTime = document.getElementById('deptTime').value;
        if (!deptTime) return;

        const updateTimer = () => {
            const now = new Date();
            const [hours, minutes] = deptTime.split(':');
            const dept = new Date();
            dept.setUTCHours(parseInt(hours), parseInt(minutes), 0, 0);

            const diff = dept - now;

            if (diff > 0) {
                const mins = Math.floor(diff / 60000);
                const secs = Math.floor((diff % 60000) / 1000);
                document.getElementById('timeToGo').textContent =
                    `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            } else {
                document.getElementById('timeToGo').textContent = 'DEPARTED';
            }
        };

        updateTimer();
        if (this.timers.departure) clearInterval(this.timers.departure);
        this.timers.departure = setInterval(updateTimer, 1000);
    }

    initCalculator() {
        const buttons = [
            '7', '8', '9', '/',
            '4', '5', '6', '*',
            '1', '2', '3', '-',
            'C', '0', '=', '+'
        ];

        let calcState = { display: '0', current: '', operator: null, previous: null };

        const calcButtons = document.getElementById('calcButtons');
        if (!calcButtons) return;

        calcButtons.innerHTML = buttons.map(btn =>
            `<button class="calc-btn ${['+','-','*','/','='].includes(btn) ? 'operator' : ''}" data-btn="${btn}">${btn}</button>`
        ).join('');

        calcButtons.addEventListener('click', (e) => {
            if (!e.target.classList.contains('calc-btn')) return;

            const btn = e.target.dataset.btn;
            const display = document.getElementById('calcDisplay');

            if (btn === 'C') {
                calcState = { display: '0', current: '', operator: null, previous: null };
                display.textContent = '0';
            } else if (['+', '-', '*', '/'].includes(btn)) {
                if (calcState.current !== '') {
                    calcState.previous = parseFloat(calcState.current);
                    calcState.current = '';
                    calcState.operator = btn;
                }
            } else if (btn === '=') {
                if (calcState.operator && calcState.previous !== null && calcState.current !== '') {
                    const current = parseFloat(calcState.current);
                    let result = 0;

                    switch(calcState.operator) {
                        case '+': result = calcState.previous + current; break;
                        case '-': result = calcState.previous - current; break;
                        case '*': result = calcState.previous * current; break;
                        case '/': result = calcState.previous / current; break;
                    }

                    display.textContent = result;
                    calcState = { display: String(result), current: String(result), operator: null, previous: null };
                }
            } else {
                calcState.current += btn;
                display.textContent = calcState.current;
            }
        });
    }

    // =========================
    // CRUISE TAB
    // =========================

    renderCruise() {
        const items = [
            { label: 'SYSTEM STATUS CHECK', info: 'Review all system pages for cautions/advisories' },
            { label: 'TCAS SET TO TA/RA' },
            { label: 'COMMS WITH CABIN' },
            { label: 'WEATHER / WINDS UPDATE' },
            { label: 'ETP & SECONDARY FLIGHT PLAN', info: 'Equal Time Point calculation' },
            { label: 'DRIFT DOWN CALCULATION' },
            { label: 'EMERGENCY DESCENT REVIEW' },
            { label: 'UNRELIABLE SPEED MONITOR' },
            { label: 'DARD CHECK', info: 'Data Analysis and Recording Device' }
        ];

        return `
            <div class="checklist-container">
                <div class="checklist-header">
                    <h2 class="checklist-title">TOP OF CLIMB / CRUISE</h2>
                    <div class="checklist-actions">
                        <button class="btn-secondary" onclick="app.clearChecklist('cruise')">CLEAR ALL</button>
                    </div>
                </div>

                <div class="checklist-section">
                    <h3 class="section-title">TOC / CRZ CHECKS</h3>
                    <div class="checklist-items">
                        ${this.renderChecklist(items, 'cruise')}
                    </div>
                </div>

                <div class="checklist-section">
                    <h3 class="section-title">ETP CALCULATOR</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">DISTANCE (NM)</label>
                            <input type="number" id="etpDistance" class="form-input" placeholder="2000">
                        </div>
                        <div class="form-group">
                            <label class="form-label">GROUNDSPEED (KT)</label>
                            <input type="number" id="etpGS" class="form-input" placeholder="450">
                        </div>
                        <div class="form-group">
                            <label class="form-label">ETP TIME</label>
                            <div class="timer-display" id="etpResult">--:--</div>
                        </div>
                    </div>
                    <button class="btn-primary" onclick="app.calculateETP()">CALCULATE ETP</button>
                </div>

                <div class="checklist-section">
                    <h3 class="section-title">CRUISE SCRATCHPAD</h3>
                    <textarea class="form-input" id="cruiseScratchpad" placeholder="Cruise notes...">${this.getScratchpad('cruise')}</textarea>
                </div>
            </div>
        `;
    }

    initCruiseEvents() {
        // Checklist checkboxes
        document.querySelectorAll('.checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const checklistId = e.target.dataset.checklist;
                const index = e.target.dataset.index;
                this.handleChecklistChange(checklistId, index, e.target.checked);

                const parent = e.target.closest('.checklist-item');
                parent.classList.toggle('completed', e.target.checked);
            });
        });

        // Scratchpad
        const scratchpad = document.getElementById('cruiseScratchpad');
        if (scratchpad) {
            scratchpad.addEventListener('input', (e) => {
                this.saveScratchpad('cruise', e.target.value);
            });
        }
    }

    calculateETP() {
        const distance = parseFloat(document.getElementById('etpDistance').value);
        const gs = parseFloat(document.getElementById('etpGS').value);

        if (distance && gs) {
            const timeHours = (distance / 2) / gs;
            const hours = Math.floor(timeHours);
            const minutes = Math.round((timeHours - hours) * 60);

            document.getElementById('etpResult').textContent =
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
    }

    // =========================
    // APPROACH TAB
    // =========================

    renderApproach() {
        const items = [
            { label: 'FMS MARKER TOD -20', info: 'Top of Descent minus 20nm' },
            { label: 'CHARTS & NOTAMS REVIEW' },
            { label: 'ISIS QNH SETUP', info: 'Integrated Standby Instrument System' },
            { label: 'LANDING DISTANCE PERFORMANCE' },
            { label: 'FMS APPROACH SETUP' },
            { label: 'OANS SETUP', info: 'Onboard Airport Navigation System' },
            { label: 'BTV SETUP', info: 'Brake-To-Vacate system' },
            { label: 'APPROACH BRIEFING COMPLETE' }
        ];

        return `
            <div class="checklist-container">
                <div class="checklist-header">
                    <h2 class="checklist-title">TOD / APPROACH</h2>
                    <div class="checklist-actions">
                        <button class="btn-secondary" onclick="app.clearChecklist('approach')">CLEAR ALL</button>
                    </div>
                </div>

                <div class="checklist-section">
                    <h3 class="section-title">DESCENT / APPROACH PREP</h3>
                    <div class="checklist-items">
                        ${this.renderChecklist(items, 'approach')}
                    </div>
                </div>

                <div class="checklist-section">
                    <h3 class="section-title">LANDING PERFORMANCE</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">LANDING WEIGHT (KG)</label>
                            <input type="number" id="ldgWeight" class="form-input" placeholder="65000">
                        </div>
                        <div class="form-group">
                            <label class="form-label">RUNWAY LENGTH (M)</label>
                            <input type="number" id="rwyLength" class="form-input" placeholder="2500">
                        </div>
                        <div class="form-group">
                            <label class="form-label">VAPP (KT)</label>
                            <input type="number" id="vapp" class="form-input" placeholder="135">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">WIND (KT)</label>
                            <input type="text" id="wind" class="form-input" placeholder="270/15">
                        </div>
                        <div class="form-group">
                            <label class="form-label">TEMP (°C)</label>
                            <input type="number" id="temp" class="form-input" placeholder="15">
                        </div>
                        <div class="form-group">
                            <label class="form-label">QNH (HPA)</label>
                            <input type="number" id="qnh" class="form-input" placeholder="1013">
                        </div>
                    </div>
                </div>

                <div class="checklist-section">
                    <h3 class="section-title">APPROACH SCRATCHPAD</h3>
                    <textarea class="form-input" id="approachScratchpad" placeholder="Approach notes...">${this.getScratchpad('approach')}</textarea>
                </div>
            </div>
        `;
    }

    initApproachEvents() {
        // Checklist checkboxes
        document.querySelectorAll('.checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const checklistId = e.target.dataset.checklist;
                const index = e.target.dataset.index;
                this.handleChecklistChange(checklistId, index, e.target.checked);

                const parent = e.target.closest('.checklist-item');
                parent.classList.toggle('completed', e.target.checked);
            });
        });

        // Scratchpad
        const scratchpad = document.getElementById('approachScratchpad');
        if (scratchpad) {
            scratchpad.addEventListener('input', (e) => {
                this.saveScratchpad('approach', e.target.value);
            });
        }
    }

    // =========================
    // PA ANNOUNCEMENTS TAB
    // =========================

    renderPA() {
        return `
            <div class="checklist-container">
                <div class="checklist-header">
                    <h2 class="checklist-title">PA ANNOUNCEMENTS</h2>
                </div>

                <div class="card">
                    <div class="card-header">BOARDING</div>
                    <div class="card-body">
                        "Good [morning/afternoon/evening] ladies and gentlemen, welcome aboard.
                        This is [Captain Name] from the flight deck. Our flight time today will be
                        approximately [X] hours and [Y] minutes. We'll be cruising at [altitude] feet.
                        Current weather at destination is [conditions]. Thank you for flying with us today."
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">BEFORE TAKEOFF</div>
                    <div class="card-body">
                        "From the flight deck, cabin crew please be seated for takeoff."
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">TOP OF CLIMB</div>
                    <div class="card-body">
                        "Ladies and gentlemen, we've reached our cruising altitude of [altitude] feet.
                        You're now free to move about the cabin. However, we recommend keeping your seatbelt
                        fastened while seated in case of unexpected turbulence."
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">TURBULENCE</div>
                    <div class="card-body">
                        "Ladies and gentlemen, we're experiencing some turbulence. Please return to your
                        seats and fasten your seatbelts. Cabin crew, please be seated."
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">TOP OF DESCENT</div>
                    <div class="card-body">
                        "Cabin crew, prepare cabin for landing."
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">AFTER LANDING</div>
                    <div class="card-body">
                        "Ladies and gentlemen, welcome to [destination]. Local time is [time].
                        Please remain seated with your seatbelts fastened until the aircraft has come
                        to a complete stop and the seatbelt sign is turned off. Thank you for flying with us."
                    </div>
                </div>
            </div>
        `;
    }

    // =========================
    // QUICK NOTES TAB
    // =========================

    renderQuickNotes() {
        return `
            <div class="checklist-container">
                <div class="checklist-header">
                    <h2 class="checklist-title">QUICK NOTES</h2>
                    <div class="checklist-actions">
                        <button class="btn-secondary" onclick="app.clearNotes()">CLEAR</button>
                    </div>
                </div>

                <div class="checklist-section">
                    <textarea class="form-input" id="quickNotes"
                              style="min-height: 400px;"
                              placeholder="Quick operational notes...">${this.getScratchpad('quicknotes')}</textarea>
                </div>
            </div>
        `;
    }

    initNotesEvents() {
        const notes = document.getElementById('quickNotes');
        if (notes) {
            notes.addEventListener('input', (e) => {
                this.saveScratchpad('quicknotes', e.target.value);
            });
        }
    }

    clearNotes() {
        if (confirm('Clear all quick notes?')) {
            this.saveScratchpad('quicknotes', '');
            document.getElementById('quickNotes').value = '';
        }
    }

    // =========================
    // SCRATCHPAD UTILITIES
    // =========================

    getScratchpad(key) {
        const data = localStorage.getItem(`flightdeck_scratch_${key}`);
        return data || '';
    }

    saveScratchpad(key, value) {
        localStorage.setItem(`flightdeck_scratch_${key}`, value);
    }

    // =========================
    // LIMITATIONS MODULE
    // =========================

    renderLimitations() {
        const categories = [
            { id: 'apu', name: 'APU' },
            { id: 'autopilot', name: 'AUTOPILOT' },
            { id: 'btv', name: 'BTV (BRAKE-TO-VACATE)' },
            { id: 'engine', name: 'ENGINE' },
            { id: 'flaps', name: 'FLAPS' },
            { id: 'fo', name: 'FO LIMITATIONS' },
            { id: 'fuel', name: 'FUEL' },
            { id: 'gear', name: 'LANDING GEAR' },
            { id: 'oil', name: 'OIL' },
            { id: 'oxygen', name: 'OXYGEN' },
            { id: 'wind', name: 'WIND' },
            { id: 'windows', name: 'WINDOWS / DOORS' }
        ];

        return `
            <div class="checklist-container">
                <div class="checklist-header">
                    <h2 class="checklist-title">LIMITATIONS</h2>
                </div>

                <div class="limitations-grid">
                    ${categories.map(cat => `
                        <div class="card">
                            <button class="card-header" onclick="app.toggleLimitation('${cat.id}')"
                                    style="cursor: pointer; width: 100%; text-align: left; background: transparent; border: none; color: var(--text-primary);">
                                ${cat.name}
                                <span style="float: right;">▼</span>
                            </button>
                            <div id="limit_${cat.id}" class="card-body" style="display: none;">
                                ${this.getLimitationContent(cat.id)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    toggleLimitation(id) {
        const el = document.getElementById(`limit_${id}`);
        if (el) {
            el.style.display = el.style.display === 'none' ? 'block' : 'none';
        }
    }

    getLimitationContent(id) {
        const limits = {
            apu: `
                <strong>APU START:</strong><br>
                • Max altitude: 25,000 ft<br>
                • Max EGT: 1090°C (5 sec), 1040°C continuous<br>
                • Min battery voltage: 22.5V<br><br>
                <strong>APU OPERATION:</strong><br>
                • Max altitude: 39,000 ft (electrical)<br>
                • Max altitude: 22,500 ft (bleed)
            `,
            engine: `
                <strong>ENGINE START:</strong><br>
                • Max EGT: 950°C<br>
                • Starter duty cycle: 2 min ON, 20 min OFF<br><br>
                <strong>TAKEOFF:</strong><br>
                • Max N1: 104.9%<br>
                • Max EGT: 1060°C (5 min), 950°C continuous<br><br>
                <strong>REVERSE THRUST:</strong><br>
                • Min speed: 70 kt
            `,
            flaps: `
                <strong>FLAP SPEEDS (Clean config, ISA, sea level):</strong><br>
                • CONF 1: 230 kt<br>
                • CONF 1+F: 215 kt<br>
                • CONF 2: 200 kt<br>
                • CONF 3: 185 kt<br>
                • CONF FULL: 177 kt<br><br>
                <strong>Note:</strong> Speeds vary with weight and altitude
            `,
            wind: `
                <strong>TAKEOFF:</strong><br>
                • Max tailwind: 10 kt (15 kt with specific approval)<br>
                • Max crosswind: 38 kt (dry), 29 kt (wet)<br><br>
                <strong>LANDING:</strong><br>
                • Max tailwind: 10 kt (15 kt with specific approval)<br>
                • Max crosswind: 38 kt (dry), 29 kt (wet), 20 kt (contaminated)
            `,
            autopilot: `
                <strong>ENGAGEMENT:</strong><br>
                • Min height after T/O: 100 ft<br>
                • Max bank angle: 45°<br><br>
                <strong>APPROACH:</strong><br>
                • CAT I: Min DH 200 ft<br>
                • CAT II: Min DH 100 ft<br>
                • CAT IIIA: Min DH 50 ft / No DH<br>
                • CAT IIIB: No DH (RVR ≥ 75m)
            `,
            fuel: `
                <strong>FUEL TANK LIMITS:</strong><br>
                • Max fuel imbalance: 1500 kg<br>
                • Min fuel temp: -40°C<br>
                • Max fuel temp: +55°C<br><br>
                <strong>FUEL FLOW:</strong><br>
                • Center tank must be empty before using wing tanks for landing
            `,
            gear: `
                <strong>GEAR EXTENSION:</strong><br>
                • Max speed (VLE): 280 kt / M 0.67<br>
                • Max operating speed (VLO extend): 250 kt / M 0.60<br>
                • Max operating speed (VLO retract): 220 kt / M 0.54<br><br>
                <strong>TIRE SPEEDS:</strong><br>
                • Max ground speed: 195 kt
            `
        };

        return limits[id] || 'Reference data not available';
    }

    initLimitationsEvents() {
        // Events handled by inline onclick
    }

    // =========================
    // MEMORY ITEMS
    // =========================

    renderMemoryItems() {
        const items = [
            {
                title: 'EMERGENCY DESCENT',
                steps: [
                    'ANNOUNCE: "EMERGENCY DESCENT"',
                    'CREW OXY MASKS: ON / 100%',
                    'THRUST LEVERS: IDLE',
                    'SPEED BRAKES: FULL',
                    'DESCENT: INITIATE (VMO/MMO or max structural speed)',
                    'APU: START (if time permits)',
                    'PASSENGER OXY: DEPLOY (if cabin altitude > 14,000 ft)'
                ]
            },
            {
                title: 'UNRELIABLE SPEED',
                steps: [
                    'AP: OFF',
                    'FD: OFF',
                    'A/THR: OFF',
                    'PITCH: 10° (or 15° if CONF > 0)',
                    'THRUST: TOGA or CLB',
                    'MAINTAIN: Wings level',
                    'DO NOT CHANGE: Pitch, thrust, config until situation stabilized'
                ]
            },
            {
                title: 'WINDSHEAR (REACTIVE)',
                steps: [
                    'AP: OFF',
                    'FD: OFF',
                    'THRUST LEVERS: TOGA',
                    'PITCH: 17.5° (or SRS if available)',
                    'MAINTAIN: Wings level',
                    'DO NOT CHANGE: Config until clear of windshear'
                ]
            },
            {
                title: 'TCAS RA',
                steps: [
                    'AP: OFF (recommended)',
                    'FOLLOW RA: Pitch guidance on PFD',
                    'DO NOT FOLLOW: ATC instructions if contrary to RA',
                    'CALL: "TCAS RA"',
                    'WHEN CLEAR: "Clear of conflict"',
                    'NOTIFY ATC: As soon as practical'
                ]
            },
            {
                title: 'STALL WARNING',
                steps: [
                    'AP: OFF',
                    'PITCH: REDUCE (until buffet stops)',
                    'THRUST: TOGA',
                    'WINGS: LEVEL',
                    'SPEED BRAKES: RETRACT',
                    'DO NOT CHANGE: Config until speed recovered'
                ]
            },
            {
                title: 'LOSS OF BRAKING',
                steps: [
                    'AUTOBRAKE: OFF',
                    'BRAKES: ALTERNATE (if available)',
                    'REVERSE THRUST: MAX',
                    'IF NO BRAKING: Consider emergency parking brake',
                    'EVACUATE: If necessary'
                ]
            }
        ];

        return `
            <div class="checklist-container">
                <div class="checklist-header">
                    <h2 class="checklist-title">MEMORY ITEMS</h2>
                    <p style="color: var(--color-warning); font-size: 12px; margin-top: 8px;">
                        EMERGENCY PROCEDURES - COMMIT TO MEMORY
                    </p>
                </div>

                ${items.map(item => `
                    <div class="card">
                        <div class="card-header" style="background: var(--color-warning); color: var(--bg-primary);">
                            ${item.title}
                        </div>
                        <div class="card-body">
                            <ol style="margin-left: 20px;">
                                ${item.steps.map(step => `<li style="margin-bottom: 8px;">${step}</li>`).join('')}
                            </ol>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Continue in next part...

    // =========================
    // DIVERSION MODULE
    // =========================

    renderDiversion() {
        return `
            <div class="checklist-container">
                <div class="checklist-header">
                    <h2 class="checklist-title">DIVERSION DECISION TOOL</h2>
                </div>

                <!-- CAN WE -->
                <div class="checklist-section">
                    <h3 class="section-title">1. CAN WE? (FUEL CHECK)</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">AIRPORT</label>
                            <input type="text" id="divAirport" class="form-input" placeholder="EGLL">
                        </div>
                        <div class="form-group">
                            <label class="form-label">FOB (KG)</label>
                            <input type="number" id="divFOB" class="form-input" placeholder="12000">
                        </div>
                        <div class="form-group">
                            <label class="form-label">FUEL BURN (KG/MIN)</label>
                            <input type="number" id="divBurn" class="form-input" placeholder="45">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">TIME AVAILABLE</label>
                            <div class="timer-display" id="divTimeAvail">--:--</div>
                        </div>
                    </div>
                    <button class="btn-primary" onclick="app.calculateDiversionFuel()">CALCULATE</button>
                </div>

                <!-- CAN WE SHOOT APPROACH -->
                <div class="checklist-section">
                    <h3 class="section-title">2. CAN WE SHOOT APPROACH?</h3>

                    <div class="form-group">
                        <label class="form-label">WEATHER CATEGORY</label>
                        <div class="toggle-group">
                            <button class="toggle-btn" data-wx-cat="I">CAT I</button>
                            <button class="toggle-btn" data-wx-cat="II">CAT II</button>
                            <button class="toggle-btn" data-wx-cat="III">CAT III</button>
                            <button class="toggle-btn" data-wx-cat="NPA">NPA</button>
                            <button class="toggle-btn" data-wx-cat="VIS">VIS</button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">AIRCRAFT CAPABILITY</label>
                        <div class="toggle-group">
                            <button class="toggle-btn" data-ac-cap="I">CAT I</button>
                            <button class="toggle-btn" data-ac-cap="II">CAT II</button>
                            <button class="toggle-btn" data-ac-cap="III">CAT III</button>
                            <button class="toggle-btn" data-ac-cap="NPA">NPA</button>
                            <button class="toggle-btn" data-ac-cap="VIS">VIS</button>
                        </div>
                    </div>

                    <div class="checklist-items">
                        <div class="checklist-item">
                            <input type="checkbox" class="checkbox" id="divNotam">
                            <label for="divNotam" class="checklist-label">ARPT/RUNWAY NOTAM CHECKED</label>
                        </div>
                        <div class="checklist-item">
                            <input type="checkbox" class="checkbox" id="divNav">
                            <label for="divNav" class="checklist-label">NAV AIDS SERVICEABLE</label>
                        </div>
                    </div>

                    <div class="form-group mt-md">
                        <label class="form-label">VAPP (KT)</label>
                        <input type="number" id="divVapp" class="form-input" placeholder="135">
                    </div>
                </div>

                <!-- CAN WE LAND & STOP -->
                <div class="checklist-section">
                    <h3 class="section-title">3. CAN WE LAND & STOP?</h3>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">AUTOLAND</label>
                            <div class="toggle-group">
                                <button class="toggle-btn" data-autoland="yes">YES</button>
                                <button class="toggle-btn" data-autoland="no">NO</button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">STOP MARGIN (M)</label>
                            <input type="number" id="divStopMargin" class="form-input" placeholder="500">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">BRAKE ENERGY (%)</label>
                            <input type="number" id="divBrakeEnergy" class="form-input" max="100" placeholder="75">
                        </div>
                        <div class="form-group">
                            <label class="form-label">BTV MODE</label>
                            <div class="toggle-group">
                                <button class="toggle-btn" data-btv="low">LOW</button>
                                <button class="toggle-btn" data-btv="med">MED</button>
                                <button class="toggle-btn" data-btv="high">HIGH</button>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">RED EXITS AVAILABLE</label>
                        <div class="toggle-group">
                            <button class="toggle-btn" data-exits="yes">YES</button>
                            <button class="toggle-btn" data-exits="no">NO</button>
                        </div>
                    </div>
                </div>

                <!-- PLAN B -->
                <div class="checklist-section">
                    <h3 class="section-title">4. PLAN B</h3>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">CLIMB GRADIENT REQ (%)</label>
                            <input type="number" step="0.1" id="divClimbGrad" class="form-input" placeholder="3.3">
                        </div>
                        <div class="form-group">
                            <label class="form-label">FUEL REQUIRED (KG)</label>
                            <input type="number" id="divPlanBFuel" class="form-input" placeholder="8000">
                        </div>
                    </div>

                    <div class="btn-group mt-md">
                        <button class="btn-success">COMMIT TO DIVERSION</button>
                        <button class="btn-secondary">SELECT ALTERNATE</button>
                    </div>
                </div>

                <!-- TURNAROUND CHECK -->
                <div class="checklist-section">
                    <h3 class="section-title">5. TURNAROUND CHECK</h3>

                    <div class="form-group">
                        <label class="form-label">AIRPORT CATEGORY</label>
                        <div class="toggle-group">
                            <button class="toggle-btn" data-arpt-cat="D">D</button>
                            <button class="toggle-btn" data-arpt-cat="A1">A1</button>
                            <button class="toggle-btn" data-arpt-cat="A2">A2</button>
                            <button class="toggle-btn" data-arpt-cat="CA">CA</button>
                            <button class="toggle-btn" data-arpt-cat="EA">EA</button>
                        </div>
                    </div>

                    <div class="checklist-items">
                        <div class="checklist-item">
                            <input type="checkbox" class="checkbox" id="divFuelUplift">
                            <label for="divFuelUplift" class="checklist-label">FUEL UPLIFT REQUIRED</label>
                        </div>
                        <div class="checklist-item">
                            <input type="checkbox" class="checkbox" id="divTowBar">
                            <label for="divTowBar" class="checklist-label">TOW BAR AVAILABLE</label>
                        </div>
                        <div class="checklist-item">
                            <input type="checkbox" class="checkbox" id="divMaint">
                            <label for="divMaint" class="checklist-label">MAINTENANCE REQUIRED</label>
                        </div>
                    </div>
                </div>

                <div class="checklist-section">
                    <button class="btn-danger" style="width: 100%;" onclick="app.clearDiversion()">RESET DIVERSION TOOL</button>
                </div>
            </div>
        `;
    }

    initDiversionEvents() {
        // Toggle buttons
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const parent = e.target.parentElement;
                parent.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }

    calculateDiversionFuel() {
        const fob = parseFloat(document.getElementById('divFOB').value);
        const burn = parseFloat(document.getElementById('divBurn').value);

        if (fob && burn) {
            const timeMin = Math.floor(fob / burn);
            const hours = Math.floor(timeMin / 60);
            const mins = timeMin % 60;

            document.getElementById('divTimeAvail').textContent =
                `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
        }
    }

    clearDiversion() {
        if (confirm('Reset all diversion data?')) {
            this.loadMenuContent('diversion');
        }
    }

    // =========================
    // SNOWTAM / GRF MODULE
    // =========================

    renderSnowtam() {
        return `
            <div class="checklist-container">
                <div class="checklist-header">
                    <h2 class="checklist-title">GRF / SNOWTAM GENERATOR</h2>
                    <div class="checklist-actions">
                        <button class="btn-secondary" onclick="app.clearSnowtam()">CLEAR</button>
                        <button class="btn-primary" onclick="app.generateSnowtam()">GENERATE</button>
                    </div>
                </div>

                <div class="checklist-section">
                    <h3 class="section-title">SNOWTAM DATA ENTRY</h3>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">AERODROME</label>
                            <input type="text" id="snowAerodrome" class="form-input" placeholder="EGLL">
                        </div>
                        <div class="form-group">
                            <label class="form-label">DATE/TIME (UTC)</label>
                            <input type="datetime-local" id="snowDateTime" class="form-input">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">RUNWAY</label>
                            <input type="text" id="snowRunway" class="form-input" placeholder="09L/27R">
                        </div>
                        <div class="form-group">
                            <label class="form-label">RWYCC (1-6)</label>
                            <input type="number" id="snowRWYCC" class="form-input" min="1" max="6" placeholder="4">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">COVERAGE (%)</label>
                            <input type="number" id="snowCoverage" class="form-input" max="100" placeholder="100">
                        </div>
                        <div class="form-group">
                            <label class="form-label">DEPTH (MM)</label>
                            <input type="number" id="snowDepth" class="form-input" placeholder="3">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">CONTAMINANT TYPE</label>
                        <select id="snowContaminant" class="form-input">
                            <option value="">-- SELECT --</option>
                            <option value="DRY_SNOW">DRY SNOW</option>
                            <option value="WET_SNOW">WET SNOW</option>
                            <option value="SLUSH">SLUSH</option>
                            <option value="STANDING_WATER">STANDING WATER</option>
                            <option value="ICE">ICE</option>
                            <option value="COMPACTED_SNOW">COMPACTED SNOW</option>
                            <option value="WET_ICE">WET ICE</option>
                            <option value="FROST">FROST</option>
                        </select>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">REDUCED LENGTH (M)</label>
                            <input type="number" id="snowReducedLength" class="form-input" placeholder="0">
                        </div>
                        <div class="form-group">
                            <label class="form-label">DRIFTING SNOW</label>
                            <div class="toggle-group">
                                <button class="toggle-btn" data-drift="yes">YES</button>
                                <button class="toggle-btn" data-drift="no">NO</button>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">TREATMENT</label>
                        <input type="text" id="snowTreatment" class="form-input" placeholder="Sand/Chemical">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">FRICTION COEFFICIENT</label>
                            <input type="number" step="0.01" id="snowFriction" class="form-input" placeholder="0.35">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">PLAIN LANGUAGE REMARKS</label>
                        <textarea id="snowRemarks" class="form-input" rows="3"
                                  placeholder="Additional runway condition information..."></textarea>
                    </div>
                </div>

                <div class="checklist-section">
                    <h3 class="section-title">GENERATED SNOWTAM</h3>
                    <div class="card">
                        <div class="card-body">
                            <pre id="snowtamOutput" style="white-space: pre-wrap; color: var(--color-confirm); font-family: var(--font-primary); font-size: 12px;">
[SNOWTAM will appear here after clicking GENERATE]
                            </pre>
                        </div>
                    </div>
                    <button class="btn-secondary mt-md" onclick="app.copySnowtam()">COPY TO CLIPBOARD</button>
                </div>
            </div>
        `;
    }

    initSnowtamEvents() {
        // Toggle buttons
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const parent = e.target.parentElement;
                parent.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }

    generateSnowtam() {
        const data = {
            aerodrome: document.getElementById('snowAerodrome').value,
            dateTime: document.getElementById('snowDateTime').value,
            runway: document.getElementById('snowRunway').value,
            rwycc: document.getElementById('snowRWYCC').value,
            coverage: document.getElementById('snowCoverage').value,
            depth: document.getElementById('snowDepth').value,
            contaminant: document.getElementById('snowContaminant').value,
            reducedLength: document.getElementById('snowReducedLength').value,
            treatment: document.getElementById('snowTreatment').value,
            friction: document.getElementById('snowFriction').value,
            remarks: document.getElementById('snowRemarks').value
        };

        const driftBtn = document.querySelector('[data-drift].active');
        const drifting = driftBtn ? driftBtn.dataset.drift === 'yes' : false;

        const snowtam = `
SNOWTAM ${data.aerodrome}
${data.dateTime ? new Date(data.dateTime).toISOString().substr(0, 16).replace('T', ' ') + 'Z' : '[DATE/TIME]'}

RUNWAY: ${data.runway || '[RWY]'}
RWYCC: ${data.rwycc || '[CODE]'}
COVERAGE: ${data.coverage || '[%]'}%
DEPTH: ${data.depth || '[MM]'} MM
TYPE: ${data.contaminant ? data.contaminant.replace(/_/g, ' ') : '[TYPE]'}
${data.reducedLength ? `REDUCED LENGTH: ${data.reducedLength}M` : ''}
${drifting ? 'DRIFTING SNOW: YES' : ''}
${data.treatment ? `TREATMENT: ${data.treatment}` : ''}
${data.friction ? `FRICTION COEFF: ${data.friction}` : ''}

${data.remarks ? `REMARKS: ${data.remarks}` : ''}
        `.trim();

        document.getElementById('snowtamOutput').textContent = snowtam;
    }

    copySnowtam() {
        const text = document.getElementById('snowtamOutput').textContent;
        navigator.clipboard.writeText(text).then(() => {
            alert('SNOWTAM copied to clipboard');
        });
    }

    clearSnowtam() {
        if (confirm('Clear all SNOWTAM data?')) {
            this.loadMenuContent('snowtam');
        }
    }

    // =========================
    // PERSONAL NOTES
    // =========================

    renderPersonalNotes() {
        const notes = this.getPersonalNotes();

        return `
            <div class="checklist-container">
                <div class="checklist-header">
                    <h2 class="checklist-title">PERSONAL NOTES</h2>
                    <div class="checklist-actions">
                        <button class="btn-secondary" onclick="app.exportNotesPDF()">EXPORT PDF</button>
                        <button class="btn-primary" onclick="app.savePersonalNotes()">SAVE</button>
                    </div>
                </div>

                <div class="checklist-section">
                    <textarea id="personalNotes" class="form-input"
                              style="min-height: 500px; font-size: 14px;"
                              placeholder="Personal operational notes, procedures, reminders...">${notes}</textarea>
                    <div class="text-secondary" style="font-size: 11px; margin-top: 8px;">
                        Last saved: ${this.getNotesTimestamp()}
                    </div>
                </div>
            </div>
        `;
    }

    initPersonalNotesEvents() {
        // Auto-save handled by button
    }

    getPersonalNotes() {
        return localStorage.getItem('flightdeck_personal_notes') || '';
    }

    savePersonalNotes() {
        const notes = document.getElementById('personalNotes').value;
        localStorage.setItem('flightdeck_personal_notes', notes);
        localStorage.setItem('flightdeck_notes_timestamp', new Date().toISOString());
        alert('Notes saved successfully');
        this.loadMenuContent('notes');
    }

    getNotesTimestamp() {
        const ts = localStorage.getItem('flightdeck_notes_timestamp');
        if (ts) {
            return new Date(ts).toLocaleString();
        }
        return 'Never';
    }

    exportNotesPDF() {
        alert('PDF export functionality requires jsPDF library integration.\nNotes content can be copied and exported externally.');
    }

    // =========================
    // SETTINGS
    // =========================

    renderSettings() {
        return `
            <div class="checklist-container">
                <div class="checklist-header">
                    <h2 class="checklist-title">SETTINGS</h2>
                </div>

                <div class="checklist-section">
                    <h3 class="section-title">UNITS</h3>
                    <div class="form-group">
                        <label class="form-label">WEIGHT UNITS</label>
                        <div class="toggle-group">
                            <button class="toggle-btn ${this.settings.units === 'metric' ? 'active' : ''}"
                                    data-setting="units" data-value="metric">KILOGRAMS</button>
                            <button class="toggle-btn ${this.settings.units === 'imperial' ? 'active' : ''}"
                                    data-setting="units" data-value="imperial">POUNDS</button>
                        </div>
                    </div>
                </div>

                <div class="checklist-section">
                    <h3 class="section-title">DATA MANAGEMENT</h3>
                    <div class="btn-group-vertical">
                        <button class="btn-secondary" onclick="app.backupData()">BACKUP ALL DATA</button>
                        <button class="btn-secondary" onclick="app.restoreData()">RESTORE FROM BACKUP</button>
                        <button class="btn-danger" onclick="app.resetAllData()">RESET ALL DATA</button>
                    </div>
                </div>

                <div class="checklist-section">
                    <h3 class="section-title">APP INFO</h3>
                    <div class="card-body">
                        <p><strong>Version:</strong> 1.0.0</p>
                        <p><strong>Build:</strong> 2026.03.03</p>
                        <p><strong>Platform:</strong> Web Application</p>
                        <p style="margin-top: 16px; color: var(--text-secondary); font-size: 11px;">
                            FlightDeck Pro is a reference tool for professional flight operations.
                            Not certified for flight-critical use.
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    initSettingsEvents() {
        document.querySelectorAll('[data-setting]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const setting = e.target.dataset.setting;
                const value = e.target.dataset.value;

                this.settings[setting] = value;
                this.saveSettings();

                // Update UI
                const parent = e.target.parentElement;
                parent.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }

    backupData() {
        const backup = {
            settings: this.settings,
            checklists: this.checklists,
            scratchpads: {},
            notes: this.getPersonalNotes(),
            timestamp: new Date().toISOString()
        };

        // Collect all scratchpads
        ['preflight', 'cruise', 'approach', 'quicknotes'].forEach(key => {
            backup.scratchpads[key] = this.getScratchpad(key);
        });

        const json = JSON.stringify(backup, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flightdeck_backup_${Date.now()}.json`;
        a.click();

        alert('Backup file downloaded');
    }

    restoreData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();

            reader.onload = (event) => {
                try {
                    const backup = JSON.parse(event.target.result);

                    if (confirm('This will overwrite all current data. Continue?')) {
                        this.settings = backup.settings;
                        this.checklists = backup.checklists;

                        Object.keys(backup.scratchpads).forEach(key => {
                            this.saveScratchpad(key, backup.scratchpads[key]);
                        });

                        localStorage.setItem('flightdeck_personal_notes', backup.notes);

                        this.saveSettings();
                        this.saveChecklistData();

                        alert('Data restored successfully');
                        location.reload();
                    }
                } catch (err) {
                    alert('Invalid backup file');
                }
            };

            reader.readAsText(file);
        };

        input.click();
    }

    resetAllData() {
        if (confirm('WARNING: This will DELETE ALL DATA including checklists, notes, and settings.\n\nThis action CANNOT be undone.\n\nContinue?')) {
            if (confirm('Final confirmation: DELETE ALL DATA?')) {
                localStorage.clear();
                alert('All data has been reset');
                location.reload();
            }
        }
    }

    // =========================
    // STATIC CONTENT PAGES
    // =========================

    renderWhatsNew() {
        return `
            <div class="checklist-container">
                <div class="checklist-header">
                    <h2 class="checklist-title">WHAT'S NEW</h2>
                </div>

                <div class="card">
                    <div class="card-header">VERSION 1.0.0 - INITIAL RELEASE</div>
                    <div class="card-body">
                        <strong>Features:</strong>
                        <ul style="margin-left: 20px; margin-top: 8px;">
                            <li>Complete pre-flight checklist system</li>
                            <li>Cruise phase management</li>
                            <li>Approach preparation tools</li>
                            <li>Comprehensive diversion decision tool</li>
                            <li>SNOWTAM/GRF generator</li>
                            <li>Limitations quick reference</li>
                            <li>Memory items emergency procedures</li>
                            <li>Personal notes with backup/restore</li>
                            <li>Local data persistence</li>
                            <li>Professional Airbus-style EFB interface</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    renderDisclaimerText() {
        return `
            <div class="checklist-container">
                <div class="checklist-header">
                    <h2 class="checklist-title">DISCLAIMER</h2>
                </div>

                <div class="card">
                    <div class="card-body" style="line-height: 1.8;">
                        <p style="margin-bottom: 16px;">
                            <strong style="color: var(--color-caution);">THIS APPLICATION IS A REFERENCE TOOL ONLY</strong>
                        </p>

                        <p style="margin-bottom: 16px;">
                            FlightDeck Pro is designed to assist professional flight crews with operational
                            procedures and reference data. It is <strong>NOT</strong> certified flight equipment
                            and must <strong>NOT</strong> be used as a primary reference for flight operations.
                        </p>

                        <p style="margin-bottom: 16px;">
                            <strong>Users are solely responsible for:</strong>
                        </p>
                        <ul style="margin-left: 20px; margin-bottom: 16px;">
                            <li>Verifying all data against official airline procedures and manuals</li>
                            <li>Ensuring compliance with applicable regulations (EASA, FAA, etc.)</li>
                            <li>Using only certified equipment for flight-critical decisions</li>
                            <li>Following company standard operating procedures (SOPs)</li>
                        </ul>

                        <p style="margin-bottom: 16px;">
                            This tool is provided "AS IS" without warranty of any kind. The developers
                            assume no liability for errors, omissions, or consequences of use.
                        </p>

                        <p style="color: var(--color-warning);">
                            Always refer to official documentation and certified systems for flight operations.
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    renderSupport() {
        return `
            <div class="checklist-container">
                <div class="checklist-header">
                    <h2 class="checklist-title">SUPPORT</h2>
                </div>

                <div class="card">
                    <div class="card-header">CONTACT</div>
                    <div class="card-body">
                        <p>For support, feature requests, or bug reports:</p>
                        <p style="margin-top: 12px;">
                            <strong>Email:</strong> support@flightdeckpro.app<br>
                            <strong>Website:</strong> www.flightdeckpro.app
                        </p>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">DOCUMENTATION</div>
                    <div class="card-body">
                        <p>User manual and training materials available at:</p>
                        <p style="margin-top: 8px; color: var(--text-primary);">
                            www.flightdeckpro.app/docs
                        </p>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">SYSTEM REQUIREMENTS</div>
                    <div class="card-body">
                        <ul style="margin-left: 20px;">
                            <li>Modern web browser (Chrome, Safari, Edge)</li>
                            <li>iPad (Landscape orientation recommended)</li>
                            <li>Local storage enabled</li>
                            <li>No internet required after initial load</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    renderColdOps() {
        return `
            <div class="checklist-container">
                <div class="checklist-header">
                    <h2 class="checklist-title">COLD WEATHER OPERATIONS</h2>
                </div>

                <div class="card">
                    <div class="card-header">PRE-FLIGHT CONSIDERATIONS</div>
                    <div class="card-body">
                        <ul style="margin-left: 20px;">
                            <li>De-icing/Anti-icing requirements</li>
                            <li>Holdover time verification</li>
                            <li>Cold temperature altitude corrections</li>
                            <li>Engine warm-up procedures</li>
                            <li>APU limitations in cold weather</li>
                        </ul>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">ALTITUDE CORRECTIONS</div>
                    <div class="card-body">
                        <p>When temperature is significantly below ISA, apply cold temperature
                        altitude corrections to all altitudes on approach.</p>
                        <p style="margin-top: 12px;">
                            <strong>Critical areas:</strong> Minimum sector altitudes,
                            procedure turn altitudes, final approach fix altitudes.
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    renderFTL() {
        return `
            <div class="checklist-container">
                <div class="checklist-header">
                    <h2 class="checklist-title">FLIGHT TIME LIMITATIONS</h2>
                </div>

                <div class="card">
                    <div class="card-header">EASA FTL (EU-OPS)</div>
                    <div class="card-body">
                        <p><strong>Daily FDP limits vary based on:</strong></p>
                        <ul style="margin-left: 20px; margin-top: 8px;">
                            <li>Crew composition (single/augmented)</li>
                            <li>Number of sectors</li>
                            <li>Time of day (circadian rhythm)</li>
                            <li>Rest periods</li>
                        </ul>
                        <p style="margin-top: 12px; color: var(--color-caution);">
                            Always refer to company FTL policy and OM-A for specific limits.
                        </p>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">KEY DEFINITIONS</div>
                    <div class="card-body">
                        <p><strong>FDP:</strong> Flight Duty Period</p>
                        <p><strong>DP:</strong> Duty Period</p>
                        <p><strong>REST:</strong> Minimum rest period</p>
                        <p style="margin-top: 12px;">
                            Report time → Chocks on → Chocks off → Post-flight duties
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    renderLoading() {
        return `
            <div class="checklist-container">
                <div class="checklist-header">
                    <h2 class="checklist-title">LOADING & WEIGHT/BALANCE</h2>
                </div>

                <div class="card">
                    <div class="card-header">LOADSHEET VERIFICATION</div>
                    <div class="card-body">
                        <p><strong>Critical items to verify:</strong></p>
                        <ul style="margin-left: 20px; margin-top: 8px;">
                            <li>Total aircraft weight within MTOW</li>
                            <li>Zero Fuel Weight (ZFW) within limits</li>
                            <li>Center of Gravity (CG) within envelope</li>
                            <li>Fuel distribution correct</li>
                            <li>Cargo/baggage correctly loaded</li>
                            <li>Load sheet signed by loadmaster</li>
                        </ul>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">TRIM SETTING</div>
                    <div class="card-body">
                        <p>Set horizontal stabilizer trim per loadsheet CG position.</p>
                        <p style="margin-top: 8px; color: var(--color-caution);">
                            Incorrect trim setting can result in takeoff difficulties.
                        </p>
                    </div>
                </div>
            </div>
        `;
    }
}

// =========================
// INITIALIZE APP
// =========================

let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new FlightDeckApp();
});
