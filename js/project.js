const projectEntries = [
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
    ],
  },
  {
    date: "2026-06-01",
    title: "New project idea!",
    content: [
      {
        type: "text",
        value: "I have a new idea for a project that I think could be really cool. I'm going to start working on it soon.",
      }
    ]
  },
];

const projectContainer = document.getElementById("projectEntries");
const projectTemplate = document.getElementById("projectEntryTemplate");

const appendProjectBlock = (body, block) => {
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

if (projectContainer && projectTemplate) {
  projectEntries.forEach((entry) => {
    const projectNode = projectTemplate.content.cloneNode(true);
    const date = projectNode.querySelector(".projectEntryDate");
    const title = projectNode.querySelector(".projectEntryTitle");
    const body = projectNode.querySelector(".projectEntryBody");

    date.textContent = entry.date;
    title.textContent = entry.title;

    entry.content.forEach((block) => {
      appendProjectBlock(body, block);
    });

    projectContainer.appendChild(projectNode);
  });
}
