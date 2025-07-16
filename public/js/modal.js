// public/js/modal.js
class Modal {
    constructor(modalId) {
        this.modal = document.getElementById(modalId);
        if (!this.modal) {
            console.error(`Modal element with ID "${modalId}" not found.`);
        }
    }

    open() {
        if (this.modal) {
            this.modal.style.display = 'flex'; // Use flex to center
        }
    }

    close() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
    }
}