(() => {
    let youtubeLeftControls, youtubePlayer; //Access of the Youtube Controls and Player
    let currentVideo = "";
    let currentVideoBookmarks = [];

    chrome.runtime.onMessage.addListener((obj, sender, response) => {
        const { type, value, videoId } = obj;

        if (type === "NEW") { // New video Id
            currentVideo = videoId; // Make here the video
            newVideoLoaded(); // We load the new video
        } else if (type === "PLAY") {
            youtubePlayer.currentTime = value;
        } else if (type === "DELETE") {
            currentVideoBookmarks = currentVideoBookmarks.filter((b) => b.time != value);
            chrome.storage.sync.set({[currentVideo]: JSON.stringify(currentVideoBookmarks)});

            response(currentVideoBookmarks);
        } else if (type === "EDIT") {
            currentVideoBookmarks = currentVideoBookmarks.map(b => {
                if (b.time == value.time) {
                    return { ...b, desc: value.desc, note: value.note };
                }
            return b;
            });
        chrome.storage.sync.set({ [currentVideo]: JSON.stringify(currentVideoBookmarks) });
        response(currentVideoBookmarks);
        }
    });

    const fetchBookmarks = () => {
        return new Promise((resolve) =>{
            chrome.storage.sync.get([currentVideo], (obj) => {
                resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]): []);
            } )
        }) 

        
    }
    const newVideoLoaded = async () => {
        const bookmarkBtnExists = document.getElementsByClassName("bookmark-btn")[0];
        currentVideoBookmarks = await fetchBookmarks();
        console.log(bookmarkBtnExists);

        if (!bookmarkBtnExists) {
            const bookmarkBtn = document.createElement("img");

            bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png");
            bookmarkBtn.className = "ytp-button " + "bookmark-btn";
            bookmarkBtn.title = "Click to bookmark current timestamp";

            youtubeLeftControls = document.getElementsByClassName("ytp-left-controls")[0];
            youtubePlayer = document.getElementsByClassName("video-stream")[0];
            
            youtubeLeftControls.appendChild(bookmarkBtn);
            bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);
        }
    }

    const addNewBookmarkEventHandler = async () => {
        const currentTime = youtubePlayer.currentTime;
        const newBookmark = {
            time: currentTime,
            desc: "the Bookmark at " + getTime(currentTime),
        };
       

        currentVideoBookmarks = await fetchBookmarks();

        chrome.storage.sync.set({
            [currentVideo]: JSON.stringify([...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time))
        });

        currentVideoBookmarks = [...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time);
        
    }

    newVideoLoaded();
})();

const getTime = t => {
    var date = new Date(0);
    date.setSeconds(t);

    return date.toISOString().slice(11,19);
}
