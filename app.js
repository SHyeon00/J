const actionForm = document.querySelector('#action-form');
const actionTitle = document.querySelector('#action-title');
const actionList = document.querySelector('#action-list');
const progress = document.querySelector('#progress');
const emptyMessage = document.querySelector('#empty-message');
const statusMessage = document.querySelector('#status');

function updateProgress() {
    const total = actionList.children.length;
    const completed = actionList.querySelectorAll('.completed').length;
    progress.textContent = `${total}개 중 ${completed}개 완료`;
    emptyMessage.hidden = total > 0;
}

function addAction(title) {
    const item = document.createElement('li');
    item.className = 'action-item';

    const completeButton = document.createElement('button');
    completeButton.type = 'button';
    completeButton.className = 'complete-button';
    completeButton.setAttribute('aria-label', '실천 완료 표시');
    completeButton.setAttribute('aria-pressed', 'false');

    const text = document.createElement('span');
    text.className = 'action-text';
    text.textContent = title;

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'delete-button';
    deleteButton.textContent = '삭제';
    deleteButton.setAttribute('aria-label', `${title} 실천 삭제`);

    completeButton.addEventListener('click', () => {
        const completed = item.classList.toggle('completed');
        completeButton.textContent = completed ? '✓' : '';
        completeButton.setAttribute('aria-pressed', String(completed));
        completeButton.setAttribute('aria-label', completed ? '실천 완료 취소' : '실천 완료 표시');
        statusMessage.textContent = completed ? '실천을 완료했습니다.' : '완료 표시를 취소했습니다.';
        updateProgress();
    });

    deleteButton.addEventListener('click', () => {
        const nextButton = item.nextElementSibling?.querySelector('button')
            || item.previousElementSibling?.querySelector('button');
        item.remove();
        updateProgress();
        statusMessage.textContent = '선택한 실천을 삭제했습니다.';
        (nextButton || actionTitle).focus();
    });

    item.append(completeButton, text, deleteButton);
    actionList.append(item);
    updateProgress();
}

actionForm.addEventListener('submit', (event) => {
    event.preventDefault();
    addAction(actionTitle.value);
    actionTitle.value = '';
    actionTitle.focus();
    statusMessage.textContent = '새로운 실천을 추가했습니다.';
});

updateProgress();

const homeView = document.querySelector('#home-view');
const sleepView = document.querySelector('#sleep-view');
const reportView = document.querySelector('#report-view');
const startSleepButton = document.querySelector('#start-sleep');
const endSleepButton = document.querySelector('#end-sleep');
const recentReportButton = document.querySelector('#recent-report-button');
let sessionStartedAt = null;
let sessionTimer = null;
let lastSession = null;

function formatDuration(milliseconds) {
    const seconds = Math.max(0, Math.floor(milliseconds / 1000));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}시간 ${minutes}분 ${seconds % 60}초`;
}

function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}월 ${date.getDate()}일 ${date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
}

function showView(view, focusTarget) {
    homeView.hidden = view !== homeView;
    sleepView.hidden = view !== sleepView;
    reportView.hidden = view !== reportView;
    document.body.classList.toggle('is-sleeping', view === sleepView);
    document.querySelector('meta[name="theme-color"]').setAttribute('content', view === sleepView ? '#1c1e21' : '#f5f7f2');
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (focusTarget) focusTarget.focus({ preventScroll: true });
}

function updateSessionClock() {
    if (sessionStartedAt === null) return;
    const now = Date.now();
    document.querySelector('#elapsed-time').textContent = formatDuration(now - sessionStartedAt);
    document.querySelector('#current-clock').textContent = new Date(now).toLocaleTimeString('ko-KR', {
        hour: '2-digit', minute: '2-digit', hour12: false
    });
}

function showReport() {
    if (!lastSession) return;
    document.querySelector('#report-date').textContent = `${formatDateTime(lastSession.startedAt)}부터의 기록`;
    document.querySelector('#report-duration').textContent = formatDuration(lastSession.endedAt - lastSession.startedAt);
    document.querySelector('#report-start').textContent = formatDateTime(lastSession.startedAt);
    document.querySelector('#report-end').textContent = formatDateTime(lastSession.endedAt);
    showView(reportView, document.querySelector('#report-heading'));
}

startSleepButton.addEventListener('click', () => {
    if (sessionStartedAt !== null) return;
    sessionStartedAt = Date.now();
    startSleepButton.disabled = true;
    document.querySelector('#started-at').textContent = `${formatDateTime(sessionStartedAt)} 시작`;
    updateSessionClock();
    sessionTimer = window.setInterval(updateSessionClock, 1000);
    showView(sleepView, document.querySelector('#sleep-heading'));
    statusMessage.textContent = '수면 모드를 시작했습니다. 실제 음성은 수집하지 않습니다.';
});

endSleepButton.addEventListener('click', () => {
    if (sessionStartedAt === null) return;
    lastSession = { startedAt: sessionStartedAt, endedAt: Date.now() };
    window.clearInterval(sessionTimer);
    sessionTimer = null;
    sessionStartedAt = null;
    startSleepButton.disabled = false;
    document.querySelector('#recent-date').textContent = `이번 기록 · ${formatDateTime(lastSession.endedAt)}`;
    document.querySelector('#recent-duration-label').textContent = '이번 기록 시간';
    document.querySelector('#recent-duration').textContent = formatDuration(lastSession.endedAt - lastSession.startedAt);
    recentReportButton.hidden = false;
    showReport();
    statusMessage.textContent = '수면 모드를 종료했습니다. 기록 시간과 데모 분석 결과를 확인해 주세요.';
});

recentReportButton.addEventListener('click', showReport);
document.querySelector('#back-home').addEventListener('click', () => {
    showView(homeView, startSleepButton);
});
document.querySelector('#go-actions').addEventListener('click', () => {
    showView(homeView);
    actionTitle.scrollIntoView({ block: 'center', behavior: 'instant' });
    actionTitle.focus({ preventScroll: true });
});
