const projectsEntries = document.querySelector("#projectsEntries");

if (projectsEntries) {
    const projects = Array.from(projectsEntries.querySelectorAll(".projectsEntry"));
    const expandButton = document.querySelector('[data-projects-action="expand"]');
    const collapseButton = document.querySelector('[data-projects-action="collapse"]');

    const updateControls = () => {
        const openProjects = projects.filter((project) => project.open).length;

        expandButton.disabled = openProjects === projects.length;
        collapseButton.disabled = openProjects === 0;
    };

    expandButton.addEventListener("click", () => {
        projects.forEach((project) => {
            project.open = true;
        });
        updateControls();
    });

    collapseButton.addEventListener("click", () => {
        projects.forEach((project) => {
            project.open = false;
        });
        updateControls();
    });

    projects.forEach((project) => {
        project.addEventListener("toggle", updateControls);
    });

    updateControls();
}
