const projectEntries = [
  {
    date: "Pending",
    title: "RAG (Retrieval Augmented Generation) AI (Python)",
    url: "https://github.com/svsam",
    content: [
      {
        type: "text",
        value: "My second time delving into an artificial intelligence program, first was the minesweeper algorithm, this was is a lot more complex and requires a bit more computer power to generate. If there was a goal with this AI is would be similar to Pewdiepies odysseus AI chatbot which works directly on your local computer but that will be a project for my future self, for now I am going to make a basic AI with minimal token usage and varying depth. Subject to change but be aware!",
      }
    ]
  },
  {
    date: "Pending",
    title: "C++ Tetris",
    url: "https://github.com/svsam",
    content: [
      {
        type: "text",
        value: "Currently in development, a part of my learning process to learn C++, after this tetris game it will be a 3D voxel game where I will start to tinker with the idea of using 3D models to made planetary systems.",
      }
    ]
  },
  {
    date: "May 2026",
    title: "H-R Diagram from the ESA Gaia Archive DR3 data release ",
    url: "https://github.com/svsam/H-R-Diagram",
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
    date: "May 2026 (Still in development)",
    title: "Exoplanet orbital temperatures and modelling eccentricity using training data",
    url: "https://github.com/svsam/Exoplanet-orbital-temperatures-and-modelling-eccentricity-using-training-data",
    content: [
      {
        type: "text",
        value: "An algorithm using NASA exoplanet archive data and how exoplanets orbit their host stars and a predicted variness in orbital positions. This isn't an accurate depiction of their orbits, if you were to apply the same logical rules onto earth they would be different to the real eccentricity of the Earth, this is due to the various factors and events that made the Earth the planet it is today, most notably before it was the 'Earth' it was a protoplanet that had a collision with another protoplanet which is theorised to have created the moon, this event would have changed the eccentricity of the Earth and thus the algorithm would not be able to predict the eccentricity of the Earth accurately."
        },
      {
        type: "text",
        value: "The temperatures of the planets are calculated using the Stefan-Boltzmann law which is a physical law that describes the power radiated from a black body in terms of its temperature. The formula is given by: P = σ * A * T^4, where P is the total power radiated, σ is the Stefan-Boltzmann constant, A is the surface area of the black body, and T is the absolute temperature of the black body. In this project, I use this formula to calculate the equilibrium temperature of exoplanets based on their distance from their host star and the luminosity of the star."
      } 
    ]
  },
  {
    date: "February 2026",
    title: "Black Hole Model (Jupyter Notebook)",
    url: "https://github.com/svsam/Black-Hole-simulations",
    content: [
      {
        type: "text",
        value: "Testing how light works using two methods of physics interpretations, Newtonian and Gravitational Lensing, as black holes break physics at the smallest and most complex levels, the way light works is different. The Newtonian method is traditional methods using newtonian mechanics and the gravitational lensing method is using the bending of light around a massive object to determine how light would work around a black hole. The results are quite interesting as the gravitational lensing method shows that light can actually escape the black hole and thus we can see the light that is emitted from the accretion disk around the black hole, this is something that is not possible with the newtonian method as it does not take into account the bending of light around the black hole.",
      },
      {
        type: "text",
        value: "The equations for each method are as follows: For the Newtonian method, the equation is given by: F = G * (m1 * m2) / r^2, where F is the force of gravity, G is the gravitational constant, m1 and m2 are the masses of the two objects, and r is the distance between the two objects. For the gravitational lensing method, the equation is given by: θ = (4 * G * M) / (c^2 * b), where θ is the deflection angle of light, G is the gravitational constant, M is the mass of the black hole, c is the speed of light, and b is the impact parameter (the closest distance between the light ray and the black hole)."
      }
    ]
  },
  {
    date: "April 2025",
    title: "Minesweeper Algorithm (Python)",
    url: "https://github.com/svsam/Minesweeper-Calculator",
    content: [
      {
        type: "text",
        value: "First AI project, it uses an iterative technique on each unrevealed cell and calculates the probability of there being a mine on that cell based on the number of mines left and the number of unrevealed cells, it then selects the cell with the lowest probability of being a mine and reveals it, this process is repeated until all cells are revealed or a mine is hit. There are cases where it is impossible to mathmateically determine which cell is a mine and which cell is not, in these cases the algorithm will select a random cell from the remaining unrevealed cells and reveal it, this is not an optimal solution but it is a scenario that needs to be considered. More complicated techniques have been taught to the AI, such as common patterns to quickly identify mines and safe cells. Using heuristics and probability to solve the minesweeper game.",
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
    image.loading = "lazy";
    image.decoding = "async";
    body.appendChild(image);
  }
};

if (projectContainer && projectTemplate) {
  projectEntries.forEach((entry, index) => {
    const projectNode = projectTemplate.content.cloneNode(true);
    const number = projectNode.querySelector(".projectEntryNumber");
    const date = projectNode.querySelector(".projectEntryDate");
    const titleLink = projectNode.querySelector(".projectEntryTitleLink");
    const body = projectNode.querySelector(".projectEntryBody");

    if (number) {
      number.textContent = `No. ${String(index + 1).padStart(2, "0")}`;
    }

    date.textContent = entry.date;
    titleLink.textContent = entry.title;
    titleLink.href = entry.url;
    titleLink.target = "_blank";
    titleLink.rel = "noopener noreferrer";

    entry.content.forEach((block) => {
      appendProjectBlock(body, block);
    });

    projectContainer.appendChild(projectNode);
  });
}
