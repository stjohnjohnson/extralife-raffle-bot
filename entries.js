import { getUserDonations } from 'extra-life-api';
import { readFileSync, writeFileSync } from 'fs';

const ethAddressRegex = /0x[a-fA-F0-9]{40}/;

class Entries {
    constructor(participantID, raffleCost, historyFile) {
        this.participantID = participantID;
        this.raffleCost = raffleCost;
        this.historyFile = historyFile;

        // Entries and Donors
        this.seenDonationIDs = {};
        this.entries = [];
        this.donors = {};
        this.donations = {};
        this.count = 0;

        // Refresh donations every 60s
        setInterval(() => {
            this.refreshDonations();
        }, 60000);
    }

    pick() {
        let index = Math.floor(Math.random() * this.count);
        let address = this.entries[index];
        let name = this.donors[address][0];

        return {
            address,
            name
        };
    }

    parseDonation(donation) {
        if (!donation.message) {
            return;
        }
        let m = donation.message.match(ethAddressRegex);
        if (!m) {
            return;
        }
        let address = m[0].toLowerCase();
        let value = donation.amount;
        let name = donation.displayName;

        // Store value
        if (!this.donations[address]) {
            this.donations[address] = 0;
        }
        this.donations[address] += value;

        // Store donor lookup
        if (!this.donors[address]) {
            this.donors[address] = [];
        }
        if (this.donors[address].indexOf(name) === -1) {
            this.donors[address].push(name);
        }
    }

    async parseHistory() {
        let fileData;
        try {
            fileData = JSON.parse(readFileSync(this.historyFile));
        } catch (error) {
            fileData = { entries: [] };
        }

        fileData.entries.map(donation => {
            console.log(`Adding manual entry: ${donation.name}`);
            this.addManualDonation(donation);
        });

        return this.parseEntries();
    }

    refreshDonations() {
        return this.loadDonations().then((entries) => {
            console.log(`Refreshed entries ${entries.length} across ${Object.keys(this.donors).length} donors`);
        }).catch(err => {
            console.error('Unable to load donations: ', err);
        });
    }

    async loadDonations(page = 1) {
        let data = await getUserDonations(this.participantID, 100, page);
        let hasSeen = 0;

        data.donations.map(donation => {
            if (this.seenDonationIDs[donation.donationID]) {
                hasSeen += 1;
                return;
            }
            this.seenDonationIDs[donation.donationID] = true;
            this.parseDonation(donation);
        });

        // If there is more data, load it
        if (hasSeen <= 1 && data.countPages !== page) {
            return this.loadDonations(page + 1)
        }

        return this.parseEntries();
    }

    parseEntries() {
        // If we're done, flatten $ amount into entries
        let entries = [];
        Object.keys(this.donations).forEach(address => {
            let count = Math.floor(this.donations[address] / this.raffleCost);
            for (let i = 0; i < count; i++) {
                entries.push(address);
            }
        });
        this.entries = entries;
        this.count = entries.length;

        return this.entries;
    }

    async addManualDonation(name, address, value) {
        if (!ethAddressRegex.test(address)) {
            return 'Address does not look valid.';
        }

        // Store value
        if (!this.donations[address]) {
            this.donations[address] = 0;
        }

        this.donations[address] += value;

        // Store donor lookup
        if (!this.donors[address]) {
            this.donors[address] = [];
        }

        if (this.donors[address].indexOf(name) === -1) {
            this.donors[address].push(name);
        }

        this.addManualDonationToHistory(name, address, value);
        this.parseEntries();

        return `Manual entry added for ${name}.`
    }

    async addManualDonationToHistory(name, address, value) {
        let fileData;
        try {
            fileData = JSON.parse(readFileSync(this.historyFile));
        } catch (error) {
            console.log('errrrror');
            fileData = { entries: [] };
        }

        fileData.entries.push({
            name,
            address,
            value
        });

        writeFileSync(this.historyFile, JSON.stringify(fileData, null, 2));
    }
}

export default Entries;