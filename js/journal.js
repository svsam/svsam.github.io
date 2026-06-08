const journalEntries = [
  {
    date: "2026-06-07",
    title: "Overhaul, mega progress in the past few days",
    content: [
      {
        type: "text",
        value: "Solar system website, it looks decent but every other page is like something different, but I think it might be unique compared to other website, also fits my theme of space because its my degree."
      }
    ]
  },
  {
    date: "2026-06-06",
    title: "Missed entries and update",
    content: [
      {
        type: "text",
        value: "There is a lot of thing that I've forgotten about to mention during the development. Firstly, no I have not spent another 2 weeks doing nothing with the website, I have actually been focusing on a few other things, the most important thing of all is...",
      },
      {
        type: "image",
        src: "../css/Images/mika_2.png",
        alt: "Mika, the cat",
      },
      {
        type: "text",
        value: "I HAVE A PET CAT NOW! Her name is Mika and she's only a baby. This adorable little void is the reason why it's been a while since I last updated this website and now since I have a kitten my work schedule will be a bit more lacking. This website won't be forgotten yet, but the scrapbook will be filled... with images of you know who.",
      },
      ]
  },
  {
    date: "2026-05-28",
    title: "Redesign pt. 2",
    content: [
      {
        type: "text",
        value: "The website will be redesigned again, this page won't be visible but the date is signified as when this change has happened, below will be a picture of the old design for the memories :)",
      },
      {
        type: "image",
        src: "../css/Images/floralTerminal.png",
        alt: "Floral Terminal Design"
      }
    ]
  },
  {
    date: "2026-05-27",
    title: "Exam season is over!",
    content: [
      {
        type: "text",
        value: "I am finally finished with my exams and I will slowly during the course of the next few weeks and days change this website again, I think it looks too janky and I think it deserves a redesign.",
      },
      {
        type: "text",
        value: "I'll see what I feel this website needs, though lately I have been doing a few personal projects related to my degree so maybe I'll create a new section for it. Though if you ever want to view it yourself you can always visit my github, my most recent projects will be pinned on my profile.",
      },
      {
        type: "text",
        value: "",
      },
      {
        type: "text",
        value: "This is an entry from like 3 hours later, I think im going to rework this design into something really minimalist, I think I am trying too hard to make this look pretty while also doing really intricate designs. It just doesn't feel me. So I will redo this whole section in another layout. Everything that would be here will stay the same."
      }
    ],
  },
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
        src: "../css/Images/Screenshot 2026-04-17 013544.png",
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
