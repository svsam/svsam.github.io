(function () {
    "use strict";

    var filterButtons = Array.prototype.slice.call(
        document.querySelectorAll("[data-blog-filter]")
    );
    var contentPanels = Array.prototype.slice.call(
        document.querySelectorAll("[data-blog-panel]")
    );

    function showSection(section) {
        filterButtons.forEach(function (button) {
            button.setAttribute(
                "aria-pressed",
                String(button.dataset.blogFilter === section)
            );
        });

        contentPanels.forEach(function (panel) {
            panel.hidden = panel.dataset.blogPanel !== section;
        });
    }

    filterButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            showSection(button.dataset.blogFilter);
        });
    });

    var albumCovers = Array.prototype.slice.call(
        document.querySelectorAll(".musicAlbumCover")
    );
    var albumLightbox = document.getElementById("albumLightbox");
    var albumLightboxImage = document.querySelector("[data-album-lightbox-image]");
    var albumLightboxClose = document.querySelector("[data-album-lightbox-close]");

    function closeAlbumLightbox() {
        if (!albumLightbox) {
            return;
        }

        if (typeof albumLightbox.close === "function") {
            albumLightbox.close();
        } else {
            albumLightbox.removeAttribute("open");
        }
    }

    function openAlbumLightbox(cover) {
        if (!albumLightbox || !albumLightboxImage) {
            return;
        }

        albumLightboxImage.src = cover.currentSrc || cover.src;
        albumLightboxImage.alt = cover.alt;

        if (typeof albumLightbox.showModal === "function") {
            albumLightbox.showModal();
        } else {
            albumLightbox.setAttribute("open", "");
        }
    }

    albumCovers.forEach(function (cover) {
        cover.addEventListener("click", function () {
            openAlbumLightbox(cover);
        });

        cover.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
                event.preventDefault();
                openAlbumLightbox(cover);
            }
        });
    });

    if (albumLightboxClose) {
        albumLightboxClose.addEventListener("click", closeAlbumLightbox);
    }

    if (albumLightbox) {
        albumLightbox.addEventListener("click", function (event) {
            if (event.target === albumLightbox) {
                closeAlbumLightbox();
            }
        });
    }
}());
