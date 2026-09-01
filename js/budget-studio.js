(() => {
    "use strict";

    const STORAGE_KEY = "sams-budget-studio-v2";
    const LEGACY_STORAGE_KEY = "sams-budget-studio-v1";
    const VALID_FREQUENCIES = new Set(["once", "weekly", "biweekly", "monthly", "allocation"]);

    const money = new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
    });

    const monthLabel = new Intl.DateTimeFormat("en-GB", {
        month: "short",
        year: "2-digit",
        timeZone: "UTC",
    });

    const STANDARD_CATEGORIES = [
        { id: "education", label: "Education & funding", kind: "income" },
        { id: "subscriptions", label: "Subscriptions", kind: "expense" },
        { id: "bills", label: "Bills", kind: "expense" },
        { id: "food", label: "Food", kind: "expense" },
        { id: "entertainment", label: "Entertainment", kind: "expense" },
        { id: "pets", label: "Pets", kind: "expense" },
        { id: "travel", label: "Travel", kind: "expense" },
        { id: "debt", label: "Debt", kind: "expense" },
    ];

    const frequencyLabels = {
        once: "One-off",
        weekly: "Every week",
        biweekly: "Every 2 weeks",
        monthly: "Every month",
        allocation: "Period total",
    };

    const DEFAULT_BUDGET = {
        ownerName: "",
        startDate: "2026-09-21",
        endDate: "2027-09-20",
        categories: STANDARD_CATEGORIES.filter((category) => ["education", "subscriptions", "bills", "food", "travel"].includes(category.id)),
        items: [
            { id: "sample-finance", name: "Student Finance instalment", kind: "income", category: "education", amount: 3008.94, frequency: "once", start: "2026-09-21", savingsRate: 20 },
            { id: "sample-bursary", name: "Bursary payment", kind: "income", category: "education", amount: 800, frequency: "once", start: "2027-01-11" },
            { id: "sample-subscription", name: "Music subscription", kind: "expense", category: "subscriptions", amount: 5, frequency: "monthly", start: "2026-10-09", end: "2027-09-09" },
            { id: "sample-bill", name: "Monthly bill", kind: "expense", category: "bills", amount: 32.99, frequency: "monthly", start: "2026-09-28", end: "2027-08-28" },
            { id: "sample-food", name: "Campus & library food", kind: "expense", category: "food", amount: 1080, frequency: "allocation", start: "2026-09-28", end: "2027-06-30" },
            { id: "sample-travel", name: "Student Travelcard", kind: "expense", category: "travel", amount: 172.5, frequency: "once", start: "2026-09-28" },
        ],
    };

    let categories = [];
    let budget = readSavedBudget();
    categories = budget.categories;
    let selectedCategory = categories[0].id;

    const elements = {
        owner: document.getElementById("budget-owner"),
        start: document.getElementById("budget-start"),
        end: document.getElementById("budget-end"),
        categoryNav: document.getElementById("category-nav"),
        sectionKicker: document.getElementById("section-kicker"),
        sectionTitle: document.getElementById("section-title"),
        items: document.getElementById("budget-items"),
        liquid: document.getElementById("result-liquid"),
        income: document.getElementById("result-income"),
        spending: document.getElementById("result-spending"),
        savings: document.getElementById("result-savings"),
        chart: document.getElementById("cash-flow-chart"),
        status: document.getElementById("budget-status"),
        spendingBars: document.getElementById("spending-bars"),
        dialog: document.getElementById("add-item-dialog"),
        addForm: document.getElementById("add-item-form"),
        addTitle: document.getElementById("add-item-title"),
        newName: document.getElementById("new-item-name"),
        newAmount: document.getElementById("new-item-amount"),
        newFrequency: document.getElementById("new-item-frequency"),
        newStart: document.getElementById("new-item-start"),
        newEnd: document.getElementById("new-item-end"),
        newEndField: document.getElementById("new-item-end-field"),
        newStartLabel: document.getElementById("new-item-start-label"),
        addSectionButton: document.getElementById("open-add-section"),
        removeSection: document.getElementById("remove-section"),
        sectionDialog: document.getElementById("add-section-dialog"),
        sectionForm: document.getElementById("add-section-form"),
        sectionName: document.getElementById("new-section-name"),
        sectionKind: document.getElementById("new-section-kind"),
        printReport: document.getElementById("print-report"),
    };

    function cloneDefaultBudget() {
        return JSON.parse(JSON.stringify(DEFAULT_BUDGET));
    }

    function readSavedBudget() {
        try {
            const stored = window.localStorage.getItem(STORAGE_KEY);
            if (stored) return sanitiseBudget(JSON.parse(stored));
            const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
            if (!legacy) return cloneDefaultBudget();
            const migrated = sanitiseBudget(JSON.parse(legacy));
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
            return migrated;
        } catch {
            return cloneDefaultBudget();
        }
    }

    function sanitiseBudget(value) {
        if (!value || typeof value !== "object" || !Array.isArray(value.items)) {
            throw new Error("Invalid budget");
        }

        const startDate = validDate(value.startDate) ? value.startDate : DEFAULT_BUDGET.startDate;
        const endDate = validDate(value.endDate) ? value.endDate : DEFAULT_BUDGET.endDate;
        const savedCategories = sanitiseCategories(value.categories);
        const items = value.items.filter((item) => !item?.scenario).map((item, index) => {
            if (!item || typeof item !== "object") throw new Error("Invalid item");
            const meta = savedCategories.find((category) => category.id === item.category)
                || savedCategories.find((category) => category.kind === item.kind)
                || savedCategories[0];
            return {
                id: typeof item.id === "string" && item.id ? item.id : `restored-${index}-${Date.now()}`,
                name: typeof item.name === "string" ? item.name.slice(0, 160) : "Untitled item",
                kind: meta.kind,
                category: meta.id,
                amount: Math.max(0, finiteNumber(item.amount)),
                frequency: VALID_FREQUENCIES.has(item.frequency) ? item.frequency : "once",
                start: validDate(item.start) ? item.start : startDate,
                ...(validDate(item.end) ? { end: item.end } : {}),
                ...(Number.isFinite(Number(item.savingsRate))
                    ? { savingsRate: clamp(Number(item.savingsRate), 0, 100) }
                    : {}),
                ...(typeof item.note === "string" ? { note: item.note.slice(0, 240) } : {}),
            };
        });

        return {
            ownerName: typeof value.ownerName === "string" ? value.ownerName.slice(0, 100) : DEFAULT_BUDGET.ownerName,
            startDate,
            endDate,
            categories: savedCategories,
            items,
        };
    }

    function sanitiseCategories(value) {
        const source = Array.isArray(value) && value.length ? value : STANDARD_CATEGORIES;
        const seen = new Set();
        const clean = source.slice(0, 30).flatMap((category, index) => {
            if (!category || typeof category !== "object") return [];
            const label = typeof category.label === "string" ? category.label.trim().slice(0, 60) : "";
            const kind = category.kind === "income" ? "income" : category.kind === "expense" ? "expense" : "";
            const rawId = typeof category.id === "string" ? category.id.trim().toLowerCase() : "";
            const id = /^[a-z0-9][a-z0-9-]{0,79}$/.test(rawId) ? rawId : `section-${index + 1}`;
            if (!label || !kind || seen.has(id)) return [];
            seen.add(id);
            return [{ id, label, kind }];
        });
        return clean.length ? clean : JSON.parse(JSON.stringify(STANDARD_CATEGORIES));
    }

    function saveBudget() {
        try {
            budget.categories = categories;
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(budget));
        } catch {
            // The planner still works when storage is unavailable.
        }
    }

    function finiteNumber(value) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function validDate(value) {
        return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
    }

    function dateFromIso(value) {
        return new Date(`${value}T00:00:00.000Z`);
    }

    function isoFromDate(value) {
        return value.toISOString().slice(0, 10);
    }

    function addDays(value, days) {
        const date = dateFromIso(value);
        date.setUTCDate(date.getUTCDate() + days);
        return isoFromDate(date);
    }

    function monthlyDates(start, end) {
        if (!validDate(start) || !validDate(end) || start > end) return [];
        const dates = [];
        const anchor = dateFromIso(start);
        const anchorDay = anchor.getUTCDate();
        let year = anchor.getUTCFullYear();
        let month = anchor.getUTCMonth();

        while (dates.length < 1200) {
            const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
            const current = new Date(Date.UTC(year, month, Math.min(anchorDay, lastDay)));
            const iso = isoFromDate(current);
            if (iso > end) break;
            dates.push(iso);
            month += 1;
            if (month > 11) {
                month = 0;
                year += 1;
            }
        }
        return dates;
    }

    function allocationDates(start, end) {
        if (!validDate(start) || !validDate(end) || start > end) return [];
        const dates = [];
        const cursor = dateFromIso(start);
        const final = dateFromIso(end);
        cursor.setUTCDate(1);
        final.setUTCDate(1);

        while (cursor <= final && dates.length < 1200) {
            const first = isoFromDate(cursor);
            dates.push(first < start ? start : first);
            cursor.setUTCMonth(cursor.getUTCMonth() + 1);
        }
        return dates;
    }

    function occurrenceDates(item) {
        const rangeEnd = item.end && item.end < budget.endDate ? item.end : budget.endDate;
        let dates = [];

        if (!validDate(item.start) || !validDate(rangeEnd)) return dates;
        if (item.frequency === "once") {
            dates = [item.start];
        } else if (item.frequency === "monthly") {
            dates = monthlyDates(item.start, rangeEnd);
        } else if (item.frequency === "allocation") {
            dates = allocationDates(item.start, rangeEnd);
        } else {
            const step = item.frequency === "weekly" ? 7 : 14;
            for (let current = item.start; current <= rangeEnd && dates.length < 2400; current = addDays(current, step)) {
                dates.push(current);
            }
        }

        return dates.filter((date) => date >= budget.startDate && date <= budget.endDate && date <= rangeEnd);
    }

    function expandTransactions() {
        return budget.items
            .flatMap((item) => {
                const dates = occurrenceDates(item);
                const amount = item.frequency === "allocation" && dates.length ? item.amount / dates.length : item.amount;
                return dates.map((date) => ({ item, date, amount }));
            })
            .sort((left, right) => left.date.localeCompare(right.date));
    }

    function monthKeys(start, end) {
        if (!validDate(start) || !validDate(end) || start > end) return [];
        const result = [];
        const cursor = dateFromIso(start);
        const final = dateFromIso(end);
        cursor.setUTCDate(1);
        final.setUTCDate(1);
        while (cursor <= final && result.length < 1200) {
            result.push(isoFromDate(cursor).slice(0, 7));
            cursor.setUTCMonth(cursor.getUTCMonth() + 1);
        }
        return result;
    }

    function itemTotal(item) {
        const count = occurrenceDates(item).length;
        return item.frequency === "allocation" ? (count ? item.amount : 0) : item.amount * count;
    }

    function sliderMax(item) {
        const amount = Math.max(0, finiteNumber(item.amount));

        if (item.kind === "income" && item.frequency === "once") {
            const sensibleMaximum = Math.max(1000, Math.ceil((amount * 1.1) / 10) * 10);
            return Math.min(3500, sensibleMaximum);
        }

        const multiplier = item.kind === "income" ? 1.5 : 2;
        return Math.max(50, Math.ceil((amount * multiplier) / 10) * 10);
    }

    function categoryMeta(id) {
        return categories.find((category) => category.id === id) || categories[0];
    }

    function calculateBudget() {
        const transactions = expandTransactions();
        const income = transactions.filter(({ item }) => item.kind === "income").reduce((sum, { amount }) => sum + amount, 0);
        const spending = transactions.filter(({ item }) => item.kind === "expense").reduce((sum, { amount }) => sum + amount, 0);
        const savings = transactions
            .filter(({ item }) => item.kind === "income" && item.savingsRate)
            .reduce((sum, { item, amount }) => sum + amount * ((item.savingsRate || 0) / 100), 0);
        const liquid = income - spending - savings;
        let balance = 0;
        const cashFlow = monthKeys(budget.startDate, budget.endDate).map((key) => {
            const current = transactions.filter(({ date }) => date.startsWith(key));
            const monthIncome = current.filter(({ item }) => item.kind === "income").reduce((sum, { amount }) => sum + amount, 0);
            const monthSpending = current.filter(({ item }) => item.kind === "expense").reduce((sum, { amount }) => sum + amount, 0);
            const monthSavings = current
                .filter(({ item }) => item.kind === "income" && item.savingsRate)
                .reduce((sum, { item, amount }) => sum + amount * ((item.savingsRate || 0) / 100), 0);
            balance += monthIncome - monthSpending - monthSavings;
            return { month: monthLabel.format(dateFromIso(`${key}-01`)), balance: Number(balance.toFixed(2)) };
        });
        const categoryTotals = Object.fromEntries(
            categories.map((category) => [
                category.id,
                budget.items
                    .filter((item) => item.category === category.id)
                    .reduce((sum, item) => sum + itemTotal(item), 0),
            ]),
        );

        return {
            income,
            spending,
            savings,
            liquid,
            cashFlow,
            lowestBalance: cashFlow.length ? Math.min(...cashFlow.map((entry) => entry.balance)) : 0,
            categoryTotals,
        };
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function render() {
        if (!categories.some((category) => category.id === selectedCategory)) {
            selectedCategory = categories[0].id;
        }
        const currentCategory = categoryMeta(selectedCategory);
        elements.owner.value = budget.ownerName;
        elements.start.value = budget.startDate;
        elements.end.value = budget.endDate;
        elements.addSectionButton.disabled = categories.length >= 30;
        elements.removeSection.disabled = categories.length <= 1;
        elements.sectionKicker.textContent = currentCategory.kind === "income" ? "Money in" : "Money out";
        elements.sectionTitle.textContent = currentCategory.label;
        renderItems();
        renderCalculatedPanels();
    }

    function renderCategoryNav(results) {
        elements.categoryNav.innerHTML = categories
            .map((category) => `
                <button class="categoryButton" type="button" data-category="${category.id}" aria-current="${category.id === selectedCategory}">
                    <span class="categoryCopy"><strong>${escapeHtml(category.label)}</strong></span>
                    <span class="categoryTotal">${money.format(results.categoryTotals[category.id])}</span>
                </button>
            `)
            .join("");
    }

    function renderItems() {
        const visibleItems = budget.items.filter((item) => item.category === selectedCategory);

        if (!visibleItems.length) {
            elements.items.innerHTML = `
                <div class="emptyState">
                    <strong>Nothing in this section yet</strong>
                    <p>Add a payment, allowance or budget line to start modelling it.</p>
                    <button class="budgetButton" type="button" data-action="open-add">+ Add the first item</button>
                </div>
            `;
            return;
        }

        elements.items.innerHTML = visibleItems.map(renderItem).join("");
    }

    function renderItem(item) {
        const total = itemTotal(item);
        const maximum = sliderMax(item);
        const step = item.amount < 100 ? 0.5 : item.amount < 500 ? 1 : 10;
        const scheduleEnd = item.frequency === "once"
            ? ""
            : `<label class="scheduleField"><span>Ends</span><input type="date" data-field="end" value="${escapeHtml(item.end || budget.endDate)}"></label>`;
        const savings = item.kind !== "income"
            ? ""
            : item.savingsRate === undefined
                ? `
                <div class="savingsPanel savingsSetup">
                    <button class="budgetButton budgetButtonSecondary savingsAddButton" type="button" data-action="add-savings">+ Allocate to savings</button>
                </div>
            `
                : `
                <div class="savingsPanel">
                    <div class="savingsHeader">
                        <strong>Protected savings</strong>
                        <span class="savingsValue" data-savings-value>${item.savingsRate}% · ${money.format(total * (item.savingsRate / 100))}</span>
                    </div>
                    <input type="range" data-field="savingsRate" min="0" max="50" step="1" value="${item.savingsRate}" aria-label="${escapeHtml(item.name)} savings rate">
                </div>
            `;
        return `
            <article class="budgetItem" data-item-id="${escapeHtml(item.id)}">
                <header class="itemHeader">
                    <div>
                        <input class="itemNameInput" data-field="name" value="${escapeHtml(item.name)}" aria-label="Item name">
                    </div>
                    <button class="iconButton" type="button" data-action="remove" aria-label="Remove ${escapeHtml(item.name)}">×</button>
                </header>
                <div class="itemAmountGrid">
                    <label class="amountField">
                        <span>${item.frequency === "allocation" ? "Period total" : "Each payment"}</span>
                        <span class="currencyInput"><span aria-hidden="true">£</span><input type="number" data-field="amount" min="0" step="0.01" value="${item.amount}"></span>
                    </label>
                    <div class="sliderField">
                        <input type="range" data-field="amountRange" min="0" max="${maximum}" step="${step}" value="${Math.min(item.amount, maximum)}" aria-label="${escapeHtml(item.name)} amount">
                        <div class="rangeLegend"><span>£0</span><span>${money.format(maximum)}</span></div>
                    </div>
                    <div class="itemTotal"><span>In period</span><strong data-item-total>${money.format(total)}</strong></div>
                </div>
                <div class="itemSchedule">
                    <label class="scheduleField">
                        <span>Frequency</span>
                        <select data-field="frequency">
                            ${Object.entries(frequencyLabels).map(([value, label]) => `<option value="${value}" ${item.frequency === value ? "selected" : ""}>${label}</option>`).join("")}
                        </select>
                    </label>
                    <label class="scheduleField"><span>${item.frequency === "once" ? "Payment date" : "Starts"}</span><input type="date" data-field="start" value="${escapeHtml(item.start)}"></label>
                    ${scheduleEnd}
                </div>
                ${savings}
            </article>
        `;
    }

    function renderCalculatedPanels() {
        const results = calculateBudget();
        renderCategoryNav(results);
        elements.liquid.textContent = money.format(results.liquid);
        elements.income.textContent = money.format(results.income);
        elements.spending.textContent = money.format(results.spending);
        elements.savings.textContent = money.format(results.savings);
        renderChart(results.cashFlow);
        renderStatus(results.lowestBalance);
        renderSpendingBars(results.categoryTotals);
    }

    function renderChart(cashFlow) {
        if (!cashFlow.length) {
            elements.chart.innerHTML = `<text x="240" y="105" text-anchor="middle">Choose a valid budget period</text>`;
            return;
        }

        const width = 480;
        const height = 210;
        const left = 55;
        const right = 12;
        const top = 16;
        const bottom = 36;
        const plotWidth = width - left - right;
        const plotHeight = height - top - bottom;
        const values = cashFlow.map((entry) => entry.balance);
        let minimum = Math.min(0, ...values);
        let maximum = Math.max(0, ...values);
        if (minimum === maximum) {
            minimum -= 1;
            maximum += 1;
        }
        const padding = (maximum - minimum) * 0.08;
        minimum -= padding;
        maximum += padding;
        const xAt = (index) => left + (cashFlow.length === 1 ? plotWidth / 2 : (index / (cashFlow.length - 1)) * plotWidth);
        const yAt = (value) => top + ((maximum - value) / (maximum - minimum)) * plotHeight;
        const points = cashFlow.map((entry, index) => `${xAt(index).toFixed(2)},${yAt(entry.balance).toFixed(2)}`).join(" ");
        const area = `${left},${top + plotHeight} ${points} ${left + plotWidth},${top + plotHeight}`;
        const zeroY = yAt(0);
        const tickIndexes = [...new Set([0, Math.floor((cashFlow.length - 1) / 3), Math.floor(((cashFlow.length - 1) * 2) / 3), cashFlow.length - 1])];
        const gridValues = [minimum, (minimum + maximum) / 2, maximum];

        elements.chart.innerHTML = `
            ${gridValues.map((value) => {
                const y = yAt(value);
                return `<line class="chartGrid" x1="${left}" x2="${left + plotWidth}" y1="${y}" y2="${y}"></line><text x="${left - 7}" y="${y + 3}" text-anchor="end">${formatCompactMoney(value)}</text>`;
            }).join("")}
            <line class="chartZero" x1="${left}" x2="${left + plotWidth}" y1="${zeroY}" y2="${zeroY}"></line>
            <polygon class="chartArea" points="${area}"></polygon>
            <polyline class="chartLine" points="${points}"></polyline>
            ${cashFlow.map((entry, index) => `<circle class="chartPoint" cx="${xAt(index)}" cy="${yAt(entry.balance)}" r="3"><title>${escapeHtml(entry.month)}: ${money.format(entry.balance)}</title></circle>`).join("")}
            ${tickIndexes.map((index) => `<text x="${xAt(index)}" y="${height - 10}" text-anchor="middle">${escapeHtml(cashFlow[index].month)}</text>`).join("")}
        `;
    }

    function formatCompactMoney(value) {
        const absolute = Math.abs(value);
        if (absolute >= 1000) return `${value < 0 ? "−" : ""}£${Math.round(absolute / 1000)}k`;
        return `${value < 0 ? "−" : ""}£${Math.round(absolute)}`;
    }

    function renderStatus(lowestBalance) {
        const warning = lowestBalance < 0;
        elements.status.className = `budgetStatus${warning ? " statusWarning" : ""}`;
        elements.status.innerHTML = `
            <div class="budgetStatusHeader">
                <span class="statusIndicator" aria-hidden="true"></span>
                <strong>${warning ? "Withdrawal may be needed" : "No withdrawal needed"}</strong>
            </div>
            <p>Lowest projected month-end balance: ${money.format(lowestBalance)}. ${warning ? "The projection falls below zero; reduce a saving transfer or move a payment date." : "The plan remains above zero throughout the projection."}</p>
        `;
    }

    function renderSpendingBars(categoryTotals) {
        const spendingCategories = categories.filter((category) => category.kind === "expense");
        const largest = Math.max(1, ...spendingCategories.map((category) => categoryTotals[category.id]));
        elements.spendingBars.innerHTML = spendingCategories.map((category) => {
            const value = categoryTotals[category.id];
            return `
                <button class="spendRow" type="button" data-category="${category.id}">
                    <span class="spendRowHeader"><span>${escapeHtml(category.label)}</span><span>${money.format(value)}</span></span>
                    <span class="spendTrack"><span class="spendFill" style="width:${(value / largest) * 100}%"></span></span>
                </button>
            `;
        }).join("");
    }

    function updateItem(id, field, rawValue) {
        const item = budget.items.find((entry) => entry.id === id);
        if (!item) return;
        if (field === "amount") item.amount = Math.max(0, finiteNumber(rawValue));
        else if (field === "savingsRate") item.savingsRate = clamp(finiteNumber(rawValue), 0, 100);
        else if (field === "frequency" && VALID_FREQUENCIES.has(rawValue)) item.frequency = rawValue;
        else if ((field === "start" || field === "end") && validDate(rawValue)) item[field] = rawValue;
        else if (field === "name") item.name = String(rawValue).slice(0, 160);
        saveBudget();
    }

    function refreshLiveItem(card, item) {
        const total = itemTotal(item);
        const totalElement = card.querySelector("[data-item-total]");
        const savingsElement = card.querySelector("[data-savings-value]");
        const amountRange = card.querySelector('[data-field="amountRange"]');
        if (totalElement) totalElement.textContent = money.format(total);
        if (savingsElement) savingsElement.textContent = `${item.savingsRate}% · ${money.format(total * (item.savingsRate / 100))}`;
        if (amountRange) {
            const rangeMaximum = finiteNumber(amountRange.max);
            amountRange.value = String(Math.min(item.amount, rangeMaximum));
        }
    }

    function uniqueCategoryId(label) {
        const base = label
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 50) || "section";
        let id = base;
        let suffix = 2;
        while (categories.some((category) => category.id === id)) {
            id = `${base}-${suffix}`;
            suffix += 1;
        }
        return id;
    }

    function openAddSectionDialog() {
        if (categories.length >= 30) return;
        elements.sectionForm.reset();
        elements.sectionKind.value = "expense";
        elements.sectionDialog.showModal();
        window.setTimeout(() => elements.sectionName.focus(), 0);
    }

    function addSection() {
        const label = elements.sectionName.value.trim().slice(0, 60);
        const kind = elements.sectionKind.value === "income" ? "income" : "expense";
        if (!label || categories.length >= 30) return;
        const category = { id: uniqueCategoryId(label), label, kind };
        categories.push(category);
        budget.categories = categories;
        selectedCategory = category.id;
        saveBudget();
        elements.sectionDialog.close();
        render();
    }

    function removeSelectedSection() {
        if (categories.length <= 1) return;
        const category = categoryMeta(selectedCategory);
        const itemCount = budget.items.filter((item) => item.category === category.id).length;
        const itemWarning = itemCount
            ? ` This also removes ${itemCount} ${itemCount === 1 ? "item" : "items"} inside it.`
            : "";
        if (!window.confirm(`Remove “${category.label}”?${itemWarning}`)) return;
        categories = categories.filter((entry) => entry.id !== category.id);
        budget.categories = categories;
        budget.items = budget.items.filter((item) => item.category !== category.id);
        selectedCategory = categories[0].id;
        saveBudget();
        render();
    }

    function openAddDialog() {
        const currentCategory = categoryMeta(selectedCategory);
        elements.addForm.reset();
        elements.addTitle.textContent = `Add to ${currentCategory.label}`;
        elements.newAmount.value = "0";
        elements.newFrequency.value = "monthly";
        elements.newStart.value = budget.startDate;
        elements.newEnd.value = budget.endDate;
        updateNewItemDateFields();
        elements.dialog.showModal();
        window.setTimeout(() => elements.newName.focus(), 0);
    }

    function updateNewItemDateFields() {
        const once = elements.newFrequency.value === "once";
        elements.newStartLabel.textContent = once ? "Payment date" : "Starts";
        elements.newEndField.hidden = once;
    }

    function addItem() {
        const currentCategory = categoryMeta(selectedCategory);
        const name = elements.newName.value.trim();
        const amount = Math.max(0, finiteNumber(elements.newAmount.value));
        if (!name || !validDate(elements.newStart.value)) return;
        budget.items.push({
            id: `item-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            name: name.slice(0, 160),
            amount,
            kind: currentCategory.kind,
            category: currentCategory.id,
            frequency: elements.newFrequency.value,
            start: elements.newStart.value,
            ...(elements.newFrequency.value === "once" || !validDate(elements.newEnd.value) ? {} : { end: elements.newEnd.value }),
        });
        saveBudget();
        elements.dialog.close();
        render();
    }

    function exportPlan() {
        const blob = new Blob([JSON.stringify(budget, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "budget-plan.json";
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 0);
    }

    function ownerPlanTitle(name) {
        const cleanName = String(name || "").trim();
        if (!cleanName) return "Budget Plan";
        return `${cleanName}${/s$/i.test(cleanName) ? "’" : "’s"} Budget Plan`;
    }

    function ownerInitials(name) {
        const initials = String(name || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase();
        return initials || "BP";
    }

    function buildPrintReport() {
        const results = calculateBudget();
        const incomeRows = budget.items.filter((item) => item.kind === "income");
        const spendingCategories = categories.filter((category) => category.kind === "expense");
        elements.printReport.innerHTML = `
            <header class="printReportHeader">
                <div>
                    <p class="printReportKicker">Personal finance plan</p>
                    <h1>${escapeHtml(ownerPlanTitle(budget.ownerName))}</h1>
                    <p class="printReportSubtitle">Budget · ${escapeHtml(budget.startDate)} to ${escapeHtml(budget.endDate)}</p>
                </div>
                <div class="printReportMark">${escapeHtml(ownerInitials(budget.ownerName))}</div>
            </header>
            <section class="printReportSummary">
                <div><span>Gross income</span><strong>${money.format(results.income)}</strong></div>
                <div><span>Planned spending</span><strong>${money.format(results.spending)}</strong></div>
                <div><span>Protected savings</span><strong>${money.format(results.savings)}</strong></div>
                <div><span>End liquid cash</span><strong>${money.format(results.liquid)}</strong></div>
            </section>
            <section class="printReportSection">
                <h2>Income and savings</h2>
                ${reportTable(incomeRows, true)}
            </section>
            ${spendingCategories.map((category) => {
                const items = budget.items.filter((item) => item.category === category.id);
                if (!items.length) return "";
                return `<section class="printReportSection"><div class="printReportSectionHeader"><h2>${escapeHtml(category.label)}</h2><strong>${money.format(results.categoryTotals[category.id])}</strong></div>${reportTable(items, false)}</section>`;
            }).join("")}
            <footer class="printReportFooter"><span>Budget Studio</span><span>Generated ${new Date().toLocaleDateString("en-GB")}</span></footer>
        `;
    }

    function reportTable(items, incomeTable) {
        return `
            <table>
                <thead><tr><th>${incomeTable ? "Income source" : "Item"}</th><th>Schedule</th><th>Date / start</th><th class="numeric">Period total</th>${incomeTable ? '<th class="numeric">Savings</th>' : ""}</tr></thead>
                <tbody>${items.map((item) => `
                    <tr>
                        <td>${escapeHtml(item.name)}</td>
                        <td>${frequencyLabels[item.frequency]}</td>
                        <td>${escapeHtml(item.start)}${item.end ? ` to ${escapeHtml(item.end)}` : ""}</td>
                        <td class="numeric">${money.format(itemTotal(item))}</td>
                        ${incomeTable ? `<td class="numeric">${item.savingsRate === undefined ? "–" : `${item.savingsRate}%`}</td>` : ""}
                    </tr>
                `).join("")}</tbody>
            </table>
        `;
    }

    elements.owner.addEventListener("input", () => {
        budget.ownerName = elements.owner.value.slice(0, 100);
        saveBudget();
    });

    elements.start.addEventListener("change", () => {
        if (validDate(elements.start.value)) {
            budget.startDate = elements.start.value;
            saveBudget();
            render();
        }
    });

    elements.end.addEventListener("change", () => {
        if (validDate(elements.end.value)) {
            budget.endDate = elements.end.value;
            saveBudget();
            render();
        }
    });

    elements.categoryNav.addEventListener("click", (event) => {
        const button = event.target.closest("[data-category]");
        if (!button) return;
        selectedCategory = button.dataset.category;
        render();
    });

    elements.spendingBars.addEventListener("click", (event) => {
        const button = event.target.closest("[data-category]");
        if (!button) return;
        selectedCategory = button.dataset.category;
        render();
        document.getElementById("budget-workspace").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    elements.items.addEventListener("click", (event) => {
        const action = event.target.closest("[data-action]");
        if (!action) return;
        if (action.dataset.action === "open-add") {
            openAddDialog();
            return;
        }
        if (action.dataset.action === "add-savings") {
            const card = action.closest("[data-item-id]");
            const item = budget.items.find((entry) => entry.id === card?.dataset.itemId);
            if (!item || item.kind !== "income") return;
            item.savingsRate = 10;
            saveBudget();
            render();
            return;
        }
        if (action.dataset.action === "remove") {
            const card = action.closest("[data-item-id]");
            budget.items = budget.items.filter((item) => item.id !== card.dataset.itemId);
            saveBudget();
            render();
        }
    });

    elements.items.addEventListener("input", (event) => {
        const field = event.target.dataset.field;
        const card = event.target.closest("[data-item-id]");
        if (!field || !card) return;
        const item = budget.items.find((entry) => entry.id === card.dataset.itemId);
        if (!item) return;

        if (field === "name") {
            updateItem(item.id, "name", event.target.value);
            return;
        }
        if (field === "amount" || field === "amountRange") {
            updateItem(item.id, "amount", event.target.value);
            const counterpart = card.querySelector(field === "amount" ? '[data-field="amountRange"]' : '[data-field="amount"]');
            if (counterpart) counterpart.value = item.amount;
        } else if (field === "savingsRate") {
            updateItem(item.id, "savingsRate", event.target.value);
        } else {
            return;
        }
        refreshLiveItem(card, item);
        renderCalculatedPanels();
    });

    elements.items.addEventListener("change", (event) => {
        const field = event.target.dataset.field;
        const card = event.target.closest("[data-item-id]");
        if (!field || !card || ["name", "amount", "amountRange", "savingsRate"].includes(field)) return;
        updateItem(card.dataset.itemId, field, event.target.value);
        render();
    });

    document.getElementById("open-add-item").addEventListener("click", openAddDialog);
    document.getElementById("cancel-add-item").addEventListener("click", () => elements.dialog.close());
    elements.newFrequency.addEventListener("change", updateNewItemDateFields);
    elements.addForm.addEventListener("submit", (event) => {
        event.preventDefault();
        addItem();
    });

    elements.addSectionButton.addEventListener("click", openAddSectionDialog);
    elements.removeSection.addEventListener("click", removeSelectedSection);
    document.getElementById("cancel-add-section").addEventListener("click", () => elements.sectionDialog.close());
    elements.sectionForm.addEventListener("submit", (event) => {
        event.preventDefault();
        addSection();
    });

    document.getElementById("export-plan").addEventListener("click", exportPlan);
    document.getElementById("reset-plan").addEventListener("click", () => {
        if (!window.confirm("Reset every change and restore the clean starter template?")) return;
        budget = cloneDefaultBudget();
        categories = budget.categories;
        selectedCategory = categories[0].id;
        saveBudget();
        render();
    });
    document.getElementById("print-plan").addEventListener("click", () => {
        buildPrintReport();
        window.print();
    });
    window.addEventListener("beforeprint", buildPrintReport);
    window.addEventListener("pagehide", saveBudget);
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") saveBudget();
    });

    render();
})();
