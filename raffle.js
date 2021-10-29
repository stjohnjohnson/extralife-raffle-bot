import { DateTime } from 'luxon';
import { EventEmitter } from 'events';

class Raffle extends EventEmitter {
    constructor(startDate, endDate) {
        super();
        this.active = 0;

        // Setup Raffle timing
        this.times = [];
        this.start = DateTime.fromISO(startDate);
        this.end = DateTime.fromISO(endDate);
        for (let i = 0; i < this.end.diff(this.start, 'hours').hours; i++) {
            let raffleTime = this.start.plus({ hours: i + 1 });

            this.times.push(raffleTime);
            // Check if it's already past
            if (raffleTime < DateTime.now()) {
                this.active = i + 1;
            } else {
                // Set 5 minute reminder
                setTimeout(() => {
                    this.emit('reminder');
                }, raffleTime.plus({ minutes: -5 }).diff(DateTime.now(), 'seconds').seconds * 1000);
                // Set 0 minute alert
                setTimeout(() => {
                    this.emit('raffle');
                }, raffleTime.diff(DateTime.now(), 'seconds').seconds * 1000);
            }
        }
    }

    // Returns human readible text for the start date
    getStartDate() {
        return this.start.toLocaleString(DateTime.DATETIME_FULL);
    }

    // Returns time left until the next drawing
    getTimeUntil() {
        let minutesLeft = this.getMinutesUntil();

        if (minutesLeft === Number.MIN_VALUE) {
            return '';
        } else if (minutesLeft < 0) {
            return 'right now'
        } else if (minutesLeft < 1) {
            return 'in less than a minute';
        } else if (minutesLeft < 2) {
            return 'in 1 minute';
        } else {
            minutesLeft = Math.floor(minutesLeft);
            return `in ${minutesLeft} minutes`;
        }
    }

    // Returns the minutes left until the next drawing
    getMinutesUntil() {
        if (this.active >= this.times.length) {
            return Number.MIN_VALUE;
        }
        return this.times[this.active].diff(DateTime.now(), 'minutes').minutes;
    }

    // Returns true if the raffle started
    hasStarted() {
        return DateTime.now() > this.start;
    }

    // Returns true if the raffle ended
    hasEnded() {
        return DateTime.now() > this.end && this.active >= this.times.length;
    }

    // Returns true if the raffle is active
    isActive() {
        return this.hasStarted() && !this.hasEnded();
    }
};

export default Raffle;