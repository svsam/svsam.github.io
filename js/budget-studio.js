(() => {
    "use strict";

    const STORAGE_KEY = "svs-funding-notepad-2026-27-v1";
    const PLAN_START = "2026-09-21";
    const PLAN_END = "2027-09-20";
    const DAY_MS = 86_400_000;

    const money = new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
    });

    const fullDate = new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    });

    const shortDate = new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
    });

    const weekday = new Intl.DateTimeFormat("en-GB", {
        weekday: "short",
        timeZone: "UTC",
    });

    const monthLabel = new Intl.DateTimeFormat("en-GB", {
        month: "short",
        timeZone: "UTC",
    });

    const SPEND_CATEGORIES = [
        { id: "subscriptions", label: "Subscriptions", code: "SUB", description: "ChatGPT, Spotify, Monzo + bills" },
        { id: "food", label: "Food", code: "FOOD", description: "Groceries + university meals" },
        { id: "entertainment", label: "Entertainment", code: "LIFE", description: "Clothing, books + trip" },
        { id: "pets", label: "Pets", code: "PETS", description: "Food, litter + health" },
        { id: "travel", label: "Travel", code: "MOVE", description: "University, buses + partner" },
        { id: "debt", label: "Opening debt", code: "DEBT", description: "One-off repayment" },
    ];

    const CATEGORY_LOOKUP = Object.fromEntries([
        ...SPEND_CATEGORIES,
        { id: "funding", label: "Funding", code: "IN" },
        { id: "savings", label: "Protected savings", code: "SAVE" },
    ].map((category) => [category.id, category]));

    function dateFromIso(value) {
        return new Date(`${value}T00:00:00.000Z`);
    }

    function isoFromDate(value) {
        return value.toISOString().slice(0, 10);
    }

    function addDays(value, amount) {
        const date = dateFromIso(value);
        date.setUTCDate(date.getUTCDate() + amount);
        return isoFromDate(date);
    }

    function daysBetween(start, end) {
        return Math.round((dateFromIso(end) - dateFromIso(start)) / DAY_MS);
    }

    function validPlanDate(value) {
        return typeof value === "string"
            && /^\d{4}-\d{2}-\d{2}$/.test(value)
            && !Number.isNaN(dateFromIso(value).getTime())
            && value >= PLAN_START
            && value <= PLAN_END;
    }

    function roundMoney(value) {
        return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
    }

    function finiteAmount(value) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? roundMoney(parsed) : 0;
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function rangeEvery(start, end, dayStep) {
        const result = [];
        for (let current = start; current <= end; current = addDays(current, dayStep)) result.push(current);
        return result;
    }

    function monthDates(year, startMonth, count, day) {
        return Array.from({ length: count }, (_, index) => {
            const value = new Date(Date.UTC(year, startMonth + index, day));
            return isoFromDate(value);
        });
    }

    function buildSchedule() {
        const events = [];
        let eventNumber = 0;
        const add = (date, name, category, amount, type = "expense", note = "", major = false) => {
            eventNumber += 1;
            events.push({
                id: `${date}-${category}-${String(eventNumber).padStart(3, "0")}`,
                date,
                name,
                category,
                amount: roundMoney(amount),
                type,
                note,
                major,
            });
        };
        const addMany = (dates, name, category, amount, type = "expense", note = "") => {
            dates.forEach((date) => add(date, name, category, amount, type, note));
        };

        add("2026-09-21", "Maintenance Loan 1", "funding", 3008.94, "income", "Official loan instalment", true);
        add("2027-01-11", "Maintenance Loan 2", "funding", 3008.94, "income", "Official loan instalment", true);
        add("2027-04-19", "Maintenance Loan 3", "funding", 3100.12, "income", "Official loan instalment", true);
        add("2026-11-09", "King's Living Bursary 1", "funding", 800, "income", "Bursary payment", true);
        add("2027-02-15", "King's Living Bursary 2", "funding", 800, "income", "Bursary payment", true);
        addMany(rangeEvery("2026-09-21", "2027-09-06", 14), "Allowance", "funding", 20, "income", "Fortnightly allowance");

        add("2027-01-11", "Savings transfer from Loan 2", "savings", 902.68, "saving", "30% protected savings transfer");
        add("2027-04-19", "Savings transfer from Loan 3", "savings", 930.04, "saving", "30% protected savings transfer");

        addMany(monthDates(2026, 8, 12, 28), "ChatGPT Pro 5x", "subscriptions", 88.90);
        addMany(monthDates(2026, 8, 12, 28), "Bill B", "subscriptions", 32.99);
        addMany(monthDates(2026, 8, 12, 28), "Bill C", "subscriptions", 36.94);
        addMany(monthDates(2026, 9, 12, 1), "Spotify", "subscriptions", 5.99);
        add("2026-10-02", "Monzo Perks", "subscriptions", 7);
        addMany(monthDates(2026, 10, 11, 2), "Monzo Perks", "subscriptions", 9);
        addMany(monthDates(2026, 9, 12, 6), "Bill A", "subscriptions", 9.49);
        addMany([
            "2026-09-29", "2026-10-29", "2026-11-29", "2026-12-29", "2027-01-29", "2027-02-28",
            "2027-03-29", "2027-04-29", "2027-05-29", "2027-06-29", "2027-07-29", "2027-08-29",
        ], "Bill D", "subscriptions", 0.99);

        add("2026-09-21", "Term 1 groceries", "food", 200);
        add("2027-01-11", "Term 2 groceries", "food", 200);
        add("2027-04-12", "Term 3 groceries (pre-funded)", "food", 200);
        addMany([
            "2026-09-28", "2026-10-05", "2026-10-12", "2026-10-19", "2026-10-26", "2026-11-09",
            "2026-11-16", "2026-11-23", "2026-11-30", "2026-12-07", "2026-12-14",
        ], "University/library food (5 visits)", "food", 40, "expense", "5 visits at £8");
        add("2027-01-04", "University/library food (3 visits)", "food", 24, "expense", "3 visits at £8");
        addMany(["2027-01-11", "2027-01-18"], "University/library food (6 visits)", "food", 48, "expense", "6 visits at £8");
        addMany([
            "2027-01-25", "2027-02-01", "2027-02-08", "2027-02-15", "2027-02-22", "2027-03-08",
            "2027-03-15", "2027-03-22",
        ], "University/library food (5 visits)", "food", 40, "expense", "5 visits at £8");
        addMany(["2027-04-19", "2027-04-26", "2027-05-03"], "University/library food (5 visits)", "food", 40, "expense", "5 visits at £8");
        addMany(["2027-05-10", "2027-05-17", "2027-05-24", "2027-05-31"], "University/library food (6 visits)", "food", 48, "expense", "6 visits at £8");
        addMany(["2027-06-07", "2027-06-14", "2027-06-21", "2027-06-28"], "University/library food (3 visits)", "food", 24, "expense", "3 visits at £8");

        add("2026-09-21", "Books", "entertainment", 100);
        addMany(monthDates(2026, 9, 12, 1), "Clothing reserve", "entertainment", 40);
        add("2026-11-02", "First-term reading-week trip", "entertainment", 300);

        addMany(rangeEvery("2026-09-21", "2027-09-20", 14), "Kitten food", "pets", 25);
        addMany(rangeEvery("2026-09-21", "2027-09-20", 14), "Kitten litter", "pets", 15);
        add("2026-09-21", "Cat health payment", "pets", 75);

        [
            ["2026-09-28", "Zones 1-4 Monthly Student Travelcard", 172.50, "University Underground and buses"],
            ["2026-10-28", "University PAYG bundle (3 days)", 38.40, "Tube and two buses per day"],
            ["2026-11-09", "Zones 1-4 Monthly Student Travelcard", 172.50, "University Underground and buses"],
            ["2026-12-09", "University PAYG bundle (3 days)", 38.40, "Tube and two buses per day"],
            ["2026-12-14", "Zones 1-5 7-Day Student Travelcard", 53.40, "University, buses and partner visit"],
            ["2027-01-08", "University PAYG assessment bundle (3 days)", 38.40, "Tube and two buses per day"],
            ["2027-01-11", "Zones 1-5 Monthly Student Travelcard", 205.10, "University, buses and partner visits"],
            ["2027-02-11", "University PAYG bundle (2 days)", 25.60, "Tube and two buses per day"],
            ["2027-02-15", "Zones 1-4 7-Day Student Travelcard", 44.90, "Includes London buses"],
            ["2027-02-22", "Zones 1-5 7-Day Student Travelcard", 53.40, "Includes partner visit"],
            ["2027-03-08", "Zones 1-5 7-Day Student Travelcard", 53.40, "Includes partner visit"],
            ["2027-03-15", "Zones 1-4 7-Day Student Travelcard", 44.90, "Includes London buses"],
            ["2027-03-22", "Zones 1-5 7-Day Student Travelcard", 53.40, "Includes partner visit"],
            ["2027-04-19", "Zones 1-5 7-Day Student Travelcard", 53.40, "Includes partner visit"],
            ["2027-04-26", "Zones 1-4 7-Day Student Travelcard", 44.90, "Includes London buses"],
            ["2027-05-03", "Zones 1-5 7-Day Student Travelcard", 53.40, "Includes partner visit"],
            ["2027-05-10", "Zones 1-4 Monthly Student Travelcard", 172.50, "University Underground and buses"],
            ["2027-06-14", "University PAYG library bundle (3 days)", 38.40, "Tube and two buses per day"],
            ["2027-06-21", "University PAYG library bundle (3 days)", 38.40, "Tube and two buses per day"],
            ["2027-06-28", "University PAYG library bundle (3 days)", 38.40, "Tube and two buses per day"],
        ].forEach(([date, name, amount, note]) => add(date, name, "travel", amount, "expense", note));

        addMany([
            "2026-09-21", "2026-10-05", "2026-10-19", "2026-11-02", "2026-11-16", "2026-11-30",
            "2026-12-28", "2027-04-05", "2027-05-17", "2027-05-31", "2027-06-14", "2027-06-28",
            "2027-07-12", "2027-07-26", "2027-08-09", "2027-08-23", "2027-09-06", "2027-09-20",
        ], "Partner travel PAYG", "travel", 15.30, "expense", "Zones 1-5 conservative daily cap");
        addMany([
            "2026-12-14", "2027-01-11", "2027-01-25", "2027-02-08", "2027-02-22", "2027-03-08",
            "2027-03-22", "2027-04-19", "2027-05-03",
        ], "Partner visit covered by Travelcard", "travel", 0, "covered", "No incremental fare");

        add("2026-09-21", "Opening debt repayment", "debt", 530);

        const typeOrder = { income: 0, saving: 1, expense: 2, covered: 3 };
        return events.sort((left, right) => left.date.localeCompare(right.date) || typeOrder[left.type] - typeOrder[right.type]);
    }

    const SCHEDULE = buildSchedule();
    const WEEK_STARTS = rangeEvery(PLAN_START, PLAN_END, 7);

    function weekStartForDate(value) {
        if (!validPlanDate(value)) return value < PLAN_START ? PLAN_START : WEEK_STARTS.at(-1);
        const index = Math.floor(daysBetween(PLAN_START, value) / 7);
        return WEEK_STARTS[Math.max(0, Math.min(WEEK_STARTS.length - 1, index))];
    }

    function initialWeek() {
        return weekStartForDate(isoFromDate(new Date()));
    }

    function defaultState() {
        return {
            version: 1,
            rollover: true,
            lastWeek: initialWeek(),
            allocations: {},
            purchases: [],
            tasks: [],
            completed: {},
            notes: {},
        };
    }

    function sanitiseState(value) {
        const clean = defaultState();
        if (!value || typeof value !== "object") return clean;
        clean.rollover = true;
        clean.lastWeek = validPlanDate(value.lastWeek) ? weekStartForDate(value.lastWeek) : clean.lastWeek;

        if (value.allocations && typeof value.allocations === "object") {
            WEEK_STARTS.forEach((week) => {
                const source = value.allocations[week];
                if (!source || typeof source !== "object") return;
                SPEND_CATEGORIES.forEach(({ id }) => {
                    const amount = Number(source[id]);
                    if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000) return;
                    clean.allocations[week] ||= {};
                    clean.allocations[week][id] = roundMoney(amount);
                });
            });
        }

        if (Array.isArray(value.purchases)) {
            clean.purchases = value.purchases.slice(0, 5000).flatMap((purchase, index) => {
                if (!purchase || !validPlanDate(purchase.date) || !SPEND_CATEGORIES.some(({ id }) => id === purchase.category)) return [];
                const amount = finiteAmount(purchase.amount);
                if (amount <= 0 || amount > 1_000_000) return [];
                return [{
                    id: typeof purchase.id === "string" && purchase.id ? purchase.id.slice(0, 100) : `restored-purchase-${index}`,
                    date: purchase.date,
                    category: purchase.category,
                    name: typeof purchase.name === "string" && purchase.name.trim() ? purchase.name.trim().slice(0, 160) : "Purchase",
                    amount,
                    note: typeof purchase.note === "string" ? purchase.note.slice(0, 240) : "",
                }];
            });
        }

        if (Array.isArray(value.tasks)) {
            clean.tasks = value.tasks.slice(0, 5000).flatMap((task, index) => {
                if (!task || !validPlanDate(task.date) || typeof task.text !== "string" || !task.text.trim()) return [];
                return [{
                    id: typeof task.id === "string" && task.id ? task.id.slice(0, 100) : `restored-task-${index}`,
                    date: task.date,
                    text: task.text.trim().slice(0, 140),
                }];
            });
        }

        if (value.completed && typeof value.completed === "object") {
            Object.entries(value.completed).slice(0, 10000).forEach(([key, done]) => {
                if (done === true && typeof key === "string" && key.length <= 220) clean.completed[key] = true;
            });
        }

        if (value.notes && typeof value.notes === "object") {
            WEEK_STARTS.forEach((week) => {
                if (typeof value.notes[week] === "string") clean.notes[week] = value.notes[week].slice(0, 3000);
            });
        }
        return clean;
    }

    function loadState() {
        try {
            const stored = window.localStorage.getItem(STORAGE_KEY);
            return stored ? sanitiseState(JSON.parse(stored)) : defaultState();
        } catch {
            return defaultState();
        }
    }

    let state = loadState();
    let selectedWeek = state.lastWeek;
    let toastTimer;

    const elements = {
        previousWeek: document.getElementById("previous-week"),
        nextWeek: document.getElementById("next-week"),
        weekNumber: document.getElementById("week-number"),
        weekHeading: document.getElementById("week-heading"),
        weekContext: document.getElementById("week-context"),
        jumpDate: document.getElementById("jump-date"),
        progressLabel: document.getElementById("year-progress-label"),
        progressBar: document.getElementById("year-progress-bar"),
        metricAvailable: document.getElementById("metric-available"),
        metricAvailableNote: document.getElementById("metric-available-note"),
        metricAllocation: document.getElementById("metric-allocation"),
        metricSpent: document.getElementById("metric-spent"),
        metricSpentNote: document.getElementById("metric-spent-note"),
        metricClose: document.getElementById("metric-close"),
        chart: document.getElementById("cash-flow-chart"),
        calendar: document.getElementById("week-calendar"),
        dueCount: document.getElementById("week-due-count"),
        allocations: document.getElementById("allocation-grid"),
        allocationDialog: document.getElementById("allocation-dialog"),
        ledger: document.getElementById("ledger-list"),
        ledgerProgress: document.getElementById("ledger-progress"),
        checklist: document.getElementById("checklist"),
        checkProgressBar: document.getElementById("check-progress-bar"),
        checkProgressLabel: document.getElementById("check-progress-label"),
        quickTaskForm: document.getElementById("quick-task-form"),
        quickTask: document.getElementById("quick-task"),
        quickTaskDate: document.getElementById("quick-task-date"),
        outlookLiquid: document.getElementById("outlook-liquid"),
        annualIncome: document.getElementById("annual-income"),
        annualSavings: document.getElementById("annual-savings"),
        annualSpending: document.getElementById("annual-spending"),
        annualBars: document.getElementById("annual-bars"),
        nextFundingHeading: document.getElementById("next-funding-heading"),
        nextFundingAmount: document.getElementById("next-funding-amount"),
        nextFundingDate: document.getElementById("next-funding-date"),
        purchaseDialog: document.getElementById("purchase-dialog"),
        purchaseForm: document.getElementById("purchase-form"),
        purchaseName: document.getElementById("purchase-name"),
        purchaseAmount: document.getElementById("purchase-amount"),
        purchaseCategory: document.getElementById("purchase-category"),
        purchaseDate: document.getElementById("purchase-date"),
        purchaseNote: document.getElementById("purchase-note"),
        restoreFile: document.getElementById("restore-file"),
        printReport: document.getElementById("print-report"),
        toast: document.getElementById("toast"),
    };

    function saveState() {
        state.lastWeek = selectedWeek;
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch {
            showToast("This browser could not save the latest change");
        }
    }

    function showToast(message) {
        elements.toast.textContent = message;
        elements.toast.classList.add("isVisible");
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => elements.toast.classList.remove("isVisible"), 2400);
    }

    function categoryLabel(id) {
        return CATEGORY_LOOKUP[id]?.label || "Other";
    }

    function eventsForWeek(week) {
        const end = addDays(week, 6) < PLAN_END ? addDays(week, 6) : PLAN_END;
        return SCHEDULE.filter((event) => event.date >= week && event.date <= end);
    }

    function purchasesForWeek(week) {
        const end = addDays(week, 6) < PLAN_END ? addDays(week, 6) : PLAN_END;
        return state.purchases.filter((purchase) => purchase.date >= week && purchase.date <= end);
    }

    function customTasksForWeek(week) {
        const end = addDays(week, 6) < PLAN_END ? addDays(week, 6) : PLAN_END;
        return state.tasks.filter((task) => task.date >= week && task.date <= end);
    }

    function completionKey(kind, id) {
        return `${kind}:${id}`;
    }

    function isComplete(kind, id) {
        return state.completed[completionKey(kind, id)] === true;
    }

    function setComplete(kind, id, done) {
        const key = completionKey(kind, id);
        if (done) state.completed[key] = true;
        else delete state.completed[key];
    }

    function pdfAllocation(week, category) {
        return roundMoney(eventsForWeek(week)
            .filter((event) => event.type === "expense" && event.category === category)
            .reduce((sum, event) => sum + event.amount, 0));
    }

    function hasAllocationOverride(week, category) {
        return Number.isFinite(Number(state.allocations[week]?.[category]));
    }

    function baseAllocation(week, category) {
        return hasAllocationOverride(week, category)
            ? roundMoney(Number(state.allocations[week][category]))
            : pdfAllocation(week, category);
    }

    function actualSpend(week, category) {
        const plannedPaid = eventsForWeek(week)
            .filter((event) => event.type === "expense" && event.category === category && isComplete("event", event.id))
            .reduce((sum, event) => sum + event.amount, 0);
        const purchases = purchasesForWeek(week)
            .filter((purchase) => purchase.category === category)
            .reduce((sum, purchase) => sum + purchase.amount, 0);
        return roundMoney(plannedPaid + purchases);
    }

    function carryInto(category, weekIndex) {
        if (weekIndex <= 0) return 0;
        let carry = 0;
        for (let index = 0; index < weekIndex; index += 1) {
            const week = WEEK_STARTS[index];
            carry += baseAllocation(week, category) - actualSpend(week, category);
        }
        return roundMoney(carry);
    }

    function statsForWeek(week) {
        const index = WEEK_STARTS.indexOf(week);
        const categories = SPEND_CATEGORIES.map((category) => {
            const allocation = baseAllocation(week, category.id);
            const carry = carryInto(category.id, index);
            const spent = actualSpend(week, category.id);
            return {
                ...category,
                pdf: pdfAllocation(week, category.id),
                allocation,
                carry,
                spent,
                balance: roundMoney(allocation + carry - spent),
                adjusted: hasAllocationOverride(week, category.id),
            };
        });
        return {
            categories,
            allocation: roundMoney(categories.reduce((sum, category) => sum + category.allocation, 0)),
            spent: roundMoney(categories.reduce((sum, category) => sum + category.spent, 0)),
            available: roundMoney(categories.reduce((sum, category) => sum + category.balance, 0)),
        };
    }

    function annualFigures() {
        const income = roundMoney(SCHEDULE.filter((event) => event.type === "income").reduce((sum, event) => sum + event.amount, 0));
        const savings = roundMoney(SCHEDULE.filter((event) => event.type === "saving").reduce((sum, event) => sum + event.amount, 0));
        const categories = SPEND_CATEGORIES.map((category) => {
            const pdf = roundMoney(SCHEDULE.filter((event) => event.type === "expense" && event.category === category.id).reduce((sum, event) => sum + event.amount, 0));
            const working = roundMoney(WEEK_STARTS.reduce((sum, week) => sum + Math.max(baseAllocation(week, category.id), actualSpend(week, category.id)), 0));
            const actual = roundMoney(WEEK_STARTS.reduce((sum, week) => sum + actualSpend(week, category.id), 0));
            return { ...category, pdf, working, actual };
        });
        const spending = roundMoney(categories.reduce((sum, category) => sum + category.working, 0));
        return { income, savings, spending, liquid: roundMoney(income - savings - spending), categories };
    }

    function projectedCloseAfter(weekIndex) {
        const end = WEEK_STARTS[weekIndex] === WEEK_STARTS.at(-1) ? PLAN_END : addDays(WEEK_STARTS[weekIndex], 6);
        const income = SCHEDULE.filter((event) => event.type === "income" && event.date <= end).reduce((sum, event) => sum + event.amount, 0);
        const savings = SCHEDULE.filter((event) => event.type === "saving" && event.date <= end).reduce((sum, event) => sum + event.amount, 0);
        let spending = 0;
        SPEND_CATEGORIES.forEach(({ id }) => {
            for (let index = 0; index <= weekIndex; index += 1) {
                spending += Math.max(baseAllocation(WEEK_STARTS[index], id), actualSpend(WEEK_STARTS[index], id));
            }
        });
        return roundMoney(income - savings - spending);
    }

    function checklistItems(week) {
        const confirmations = [{
            id: "reading-week-1-trip-confirmation",
            kind: "confirmation",
            date: "2026-11-02",
            text: "Confirm the Reading Week 1 trip date and payment",
            detail: "£300 reserved · provisionally placed on 2 Nov 2026",
        }];
        const custom = customTasksForWeek(week).map((task) => ({ ...task, kind: "task", detail: shortDate.format(dateFromIso(task.date)) }));
        return [...confirmations, ...custom];
    }

    function weekContext(week) {
        if (week === "2026-09-21") return "Opening week before teaching";
        if (week >= "2026-09-28" && week <= "2026-10-26") return "Semester 1 teaching · five university visits planned";
        if (week === "2026-11-02") return "First-term reading week and trip reserve";
        if (week >= "2026-11-09" && week <= "2026-12-14") return "Semester 1 teaching and revision";
        if (week >= "2026-12-21" && week <= "2026-12-28") return "Christmas break";
        if (week === "2027-01-04" || week === "2027-01-11" || week === "2027-01-18") return "January assessment period";
        if (week >= "2027-01-25" && week <= "2027-02-22") return "Semester 2 teaching · five university visits planned";
        if (week === "2027-03-01") return "Semester 2 reading week";
        if (week >= "2027-03-08" && week <= "2027-03-22") return "Semester 2 teaching · five university visits planned";
        if (week >= "2027-03-29" && week <= "2027-04-12") return "Easter break and pre-funding";
        if (week >= "2027-04-19" && week <= "2027-05-03") return "Teaching and revision";
        if (week >= "2027-05-10" && week <= "2027-05-31") return "Main assessment period · six visits planned";
        if (week >= "2027-06-07" && week <= "2027-06-28") return "Summer library use · three visits planned";
        return "Summer fixed-cost period · university food and travel stopped";
    }

    function formatWeekRange(week) {
        const start = dateFromIso(week);
        const endIso = addDays(week, 6) < PLAN_END ? addDays(week, 6) : PLAN_END;
        const end = dateFromIso(endIso);
        if (week === endIso) return fullDate.format(start);
        const sameMonth = start.getUTCMonth() === end.getUTCMonth() && start.getUTCFullYear() === end.getUTCFullYear();
        if (sameMonth) return `${start.getUTCDate()}-${fullDate.format(end)}`;
        const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
        if (sameYear) return `${shortDate.format(start)}-${fullDate.format(end)}`;
        return `${fullDate.format(start)}-${fullDate.format(end)}`;
    }

    function formatSigned(value) {
        if (value === 0) return money.format(0);
        return `${value > 0 ? "+" : "-"}${money.format(Math.abs(value))}`;
    }

    function renderCalendar() {
        const customTasks = customTasksForWeek(selectedWeek);
        const purchases = purchasesForWeek(selectedWeek);
        const today = isoFromDate(new Date());
        let entryCount = 0;
        elements.calendar.innerHTML = Array.from({ length: 7 }, (_, dayIndex) => {
            const date = addDays(selectedWeek, dayIndex);
            const outside = date > PLAN_END;
            const entries = [
                ...SCHEDULE.filter((event) => event.date === date).map((event) => ({
                    text: event.name,
                    meta: event.type === "covered" ? "Covered" : money.format(event.amount),
                    income: event.type === "income",
                    done: isComplete("event", event.id),
                })),
                ...purchases.filter((purchase) => purchase.date === date).map((purchase) => ({ text: purchase.name, meta: `${money.format(purchase.amount)} · logged`, done: true })),
                ...customTasks.filter((task) => task.date === date).map((task) => ({ text: task.text, meta: "Reminder", task: true, done: isComplete("task", task.id) })),
            ];
            entryCount += entries.length;
            return `
                <article class="calendarDay${date === today ? " isToday" : ""}${outside ? " isOutside" : ""}">
                    <div class="calendarDayHeader">
                        <span class="calendarDayName">${weekday.format(dateFromIso(date))}</span>
                        <span class="calendarDayNumber">${dateFromIso(date).getUTCDate()}</span>
                        <span class="calendarDayCount">${entries.length ? `${entries.length} ${entries.length === 1 ? "item" : "items"}` : "clear"}</span>
                    </div>
                    <div class="calendarEntries">
                        ${entries.length ? entries.map((entry) => `<span class="calendarEntry${entry.income ? " isIncome" : ""}${entry.task ? " isTask" : ""}${entry.done ? " isDone" : ""}"><strong>${escapeHtml(entry.text)}</strong><small>${escapeHtml(entry.meta)}</small></span>`).join("") : `<span class="calendarEmpty">Nothing scheduled</span>`}
                    </div>
                </article>
            `;
        }).join("");
        elements.dueCount.textContent = `${entryCount} ${entryCount === 1 ? "thing" : "things"} due`;
    }

    function renderAllocations(weekStats) {
        elements.allocations.innerHTML = weekStats.categories.map((category) => `
            <article class="allocationCard${category.balance < 0 ? " isOver" : ""}">
                <div class="allocationTop">
                    <div class="categoryName">
                        <span class="categoryCode">${category.code}</span>
                        <span><strong>${escapeHtml(category.label)}</strong><small>${category.adjusted ? `PDF baseline ${money.format(category.pdf)}` : escapeHtml(category.description)}</small></span>
                    </div>
                    <div class="allocationInput">
                        <label for="allocation-${category.id}">This week</label>
                        <span class="currencyField"><span aria-hidden="true">£</span><input id="allocation-${category.id}" data-allocation-category="${category.id}" type="number" min="0" max="1000000" step="0.01" value="${category.allocation.toFixed(2)}" aria-label="${escapeHtml(category.label)} allocation"></span>
                    </div>
                </div>
                <div class="allocationStats">
                    <div><span>Carry-in</span><strong>${formatSigned(category.carry)}</strong></div>
                    <div><span>Paid / logged</span><strong>${money.format(category.spent)}</strong></div>
                    <div><span>Balance</span><strong class="${category.balance < 0 ? "negative" : "positive"}">${formatSigned(category.balance)}</strong></div>
                </div>
            </article>
        `).join("");
    }

    function renderLedger() {
        const events = eventsForWeek(selectedWeek);
        const purchases = purchasesForWeek(selectedWeek).sort((left, right) => left.date.localeCompare(right.date));
        const paidPlanned = events.filter((event) => isComplete("event", event.id)).length;
        elements.ledgerProgress.textContent = `${paidPlanned} / ${events.length} planned complete`;

        const eventRows = events.map((event) => {
            const done = isComplete("event", event.id);
            const isIncome = event.type === "income";
            const label = event.type === "saving" ? "Savings" : event.type === "covered" ? "Covered" : categoryLabel(event.category);
            return `
                <article class="ledgerRow${done ? " isDone" : ""}">
                    <label class="ledgerCheck"><input data-event-check="${event.id}" type="checkbox" ${done ? "checked" : ""} aria-label="Mark ${escapeHtml(event.name)} complete"></label>
                    <time class="ledgerDate" datetime="${event.date}">${shortDate.format(dateFromIso(event.date))}</time>
                    <div class="ledgerCopy"><strong class="ledgerName">${escapeHtml(event.name)}</strong>${event.note ? `<small class="ledgerNote">${escapeHtml(event.note)}</small>` : ""}</div>
                    <span class="categoryPill${isIncome ? " isIncome" : ""}">${escapeHtml(label)}</span>
                    <strong class="ledgerAmount${isIncome ? " isIncome" : ""}">${event.type === "covered" ? "£0.00" : `${isIncome ? "+" : event.type === "saving" ? "-" : ""}${money.format(event.amount)}`}</strong>
                </article>
            `;
        }).join("");

        const purchaseRows = purchases.map((purchase) => `
            <article class="ledgerRow isDone">
                <span class="ledgerCheck" aria-hidden="true">•</span>
                <time class="ledgerDate" datetime="${purchase.date}">${shortDate.format(dateFromIso(purchase.date))}</time>
                <div class="ledgerCopy"><strong class="ledgerName">${escapeHtml(purchase.name)}</strong><small class="ledgerNote">${escapeHtml(purchase.note || "Manually logged purchase")}</small></div>
                <span class="categoryPill">${escapeHtml(categoryLabel(purchase.category))}</span>
                <strong class="ledgerAmount">${money.format(purchase.amount)}</strong>
                <button class="deleteButton" data-delete-purchase="${escapeHtml(purchase.id)}" type="button" aria-label="Delete ${escapeHtml(purchase.name)}">&times;</button>
            </article>
        `).join("");

        elements.ledger.innerHTML = eventRows + purchaseRows || `<div class="emptyMessage">A quiet week. Record a purchase or add a task whenever something changes.</div>`;
    }

    function renderChecklist() {
        const items = checklistItems(selectedWeek);
        const complete = items.filter((item) => isComplete(item.kind, item.id)).length;
        const percent = items.length ? (complete / items.length) * 100 : 0;
        elements.checkProgressBar.style.width = `${percent}%`;
        elements.checkProgressLabel.textContent = `${complete} of ${items.length} complete`;
        elements.checklist.innerHTML = items.map((item) => {
            const done = isComplete(item.kind, item.id);
            return `
                <label class="checkRow${done ? " isDone" : ""}">
                    <input data-check-kind="${item.kind}" data-check-id="${escapeHtml(item.id)}" type="checkbox" ${done ? "checked" : ""}>
                    <span><strong>${escapeHtml(item.text)}</strong><small>${escapeHtml(item.detail)}</small></span>
                    ${item.kind === "task" ? `<button class="checkRemove" data-delete-task="${escapeHtml(item.id)}" type="button" aria-label="Delete task">&times;</button>` : ""}
                </label>
            `;
        }).join("");
    }

    function renderAnnualOutlook(figures) {
        elements.outlookLiquid.textContent = money.format(figures.liquid);
        elements.outlookLiquid.classList.toggle("isNegative", figures.liquid < 0);
        elements.annualIncome.textContent = money.format(figures.income);
        elements.annualSavings.textContent = money.format(figures.savings);
        elements.annualSpending.textContent = money.format(figures.spending);
        elements.annualBars.innerHTML = figures.categories.map((category) => {
            const percent = category.working > 0 ? (category.actual / category.working) * 100 : category.actual > 0 ? 100 : 0;
            return `
                <div class="annualBar${category.actual > category.working ? " isOver" : ""}">
                    <div class="annualBarHeader"><span>${escapeHtml(category.label)}</span><span>${money.format(category.actual)} / ${money.format(category.working)}</span></div>
                    <div class="annualBarTrack"><span class="annualBarFill" style="width:${Math.min(100, percent)}%"></span></div>
                </div>
            `;
        }).join("");
    }

    function renderNextFunding() {
        const next = SCHEDULE.find((event) => event.type === "income" && event.major && event.date >= selectedWeek);
        if (!next) {
            elements.nextFundingHeading.textContent = "All major funding received";
            elements.nextFundingAmount.textContent = "Year complete";
            elements.nextFundingDate.textContent = "No later loan or bursary is scheduled";
            return;
        }
        elements.nextFundingHeading.textContent = next.name;
        elements.nextFundingAmount.textContent = money.format(next.amount);
        elements.nextFundingDate.textContent = fullDate.format(dateFromIso(next.date));
    }

    function compactMoney(value) {
        const absolute = Math.abs(value);
        const figure = absolute >= 1000 ? `£${(absolute / 1000).toFixed(absolute >= 10_000 ? 0 : 1)}k` : `£${Math.round(absolute)}`;
        return value < 0 ? `-${figure}` : figure;
    }

    function renderCashFlowChart() {
        const values = WEEK_STARTS.map((week, index) => ({ week, balance: projectedCloseAfter(index) }));
        const width = 720;
        const height = 230;
        const left = 52;
        const right = 12;
        const top = 14;
        const bottom = 34;
        const plotWidth = width - left - right;
        const plotHeight = height - top - bottom;
        let minimum = Math.min(0, ...values.map((entry) => entry.balance));
        let maximum = Math.max(0, ...values.map((entry) => entry.balance));
        const padding = Math.max(100, (maximum - minimum) * 0.08);
        minimum -= padding;
        maximum += padding;
        const xAt = (index) => left + (index / (values.length - 1)) * plotWidth;
        const yAt = (value) => top + ((maximum - value) / (maximum - minimum)) * plotHeight;
        const points = values.map((entry, index) => `${xAt(index).toFixed(2)},${yAt(entry.balance).toFixed(2)}`).join(" ");
        const area = `${left},${top + plotHeight} ${points} ${left + plotWidth},${top + plotHeight}`;
        const gridValues = [minimum, (minimum + maximum) / 2, maximum];
        const tickIndexes = [0, 16, 30, 42, values.length - 1];
        const selectedIndex = WEEK_STARTS.indexOf(selectedWeek);
        const selected = values[selectedIndex];

        elements.chart.innerHTML = `
            ${gridValues.map((value) => {
                const y = yAt(value);
                return `<line class="chartGrid" x1="${left}" x2="${left + plotWidth}" y1="${y}" y2="${y}"></line><text x="${left - 8}" y="${y + 4}" text-anchor="end">${compactMoney(value)}</text>`;
            }).join("")}
            <line class="chartZero" x1="${left}" x2="${left + plotWidth}" y1="${yAt(0)}" y2="${yAt(0)}"></line>
            <polygon class="chartArea" points="${area}"></polygon>
            <polyline class="chartLine" points="${points}"></polyline>
            <line class="chartSelectedLine" x1="${xAt(selectedIndex)}" x2="${xAt(selectedIndex)}" y1="${top}" y2="${top + plotHeight}"></line>
            <circle class="chartPoint chartSelected" cx="${xAt(selectedIndex)}" cy="${yAt(selected.balance)}" r="5"><title>${escapeHtml(formatWeekRange(selected.week))}: ${money.format(selected.balance)}</title></circle>
            ${tickIndexes.map((index) => `<text x="${xAt(index)}" y="${height - 9}" text-anchor="middle">${monthLabel.format(dateFromIso(values[index].week))}</text>`).join("")}
        `;
    }

    function renderFinancialSummary() {
        const weekIndex = WEEK_STARTS.indexOf(selectedWeek);
        const weekStats = statsForWeek(selectedWeek);
        const figures = annualFigures();
        const projectedClose = projectedCloseAfter(weekIndex);
        const completedSpendEntries = eventsForWeek(selectedWeek).filter((event) => event.type === "expense" && isComplete("event", event.id)).length + purchasesForWeek(selectedWeek).length;

        elements.metricAvailable.textContent = money.format(weekStats.available);
        elements.metricAvailable.closest(".metricCard").classList.toggle("isNegative", weekStats.available < 0);
        elements.metricAvailableNote.textContent = "Includes every earlier balance";
        elements.metricAllocation.textContent = money.format(weekStats.allocation);
        elements.metricSpent.textContent = money.format(weekStats.spent);
        elements.metricSpentNote.textContent = `${completedSpendEntries} ${completedSpendEntries === 1 ? "entry" : "entries"} paid or logged`;
        elements.metricClose.textContent = money.format(projectedClose);
        elements.metricClose.closest(".metricCard").classList.toggle("isNegative", projectedClose < 0);
        renderAnnualOutlook(figures);
        renderCashFlowChart();
        return { weekStats, figures };
    }

    function render() {
        const weekIndex = WEEK_STARTS.indexOf(selectedWeek);

        elements.weekNumber.textContent = `Week ${String(weekIndex + 1).padStart(2, "0")} / ${WEEK_STARTS.length}`;
        elements.weekHeading.textContent = formatWeekRange(selectedWeek);
        elements.weekContext.textContent = weekContext(selectedWeek);
        elements.jumpDate.value = selectedWeek;
        elements.previousWeek.disabled = weekIndex === 0;
        elements.nextWeek.disabled = weekIndex === WEEK_STARTS.length - 1;
        const progress = (weekIndex / (WEEK_STARTS.length - 1)) * 100;
        elements.progressLabel.textContent = `${Math.round(progress)}% through plan`;
        elements.progressBar.style.width = `${progress}%`;

        const { weekStats } = renderFinancialSummary();

        renderCalendar();
        renderAllocations(weekStats);
        renderLedger();
        renderChecklist();
        renderNextFunding();
        elements.quickTaskDate.value = selectedWeek;
    }

    function moveWeek(direction) {
        const current = WEEK_STARTS.indexOf(selectedWeek);
        const next = Math.max(0, Math.min(WEEK_STARTS.length - 1, current + direction));
        if (next === current) return;
        selectedWeek = WEEK_STARTS[next];
        saveState();
        render();
        document.getElementById("week-workspace").scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function uniqueId(prefix) {
        if (window.crypto?.randomUUID) return `${prefix}-${window.crypto.randomUUID()}`;
        return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function openPurchaseDialog() {
        elements.purchaseForm.reset();
        elements.purchaseDate.value = selectedWeek;
        elements.purchaseCategory.value = "food";
        elements.purchaseDialog.showModal();
        window.setTimeout(() => elements.purchaseName.focus(), 0);
    }

    function addPurchase() {
        const name = elements.purchaseName.value.trim();
        const amount = finiteAmount(elements.purchaseAmount.value);
        const category = elements.purchaseCategory.value;
        const date = elements.purchaseDate.value;
        if (!name || amount <= 0 || !validPlanDate(date) || !SPEND_CATEGORIES.some((entry) => entry.id === category)) return;
        state.purchases.push({
            id: uniqueId("purchase"),
            name: name.slice(0, 160),
            amount,
            category,
            date,
            note: elements.purchaseNote.value.trim().slice(0, 240),
        });
        selectedWeek = weekStartForDate(date);
        saveState();
        elements.purchaseDialog.close();
        render();
        showToast("Purchase added and totals updated");
    }

    function exportPlan() {
        const payload = {
            app: "Budget Studio 26-27",
            plan: "KCL University Budget 2026-27",
            exportedAt: new Date().toISOString(),
            state,
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `budget-studio-26-27-backup-${isoFromDate(new Date())}.json`;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 0);
        showToast("Backup downloaded");
    }

    async function restorePlan(file) {
        try {
            const parsed = JSON.parse(await file.text());
            const source = parsed?.state || parsed;
            if (!source || typeof source !== "object") throw new Error("Invalid backup");
            state = sanitiseState(source);
            selectedWeek = state.lastWeek;
            saveState();
            render();
            showToast("Backup restored");
        } catch {
            showToast("That file is not a valid Budget Studio backup");
        } finally {
            elements.restoreFile.value = "";
        }
    }

    function buildPrintReport() {
        const stats = statsForWeek(selectedWeek);
        const figures = annualFigures();
        const activity = [
            ...eventsForWeek(selectedWeek).map((event) => ({
                date: event.date,
                name: event.name,
                section: event.type === "saving" ? "Savings" : event.type === "covered" ? "Covered" : categoryLabel(event.category),
                amount: event.type === "covered" ? 0 : event.amount,
                status: isComplete("event", event.id) ? "Complete" : "Planned",
            })),
            ...purchasesForWeek(selectedWeek).map((purchase) => ({ ...purchase, section: categoryLabel(purchase.category), status: "Logged" })),
        ].sort((left, right) => left.date.localeCompare(right.date));
        const checks = checklistItems(selectedWeek);
        elements.printReport.innerHTML = `
            <header class="printReportHeader">
                <div><p class="printReportKicker">Budget Studio / 2026-27</p><h1>${escapeHtml(formatWeekRange(selectedWeek))}</h1></div>
                <p class="printReportWeek">Week ${WEEK_STARTS.indexOf(selectedWeek) + 1} of ${WEEK_STARTS.length}<br>${escapeHtml(weekContext(selectedWeek))}</p>
            </header>
            <section class="printSummary">
                <div><span>Available</span><strong>${money.format(stats.available)}</strong></div>
                <div><span>Allocation</span><strong>${money.format(stats.allocation)}</strong></div>
                <div><span>Paid / logged</span><strong>${money.format(stats.spent)}</strong></div>
                <div><span>Annual outlook</span><strong>${money.format(figures.liquid)}</strong></div>
            </section>
            <section class="printSection"><h2>Weekly limits</h2><table><thead><tr><th>Section</th><th class="numeric">Allocation</th><th class="numeric">Carry-in</th><th class="numeric">Paid / logged</th><th class="numeric">Balance</th></tr></thead><tbody>${stats.categories.map((category) => `<tr><td>${escapeHtml(category.label)}</td><td class="numeric">${money.format(category.allocation)}</td><td class="numeric">${formatSigned(category.carry)}</td><td class="numeric">${money.format(category.spent)}</td><td class="numeric">${formatSigned(category.balance)}</td></tr>`).join("")}</tbody></table></section>
            <section class="printSection"><h2>Activity</h2>${activity.length ? `<table><thead><tr><th>Date</th><th>Item</th><th>Section</th><th>Status</th><th class="numeric">Amount</th></tr></thead><tbody>${activity.map((item) => `<tr><td>${shortDate.format(dateFromIso(item.date))}</td><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.section)}</td><td>${escapeHtml(item.status)}</td><td class="numeric">${money.format(item.amount)}</td></tr>`).join("")}</tbody></table>` : "<p>No activity this week.</p>"}</section>
            <section class="printSection"><h2>Checklist</h2><ul class="printChecklist">${checks.map((item) => `<li>${isComplete(item.kind, item.id) ? "☑" : "☐"} ${escapeHtml(item.text)}</li>`).join("")}</ul></section>
            <footer class="printFooter"><span>Based on KCL University Budget 2026-27</span><span>Generated ${fullDate.format(new Date())}</span></footer>
        `;
    }

    elements.purchaseCategory.innerHTML = SPEND_CATEGORIES.map((category) => `<option value="${category.id}">${escapeHtml(category.label)}</option>`).join("");

    elements.previousWeek.addEventListener("click", () => moveWeek(-1));
    elements.nextWeek.addEventListener("click", () => moveWeek(1));
    elements.jumpDate.addEventListener("change", () => {
        if (!validPlanDate(elements.jumpDate.value)) return;
        selectedWeek = weekStartForDate(elements.jumpDate.value);
        saveState();
        render();
    });

    function updateAllocation(category, rawValue) {
        const amount = Math.max(0, finiteAmount(rawValue));
        state.allocations[selectedWeek] ||= {};
        const pdf = pdfAllocation(selectedWeek, category);
        if (amount === pdf) {
            delete state.allocations[selectedWeek][category];
            if (!Object.keys(state.allocations[selectedWeek]).length) delete state.allocations[selectedWeek];
        } else {
            state.allocations[selectedWeek][category] = amount;
        }
    }

    elements.allocations.addEventListener("input", (event) => {
        const category = event.target.dataset.allocationCategory;
        if (!category || !SPEND_CATEGORIES.some((entry) => entry.id === category)) return;
        updateAllocation(category, event.target.value);
        saveState();
        renderFinancialSummary();
    });

    elements.allocations.addEventListener("change", (event) => {
        const category = event.target.dataset.allocationCategory;
        if (!category || !SPEND_CATEGORIES.some((entry) => entry.id === category)) return;
        updateAllocation(category, event.target.value);
        saveState();
        render();
        showToast("Allocation updated");
    });

    elements.ledger.addEventListener("change", (event) => {
        const id = event.target.dataset.eventCheck;
        if (!id) return;
        setComplete("event", id, event.target.checked);
        saveState();
        render();
    });

    elements.ledger.addEventListener("click", (event) => {
        const button = event.target.closest("[data-delete-purchase]");
        if (!button) return;
        const purchase = state.purchases.find((entry) => entry.id === button.dataset.deletePurchase);
        if (!purchase || !window.confirm(`Delete “${purchase.name}”?`)) return;
        state.purchases = state.purchases.filter((entry) => entry.id !== purchase.id);
        saveState();
        render();
        showToast("Purchase removed");
    });

    elements.checklist.addEventListener("change", (event) => {
        const kind = event.target.dataset.checkKind;
        const id = event.target.dataset.checkId;
        if (!kind || !id) return;
        setComplete(kind, id, event.target.checked);
        saveState();
        render();
    });

    elements.checklist.addEventListener("click", (event) => {
        const button = event.target.closest("[data-delete-task]");
        if (!button) return;
        event.preventDefault();
        const id = button.dataset.deleteTask;
        state.tasks = state.tasks.filter((task) => task.id !== id);
        delete state.completed[completionKey("task", id)];
        saveState();
        render();
    });

    elements.quickTaskForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const text = elements.quickTask.value.trim();
        const date = validPlanDate(elements.quickTaskDate.value) ? elements.quickTaskDate.value : selectedWeek;
        if (!text) return;
        state.tasks.push({ id: uniqueId("task"), date, text: text.slice(0, 140) });
        elements.quickTask.value = "";
        selectedWeek = weekStartForDate(date);
        saveState();
        render();
    });

    document.getElementById("open-allocations").addEventListener("click", () => {
        document.getElementById("allocation-dialog-title").textContent = `Weekly limits · ${formatWeekRange(selectedWeek)}`;
        elements.allocationDialog.showModal();
    });
    document.getElementById("close-allocations").addEventListener("click", () => elements.allocationDialog.close());

    document.getElementById("open-purchase").addEventListener("click", openPurchaseDialog);
    document.getElementById("close-purchase").addEventListener("click", () => elements.purchaseDialog.close());
    document.getElementById("cancel-purchase").addEventListener("click", () => elements.purchaseDialog.close());
    elements.purchaseForm.addEventListener("submit", (event) => {
        event.preventDefault();
        addPurchase();
    });

    document.getElementById("export-plan").addEventListener("click", exportPlan);
    document.getElementById("restore-plan").addEventListener("click", () => elements.restoreFile.click());
    elements.restoreFile.addEventListener("change", () => {
        if (elements.restoreFile.files?.[0]) restorePlan(elements.restoreFile.files[0]);
    });

    document.getElementById("print-plan").addEventListener("click", () => {
        buildPrintReport();
        window.print();
    });
    window.addEventListener("beforeprint", buildPrintReport);

    document.getElementById("reset-data").addEventListener("click", () => {
        if (!window.confirm("Restore the original PDF plan? This removes all weekly limit adjustments, purchases, reminders and ticks saved in this browser.")) return;
        state = defaultState();
        selectedWeek = PLAN_START;
        saveState();
        render();
        showToast("Original PDF plan restored");
    });

    window.addEventListener("pagehide", () => saveState());
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") saveState();
    });

    const sourceTotals = {
        income: roundMoney(SCHEDULE.filter((event) => event.type === "income").reduce((sum, event) => sum + event.amount, 0)),
        savings: roundMoney(SCHEDULE.filter((event) => event.type === "saving").reduce((sum, event) => sum + event.amount, 0)),
        spending: roundMoney(SCHEDULE.filter((event) => event.type === "expense").reduce((sum, event) => sum + event.amount, 0)),
    };
    console.assert(sourceTotals.income === 11238, "Funding schedule total is out of balance", sourceTotals);
    console.assert(sourceTotals.savings === 1832.72, "Savings schedule total is out of balance", sourceTotals);
    console.assert(sourceTotals.spending === 8371.70, "Spending schedule total is out of balance", sourceTotals);

    render();
})();
