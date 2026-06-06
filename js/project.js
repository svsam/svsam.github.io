const projectEntries = [
  {
    date: "May 2026",
    title: "H-R Diagram from the ESA Gaia Archive DR3 data release ",
    content: [
      {
        type: "text",
        value: "This is one the first personal projects I did ever since starting the summer holidays, I made it using Python and plotted using matplotlib for python, additionally the data collected was 1 million stars which was queried using ADQL (Astronomical Data Query Language) which is similar to SQL."
        },
      {
        type: "text",
        value: "Below is the finished project image of the million stars made into a diagram similar to a H-R diagram, if compared to a graph which is typically seen online, there is usually a lack of white dwarfs this is mainly due to the amount of stars in the universe that we have detected so far to not have as many relative to regular stars in the main sequence/giant stars."
        },
      {
        type: "image",
        src: "../css/Images/hrdiagram.png"
      }
    ],
  },
  {
    date: "May 2026",
    title: "New project idea!",
    content: [
      {
        type: "text",
        value: "Cogito Ergo Sum, I THINK THEREFORE I AM!",
      }
    ]
  },
  {
    date: "February 2026",
    title: "Another project idea!",
    content: [
      {
        type: "text",
        value: "Let's see how this one turns out!",
      }
    ]
  },
  {
    date: "February 2026",
    title: "Another project idea!",
    content: [
      {
        type: "text",
        value: "Let's see how this one turns out!",
      }
    ]
  },
  {
    date: "February 2026",
    title: "Another project idea!",
    content: [
      {
        type: "text",
        value: "Let's see how this one turns out!",
      }
    ]
  },
  {
    date: "February 2026",
    title: "Another project idea!",
    content: [
      {
        type: "text",
        value: "Let's see how this one turns out!",
      }
    ]
  }
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
    image.className = "journalImage projectImage";
    body.appendChild(image);
  }
};

if (projectContainer && projectTemplate) {
  projectEntries.forEach((entry, index) => {
    const projectNode = projectTemplate.content.cloneNode(true);
    const number = projectNode.querySelector(".projectEntryNumber");
    const date = projectNode.querySelector(".projectEntryDate");
    const title = projectNode.querySelector(".projectEntryTitle");
    const body = projectNode.querySelector(".projectEntryBody");

    if (number) {
      number.textContent = `No. ${String(index + 1).padStart(2, "0")}`;
    }

    date.textContent = entry.date;
    title.textContent = entry.title;

    entry.content.forEach((block) => {
      appendProjectBlock(body, block);
    });

    projectContainer.appendChild(projectNode);
  });
}
