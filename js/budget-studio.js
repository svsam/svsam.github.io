import { budget } from "./university-budget-data.js";

const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const money = (pence) => currency.format(pence / 100);
const movement = (pence) => `${pence > 0 ? "+" : pence < 0 ? "−" : ""}${money(Math.abs(pence))}`;
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);
const sum = (items, key) => items.reduce((total, item) => total + item[key], 0);
const metric = (label, value) => `<div><dt>${escapeHtml(label)}</dt><dd>${money(value)}</dd></div>`;

export function auditBudget(plan) {
    const errors = [];
    const check = (condition, message) => { if (!condition) errors.push(message); };
    let balance = plan.totals.opening;
    let minimum = Infinity;
    let minimumDate = "";
    check(plan.months.length === 13, "Expected 13 monthly sections.");
    for (const month of plan.months) {
        check(month.opening === balance, `${month.name}: opening balance.`);
        check(month.net === month.income - month.spending - month.savings, `${month.name}: net movement.`);
        check(month.closing === month.opening + month.net, `${month.name}: closing balance.`);
        check(sum(month.categories, "amount") === month.spending, `${month.name}: category spending.`);
        for (const row of month.rows) {
            check(["income", "spending", "savings", "net", "balance"].every((key) => Number.isSafeInteger(row[key])), `${month.name}, ${row.date}: integer pence.`);
            check(row.net === row.income - row.spending - row.savings, `${month.name}, ${row.date}: movement.`);
            balance += row.net;
            check(row.balance === balance, `${month.name}, ${row.date}: running balance.`);
            if (balance < minimum) {
                minimum = balance;
                minimumDate = `${Number(row.date.split(" ")[0])} ${month.name}`;
            }
        }
        check(balance === month.closing, `${month.name}: payment closing balance.`);
        for (const key of ["income", "spending", "savings"]) {
            check(sum(month.rows, key) === month[key], `${month.name}: payment ${key}.`);
        }
    }
    for (const key of ["income", "spending", "savings"]) {
        check(sum(plan.months, key) === plan.totals[key], `Annual ${key}.`);
    }
    check(balance === plan.totals.closing, "Annual closing balance.");
    check(balance + plan.totals.savings === plan.totals.combined, "Liquid plus savings.");
    check(minimum === plan.totals.minimumBalance && minimumDate === plan.totals.minimumDate, "Minimum dated balance.");
    check(plan.months.reduce((count, month) => count + month.rows.length, 0) === plan.totals.datedRows, "Dated row count.");
    const categoryNames = {
        "Subscriptions and recurring bills": "Subscriptions & bills",
        "Entertainment, clothing and books": "Entertainment",
        "Other spending": "Other",
    };
    for (const category of plan.breakdowns) {
        check(sum(category.items, "amount") === category.total, `${category.name}: item total.`);
        const monthlyTotal = category.name === "Protected savings" ? plan.totals.savings
            : sum(plan.months.flatMap((month) => month.categories)
                .filter((item) => item.name === (categoryNames[category.name] || category.name)), "amount");
        check(category.total === monthlyTotal, `${category.name}: annual category total.`);
    }
    check(sum(plan.chatgpt.payments, "amount") === plan.chatgpt.total, "ChatGPT payment total.");
    const proPayment = plan.chatgpt.payments.find((payment) => payment.plan === "Pro 5x");
    check(proPayment && plan.chatgpt.saving === plan.chatgpt.payments
        .filter((payment) => payment.plan === "Plus")
        .reduce((saving, payment) => saving + proPayment.amount - payment.amount, 0), "ChatGPT saving.");
    return errors;
}

export function renderMonth(month, plan = budget) {
    const payment = plan.chatgpt.payments.find((item) => item.month === month.name);
    return `
        <div class="monthTitle">
            <div><h3>${escapeHtml(month.name)}</h3><p>${escapeHtml(month.period)}</p></div>
            <span class="checkBadge">Scheduled plan</span>
        </div>
        <dl class="monthMetrics">
            ${metric("Opening balance", month.opening)}${metric("Income", month.income)}
            ${metric("Spending", month.spending)}${metric("To savings", month.savings)}
        </dl>
        <div class="monthClose">
            <div><span>Closing balance</span><strong>${money(month.closing)}</strong></div>
            <div class="${month.net >= 0 ? "positive" : "negative"}">${movement(month.net)}<small>net movement</small></div>
        </div>
        <p class="muted">${escapeHtml(month.context)}</p>
        ${payment ? `<p class="billingMonth"><strong>ChatGPT ${escapeHtml(payment.plan)} · ${money(payment.amount)}</strong><span class="muted">${escapeHtml(payment.date)} · included in subscriptions and bills</span></p>` : ""}
        <div class="spendingBreakdown">
            <h4>Spending breakdown</h4>
            <dl>${month.categories.filter((category) => category.amount > 0).map((category) => `
                <div><dt>${escapeHtml(category.name)}<progress class="spendTrack" aria-hidden="true" max="${month.spending}" value="${category.amount}"></progress></dt><dd>${money(category.amount)}</dd></div>
            `).join("")}</dl>
        </div>
        <div class="sectionHeading paymentsHeading"><h4>Dated payments</h4><span>${month.rows.length} dates</span></div>
        <p class="muted">Open a date for every payment and its coverage notes.</p>
        ${month.rows.map((row) => `
            <details>
                <summary>
                    <span class="paymentDate"><strong>${escapeHtml(row.date)}</strong><small>${row.details.map((detail) => escapeHtml(detail.category.replace("Subscriptions / bills", "Bills"))).join(" · ")}</small></span>
                    <span class="paymentAmount"><strong class="${row.net >= 0 ? "positive" : ""}">${movement(row.net)}</strong><small>${money(row.balance)} left</small></span>
                </summary>
                <dl class="paymentDetail">${row.details.map((detail) => `<div><dt>${escapeHtml(detail.category)}</dt><dd>${escapeHtml(detail.text)}</dd></div>`).join("")}</dl>
            </details>
        `).join("")}`;
}

function download(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function initialise() {
    const byId = (id) => document.getElementById(id);
    const issues = auditBudget(budget);
    const totals = budget.totals;
    byId("annual-closing").textContent = money(totals.closing);
    byId("reconciliation-summary").textContent = issues.length ? "Review the arithmetic check below" : "All 13 months reconcile";
    byId("year-totals").innerHTML = metric("Income during budget", totals.income)
        + metric("Planned spending", totals.spending)
        + metric("Protected savings", totals.savings)
        + metric("Liquid + savings", totals.combined);
    byId("category-breakdowns").innerHTML = budget.breakdowns.map((category) => `
        <details>
            <summary><span class="categoryTitle">${escapeHtml(category.name)}</span><strong>${money(category.total)}</strong></summary>
            <dl class="categoryItems">${category.items.map((item) => `<div><dt>${escapeHtml(item.name)}<small>${escapeHtml(item.calculation)}</small></dt><dd>${money(item.amount)}</dd></div>`).join("")}</dl>
            ${category.note ? `<p class="muted">${escapeHtml(category.note)}</p>` : ""}
        </details>`).join("");
    byId("billing-schedule").innerHTML = `
        <div><dt>28 Sep, Oct, Nov &amp; Dec 2026</dt><dd>Plus · £20.00 per month</dd></div>
        <div><dt>28 January – 28 August 2027</dt><dd>Pro · £88.90 per month</dd></div>
        ${metric("Saving across four Plus payments", budget.chatgpt.saving)}
        ${metric("ChatGPT total within this budget", budget.chatgpt.total)}`;
    byId("audit-heading").textContent = issues.length ? "The plan needs a review." : "The maths checks out.";
    const auditSummary = issues.length ? issues.join("\n") : `${totals.datedRows} dated rows. ${budget.months.length} monthly sections. Running balances and category totals reconcile.`;
    byId("audit-summary").textContent = auditSummary;
    byId("audit-minimum").innerHTML = `<dt>Lowest balance after a scheduled date</dt><dd><strong>${money(totals.minimumBalance)}</strong><small>${escapeHtml(totals.minimumDate)}</small></dd>`;

    const select = byId("budget-month");
    select.innerHTML = budget.months.map((month, index) => `<option value="${index}">${escapeHtml(month.name)}</option>`).join("");
    let selected = 0;
    function showMonth(index) {
        selected = Math.max(0, Math.min(budget.months.length - 1, index));
        const month = budget.months[selected];
        select.value = String(selected);
        byId("month-count").textContent = `${selected + 1} of ${budget.months.length}`;
        byId("previous-month").disabled = selected === 0;
        byId("next-month").disabled = selected === budget.months.length - 1;
        byId("month-panel").innerHTML = renderMonth(month);
        byId("month-announcement").textContent = `${month.name}. Closing balance ${money(month.closing)}.`;
    }
    select.addEventListener("change", () => showMonth(Number(select.value)));
    byId("previous-month").addEventListener("click", () => showMonth(selected - 1));
    byId("next-month").addEventListener("click", () => showMonth(selected + 1));
    byId("download-budget").addEventListener("click", () => download("university-budget-2026-27.json", JSON.stringify(budget, null, 2), "application/json"));
    byId("download-audit").addEventListener("click", () => download("university-budget-arithmetic.md",
        `# University Budget 2026–27: arithmetic check\n\n${auditSummary}\n\nOpening: ${money(totals.opening)}\nIncome: ${money(totals.income)}\nSpending: ${money(totals.spending)}\nProtected savings: ${money(totals.savings)}\nClosing liquid balance: ${money(totals.closing)}\nLiquid + savings: ${money(totals.combined)}\nLowest dated balance: ${money(totals.minimumBalance)} on ${totals.minimumDate}\n\nChecks the supplied schedule, not actual bank transactions or current prices. Original PDF and LaTeX files were not supplied.\n`, "text/markdown"));
    let printMonths;
    let closedDetails = [];
    window.addEventListener("beforeprint", () => {
        if (printMonths) return;
        printMonths = document.createElement("div");
        printMonths.className = "printMonths";
        printMonths.innerHTML = budget.months.map((month) => `<section class="monthPanel">${renderMonth(month)}</section>`).join("");
        byId("month-panel").parentElement.after(printMonths);
        closedDetails = [...document.querySelectorAll("details:not([open])")];
        closedDetails.forEach((detail) => { detail.open = true; });
    });
    window.addEventListener("afterprint", () => {
        closedDetails.forEach((detail) => { detail.open = false; });
        printMonths?.remove();
        printMonths = null;
    });
    byId("print-budget").addEventListener("click", () => window.print());
    showMonth(0);
    byId("budget-report").hidden = false;
    byId("budget-status").hidden = true;
}

if (typeof document !== "undefined") initialise();
