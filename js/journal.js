const journalEntries = [
  {
    date: "2026-03-18",
    title: "Site direction",
    content: [
      "This is the real first entry, and the first webpage for this website of mine. I'll make a real home page but for now we only have the journal :)",
      "The only issue I'll fix in the future is that when I add too many entries either the boxes will go off the screen or something else. I'll fix that in the future... yeah.",
      "",
      "I also should mention that I was really burnt out after my initial stamp on this website, hence why there is a 5 month gap between me buying the website and me actually working on the website properly... eesh, talk about making my moneys worth of this domain."
    ]
  },
  {
    date: "2025-10-30",
    title: "Bought the website",
    content: [
      "So I bought this website and this is obviously after the date of the journal entry (I wish I was that good at programming) and the actual date of this entry is 22/03/2026",
      "I wish to make this website like a home to me, like a way to escape other methods of useless stuff."
    ]
  }
];

const journalContainer = document.getElementById("journalEntries");
const journalTemplate = document.getElementById("journalEntryTemplate");

if (journalContainer && journalTemplate) {
  journalEntries.forEach((entry) => {
    const journalNode = journalTemplate.content.cloneNode(true);
    const article = journalNode.querySelector(".journalEntry");
    const date = journalNode.querySelector(".journalEntryDate");
    const title = journalNode.querySelector(".journalEntryTitle");
    const body = journalNode.querySelector(".journalEntryBody");

    date.textContent = entry.date;
    title.textContent = entry.title;

    entry.content.forEach((paragraphText) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = paragraphText;
      body.appendChild(paragraph);
    });

    journalContainer.appendChild(journalNode);
  });
}
