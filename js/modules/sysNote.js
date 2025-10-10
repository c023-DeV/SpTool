export function sysNote(message, type = 'note') {
        const parent = document.getElementById('sysNotes');
        const notification = document.createElement('div');
        notification.textContent = message;
        switch (type) {
            case 'note':
                notification.className = 'sysNote';
                break;
            case 'alert':
                notification.className = 'sysAlert';
                break;
            case 'good':
                notification.className = 'sysGood';
                break;
            default:
                console.log('Unknown SysNote Type!')
                notification.className = 'sysNote';
                break;
        }
        parent.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }