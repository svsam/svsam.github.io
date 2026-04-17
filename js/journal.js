const journalEntries = [
  {
    date: "2026-04-17",
    title: "Redesign!!!!1",
    content: [
      {
        type: "text",
        value: "It seems I like to work on this website at the exclusive time of midnight...",
      },
      {
        type: "text",
        value:
          "I went with a vapour wave style, similar to the album Floral Shoppe by Macintosh Plus. Really good album. You should listen to it.",
      },
      {
        type: "image",
        src: "css/Images/Screenshot 2026-04-17 013544.png",
        alt: "Older version of the website",
      },
      {
        type: "text",
        value:
          "Well here's an old screenshot for the memories. It looked nice, but compared to this it's nothing in comparison.",
      },
    ],
  },
  {
    date: "2026-03-18",
    title: "Site direction",
    content: [
      {
        type: "text",
        value:
          "This is the real first entry, and the first webpage for this website of mine. I'll make a real home page but for now we only have the journal :)",
      },
      {
        type: "text",
        value:
          "The only issue I'll fix in the future is that when I add too many entries either the boxes will go off the screen or something else. I'll fix that in the future... yeah.",
      },
      {
        type: "text",
        value: "",
      },
      {
        type: "text",
        value:
          "I also should mention that I was really burnt out after my initial stamp on this website, hence why there is a 5 month gap between me buying the website and me actually working on the website properly... eesh, talk about making my money's worth of this domain.",
      },
    ],
  },
  {
    date: "2025-10-30",
    title: "Bought the website",
    content: [
      {
        type: "text",
        value:
          "So I bought this website and this is obviously after the date of the journal entry (I wish I was that good at programming) and the actual date of this entry is 22/03/2026.",
      },
      {
        type: "text",
        value:
          "I wish to make this website like a home to me, like a way to escape other methods of useless stuff.",
      },
    ],
  },
];

const journalContainer = document.getElementById("journalEntries");
const journalTemplate = document.getElementById("journalEntryTemplate");

const appendJournalBlock = (body, block) => {
  if (typeof block === "string" || block?.type === "text") {
    const paragraph = document.createElement("p");
    paragraph.textContent = typeof block === "string" ? block : block.value || "";
    body.appendChild(paragraph);
    return;
  }

  if (block?.type === "image" && block.src) {
    const image = document.createElement("img");
    image.src = block.src;
    image.alt = block.alt || "";
    image.className = "journalImage";
    body.appendChild(image);
  }
};

if (journalContainer && journalTemplate) {
  journalEntries.forEach((entry) => {
    const journalNode = journalTemplate.content.cloneNode(true);
    const date = journalNode.querySelector(".journalEntryDate");
    const title = journalNode.querySelector(".journalEntryTitle");
    const body = journalNode.querySelector(".journalEntryBody");

    date.textContent = entry.date;
    title.textContent = entry.title;

    entry.content.forEach((block) => {
      appendJournalBlock(body, block);
    });

    journalContainer.appendChild(journalNode);
  });
}
