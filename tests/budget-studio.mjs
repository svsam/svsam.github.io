// Run with: node tests/budget-studio.mjs
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { budget } from "../js/university-budget-data.js";
import { auditBudget, renderMonth } from "../js/budget-studio.js";

assert.deepEqual(auditBudget(budget), []);
assert.deepEqual(budget.totals, {
    opening: 0, income: 1123800, spending: 787956, savings: 183272,
    closing: 152572, combined: 335844, datedRows: 122,
    minimumBalance: 74262, minimumDate: "9 November 2026",
});
assert.equal(budget.months.length, 13);
assert.equal(budget.months.reduce((count, month) => count + month.rows.length, 0), 122);
assert.deepEqual(budget.months.map((month) => month.closing), [
    175324, 136688, 127714, 91068, 216518, 243302, 191306,
    346128, 269254, 220248, 192362, 164476, 152572,
]);

for (const mutate of [
    (plan) => { plan.months[0].rows[0].spending += 1; },
    (plan) => { plan.months[0].rows[0].balance += 1; },
    (plan) => { plan.months[0].rows[0].income += 0.5; },
    (plan) => { plan.months[1].opening += 1; },
    (plan) => { plan.months[0].categories[0].amount += 1; },
    (plan) => { plan.totals.closing += 1; },
    (plan) => { plan.totals.minimumDate = "10 November 2026"; },
    (plan) => { plan.breakdowns[0].items[0].amount += 1; },
    (plan) => { plan.breakdowns[0].items[0].amount += 1; plan.breakdowns[0].total += 1; },
    (plan) => { plan.chatgpt.payments[0].amount += 1; },
    (plan) => { plan.chatgpt.saving += 1; },
]) {
    const changed = structuredClone(budget);
    mutate(changed);
    assert.ok(auditBudget(changed).length > 0, `Audit missed ${mutate}`);
}

for (const month of budget.months) {
    const html = renderMonth(month);
    assert.ok(html.includes(`<h3>${month.name}</h3>`));
    assert.equal((html.match(/<details>/g) ?? []).length, month.rows.length, month.name);
    assert.ok(html.includes(`${month.rows.length} dates`));
    for (const row of month.rows) assert.ok(html.includes(`<strong>${row.date}</strong>`));
}

const categoryNames = ["Subscriptions & bills", "Pets", "Food", "Travel", "Entertainment", "Other"];
for (const [index, name] of categoryNames.entries()) {
    const total = budget.months.reduce((sum, month) => sum + month.categories.find((item) => item.name === name).amount, 0);
    assert.equal(budget.breakdowns[index].total, total, `${name}: annual/monthly reconciliation`);
}
assert.equal(budget.breakdowns.at(-1).total, budget.totals.savings);

assert.equal(budget.chatgpt.payments.length, 12);
for (const [index, payment] of budget.chatgpt.payments.entries()) {
    assert.equal(payment.amount, index < 4 ? 2000 : 8890);
    assert.equal(payment.plan, index < 4 ? "Plus" : "Pro 5x");
    const month = budget.months[index];
    assert.equal(payment.month, month.name);
    assert.ok(payment.date.startsWith("28 "));
    const bills = month.rows.find((row) => row.date === payment.date).details.find((detail) => detail.category === "Subscriptions / bills");
    assert.ok(bills.text.includes(`ChatGPT ${payment.plan} £${(payment.amount / 100).toFixed(2)}`));
    assert.ok(renderMonth(month).includes(`ChatGPT ${payment.plan} · £${(payment.amount / 100).toFixed(2)}`));
}
assert.equal(budget.chatgpt.total, 79120);
assert.equal(budget.chatgpt.saving, 4 * (8890 - 2000));
assert.equal(budget.months[4].rows.find((row) => row.date === "11 Jan").income, 300894);
assert.equal(budget.months[4].savings, Math.round(300894 * 0.3));
assert.equal(budget.months[7].savings, Math.round(310012 * 0.3));
const finalMonth = budget.months.at(-1);
assert.equal(finalMonth.period, "1–20 September");
assert.equal(finalMonth.rows.at(-1).date, "20 Sep");
assert.ok(finalMonth.rows.every((row) => Number(row.date.split(" ")[0]) <= 20));
assert.ok(!renderMonth(finalMonth).includes('class="billingMonth"'));

const unsafe = `<img src=x onerror="alert('x')"> &`;
const escaped = "&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt; &amp;";
const changedMonth = structuredClone(budget.months[0]);
changedMonth.name = changedMonth.period = changedMonth.context = unsafe;
changedMonth.categories[0].name = unsafe;
changedMonth.rows[0].date = unsafe;
changedMonth.rows[0].details[0].category = changedMonth.rows[0].details[0].text = unsafe;
const escapedHtml = renderMonth(changedMonth, { chatgpt: { payments: [{ month: unsafe, date: unsafe, plan: unsafe, amount: 2000 }] } });
assert.ok(!escapedHtml.includes(unsafe));
assert.equal(escapedHtml.split(escaped).length - 1, 10, "All rendered text fields must be escaped");

const page = new URL("../budget-studio/index.html", import.meta.url);
for (const [, path] of readFileSync(page, "utf8").matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (!/^(?:[a-z]+:|#|\/\/)/i.test(path)) assert.ok(existsSync(new URL(path, page)), `Missing local asset: ${path}`);
}
console.log("Budget Studio: 13 months, 122 payment dates, arithmetic, billing, escaping and local assets passed.");
