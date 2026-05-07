import {getActiveTabURL} from "./utils.js"

// ✅ Variable pour stocker tous les bookmarks (utile pour la recherche)
let allBookmarks = [];

const addNewBookmark = (bookmarksElement, bookmark) => {
    const newBookmarkElement = document.createElement("div");
    const bookmarkTitleElement = document.createElement("div");
    const bookmarkNoteElement = document.createElement("div"); // ✅ Note
    const controlsElement = document.createElement("div");

    bookmarkTitleElement.textContent = bookmark.desc;
    bookmarkTitleElement.className = "bookmark-title";

    bookmarkNoteElement.textContent = bookmark.note || ""; // ✅ Affiche la note
    bookmarkNoteElement.className = "bookmark-note";

    controlsElement.className = "bookmark-controls";

    newBookmarkElement.id = "bookmark-" + bookmark.time;
    newBookmarkElement.className = "bookmark";
    newBookmarkElement.setAttribute("timestamp", bookmark.time);

    setBookmarkAttributes("play", onPlay, controlsElement);
    setBookmarkAttributes("edit", onEdit, controlsElement); // ✅ Bouton edit
    setBookmarkAttributes("delete", onDelete, controlsElement);

    newBookmarkElement.appendChild(bookmarkTitleElement);
    newBookmarkElement.appendChild(bookmarkNoteElement); // ✅ Ajout note
    newBookmarkElement.appendChild(controlsElement);
    bookmarksElement.appendChild(newBookmarkElement);
};

const viewBookmarks = (currentBookmarks = [], filter = "") => {
    const bookmarksElement = document.getElementById("bookmarks");
    bookmarksElement.innerHTML = "";

    // ✅ Filtrage par mot-clé
    const filtered = filter
        ? currentBookmarks.filter(b =>
            b.desc.toLowerCase().includes(filter.toLowerCase()) ||
            (b.note && b.note.toLowerCase().includes(filter.toLowerCase()))
          )
        : currentBookmarks;

    if (filtered.length > 0) {
        for (let i = 0; i < filtered.length; i++) {
            addNewBookmark(bookmarksElement, filtered[i]);
        }
    } else {
        bookmarksElement.innerHTML = '<i class="row">No bookmarks to show</i>';
    }
};

const onPlay = async e => {
    const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
    const activeTab = await getActiveTabURL();
    chrome.tabs.sendMessage(activeTab.id, { type: "PLAY", value: bookmarkTime });
};

const onDelete = async e => {
    const activeTab = await getActiveTabURL();
    const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
    const bookmarkElementToDelete = document.getElementById("bookmark-" + bookmarkTime);

    bookmarkElementToDelete.parentNode.removeChild(bookmarkElementToDelete);

    chrome.tabs.sendMessage(activeTab.id, { type: "DELETE", value: bookmarkTime }, (updatedBookmarks) => {
        allBookmarks = updatedBookmarks;
        viewBookmarks(updatedBookmarks, document.getElementById("search").value);
    });
};

// ✅ Handler pour le bouton edit
const onEdit = async e => {
    const bookmarkElement = e.target.parentNode.parentNode;
    const bookmarkTime = bookmarkElement.getAttribute("timestamp");
    const titleElement = bookmarkElement.querySelector(".bookmark-title");
    const noteElement = bookmarkElement.querySelector(".bookmark-note");
    const controlsElement = bookmarkElement.querySelector(".bookmark-controls");

    // Remplace titre et note par des inputs
    const titleInput = document.createElement("input");
    titleInput.className = "bookmark-edit-title";
    titleInput.value = titleElement.textContent;

    const noteInput = document.createElement("textarea");
    noteInput.className = "bookmark-edit-note";
    noteInput.value = noteElement.textContent;

    bookmarkElement.replaceChild(titleInput, titleElement);
    bookmarkElement.replaceChild(noteInput, noteElement);

    // Remplace le bouton edit par un bouton save
    controlsElement.innerHTML = "";
    setBookmarkAttributes("save", async (saveEvent) => {
        const newDesc = titleInput.value.trim() || "Bookmark at " + bookmarkTime;
        const newNote = noteInput.value.trim();

        const activeTab = await getActiveTabURL();
        chrome.tabs.sendMessage(activeTab.id, {
            type: "EDIT",
            value: { time: parseFloat(bookmarkTime), desc: newDesc, note: newNote }
        }, (updatedBookmarks) => {
            allBookmarks = updatedBookmarks;
            viewBookmarks(updatedBookmarks, document.getElementById("search").value);
        });
    }, controlsElement);
};

const setBookmarkAttributes = (src, eventListener, controlParentElement) => {
    const controlElement = document.createElement("img");
    controlElement.src = "assets/" + src + ".png";
    controlElement.title = src;
    controlElement.addEventListener("click", eventListener);
    controlParentElement.appendChild(controlElement);
};

document.addEventListener("DOMContentLoaded", async () => {
    const activeTab = await getActiveTabURL();
    const queryParameters = activeTab.url.split("?")[1];
    const urlParameters = new URLSearchParams(queryParameters);
    const currentVideo = urlParameters.get("v");

    if (activeTab.url.includes("youtube.com/watch") && currentVideo) {
        chrome.storage.sync.get([currentVideo], (data) => {
            allBookmarks = data[currentVideo] ? JSON.parse(data[currentVideo]) : [];
            viewBookmarks(allBookmarks);
        });

        // ✅ Listener pour la recherche
        document.getElementById("search").addEventListener("input", (e) => {
            viewBookmarks(allBookmarks, e.target.value);
        });
    } else {
        const container = document.getElementsByClassName("container")[0];
        container.innerHTML = '<div class="title">this is not a youtube video</div>';
    }
});